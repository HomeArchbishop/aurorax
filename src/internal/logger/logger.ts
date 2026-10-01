import winston, { format, transports } from 'winston'
import 'winston-daily-rotate-file'

export interface LoggerOptions {
  level?: string
  dir?: string
}

const DEFAULT_LEVEL = 'silly'
const DEFAULT_DIR = 'logs'

function createDailyTransport (dirname: string) {
  return new winston.transports.DailyRotateFile({
    dirname,
    filename: 'log-%DATE%.log',
    level: 'debug',
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
  })
}

let dailyTransport = createDailyTransport(DEFAULT_DIR)

export const logger = winston.createLogger({
  level: DEFAULT_LEVEL,
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.align(),
    format.printf(({ level, message, timestamp }) => {
      return `${timestamp as string} ${level}:${message as string}`
    }),
  ),
  transports: [
    new transports.Console(),
    dailyTransport,
  ],
})

export function configureLogger (options: LoggerOptions = {}): void {
  logger.level = options.level ?? DEFAULT_LEVEL
  logger.remove(dailyTransport)
  dailyTransport = createDailyTransport(options.dir ?? DEFAULT_DIR)
  logger.add(dailyTransport)
}
