const { body, param, validationResult } = require('express-validator');

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

const BASE64URL_RE = /^[A-Za-z0-9+/=_-]+$/;

const uploadBundleValidator = [
  body('identityKey')
    .isString().trim().notEmpty().withMessage('identityKey is required')
    .matches(BASE64URL_RE).withMessage('identityKey must be a base64 string')
    .isLength({ min: 40, max: 512 }).withMessage('identityKey length is invalid'),
  validate,
];

const getUserBundleValidator = [
  param('userId').isInt({ min: 1 }).withMessage('userId must be a positive integer'),
  validate,
];

const getBatchBundlesValidator = [
  body('userIds').isArray({ min: 1, max: 50 }).withMessage('userIds must be an array of 1–50 integers'),
  body('userIds.*').isInt({ min: 1 }).withMessage('Each userId must be a positive integer'),
  validate,
];

module.exports = { uploadBundleValidator, getUserBundleValidator, getBatchBundlesValidator };
