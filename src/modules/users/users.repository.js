const { query, queryOne, execute, sql } = require('../../database/query');

async function findById(id) {
  return queryOne(
    `SELECT id, uuid, phone, email, username, display_name, bio, avatar_url,
            is_verified, is_active, last_seen, created_at, updated_at
     FROM Users
     WHERE id = @id AND deleted_at IS NULL`,
    [{ name: 'id', type: sql.Int, value: id }]
  );
}

async function findByUsername(username) {
  return queryOne(
    `SELECT id FROM Users WHERE username = @username AND deleted_at IS NULL`,
    [{ name: 'username', type: sql.VarChar(50), value: username }]
  );
}

async function findByPhone(phone) {
  return queryOne(
    `SELECT id FROM Users WHERE phone = @phone AND deleted_at IS NULL`,
    [{ name: 'phone', type: sql.VarChar(20), value: phone }]
  );
}

async function updateProfile(id, { displayName, username }) {
  return queryOne(
    `UPDATE Users
     SET display_name = COALESCE(@displayName, display_name),
         username     = COALESCE(@username, username),
         updated_at   = GETUTCDATE()
     OUTPUT INSERTED.id, INSERTED.uuid, INSERTED.phone, INSERTED.email,
            INSERTED.username, INSERTED.display_name, INSERTED.bio,
            INSERTED.avatar_url, INSERTED.is_verified, INSERTED.is_active,
            INSERTED.last_seen, INSERTED.updated_at
     WHERE id = @id AND deleted_at IS NULL`,
    [
      { name: 'id',          type: sql.Int,        value: id },
      { name: 'displayName', type: sql.NVarChar(100), value: displayName || null },
      { name: 'username',    type: sql.VarChar(50), value: username || null },
    ]
  );
}

async function updateAvatar(id, avatarUrl) {
  return execute(
    `UPDATE Users SET avatar_url = @avatarUrl, updated_at = GETUTCDATE()
     WHERE id = @id AND deleted_at IS NULL`,
    [
      { name: 'id',        type: sql.Int,         value: id },
      { name: 'avatarUrl', type: sql.VarChar(500), value: avatarUrl },
    ]
  );
}

async function updateBio(id, bio) {
  return execute(
    `UPDATE Users SET bio = @bio, updated_at = GETUTCDATE()
     WHERE id = @id AND deleted_at IS NULL`,
    [
      { name: 'id',  type: sql.Int,          value: id },
      { name: 'bio', type: sql.NVarChar(300), value: bio || null },
    ]
  );
}

async function updatePhone(id, phone) {
  return execute(
    `UPDATE Users SET phone = @phone, updated_at = GETUTCDATE()
     WHERE id = @id AND deleted_at IS NULL`,
    [
      { name: 'id',    type: sql.Int,         value: id },
      { name: 'phone', type: sql.VarChar(20),  value: phone },
    ]
  );
}

async function searchUsers(searchTerm, excludeUserId, limit = 20) {
  return query(
    `SELECT TOP (@limit) id, uuid, username, display_name, avatar_url, bio, is_verified
     FROM Users
     WHERE (username LIKE @term OR display_name LIKE @term OR phone LIKE @term)
       AND id <> @excludeId
       AND is_active = 1
       AND deleted_at IS NULL
     ORDER BY display_name`,
    [
      { name: 'term',      type: sql.NVarChar(100), value: `%${searchTerm}%` },
      { name: 'excludeId', type: sql.Int,           value: excludeUserId },
      { name: 'limit',     type: sql.Int,           value: limit },
    ]
  );
}

module.exports = {
  findById,
  findByUsername,
  findByPhone,
  updateProfile,
  updateAvatar,
  updateBio,
  updatePhone,
  searchUsers,
};
