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

const getReq1Stats = asyncHandler(async (req, res) => sendSuccess(res, await adminService.getReq1Stats()));
const getReq2Stats = asyncHandler(async (req, res) => sendSuccess(res, await adminService.getReq2Stats()));
const getReq3Stats = asyncHandler(async (req, res) => sendSuccess(res, await adminService.getReq3Stats()));
const getReq4Stats = asyncHandler(async (req, res) => sendSuccess(res, await adminService.getReq4Stats()));
const getReq5Stats = asyncHandler(async (req, res) => sendSuccess(res, await adminService.getReq5Stats()));
const getReq6Stats = asyncHandler(async (req, res) => sendSuccess(res, await adminService.getReq6Stats()));
const getReq7Stats = asyncHandler(async (req, res) => sendSuccess(res, await adminService.getReq7Stats()));
const getReq8Stats = asyncHandler(async (req, res) => sendSuccess(res, await adminService.getReq8Stats()));

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

module.exports = {
  login,
  getDashboard,
  getReq1Stats, getReq2Stats, getReq3Stats, getReq4Stats,
  getReq5Stats, getReq6Stats, getReq7Stats, getReq8Stats,
  listUsers,
  toggleUserStatus,
  getActivity,
};