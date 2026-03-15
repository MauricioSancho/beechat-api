const chatsService = require('./chats.service');
const { sendSuccess, sendCreated, sendMessage, asyncHandler } = require('../../utils/response.helper');

const listChats = asyncHandler(async (req, res) => {
  const chats = await chatsService.listChats(req.user.id);
  return sendSuccess(res, chats);
});

const createPrivateChat = asyncHandler(async (req, res) => {
  const { targetUserId } = req.body;
  const { chat, created } = await chatsService.createOrGetPrivateChat(
    req.user.id,
    parseInt(targetUserId, 10)
  );
  return created ? sendCreated(res, chat) : sendSuccess(res, chat);
});

const getChatById = asyncHandler(async (req, res) => {
  const chat = await chatsService.getChatById(parseInt(req.params.chatId, 10), req.user.id);
  return sendSuccess(res, chat);
});

const deleteChat = asyncHandler(async (req, res) => {
  await chatsService.deleteChat(parseInt(req.params.chatId, 10), req.user.id);
  return sendMessage(res, 'Chat deleted');
});

const archiveChat = asyncHandler(async (req, res) => {
  const result = await chatsService.archiveChat(parseInt(req.params.chatId, 10), req.user.id);
  return sendSuccess(res, result);
});

const pinChat = asyncHandler(async (req, res) => {
  const result = await chatsService.pinChat(parseInt(req.params.chatId, 10), req.user.id);
  return sendSuccess(res, result);
});

const markAsRead = asyncHandler(async (req, res) => {
  await chatsService.markChatAsRead(parseInt(req.params.chatId, 10), req.user.id);
  return sendMessage(res, 'Messages marked as read');
});

module.exports = { listChats, createPrivateChat, getChatById, deleteChat, archiveChat, pinChat, markAsRead };
