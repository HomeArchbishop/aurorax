import { scheduleJob as originalScheduleJob } from 'node-schedule';
export const scheduleJob = (spec, cronJob) => {
    return originalScheduleJob(spec, async () => {
        await cronJob();
    });
};
