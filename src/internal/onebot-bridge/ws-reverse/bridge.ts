import { WebSocket, WebSocketServer } from 'ws'
import { logger } from '@/internal/logger'
import type { OnebotEvent, ApiResponseStatus } from '@/interfaces/onebot'
import type { CtxSend, OnebotBridge, OnebotBridgeConfig, OnebotBridgeConstructor, OnebotApiResCallback } from '../interface'
import type {
  ConnectedEvent,
  DisconnectedEvent,
  ReconnectingEvent,
} from '@/interfaces/facade'
import { OnebotApiCallbackHub } from '../onebot-api-callback-hub'
import { handleRawWsMessage } from '../share'
import EventEmitter from 'events'

export const WsReverseOnebotBridge: OnebotBridgeConstructor<'ws-reverse'> =
class WsReverseOnebotBridge extends EventEmitter implements OnebotBridge {
  #config: OnebotBridgeConfig<'ws-reverse'>
  #wss?: WebSocketServer
  #ws?: WebSocket
  #onebotApiCallbackHub = new OnebotApiCallbackHub()
  #manualClose = false
  #everConnected = false
  #reconnectAttempt = 0
  #pendingConnect?: {
    resolve: (value: void | PromiseLike<void>) => void
    reject: (reason?: unknown) => void
  }

  constructor (config: OnebotBridgeConfig<'ws-reverse'>) {
    super()
    this.#config = config
  }

  addOnebotEventListener (listener: (event: OnebotEvent) => void): void {
    this.on('onebot-event', listener)
  }

  send: CtxSend = (req, resOkCb, resFailedCb) => {
    if (!this.#ws || this.#ws.readyState !== WebSocket.OPEN) {
      throw new Error('The connection (ws-reverse) is not established or is reconnecting')
    }
    const echo = Math.random().toString(36).slice(2, 10)
    const echoReq = { ...req, echo }
    const raw = JSON.stringify(echoReq)
    this.#onebotApiCallbackHub.use(
      echo,
      resOkCb as OnebotApiResCallback<ApiResponseStatus.OK>,
      resFailedCb as OnebotApiResCallback<ApiResponseStatus.FAILED>,
    )
    logger.debug(`ws-reverse sending with echo:${echo}: ` + raw)
    logger.silly(`ws-reverse sending with echo:${echo}: ` + JSON.stringify(echoReq, null, 2))
    this.#ws.send.bind(this.#ws)(raw)
    logger.debug(`ws-reverse sent with echo:${echo}`)
  }

  async establishConnectionToOnebot (): Promise<void> {
    this.#manualClose = false
    this.#reconnectAttempt = 0
    try {
      await this.#ensureServer()
      await this.#waitForClient()
    } catch (err) {
      this.closeConnectionToOnebot()
      throw err
    }
  }

  closeConnectionToOnebot (): void {
    this.#manualClose = true
    this.#reconnectAttempt = 0
    this.#everConnected = false
    this.#rejectPending(new Error('The connection (ws-reverse) was closed'))
    this.#teardownClient()
    this.#teardownServer()
  }

  #parseListenTarget () {
    const u = new URL(this.#config.url)
    const host = u.hostname || '0.0.0.0'
    const port = u.port
      ? Number(u.port)
      : (u.protocol === 'wss:' ? 443 : 80)
    const path = u.pathname || '/'
    return { host, port, path }
  }

  async #ensureServer (): Promise<void> {
    if (this.#wss) return
    const { host, port, path } = this.#parseListenTarget()
    const token = this.#config.token
    const wss = new WebSocketServer({
      host,
      port,
      path,
      verifyClient: (info, done) => {
        if (!token) {
          done(true)
          return
        }
        done(info.req.headers.authorization === `Bearer ${token}`)
      },
    })
    this.#wss = wss
    wss.on('connection', (ws) => {
      this.#onConnection(ws)
    })

    await new Promise<void>((resolve, reject) => {
      const onListening = () => {
        wss.off('error', onError)
        resolve()
      }
      const onError = (err: Error) => {
        wss.off('listening', onListening)
        this.#wss = undefined
        reject(err)
      }
      wss.once('listening', onListening)
      wss.once('error', onError)
    })

    logger.debug(`ws-reverse listening on ws://${host}:${port}${path}`)
  }

  #waitForClient (): Promise<void> {
    if (this.#ws && this.#ws.readyState === WebSocket.OPEN) {
      return Promise.resolve()
    }
    const { resolve, reject, promise } = Promise.withResolvers<void>()
    this.#pendingConnect = { resolve, reject }
    logger.debug('ws-reverse waiting for OneBot client (no timeout)')
    return promise
  }

  #onConnection (ws: WebSocket): void {
    if (this.#manualClose) {
      ws.close()
      return
    }
    if (this.#ws && this.#ws.readyState === WebSocket.OPEN) {
      logger.warn('ws-reverse rejecting extra connection (keep existing)')
      ws.close()
      return
    }

    const reconnected = this.#everConnected
    this.#everConnected = true
    this.#reconnectAttempt = 0
    this.#ws = ws
    this.#attachClient(ws)

    logger.debug('ws-reverse onebot connected')
    this.emit('connected', { reconnected } satisfies ConnectedEvent)

    const pending = this.#pendingConnect
    if (pending) {
      this.#pendingConnect = undefined
      pending.resolve()
    }
  }

  #attachClient (ws: WebSocket): void {
    ws.on('message', (data) => {
      handleRawWsMessage(data, this.#onebotApiCallbackHub, (event) => {
        this.emit('onebot-event', event)
      })
    })

    ws.on('error', (err) => {
      logger.error('ws-reverse client error: ' + err.message)
    })

    ws.on('close', () => {
      if (this.#ws !== undefined && this.#ws !== ws) return
      this.#ws = undefined
      this.#onebotApiCallbackHub.clear()
      logger.warn('ws-reverse onebot closed')
      if (this.#manualClose) {
        this.emit('disconnected', { manual: true } satisfies DisconnectedEvent)
        return
      }
      this.#reconnectAttempt++
      logger.warn(`ws-reverse waiting for reconnect (attempt ${this.#reconnectAttempt})`)
      this.emit('reconnecting', {
        attempt: this.#reconnectAttempt,
        delayMs: 0,
      } satisfies ReconnectingEvent)
    })
  }

  #teardownClient (): void {
    this.#onebotApiCallbackHub.clear()
    const ws = this.#ws
    if (!ws) return
    this.#ws = undefined
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close()
    } else {
      ws.removeAllListeners()
    }
  }

  #teardownServer (): void {
    const wss = this.#wss
    if (!wss) return
    this.#wss = undefined
    wss.close()
  }

  #rejectPending (err: Error): void {
    const pending = this.#pendingConnect
    if (!pending) return
    this.#pendingConnect = undefined
    pending.reject(err)
  }
}
