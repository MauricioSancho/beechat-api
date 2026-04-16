const { query, queryOne, execute, sql } = require('../../database/query');

/**
 * Upsert the identity public key for a user.
 * Each user has exactly one row (UNIQUE on user_id).
 */
async function upsertKeyBundle(userId, identityKey) {
  return execute(
    `MERGE E2EDeviceKeys AS target
     USING (SELECT @userId AS user_id) AS source ON target.user_id = source.user_id
     WHEN MATCHED THEN
       UPDATE SET target.identity_key = @identityKey,
                  target.key_version  = target.key_version + 1,
                  target.updated_at   = GETUTCDATE()
     WHEN NOT MATCHED THEN
       INSERT (user_id, identity_key, created_at, updated_at)
       VALUES (@userId, @identityKey, GETUTCDATE(), GETUTCDATE());`,
    [
      { name: 'userId',      type: sql.Int,          value: userId },
      { name: 'identityKey', type: sql.VarChar(512),  value: identityKey },
    ]
  );
}

/**
 * Get another user's identity public key.
 * Returns null if the user has not uploaded a key bundle.
 */
async function findKeyBundle(userId) {
  return queryOne(
    `SELECT user_id, identity_key, key_version, updated_at
     FROM E2EDeviceKeys
     WHERE user_id = @userId`,
    [{ name: 'userId', type: sql.Int, value: userId }]
  );
}

/**
 * Check whether a user has uploaded a key bundle.
 */
async function hasKeyBundle(userId) {
  const row = await queryOne(
    `SELECT 1 AS exists_flag FROM E2EDeviceKeys WHERE user_id = @userId`,
    [{ name: 'userId', type: sql.Int, value: userId }]
  );
  return row !== null;
}

/**
 * Get key bundles for multiple users at once (batch).
 * Returns array of { user_id, identity_key }.
 */
async function findKeyBundlesBatch(userIds) {
  if (!userIds || userIds.length === 0) return [];
  // Build parameterized list — safe since we cast to int
  const safeIds = userIds.map((id) => parseInt(id, 10)).filter(Boolean).join(',');
  if (!safeIds) return [];
  return query(
    `SELECT user_id, identity_key, key_version
     FROM E2EDeviceKeys
     WHERE user_id IN (${safeIds})`,
    []
  );
}

/**
 * Obtiene las claves de ambos participantes de un chat privado.
 * Verifica que el solicitante sea miembro del chat.
 * Devuelve array de { user_id, identity_key } para los dos participantes.
 */
async function findChatParticipantKeys(chatId, requesterId) {
  return query(
    `SELECT dk.user_id, dk.identity_key, dk.key_version
     FROM ChatMembers cm
     JOIN E2EDeviceKeys dk ON dk.user_id = cm.user_id
     WHERE cm.chat_id = @chatId
       AND cm.is_active = 1
       AND EXISTS (
         SELECT 1 FROM ChatMembers cm2
         WHERE cm2.chat_id = @chatId
           AND cm2.user_id = @requesterId
           AND cm2.is_active = 1
       )
     ORDER BY cm.user_id ASC`,
    [
      { name: 'chatId',      type: sql.Int, value: chatId },
      { name: 'requesterId', type: sql.Int, value: requesterId },
    ]
  );
}

module.exports = { upsertKeyBundle, findKeyBundle, hasKeyBundle, findKeyBundlesBatch, findChatParticipantKeys };
