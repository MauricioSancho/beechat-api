const { Router } = require('express');
const controller = require('./groups.controller');
const {
  createGroupValidator,
  updateGroupValidator,
  addMembersValidator,
  changeRoleValidator,
} = require('./groups.validator');
const authMiddleware = require('../../middlewares/auth.middleware');
const { uploadAvatar } = require('../../middlewares/upload.middleware');

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: Gestión de grupos de chat
 *
 * /groups:
 *   post:
 *     summary: Crear un nuevo grupo
 *     tags: [Groups]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, member_ids]
 *             properties:
 *               name: { type: string, example: "Equipo Dev" }
 *               description: { type: string, example: "Canal del equipo de desarrollo" }
 *               member_ids:
 *                 type: array
 *                 items: { type: integer }
 *                 example: [2, 5, 8]
 *     responses:
 *       200: { description: Grupo creado }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   get:
 *     summary: Listar grupos del usuario autenticado
 *     tags: [Groups]
 *     responses:
 *       200: { description: Lista de grupos }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /groups/{groupId}:
 *   get:
 *     summary: Obtener detalle de un grupo
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Detalle del grupo }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   put:
 *     summary: Actualizar nombre y descripción del grupo
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *     responses:
 *       200: { description: Grupo actualizado }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /groups/{groupId}/avatar:
 *   patch:
 *     summary: Actualizar el avatar del grupo (multipart/form-data)
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image: { type: string, format: binary }
 *     responses:
 *       200: { description: Avatar actualizado }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /groups/{groupId}/members:
 *   post:
 *     summary: Agregar miembros al grupo
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_ids]
 *             properties:
 *               user_ids:
 *                 type: array
 *                 items: { type: integer }
 *                 example: [3, 9]
 *     responses:
 *       200: { description: Miembros agregados }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /groups/{groupId}/members/{userId}:
 *   delete:
 *     summary: Expulsar a un miembro del grupo
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Miembro expulsado }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /groups/{groupId}/members/{userId}/role:
 *   patch:
 *     summary: Cambiar el rol de un miembro
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema: { type: integer }
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
 *             required: [role]
 *             properties:
 *               role: { type: string, example: "admin" }
 *     responses:
 *       200: { description: Rol actualizado }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /groups/{groupId}/leave:
 *   delete:
 *     summary: Abandonar un grupo
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Has abandonado el grupo }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */

router.post('/',                          createGroupValidator,  controller.createGroup);
router.get('/',                                                  controller.listGroups);
router.get('/:groupId',                                          controller.getGroupById);
router.put('/:groupId',                   updateGroupValidator,  controller.updateGroup);
router.patch('/:groupId/avatar',          uploadAvatar,          controller.updateGroupAvatar);
router.post('/:groupId/members',          addMembersValidator,   controller.addMembers);
router.delete('/:groupId/members/:userId',                       controller.removeMember);
router.patch('/:groupId/members/:userId/role', changeRoleValidator, controller.changeMemberRole);
router.delete('/:groupId/leave',                                 controller.leaveGroup);

module.exports = router;
