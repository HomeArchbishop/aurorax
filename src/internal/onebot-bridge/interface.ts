import type { ApiResponseStatus, ApiActionName, ApiResponse, ApiRequest, OnebotEvent } from '@/interfaces/onebot'
import type EventEmitter from 'events'

export type OnebotBridgeType = 'ws-reverse'

export type OnebotApiResCallback<
  S extends ApiResponseStatus = ApiResponseStatus, T extends ApiActionName = ApiActionName,
> = (res: Omit<ApiResponse<S, T>, 'echo'>) => void

export type CtxSend = <T extends ApiActionName>(
  req: Omit<ApiRequest<T>, 'echo'>,
  onSuccess?: OnebotApiResCallback<ApiResponseStatus.OK, T>,
  onFailure?: OnebotApiResCallback<ApiResponseStatus.FAILED, T>
) => void

export interface OnebotBridgeConfig<BridgeType extends OnebotBridgeType> {
  type: BridgeType
  url: string
  token?: string
  timeout?: number
  reconnect: {
    maxAttempts: number
    retryIntervalMs: number
  }
}

export interface OnebotBridgeConstructor {
  new (config: OnebotBridgeConfig<OnebotBridgeType>): OnebotBridge
}

export interface OnebotBridge extends EventEmitter {
  /**
   * Add an event listener for the onebot.
   * Dynamically add the listener to the onebot bridge.
   */
  addOnebotEventListener (listener: (event: OnebotEvent) => void): void

  /**
   * Send the request to the onebot
   * This is the method exposed to the public
   */
  send: CtxSend

  /**
   * Establish the connection to the Onebot
   */
  establishConnectionToOnebot (): Promise<void>
}
