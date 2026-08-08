import winston, { format, transports } from 'winston';
import 'winston-daily-rotate-file';
const level = process.env.AURORAX_LOG_LEVEL ?? 'silly';
const dirname = process.env.AURORAX_LOG_DIR ?? 'logs';
const dailyTransport = new winston.transports.DailyRotateFile({
    dirname,
    filename: 'log-%DATE%.log',
    level: 'debug',
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
});
export const logger = winston.createLogger({
    level,
    format: format.combine(format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), format.align(), format.printf(({ level, message, timestamp }) => {
        return `${timestamp} ${level}:${message}`;
    })),
    transports: [
        new transports.Console(),
        dailyTransport,
    ],
});
