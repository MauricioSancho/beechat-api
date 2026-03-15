const notificationsService = require('./notifications.service');
const { sendPaginated, sendMessage, asyncHandler } = require('../../utils/response.helper');

const listNotifications = asyncHandler(async (req, res) => {
  const { notifications, total, page, limit } = await notificationsService.listNotifications(
    req.user.id,
    req.query
  );
  return sendPaginated(res, notifications, total, page, limit);
});

const markAsRead = asyncHandler(async (req, res) => {
  await notificationsService.markAsRead(parseInt(req.params.id, 10), req.user.id);
  return sendMessage(res, 'Notification marked as read');
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationsService.markAllAsRead(req.user.id);
  return sendMessage(res, 'All notifications marked as read');
});

const deleteNotification = asyncHandler(async (req, res) => {
  await notificationsService.deleteNotification(parseInt(req.params.id, 10), req.user.id);
  return sendMessage(res, 'Notification deleted');
});

module.exports = { listNotifications, markAsRead, markAllAsRead, deleteNotification };
