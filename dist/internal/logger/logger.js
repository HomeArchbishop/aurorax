import winston, { format, transports } from 'winston';
import 'winston-daily-rotate-file';
const DEFAULT_LEVEL = 'silly';
const DEFAULT_DIR = 'logs';
function createDailyTransport(dirname) {
    return new winston.transports.DailyRotateFile({
        dirname,
        filename: 'log-%DATE%.log',
        level: 'debug',
        datePattern: 'YYYY-MM-DD-HH',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
    });
}
let dailyTransport = createDailyTransport(DEFAULT_DIR);
export const logger = winston.createLogger({
    level: DEFAULT_LEVEL,
    format: format.combine(format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), format.align(), format.printf(({ level, message, timestamp }) => {
        return `${timestamp} ${level}:${message}`;
    })),
    transports: [
        new transports.Console(),
        dailyTransport,
    ],
});
export function configureLogger(options = {}) {
    logger.level = options.level ?? DEFAULT_LEVEL;
    logger.remove(dailyTransport);
    dailyTransport = createDailyTransport(options.dir ?? DEFAULT_DIR);
    logger.add(dailyTransport);
}
