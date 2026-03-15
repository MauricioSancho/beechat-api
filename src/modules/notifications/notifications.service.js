const notificationsRepo = require('./notifications.repository');
const { parsePagination } = require('../../utils/pagination.helper');

async function listNotifications(userId, queryParams) {
  const { page, limit, offset } = parsePagination(queryParams);
  const { rows, total } = await notificationsRepo.findByUserId(userId, { offset, limit });
  return { notifications: rows, total, page, limit };
}

async function markAsRead(id, userId) {
  await notificationsRepo.markAsRead(id, userId);
}

async function markAllAsRead(userId) {
  await notificationsRepo.markAllAsRead(userId);
}

async function deleteNotification(id, userId) {
  await notificationsRepo.remove(id, userId);
}

// Usado internamente por otros servicios para crear notificaciones
async function createNotification({ userId, type, title, body, dataJson }) {
  await notificationsRepo.create({ userId, type, title, body, dataJson });
}

module.exports = {
  listNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
};
