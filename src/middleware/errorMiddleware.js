const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return AppError.badRequest(message, 'INVALID_ID');
};

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return AppError.conflict(message, 'DUPLICATE_FIELD');
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return AppError.validationError(message);
};

const handleJWTError = () =>
  AppError.unauthorized('Invalid token. Please log in again!');

const handleJWTExpiredError = () =>
  AppError.unauthorized('Your token has expired! Please log in again.');

const handleMulterError = err => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return AppError.badRequest('File too large! Maximum size is 5MB');
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return AppError.badRequest('Unexpected field name for file upload');
  }
  return AppError.badRequest('Error uploading file');
};

const sendErrorDev = (err, req, res) => {
  logger.error('Error 🔥', {
    error: err,
    request: {
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      params: req.params,
      query: req.query,
      headers: req.headers,
      user: req.user
    }
  });

  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    errorCode: err.errorCode,
    stack: err.stack
  });
};

const sendErrorProd = (err, req, res) => {
  logger.error('Error 🔥', {
    error: err,
    request: {
      method: req.method,
      url: req.originalUrl
    }
  });

  // Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      errorCode: err.errorCode
    });
  }

  // Programming or other unknown error: don't leak error details
  console.error('ERROR 💥', err);
  return res.status(500).json({
    status: 'error',
    message: 'Something went very wrong!',
    errorCode: 'INTERNAL_ERROR'
  });
};

const errorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (error.name === 'MulterError') error = handleMulterError(error);

    sendErrorProd(error, req, res);
  }
};

module.exports = errorMiddleware;