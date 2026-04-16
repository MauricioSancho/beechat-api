const contactsService = require('./contacts.service');
const { sendSuccess, sendCreated, sendMessage, asyncHandler } = require('../../utils/response.helper');

const listContacts = asyncHandler(async (req, res) => {
  const contacts = await contactsService.listContacts(req.user.id);
  return sendSuccess(res, contacts);
});

const addContact = asyncHandler(async (req, res) => {
  const { contactUserId, nickname } = req.body;
  const contact = await contactsService.addContact(req.user.id, parseInt(contactUserId, 10), nickname);
  return sendCreated(res, contact);
});

const removeContact = asyncHandler(async (req, res) => {
  await contactsService.removeContact(req.user.id, parseInt(req.params.contactId, 10));
  return sendMessage(res, 'Contact removed');
});

const updateNickname = asyncHandler(async (req, res) => {
  const { nickname } = req.body;
  await contactsService.updateNickname(req.user.id, parseInt(req.params.contactId, 10), nickname);
  return sendMessage(res, 'Nickname updated');
});

const blockContact = asyncHandler(async (req, res) => {
  await contactsService.blockContact(req.user.id, parseInt(req.params.contactId, 10));
  return sendMessage(res, 'User blocked');
});

const unblockContact = asyncHandler(async (req, res) => {
  await contactsService.unblockContact(req.user.id, parseInt(req.params.contactId, 10));
  return sendMessage(res, 'User unblocked');
});

module.exports = { listContacts, addContact, removeContact, updateNickname, blockContact, unblockContact };
