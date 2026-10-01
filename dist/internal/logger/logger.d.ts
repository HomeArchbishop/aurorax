import winston from 'winston';
import 'winston-daily-rotate-file';
export interface LoggerOptions {
    level?: string;
    dir?: string;
}
export declare const logger: winston.Logger;
export declare function configureLogger(options?: LoggerOptions): void;
//# sourceMappingURL=logger.d.ts.map