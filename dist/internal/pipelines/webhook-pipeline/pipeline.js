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
            if (err instanceof Error) {
                logger.error(`${identifier} processing error: ` + err.message);
                logger.error(err.stack);
            }
            else {
                logger.error(`${identifier} processing error: ${err}`);
            }
        }
    }
}
