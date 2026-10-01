import { uid } from '../../../internal/utils/misc';
import { logger } from '../../../internal/logger';
export class WebhookTrigger {
    #started = false;
    #pipelineGroups = [];
    #webhookServer;
    #listener;
    constructor({ webhookServer }) {
        this.#webhookServer = webhookServer;
    }
    connect(pipeline, branchWebhookId) {
        if (this.#started) {
            throw new Error('webhook trigger is already started, cannot connect more pipelines');
        }
        // adapt the pipeline
        this.#pipelineGroups.push({
            pipeline,
            condition: (event) => event.webhookId === branchWebhookId,
        });
    }
    start() {
        if (this.#started) {
            throw new Error('webhook trigger is already started');
        }
        this.#started = true;
        this.#listener = (event) => {
            let executed = false;
            this.#pipelineGroups.forEach(({ pipeline, condition }) => {
                if (!condition(event)) {
                    return;
                }
                const meta = { hash: uid() };
                // errors are handled by the pipeline,
                // no need to await here, leave it async
                pipeline.execute(event, meta).catch(() => null);
                executed = true;
            });
            if (!executed) {
                // will be handled by the webhook server (when the server emits 'webhook-event' event)
                throw new Error(`webhook ${event.webhookId} not found`);
            }
        };
        this.#webhookServer.addWebhookEventListener(this.#listener);
        logger.debug('webhook trigger started');
    }
    stop() {
        if (!this.#started)
            return;
        if (this.#listener) {
            this.#webhookServer.off('webhook-event', this.#listener);
            this.#listener = undefined;
        }
        this.#started = false;
        logger.debug('webhook trigger stopped');
    }
}
