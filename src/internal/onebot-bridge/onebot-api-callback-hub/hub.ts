import type { OnebotApiResCallback } from '../interface'
import type { ApiResponseStatus, ApiResponse } from '@/interfaces/onebot'

export class OnebotApiCallbackHub {
  #apiResCallbacks = new Map<
    string,
    [
      OnebotApiResCallback<ApiResponseStatus.OK>,
      OnebotApiResCallback<ApiResponseStatus.FAILED>,
    ]
  >()

  use (
    echo: string,
    okCb: OnebotApiResCallback<ApiResponseStatus.OK>,
    failedCb: OnebotApiResCallback<ApiResponseStatus.FAILED>,
  ): void {
    this.#apiResCallbacks.set(echo, [okCb, failedCb])
  }

  delete (echo: string): void {
    this.#apiResCallbacks.delete(echo)
  }

  trigger (echo: string, res: ApiResponse): void {
    const [okCb, failedCb] = this.#apiResCallbacks.get(echo) ?? []
    this.#apiResCallbacks.delete(echo)
    if (okCb !== undefined && res.status === 'ok') {
      okCb(res as ApiResponse<ApiResponseStatus.OK>)
    }
    if (failedCb !== undefined && res.status === 'failed') {
      failedCb(res as ApiResponse<ApiResponseStatus.FAILED>)
    }
  }
}
