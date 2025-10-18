import { WebhookServer } from '@/internal/webhook-server'
import type { IApp } from './interface'
import { type OnebotBridge, type OnebotBridgeType, createOnebotBridge } from '@/internal/onebot-bridge'
import type { Job, Middleware, Webhook } from '@/interfaces/facade'
import { WebhookTrigger, OnebotTrigger, CronTrigger } from '@/internal/triggers'
import { MiddlewarePipeline, JobPipeline, WebhookPipeline } from '@/internal/pipelines'
import { logger } from '@/internal/logger'
import { ensureType } from '@/internal/utils/misc'
import type { Spec } from '@/internal/cron'

interface AppOptions {
  onebot: {
    type: OnebotBridgeType
    url: string
    token?: string
  }
  webhook?: {
    port: number
    tokens: string[]
  }
}

export class App implements IApp {
  readonly #onebotBridge: OnebotBridge
  readonly #webhookServer: WebhookServer

  readonly #onebotTrigger: OnebotTrigger
  readonly #cronTrigger: CronTrigger
  readonly #webhookTrigger: WebhookTrigger

  readonly #middlewarePipelines: MiddlewarePipeline[] = []
  readonly #jobPipelines: JobPipeline[] = []
  readonly #webhookPipelines: WebhookPipeline[] = []

  constructor ({ onebot, webhook }: AppOptions) {
    this.#onebotBridge = createOnebotBridge({
      type: onebot.type,
      url: onebot.url,
      token: onebot.token,
    })
    this.#webhookServer = new WebhookServer({
      port: webhook?.port ?? 3000,
      tokens: webhook?.tokens ?? [],
    })

    this.#onebotTrigger = new OnebotTrigger({ onebotBridge: this.#onebotBridge })
    this.#cronTrigger = new CronTrigger()
    this.#webhookTrigger = new WebhookTrigger({ webhookServer: this.#webhookServer })
  }

  get #pipelineCommonOptions () {
    return {
      onebotBridge: this.#onebotBridge,
    }
  }

  useMw (mw: Middleware): this {
    ensureType<Middleware>(mw, 'function')
    logger.debug(`use middleware: ${mw.name}`)
    // create pipeline
    const pipeline = new MiddlewarePipeline(mw, {
      ...this.#pipelineCommonOptions,
      meta: {
        name: mw.name,
        index: this.#middlewarePipelines.length,
      },
    })
    // connect pipeline
    if (this.#middlewarePipelines.length === 0) {
      this.#onebotTrigger.connect(pipeline)
    } else {
      this.#middlewarePipelines[this.#middlewarePipelines.length - 1].pipeTo(pipeline)
    }
    // save pipeline
    this.#middlewarePipelines.push(pipeline)
    return this
  }

  useJob (spec: Spec, job: Job): this {
    ensureType<Job>(job, 'function')
    logger.debug(`use job: ${job.name}`)
    // create pipeline
    const pipeline = new JobPipeline(job, {
      ...this.#pipelineCommonOptions,
      meta: {
        name: job.name,
        index: this.#jobPipelines.length,
      },
    })
    // connect pipeline
    this.#cronTrigger.connect(pipeline, spec)
    // save pipeline
    this.#jobPipelines.push(pipeline)
    return this
  }

  useWebhook (webhookId: string, webhook: Webhook): this {
    ensureType(webhookId, 'string')
    ensureType<Webhook>(webhook, 'function')
    logger.debug(`use webhook: ${webhook.name}`)
    // create pipeline
    const pipeline = new WebhookPipeline(webhook, {
      ...this.#pipelineCommonOptions,
      meta: { name: webhook.name, webhookId },
    })
    // connect pipeline
    this.#webhookTrigger.connect(pipeline, webhookId)
    // save pipeline
    this.#webhookPipelines.push(pipeline)
    return this
  }

  async start (): Promise<void> {
    await this.#onebotBridge.establishConnectionToOnebot()
    // Start webhook server only if there are webhook pipelines
    if (this.#webhookPipelines.length > 0) {
      await this.#webhookServer.start()
    }
    this.#onebotTrigger.start()
    this.#cronTrigger.start()
    this.#webhookTrigger.start()
  }
}
