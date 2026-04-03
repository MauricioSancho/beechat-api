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

module.exports = { uploadKeyBundle, getKeyBundle, getKeyBundlesBatch, getMyKeyBundle, rotateKeyBundle };
