import { WebSocket } from 'ws'
import { logger } from '@/internal/logger'
import type { OnebotEvent, ApiResponseStatus } from '@/interfaces/onebot'
import type { CtxSend, OnebotBridge, OnebotBridgeConfig, OnebotBridgeConstructor, OnebotApiResCallback } from '../interface'
import type {
  ConnectedEvent,
  ConnectionLostEvent,
  DisconnectedEvent,
  ReconnectingEvent,
} from '@/interfaces/facade'
import { OnebotApiCallbackHub } from '../onebot-api-callback-hub'
import { handleRawWsMessage } from '../share'
import EventEmitter from 'events'

export const WsOnebotBridge: OnebotBridgeConstructor<'ws'> =
class WsOnebotBridge extends EventEmitter implements OnebotBridge {
  #config: OnebotBridgeConfig<'ws'>
  #ws?: WebSocket
  #onebotApiCallbackHub = new OnebotApiCallbackHub()
  #reconnectTimer?: ReturnType<typeof setTimeout>
  #reconnectAttempts = 0
  #manualClose = false
  #pendingConnect?: {
    resolve: (value: void | PromiseLike<void>) => void
    reject: (reason?: unknown) => void
  }

  constructor (config: OnebotBridgeConfig<'ws'>) {
    super()
    this.#config = config
  }

  addOnebotEventListener (listener: (event: OnebotEvent) => void): void {
    this.on('onebot-event', listener)
  }

  send: CtxSend = (req, resOkCb, resFailedCb) => {
    if (!this.#ws || this.#ws.readyState !== WebSocket.OPEN) {
      throw new Error('The connection (ws) is not established or is reconnecting')
    }
    const echo = Math.random().toString(36).slice(2, 10)
    const echoReq = { ...req, echo }
    const raw = JSON.stringify(echoReq)
    this.#onebotApiCallbackHub.use(
      echo,
      resOkCb as OnebotApiResCallback<ApiResponseStatus.OK>,
      resFailedCb as OnebotApiResCallback<ApiResponseStatus.FAILED>,
    )
    logger.debug(`ws sending with echo:${echo}: ` + raw)
    logger.silly(`ws sending with echo:${echo}: ` + JSON.stringify(echoReq, null, 2))
    this.#ws.send.bind(this.#ws)(raw)
    logger.debug(`ws sent with echo:${echo}`)
  }

  async establishConnectionToOnebot (): Promise<void> {
    this.#manualClose = false
    this.#clearReconnectTimer()
    try {
      await this.#connect()
    } catch (err) {
      this.closeConnectionToOnebot()
      throw err
    }
  }

  closeConnectionToOnebot (): void {
    this.#manualClose = true
    this.#clearReconnectTimer()
    this.#reconnectAttempts = 0
    this.#teardownWs()
  }

  async #connect (): Promise<void> {
    this.#teardownWs()

    const { resolve, reject, promise } = Promise.withResolvers<void>()
    this.#pendingConnect = { resolve, reject }
    const timeout = this.#config.timeout ?? 8000

    const ws = new WebSocket(this.#config.url, {
      timeout,
      headers: {
        Authorization: this.#config.token ? `Bearer ${this.#config.token}` : '',
      },
    })
    this.#ws = ws

    ws.addEventListener('open', () => {
      const reconnected = this.#reconnectAttempts > 0
      this.#pendingConnect = undefined
      this.#reconnectAttempts = 0
      logger.debug('ws to onebot connected')
      this.emit('connected', { reconnected } satisfies ConnectedEvent)
      resolve()
    })

    ws.addEventListener('error', (err) => {
      this.#pendingConnect = undefined
      logger.error('ws to onebot error: ' + err.message)
      reject(new Error('WebSocket error: ' + err.message))
    })

    ws.addEventListener('close', () => {
      // Superseded by a newer socket (reconnect replace).
      if (this.#ws !== undefined && this.#ws !== ws) return
      this.#ws = undefined
      this.#onebotApiCallbackHub.clear()
      logger.warn('ws to onebot closed')
      // Temporary drop → `reconnecting` only; `disconnected` is terminal.
      if (this.#manualClose) {
        this.emit('disconnected', { manual: true } satisfies DisconnectedEvent)
        return
      }
      this.#scheduleReconnect()
    })

    ws.addEventListener('message', ({ data: wsMsgData }) => {
      handleRawWsMessage(wsMsgData, this.#onebotApiCallbackHub, (event) => {
        this.emit('onebot-event', event)
      })
    })

    return promise
  }

  #teardownWs (): void {
    if (this.#pendingConnect) {
      this.#pendingConnect.reject(new Error('The connection (ws) was closed'))
      this.#pendingConnect = undefined
    }
    this.#onebotApiCallbackHub.clear()
    const ws = this.#ws
    if (!ws) return
    this.#ws = undefined
    // Keep listeners so `close` can emit lifecycle `disconnected`.
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close()
    } else {
      ws.removeAllListeners()
    }
  }

  #clearReconnectTimer (): void {
    if (this.#reconnectTimer === undefined) return
    clearTimeout(this.#reconnectTimer)
    this.#reconnectTimer = undefined
  }

  #scheduleReconnect (): void {
    this.#clearReconnectTimer()
    const maxAttempts = this.#config.reconnect?.maxAttempts ?? 3
    const retryIntervalMs = this.#config.reconnect?.retryIntervalMs ?? 3000
    if (this.#reconnectAttempts >= maxAttempts) {
      logger.error(`ws to onebot reconnect exhausted after ${this.#reconnectAttempts} attempts`)
      this.#manualClose = true
      this.emit('disconnected', { manual: false } satisfies DisconnectedEvent)
      this.emit('connection-lost', { attempts: this.#reconnectAttempts } satisfies ConnectionLostEvent)
      return
    }
    this.#reconnectAttempts++
    const delay = retryIntervalMs * Math.pow(2, Math.min(this.#reconnectAttempts - 1, 5))
    logger.warn(`ws to onebot reconnecting in ${delay}ms (attempt ${this.#reconnectAttempts})`)
    this.emit('reconnecting', { attempt: this.#reconnectAttempts, delayMs: delay } satisfies ReconnectingEvent)
    this.#reconnectTimer = setTimeout(() => {
      this.#reconnectTimer = undefined
      this.#connect().catch(err => logger.error('ws reconnect failed: ' + err.message))
    }, delay)
  }
}
