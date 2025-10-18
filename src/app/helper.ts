import type { Job, Webhook, Middleware } from '@/interfaces/facade'
import type { Spec } from '@/internal/cron'
import { ensureType, withName } from '@/internal/utils/misc'

export function createMiddleware (name: string, mw: Middleware): Middleware
export function createMiddleware (mw: Middleware): Middleware
export function createMiddleware (...args: [string, Middleware] | [Middleware]): Middleware {
  const name = args.length === 2 ? String(args[0]) : args[0]?.name || 'anonymous'
  const middleware = args.length === 2 ? args[1] : args[0]
  ensureType<Middleware>(middleware, 'function')
  return withName(middleware, name)
}

export function createJob (name: string, spec: string, job: Job): [Spec, Job]
export function createJob (spec: Spec, job: Job): [Spec, Job]
export function createJob (...args: [string, Spec, Job] | [Spec, Job]): [Spec, Job] {
  const name = args.length === 3 ? String(args[0]) : args[1]?.name || 'anonymous'
  const spec = args.length === 3 ? args[1] : args[0]
  const job = args.length === 3 ? args[2] : args[1]
  ensureType<Job>(job, 'function')
  return [spec, withName(job, name)]
}

export function createWebhook (name: string, webhookId: string, webhook: Webhook): [string, Webhook]
export function createWebhook (webhookId: string, webhook: Webhook): [string, Webhook]
export function createWebhook (...args: [string, string, Webhook] | [string, Webhook]): [string, Webhook] {
  const name = args.length === 3 ? String(args[0]) : args[1]?.name || args[0] || 'anonymous'
  const webhookId = args.length === 3 ? args[1] : args[0]
  const webhook = args.length === 3 ? args[2] : args[1]
  ensureType<Webhook>(webhook, 'function')
  return [webhookId, withName(webhook, name)]
}
