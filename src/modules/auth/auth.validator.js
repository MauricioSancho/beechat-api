const { body, validationResult } = require('express-validator');

// Middleware que ejecuta validationResult y retorna 422 si hay errores
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Validation failed',
        details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      },
    });
  }
  next();
}

const registerValidator = [
  body('phone')
    .optional()
    .matches(/^\+[1-9]\d{7,14}$/)
    .withMessage('Phone must be in E.164 format (e.g. +5491155551234)'),

  body('email')
    .optional()
    .trim()
    .toLowerCase()
    .isEmail().withMessage('Must be a valid email address'),

  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers and underscores'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character'),

  body('display_name')
    .trim()
    .notEmpty().withMessage('Display name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Display name must be between 2 and 100 characters'),

  validate,
];

const loginValidator = [
  body('identifier')
    .notEmpty().withMessage('Phone or email is required'),

  body('password')
    .notEmpty().withMessage('Password is required'),

  validate,
];

const verifyAccountValidator = [
  body('code')
    .notEmpty().withMessage('Verification code is required')
    .isLength({ min: 4, max: 10 }).withMessage('Invalid verification code'),

  validate,
];

module.exports = {
  registerValidator,
  loginValidator,
  verifyAccountValidator,
};
