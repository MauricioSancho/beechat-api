const { query, queryOne, execute, sql } = require('../../database/query');

async function findByUserId(userId, { offset, limit }) {
  const [rows, countRow] = await Promise.all([
    query(
      `SELECT id, type, title, body, data_json, is_read, created_at
       FROM Notifications
       WHERE user_id = @userId
       ORDER BY created_at DESC
       OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
      [
        { name: 'userId', type: sql.Int, value: userId },
        { name: 'offset', type: sql.Int, value: offset },
        { name: 'limit',  type: sql.Int, value: limit },
      ]
    ),
    queryOne(
      `SELECT COUNT(1) AS total FROM Notifications WHERE user_id = @userId`,
      [{ name: 'userId', type: sql.Int, value: userId }]
    ),
  ]);

  return { rows, total: countRow ? countRow.total : 0 };
}

async function create({ userId, type, title, body, dataJson }) {
  return execute(
    `INSERT INTO Notifications (user_id, type, title, body, data_json, is_read, created_at)
     VALUES (@userId, @type, @title, @body, @dataJson, 0, GETUTCDATE())`,
    [
      { name: 'userId',   type: sql.Int,          value: userId },
      { name: 'type',     type: sql.VarChar(20),  value: type },
      { name: 'title',    type: sql.NVarChar(100), value: title },
      { name: 'body',     type: sql.NVarChar(500), value: body || null },
      { name: 'dataJson', type: sql.NVarChar(sql.MAX), value: dataJson || null },
    ]
  );
}

async function markAsRead(id, userId) {
  return execute(
    `UPDATE Notifications SET is_read = 1 WHERE id = @id AND user_id = @userId`,
    [
      { name: 'id',     type: sql.Int, value: id },
      { name: 'userId', type: sql.Int, value: userId },
    ]
  );
}

async function markAllAsRead(userId) {
  return execute(
    `UPDATE Notifications SET is_read = 1 WHERE user_id = @userId AND is_read = 0`,
    [{ name: 'userId', type: sql.Int, value: userId }]
  );
}

async function remove(id, userId) {
  return execute(
    `DELETE FROM Notifications WHERE id = @id AND user_id = @userId`,
    [
      { name: 'id',     type: sql.Int, value: id },
      { name: 'userId', type: sql.Int, value: userId },
    ]
  );
}

async function countUnread(userId) {
  const row = await queryOne(
    `SELECT COUNT(1) AS unread FROM Notifications WHERE user_id = @userId AND is_read = 0`,
    [{ name: 'userId', type: sql.Int, value: userId }]
  );
  return row ? row.unread : 0;
}

module.exports = { findByUserId, create, markAsRead, markAllAsRead, remove, countUnread };
