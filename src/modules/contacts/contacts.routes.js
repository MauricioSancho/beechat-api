const { Router } = require('express');
const controller = require('./contacts.controller');
const { addContactValidator } = require('./contacts.validator');
const authMiddleware = require('../../middlewares/auth.middleware');

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Contacts
 *   description: Gestión de contactos del usuario
 *
 * /contacts:
 *   get:
 *     summary: Listar contactos del usuario autenticado
 *     tags: [Contacts]
 *     responses:
 *       200: { description: Lista de contactos }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   post:
 *     summary: Agregar un nuevo contacto
 *     tags: [Contacts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contact_user_id]
 *             properties:
 *               contact_user_id: { type: integer, example: 42 }
 *     responses:
 *       200: { description: Contacto agregado }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /contacts/{contactId}:
 *   delete:
 *     summary: Eliminar un contacto
 *     tags: [Contacts]
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Contacto eliminado }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /contacts/{contactId}/block:
 *   post:
 *     summary: Bloquear un contacto
 *     tags: [Contacts]
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Contacto bloqueado }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   delete:
 *     summary: Desbloquear un contacto
 *     tags: [Contacts]
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Contacto desbloqueado }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */

router.get('/',                         controller.listContacts);
router.post('/',    addContactValidator, controller.addContact);
router.delete('/:contactId',            controller.removeContact);
router.post('/:contactId/block',        controller.blockContact);
router.delete('/:contactId/block',      controller.unblockContact);

module.exports = router;
