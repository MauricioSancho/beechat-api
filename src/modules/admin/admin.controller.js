const adminService = require('./admin.service');
const { sendSuccess, sendPaginated, sendMessage, asyncHandler } = require('../../utils/response.helper');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await adminService.login({ email, password });
  return sendSuccess(res, result);
});

const getDashboard = asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboard();
  return sendSuccess(res, stats);
});

const listUsers = asyncHandler(async (req, res) => {
  const { users, total, page, limit } = await adminService.listUsers(req.query);
  return sendPaginated(res, users, total, page, limit);
});

const toggleUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  await adminService.toggleUserStatus(parseInt(req.params.userId, 10), isActive);
  return sendMessage(res, `User ${isActive ? 'activated' : 'deactivated'}`);
});

const getActivity = asyncHandler(async (req, res) => {
  const activity = await adminService.getActivity();
  return sendSuccess(res, activity);
});

module.exports = { login, getDashboard, listUsers, toggleUserStatus, getActivity };
