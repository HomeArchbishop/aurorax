import type { Spec } from '@/internal/cron'

export interface CronEvent {
  spec: Spec
  timestamp: number // (ms)
}
