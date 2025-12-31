import { logger } from '@/internal/logger'
import type { Trigger } from '../interface'
import type { OnebotEvent } from '@/interfaces/onebot'
import type { OnebotBridge } from '@/internal/onebot-bridge'
import type { Pipeline } from '@/internal/pipelines'
import { queueUntil } from '@/internal/utils/functional'
import { uid } from '@/internal/utils/misc'

interface OnebotTriggerOptions {
  onebotBridge: OnebotBridge
}

export class OnebotTrigger implements Trigger<OnebotEvent> {
  #started = false

  #pipelineGroups: Array<{
    pipeline: Pipeline<OnebotEvent>
  }> = []

  #onebotBridge: OnebotBridge

  constructor ({ onebotBridge }: OnebotTriggerOptions) {
    this.#onebotBridge = onebotBridge
  }

  connect (pipeline: Pipeline<OnebotEvent>): void {
    if (this.#started) {
      throw new Error('onebot trigger is already started, cannot connect more pipelines')
    }
    this.#pipelineGroups.push({ pipeline })

    this.#onebotBridge.addOnebotEventListener(queueUntil(
      () => this.#started,
      event => {
        const meta = { hash: uid() }
        pipeline.execute(event, meta)
      }),
    )
  }

  start (): void {
    if (this.#started) {
      throw new Error('onebot trigger is already started')
    }
    this.#started = true
    logger.debug('onebot trigger started')
  }
}
