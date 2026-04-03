const { Router } = require('express');
const controller = require('./e2e.controller');
const { uploadBundleValidator, getUserBundleValidator, getBatchBundlesValidator } = require('./e2e.validator');
const authMiddleware = require('../../middlewares/auth.middleware');

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: E2EE
 *   description: End-to-end encryption key management
 *
 * /keys/bundle:
 *   post:
 *     summary: Upload or rotate this device's identity public key
 *     tags: [E2EE]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identityKey]
 *             properties:
 *               identityKey: { type: string, example: "base64encodedX25519PublicKey==" }
 *     responses:
 *       201: { description: Key bundle uploaded }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /keys/bundle/me:
 *   get:
 *     summary: Get your own stored identity public key
 *     tags: [E2EE]
 *     responses:
 *       200: { description: Your key bundle }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /keys/bundle/batch:
 *   post:
 *     summary: Get identity public keys for multiple users
 *     tags: [E2EE]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userIds]
 *             properties:
 *               userIds: { type: array, items: { type: integer } }
 *     responses:
 *       200: { description: Array of key bundles }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /keys/bundle/{userId}:
 *   get:
 *     summary: Get another user's identity public key for E2EE key agreement
 *     tags: [E2EE]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: User's key bundle (null if E2EE not set up) }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */

router.post('/bundle',          uploadBundleValidator,    controller.uploadBundle);
router.get('/bundle/me',                                   controller.getMyBundle);
router.post('/bundle/batch',    getBatchBundlesValidator,  controller.getBatchBundles);
router.get('/bundle/:userId',   getUserBundleValidator,    controller.getUserBundle);
// REQ-5h: Rotación explícita de claves — incrementa key_version para que
// los pares puedan detectar el cambio de dispositivo (REQ-5i)
router.post('/rotate',          uploadBundleValidator,    controller.rotateBundle);

module.exports = router;
