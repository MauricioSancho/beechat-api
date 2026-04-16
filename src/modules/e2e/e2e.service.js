const crypto  = require('crypto');
const e2eRepo = require('./e2e.repository');
const { ERRORS } = require('../../shared/constants');

/**
 * Upload or rotate this user's identity public key.
 * Called once on device login / key rotation.
 */
async function uploadKeyBundle(userId, identityKey) {
  await e2eRepo.upsertKeyBundle(userId, identityKey);
  return { uploaded: true };
}

/**
 * Get another user's identity public key bundle so the caller can
 * perform a client-side X3DH key agreement.
 * Returns null if the target user has not enabled E2EE yet.
 */
async function getKeyBundle(requesterId, targetUserId) {
  if (requesterId === targetUserId) {
    throw ERRORS.BAD_REQUEST('Cannot fetch your own key bundle via this endpoint');
  }

  const bundle = await e2eRepo.findKeyBundle(targetUserId);
  if (!bundle) {
    return null; // Target user hasn't uploaded keys yet — E2EE not available
  }

  return {
    userId: bundle.user_id,
    identityKey: bundle.identity_key,
    keyVersion: bundle.key_version,
  };
}

/**
 * Get key bundles for multiple users at once (useful for group chats).
 */
async function getKeyBundlesBatch(requesterId, userIds) {
  const rows = await e2eRepo.findKeyBundlesBatch(userIds);
  return rows.map((r) => ({
    userId: r.user_id,
    identityKey: r.identity_key,
    keyVersion: r.key_version,
  }));
}

/**
 * Get the requesting user's own bundle (to verify what the server stored).
 */
async function getMyKeyBundle(userId) {
  const bundle = await e2eRepo.findKeyBundle(userId);
  if (!bundle) return null;
  return {
    userId: bundle.user_id,
    identityKey: bundle.identity_key,
    keyVersion: bundle.key_version,
    updatedAt: bundle.updated_at,
  };
}

/**
 * Explicitly rotate a user's key bundle (REQ-5h).
 * Behaves identically to uploadKeyBundle but is a named action for clarity.
 */
async function rotateKeyBundle(userId, identityKey) {
  await e2eRepo.upsertKeyBundle(userId, identityKey);
  const bundle = await e2eRepo.findKeyBundle(userId);
  return { rotated: true, keyVersion: bundle.key_version };
}

/**
 * Genera el código de verificación E2EE de un chat privado.
 *
 * Proceso (idéntico al que hace el cliente Flutter):
 *   1. Obtiene las claves de ambos participantes desde E2EDeviceKeys.
 *   2. Las ordena por user_id (resultado idéntico sin importar quién llame).
 *   3. Concatena los bytes de ambas claves (base64 → Buffer).
 *   4. SHA-256 del resultado → 32 bytes.
 *   5. Convierte a 60 dígitos en 12 grupos de 5.
 *
 * Retorna null si algún participante no tiene claves E2EE.
 */
async function getChatVerificationCode(chatId, requesterId) {
  const rows = await e2eRepo.findChatParticipantKeys(chatId, requesterId);

  if (!rows || rows.length < 2) {
    // Algún participante no tiene claves — E2EE no disponible
    return null;
  }

  // Ordenar por user_id (ya viene ordenado por la query, pero asegurar)
  rows.sort((a, b) => a.user_id - b.user_id);

  const key1Bytes = Buffer.from(rows[0].identity_key, 'base64');
  const key2Bytes = Buffer.from(rows[1].identity_key, 'base64');
  const combined  = Buffer.concat([key1Bytes, key2Bytes]);
  const hash      = crypto.createHash('sha256').update(combined).digest();

  // Convertir bytes → dígitos: cada byte → 3 dígitos (padded)
  const digits = Array.from(hash)
    .flatMap((b) => [Math.floor(b / 100), Math.floor((b % 100) / 10), b % 10])
    .slice(0, 60)
    .join('');

  // Agrupar en 12 bloques de 5
  const groups = [];
  for (let i = 0; i < 60; i += 5) groups.push(digits.slice(i, i + 5));

  return {
    code: groups.join(' '),          // "12345 67890 ..."
    groups,                          // array de 12 strings
    participants: rows.map((r) => ({
      userId:     r.user_id,
      keyVersion: r.key_version,
      keyPreview: r.identity_key.slice(0, 8) + '…', // primeros 8 chars del base64
    })),
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { uploadKeyBundle, getKeyBundle, getKeyBundlesBatch, getMyKeyBundle, rotateKeyBundle, getChatVerificationCode };
