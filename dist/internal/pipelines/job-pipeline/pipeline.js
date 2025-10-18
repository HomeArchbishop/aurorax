import { logger } from '../../../internal/logger';
export class JobPipeline {
    #job;
    #onebotBridge;
    #meta;
    constructor(job, { onebotBridge, meta }) {
        this.#onebotBridge = onebotBridge;
        this.#meta = meta;
        this.#job = job;
    }
    async execute(event, meta) {
        const identifier = `job#${this.#meta.index}\`${this.#meta.name}\` for cron_event#${meta.hash} with spec:"${event.spec}"`;
        const ctx = {
            send: this.#onebotBridge.send,
            event,
        };
        try {
            logger.debug(`${identifier} executed`);
            await this.#job(ctx);
            logger.debug(`${identifier} finished`);
        }
        catch (err) {
            logger.error(`${identifier} error: ` + err.message);
            if (err instanceof Error) {
                logger.error(err.stack);
            }
        }
    }
}
