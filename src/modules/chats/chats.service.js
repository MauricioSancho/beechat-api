const chatsRepo = require('./chats.repository');
const usersRepo = require('../users/users.repository');
const { ERRORS } = require('../../shared/constants');

async function listChats(userId) {
  return chatsRepo.findUserChats(userId);
}

async function createOrGetPrivateChat(userId, targetUserId) {
  if (userId === targetUserId) throw ERRORS.BAD_REQUEST('Cannot create chat with yourself');

  const target = await usersRepo.findById(targetUserId);
  if (!target) throw ERRORS.NOT_FOUND('User');

  // Idempotente: si ya existe, retornar el existente
  const existing = await chatsRepo.findPrivateChat(userId, targetUserId);
  if (existing) {
    return {
      chat: { ...existing, name: target.display_name, avatar_url: target.avatar_url },
      created: false,
    };
  }

  const chat = await chatsRepo.createPrivateChat(userId, targetUserId);
  return {
    chat: { ...chat, name: target.display_name, avatar_url: target.avatar_url },
    created: true,
  };
}

async function getChatById(chatId, userId) {
  const chat = await chatsRepo.findById(chatId, userId);
  if (!chat) throw ERRORS.NOT_FOUND('Chat');
  const participants = await chatsRepo.findParticipants(chatId);
  return { ...chat, participants };
}

async function deleteChat(chatId, userId) {
  const isMember = await chatsRepo.isMember(chatId, userId);
  if (!isMember) throw ERRORS.NOT_FOUND('Chat');
  await chatsRepo.softDelete(chatId, userId);
}

async function archiveChat(chatId, userId) {
  const chat = await chatsRepo.findById(chatId, userId);
  if (!chat) throw ERRORS.NOT_FOUND('Chat');
  await chatsRepo.setArchived(chatId, userId, !chat.is_archived);
  return { archived: !chat.is_archived };
}

async function pinChat(chatId, userId) {
  const chat = await chatsRepo.findById(chatId, userId);
  if (!chat) throw ERRORS.NOT_FOUND('Chat');
  await chatsRepo.setPinned(chatId, userId, !chat.is_pinned);
  return { pinned: !chat.is_pinned };
}

async function markChatAsRead(chatId, userId) {
  const isMember = await chatsRepo.isMember(chatId, userId);
  if (!isMember) throw ERRORS.NOT_FOUND('Chat');
  await chatsRepo.markAllAsRead(chatId, userId);
}

async function clearChatHistory(chatId, userId) {
  const isMember = await chatsRepo.isMember(chatId, userId);
  if (!isMember) throw ERRORS.NOT_FOUND('Chat');
  await chatsRepo.clearMessages(chatId);
}

module.exports = {
  listChats,
  createOrGetPrivateChat,
  getChatById,
  deleteChat,
  archiveChat,
  pinChat,
  markChatAsRead,
  clearChatHistory,
};
