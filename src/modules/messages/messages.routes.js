const { Router } = require('express');
const controller = require('./messages.controller');
const {
  sendMessageValidator,
  editMessageValidator,
  forwardMessageValidator,
  listMessagesValidator,
} = require('./messages.validator');
const authMiddleware = require('../../middlewares/auth.middleware');
const { uploadImage, uploadAudio } = require('../../middlewares/upload.middleware');

// ---- Router A: Montado en /api/v1/chats/:chatId/messages (mergeParams para acceder a :chatId) ----
const chatMessagesRouter = Router({ mergeParams: true });
chatMessagesRouter.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Envío y gestión de mensajes
 *
 * /chats/{chatId}/messages:
 *   get:
 *     summary: Listar mensajes de un chat
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Lista de mensajes }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   post:
 *     summary: Enviar un mensaje en un chat
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content, message_type]
 *             properties:
 *               content: { type: string, example: "Hola!" }
 *               message_type: { type: string, example: "text" }
 *               reply_to_id: { type: integer, example: 15 }
 *     responses:
 *       200: { description: Mensaje enviado }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /messages/{messageId}:
 *   put:
 *     summary: Editar el contenido de un mensaje
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, example: "Texto editado" }
 *     responses:
 *       200: { description: Mensaje editado }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   delete:
 *     summary: Eliminar un mensaje
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Mensaje eliminado }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /messages/{messageId}/forward:
 *   post:
 *     summary: Reenviar un mensaje a uno o varios chats
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [chat_ids]
 *             properties:
 *               chat_ids:
 *                 type: array
 *                 items: { type: integer }
 *                 example: [1, 3, 5]
 *     responses:
 *       200: { description: Mensaje reenviado }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */

chatMessagesRouter.get('/',        listMessagesValidator,  controller.listMessages);
chatMessagesRouter.post('/',       uploadImage,  sendMessageValidator, controller.sendMsg);
chatMessagesRouter.post('/audio',  uploadAudio,  sendMessageValidator, controller.sendMsg);

// ---- Router B: Montado en /api/v1/messages (operaciones sobre mensajes individuales) ----
const messagesRouter = Router();
messagesRouter.use(authMiddleware);
messagesRouter.put('/:messageId',          editMessageValidator,    controller.editMsg);
messagesRouter.delete('/:messageId',                                controller.deleteMsg);
messagesRouter.post('/:messageId/forward', forwardMessageValidator, controller.forwardMsg);

module.exports = { chatMessagesRouter, messagesRouter };
