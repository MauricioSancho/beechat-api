/**
 * Enums globales de BeeChat
 * Usados en toda la app para evitar strings mágicos
 */

const MessageType = Object.freeze({
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  DOCUMENT: 'document',
});

const ChatType = Object.freeze({
  PRIVATE: 'private',
  GROUP: 'group',
});

const MemberRole = Object.freeze({
  ADMIN: 'admin',
  MEMBER: 'member',
});

const MessageStatusEnum = Object.freeze({
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
});

const ContentType = Object.freeze({
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
});

const DeviceType = Object.freeze({
  ANDROID: 'android',
  IOS: 'ios',
  WEB: 'web',
});

const NotificationType = Object.freeze({
  MESSAGE: 'message',
  STORY: 'story',
  CONTACT: 'contact',
  SYSTEM: 'system',
  GROUP: 'group',
});

const AdminRole = Object.freeze({
  SUPERADMIN: 'superadmin',
  MODERATOR: 'moderator',
});

const UserRole = Object.freeze({
  USER: 'user',
  ADMIN: 'admin',
});

module.exports = {
  MessageType,
  ChatType,
  MemberRole,
  MessageStatusEnum,
  ContentType,
  DeviceType,
  NotificationType,
  AdminRole,
  UserRole,
};
