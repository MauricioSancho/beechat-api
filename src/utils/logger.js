const { createLogger, format, transports } = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, errors } = format;

// Formato personalizado para logs
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    // Log a archivo
    new transports.File({
      filename: path.resolve(process.env.LOG_FILE || 'logs/app.log'),
      maxsize: 5 * 1024 * 1024, // 5 MB
      maxFiles: 5,
      tailable: true,
    }),
    new transports.File({
      filename: path.resolve('logs/error.log'),
      level: 'error',
    }),
  ],
});

// En desarrollo: también log a consola con colores
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'HH:mm:ss' }),
        errors({ stack: true }),
        logFormat
      ),
    })
  );
}

// Stream compatible con Morgan
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

module.exports = logger;
