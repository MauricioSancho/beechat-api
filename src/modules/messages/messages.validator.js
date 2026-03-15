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

const sendMessageValidator = [
  body('content')
    .optional().trim().isLength({ max: 10000 }).withMessage('Message content too long'),

  body('messageType')
    .optional()
    .isIn(['text', 'image', 'video', 'audio', 'document'])
    .withMessage('Invalid message type'),

  body('replyToId')
    .optional().isInt({ min: 1 }).withMessage('replyToId must be a positive integer'),

  validate,
];

const editMessageValidator = [
  body('content')
    .notEmpty().withMessage('Content is required')
    .trim().isLength({ max: 10000 }).withMessage('Content too long'),
  validate,
];

const forwardMessageValidator = [
  body('targetChatId')
    .notEmpty().withMessage('targetChatId is required')
    .isInt({ min: 1 }).withMessage('targetChatId must be a positive integer'),
  validate,
];

const listMessagesValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  validate,
];

module.exports = {
  sendMessageValidator,
  editMessageValidator,
  forwardMessageValidator,
  listMessagesValidator,
};
