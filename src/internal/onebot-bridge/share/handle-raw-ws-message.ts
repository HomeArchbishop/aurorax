import { logger } from '@/internal/logger'
import type { OnebotEvent, ApiResponse } from '@/interfaces/onebot'
import type { OnebotApiCallbackHub } from '../onebot-api-callback-hub'

export function handleRawWsMessage (
  rawData: unknown,
  hub: OnebotApiCallbackHub,
  emitEvent: (event: OnebotEvent) => void,
): void {
  const hash = Math.random().toString(36).slice(2, 10)
  const raw = String(rawData)
  logger.debug(`ws received ws_msg#${hash}: ` + raw)
  let parsed: OnebotEvent | ApiResponse
  try {
    parsed = JSON.parse(raw) as OnebotEvent | ApiResponse
  } catch (err) {
    logger.error(`ws_msg#${hash} failed to parse: ` + (err as Error).message)
    return
  }
  logger.silly(`parsed ws_msg#${hash}: ` + JSON.stringify(parsed, null, 2))
  if (Object.prototype.hasOwnProperty.call(parsed, 'status')) {
    logger.debug(`ws_msg#${hash} is an ApiResponse, calling callback (if any)`)
    const res = parsed as ApiResponse
    hub.trigger(res.echo, res)
    return
  }
  emitEvent(parsed as OnebotEvent)
}
