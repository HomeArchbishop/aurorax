import type { Trigger } from '../interface';
import type { Pipeline } from '../../../internal/pipelines';
import type { CronEvent } from '../../../interfaces/cron';
export declare class CronTrigger implements Trigger<CronEvent> {
    #private;
    connect(pipeline: Pipeline<CronEvent>, branchSpec: string): void;
    start(): void;
}
//# sourceMappingURL=trigger.d.ts.map