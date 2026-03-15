const { Router } = require('express');
const controller = require('./admin.controller');
const { adminLoginValidator } = require('./admin.validator');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleAuth = require('../../middlewares/roleAuth.middleware');
const { authLimiter } = require('../../middlewares/rateLimiter.middleware');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Panel de administración
 *
 * /admin/login:
 *   post:
 *     summary: Iniciar sesión como administrador
 *     tags: [Admin]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: "admin@beechat.com" }
 *               password: { type: string, example: "secret123" }
 *     responses:
 *       200: { description: Login exitoso, retorna access token }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /admin/dashboard:
 *   get:
 *     summary: Obtener métricas del dashboard
 *     tags: [Admin]
 *     responses:
 *       200: { description: Métricas generales de la plataforma }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /admin/users:
 *   get:
 *     summary: Listar usuarios de la plataforma
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string, example: "mario" }
 *     responses:
 *       200: { description: Lista paginada de usuarios }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /admin/users/{userId}/status:
 *   patch:
 *     summary: Activar o desactivar una cuenta de usuario
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [is_active]
 *             properties:
 *               is_active: { type: boolean, example: false }
 *     responses:
 *       200: { description: Estado del usuario actualizado }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /admin/activity:
 *   get:
 *     summary: Obtener registro de actividad reciente
 *     tags: [Admin]
 *     responses:
 *       200: { description: Log de actividad de la plataforma }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */

// Login público (con rate limiter)
router.post('/login', authLimiter, adminLoginValidator, controller.login);

// Rutas protegidas: requieren JWT válido + role admin o superadmin
router.use(authMiddleware);
router.use(roleAuth('admin', 'superadmin', 'moderator'));

router.get('/dashboard',              controller.getDashboard);
router.get('/users',                  controller.listUsers);
router.patch('/users/:userId/status', controller.toggleUserStatus);
router.get('/activity',               controller.getActivity);

module.exports = router;
