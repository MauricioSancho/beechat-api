const { query, queryOne, execute, withTransaction, sql } = require('../../database/query');

/**
 * Crea grupo en transacción: Chat + Group + ChatMembers + GroupMembers
 */
async function createGroup({ name, description, createdBy, memberIds }) {
  return withTransaction(async ({ queryOne: txQ, execute: txE }) => {
    // 1. Crear el chat de tipo group
    const chat = await txQ(
      `INSERT INTO Chats (type, created_by, created_at, updated_at)
       OUTPUT INSERTED.id, INSERTED.uuid, INSERTED.type
       VALUES ('group', @createdBy, GETUTCDATE(), GETUTCDATE())`,
      [{ name: 'createdBy', type: sql.Int, value: createdBy }]
    );

    // 2. Crear el grupo
    const group = await txQ(
      `INSERT INTO Groups (chat_id, name, description, created_by, created_at, updated_at)
       OUTPUT INSERTED.id, INSERTED.chat_id, INSERTED.name, INSERTED.description,
              INSERTED.avatar_url, INSERTED.created_by, INSERTED.created_at
       VALUES (@chatId, @name, @description, @createdBy, GETUTCDATE(), GETUTCDATE())`,
      [
        { name: 'chatId',      type: sql.Int,          value: chat.id },
        { name: 'name',        type: sql.NVarChar(100), value: name },
        { name: 'description', type: sql.NVarChar(500), value: description || null },
        { name: 'createdBy',   type: sql.Int,          value: createdBy },
      ]
    );

    // 3. Agregar creador como admin
    await txE(
      `INSERT INTO ChatMembers (chat_id, user_id, role, joined_at)
       VALUES (@chatId, @createdBy, 'admin', GETUTCDATE())`,
      [
        { name: 'chatId',    type: sql.Int, value: chat.id },
        { name: 'createdBy', type: sql.Int, value: createdBy },
      ]
    );
    await txE(
      `INSERT INTO GroupMembers (group_id, user_id, role, is_active, joined_at)
       VALUES (@groupId, @createdBy, 'admin', 1, GETUTCDATE())`,
      [
        { name: 'groupId',   type: sql.Int, value: group.id },
        { name: 'createdBy', type: sql.Int, value: createdBy },
      ]
    );

    // 4. Agregar miembros adicionales
    for (const memberId of memberIds || []) {
      if (memberId === createdBy) continue;
      await txE(
        `INSERT INTO ChatMembers (chat_id, user_id, role, joined_at) VALUES (@chatId, @userId, 'member', GETUTCDATE())`,
        [
          { name: 'chatId', type: sql.Int, value: chat.id },
          { name: 'userId', type: sql.Int, value: memberId },
        ]
      );
      await txE(
        `INSERT INTO GroupMembers (group_id, user_id, role, is_active, joined_at) VALUES (@groupId, @userId, 'member', 1, GETUTCDATE())`,
        [
          { name: 'groupId', type: sql.Int, value: group.id },
          { name: 'userId',  type: sql.Int, value: memberId },
        ]
      );
    }

    return { chat, group };
  });
}

async function findUserGroups(userId) {
  return query(
    `SELECT g.id, g.name, g.description, g.avatar_url, g.created_at,
            gm.role AS my_role,
            (SELECT COUNT(*) FROM GroupMembers WHERE group_id = g.id AND is_active = 1) AS member_count
     FROM Groups g
     JOIN GroupMembers gm ON gm.group_id = g.id AND gm.user_id = @userId AND gm.is_active = 1
     ORDER BY g.name`,
    [{ name: 'userId', type: sql.Int, value: userId }]
  );
}

async function findById(groupId, userId) {
  return queryOne(
    `SELECT g.id, g.name, g.description, g.avatar_url, g.chat_id, g.created_by, g.created_at,
            gm.role AS my_role
     FROM Groups g
     JOIN GroupMembers gm ON gm.group_id = g.id AND gm.user_id = @userId AND gm.is_active = 1
     WHERE g.id = @groupId`,
    [
      { name: 'groupId', type: sql.Int, value: groupId },
      { name: 'userId',  type: sql.Int, value: userId },
    ]
  );
}

async function findMembers(groupId) {
  return query(
    `SELECT gm.id, gm.role, gm.joined_at,
            u.id AS user_id, u.uuid, u.display_name, u.avatar_url, u.username
     FROM GroupMembers gm
     JOIN Users u ON u.id = gm.user_id
     WHERE gm.group_id = @groupId AND gm.is_active = 1
     ORDER BY gm.role DESC, u.display_name`,
    [{ name: 'groupId', type: sql.Int, value: groupId }]
  );
}

async function update(groupId, { name, description }) {
  return execute(
    `UPDATE Groups
     SET name = COALESCE(@name, name),
         description = COALESCE(@description, description),
         updated_at = GETUTCDATE()
     WHERE id = @groupId`,
    [
      { name: 'groupId',     type: sql.Int,          value: groupId },
      { name: 'name',        type: sql.NVarChar(100), value: name || null },
      { name: 'description', type: sql.NVarChar(500), value: description || null },
    ]
  );
}

async function updateAvatar(groupId, avatarUrl) {
  return execute(
    `UPDATE Groups SET avatar_url = @avatarUrl, updated_at = GETUTCDATE() WHERE id = @groupId`,
    [
      { name: 'groupId',   type: sql.Int,         value: groupId },
      { name: 'avatarUrl', type: sql.VarChar(500), value: avatarUrl },
    ]
  );
}

async function addMember(groupId, chatId, userId, role = 'member') {
  return withTransaction(async ({ execute: txE }) => {
    await txE(
      `INSERT INTO GroupMembers (group_id, user_id, role, is_active, joined_at) VALUES (@groupId, @userId, @role, 1, GETUTCDATE())`,
      [
        { name: 'groupId', type: sql.Int,        value: groupId },
        { name: 'userId',  type: sql.Int,        value: userId },
        { name: 'role',    type: sql.VarChar(10), value: role },
      ]
    );
    await txE(
      `INSERT INTO ChatMembers (chat_id, user_id, role, joined_at) VALUES (@chatId, @userId, @role, GETUTCDATE())`,
      [
        { name: 'chatId', type: sql.Int,        value: chatId },
        { name: 'userId', type: sql.Int,        value: userId },
        { name: 'role',   type: sql.VarChar(10), value: role },
      ]
    );
  });
}

async function removeMember(groupId, chatId, userId) {
  return withTransaction(async ({ execute: txE }) => {
    await txE(
      `UPDATE GroupMembers SET is_active = 0, left_at = GETUTCDATE() WHERE group_id = @groupId AND user_id = @userId`,
      [
        { name: 'groupId', type: sql.Int, value: groupId },
        { name: 'userId',  type: sql.Int, value: userId },
      ]
    );
    await txE(
      `UPDATE ChatMembers SET is_active = 0, left_at = GETUTCDATE() WHERE chat_id = @chatId AND user_id = @userId`,
      [
        { name: 'chatId', type: sql.Int, value: chatId },
        { name: 'userId', type: sql.Int, value: userId },
      ]
    );
  });
}

async function changeRole(groupId, userId, role) {
  return execute(
    `UPDATE GroupMembers SET role = @role WHERE group_id = @groupId AND user_id = @userId`,
    [
      { name: 'groupId', type: sql.Int,        value: groupId },
      { name: 'userId',  type: sql.Int,        value: userId },
      { name: 'role',    type: sql.VarChar(10), value: role },
    ]
  );
}

async function getMemberRole(groupId, userId) {
  const row = await queryOne(
    `SELECT role FROM GroupMembers WHERE group_id = @groupId AND user_id = @userId AND is_active = 1`,
    [
      { name: 'groupId', type: sql.Int, value: groupId },
      { name: 'userId',  type: sql.Int, value: userId },
    ]
  );
  return row ? row.role : null;
}

module.exports = {
  createGroup,
  findUserGroups,
  findById,
  findMembers,
  update,
  updateAvatar,
  addMember,
  removeMember,
  changeRole,
  getMemberRole,
};
