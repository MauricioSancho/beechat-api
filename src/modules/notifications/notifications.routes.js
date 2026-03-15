const { Router } = require('express');
const controller = require('./notifications.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Gestión de notificaciones del usuario
 *
 * /notifications:
 *   get:
 *     summary: Listar notificaciones del usuario autenticado
 *     tags: [Notifications]
 *     responses:
 *       200: { description: Lista de notificaciones }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /notifications/read-all:
 *   patch:
 *     summary: Marcar todas las notificaciones como leídas
 *     tags: [Notifications]
 *     responses:
 *       200: { description: Todas las notificaciones marcadas como leídas }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /notifications/{id}/read:
 *   patch:
 *     summary: Marcar una notificación como leída
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Notificación marcada como leída }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /notifications/{id}:
 *   delete:
 *     summary: Eliminar una notificación
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Notificación eliminada }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */

router.get('/',                 controller.listNotifications);
router.patch('/read-all',       controller.markAllAsRead);
router.patch('/:id/read',       controller.markAsRead);
router.delete('/:id',           controller.deleteNotification);

module.exports = router;
