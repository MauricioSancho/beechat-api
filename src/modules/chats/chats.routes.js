const { Router } = require('express');
const controller = require('./chats.controller');
const { createPrivateChatValidator } = require('./chats.validator');
const authMiddleware = require('../../middlewares/auth.middleware');

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Chats
 *   description: Gestión de chats privados
 *
 * /chats:
 *   get:
 *     summary: Listar chats del usuario autenticado
 *     tags: [Chats]
 *     responses:
 *       200: { description: Lista de chats }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   post:
 *     summary: Crear un chat privado
 *     tags: [Chats]
 *
 * /chats/private:
 *   post:
 *     summary: Iniciar o recuperar un chat privado con otro usuario
 *     tags: [Chats]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [participant_id]
 *             properties:
 *               participant_id: { type: integer, example: 7 }
 *     responses:
 *       200: { description: Chat privado creado o recuperado }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /chats/{chatId}:
 *   get:
 *     summary: Obtener detalle de un chat
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Detalle del chat }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   delete:
 *     summary: Eliminar un chat
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Chat eliminado }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /chats/{chatId}/archive:
 *   patch:
 *     summary: Archivar o desarchivar un chat
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Estado de archivo actualizado }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /chats/{chatId}/pin:
 *   patch:
 *     summary: Fijar o desfijar un chat
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Estado de fijado actualizado }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /chats/{chatId}/read:
 *   patch:
 *     summary: Marcar mensajes del chat como leídos
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Mensajes marcados como leídos }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */

router.get('/',                         controller.listChats);
router.get('/latest',                   controller.getLatestActivity);
router.post('/private', createPrivateChatValidator, controller.createPrivateChat);
router.get('/:chatId',                  controller.getChatById);
router.delete('/:chatId',               controller.deleteChat);
router.patch('/:chatId/archive',        controller.archiveChat);
router.patch('/:chatId/pin',            controller.pinChat);
router.patch('/:chatId/read',           controller.markAsRead);
router.delete('/:chatId/messages',      controller.clearHistory);

module.exports = router;
