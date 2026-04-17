const { query, queryOne, execute, withTransaction, sql } = require('../../database/query');

/**
 * Busca un usuario por teléfono o email (para login con cualquiera de los dos)
 */
async function findUserByIdentifier(identifier) {
  return queryOne(
    `SELECT id, uuid, phone, email, username, password_hash, display_name,
            bio, avatar_url, is_verified, is_active, last_seen, created_at
     FROM Users
     WHERE (phone = @identifier OR email = @identifier OR username = @identifier)
       AND deleted_at IS NULL`,
    [{ name: 'identifier', type: sql.VarChar(255), value: identifier }]
  );
}

async function findUserById(id) {
  return queryOne(
    `SELECT id, uuid, phone, email, username, password_hash, display_name,
            bio, avatar_url, is_verified, is_active, last_seen, created_at
     FROM Users
     WHERE id = @id AND deleted_at IS NULL`,
    [{ name: 'id', type: sql.Int, value: id }]
  );
}

async function findUserByPhone(phone) {
  return queryOne(
    `SELECT id FROM Users WHERE phone = @phone AND deleted_at IS NULL`,
    [{ name: 'phone', type: sql.VarChar(20), value: phone }]
  );
}

async function findUserByEmail(email) {
  return queryOne(
    `SELECT id FROM Users WHERE email = @email AND deleted_at IS NULL`,
    [{ name: 'email', type: sql.VarChar(255), value: email }]
  );
}

async function findUserByUsername(username) {
  return queryOne(
    `SELECT id FROM Users WHERE username = @username AND deleted_at IS NULL`,
    [{ name: 'username', type: sql.VarChar(50), value: username }]
  );
}

async function createUser({ phone, email, username, passwordHash, display_name }) {
  return queryOne(
    `INSERT INTO Users (phone, email, username, password_hash, display_name, created_at, updated_at)
     OUTPUT INSERTED.id, INSERTED.uuid, INSERTED.phone, INSERTED.email,
            INSERTED.username, INSERTED.display_name, INSERTED.is_verified,
            INSERTED.is_active, INSERTED.created_at
     VALUES (@phone, @email, @username, @passwordHash, @displayName, GETUTCDATE(), GETUTCDATE())`,
    [
      { name: 'phone',        type: sql.VarChar(20),   value: phone || null },
      { name: 'email',        type: sql.VarChar(255),  value: email || null },
      { name: 'username',     type: sql.VarChar(50),   value: username },
      { name: 'passwordHash', type: sql.VarChar(255),  value: passwordHash },
      { name: 'displayName',  type: sql.NVarChar(100), value: display_name },
    ]
  );
}

async function assignRoleToUser(userId, roleId) {
  return execute(
    `INSERT INTO UserRoles (user_id, role_id) VALUES (@userId, @roleId)`,
    [
      { name: 'userId', type: sql.Int, value: userId },
      { name: 'roleId', type: sql.Int, value: roleId },
    ]
  );
}

async function findRoleByName(name) {
  return queryOne(
    `SELECT id FROM Roles WHERE name = @name`,
    [{ name: 'name', type: sql.VarChar(30), value: name }]
  );
}

async function getUserRoles(userId) {
  return query(
    `SELECT r.name FROM UserRoles ur
     JOIN Roles r ON r.id = ur.role_id
     WHERE ur.user_id = @userId`,
    [{ name: 'userId', type: sql.Int, value: userId }]
  );
}

async function saveRefreshToken({ userId, tokenHash, deviceId, expiresAt }) {
  return execute(
    `INSERT INTO RefreshTokens (user_id, token_hash, device_id, expires_at, created_at)
     VALUES (@userId, @tokenHash, @deviceId, @expiresAt, GETUTCDATE())`,
    [
      { name: 'userId',    type: sql.Int,        value: userId },
      { name: 'tokenHash', type: sql.VarChar(64), value: tokenHash },
      { name: 'deviceId',  type: sql.Int,        value: deviceId || null },
      { name: 'expiresAt', type: sql.DateTime,   value: expiresAt },
    ]
  );
}

async function findRefreshToken(tokenHash) {
  return queryOne(
    `SELECT id, user_id, device_id, expires_at, is_revoked
     FROM RefreshTokens
     WHERE token_hash = @tokenHash`,
    [{ name: 'tokenHash', type: sql.VarChar(64), value: tokenHash }]
  );
}

async function revokeRefreshToken(tokenHash) {
  return execute(
    `UPDATE RefreshTokens SET is_revoked = 1 WHERE token_hash = @tokenHash`,
    [{ name: 'tokenHash', type: sql.VarChar(64), value: tokenHash }]
  );
}

async function revokeAllUserTokens(userId) {
  return execute(
    `UPDATE RefreshTokens SET is_revoked = 1 WHERE user_id = @userId`,
    [{ name: 'userId', type: sql.Int, value: userId }]
  );
}

async function updateLastSeen(userId) {
  return execute(
    `UPDATE Users SET last_seen = GETUTCDATE() WHERE id = @userId`,
    [{ name: 'userId', type: sql.Int, value: userId }]
  );
}

async function markUserVerified(userId) {
  return execute(
    `UPDATE Users SET is_verified = 1, updated_at = GETUTCDATE() WHERE id = @userId`,
    [{ name: 'userId', type: sql.Int, value: userId }]
  );
}

// ---- Verification Codes (OTP) ----

async function saveVerificationCode({ userId, codeHash, purpose, expiresAt }) {
  return withTransaction(async ({ execute: txExec }) => {
    // Invalidar códigos anteriores del mismo propósito antes de crear uno nuevo
    await txExec(
      `UPDATE VerificationCodes
       SET used_at = GETUTCDATE()
       WHERE user_id = @userId AND purpose = @purpose AND used_at IS NULL`,
      [
        { name: 'userId',  type: sql.Int,        value: userId },
        { name: 'purpose', type: sql.VarChar(30), value: purpose },
      ]
    );
    return txExec(
      `INSERT INTO VerificationCodes (user_id, code_hash, purpose, expires_at)
       VALUES (@userId, @codeHash, @purpose, @expiresAt)`,
      [
        { name: 'userId',    type: sql.Int,        value: userId },
        { name: 'codeHash',  type: sql.VarChar(64), value: codeHash },
        { name: 'purpose',   type: sql.VarChar(30), value: purpose },
        { name: 'expiresAt', type: sql.DateTime,    value: expiresAt },
      ]
    );
  });
}

/**
 * Crea el usuario, asigna el rol y guarda el código OTP en una sola transacción atómica.
 * Si cualquiera de los tres pasos falla, se hace rollback de todo.
 */
async function registerUserAtomic({ phone, email, username, passwordHash, display_name, roleId, codeHash, expiresAt }) {
  return withTransaction(async ({ queryOne: txOne, execute: txExec }) => {
    const user = await txOne(
      `INSERT INTO Users (phone, email, username, password_hash, display_name, created_at, updated_at)
       OUTPUT INSERTED.id, INSERTED.uuid, INSERTED.phone, INSERTED.email,
              INSERTED.username, INSERTED.display_name, INSERTED.is_verified,
              INSERTED.is_active, INSERTED.created_at
       VALUES (@phone, @email, @username, @passwordHash, @displayName, GETUTCDATE(), GETUTCDATE())`,
      [
        { name: 'phone',        type: sql.VarChar(20),   value: phone || null },
        { name: 'email',        type: sql.VarChar(255),  value: email || null },
        { name: 'username',     type: sql.VarChar(50),   value: username },
        { name: 'passwordHash', type: sql.VarChar(255),  value: passwordHash },
        { name: 'displayName',  type: sql.NVarChar(100), value: display_name },
      ]
    );

    if (roleId) {
      await txExec(
        `INSERT INTO UserRoles (user_id, role_id) VALUES (@userId, @roleId)`,
        [
          { name: 'userId', type: sql.Int, value: user.id },
          { name: 'roleId', type: sql.Int, value: roleId },
        ]
      );
    }

    await txExec(
      `INSERT INTO VerificationCodes (user_id, code_hash, purpose, expires_at)
       VALUES (@userId, @codeHash, 'verify_account', @expiresAt)`,
      [
        { name: 'userId',    type: sql.Int,        value: user.id },
        { name: 'codeHash',  type: sql.VarChar(64), value: codeHash },
        { name: 'expiresAt', type: sql.DateTime,    value: expiresAt },
      ]
    );

    return user;
  });
}

async function findActiveVerificationCode(userId, purpose) {
  return queryOne(
    `SELECT id, code_hash, attempts, max_attempts, expires_at
     FROM VerificationCodes
     WHERE user_id = @userId
       AND purpose = @purpose
       AND used_at IS NULL
       AND expires_at > GETUTCDATE()
     ORDER BY created_at DESC
     OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY`,
    [
      { name: 'userId',  type: sql.Int,        value: userId },
      { name: 'purpose', type: sql.VarChar(30), value: purpose },
    ]
  );
}

async function incrementCodeAttempts(codeId) {
  return execute(
    `UPDATE VerificationCodes SET attempts = attempts + 1 WHERE id = @codeId`,
    [{ name: 'codeId', type: sql.Int, value: codeId }]
  );
}

async function markCodeAsUsed(codeId) {
  return execute(
    `UPDATE VerificationCodes SET used_at = GETUTCDATE() WHERE id = @codeId`,
    [{ name: 'codeId', type: sql.Int, value: codeId }]
  );
}

async function updatePassword(userId, passwordHash) {
  return execute(
    `UPDATE Users SET password_hash = @passwordHash, updated_at = GETUTCDATE() WHERE id = @userId`,
    [
      { name: 'userId',       type: sql.Int,        value: userId },
      { name: 'passwordHash', type: sql.VarChar(255), value: passwordHash },
    ]
  );
}

module.exports = {
  findUserByIdentifier,
  findUserById,
  findUserByPhone,
  findUserByEmail,
  findUserByUsername,
  createUser,
  assignRoleToUser,
  registerUserAtomic,
  findRoleByName,
  getUserRoles,
  saveRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  updateLastSeen,
  markUserVerified,
  saveVerificationCode,
  findActiveVerificationCode,
  incrementCodeAttempts,
  markCodeAsUsed,
  updatePassword,
};
