import type { CronEvent } from '../../../interfaces/cron';
import type { Job } from '../../../interfaces/facade';
import type { EventMeta, Pipeline } from '../interface';
import type { OnebotBridge } from '../../../internal/onebot-bridge';
interface JobPipelineOptions {
    onebotBridge: OnebotBridge;
    meta: {
        name: string;
        index: number;
    };
}
export declare class JobPipeline implements Pipeline<CronEvent> {
    #private;
    constructor(job: Job, { onebotBridge, meta }: JobPipelineOptions);
    execute(event: CronEvent, meta: EventMeta): Promise<void>;
}
export {};
//# sourceMappingURL=pipeline.d.ts.map