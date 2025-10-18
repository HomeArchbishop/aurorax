import type { Trigger } from '../interface';
import type { WebhookEvent } from '../../../interfaces/webhook';
import type { WebhookServer } from '../../../internal/webhook-server';
import type { Pipeline } from '../../../internal/pipelines';
interface WebhookTriggerOptions {
    webhookServer: WebhookServer;
}
export declare class WebhookTrigger implements Trigger<WebhookEvent> {
    #private;
    constructor({ webhookServer }: WebhookTriggerOptions);
    connect(pipeline: Pipeline<WebhookEvent>, branchWebhookId: string): void;
    start(): void;
}
export {};
//# sourceMappingURL=trigger.d.ts.map