const { query, queryOne, execute, withTransaction, sql } = require('../../database/query');

/**
 * Busca un chat privado existente entre dos usuarios
 */
async function findPrivateChat(userId1, userId2) {
  return queryOne(
    `SELECT c.id, c.uuid, c.type, c.created_at
     FROM Chats c
     JOIN ChatMembers cm1 ON cm1.chat_id = c.id AND cm1.user_id = @userId1 AND cm1.is_active = 1
     JOIN ChatMembers cm2 ON cm2.chat_id = c.id AND cm2.user_id = @userId2 AND cm2.is_active = 1
     WHERE c.type = 'private' AND c.deleted_at IS NULL`,
    [
      { name: 'userId1', type: sql.Int, value: userId1 },
      { name: 'userId2', type: sql.Int, value: userId2 },
    ]
  );
}

/**
 * Crea un chat privado con sus dos miembros en una transacción
 */
async function createPrivateChat(userId1, userId2) {
  return withTransaction(async ({ queryOne: txQ, execute: txE }) => {
    const chat = await txQ(
      `INSERT INTO Chats (type, created_by, created_at, updated_at)
       OUTPUT INSERTED.id, INSERTED.uuid, INSERTED.type, INSERTED.created_at
       VALUES ('private', @userId1, GETUTCDATE(), GETUTCDATE())`,
      [{ name: 'userId1', type: sql.Int, value: userId1 }]
    );

    await txE(
      `INSERT INTO ChatMembers (chat_id, user_id, role, joined_at)
       VALUES (@chatId, @userId1, 'member', GETUTCDATE()),
              (@chatId, @userId2, 'member', GETUTCDATE())`,
      [
        { name: 'chatId',  type: sql.Int, value: chat.id },
        { name: 'userId1', type: sql.Int, value: userId1 },
        { name: 'userId2', type: sql.Int, value: userId2 },
      ]
    );

    return chat;
  });
}

/**
 * Lista todos los chats de un usuario con el último mensaje y conteo de no leídos
 */
async function findUserChats(userId) {
  return query(
    `SELECT
       c.id, c.uuid, c.type,
       cm.is_archived, cm.is_pinned,
       -- Computed name and avatar for both private and group chats
       CASE WHEN c.type = 'private' THEN other.display_name ELSE g.name END AS name,
       CASE WHEN c.type = 'private' THEN other.avatar_url ELSE g.avatar_url END AS avatar_url,
       -- Último mensaje
       lm.id AS last_message_id,
       lm.sender_id AS last_message_sender_id,
       lm.content AS last_message_content,
       lm.message_type AS last_message_type,
       lm.created_at AS last_message_at,
       lm_sender.display_name AS last_message_sender,
       -- Si yo soy el remitente → mínimo entre destinatarios; si soy receptor → mi propio estado
       CASE
         WHEN lm.sender_id = @userId THEN
           COALESCE(
             (SELECT CASE
                WHEN MIN(CASE ms_r.status WHEN 'read'      THEN 3
                                          WHEN 'delivered' THEN 2
                                          ELSE 1 END) = 3 THEN 'read'
                WHEN MAX(CASE ms_r.status WHEN 'read'      THEN 3
                                          WHEN 'delivered' THEN 2
                                          ELSE 1 END) >= 2 THEN 'delivered'
                ELSE 'sent'
              END
              FROM MessageStatus ms_r
              WHERE ms_r.message_id = lm.id AND ms_r.user_id <> lm.sender_id),
             'sent')
         ELSE COALESCE(ms_lm.status, 'sent')
       END AS last_message_status,
       -- Para chats privados: datos del otro usuario
       other.id AS other_user_id, other.uuid AS other_uuid,
       other.display_name AS other_display_name,
       other.avatar_url AS other_avatar_url,
       other.last_seen AS other_last_seen,
       -- Para grupos
       g.id AS group_id, g.name AS group_name, g.description AS group_description, g.avatar_url AS group_avatar_url,
       -- Conteo no leídos
       (SELECT COUNT(*)
        FROM Messages m2
        JOIN MessageStatus ms2 ON ms2.message_id = m2.id AND ms2.user_id = @userId
        WHERE m2.chat_id = c.id AND ms2.status <> 'read' AND m2.is_deleted = 0
       ) AS unread_count
     FROM Chats c
     JOIN ChatMembers cm ON cm.chat_id = c.id AND cm.user_id = @userId AND cm.is_active = 1
     LEFT JOIN Messages lm ON lm.id = (
       SELECT TOP 1 id FROM Messages
       WHERE chat_id = c.id AND is_deleted = 0
       ORDER BY created_at DESC
     )
     LEFT JOIN Users lm_sender ON lm_sender.id = lm.sender_id
     LEFT JOIN MessageStatus ms_lm ON ms_lm.message_id = lm.id AND ms_lm.user_id = @userId
     OUTER APPLY (
       SELECT TOP 1 cm2.user_id
       FROM ChatMembers cm2
       WHERE cm2.chat_id = c.id
         AND cm2.user_id <> @userId
         AND cm2.is_active = 1
         AND c.type = 'private'
     ) cm_other
     LEFT JOIN Users other ON other.id = cm_other.user_id
     LEFT JOIN Groups g ON g.chat_id = c.id AND c.type = 'group'
     WHERE c.deleted_at IS NULL
     ORDER BY cm.is_pinned DESC, COALESCE(lm.created_at, c.created_at) DESC`,
    [{ name: 'userId', type: sql.Int, value: userId }]
  );
}

async function findById(chatId, userId) {
  return queryOne(
    `SELECT c.id, c.uuid, c.type, c.created_at,
            cm.is_archived, cm.is_pinned, cm.role,
            CASE WHEN c.type = 'private' THEN other.display_name ELSE g.name END AS name,
            CASE WHEN c.type = 'private' THEN other.avatar_url  ELSE g.avatar_url END AS avatar_url,
            g.id AS group_id, g.description AS group_description
     FROM Chats c
     JOIN ChatMembers cm ON cm.chat_id = c.id AND cm.user_id = @userId AND cm.is_active = 1
     OUTER APPLY (
       SELECT TOP 1 cm2.user_id
       FROM ChatMembers cm2
       WHERE cm2.chat_id = c.id
         AND cm2.user_id <> @userId
         AND cm2.is_active = 1
         AND c.type = 'private'
     ) cm_other
     LEFT JOIN Users other ON other.id = cm_other.user_id
     LEFT JOIN Groups g ON g.chat_id = c.id AND c.type = 'group'
     WHERE c.id = @chatId AND c.deleted_at IS NULL`,
    [
      { name: 'chatId', type: sql.Int, value: chatId },
      { name: 'userId', type: sql.Int, value: userId },
    ]
  );
}

async function findParticipants(chatId) {
  return query(
    `SELECT u.id, u.display_name, u.avatar_url, cm.role
     FROM ChatMembers cm
     JOIN Users u ON u.id = cm.user_id
     WHERE cm.chat_id = @chatId AND cm.is_active = 1
     ORDER BY CASE cm.role WHEN 'admin' THEN 0 ELSE 1 END, u.display_name ASC`,
    [{ name: 'chatId', type: sql.Int, value: chatId }]
  );
}

async function softDelete(chatId, userId) {
  // Solo eliminar para el usuario actual (marcar como inactivo en ChatMembers)
  return execute(
    `UPDATE ChatMembers SET is_active = 0, left_at = GETUTCDATE()
     WHERE chat_id = @chatId AND user_id = @userId`,
    [
      { name: 'chatId', type: sql.Int, value: chatId },
      { name: 'userId', type: sql.Int, value: userId },
    ]
  );
}

async function setArchived(chatId, userId, archived) {
  return execute(
    `UPDATE ChatMembers SET is_archived = @archived
     WHERE chat_id = @chatId AND user_id = @userId`,
    [
      { name: 'chatId',   type: sql.Int, value: chatId },
      { name: 'userId',   type: sql.Int, value: userId },
      { name: 'archived', type: sql.Bit, value: archived ? 1 : 0 },
    ]
  );
}

async function setPinned(chatId, userId, pinned) {
  return execute(
    `UPDATE ChatMembers SET is_pinned = @pinned
     WHERE chat_id = @chatId AND user_id = @userId`,
    [
      { name: 'chatId',  type: sql.Int, value: chatId },
      { name: 'userId',  type: sql.Int, value: userId },
      { name: 'pinned',  type: sql.Bit, value: pinned ? 1 : 0 },
    ]
  );
}

async function markAllAsRead(chatId, userId) {
  return execute(
    `MERGE MessageStatus AS target
     USING (
       SELECT m.id AS message_id
       FROM Messages m
       WHERE m.chat_id = @chatId AND m.is_deleted = 0
     ) AS source
     ON target.message_id = source.message_id AND target.user_id = @userId
     WHEN MATCHED AND target.status <> 'read' THEN
       UPDATE SET target.status = 'read', target.updated_at = GETUTCDATE()
     WHEN NOT MATCHED THEN
       INSERT (message_id, user_id, status, updated_at)
       VALUES (source.message_id, @userId, 'read', GETUTCDATE());`,
    [
      { name: 'chatId', type: sql.Int, value: chatId },
      { name: 'userId', type: sql.Int, value: userId },
    ]
  );
}

async function clearMessages(chatId) {
  return execute(
    `UPDATE Messages
     SET is_deleted = 1, content = NULL, updated_at = GETUTCDATE()
     WHERE chat_id = @chatId AND is_deleted = 0`,
    [{ name: 'chatId', type: sql.Int, value: chatId }]
  );
}

async function isMember(chatId, userId) {
  const row = await queryOne(
    `SELECT 1 AS found FROM ChatMembers
     WHERE chat_id = @chatId AND user_id = @userId AND is_active = 1`,
    [
      { name: 'chatId', type: sql.Int, value: chatId },
      { name: 'userId', type: sql.Int, value: userId },
    ]
  );
  return !!row;
}

module.exports = {
  findPrivateChat,
  createPrivateChat,
  findUserChats,
  findById,
  findParticipants,
  softDelete,
  setArchived,
  setPinned,
  markAllAsRead,
  clearMessages,
  isMember,
};
