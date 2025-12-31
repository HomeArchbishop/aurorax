import type { Context, Webhook } from '@/interfaces/facade'
import type { EventMeta, Pipeline } from '../interface'
import type { WebhookEvent } from '@/interfaces/webhook'
import type { OnebotBridge } from '@/internal/onebot-bridge'
import { logger } from '@/internal/logger'

interface WebhookPipelineOptions {
  onebotBridge: OnebotBridge
  meta: {
    name: string
    webhookId: string
  }
}

export class WebhookPipeline implements Pipeline<WebhookEvent> {
  #webhook: Webhook
  #onebotBridge: OnebotBridge
  #meta: WebhookPipelineOptions['meta']

  constructor (webhook: Webhook, { onebotBridge, meta }: WebhookPipelineOptions) {
    this.#onebotBridge = onebotBridge
    this.#webhook = webhook
    this.#meta = meta
  }

  async execute (event: WebhookEvent, meta: EventMeta): Promise<void> {
    const identifier = `webhook ${this.#meta.webhookId}\`${this.#meta.name}\` for webhook_event#${meta.hash}`
    const ctx: Context<WebhookEvent> = {
      send: this.#onebotBridge.send,
      event,
    }
    try {
      logger.debug(`${identifier} triggered and processing`)
      await this.#webhook(ctx)
      logger.debug(`${identifier} triggered successfully`)
    } catch (err: unknown) {
      if (err instanceof Error) {
        logger.error(`${identifier} processing error: ` + err.message)
        logger.error(err.stack)
      } else {
        logger.error(`${identifier} processing error: ${err}`)
      }
    }
  }
}
