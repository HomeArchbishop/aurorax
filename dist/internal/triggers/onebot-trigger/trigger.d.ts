import type { Trigger } from '../interface';
import type { OnebotEvent } from '../../../interfaces/onebot';
import type { OnebotBridge } from '../../../internal/onebot-bridge';
import type { Pipeline } from '../../../internal/pipelines';
interface OnebotTriggerOptions {
    onebotBridge: OnebotBridge;
}
export declare class OnebotTrigger implements Trigger<OnebotEvent> {
    #private;
    constructor({ onebotBridge }: OnebotTriggerOptions);
    connect(pipeline: Pipeline<OnebotEvent>): void;
    start(): void;
}
export {};
//# sourceMappingURL=trigger.d.ts.map