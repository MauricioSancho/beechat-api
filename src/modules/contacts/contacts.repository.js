const { query, queryOne, execute, sql } = require('../../database/query');

async function findAllByOwner(ownerId) {
  return query(
    `SELECT c.id, c.nickname, c.created_at,
            u.id AS user_id, u.uuid, u.username, u.display_name, u.avatar_url,
            u.bio, u.is_verified, u.last_seen,
            CASE WHEN b.id IS NOT NULL THEN 1 ELSE 0 END AS is_blocked
     FROM Contacts c
     JOIN Users u ON u.id = c.contact_user_id
     LEFT JOIN BlockedContacts b ON b.blocker_id = @ownerId AND b.blocked_id = c.contact_user_id
     WHERE c.owner_id = @ownerId
       AND u.deleted_at IS NULL
     ORDER BY u.display_name`,
    [{ name: 'ownerId', type: sql.Int, value: ownerId }]
  );
}

async function findPair(ownerId, contactUserId) {
  return queryOne(
    `SELECT id FROM Contacts WHERE owner_id = @ownerId AND contact_user_id = @contactUserId`,
    [
      { name: 'ownerId',       type: sql.Int, value: ownerId },
      { name: 'contactUserId', type: sql.Int, value: contactUserId },
    ]
  );
}

async function create(ownerId, contactUserId, nickname) {
  return queryOne(
    `INSERT INTO Contacts (owner_id, contact_user_id, nickname, created_at, updated_at)
     OUTPUT INSERTED.*
     VALUES (@ownerId, @contactUserId, @nickname, GETUTCDATE(), GETUTCDATE())`,
    [
      { name: 'ownerId',       type: sql.Int,          value: ownerId },
      { name: 'contactUserId', type: sql.Int,          value: contactUserId },
      { name: 'nickname',      type: sql.NVarChar(100), value: nickname || null },
    ]
  );
}

async function remove(ownerId, contactUserId) {
  return execute(
    `DELETE FROM Contacts WHERE owner_id = @ownerId AND contact_user_id = @contactUserId`,
    [
      { name: 'ownerId',       type: sql.Int, value: ownerId },
      { name: 'contactUserId', type: sql.Int, value: contactUserId },
    ]
  );
}

async function isBlocked(blockerId, blockedId) {
  const row = await queryOne(
    `SELECT 1 AS found FROM BlockedContacts WHERE blocker_id = @blockerId AND blocked_id = @blockedId`,
    [
      { name: 'blockerId', type: sql.Int, value: blockerId },
      { name: 'blockedId', type: sql.Int, value: blockedId },
    ]
  );
  return !!row;
}

async function block(blockerId, blockedId) {
  return execute(
    `INSERT INTO BlockedContacts (blocker_id, blocked_id, created_at)
     VALUES (@blockerId, @blockedId, GETUTCDATE())`,
    [
      { name: 'blockerId', type: sql.Int, value: blockerId },
      { name: 'blockedId', type: sql.Int, value: blockedId },
    ]
  );
}

async function unblock(blockerId, blockedId) {
  return execute(
    `DELETE FROM BlockedContacts WHERE blocker_id = @blockerId AND blocked_id = @blockedId`,
    [
      { name: 'blockerId', type: sql.Int, value: blockerId },
      { name: 'blockedId', type: sql.Int, value: blockedId },
    ]
  );
}

async function updateNickname(ownerId, contactUserId, nickname) {
  return execute(
    `UPDATE Contacts SET nickname = @nickname, updated_at = GETUTCDATE()
     WHERE owner_id = @ownerId AND contact_user_id = @contactUserId`,
    [
      { name: 'ownerId',       type: sql.Int,           value: ownerId },
      { name: 'contactUserId', type: sql.Int,           value: contactUserId },
      { name: 'nickname',      type: sql.NVarChar(100), value: nickname || null },
    ]
  );
}

module.exports = { findAllByOwner, findPair, create, remove, updateNickname, isBlocked, block, unblock };
