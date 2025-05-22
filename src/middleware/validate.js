const { validationResult } = require('express-validator');
const AppError = require('../utils/appError');

const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));

    next(new AppError('Validation failed', 422, 'VALIDATION_ERROR', extractedErrors));
  };
};

module.exports = validate; 