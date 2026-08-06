import { WebhookServer } from '../internal/webhook-server';
import { createOnebotBridge } from '../internal/onebot-bridge';
import { WebhookTrigger, OnebotTrigger, CronTrigger } from '../internal/triggers';
import { MiddlewarePipeline, JobPipeline, WebhookPipeline } from '../internal/pipelines';
import { logger } from '../internal/logger';
import { ensureType } from '../internal/utils/misc';
export class App {
    #onebotBridge;
    #webhookServer;
    #onebotTrigger;
    #cronTrigger;
    #webhookTrigger;
    #middlewarePipelines = [];
    #jobPipelines = [];
    #webhookPipelines = [];
    constructor({ onebot, webhook }) {
        this.#onebotBridge = createOnebotBridge({
            type: onebot.type,
            url: onebot.url,
            token: onebot.token,
            timeout: onebot.timeout,
            reconnect: onebot.reconnect,
        });
        this.#webhookServer = new WebhookServer({
            port: webhook?.port ?? (Number(process.env.AURORAX_WEBHOOK_PORT) ?? 3000),
            tokens: webhook?.tokens ?? [],
        });
        this.#onebotTrigger = new OnebotTrigger({ onebotBridge: this.#onebotBridge });
        this.#cronTrigger = new CronTrigger();
        this.#webhookTrigger = new WebhookTrigger({ webhookServer: this.#webhookServer });
    }
    get #pipelineCommonOptions() {
        return {
            onebotBridge: this.#onebotBridge,
        };
    }
    useMw(mw) {
        ensureType(mw, 'function');
        logger.debug(`use middleware: ${mw.name}`);
        // create pipeline
        const pipeline = new MiddlewarePipeline(mw, {
            ...this.#pipelineCommonOptions,
            meta: {
                name: mw.name,
                index: this.#middlewarePipelines.length,
            },
        });
        // connect pipeline
        if (this.#middlewarePipelines.length === 0) {
            this.#onebotTrigger.connect(pipeline);
        }
        else {
            this.#middlewarePipelines[this.#middlewarePipelines.length - 1].pipeTo(pipeline);
        }
        // save pipeline
        this.#middlewarePipelines.push(pipeline);
        return this;
    }
    useJob(spec, job) {
        ensureType(job, 'function');
        logger.debug(`use job: ${job.name}`);
        // create pipeline
        const pipeline = new JobPipeline(job, {
            ...this.#pipelineCommonOptions,
            meta: {
                name: job.name,
                index: this.#jobPipelines.length,
            },
        });
        // connect pipeline
        this.#cronTrigger.connect(pipeline, spec);
        // save pipeline
        this.#jobPipelines.push(pipeline);
        return this;
    }
    useWebhook(webhookId, webhook) {
        ensureType(webhookId, 'string');
        ensureType(webhook, 'function');
        logger.debug(`use webhook: ${webhook.name}`);
        // create pipeline
        const pipeline = new WebhookPipeline(webhook, {
            ...this.#pipelineCommonOptions,
            meta: { name: webhook.name, webhookId },
        });
        // connect pipeline
        this.#webhookTrigger.connect(pipeline, webhookId);
        // save pipeline
        this.#webhookPipelines.push(pipeline);
        return this;
    }
    async start() {
        await this.#onebotBridge.establishConnectionToOnebot();
        // Start webhook server only if there are webhook pipelines
        if (this.#webhookPipelines.length > 0) {
            await this.#webhookServer.start();
        }
        this.#onebotTrigger.start();
        this.#cronTrigger.start();
        this.#webhookTrigger.start();
    }
}
