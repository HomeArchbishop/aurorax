import { scheduleJob as originalScheduleJob } from 'node-schedule'

export type Spec = string

export const scheduleJob = (spec: Spec, cronJob: () => Promise<void>): void => {
  originalScheduleJob(spec, async () => {
    await cronJob()
  })
}
