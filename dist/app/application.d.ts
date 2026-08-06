import type { IApp } from './interface.js';
import { type OnebotBridgeType } from '../internal/onebot-bridge/index.js';
import type { Job, Middleware, Webhook } from '../interfaces/facade/index.js';
interface ApplicationOptions {
    onebot: {
        type: OnebotBridgeType;
        url: string;
        token?: string;
    };
    webhook?: {
        port: number;
        tokens: string[];
    };
}
export declare class Application implements IApp {
    #private;
    constructor({ onebot, webhook }: ApplicationOptions);
    useMw(mw: Middleware): this;
    useJob(spec: string, job: Job): this;
    useWebhook(webhookId: string, webhook: Webhook): this;
    start(): Promise<void>;
}
export {};
//# sourceMappingURL=application.d.ts.map