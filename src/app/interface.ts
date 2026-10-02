import type { Job, Middleware, Webhook } from '@/interfaces/facade'

export interface AppInfo {
  middlewares: ReadonlyArray<{ name: string; index: number }>
  jobs: ReadonlyArray<{ name: string; index: number; spec: string }>
  webhooks: ReadonlyArray<{ name: string; webhookId: string }>
}

export interface Application {
  useMw (mw: Middleware): this
  useJob (spec: string, job: Job): this
  useWebhook (webhookId: string, webhook: Webhook): this
  info (): AppInfo
  start (): Promise<void>
  stop (): void
}
