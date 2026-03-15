const { Router } = require('express');
const controller = require('./devices.controller');
const { registerDeviceValidator } = require('./devices.validator');
const authMiddleware = require('../../middlewares/auth.middleware');

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Devices
 *   description: Gestión de dispositivos del usuario
 *
 * /devices:
 *   get:
 *     summary: Listar dispositivos registrados del usuario
 *     tags: [Devices]
 *     responses:
 *       200: { description: Lista de dispositivos }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /devices/register:
 *   post:
 *     summary: Registrar un nuevo dispositivo
 *     tags: [Devices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [device_token, device_type]
 *             properties:
 *               device_token: { type: string, example: "abc123xyz" }
 *               device_type: { type: string, example: "android" }
 *               device_name: { type: string, example: "Mi Teléfono" }
 *               push_token: { type: string, example: "fcm-token-here" }
 *     responses:
 *       200: { description: Dispositivo registrado }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /devices/{deviceId}:
 *   delete:
 *     summary: Eliminar un dispositivo
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Dispositivo eliminado }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /devices/{deviceId}/verify:
 *   patch:
 *     summary: Verificar un dispositivo
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Dispositivo verificado }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */

router.get('/',                     controller.listDevices);
router.post('/register',            registerDeviceValidator, controller.registerDevice);
router.delete('/:deviceId',         controller.removeDevice);
router.patch('/:deviceId/verify',   controller.verifyDevice);

module.exports = router;
