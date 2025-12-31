import type { Trigger } from '../interface'
import type { WebhookEvent } from '@/interfaces/webhook'
import type { WebhookServer } from '@/internal/webhook-server'
import type { Pipeline } from '@/internal/pipelines'
import { uid } from '@/internal/utils/misc'
import { logger } from '@/internal/logger'

interface WebhookTriggerOptions {
  webhookServer: WebhookServer
}

export class WebhookTrigger implements Trigger<WebhookEvent> {
  #started = false

  #pipelineGroups: Array<{
    pipeline: Pipeline<WebhookEvent>
    condition (event: WebhookEvent): boolean
  }> = []

  #webhookServer: WebhookServer

  constructor ({ webhookServer }: WebhookTriggerOptions) {
    this.#webhookServer = webhookServer
  }

  connect (pipeline: Pipeline<WebhookEvent>, branchWebhookId: string): void {
    if (this.#started) {
      throw new Error('webhook trigger is already started, cannot connect more pipelines')
    }
    // adapt the pipeline
    this.#pipelineGroups.push({
      pipeline,
      condition: (event: WebhookEvent) => event.webhookId === branchWebhookId,
    })
  }

  start (): void {
    if (this.#started) {
      throw new Error('webhook trigger is already started')
    }
    this.#started = true
    this.#webhookServer.addWebhookEventListener(event => {
      let executed = false
      this.#pipelineGroups.forEach(({ pipeline, condition }) => {
        if (!condition(event)) { return }
        const meta = { hash: uid() }
        // errors are handled by the pipeline,
        // no need to await here, leave it async
        pipeline.execute(event, meta).catch(() => null)
        executed = true
      })
      if (!executed) {
        // will be handled by the webhook server (when the server emits 'webhook-event' event)
        throw new Error(`webhook ${event.webhookId} not found`)
      }
    })
    logger.debug('webhook trigger started')
  }
}
