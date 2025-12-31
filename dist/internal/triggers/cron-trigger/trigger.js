import { scheduleJob } from '../../../internal/cron';
import { logger } from '../../../internal/logger';
import { uid } from '../../../internal/utils/misc';
export class CronTrigger {
    #started = false;
    #pipelineGroups = [];
    #specs = new Set();
    connect(pipeline, branchSpec) {
        if (this.#started) {
            throw new Error('cron trigger is already started, cannot connect more pipelines');
        }
        // adapt the spec
        this.#specs.add(branchSpec);
        // adapt the pipeline
        this.#pipelineGroups.push({
            pipeline,
            condition: (event) => event.spec === branchSpec,
        });
    }
    start() {
        if (this.#started) {
            throw new Error('cron trigger is already started');
        }
        this.#started = true;
        this.#specs.forEach(spec => {
            logger.debug(`cron trigger using spec: ${spec} for triggering pipelines`);
            scheduleJob(spec, async () => {
                const event = {
                    spec,
                    timestamp: Date.now(),
                };
                this.#pipelineGroups.forEach(({ pipeline, condition }) => {
                    if (!condition(event)) {
                        return;
                    }
                    const meta = { hash: uid() };
                    // errors are handled by the pipeline,
                    // no need to await here, leave it async
                    pipeline.execute(event, meta).catch(() => null);
                });
            });
        });
        logger.debug('cron trigger started');
    }
}
