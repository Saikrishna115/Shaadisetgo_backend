const { validationResult } = require('express-validator');
const AppError = require('../../utils/AppError');

/**
 * Processes validation chains and returns validation errors if any
 * @param {Array} validations - Array of validation chains
 * @returns {Function} Express middleware
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    // Get validation errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format validation errors
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));

    // Throw validation error
    return next(AppError.validationError('Validation failed', {
      errors: formattedErrors
    }));
  };
};

module.exports = {
  validate
}; 