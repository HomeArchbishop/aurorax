import type { Application } from './interface';
import { type OnebotBridgeType } from '../internal/onebot-bridge';
import type { Job, Middleware, Webhook } from '../interfaces/facade';
import type { Spec } from '../internal/cron';
interface AppOptions {
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
export declare class App implements Application {
    #private;
    constructor({ onebot, webhook }: AppOptions);
    useMw(mw: Middleware): this;
    useJob(spec: Spec, job: Job): this;
    useWebhook(webhookId: string, webhook: Webhook): this;
    start(): Promise<void>;
}
export {};
//# sourceMappingURL=app.d.ts.map