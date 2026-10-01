import type { Application } from './interface';
import { type OnebotBridgeType } from '@/internal/onebot-bridge';
import type { Job, Middleware, Webhook } from '@/interfaces/facade';
import { type LoggerOptions } from '@/internal/logger';
import type { Spec } from '@/internal/cron';
interface AppOptions {
    onebot: {
        type: OnebotBridgeType;
        url: string;
        token?: string;
        timeout?: number;
        reconnect?: {
            maxAttempts?: number;
            retryIntervalMs?: number;
        };
    };
    webhook?: {
        port: number;
        tokens: string[];
    };
    logger?: LoggerOptions;
}
export declare class App implements Application {
    #private;
    constructor({ onebot, webhook, logger: loggerOptions }: AppOptions);
    useMw(mw: Middleware): this;
    useJob(spec: Spec, job: Job): this;
    useWebhook(webhookId: string, webhook: Webhook): this;
    start(): Promise<void>;
    stop(): void;
}
export {};
//# sourceMappingURL=app.d.ts.map