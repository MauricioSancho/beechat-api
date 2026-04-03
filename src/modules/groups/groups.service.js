const groupsRepo = require('./groups.repository');
const usersRepo = require('../users/users.repository');
const { ERRORS } = require('../../shared/constants');

async function createGroup(createdBy, { name, description, memberIds }) {
  const { chat, group } = await groupsRepo.createGroup({ name, description, createdBy, memberIds });
  const members = await groupsRepo.findMembers(group.id);
  return { ...group, chatId: chat.id, members };
}

async function listGroups(userId) {
  return groupsRepo.findUserGroups(userId);
}

async function getGroupById(groupId, userId) {
  const group = await groupsRepo.findById(groupId, userId);
  if (!group) throw ERRORS.NOT_FOUND('Group');

  const members = await groupsRepo.findMembers(groupId);
  return { ...group, members };
}

async function updateGroup(groupId, userId, { name, description }) {
  const role = await groupsRepo.getMemberRole(groupId, userId);
  if (!role) throw ERRORS.NOT_FOUND('Group');
  if (role !== 'admin') throw ERRORS.FORBIDDEN('Only group admins can edit the group');

  await groupsRepo.update(groupId, { name, description });
  return groupsRepo.findById(groupId, userId);
}

async function updateGroupAvatar(groupId, userId, avatarUrl) {
  const role = await groupsRepo.getMemberRole(groupId, userId);
  if (!role) throw ERRORS.NOT_FOUND('Group');
  if (role !== 'admin') throw ERRORS.FORBIDDEN('Only admins can change the group avatar');

  await groupsRepo.updateAvatar(groupId, avatarUrl);
  const group = await groupsRepo.findById(groupId, userId);
  const members = await groupsRepo.findMembers(groupId);
  return { ...group, members };
}

async function addMembers(groupId, adminId, userIds) {
  const group = await groupsRepo.findById(groupId, adminId);
  if (!group) throw ERRORS.NOT_FOUND('Group');
  if (group.my_role !== 'admin') throw ERRORS.FORBIDDEN('Only admins can add members');

  for (const userId of userIds) {
    const user = await usersRepo.findById(userId);
    if (!user) continue; // Saltar IDs inválidos silenciosamente
    const existingRole = await groupsRepo.getMemberRole(groupId, userId);
    if (existingRole) continue; // Ya es miembro
    await groupsRepo.addMember(groupId, group.chat_id, userId);
  }
}

async function removeMember(groupId, adminId, targetUserId) {
  const group = await groupsRepo.findById(groupId, adminId);
  if (!group) throw ERRORS.NOT_FOUND('Group');
  if (group.my_role !== 'admin') throw ERRORS.FORBIDDEN('Only admins can remove members');
  if (targetUserId === adminId) throw ERRORS.BAD_REQUEST('Use the leave endpoint to exit the group');

  // Un admin no puede eliminar a otro admin — debe quitarle el rol primero
  const targetRole = await groupsRepo.getMemberRole(groupId, targetUserId);
  if (!targetRole) throw ERRORS.NOT_FOUND('Member not found in this group');
  if (targetRole === 'admin') {
    throw ERRORS.FORBIDDEN('Cannot remove an admin. Demote them to member first.');
  }

  await groupsRepo.removeMember(groupId, group.chat_id, targetUserId);
}

async function changeRole(groupId, adminId, targetUserId, role) {
  const group = await groupsRepo.findById(groupId, adminId);
  if (!group) throw ERRORS.NOT_FOUND('Group');
  if (group.my_role !== 'admin') throw ERRORS.FORBIDDEN('Only admins can change roles');

  const targetRole = await groupsRepo.getMemberRole(groupId, targetUserId);
  if (!targetRole) throw ERRORS.NOT_FOUND('Member');

  await groupsRepo.changeRole(groupId, targetUserId, role);
}

async function leaveGroup(groupId, userId) {
  const group = await groupsRepo.findById(groupId, userId);
  if (!group) throw ERRORS.NOT_FOUND('Group');

  await groupsRepo.removeMember(groupId, group.chat_id, userId);
}

module.exports = {
  createGroup,
  listGroups,
  getGroupById,
  updateGroup,
  updateGroupAvatar,
  addMembers,
  removeMember,
  changeRole,
  leaveGroup,
};
