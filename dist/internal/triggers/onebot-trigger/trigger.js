import { logger } from '../../../internal/logger';
import { withCacheUntil } from '../../../internal/utils/functional';
import { uid } from '../../../internal/utils/misc';
export class OnebotTrigger {
    #started = false;
    #pipelineGroups = [];
    #onebotBridge;
    constructor({ onebotBridge }) {
        this.#onebotBridge = onebotBridge;
    }
    connect(pipeline) {
        if (this.#started) {
            throw new Error('onebot trigger is already started, cannot connect more pipelines');
        }
        this.#pipelineGroups.push({ pipeline });
        this.#onebotBridge.addOnebotEventListener(withCacheUntil(() => this.#started, event => {
            const meta = { hash: uid() };
            pipeline.execute(event, meta);
        }));
    }
    start() {
        if (this.#started) {
            throw new Error('onebot trigger is already started');
        }
        this.#started = true;
        logger.debug('onebot trigger started');
    }
}
