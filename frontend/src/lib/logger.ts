import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const fileTransport = new DailyRotateFile({
  filename: '/var/log/locumlink/app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: false,
  maxFiles: '30d',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
});

export const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    fileTransport,
  ],
});

// Use this in routes — pass userId, adminId etc as meta
export function makeLogger(meta: Record<string, string | undefined>) {
  return {
    info: (msg: string, extra?: Record<string, unknown>) =>
      logger.info(msg, { ...meta, ...extra }),
    error: (msg: string, extra?: Record<string, unknown>) =>
      logger.error(msg, { ...meta, ...extra }),
    warn: (msg: string, extra?: Record<string, unknown>) =>
      logger.warn(msg, { ...meta, ...extra }),
  };
}
