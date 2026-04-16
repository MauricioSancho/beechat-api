const { Router } = require('express');
const controller = require('./auth.controller');
const {
  registerValidator, loginValidator, verifyAccountValidator,
  forgotPasswordValidator, verifyResetCodeValidator, resetPasswordValidator,
} = require('./auth.validator');
const authMiddleware = require('../../middlewares/auth.middleware');
const { authLimiter } = require('../../middlewares/rateLimiter.middleware');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Registro, login, tokens y verificación de cuenta
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password, display_name]
 *             properties:
 *               username:
 *                 type: string
 *                 example: john_doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               phone:
 *                 type: string
 *                 example: "+5491155550001"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: MyPass@123
 *               display_name:
 *                 type: string
 *                 example: John Doe
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Usuario ya existe
 */
router.post('/register', authLimiter, registerValidator, controller.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, password]
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email, username o teléfono (cualquiera de los tres)
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: MyPass@123
 *     responses:
 *       200:
 *         description: Login exitoso — devuelve access token (refresh en cookie HttpOnly)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', authLimiter, loginValidator, controller.login);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Renovar el access token usando el refresh token (cookie)
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: Nuevo access token generado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Refresh token inválido o expirado
 */
router.post('/refresh-token', authLimiter, controller.refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Cerrar sesión — revoca el refresh token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 */
router.post('/logout', authMiddleware, controller.logout);

/**
 * @swagger
 * /auth/verify-account:
 *   post:
 *     summary: Verificar cuenta con código OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Cuenta verificada
 *       400:
 *         description: Código inválido o expirado
 */
router.post('/verify-account', authMiddleware, verifyAccountValidator, controller.verifyAccount);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Reenviar código de verificación
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [login]
 *             properties:
 *               login:
 *                 type: string
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: Código reenviado
 */
router.post('/resend-verification', authMiddleware, authLimiter, controller.resendVerification);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Solicitar código de recuperación de contraseña (email + SMS opcional)
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier]
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email, teléfono o username registrado
 *                 example: "+50663672990"
 *     responses:
 *       200:
 *         description: Código enviado (respuesta genérica por seguridad)
 *
 * /auth/verify-reset-code:
 *   post:
 *     summary: Verificar código OTP y obtener resetToken
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, code]
 *             properties:
 *               identifier: { type: string }
 *               code: { type: string, example: "123456" }
 *     responses:
 *       200:
 *         description: Código válido — devuelve resetToken
 *       400:
 *         description: Código inválido o expirado
 *
 * /auth/reset-password:
 *   post:
 *     summary: Establecer nueva contraseña con el resetToken
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [resetToken, newPassword]
 *             properties:
 *               resetToken: { type: string }
 *               newPassword: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Contraseña restablecida
 *       401:
 *         description: Token inválido o expirado
 */
router.post('/forgot-password',    authLimiter, forgotPasswordValidator,    controller.forgotPassword);
router.post('/verify-reset-code',  authLimiter, verifyResetCodeValidator,   controller.verifyResetCode);
router.post('/reset-password',     authLimiter, resetPasswordValidator,     controller.resetPassword);

module.exports = router;
