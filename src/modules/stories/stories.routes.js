const { Router } = require('express');
const controller = require('./stories.controller');
const { createStoryValidator } = require('./stories.validator');
const authMiddleware = require('../../middlewares/auth.middleware');
const { uploadImage } = require('../../middlewares/upload.middleware');

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Stories
 *   description: Publicación y visualización de historias
 *
 * /stories:
 *   post:
 *     summary: Crear una nueva historia (multipart/form-data)
 *     tags: [Stories]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image: { type: string, format: binary }
 *               text_content: { type: string, example: "¡Buenos días!" }
 *               content_type: { type: string, example: "image" }
 *               bg_color: { type: string, example: "#FF5733" }
 *     responses:
 *       200: { description: Historia creada }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   get:
 *     summary: Listar historias de contactos
 *     tags: [Stories]
 *     responses:
 *       200: { description: Lista de historias }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /stories/{storyId}:
 *   delete:
 *     summary: Eliminar una historia propia
 *     tags: [Stories]
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Historia eliminada }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /stories/{storyId}/view:
 *   post:
 *     summary: Registrar visualización de una historia
 *     tags: [Stories]
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Visualización registrada }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /stories/{storyId}/viewers:
 *   get:
 *     summary: Obtener lista de visualizadores de una historia
 *     tags: [Stories]
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Lista de visualizadores }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /stories/mute/{userId}:
 *   post:
 *     summary: Silenciar historias de un usuario
 *     tags: [Stories]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Usuario silenciado }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   delete:
 *     summary: Dejar de silenciar historias de un usuario
 *     tags: [Stories]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Usuario dessilenciado }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */

router.get('/latest',                                                   controller.getLatestActivity);
router.post('/',                    uploadImage, createStoryValidator, controller.createStory);
router.get('/',                                                         controller.listStories);
router.delete('/:storyId',                                              controller.deleteStory);
router.post('/:storyId/view',                                           controller.markViewed);
router.get('/:storyId/viewers',                                         controller.getViewers);
router.post('/mute/:userId',                                             controller.muteUser);
router.delete('/mute/:userId',                                           controller.unmuteUser);

module.exports = router;
