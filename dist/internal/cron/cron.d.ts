import { type Job } from 'node-schedule';
export type Spec = string;
export declare const scheduleJob: (spec: Spec, cronJob: () => Promise<void>) => Job;
//# sourceMappingURL=cron.d.ts.map