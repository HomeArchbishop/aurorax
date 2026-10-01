import { scheduleJob as originalScheduleJob, type Job } from 'node-schedule'

export type Spec = string

export const scheduleJob = (spec: Spec, cronJob: () => Promise<void>): Job => {
  return originalScheduleJob(spec, async () => {
    await cronJob()
  })
}
