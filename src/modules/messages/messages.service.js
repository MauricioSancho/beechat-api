const messagesRepo = require('./messages.repository');
const chatsRepo = require('../chats/chats.repository');
const { ERRORS } = require('../../shared/constants');

async function listMessages(chatId, userId, pagination) {
  // Verificar membresía
  const isMember = await chatsRepo.isMember(chatId, userId);
  if (!isMember) throw ERRORS.FORBIDDEN('You are not a member of this chat');

  const { rows, total } = await messagesRepo.findByChatId(chatId, pagination);

  // Parsear el JSON de adjuntos que viene de la query
  const messages = rows.map((m) => ({
    ...m,
    attachments: m.attachments ? JSON.parse(m.attachments) : [],
  }));

  return { messages, total };
}

async function sendMessage(chatId, senderId, { content, messageType, replyToId, attachment }) {
  const isMember = await chatsRepo.isMember(chatId, senderId);
  if (!isMember) throw ERRORS.FORBIDDEN('You are not a member of this chat');

  if (!content && !attachment) throw ERRORS.BAD_REQUEST('Message must have content or an attachment');

  const message = await messagesRepo.create({
    chatId,
    senderId,
    content,
    messageType: messageType || 'text',
    replyToId,
  });

  // Guardar adjunto si lo hay
  if (attachment) {
    await messagesRepo.createAttachment(message.id, attachment);
  }

  // Registrar estado inicial 'sent' para el remitente
  await messagesRepo.createStatus(message.id, senderId, 'sent');

  // Actualizar timestamp del chat
  messagesRepo.updateChatTimestamp(chatId).catch(() => {});

  return message;
}

async function editMessage(messageId, senderId, content) {
  const message = await messagesRepo.findById(messageId);
  if (!message) throw ERRORS.NOT_FOUND('Message');
  if (message.sender_id !== senderId) throw ERRORS.FORBIDDEN('Cannot edit another user\'s message');

  const affected = await messagesRepo.updateContent(messageId, senderId, content);
  if (!affected) throw ERRORS.NOT_FOUND('Message');

  return messagesRepo.findById(messageId);
}

async function deleteMessage(messageId, senderId) {
  const message = await messagesRepo.findById(messageId);
  if (!message) throw ERRORS.NOT_FOUND('Message');
  if (message.sender_id !== senderId) throw ERRORS.FORBIDDEN('Cannot delete another user\'s message');

  await messagesRepo.softDelete(messageId, senderId);
}

async function forwardMessage(messageId, senderId, targetChatId) {
  const original = await messagesRepo.findById(messageId);
  if (!original) throw ERRORS.NOT_FOUND('Message');

  const isMember = await chatsRepo.isMember(targetChatId, senderId);
  if (!isMember) throw ERRORS.FORBIDDEN('You are not a member of the target chat');

  const forwarded = await messagesRepo.create({
    chatId: targetChatId,
    senderId,
    content: original.content,
    messageType: original.message_type,
    replyToId: null,
  });

  await messagesRepo.createStatus(forwarded.id, senderId, 'sent');
  messagesRepo.updateChatTimestamp(targetChatId).catch(() => {});

  return forwarded;
}

module.exports = { listMessages, sendMessage, editMessage, deleteMessage, forwardMessage };
