const { Router } = require('express');
const controller  = require('./admin.controller');
const { adminLoginValidator } = require('./admin.validator');
const authMiddleware  = require('../../middlewares/auth.middleware');
const roleAuth        = require('../../middlewares/roleAuth.middleware');
const { authLimiter } = require('../../middlewares/rateLimiter.middleware');

const router = Router();

// ── Login público (con rate limiter) ─────────────────────────────
router.post('/login', authLimiter, adminLoginValidator, controller.login);

// ── Rutas protegidas ─────────────────────────────────────────────
router.use(authMiddleware);
router.use(roleAuth('admin', 'superadmin', 'moderator'));

// Dashboard general
router.get('/dashboard',              controller.getDashboard);

// Stats por requerimiento
router.get('/stats/req1',             controller.getReq1Stats);
router.get('/stats/req2',             controller.getReq2Stats);
router.get('/stats/req3',             controller.getReq3Stats);
router.get('/stats/req4',             controller.getReq4Stats);
router.get('/stats/req5',             controller.getReq5Stats);
router.get('/stats/req6',             controller.getReq6Stats);
router.get('/stats/req7',             controller.getReq7Stats);
router.get('/stats/req8',             controller.getReq8Stats);

// Usuarios
router.get('/users',                  controller.listUsers);
router.patch('/users/:userId/status', controller.toggleUserStatus);

// Log de actividad
router.get('/activity',               controller.getActivity);

module.exports = router;