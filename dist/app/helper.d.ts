import type { Job, Webhook, Middleware } from '../interfaces/facade';
import type { Spec } from '../internal/cron';
export declare function createMiddleware(name: string, mw: Middleware): Middleware;
export declare function createMiddleware(mw: Middleware): Middleware;
export declare function createJob(name: string, spec: string, job: Job): [Spec, Job];
export declare function createJob(spec: Spec, job: Job): [Spec, Job];
export declare function createWebhook(name: string, webhookId: string, webhook: Webhook): [string, Webhook];
export declare function createWebhook(webhookId: string, webhook: Webhook): [string, Webhook];
//# sourceMappingURL=helper.d.ts.map