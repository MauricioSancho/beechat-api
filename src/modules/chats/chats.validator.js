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

const createPrivateChatValidator = [
  body('targetUserId')
    .notEmpty().withMessage('targetUserId is required')
    .isInt({ min: 1 }).withMessage('targetUserId must be a positive integer'),
  validate,
];

module.exports = { createPrivateChatValidator };
