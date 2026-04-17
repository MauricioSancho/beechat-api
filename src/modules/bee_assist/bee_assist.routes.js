const { Router } = require('express');
const controller = require('./bee_assist.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const { aiLimiter } = require('../../middlewares/rateLimiter.middleware');

const router = Router();

router.use(authMiddleware);
router.use(aiLimiter);

/**
 * @swagger
 * tags:
 *   name: BeeAssist
 *   description: Asistente IA para sugerencias y resúmenes de chat
 *
 * /bee-assist/suggest:
 *   post:
 *     summary: Obtener sugerencias de respuesta para un chat
 *     tags: [BeeAssist]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [chat_id, last_messages]
 *             properties:
 *               chat_id: { type: integer, example: 3 }
 *               last_messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role: { type: string, example: "user" }
 *                     content: { type: string, example: "¿A qué hora nos vemos?" }
 *     responses:
 *       200: { description: Lista de sugerencias de respuesta }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /bee-assist/summarize:
 *   post:
 *     summary: Generar un resumen del historial de un chat
 *     tags: [BeeAssist]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [chat_id]
 *             properties:
 *               chat_id: { type: integer, example: 3 }
 *     responses:
 *       200: { description: Resumen generado del chat }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */

router.post('/chat',      controller.chat);
router.post('/suggest',   controller.suggestReply);
router.post('/summarize', controller.summarize);

module.exports = router;
