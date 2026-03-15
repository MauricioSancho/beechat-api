const messagesService = require('./messages.service');
const { sendSuccess, sendCreated, sendMessage, sendPaginated, asyncHandler } = require('../../utils/response.helper');
const { parsePagination } = require('../../utils/pagination.helper');

const listMessages = asyncHandler(async (req, res) => {
  const chatId = parseInt(req.params.chatId, 10);
  const { page, limit, offset } = parsePagination(req.query);

  const { messages, total } = await messagesService.listMessages(chatId, req.user.id, { offset, limit });
  return sendPaginated(res, messages, total, page, limit);
});

const sendMsg = asyncHandler(async (req, res) => {
  const chatId = parseInt(req.params.chatId, 10);
  const { content, messageType, replyToId } = req.body;

  // Si hay archivo adjunto (multimedia)
  let attachment = null;
  if (req.file) {
    const typeDir = req.file.destination.split('/').pop();
    const fileUrl = `${process.env.BASE_URL}/uploads/${typeDir}/${req.file.filename}`;
    attachment = {
      fileUrl,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      fileName: req.file.originalname,
    };
  }

  const msg = await messagesService.sendMessage(chatId, req.user.id, {
    content,
    messageType,
    replyToId: replyToId ? parseInt(replyToId, 10) : null,
    attachment,
  });

  return sendCreated(res, msg);
});

const editMsg = asyncHandler(async (req, res) => {
  const messageId = parseInt(req.params.messageId, 10);
  const updated = await messagesService.editMessage(messageId, req.user.id, req.body.content);
  return sendSuccess(res, updated);
});

const deleteMsg = asyncHandler(async (req, res) => {
  await messagesService.deleteMessage(parseInt(req.params.messageId, 10), req.user.id);
  return sendMessage(res, 'Message deleted');
});

const forwardMsg = asyncHandler(async (req, res) => {
  const forwarded = await messagesService.forwardMessage(
    parseInt(req.params.messageId, 10),
    req.user.id,
    parseInt(req.body.targetChatId, 10)
  );
  return sendCreated(res, forwarded);
});

module.exports = { listMessages, sendMsg, editMsg, deleteMsg, forwardMsg };
