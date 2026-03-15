const { body, query, validationResult } = require('express-validator');

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

const updateProfileValidator = [
  body('displayName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Display name must be between 2 and 100 characters'),

  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 chars, letters/numbers/underscores only'),

  validate,
];

const updateBioValidator = [
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Bio cannot exceed 300 characters'),
  validate,
];

const updatePhoneValidator = [
  body('phone')
    .notEmpty().withMessage('Phone is required')
    .matches(/^\+[1-9]\d{7,14}$/).withMessage('Phone must be in E.164 format'),
  validate,
];

const searchUsersValidator = [
  query('q')
    .notEmpty().withMessage('Search query is required')
    .isLength({ min: 2 }).withMessage('Search query must be at least 2 characters'),
  validate,
];

module.exports = {
  updateProfileValidator,
  updateBioValidator,
  updatePhoneValidator,
  searchUsersValidator,
};
