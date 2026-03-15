const usersRepo = require('./users.repository');
const { ERRORS } = require('../../shared/constants');

async function getProfile(userId) {
  const user = await usersRepo.findById(userId);
  if (!user) throw ERRORS.NOT_FOUND('User');
  return user;
}

async function updateProfile(userId, { displayName, username }) {
  if (username) {
    const existing = await usersRepo.findByUsername(username);
    if (existing && existing.id !== userId) throw ERRORS.CONFLICT('Username is already taken');
  }

  const updated = await usersRepo.updateProfile(userId, { displayName, username });
  if (!updated) throw ERRORS.NOT_FOUND('User');
  return updated;
}

async function updateAvatar(userId, avatarUrl) {
  await usersRepo.updateAvatar(userId, avatarUrl);
  return usersRepo.findById(userId);
}

async function updateBio(userId, bio) {
  await usersRepo.updateBio(userId, bio);
}

async function updatePhone(userId, phone) {
  const existing = await usersRepo.findByPhone(phone);
  if (existing && existing.id !== userId) throw ERRORS.CONFLICT('Phone number is already in use');
  await usersRepo.updatePhone(userId, phone);
}

async function searchUsers(searchTerm, currentUserId) {
  return usersRepo.searchUsers(searchTerm, currentUserId);
}

module.exports = {
  getProfile,
  updateProfile,
  updateAvatar,
  updateBio,
  updatePhone,
  searchUsers,
};
