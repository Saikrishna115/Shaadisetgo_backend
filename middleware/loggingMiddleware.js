const morgan = require('morgan');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Custom Morgan format
morgan.token('request-id', (req) => req.id);
morgan.token('user-id', (req) => req.user?.id || 'anonymous');
morgan.token('body', (req) => JSON.stringify(req.body));

// Custom format string
const morganFormat = process.env.NODE_ENV === 'development' 
  ? ':request-id [:date[clf]] ":method :url" :status :response-time ms - :res[content-length] - :user-id'
  : ':request-id :remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';

// Request ID middleware
const addRequestId = (req, res, next) => {
  req.id = uuidv4();
  next();
};

// Response time middleware
const addResponseTime = (req, res, next) => {
  const startHrTime = process.hrtime();

  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;
    
    logger.info({
      message: 'Request completed',
      ...logger.requestContext(req),
      responseTime: elapsedTimeInMs.toFixed(3),
      statusCode: res.statusCode,
      contentLength: res.get('content-length')
    });
  });

  next();
};

// Request body logging (for development)
const logRequestBody = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    const sanitizedBody = { ...req.body };
    
    // Remove sensitive data
    if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
    if (sanitizedBody.confirmPassword) sanitizedBody.confirmPassword = '[REDACTED]';
    if (sanitizedBody.token) sanitizedBody.token = '[REDACTED]';
    
    logger.debug({
      message: 'Request body',
      ...logger.requestContext(req),
      body: sanitizedBody
    });
  }
  next();
};

// Error logging
const logError = (err, req, res, next) => {
  logger.logAPIError(req, err);
  next(err);
};

// Combine all middleware
const loggingMiddleware = [
  addRequestId,
  morgan(morganFormat, { stream: logger.stream }),
  addResponseTime,
  logRequestBody
];

module.exports = {
  loggingMiddleware,
  logError
}; 