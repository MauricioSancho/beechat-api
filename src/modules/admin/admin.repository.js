const { query, queryOne, execute, sql } = require('../../database/query');

async function findAdminByEmail(email) {
  return queryOne(
    `SELECT id, username, email, password_hash, role, is_active
     FROM AdminUsers
     WHERE email = @email`,
    [{ name: 'email', type: sql.VarChar(255), value: email }]
  );
}

async function getDashboardStats() {
  const [users, chats, messages, stories] = await Promise.all([
    queryOne(`SELECT COUNT(1) AS total,
                     SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active,
                     SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) AS verified,
                     SUM(CASE WHEN DATEDIFF(day, created_at, GETUTCDATE()) <= 7 THEN 1 ELSE 0 END) AS new_this_week
              FROM Users WHERE deleted_at IS NULL`, []),

    queryOne(`SELECT COUNT(1) AS total FROM Chats WHERE deleted_at IS NULL`, []),

    queryOne(`SELECT COUNT(1) AS total FROM Messages WHERE is_deleted = 0`, []),

    queryOne(`SELECT COUNT(1) AS total FROM Stories WHERE is_active = 1 AND expires_at > GETUTCDATE()`, []),
  ]);

  return { users, chats, messages, stories };
}

async function findUsers({ offset, limit, search }) {
  const searchFilter = search ? 'AND (username LIKE @search OR display_name LIKE @search OR email LIKE @search OR phone LIKE @search)' : '';

  const [rows, countRow] = await Promise.all([
    query(
      `SELECT id, uuid, phone, email, username, display_name, avatar_url,
              is_verified, is_active, last_seen, created_at
       FROM Users
       WHERE deleted_at IS NULL ${searchFilter}
       ORDER BY created_at DESC
       OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
      [
        { name: 'offset', type: sql.Int, value: offset },
        { name: 'limit',  type: sql.Int, value: limit },
        ...(search ? [{ name: 'search', type: sql.NVarChar(100), value: `%${search}%` }] : []),
      ]
    ),
    queryOne(
      `SELECT COUNT(1) AS total FROM Users WHERE deleted_at IS NULL ${searchFilter}`,
      search ? [{ name: 'search', type: sql.NVarChar(100), value: `%${search}%` }] : []
    ),
  ]);

  return { rows, total: countRow ? countRow.total : 0 };
}

async function toggleUserStatus(userId, isActive) {
  return execute(
    `UPDATE Users SET is_active = @isActive, updated_at = GETUTCDATE() WHERE id = @userId`,
    [
      { name: 'userId',   type: sql.Int, value: userId },
      { name: 'isActive', type: sql.Bit, value: isActive ? 1 : 0 },
    ]
  );
}

async function getRecentActivity(limit = 20) {
  return query(
    `SELECT TOP (@limit)
       al.id, al.action, al.entity_type, al.entity_id,
       al.ip_address, al.created_at,
       u.username, u.display_name
     FROM AuditLogs al
     LEFT JOIN Users u ON u.id = al.user_id
     ORDER BY al.created_at DESC`,
    [{ name: 'limit', type: sql.Int, value: limit }]
  );
}

async function logAction({ userId, action, entityType, entityId, detailsJson, ipAddress }) {
  return execute(
    `INSERT INTO AuditLogs (user_id, action, entity_type, entity_id, details_json, ip_address, created_at)
     VALUES (@userId, @action, @entityType, @entityId, @detailsJson, @ipAddress, GETUTCDATE())`,
    [
      { name: 'userId',      type: sql.Int,          value: userId || null },
      { name: 'action',      type: sql.VarChar(100),  value: action },
      { name: 'entityType',  type: sql.VarChar(50),   value: entityType || null },
      { name: 'entityId',    type: sql.Int,           value: entityId || null },
      { name: 'detailsJson', type: sql.NVarChar(sql.MAX), value: detailsJson || null },
      { name: 'ipAddress',   type: sql.VarChar(45),   value: ipAddress || null },
    ]
  );
}

module.exports = {
  findAdminByEmail,
  getDashboardStats,
  findUsers,
  toggleUserStatus,
  getRecentActivity,
  logAction,
};
