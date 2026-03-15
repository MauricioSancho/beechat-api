const contactsRepo = require('./contacts.repository');
const usersRepo = require('../users/users.repository');
const { ERRORS } = require('../../shared/constants');

async function listContacts(userId) {
  return contactsRepo.findAllByOwner(userId);
}

async function addContact(ownerId, contactUserId, nickname) {
  if (ownerId === contactUserId) throw ERRORS.BAD_REQUEST('Cannot add yourself as contact');

  const targetUser = await usersRepo.findById(contactUserId);
  if (!targetUser) throw ERRORS.NOT_FOUND('User');

  const existing = await contactsRepo.findPair(ownerId, contactUserId);
  if (existing) throw ERRORS.CONFLICT('Contact already added');

  return contactsRepo.create(ownerId, contactUserId, nickname);
}

async function removeContact(ownerId, contactUserId) {
  const affected = await contactsRepo.remove(ownerId, contactUserId);
  if (!affected) throw ERRORS.NOT_FOUND('Contact');
}

async function blockContact(blockerId, blockedId) {
  if (blockerId === blockedId) throw ERRORS.BAD_REQUEST('Cannot block yourself');

  const already = await contactsRepo.isBlocked(blockerId, blockedId);
  if (already) throw ERRORS.CONFLICT('User is already blocked');

  await contactsRepo.block(blockerId, blockedId);
}

async function unblockContact(blockerId, blockedId) {
  const blocked = await contactsRepo.isBlocked(blockerId, blockedId);
  if (!blocked) throw ERRORS.NOT_FOUND('Blocked contact');

  await contactsRepo.unblock(blockerId, blockedId);
}

module.exports = { listContacts, addContact, removeContact, blockContact, unblockContact };
