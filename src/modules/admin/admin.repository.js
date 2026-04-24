const { query, queryOne, execute, sql } = require('../../database/query');

// ─────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────
async function findAdminByEmail(email) {
  return queryOne(
    `SELECT id, username, email, password_hash, role, is_active
     FROM AdminUsers
     WHERE email = @email`,
    [{ name: 'email', type: sql.VarChar(255), value: email }]
  );
}

// ─────────────────────────────────────────────────────────────────
// Dashboard general (ya existía)
// ─────────────────────────────────────────────────────────────────
async function getDashboardStats() {
  const [users, chats, messages, stories] = await Promise.all([
    queryOne(
      `SELECT COUNT(1) AS total,
              SUM(CASE WHEN is_active  = 1 THEN 1 ELSE 0 END) AS active,
              SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) AS verified,
              SUM(CASE WHEN DATEDIFF(day, created_at, GETUTCDATE()) <= 7 THEN 1 ELSE 0 END) AS new_this_week
       FROM Users WHERE deleted_at IS NULL`, []
    ),
    queryOne(`SELECT COUNT(1) AS total FROM Chats WHERE deleted_at IS NULL`, []),
    queryOne(`SELECT COUNT(1) AS total FROM Messages WHERE is_deleted = 0`, []),
    queryOne(`SELECT COUNT(1) AS total FROM Stories WHERE is_active = 1 AND expires_at > GETUTCDATE()`, []),
  ]);

  return { users, chats, messages, stories };
}

// ─────────────────────────────────────────────────────────────────
// REQ-1 — Registro y verificación
// ─────────────────────────────────────────────────────────────────
async function getReq1Stats() {
  const [counts, recent] = await Promise.all([
    queryOne(
      `SELECT
         COUNT(1) AS total,
         SUM(CASE WHEN CAST(created_at AS DATE) = CAST(GETUTCDATE() AS DATE) THEN 1 ELSE 0 END) AS registered_today,
         SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) AS verified,
         SUM(CASE WHEN is_verified = 0 AND is_active = 1 THEN 1 ELSE 0 END) AS pending,
         SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS blocked
       FROM Users WHERE deleted_at IS NULL`, []
    ),
    query(
      `SELECT TOP 10
         id, display_name, username, phone, email,
         is_verified, is_active, created_at
       FROM Users
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC`, []
    ),
  ]);

  return { counts, recent };
}

// ─────────────────────────────────────────────────────────────────
// REQ-2 — Gestión de grupos
// ─────────────────────────────────────────────────────────────────
async function getReq2Stats() {
  const [counts, recent] = await Promise.all([
    queryOne(
      `SELECT
         COUNT(1) AS total,
         SUM(CASE WHEN CAST(g.created_at AS DATE) = CAST(GETUTCDATE() AS DATE) THEN 1 ELSE 0 END) AS created_today,
         (SELECT COUNT(1) FROM Groups g2
          JOIN Chats c ON c.id = g2.chat_id
          WHERE c.deleted_at IS NULL
            AND EXISTS (
              SELECT 1 FROM Messages m
              WHERE m.chat_id = c.id
                AND m.is_deleted = 0
                AND CAST(m.created_at AS DATE) = CAST(GETUTCDATE() AS DATE)
            )
         ) AS active_today
       FROM Groups g`, []
    ),
    query(
      `SELECT TOP 10
         g.id, g.name, g.created_at,
         (SELECT COUNT(1) FROM GroupMembers gm WHERE gm.group_id = g.id AND gm.is_active = 1) AS member_count,
         (SELECT COUNT(1) FROM Messages m JOIN Chats c ON c.id = m.chat_id WHERE c.id = g.chat_id AND m.is_deleted = 0) AS message_count,
         u.display_name AS admin_name
       FROM Groups g
       LEFT JOIN Users u ON u.id = g.created_by
       ORDER BY g.created_at DESC`, []
    ),
  ]);

  return { counts, recent };
}

// ─────────────────────────────────────────────────────────────────
// REQ-3 — Mensajes
// ─────────────────────────────────────────────────────────────────
async function getReq3Stats() {
  const [counts, deliveryStats, recent] = await Promise.all([
    queryOne(
      `SELECT
         COUNT(1) AS total,
         SUM(CASE WHEN CAST(created_at AS DATE) = CAST(GETUTCDATE() AS DATE) THEN 1 ELSE 0 END) AS today,
         SUM(CASE WHEN message_type = 'text'  THEN 1 ELSE 0 END) AS text_count,
         SUM(CASE WHEN message_type = 'image' THEN 1 ELSE 0 END) AS image_count,
         SUM(CASE WHEN message_type = 'audio' THEN 1 ELSE 0 END) AS audio_count
       FROM Messages WHERE is_deleted = 0`, []
    ),
    queryOne(
      `SELECT
         COUNT(1) AS total_statuses,
         SUM(CASE WHEN status IN ('delivered','read') THEN 1 ELSE 0 END) AS delivered,
         SUM(CASE WHEN status = 'read'               THEN 1 ELSE 0 END) AS read_count,
         SUM(CASE WHEN status = 'sent'               THEN 1 ELSE 0 END) AS sent_only
       FROM MessageStatus`, []
    ),
    query(
      `SELECT TOP 10
         m.id, m.message_type, m.created_at,
         ms_agg.status,
         sender.display_name AS sender_name,
         CASE WHEN c.type = 'private'
              THEN receiver.display_name
              ELSE g.name
         END AS target_name
       FROM Messages m
       JOIN Users sender ON sender.id = m.sender_id
       JOIN Chats c ON c.id = m.chat_id
       LEFT JOIN Groups g ON g.chat_id = c.id
       OUTER APPLY (
         SELECT TOP 1 status
         FROM MessageStatus
         WHERE message_id = m.id
         ORDER BY updated_at DESC
       ) ms_agg
       OUTER APPLY (
         SELECT TOP 1 u.display_name
         FROM ChatMembers cm
         JOIN Users u ON u.id = cm.user_id
         WHERE cm.chat_id = c.id AND cm.user_id <> m.sender_id AND cm.is_active = 1
       ) receiver
       WHERE m.is_deleted = 0
       ORDER BY m.created_at DESC`, []
    ),
  ]);

  return { counts, deliveryStats, recent };
}

// ─────────────────────────────────────────────────────────────────
// REQ-4 — Contactos y chats
// ─────────────────────────────────────────────────────────────────
async function getReq4Stats() {
  const [counts, chatStats, recentUsers] = await Promise.all([
    queryOne(
      `SELECT
         COUNT(1) AS total_contacts,
         COUNT(DISTINCT owner_id) AS users_with_contacts
       FROM Contacts`, []
    ),
    queryOne(
      `SELECT
         COUNT(1) AS total,
         SUM(CASE WHEN is_pinned   = 1 THEN 1 ELSE 0 END) AS pinned,
         SUM(CASE WHEN is_archived = 1 THEN 1 ELSE 0 END) AS archived
       FROM ChatMembers WHERE is_active = 1`, []
    ),
    query(
      `SELECT TOP 10
         u.id, u.display_name, u.username, u.last_seen,
         (SELECT COUNT(1) FROM Contacts c WHERE c.owner_id = u.id) AS contact_count,
         (SELECT COUNT(1) FROM ChatMembers cm WHERE cm.user_id = u.id AND cm.is_active = 1) AS chat_count,
         (SELECT COUNT(1) FROM ChatMembers cm WHERE cm.user_id = u.id AND cm.is_archived = 1) AS archived_count,
         (SELECT COUNT(1) FROM ChatMembers cm WHERE cm.user_id = u.id AND cm.is_pinned = 1) AS pinned_count
       FROM Users u
       WHERE u.deleted_at IS NULL
       ORDER BY u.last_seen DESC`, []
    ),
  ]);

  return { counts, chatStats, recentUsers };
}

// ─────────────────────────────────────────────────────────────────
// REQ-5 — Cifrado E2E
// ─────────────────────────────────────────────────────────────────
async function getReq5Stats() {
  const [keyCounts, deviceCounts, recentKeys] = await Promise.all([
    queryOne(
      `SELECT
         COUNT(1) AS total_keys,
         SUM(CASE WHEN CAST(updated_at AS DATE) = CAST(GETUTCDATE() AS DATE) THEN 1 ELSE 0 END) AS rotated_today,
         SUM(CASE WHEN key_version > 1 THEN 1 ELSE 0 END) AS rotated_ever,
         AVG(CAST(key_version AS FLOAT)) AS avg_version
       FROM E2EDeviceKeys`, []
    ),
    queryOne(
      `SELECT
         COUNT(1) AS total_devices,
         SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_devices,
         SUM(CASE WHEN device_type = 'android' THEN 1 ELSE 0 END) AS android,
         SUM(CASE WHEN device_type = 'ios'     THEN 1 ELSE 0 END) AS ios,
         SUM(CASE WHEN device_type = 'web'     THEN 1 ELSE 0 END) AS web
       FROM UserDevices`, []
    ),
    query(
      `SELECT TOP 10
         e.user_id, e.key_version, e.updated_at,
         u.display_name, u.username
       FROM E2EDeviceKeys e
       JOIN Users u ON u.id = e.user_id
       ORDER BY e.updated_at DESC`, []
    ),
  ]);

  return { keyCounts, deviceCounts, recentKeys };
}

// ─────────────────────────────────────────────────────────────────
// REQ-6 — Multimedia
// ─────────────────────────────────────────────────────────────────
async function getReq6Stats() {
  const [totals, byType, recent] = await Promise.all([
    queryOne(
      `SELECT
         COUNT(1) AS total_files,
         SUM(CASE WHEN CAST(ma.created_at AS DATE) = CAST(GETUTCDATE() AS DATE) THEN 1 ELSE 0 END) AS today,
         SUM(COALESCE(ma.file_size, 0)) AS total_bytes,
         SUM(CASE WHEN COALESCE(ma.file_size, 0) = 0 THEN 1 ELSE 0 END) AS unknown_size
       FROM MessageAttachments ma
       JOIN Messages m ON m.id = ma.message_id
       WHERE m.is_deleted = 0`, []
    ),
    query(
      `SELECT
         CASE
           WHEN file_type LIKE 'image/%'       THEN 'Imagenes'
           WHEN file_type LIKE 'audio/%'       THEN 'Audios'
           WHEN file_type LIKE 'video/%'       THEN 'Videos'
           WHEN file_type LIKE 'application/%' THEN 'Documentos'
           ELSE 'Otros'
         END AS type_label,
         COUNT(1) AS file_count,
         SUM(COALESCE(file_size, 0)) AS total_bytes
       FROM MessageAttachments ma
       JOIN Messages m ON m.id = ma.message_id
       WHERE m.is_deleted = 0
       GROUP BY
         CASE
           WHEN file_type LIKE 'image/%'       THEN 'Imagenes'
           WHEN file_type LIKE 'audio/%'       THEN 'Audios'
           WHEN file_type LIKE 'video/%'       THEN 'Videos'
           WHEN file_type LIKE 'application/%' THEN 'Documentos'
           ELSE 'Otros'
         END`, []
    ),
    query(
      `SELECT TOP 10
         ma.id, ma.file_name, ma.file_type, ma.file_size, ma.created_at,
         u.display_name AS sender_name
       FROM MessageAttachments ma
       JOIN Messages m  ON m.id  = ma.message_id
       JOIN Users    u  ON u.id  = m.sender_id
       WHERE m.is_deleted = 0
       ORDER BY ma.created_at DESC`, []
    ),
  ]);

  return { totals, byType, recent };
}

// ─────────────────────────────────────────────────────────────────
// REQ-7 — Perfiles y descripciones
// ─────────────────────────────────────────────────────────────────
async function getReq7Stats() {
  const [statusDist, editedToday, recent] = await Promise.all([
    queryOne(
      `SELECT
         COUNT(1) AS total,
         SUM(CASE WHEN bio IS NOT NULL AND bio <> '' THEN 1 ELSE 0 END) AS with_bio,
         SUM(CASE WHEN CAST(updated_at AS DATE) = CAST(GETUTCDATE() AS DATE) THEN 1 ELSE 0 END) AS updated_today
       FROM Users WHERE deleted_at IS NULL`, []
    ),
    queryOne(
      `SELECT COUNT(1) AS count
       FROM Users
       WHERE deleted_at IS NULL
         AND CAST(updated_at AS DATE) = CAST(GETUTCDATE() AS DATE)`, []
    ),
    query(
      `SELECT TOP 10
         id, display_name, username, bio, updated_at, is_active, is_verified
       FROM Users
       WHERE deleted_at IS NULL
       ORDER BY updated_at DESC`, []
    ),
  ]);

  return { statusDist, editedToday, recent };
}

// ─────────────────────────────────────────────────────────────────
// REQ-8 — Stories
// ─────────────────────────────────────────────────────────────────
async function getReq8Stats() {
  const [counts, expiring, muteCount, recent] = await Promise.all([
    queryOne(
      `SELECT
         COUNT(1) AS active,
         SUM(CASE WHEN CAST(created_at AS DATE) = CAST(GETUTCDATE() AS DATE) THEN 1 ELSE 0 END) AS published_today,
         SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS deleted,
         (SELECT COUNT(1) FROM StoryViews) AS total_views
       FROM Stories`, []
    ),
    queryOne(
      `SELECT
         SUM(CASE WHEN DATEDIFF(MINUTE, GETUTCDATE(), expires_at) <= 60   THEN 1 ELSE 0 END) AS expires_1h,
         SUM(CASE WHEN DATEDIFF(MINUTE, GETUTCDATE(), expires_at) <= 360  THEN 1 ELSE 0 END) AS expires_6h,
         SUM(CASE WHEN DATEDIFF(MINUTE, GETUTCDATE(), expires_at) <= 720  THEN 1 ELSE 0 END) AS expires_12h
       FROM Stories
       WHERE is_active = 1 AND expires_at > GETUTCDATE()`, []
    ),
    queryOne(`SELECT COUNT(1) AS total FROM StoryMutes`, []),
    query(
      `SELECT TOP 10
         s.id, s.content_type, s.text_content, s.is_active, s.expires_at, s.created_at,
         u.display_name, u.username,
         (SELECT COUNT(1) FROM StoryViews sv WHERE sv.story_id = s.id) AS view_count
       FROM Stories s
       JOIN Users u ON u.id = s.user_id
       ORDER BY s.created_at DESC`, []
    ),
  ]);

  return { counts, expiring, muteCount, recent };
}

// ─────────────────────────────────────────────────────────────────
// Users list (ya existía)
// ─────────────────────────────────────────────────────────────────
async function findUsers({ offset, limit, search }) {
  const searchFilter = search
    ? 'AND (username LIKE @search OR display_name LIKE @search OR email LIKE @search OR phone LIKE @search)'
    : '';

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

// ─────────────────────────────────────────────────────────────────
// Toggle user status + activity log (ya existían)
// ─────────────────────────────────────────────────────────────────
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
      { name: 'userId',      type: sql.Int,              value: userId || null },
      { name: 'action',      type: sql.VarChar(100),     value: action },
      { name: 'entityType',  type: sql.VarChar(50),      value: entityType || null },
      { name: 'entityId',    type: sql.Int,              value: entityId || null },
      { name: 'detailsJson', type: sql.NVarChar(sql.MAX),value: detailsJson || null },
      { name: 'ipAddress',   type: sql.VarChar(45),      value: ipAddress || null },
    ]
  );
}

module.exports = {
  findAdminByEmail,
  getDashboardStats,
  getReq1Stats,
  getReq2Stats,
  getReq3Stats,
  getReq4Stats,
  getReq5Stats,
  getReq6Stats,
  getReq7Stats,
  getReq8Stats,
  findUsers,
  toggleUserStatus,
  getRecentActivity,
  logAction,
};