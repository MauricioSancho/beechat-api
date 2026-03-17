const pollsRepo  = require('./polls.repository');
const chatsRepo  = require('../chats/chats.repository');
const messagesRepo = require('../messages/messages.repository');
const { ERRORS } = require('../../shared/constants');

async function createPoll(chatId, senderId, { question, options, allowMultiple }) {
  const isMember = await chatsRepo.isMember(chatId, senderId);
  if (!isMember) throw ERRORS.FORBIDDEN('You are not a member of this chat');

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    throw ERRORS.BAD_REQUEST('Poll question is required');
  }
  if (!Array.isArray(options) || options.length < 2) {
    throw ERRORS.BAD_REQUEST('Poll must have at least 2 options');
  }
  if (options.length > 10) {
    throw ERRORS.BAD_REQUEST('Poll can have at most 10 options');
  }

  const optionTexts = options.map((o) => (typeof o === 'string' ? o : o.text ?? '').trim());
  if (optionTexts.some((t) => !t)) throw ERRORS.BAD_REQUEST('All poll options must have text');

  const { message, poll } = await pollsRepo.create({
    chatId,
    senderId,
    question: question.trim(),
    options: optionTexts,
    allowMultiple: !!allowMultiple,
  });

  // Create message status for all chat participants
  const participants = await chatsRepo.findParticipants(chatId);
  await Promise.all(
    participants.map((p) => messagesRepo.createStatus(message.id, p.id, 'sent'))
  );
  messagesRepo.updateChatTimestamp(chatId).catch(() => {});

  return {
    ...message,
    status: 'sent',
    poll,
  };
}

async function votePoll(chatId, pollId, optionId, userId) {
  const isMember = await chatsRepo.isMember(chatId, userId);
  if (!isMember) throw ERRORS.FORBIDDEN('You are not a member of this chat');

  await pollsRepo.vote({ pollId, optionId, userId });

  // Return the updated message
  const row = await pollsRepo.findMessageByPollId(pollId);
  if (!row) throw ERRORS.NOT_FOUND('Poll');

  const updatedPoll = await pollsRepo.findByMessageId(row.id, userId);

  return {
    id: row.id,
    uuid: row.uuid,
    chat_id: row.chat_id,
    sender_id: row.sender_id,
    sender_name: row.sender_name,
    sender_avatar: row.sender_avatar,
    content: row.content,
    message_type: 'poll',
    is_deleted: row.is_deleted,
    is_edited: row.is_edited,
    created_at: row.created_at,
    status: 'sent',
    poll: updatedPoll,
  };
}

module.exports = { createPoll, votePoll };
