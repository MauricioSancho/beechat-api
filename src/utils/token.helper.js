const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { jwtConfig } = require('../config/jwt.config');
const { TOKEN_TYPES } = require('../shared/constants');

/**
 * Genera un access token JWT de corta duración
 * @param {{ id, uuid, roles }} payload
 */
function generateAccessToken(payload) {
  return jwt.sign(
    {
      sub: payload.id,
      uuid: payload.uuid,
      roles: payload.roles || [TOKEN_TYPES.ACCESS],
      type: TOKEN_TYPES.ACCESS,
    },
    jwtConfig.accessSecret,
    { expiresIn: jwtConfig.accessExpiresIn }
  );
}

/**
 * Genera un refresh token JWT de larga duración
 * @param {{ id, deviceId }} payload
 */
function generateRefreshToken(payload) {
  return jwt.sign(
    {
      sub: payload.id,
      deviceId: payload.deviceId || null,
      type: TOKEN_TYPES.REFRESH,
    },
    jwtConfig.refreshSecret,
    { expiresIn: jwtConfig.refreshExpiresIn }
  );
}

/**
 * Genera un JWT para admin (sin refresh)
 */
function generateAdminToken(payload) {
  return jwt.sign(
    {
      sub: payload.id,
      email: payload.email,
      role: payload.role,
      type: TOKEN_TYPES.ADMIN,
    },
    jwtConfig.accessSecret,
    { expiresIn: '8h' }
  );
}

/**
 * Verifica y decodifica un access token
 * Lanza error si es inválido o expirado
 */
function verifyAccessToken(token) {
  return jwt.verify(token, jwtConfig.accessSecret);
}

/**
 * Verifica y decodifica un refresh token
 * Lanza error si es inválido o expirado
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, jwtConfig.refreshSecret);
}

/**
 * Hash SHA-256 de un token para almacenar en base de datos
 * Nunca almacenar el token crudo
 */
function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateAdminToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
};
