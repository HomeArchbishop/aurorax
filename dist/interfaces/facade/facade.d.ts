import type { OnebotEvent } from '../../interfaces/onebot/event';
import type { CtxSend } from '../../internal/onebot-bridge/interface';
import type { CronEvent } from '../../interfaces/cron';
import type { WebhookEvent } from '../../interfaces/webhook';
export interface Context<E extends OnebotEvent | CronEvent | WebhookEvent> {
    readonly send: CtxSend;
    readonly event: E;
}
export type Middleware = (ctx: Readonly<Context<OnebotEvent>>, next: () => Promise<void>) => Promise<void>;
export type Job = (ctx: Readonly<Context<CronEvent>>) => Promise<void>;
export type Webhook = (ctx: Context<WebhookEvent>) => Promise<void>;
//# sourceMappingURL=facade.d.ts.map