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

const createGroupValidator = [
  body('name').trim().notEmpty().withMessage('Group name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Group name must be 2-100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description too long'),
  body('memberIds').optional().isArray().withMessage('memberIds must be an array'),
  body('memberIds.*').optional().isInt({ min: 1 }).withMessage('Each memberId must be a positive integer'),
  validate,
];

const updateGroupValidator = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Group name must be 2-100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description too long'),
  validate,
];

const addMembersValidator = [
  body('userIds').isArray({ min: 1 }).withMessage('userIds must be a non-empty array'),
  body('userIds.*').isInt({ min: 1 }).withMessage('Each userId must be a positive integer'),
  validate,
];

const changeRoleValidator = [
  body('role').isIn(['admin', 'member']).withMessage('Role must be admin or member'),
  validate,
];

module.exports = { createGroupValidator, updateGroupValidator, addMembersValidator, changeRoleValidator };
