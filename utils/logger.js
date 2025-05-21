const winston = require('winston');
const path = require('path');
require('winston-daily-rotate-file');

// Custom log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'warn';
};

// Custom colors for each log level
winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
});

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Custom format for file output (JSON)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create log directory if it doesn't exist
const logDir = path.join(__dirname, '../logs');
require('fs').mkdirSync(logDir, { recursive: true });

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat
  }),
  
  // Rotating file transport for errors
  new winston.transports.DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level: 'error',
    format: fileFormat
  }),
  
  // Rotating file transport for all logs
  new winston.transports.DailyRotateFile({
    filename: path.join(logDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: fileFormat
  })
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  transports
});

// Add request context to logs
logger.requestContext = (req) => ({
  requestId: req.id,
  method: req.method,
  url: req.originalUrl,
  ip: req.ip,
  userId: req.user?.id || 'anonymous'
});

// Helper methods for structured logging
logger.logAPIRequest = (req, message) => {
  logger.http({
    message,
    ...logger.requestContext(req),
    body: req.body,
    params: req.params,
    query: req.query
  });
};

logger.logAPIResponse = (req, statusCode, responseData) => {
  logger.http({
    message: 'API Response',
    ...logger.requestContext(req),
    statusCode,
    responseData: process.env.NODE_ENV === 'development' ? responseData : undefined
  });
};

logger.logAPIError = (req, error) => {
  logger.error({
    message: 'API Error',
    ...logger.requestContext(req),
    error: {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
  });
};

// Morgan stream
logger.stream = {
  write: (message) => logger.http(message.trim())
};

module.exports = logger; 