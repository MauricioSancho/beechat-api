const groupsService = require('./groups.service');
const { sendSuccess, sendCreated, sendMessage, asyncHandler } = require('../../utils/response.helper');

const createGroup = asyncHandler(async (req, res) => {
  const { name, description, memberIds } = req.body;
  const group = await groupsService.createGroup(req.user.id, { name, description, memberIds });
  return sendCreated(res, group);
});

const listGroups = asyncHandler(async (req, res) => {
  const groups = await groupsService.listGroups(req.user.id);
  return sendSuccess(res, groups);
});

const getGroupById = asyncHandler(async (req, res) => {
  const group = await groupsService.getGroupById(parseInt(req.params.groupId, 10), req.user.id);
  return sendSuccess(res, group);
});

const updateGroup = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const updated = await groupsService.updateGroup(parseInt(req.params.groupId, 10), req.user.id, { name, description });
  return sendSuccess(res, updated);
});

const updateGroupAvatar = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'No image provided' } });
  const avatarUrl = `${process.env.BASE_URL}/uploads/images/${req.file.filename}`;
  const group = await groupsService.updateGroupAvatar(parseInt(req.params.groupId, 10), req.user.id, avatarUrl);
  return sendSuccess(res, group);
});

const addMembers = asyncHandler(async (req, res) => {
  await groupsService.addMembers(parseInt(req.params.groupId, 10), req.user.id, req.body.userIds);
  return sendMessage(res, 'Members added');
});

const removeMember = asyncHandler(async (req, res) => {
  await groupsService.removeMember(
    parseInt(req.params.groupId, 10),
    req.user.id,
    parseInt(req.params.userId, 10)
  );
  return sendMessage(res, 'Member removed');
});

const changeMemberRole = asyncHandler(async (req, res) => {
  await groupsService.changeRole(
    parseInt(req.params.groupId, 10),
    req.user.id,
    parseInt(req.params.userId, 10),
    req.body.role
  );
  return sendMessage(res, 'Role updated');
});

const leaveGroup = asyncHandler(async (req, res) => {
  await groupsService.leaveGroup(parseInt(req.params.groupId, 10), req.user.id);
  return sendMessage(res, 'Left the group');
});

module.exports = {
  createGroup,
  listGroups,
  getGroupById,
  updateGroup,
  updateGroupAvatar,
  addMembers,
  removeMember,
  changeMemberRole,
  leaveGroup,
};
