import type { OnebotEvent } from '@/interfaces/onebot'
import type { EventMeta, Pipeable, Pipeline } from '../interface'
import type { Context, Middleware } from '@/interfaces/facade'
import type { OnebotBridge } from '@/internal/onebot-bridge'
import { logger } from '@/internal/logger'
import { disposablize } from '@/internal/utils/functional'

interface MiddlewarePipelineOptions {
  onebotBridge: OnebotBridge
  meta: {
    name: string
    index: number
  }
}

export class MiddlewarePipeline implements Pipeline<OnebotEvent>, Pipeable<OnebotEvent> {
  #middleware: Middleware
  #onebotBridge: OnebotBridge
  #meta: MiddlewarePipelineOptions['meta']

  #nextPipeline?: MiddlewarePipeline

  constructor (mw: Middleware, { onebotBridge, meta }: MiddlewarePipelineOptions) {
    this.#middleware = mw
    this.#onebotBridge = onebotBridge
    this.#meta = meta
  }

  pipeTo (pipeline: MiddlewarePipeline): void {
    this.#nextPipeline = pipeline
  }

  async execute (event: OnebotEvent, meta: EventMeta): Promise<void> {
    const identifier = `middleware#${this.#meta.index}\`${this.#meta.name}\` for onebot_event#${meta.hash}`
    const ctx: Context<OnebotEvent> = {
      send: this.#onebotBridge.send,
      event,
    }
    const next = disposablize(async () => { await this.#nextPipeline?.execute(event, meta) })
    try {
      logger.debug(`${identifier} start`)
      await this.#middleware(ctx, next)
      logger.debug(`${identifier} end`)
    } catch (err: any) {
      logger.error(`${identifier} error: ${err.message}`)
      if (err instanceof Error) {
        logger.error(err.stack)
      }
    }
  }
}
