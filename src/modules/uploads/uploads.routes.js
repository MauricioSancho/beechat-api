const { Router } = require('express');
const controller = require('./uploads.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const { uploadImage, uploadVideo, uploadAudio, uploadDocument } = require('../../middlewares/upload.middleware');

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Uploads
 *   description: Subida de archivos multimedia
 *
 * /uploads/image:
 *   post:
 *     summary: Subir una imagen (multipart/form-data)
 *     tags: [Uploads]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image: { type: string, format: binary }
 *     responses:
 *       200: { description: Imagen subida, retorna URL }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /uploads/video:
 *   post:
 *     summary: Subir un video (multipart/form-data)
 *     tags: [Uploads]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               video: { type: string, format: binary }
 *     responses:
 *       200: { description: Video subido, retorna URL }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /uploads/audio:
 *   post:
 *     summary: Subir un audio (multipart/form-data)
 *     tags: [Uploads]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               audio: { type: string, format: binary }
 *     responses:
 *       200: { description: Audio subido, retorna URL }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /uploads/document:
 *   post:
 *     summary: Subir un documento (multipart/form-data)
 *     tags: [Uploads]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               document: { type: string, format: binary }
 *     responses:
 *       200: { description: Documento subido, retorna URL }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */

router.post('/image',    uploadImage,    controller.uploadImage);
router.post('/video',    uploadVideo,    controller.uploadVideo);
router.post('/audio',    uploadAudio,    controller.uploadAudio);
router.post('/document', uploadDocument, controller.uploadDocument);

module.exports = router;
