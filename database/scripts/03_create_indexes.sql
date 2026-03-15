-- ============================================================
-- BeeChat - Script 03: Crear Índices
-- Ejecutar después de 02_create_tables.sql
-- ============================================================

USE BeeChat;
GO

-- ============================================================
-- Users: búsquedas frecuentes por phone, email, username
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UX_Users_Phone' AND object_id = OBJECT_ID('Users'))
    CREATE UNIQUE INDEX UX_Users_Phone
    ON Users (phone)
    WHERE phone IS NOT NULL AND deleted_at IS NULL;
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UX_Users_Email' AND object_id = OBJECT_ID('Users'))
    CREATE UNIQUE INDEX UX_Users_Email
    ON Users (email)
    WHERE email IS NOT NULL AND deleted_at IS NULL;
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UX_Users_Username' AND object_id = OBJECT_ID('Users'))
    CREATE UNIQUE INDEX UX_Users_Username
    ON Users (username)
    WHERE deleted_at IS NULL;
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_IsActive' AND object_id = OBJECT_ID('Users'))
    CREATE INDEX IX_Users_IsActive
    ON Users (is_active, deleted_at)
    INCLUDE (id, uuid, display_name, avatar_url);
GO

-- ============================================================
-- RefreshTokens: lookup por hash para el flujo de refresh
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UX_RefreshTokens_Hash' AND object_id = OBJECT_ID('RefreshTokens'))
    CREATE UNIQUE INDEX UX_RefreshTokens_Hash
    ON RefreshTokens (token_hash);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RefreshTokens_UserId' AND object_id = OBJECT_ID('RefreshTokens'))
    CREATE INDEX IX_RefreshTokens_UserId
    ON RefreshTokens (user_id, is_revoked);
GO

-- ============================================================
-- UserDevices: dispositivos activos de un usuario
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_UserDevices_UserId' AND object_id = OBJECT_ID('UserDevices'))
    CREATE INDEX IX_UserDevices_UserId
    ON UserDevices (user_id, is_active);
GO

-- ============================================================
-- Contacts: contactos de un usuario
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Contacts_OwnerId' AND object_id = OBJECT_ID('Contacts'))
    CREATE INDEX IX_Contacts_OwnerId
    ON Contacts (owner_id);
GO

-- ============================================================
-- BlockedContacts: verificación rápida de bloqueos
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Blocked_BlockerId' AND object_id = OBJECT_ID('BlockedContacts'))
    CREATE INDEX IX_Blocked_BlockerId
    ON BlockedContacts (blocker_id);
GO

-- ============================================================
-- ChatMembers: chats de un usuario (query más frecuente de la app)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ChatMembers_UserId' AND object_id = OBJECT_ID('ChatMembers'))
    CREATE INDEX IX_ChatMembers_UserId
    ON ChatMembers (user_id, is_active)
    INCLUDE (chat_id, is_archived, is_pinned);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ChatMembers_ChatId' AND object_id = OBJECT_ID('ChatMembers'))
    CREATE INDEX IX_ChatMembers_ChatId
    ON ChatMembers (chat_id, is_active);
GO

-- ============================================================
-- Messages: lectura de mensajes de un chat ordenada por tiempo
-- Esta es la query más frecuente de toda la API
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Messages_ChatId_CreatedAt' AND object_id = OBJECT_ID('Messages'))
    CREATE INDEX IX_Messages_ChatId_CreatedAt
    ON Messages (chat_id, created_at DESC)
    WHERE is_deleted = 0;
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Messages_SenderId' AND object_id = OBJECT_ID('Messages'))
    CREATE INDEX IX_Messages_SenderId
    ON Messages (sender_id);
GO

-- ============================================================
-- MessageStatus: lectura de estado por mensaje
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_MessageStatus_MessageId' AND object_id = OBJECT_ID('MessageStatus'))
    CREATE INDEX IX_MessageStatus_MessageId
    ON MessageStatus (message_id, status);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_MessageStatus_UserId' AND object_id = OBJECT_ID('MessageStatus'))
    CREATE INDEX IX_MessageStatus_UserId
    ON MessageStatus (user_id);
GO

-- ============================================================
-- Groups: grupos de un usuario
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_GroupMembers_UserId' AND object_id = OBJECT_ID('GroupMembers'))
    CREATE INDEX IX_GroupMembers_UserId
    ON GroupMembers (user_id, is_active);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_GroupMembers_GroupId' AND object_id = OBJECT_ID('GroupMembers'))
    CREATE INDEX IX_GroupMembers_GroupId
    ON GroupMembers (group_id, is_active);
GO

-- ============================================================
-- Stories: stories activos por usuario + no expirados
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Stories_UserId_Expires' AND object_id = OBJECT_ID('Stories'))
    CREATE INDEX IX_Stories_UserId_Expires
    ON Stories (user_id, expires_at)
    WHERE is_active = 1;
GO

-- ============================================================
-- Notifications: notificaciones no leídas por usuario
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notifications_UserId_IsRead' AND object_id = OBJECT_ID('Notifications'))
    CREATE INDEX IX_Notifications_UserId_IsRead
    ON Notifications (user_id, is_read, created_at DESC);
GO

-- ============================================================
-- AuditLogs: consultas por usuario y fecha
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AuditLogs_UserId' AND object_id = OBJECT_ID('AuditLogs'))
    CREATE INDEX IX_AuditLogs_UserId
    ON AuditLogs (user_id, created_at DESC);
GO

PRINT '=== All indexes created successfully ===';
GO
