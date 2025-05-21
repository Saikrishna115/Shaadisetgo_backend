const { body, param, query } = require('express-validator');
const { validate } = require('./validate');

const createBookingValidator = validate([
  body('vendorId')
    .isMongoId()
    .withMessage('Invalid vendor ID'),
  body('eventDate')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      if (date < now) {
        throw new Error('Event date cannot be in the past');
      }
      return true;
    }),
  body('eventType')
    .isIn(['wedding', 'engagement', 'reception', 'sangeet', 'other'])
    .withMessage('Invalid event type'),
  body('guestCount')
    .isInt({ min: 1, max: 10000 })
    .withMessage('Guest count must be between 1 and 10000'),
  body('requirements')
    .optional()
    .isArray()
    .withMessage('Requirements must be an array'),
  body('requirements.*')
    .isString()
    .withMessage('Each requirement must be a string'),
  body('budget')
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),
  body('location')
    .notEmpty()
    .withMessage('Location is required')
    .isLength({ max: 200 })
    .withMessage('Location cannot exceed 200 characters'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
]);

const updateBookingValidator = validate([
  param('id')
    .isMongoId()
    .withMessage('Invalid booking ID'),
  body('status')
    .optional()
    .isIn(['pending', 'confirmed', 'cancelled', 'completed'])
    .withMessage('Invalid booking status'),
  body('eventDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      if (date < now) {
        throw new Error('Event date cannot be in the past');
      }
      return true;
    }),
  body('guestCount')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Guest count must be between 1 and 10000'),
  body('requirements')
    .optional()
    .isArray()
    .withMessage('Requirements must be an array'),
  body('requirements.*')
    .isString()
    .withMessage('Each requirement must be a string'),
  body('budget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
]);

const getBookingsValidator = validate([
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'cancelled', 'completed'])
    .withMessage('Invalid booking status'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
]);

const getBookingByIdValidator = validate([
  param('id')
    .isMongoId()
    .withMessage('Invalid booking ID')
]);

module.exports = {
  createBookingValidator,
  updateBookingValidator,
  getBookingsValidator,
  getBookingByIdValidator
}; 