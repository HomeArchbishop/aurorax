import type { WebhookEvent } from '../../interfaces/webhook/event';
import EventEmitter from 'events';
interface WebhookServerOptions {
    port: number;
    tokens: string[];
}
export declare class WebhookServer extends EventEmitter {
    #private;
    constructor({ port, tokens }: WebhookServerOptions);
    addWebhookEventListener(listener: (WebhookEvent: WebhookEvent) => void): void;
    start(): Promise<void>;
}
export {};
//# sourceMappingURL=webhook-server.d.ts.map