import type { Job, Middleware, Webhook } from '@/interfaces/facade'

export interface Application {
  useMw (mw: Middleware): this
  useJob (spec: string, job: Job): this
  useWebhook (webhookId: string, webhook: Webhook): this
  start (): Promise<void>
}
