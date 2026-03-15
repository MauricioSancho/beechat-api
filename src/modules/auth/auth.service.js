const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const authRepo = require('./auth.repository');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require('../../utils/token.helper');
const { jwtConfig } = require('../../config/jwt.config');
const { ERRORS, BCRYPT_ROUNDS } = require('../../shared/constants');
const { sendVerificationCode } = require('../../utils/mailer');
const { sendSmsVerificationCode } = require('../../utils/sms');
const logger = require('../../utils/logger');

/** Genera un código OTP numérico de 6 dígitos */
function generateOtpCode() {
  return String(crypto.randomInt(100000, 999999));
}

/** Hash SHA-256 del código (igual que hashToken pero semánticamente diferente) */
function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/** Fecha de expiración: ahora + N minutos */
function expiresInMinutes(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Sanitiza el usuario para respuesta (quita password_hash)
 */
function sanitizeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

/**
 * Calcula la fecha de expiración del refresh token (en ms desde epoch → Date)
 */
function getRefreshExpiry() {
  const days = parseInt(jwtConfig.refreshExpiresIn, 10) || 30;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

/**
 * Genera el par access + refresh token y guarda el hash del refresh en DB
 */
async function issueTokenPair(user, roles, deviceId = null) {
  const accessToken = generateAccessToken({
    id: user.id,
    uuid: user.uuid,
    roles,
  });

  const refreshToken = generateRefreshToken({ id: user.id, deviceId });
  const tokenHash = hashToken(refreshToken);
  const expiresAt = getRefreshExpiry();

  await authRepo.saveRefreshToken({ userId: user.id, tokenHash, deviceId, expiresAt });

  return { accessToken, refreshToken };
}

// ---- Casos de Uso ----

async function register({ phone, email, username, password, display_name }) {
  // Verificar unicidad
  if (phone) {
    const existingPhone = await authRepo.findUserByPhone(phone);
    if (existingPhone) throw ERRORS.CONFLICT('Phone number is already registered');
  }

  if (email) {
    const existingEmail = await authRepo.findUserByEmail(email);
    if (existingEmail) throw ERRORS.CONFLICT('Email is already registered');
  }

  const existingUsername = await authRepo.findUserByUsername(username);
  if (existingUsername) throw ERRORS.CONFLICT('Username is already taken');

  // Hash de contraseña
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Crear usuario
  const user = await authRepo.createUser({ phone, email, username, passwordHash, display_name });

  // Asignar rol 'user'
  const role = await authRepo.findRoleByName('user');
  if (role) await authRepo.assignRoleToUser(user.id, role.id);

  // Generar y enviar código OTP de verificación
  const otpCode = generateOtpCode();
  const codeHash = hashCode(otpCode);
  await authRepo.saveVerificationCode({
    userId:    user.id,
    codeHash,
    purpose:   'verify_account',
    expiresAt: expiresInMinutes(15),
  });

  // Enviar OTP por email (si tiene email)
  if (email) {
    sendVerificationCode({ to: email, displayName: display_name, code: otpCode })
      .catch(() => {});
  }

  // Enviar OTP por SMS (si tiene teléfono)
  if (phone) {
    sendSmsVerificationCode({ to: phone, code: otpCode })
      .catch((err) => logger.warn(`SMS OTP no enviado a ${phone}: ${err.message}`));
  }

  const roles = ['user'];
  const { accessToken, refreshToken } = await issueTokenPair(user, roles);

  return {
    user: sanitizeUser(user),
    tokens: { accessToken, expiresIn: 900 },
    refreshToken,
  };
}

async function login({ identifier, password }) {
  const user = await authRepo.findUserByIdentifier(identifier);
  if (!user) throw ERRORS.UNAUTHORIZED('Invalid credentials');

  if (!user.is_active) throw ERRORS.FORBIDDEN('Account is deactivated');

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) throw ERRORS.UNAUTHORIZED('Invalid credentials');

  const userRoles = await authRepo.getUserRoles(user.id);
  const roles = userRoles.map((r) => r.name);

  const { accessToken, refreshToken } = await issueTokenPair(user, roles);

  // Actualizar último acceso (sin await para no bloquear)
  authRepo.updateLastSeen(user.id).catch(() => {});

  return {
    user: sanitizeUser(user),
    tokens: { accessToken, expiresIn: 900 },
    refreshToken,
  };
}

async function logout(refreshToken) {
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await authRepo.revokeRefreshToken(tokenHash);
  }
}

async function refreshAccessToken(rawRefreshToken) {
  let decoded;
  try {
    decoded = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw ERRORS.UNAUTHORIZED('Invalid or expired refresh token');
  }

  const tokenHash = hashToken(rawRefreshToken);
  const stored = await authRepo.findRefreshToken(tokenHash);

  if (!stored) throw ERRORS.UNAUTHORIZED('Refresh token not found');

  // Detección de reuso: si ya fue revocado, revocar TODO (ataque detectado)
  if (stored.is_revoked) {
    await authRepo.revokeAllUserTokens(stored.user_id);
    throw ERRORS.UNAUTHORIZED('Token reuse detected. All sessions revoked.');
  }

  if (new Date(stored.expires_at) < new Date()) {
    throw ERRORS.UNAUTHORIZED('Refresh token expired');
  }

  // Revocar el token anterior (rotación)
  await authRepo.revokeRefreshToken(tokenHash);

  const user = await authRepo.findUserById(stored.user_id);
  if (!user || !user.is_active) throw ERRORS.UNAUTHORIZED('User not available');

  const userRoles = await authRepo.getUserRoles(user.id);
  const roles = userRoles.map((r) => r.name);

  const { accessToken, refreshToken: newRefreshToken } = await issueTokenPair(
    user,
    roles,
    stored.device_id
  );

  return {
    accessToken,
    expiresIn: 900,
    refreshToken: newRefreshToken,
  };
}

async function verifyAccount(userId, code) {
  const record = await authRepo.findActiveVerificationCode(userId, 'verify_account');

  if (!record) {
    throw ERRORS.BAD_REQUEST('No active verification code found. Request a new one.');
  }

  if (record.attempts >= record.max_attempts) {
    throw ERRORS.BAD_REQUEST('Too many failed attempts. Request a new code.');
  }

  const codeHash = hashCode(code);

  if (codeHash !== record.code_hash) {
    await authRepo.incrementCodeAttempts(record.id);
    const remaining = record.max_attempts - record.attempts - 1;
    throw ERRORS.BAD_REQUEST(`Invalid code. ${remaining} attempt(s) remaining.`);
  }

  // Código correcto
  await authRepo.markCodeAsUsed(record.id);
  await authRepo.markUserVerified(userId);
}

async function resendVerificationCode(userId) {
  const user = await authRepo.findUserById(userId);
  if (!user) throw ERRORS.NOT_FOUND('User not found');
  if (user.is_verified) throw ERRORS.BAD_REQUEST('Account is already verified');

  // Necesita al menos un canal de contacto
  if (!user.email && !user.phone) {
    throw ERRORS.BAD_REQUEST('No email or phone associated with this account');
  }

  const otpCode = generateOtpCode();
  const codeHash = hashCode(otpCode);

  await authRepo.saveVerificationCode({
    userId:    userId,
    codeHash,
    purpose:   'verify_account',
    expiresAt: expiresInMinutes(15),
  });

  // Enviar por email si tiene
  if (user.email) {
    await sendVerificationCode({ to: user.email, displayName: user.display_name, code: otpCode });
  }

  // Enviar por SMS si tiene teléfono
  if (user.phone) {
    await sendSmsVerificationCode({ to: user.phone, code: otpCode });
  }
}

module.exports = {
  register,
  login,
  logout,
  refreshAccessToken,
  verifyAccount,
  resendVerificationCode,
};
