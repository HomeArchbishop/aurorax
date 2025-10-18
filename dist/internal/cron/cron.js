import { scheduleJob as originalScheduleJob } from 'node-schedule';
export const scheduleJob = (spec, cronJob) => {
    originalScheduleJob(spec, async () => {
        await cronJob();
    });
};
