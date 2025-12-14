import winston from 'winston';

export interface LoggerConfig {
  serviceName: string;
  logLevel?: string;
  enableFileLogging?: boolean;
}

export function createLogger(config: LoggerConfig) {
  const { serviceName, logLevel = process.env.LOG_LEVEL || 'info', enableFileLogging = process.env.NODE_ENV !== 'production' } = config;

  return winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json()
    ),
    defaultMeta: { service: serviceName },
    transports: [
      // Always log to console (for Docker/terminal visibility)
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            let msg = `${timestamp} [${level}]: ${message}`;
            if (Object.keys(meta).length > 0 && meta.service !== serviceName) {
              msg += ` ${JSON.stringify(meta)}`;
            }
            return msg;
          })
        ),
      }),
      // Also log to files if not in Docker
      ...(enableFileLogging ? [
        new winston.transports.File({ filename: `${serviceName}-error.log`, level: 'error' }),
        new winston.transports.File({ filename: `${serviceName}-combined.log` }),
      ] : []),
    ],
  });
}

export default createLogger;

