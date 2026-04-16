const e2eService = require('./e2e.service');
const { sendSuccess, sendCreated, asyncHandler } = require('../../utils/response.helper');

/**
 * POST /api/v1/keys/bundle
 * Upload (or rotate) this device's identity public key.
 * Body: { identityKey: "base64url string" }
 */
const uploadBundle = asyncHandler(async (req, res) => {
  const { identityKey } = req.body;
  const result = await e2eService.uploadKeyBundle(req.user.id, identityKey);
  return sendCreated(res, result);
});

/**
 * GET /api/v1/keys/bundle/me
 * Get the authenticated user's own key bundle.
 */
const getMyBundle = asyncHandler(async (req, res) => {
  const bundle = await e2eService.getMyKeyBundle(req.user.id);
  return sendSuccess(res, bundle);
});

/**
 * GET /api/v1/keys/bundle/:userId
 * Get another user's identity public key (for X3DH key agreement).
 */
const getUserBundle = asyncHandler(async (req, res) => {
  const targetId = parseInt(req.params.userId, 10);
  const bundle = await e2eService.getKeyBundle(req.user.id, targetId);
  return sendSuccess(res, bundle); // null means user hasn't enabled E2EE
});

/**
 * POST /api/v1/keys/bundle/batch
 * Get key bundles for multiple users at once.
 * Body: { userIds: [1, 2, 3] }
 */
const getBatchBundles = asyncHandler(async (req, res) => {
  const { userIds } = req.body;
  const bundles = await e2eService.getKeyBundlesBatch(req.user.id, userIds);
  return sendSuccess(res, bundles);
});

/**
 * POST /api/v1/keys/rotate
 * Explicitly rotate this device's identity key pair (REQ-5h).
 * Body: { identityKey: "base64 new public key" }
 * Increments key_version on the server so peers can detect the change (REQ-5i).
 */
const rotateBundle = asyncHandler(async (req, res) => {
  const { identityKey } = req.body;
  const result = await e2eService.rotateKeyBundle(req.user.id, identityKey);
  return sendSuccess(res, result);
});

/**
 * GET /api/v1/keys/verify/:chatId
 * Devuelve el código de verificación E2EE del chat (ambas claves unidas + hash numérico).
 * Ambos participantes obtienen el mismo código → pueden compararlo para verificar.
 */
const getChatVerificationCode = asyncHandler(async (req, res) => {
  const chatId = parseInt(req.params.chatId, 10);
  const result = await e2eService.getChatVerificationCode(chatId, req.user.id);
  return sendSuccess(res, result); // null = algún participante sin E2EE
});

module.exports = { uploadBundle, getMyBundle, getUserBundle, getBatchBundles, rotateBundle, getChatVerificationCode };
