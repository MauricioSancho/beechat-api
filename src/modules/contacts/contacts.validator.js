const { body, validationResult } = require('express-validator');

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

const addContactValidator = [
  body('contactUserId')
    .notEmpty().withMessage('contactUserId is required')
    .isInt({ min: 1 }).withMessage('contactUserId must be a positive integer'),

  body('nickname')
    .optional().trim().isLength({ max: 100 }).withMessage('Nickname cannot exceed 100 characters'),

  validate,
];

module.exports = { addContactValidator };
