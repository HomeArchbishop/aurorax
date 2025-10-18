import type { Trigger } from '../interface'
import type { Pipeline } from '@/internal/pipelines'
import type { CronEvent } from '@/interfaces/cron'
import { scheduleJob, type Spec } from '@/internal/cron'
import { logger } from '@/internal/logger'
import { uid } from '@/internal/utils/misc'

export class CronTrigger implements Trigger<CronEvent> {
  #started = false

  #pipelineGroups: Array<{
    pipeline: Pipeline<CronEvent>
    condition (event: CronEvent): boolean
  }> = []

  #specs = new Set<Spec>()

  connect (pipeline: Pipeline<CronEvent>, branchSpec: string): void {
    if (this.#started) {
      throw new Error('cron trigger is already started, cannot connect more pipelines')
    }
    // adapt the spec
    this.#specs.add(branchSpec)
    // adapt the pipeline
    this.#pipelineGroups.push({
      pipeline,
      condition: (event: CronEvent) => event.spec === branchSpec,
    })
  }

  start (): void {
    if (this.#started) {
      throw new Error('cron trigger is already started')
    }
    this.#started = true
    this.#specs.forEach(spec => {
      logger.debug(`cron trigger using spec: ${spec} for triggering pipelines`)
      scheduleJob(spec, async () => {
        const event: CronEvent = {
          spec,
          timestamp: Date.now(),
        }
        this.#pipelineGroups.forEach(({ pipeline, condition }) => {
          if (!condition(event)) { return }
          const meta = { hash: uid() }
          pipeline.execute(event, meta)
        })
      })
    })
    logger.debug('cron trigger started')
  }
}
