import type { CronEvent } from '@/interfaces/cron'
import type { Context, Job } from '@/interfaces/facade'
import type { EventMeta, Pipeline } from '../interface'
import { logger } from '@/internal/logger'
import type { OnebotBridge } from '@/internal/onebot-bridge'

interface JobPipelineOptions {
  onebotBridge: OnebotBridge
  meta: {
    name: string
    index: number
  }
}

export class JobPipeline implements Pipeline<CronEvent> {
  #job: Job
  #onebotBridge: OnebotBridge
  #meta: JobPipelineOptions['meta']

  constructor (job: Job, { onebotBridge, meta }: JobPipelineOptions) {
    this.#onebotBridge = onebotBridge
    this.#meta = meta
    this.#job = job
  }

  async execute (event: CronEvent, meta: EventMeta): Promise<void> {
    const identifier = `job#${this.#meta.index}\`${this.#meta.name}\` for cron_event#${meta.hash} with spec:"${event.spec}"`
    const ctx: Readonly<Context<CronEvent>> = {
      send: this.#onebotBridge.send,
      event,
    }
    try {
      logger.debug(`${identifier} executed`)
      await this.#job(ctx)
      logger.debug(`${identifier} finished`)
    } catch (err: unknown) {
      if (err instanceof Error) {
        logger.error(`${identifier} error: ` + err.message)
        logger.error(err.stack)
      } else {
        logger.error(`${identifier} error: ${err}`)
      }
    }
  }
}
