const { Router } = require('express');
const controller = require('./users.controller');
const {
  updateProfileValidator,
  updateBioValidator,
  updatePhoneValidator,
  searchUsersValidator,
} = require('./users.validator');
const authMiddleware = require('../../middlewares/auth.middleware');
const { uploadImage } = require('../../middlewares/upload.middleware');

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Perfil propio y búsqueda de usuarios
 *
 * /users/me:
 *   get:
 *     summary: Obtener perfil propio
 *     tags: [Users]
 *     responses:
 *       200: { description: Perfil del usuario autenticado }
 *   put:
 *     summary: Actualizar display_name y/o bio
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               display_name: { type: string, example: Ronald Sancho }
 *               bio:          { type: string, example: Flutter dev }
 *     responses:
 *       200: { description: Perfil actualizado }
 *
 * /users/me/avatar:
 *   patch:
 *     summary: Cambiar foto de perfil (multipart/form-data)
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       200: { description: Avatar actualizado }
 *
 * /users/me/bio:
 *   patch:
 *     summary: Actualizar descripción
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio: { type: string, example: "Backend dev 🚀" }
 *     responses:
 *       200: { description: Bio actualizada }
 *
 * /users/me/phone:
 *   patch:
 *     summary: Actualizar número de teléfono
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone: { type: string, example: "+50661168890" }
 *     responses:
 *       200: { description: Teléfono actualizado }
 *
 * /users/search:
 *   get:
 *     summary: Buscar usuarios por username o display_name
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *         description: Mínimo 2 caracteres
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Usuarios encontrados }
 */
router.get('/me',           controller.getMe);
router.put('/me',           updateProfileValidator, controller.updateMe);
router.patch('/me/avatar',  uploadImage,            controller.updateAvatar);
router.patch('/me/bio',     updateBioValidator,     controller.updateBio);
router.patch('/me/phone',   updatePhoneValidator,   controller.updatePhone);
router.get('/search',       searchUsersValidator,   controller.searchUsers);

module.exports = router;
