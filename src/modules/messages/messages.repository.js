const { query, queryOne, execute, sql } = require('../../database/query');

async function findByChatId(chatId, { offset, limit }) {
  const [rows, countRow] = await Promise.all([
    query(
      `SELECT
         m.id, m.uuid, m.chat_id, m.message_type, m.content,
         m.reply_to_id, m.is_edited, m.is_deleted, m.created_at, m.updated_at,
         u.id AS sender_id, u.uuid AS sender_uuid,
         u.display_name AS sender_name, u.avatar_url AS sender_avatar,
         -- Adjuntos del mensaje
         (SELECT file_url, file_type, file_size, file_name
          FROM MessageAttachments WHERE message_id = m.id
          FOR JSON PATH) AS attachments,
         -- Estado del mensaje para el remitente
         ms.status AS my_status
       FROM Messages m
       JOIN Users u ON u.id = m.sender_id
       LEFT JOIN MessageStatus ms ON ms.message_id = m.id AND ms.user_id = m.sender_id
       WHERE m.chat_id = @chatId AND m.is_deleted = 0
       ORDER BY m.created_at DESC
       OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
      [
        { name: 'chatId', type: sql.Int, value: chatId },
        { name: 'offset', type: sql.Int, value: offset },
        { name: 'limit',  type: sql.Int, value: limit },
      ]
    ),
    queryOne(
      `SELECT COUNT(1) AS total FROM Messages WHERE chat_id = @chatId AND is_deleted = 0`,
      [{ name: 'chatId', type: sql.Int, value: chatId }]
    ),
  ]);

  return { rows, total: countRow ? countRow.total : 0 };
}

async function findById(messageId) {
  return queryOne(
    `SELECT id, uuid, chat_id, sender_id, content, message_type,
            reply_to_id, is_edited, is_deleted, created_at, updated_at
     FROM Messages
     WHERE id = @id AND is_deleted = 0`,
    [{ name: 'id', type: sql.Int, value: messageId }]
  );
}

async function create({ chatId, senderId, content, messageType, replyToId }) {
  return queryOne(
    `INSERT INTO Messages (chat_id, sender_id, content, message_type, reply_to_id, created_at, updated_at)
     OUTPUT INSERTED.id, INSERTED.uuid, INSERTED.chat_id, INSERTED.sender_id,
            INSERTED.content, INSERTED.message_type, INSERTED.reply_to_id,
            INSERTED.is_edited, INSERTED.created_at
     VALUES (@chatId, @senderId, @content, @messageType, @replyToId, GETUTCDATE(), GETUTCDATE())`,
    [
      { name: 'chatId',      type: sql.Int,         value: chatId },
      { name: 'senderId',    type: sql.Int,         value: senderId },
      { name: 'content',     type: sql.NVarChar(sql.MAX), value: content || null },
      { name: 'messageType', type: sql.VarChar(15),  value: messageType || 'text' },
      { name: 'replyToId',   type: sql.Int,         value: replyToId || null },
    ]
  );
}

async function createAttachment(messageId, { fileUrl, fileType, fileSize, fileName }) {
  return execute(
    `INSERT INTO MessageAttachments (message_id, file_url, file_type, file_size, file_name, created_at)
     VALUES (@messageId, @fileUrl, @fileType, @fileSize, @fileName, GETUTCDATE())`,
    [
      { name: 'messageId', type: sql.Int,          value: messageId },
      { name: 'fileUrl',   type: sql.VarChar(500),  value: fileUrl },
      { name: 'fileType',  type: sql.VarChar(50),   value: fileType || null },
      { name: 'fileSize',  type: sql.BigInt,        value: fileSize || null },
      { name: 'fileName',  type: sql.NVarChar(255), value: fileName || null },
    ]
  );
}

async function createStatus(messageId, userId, status = 'sent') {
  return execute(
    `INSERT INTO MessageStatus (message_id, user_id, status, updated_at)
     VALUES (@messageId, @userId, @status, GETUTCDATE())`,
    [
      { name: 'messageId', type: sql.Int,        value: messageId },
      { name: 'userId',    type: sql.Int,        value: userId },
      { name: 'status',    type: sql.VarChar(10), value: status },
    ]
  );
}

async function updateContent(messageId, senderId, content) {
  return execute(
    `UPDATE Messages
     SET content = @content, is_edited = 1, updated_at = GETUTCDATE()
     WHERE id = @id AND sender_id = @senderId AND is_deleted = 0`,
    [
      { name: 'id',       type: sql.Int,          value: messageId },
      { name: 'senderId', type: sql.Int,          value: senderId },
      { name: 'content',  type: sql.NVarChar(sql.MAX), value: content },
    ]
  );
}

async function softDelete(messageId, senderId) {
  return execute(
    `UPDATE Messages
     SET is_deleted = 1, content = NULL, updated_at = GETUTCDATE()
     WHERE id = @id AND sender_id = @senderId`,
    [
      { name: 'id',       type: sql.Int, value: messageId },
      { name: 'senderId', type: sql.Int, value: senderId },
    ]
  );
}

async function updateChatTimestamp(chatId) {
  return execute(
    `UPDATE Chats SET updated_at = GETUTCDATE() WHERE id = @chatId`,
    [{ name: 'chatId', type: sql.Int, value: chatId }]
  );
}

module.exports = {
  findByChatId,
  findById,
  create,
  createAttachment,
  createStatus,
  updateContent,
  softDelete,
  updateChatTimestamp,
};
