const { body, param, query } = require('express-validator');
const { validate } = require('./validate');

const createVendorProfileValidator = validate([
  body('businessName')
    .trim()
    .notEmpty()
    .withMessage('Business name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 50, max: 1000 })
    .withMessage('Description must be between 50 and 1000 characters'),
  body('services')
    .isArray({ min: 1 })
    .withMessage('At least one service must be specified'),
  body('services.*')
    .isString()
    .withMessage('Each service must be a string'),
  body('priceRange')
    .isObject()
    .withMessage('Price range must be an object'),
  body('priceRange.min')
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  body('priceRange.max')
    .isFloat()
    .custom((value, { req }) => {
      if (value <= req.body.priceRange.min) {
        throw new Error('Maximum price must be greater than minimum price');
      }
      return true;
    }),
  body('location')
    .notEmpty()
    .withMessage('Location is required')
    .isLength({ max: 200 })
    .withMessage('Location cannot exceed 200 characters'),
  body('contactEmail')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('contactPhone')
    .matches(/^[0-9]{10}$/)
    .withMessage('Please enter a valid 10-digit phone number'),
  body('socialMedia')
    .optional()
    .isObject()
    .withMessage('Social media must be an object'),
  body('socialMedia.*.url')
    .optional()
    .isURL()
    .withMessage('Invalid social media URL'),
  body('availability')
    .optional()
    .isArray()
    .withMessage('Availability must be an array of dates'),
  body('availability.*')
    .isISO8601()
    .withMessage('Invalid date format in availability')
]);

const updateVendorProfileValidator = validate([
  param('id')
    .isMongoId()
    .withMessage('Invalid vendor ID'),
  body('businessName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 50, max: 1000 })
    .withMessage('Description must be between 50 and 1000 characters'),
  body('services')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one service must be specified'),
  body('services.*')
    .isString()
    .withMessage('Each service must be a string'),
  body('priceRange')
    .optional()
    .isObject()
    .withMessage('Price range must be an object'),
  body('priceRange.min')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  body('priceRange.max')
    .optional()
    .isFloat()
    .custom((value, { req }) => {
      if (req.body.priceRange?.min && value <= req.body.priceRange.min) {
        throw new Error('Maximum price must be greater than minimum price');
      }
      return true;
    }),
  body('location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Location cannot exceed 200 characters'),
  body('contactEmail')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('contactPhone')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('Please enter a valid 10-digit phone number')
]);

const searchVendorsValidator = validate([
  query('services')
    .optional()
    .isArray()
    .withMessage('Services must be an array'),
  query('services.*')
    .isString()
    .withMessage('Each service must be a string'),
  query('location')
    .optional()
    .isString()
    .withMessage('Location must be a string'),
  query('priceMin')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  query('priceMax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number')
    .custom((value, { req }) => {
      if (req.query.priceMin && parseFloat(value) <= parseFloat(req.query.priceMin)) {
        throw new Error('Maximum price must be greater than minimum price');
      }
      return true;
    }),
  query('rating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isIn(['rating', 'priceMin', 'priceMax', 'createdAt'])
    .withMessage('Invalid sort field'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Invalid sort order')
]);

module.exports = {
  createVendorProfileValidator,
  updateVendorProfileValidator,
  searchVendorsValidator
}; 