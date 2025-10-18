import type { Webhook } from '../../../interfaces/facade';
import type { EventMeta, Pipeline } from '../interface';
import type { WebhookEvent } from '../../../interfaces/webhook';
import type { OnebotBridge } from '../../../internal/onebot-bridge';
interface WebhookPipelineOptions {
    onebotBridge: OnebotBridge;
    meta: {
        name: string;
        webhookId: string;
    };
}
export declare class WebhookPipeline implements Pipeline<WebhookEvent> {
    #private;
    constructor(webhook: Webhook, { onebotBridge, meta }: WebhookPipelineOptions);
    execute(event: WebhookEvent, meta: EventMeta): Promise<void>;
}
export {};
//# sourceMappingURL=pipeline.d.ts.map