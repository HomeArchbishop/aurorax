import type { OnebotEvent } from '@/interfaces/onebot/event'
import type { CtxSend } from '@/internal/onebot-bridge/interface'
import type { CronEvent } from '@/interfaces/cron'
import type { WebhookEvent } from '@/interfaces/webhook'

export interface Context<E extends OnebotEvent | CronEvent | WebhookEvent> {
  readonly send: CtxSend
  readonly event: E
}

export type Middleware = (ctx: Readonly<Context<OnebotEvent>>, next: () => Promise<void>) => Promise<void>
export type Job = (ctx: Readonly<Context<CronEvent>>) => Promise<void>
export type Webhook = (ctx: Context<WebhookEvent>) => Promise<void>

/** Aurorax ↔ OneBot connection lifecycle on `App` (`app.on(...)`). Not OneBot `meta_event` / business events (`useMw`). */
export const APP_LIFECYCLE_EVENTS = [
  'connected',
  'disconnected',
  'reconnecting',
  'connection-lost',
] as const

export type AppLifecycleEvent = typeof APP_LIFECYCLE_EVENTS[number]

export interface ConnectedEvent {
  /** true when this open follows a reconnect attempt */
  reconnected: boolean
}

export interface DisconnectedEvent {
  /** true when closed by `app.stop()` / intentional close; false when reconnect exhausted */
  manual: boolean
}

export interface ReconnectingEvent {
  attempt: number
  delayMs: number
}

export interface ConnectionLostEvent {
  attempts: number
}
