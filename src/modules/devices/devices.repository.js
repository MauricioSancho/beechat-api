const { query, queryOne, execute, sql } = require('../../database/query');

async function findByUserId(userId) {
  return query(
    `SELECT id, device_type, device_name, is_active, is_verified, last_active_at, created_at
     FROM UserDevices
     WHERE user_id = @userId
     ORDER BY created_at DESC`,
    [{ name: 'userId', type: sql.Int, value: userId }]
  );
}

async function findById(id, userId) {
  return queryOne(
    `SELECT id, user_id, device_type, device_name, push_token, is_active, is_verified
     FROM UserDevices
     WHERE id = @id AND user_id = @userId`,
    [
      { name: 'id',     type: sql.Int, value: id },
      { name: 'userId', type: sql.Int, value: userId },
    ]
  );
}

async function create({ userId, deviceType, deviceName, pushToken }) {
  return queryOne(
    `INSERT INTO UserDevices (user_id, device_type, device_name, push_token, is_active, created_at, updated_at)
     OUTPUT INSERTED.id, INSERTED.device_type, INSERTED.device_name, INSERTED.is_active,
            INSERTED.is_verified, INSERTED.created_at
     VALUES (@userId, @deviceType, @deviceName, @pushToken, 1, GETUTCDATE(), GETUTCDATE())`,
    [
      { name: 'userId',     type: sql.Int,          value: userId },
      { name: 'deviceType', type: sql.VarChar(10),  value: deviceType },
      { name: 'deviceName', type: sql.NVarChar(100), value: deviceName || null },
      { name: 'pushToken',  type: sql.VarChar(500),  value: pushToken || null },
    ]
  );
}

async function deactivate(id, userId) {
  return execute(
    `UPDATE UserDevices SET is_active = 0, updated_at = GETUTCDATE()
     WHERE id = @id AND user_id = @userId`,
    [
      { name: 'id',     type: sql.Int, value: id },
      { name: 'userId', type: sql.Int, value: userId },
    ]
  );
}

async function verify(id, userId) {
  return execute(
    `UPDATE UserDevices SET is_verified = 1, updated_at = GETUTCDATE()
     WHERE id = @id AND user_id = @userId`,
    [
      { name: 'id',     type: sql.Int, value: id },
      { name: 'userId', type: sql.Int, value: userId },
    ]
  );
}

module.exports = { findByUserId, findById, create, deactivate, verify };
