const usersService = require('./users.service');
const { sendSuccess, sendMessage, asyncHandler } = require('../../utils/response.helper');

const getMe = asyncHandler(async (req, res) => {
  const user = await usersService.getProfile(req.user.id);
  return sendSuccess(res, user);
});

const updateMe = asyncHandler(async (req, res) => {
  // Flutter envía display_name (snake_case); admitir ambas variantes
  const displayName = req.body.display_name || req.body.displayName || null;
  const { username, bio } = req.body;
  const updated = await usersService.updateProfile(req.user.id, { displayName, username, bio });
  return sendSuccess(res, updated);
});

const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: { code: 'BAD_REQUEST', message: 'No image file provided' },
    });
  }
  const avatarUrl = `${process.env.BASE_URL}/uploads/images/${req.file.filename}`;
  const user = await usersService.updateAvatar(req.user.id, avatarUrl);
  return sendSuccess(res, user);
});

const updateBio = asyncHandler(async (req, res) => {
  await usersService.updateBio(req.user.id, req.body.bio);
  return sendMessage(res, 'Bio updated successfully');
});

const updatePhone = asyncHandler(async (req, res) => {
  await usersService.updatePhone(req.user.id, req.body.phone);
  return sendMessage(res, 'Phone updated successfully');
});

const searchUsers = asyncHandler(async (req, res) => {
  const users = await usersService.searchUsers(req.query.q, req.user.id);
  return sendSuccess(res, users);
});

module.exports = { getMe, updateMe, updateAvatar, updateBio, updatePhone, searchUsers };
