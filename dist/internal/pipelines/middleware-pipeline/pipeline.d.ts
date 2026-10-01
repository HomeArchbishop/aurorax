import type { OnebotEvent } from '../../../interfaces/onebot';
import type { EventMeta, Pipeable, Pipeline } from '../interface';
import type { Middleware } from '../../../interfaces/facade';
import type { OnebotBridge } from '../../../internal/onebot-bridge';
interface MiddlewarePipelineOptions {
    onebotBridge: OnebotBridge;
    meta: {
        name: string;
        index: number;
    };
}
export declare class MiddlewarePipeline implements Pipeline<OnebotEvent>, Pipeable<OnebotEvent> {
    #private;
    constructor(mw: Middleware, { onebotBridge, meta }: MiddlewarePipelineOptions);
    pipeTo(pipeline: MiddlewarePipeline): void;
    execute(event: OnebotEvent, meta: EventMeta): Promise<void>;
}
export {};
//# sourceMappingURL=pipeline.d.ts.map