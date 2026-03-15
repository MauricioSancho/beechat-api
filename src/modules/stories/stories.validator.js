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

const createStoryValidator = [
  body('contentType')
    .notEmpty().withMessage('contentType is required')
    .isIn(['text', 'image', 'video']).withMessage('contentType must be text, image or video'),

  body('textContent')
    .if(body('contentType').equals('text'))
    .notEmpty().withMessage('textContent is required for text stories')
    .isLength({ max: 500 }).withMessage('Text story cannot exceed 500 characters'),

  body('bgColor')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('bgColor must be a valid hex color'),

  validate,
];

module.exports = { createStoryValidator };
