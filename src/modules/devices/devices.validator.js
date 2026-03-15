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

const registerDeviceValidator = [
  body('deviceType')
    .notEmpty().withMessage('Device type is required')
    .isIn(['android', 'ios', 'web']).withMessage('Device type must be android, ios or web'),

  body('deviceName')
    .optional().trim().isLength({ max: 100 }).withMessage('Device name too long'),

  body('pushToken')
    .optional().trim().isLength({ max: 500 }).withMessage('Push token too long'),

  validate,
];

module.exports = { registerDeviceValidator };
