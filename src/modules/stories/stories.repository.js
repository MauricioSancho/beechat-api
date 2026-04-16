const { query, queryOne, execute, sql } = require('../../database/query');

async function create({ userId, contentType, contentUrl, textContent, bgColor }) {
  return queryOne(
    `INSERT INTO Stories (user_id, content_type, content_url, text_content, bg_color, expires_at, is_active, created_at)
     OUTPUT INSERTED.id, INSERTED.user_id, INSERTED.content_type, INSERTED.content_url,
            INSERTED.text_content, INSERTED.bg_color, INSERTED.expires_at, INSERTED.created_at
     VALUES (@userId, @contentType, @contentUrl, @textContent, @bgColor,
             DATEADD(HOUR, 24, GETUTCDATE()), 1, GETUTCDATE())`,
    [
      { name: 'userId',      type: sql.Int,          value: userId },
      { name: 'contentType', type: sql.VarChar(10),   value: contentType },
      { name: 'contentUrl',  type: sql.VarChar(500),  value: contentUrl || null },
      { name: 'textContent', type: sql.NVarChar(500), value: textContent || null },
      { name: 'bgColor',     type: sql.VarChar(10),   value: bgColor || '#000000' },
    ]
  );
}

/**
 * Stories visibles para un usuario: de sus contactos (no silenciados) + las propias
 */
async function findVisible(userId) {
  return query(
    `SELECT s.id, s.content_type, s.content_url, s.text_content, s.bg_color,
            s.expires_at, s.created_at,
            u.id AS user_id, u.uuid AS user_uuid, u.display_name, u.avatar_url,
            (SELECT COUNT(*) FROM StoryViews sv WHERE sv.story_id = s.id) AS view_count,
            CASE WHEN sv_me.id IS NOT NULL THEN 1 ELSE 0 END AS viewed_by_me
     FROM Stories s
     JOIN Users u ON u.id = s.user_id
     LEFT JOIN StoryViews sv_me ON sv_me.story_id = s.id AND sv_me.viewer_id = @userId
     WHERE s.is_active = 1
       AND s.expires_at > GETUTCDATE()
       AND (
         s.user_id = @userId
         OR s.user_id IN (
           SELECT contact_user_id FROM Contacts WHERE owner_id = @userId
         )
       )
       AND s.user_id NOT IN (
         SELECT muted_user_id FROM StoryMutes WHERE user_id = @userId
       )
     ORDER BY (SELECT MAX(s2.created_at) FROM Stories s2 WHERE s2.user_id = u.id AND s2.is_active = 1) DESC,
              s.created_at ASC`,
    [{ name: 'userId', type: sql.Int, value: userId }]
  );
}

async function findById(storyId) {
  return queryOne(
    `SELECT id, user_id, content_type, content_url, text_content, bg_color, expires_at, is_active, created_at
     FROM Stories WHERE id = @storyId`,
    [{ name: 'storyId', type: sql.Int, value: storyId }]
  );
}

async function deactivate(storyId, userId) {
  return execute(
    `UPDATE Stories SET is_active = 0 WHERE id = @storyId AND user_id = @userId`,
    [
      { name: 'storyId', type: sql.Int, value: storyId },
      { name: 'userId',  type: sql.Int, value: userId },
    ]
  );
}

async function addView(storyId, viewerId) {
  // Ignorar si ya vio el story (MERGE o solo intentar INSERT)
  return execute(
    `IF NOT EXISTS (SELECT 1 FROM StoryViews WHERE story_id = @storyId AND viewer_id = @viewerId)
       INSERT INTO StoryViews (story_id, viewer_id, viewed_at) VALUES (@storyId, @viewerId, GETUTCDATE())`,
    [
      { name: 'storyId',  type: sql.Int, value: storyId },
      { name: 'viewerId', type: sql.Int, value: viewerId },
    ]
  );
}

async function findViewers(storyId) {
  return query(
    `SELECT sv.viewed_at, u.id AS user_id, u.uuid, u.display_name, u.avatar_url
     FROM StoryViews sv
     JOIN Users u ON u.id = sv.viewer_id
     WHERE sv.story_id = @storyId
     ORDER BY sv.viewed_at DESC`,
    [{ name: 'storyId', type: sql.Int, value: storyId }]
  );
}

async function mute(userId, mutedUserId) {
  return execute(
    `IF NOT EXISTS (SELECT 1 FROM StoryMutes WHERE user_id = @userId AND muted_user_id = @mutedUserId)
       INSERT INTO StoryMutes (user_id, muted_user_id, created_at) VALUES (@userId, @mutedUserId, GETUTCDATE())`,
    [
      { name: 'userId',       type: sql.Int, value: userId },
      { name: 'mutedUserId',  type: sql.Int, value: mutedUserId },
    ]
  );
}

async function unmute(userId, mutedUserId) {
  return execute(
    `DELETE FROM StoryMutes WHERE user_id = @userId AND muted_user_id = @mutedUserId`,
    [
      { name: 'userId',      type: sql.Int, value: userId },
      { name: 'mutedUserId', type: sql.Int, value: mutedUserId },
    ]
  );
}

/**
 * Desactiva todas las stories cuyo expires_at ya pasó.
 * Devuelve el número de filas afectadas.
 */
async function deactivateExpired() {
  const result = await execute(
    `UPDATE Stories
     SET is_active = 0
     WHERE is_active = 1 AND expires_at <= GETUTCDATE()`
  );
  return result?.rowsAffected?.[0] ?? 0;
}

module.exports = { create, findVisible, findById, deactivate, addView, findViewers, mute, unmute, deactivateExpired };
