import { logger } from '../../../internal/logger';
export class WebhookPipeline {
    #webhook;
    #onebotBridge;
    #meta;
    constructor(webhook, { onebotBridge, meta }) {
        this.#onebotBridge = onebotBridge;
        this.#webhook = webhook;
        this.#meta = meta;
    }
    async execute(event, meta) {
        const identifier = `webhook ${this.#meta.webhookId}\`${this.#meta.name}\` for webhook_event#${meta.hash}`;
        const ctx = {
            send: this.#onebotBridge.send,
            event,
        };
        try {
            logger.debug(`${identifier} triggered and processing`);
            await this.#webhook(ctx);
            logger.debug(`${identifier} triggered successfully`);
        }
        catch (err) {
            logger.error(`${identifier} processing error: ` + err.message);
            if (err instanceof Error) {
                logger.error(err.stack);
            }
        }
    }
}
