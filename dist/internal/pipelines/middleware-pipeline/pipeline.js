import { logger } from '../../../internal/logger';
import { once } from '../../../internal/utils/functional';
export class MiddlewarePipeline {
    #middleware;
    #onebotBridge;
    #meta;
    #nextPipeline;
    constructor(mw, { onebotBridge, meta }) {
        this.#middleware = mw;
        this.#onebotBridge = onebotBridge;
        this.#meta = meta;
    }
    pipeTo(pipeline) {
        this.#nextPipeline = pipeline;
    }
    async execute(event, meta) {
        const identifier = `middleware#${this.#meta.index}\`${this.#meta.name}\` for onebot_event#${meta.hash}`;
        const ctx = {
            send: this.#onebotBridge.send,
            event,
        };
        const next = once(async () => { await this.#nextPipeline?.execute(event, meta); });
        try {
            logger.debug(`${identifier} start`);
            await this.#middleware(ctx, next);
            logger.debug(`${identifier} end`);
        }
        catch (err) {
            if (err instanceof Error) {
                logger.error(`${identifier} error: ` + err.message);
                logger.error(err.stack);
            }
            else {
                logger.error(`${identifier} error: ${err}`);
            }
        }
    }
}
