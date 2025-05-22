class AppError extends Error {
  constructor(message, statusCode, errorType = 'error', details = null) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errorType = errorType;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errorCode = 'BAD_REQUEST') {
    return new AppError(message, 400, errorCode);
  }

  static unauthorized(message, errorCode = 'UNAUTHORIZED') {
    return new AppError(message, 401, errorCode);
  }

  static forbidden(message, errorCode = 'FORBIDDEN') {
    return new AppError(message, 403, errorCode);
  }

  static notFound(message, errorCode = 'NOT_FOUND') {
    return new AppError(message, 404, errorCode);
  }

  static conflict(message, errorCode = 'CONFLICT') {
    return new AppError(message, 409, errorCode);
  }

  static validationError(message, errorCode = 'VALIDATION_ERROR') {
    return new AppError(message, 422, errorCode);
  }

  static internal(message, errorCode = 'INTERNAL_ERROR') {
    return new AppError(message, 500, errorCode);
  }
}

module.exports = AppError; 