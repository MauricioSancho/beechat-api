-- ============================================================
--  BeeChat API — Script SQL UNIFICADO
--  Versión: 1.0.0  |  Compatible: SQL Server 2016+
--  Ejecutar en SSMS conectado como SA (o usuario dbo)
--  También válido para Plesk > Bases de datos > SQL Server
--
--  Orden:
--    01  Crear base de datos
--    02  Crear tablas (20 tablas en orden de dependencia FK)
--    03  Crear índices
--    04  Datos semilla (roles + admin + 2 usuarios de prueba)
--
--  ⚠️  ANTES DE PRODUCCIÓN:
--      - Cambiar contraseñas del admin y usuarios de prueba
--      - Eliminar o comentar la sección de usuarios de prueba
-- ============================================================

SET NOCOUNT ON;
GO

-- ============================================================
-- 01  BASE DE DATOS
-- ============================================================

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'BeeChat')
BEGIN
    CREATE DATABASE BeeChat COLLATE Latin1_General_CI_AS;
    PRINT 'Base de datos BeeChat creada.';
END
ELSE
BEGIN
    PRINT 'Base de datos BeeChat ya existe.';
END
GO

USE BeeChat;
GO

-- ============================================================
-- 02  TABLAS
--     Orden estricto de creación respetando dependencias FK.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Roles
-- ------------------------------------------------------------
IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[Roles]') AND type = 'U'
)
BEGIN
    CREATE TABLE dbo.Roles (
        id          INT           IDENTITY(1,1) NOT NULL,
        name        VARCHAR(30)   NOT NULL,
        description NVARCHAR(200) NULL,
        created_at  DATETIME      NOT NULL CONSTRAINT DF_Roles_created_at DEFAULT GETUTCDATE(),
        CONSTRAINT PK_Roles      PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_Roles_Name UNIQUE (name)
    );
    PRINT 'Tabla Roles creada.';
END
GO

-- ------------------------------------------------------------
-- 2. Users
-- ------------------------------------------------------------
IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND type = 'U'
)
BEGIN
    CREATE TABLE dbo.Users (
        id             INT              IDENTITY(1,1) NOT NULL,
        uuid           UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Users_uuid DEFAULT NEWID(),
        phone          VARCHAR(20)      NULL,
        email          VARCHAR(255)     NULL,
        username       VARCHAR(50)      NOT NULL,
        password_hash  VARCHAR(255)     NOT NULL,
        display_name   NVARCHAR(100)    NOT NULL,
        bio            NVARCHAR(300)    NULL,
        avatar_url     VARCHAR(500)     NULL,
        is_verified    BIT              NOT NULL CONSTRAINT DF_Users_is_verified DEFAULT 0,
        is_active      BIT              NOT NULL CONSTRAINT DF_Users_is_active   DEFAULT 1,
        last_seen      DATETIME         NULL,
        created_at     DATETIME         NOT NULL CONSTRAINT DF_Users_created_at DEFAULT GETUTCDATE(),
        updated_at     DATETIME         NOT NULL CONSTRAINT DF_Users_updated_at DEFAULT GETUTCDATE(),
        deleted_at     DATETIME         NULL,
        CONSTRAINT PK_Users      PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_Users_UUID UNIQUE (uuid)
    );
    PRINT 'Tabla Users creada.';
END
GO

-- ------------------------------------------------------------
-- 3. UserRoles
-- ------------------------------------------------------------
IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[UserRoles]') AND type = 'U'
)
BEGIN
    CREATE TABLE dbo.UserRoles (
        user_id    INT      NOT NULL,
        role_id    INT      NOT NULL,
        created_at DATETIME NOT NULL CONSTRAINT DF_UserRoles_created_at DEFAULT GETUTCDATE(),
        CONSTRAINT PK_UserRoles      PRIMARY KEY CLUSTERED (user_id, role_id),
        CONSTRAINT FK_UserRoles_User FOREIGN KEY (user_id) REFERENCES dbo.Users(id) ON DELETE CASCADE,
        CONSTRAINT FK_UserRoles_Role FOREIGN KEY (role_id) REFERENCES dbo.Roles(id) ON DELETE CASCADE
    );
    PRINT 'Tabla UserRoles creada.';
END
GO

-- ------------------------------------------------------------
-- 4. RefreshTokens
--    Solo se guarda el hash SHA-256 del token (nunca el crudo)
-- ------------------------------------------------------------
IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[RefreshTokens]') AND type = 'U'
)
BEGIN
    CREATE TABLE dbo.RefreshTokens (
        id          INT         IDENTITY(1,1) NOT NULL,
        user_id     INT         NOT NULL,
        token_hash  VARCHAR(64) NOT NULL,   -- SHA-256 hex, 64 chars
        device_id   INT         NULL,
        expires_at  DATETIME    NOT NULL,
        is_revoked  BIT         NOT NULL CONSTRAINT DF_RefreshTokens_is_revoked DEFAULT 0,
        created_at  DATETIME    NOT NULL CONSTRAINT DF_RefreshTokens_created_at DEFAULT GETUTCDATE(),
        CONSTRAINT PK_RefreshTokens      PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_RefreshTokens_User FOREIGN KEY (user_id) REFERENCES dbo.Users(id) ON DELETE CASCADE
    );
    PRINT 'Tabla RefreshTokens creada.';
END
GO

-- ------------------------------------------------------------
-- 5. UserDevices
-- ------------------------------------------------------------
IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[UserDevices]') AND type = 'U'
)
BEGIN
    CREATE TABLE dbo.UserDevices (
        id             INT           IDENTITY(1,1) NOT NULL,
        user_id        INT           NOT NULL,
        device_token   VARCHAR(200)  NULL,
        device_type    VARCHAR(10)   NOT NULL
            CONSTRAINT DF_UserDevices_type    DEFAULT 'android'
            CONSTRAINT CHK_UserDevices_Type   CHECK (device_type IN ('android', 'ios', 'web', 'desktop')),
        device_name    NVARCHAR(100) NULL,
        push_token     VARCHAR(500)  NULL,
        is_active      BIT           NOT NULL CONSTRAINT DF_UserDevices_is_active   DEFAULT 1,
        is_verified    BIT           NOT NULL CONSTRAINT DF_UserDevices_is_verified DEFAULT 0,
        last_active_at DATETIME      NULL,
        created_at     DATETIME      NOT NULL CONSTRAINT DF_UserDevices_created_at DEFAULT GETUTCDATE(),
        updated_at     DATETIME      NOT NULL CONSTRAINT DF_UserDevices_updated_at DEFAULT GETUTCDATE(),
        CONSTRAINT PK_UserDevices      PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_UserDevices_User FOREIGN KEY (user_id) REFERENCES dbo.Users(id) ON DELETE CASCADE
    );
    PRINT 'Tabla UserDevices creada.';
END
GO

-- Agregar FK de RefreshTokens → UserDevices (creada después de UserDevices)
-- NO ACTION: Users→RefreshTokens ya tiene CASCADE; una segunda ruta de cascade
-- (Users→UserDevices→RefreshTokens) generaría múltiples rutas → error 1785.
-- La limpieza de device_id se realiza desde la aplicación al revocar tokens.
IF NOT EXISTS (
    SELECT * FROM sys.foreign_keys WHERE name = 'FK_RefreshTokens_Device'
)
BEGIN
    ALTER TABLE dbo.RefreshTokens
        ADD CONSTRAINT FK_RefreshTokens_Device
        FOREIGN KEY (device_id) REFERENCES dbo.UserDevices(id);
    PRINT 'FK_RefreshTokens_Device agregada.';
END
GO

-- ------------------------------------------------------------
-- 6. Contacts
-- ------------------------------------------------------------
IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[Contacts]') AND type = 'U'
)
BEGIN
    CREATE TABLE dbo.Contacts (
        id              INT           IDENTITY(1,1) NOT NULL,
        owner_id        INT           NOT NULL,
        contact_user_id INT           NOT NULL,
        nickname        NVARCHAR(100) NULL,
        created_at      DATETIME      NOT NULL CONSTRAINT DF_Contacts_created_at DEFAULT GETUTCDATE(),
        updated_at      DATETIME      NOT NULL CONSTRAINT DF_Contacts_updated_at DEFAULT GETUTCDATE(),
        CONSTRAINT PK_Contacts          PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_Contacts_Owner    FOREIGN KEY (owner_id)        REFERENCES dbo.Users(id),
        CONSTRAINT FK_Contacts_Contact  FOREIGN KEY (contact_user_id) REFERENCES dbo.Users(id),
        CONSTRAINT UQ_Contacts_Pair     UNIQUE (owner_id, contact_user_id),
        CONSTRAINT CHK_Contacts_Self    CHECK (owner_id <> contact_user_id)
    );
    PRINT 'Tabla Contacts creada.';
END
GO

-- ------------------------------------------------------------
-- 7. BlockedContacts
-- ------------------------------------------------------------
IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[BlockedContacts]') AND type = 'U'
)
BEGIN
    CREATE TABLE dbo.BlockedContacts (
        id         INT      IDENTITY(1,1) NOT NULL,
        blocker_id INT      NOT NULL,
        blocked_id INT      NOT NULL,
        created_at DATETIME NOT NULL CONSTRAINT DF_BlockedContacts_created_at DEFAULT GETUTCDATE(),
        CONSTRAINT PK_BlockedContacts      PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_Blocked_Blocker      FOREIGN KEY (blocker_id) REFERENCES dbo.Users(id),
        CONSTRAINT FK_Blocked_Blocked      FOREIGN KEY (blocked_id) REFERENCES dbo.Users(id),
        CONSTRAINT UQ_Blocked_Pair         UNIQUE (blocker_id, blocked_id),
        CONSTRAINT CHK_Blocked_Self        CHECK (blocker_id <> blocked_id)
    );
    PRINT 'Tabla BlockedContacts creada.';
END
GO

-- ------------------------------------------------------------
-- 8. Chats
-- ------------------------------------------------------------
IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[Chats]') AND type = 'U'
)
BEGIN
    CREATE TABLE dbo.Chats (
        id         INT              IDENTITY(1,1) NOT NULL,
        uuid       UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Chats_uuid DEFAULT NEWID(),
        type       VARCHAR(10)      NOT NULL
            CONSTRAINT DF_Chats_type  DEFAULT 'private'
            CONSTRAINT CHK_Chats_Type CHECK (type IN ('private', 'group')),
        created_by INT              NOT NULL,
        created_at DATETIME         NOT NULL CONSTRAINT DF_Chats_created_at DEFAULT GETUTCDATE(),
        updated_at DATETIME         NOT NULL CONSTRAINT DF_Chats_updated_at DEFAULT GETUTCDATE(),
        deleted_at DATETIME         NULL,
        CONSTRAINT PK_Chats         PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_Chats_UUID    UNIQUE (uuid),
        CONSTRAINT FK_Chats_Creator FOREIGN KEY (created_by) REFERENCES dbo.Users(id)
    );
    PRINT 'Tabla Chats creada.';
END
GO

-- ------------------------------------------------------------
-- 9. ChatMembers
-- ------------------------------------------------------------
IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[ChatMembers]') AND type = 'U'
)
BEGIN
    CREATE TABLE dbo.ChatMembers (
        id          INT      IDENTITY(1,1) NOT NULL,
        chat_id     INT      NOT NULL,
        user_id     INT      NOT NULL,
        role        VARCHAR(10) NOT NULL
            CONSTRAINT DF_ChatMembers_role  DEFAULT 'member'
            CONSTRAINT CHK_ChatMembers_Role CHECK (role IN ('admin', 'member')),
        is_active   BIT      NOT NULL CONSTRAINT DF_ChatMembers_is_active  DEFAULT 1,
        is_archived BIT      NOT NULL CONSTRAINT DF_ChatMembers_is_archived DEFAULT 0,
        is_pinned   BIT      NOT NULL CONSTRAINT DF_ChatMembers_is_pinned   DEFAULT 0,
        joined_at   DATETIME NOT NULL CONSTRAINT DF_ChatMembers_joined_at  DEFAULT GETUTCDATE(),
        left_at     DATETIME NULL,
        CONSTRAINT PK_ChatMembers       PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_ChatMembers_Chat  FOREIGN KEY (chat_id)  REFERENCES dbo.Chats(id) ON DELETE CASCADE,
        CONSTRAINT FK_ChatMembers_User  FOREIGN KEY (user_id)  REFERENCES dbo.Users(id),
        CONSTRAINT UQ_ChatMembers_Pair  UNIQUE (chat_id, user_id)
    );
    PRINT 'Tabla ChatMembers creada.';
END
GO

-- ------------------------------------------------------------
-- 10. Messages
-- ------------------------------------------------------------
IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[Messages]') AND type = 'U'
)
BEGIN
    CREATE TABLE dbo.Messages (
        id           INT              IDENTITY(1,1) NOT NULL,
        uuid         UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Messages_uuid DEFAULT NEWID(),
        chat_id      INT              NOT NULL,
        sender_id    INT              NOT NULL,
        content      NVARCHAR(MAX)    NULL,
        message_type VARCHAR(15)      NOT NULL
            CONSTRAINT DF_Messages_type  DEFAULT 'text'
            CONSTRAINT CHK_Messages_Type CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document')),
        reply_to_id  INT              NULL,
        is_edited    BIT              NOT NULL CONSTRAINT DF_Messages_is_edited  DEFAULT 0,
        is_deleted   BIT              NOT NULL CONSTRAINT DF_Messages_is_deleted DEFAULT 0,
        created_at   DATETIME         NOT NULL CONSTRAINT DF_Messages_created_at DEFAULT GETUTCDATE(),
        updated_at   DATETIME         NOT NULL CONSTRAINT DF_Messages_updated_at DEFAULT GETUTCDATE(),
        CONSTRAINT PK_Messages          PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_Messages_UUID     UNIQUE (uuid),
        CONSTRAINT FK_Messages_Chat     FOREIGN KEY (chat_id)    REFERENCES dbo.Chats(id),
        CONSTRAINT FK_Messages_Sender   FOREIGN KEY (sender_id)  REFERENCES dbo.Users(id),
        CONSTRAINT FK_Messages_ReplyTo  FOREIGN KEY (reply_to_id) REFERENCES dbo.Messages(id)
    );
    PRINT 'Tabla Messages creada.';
END
GO

-- ------------------------------------------------------------
-- 11. MessageAttachments
-- ------------------------------------------------------------
IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[MessageAttachments]') AND type = 'U'
)
BEGIN
    CREATE TABLE dbo.MessageAttachments (
        id         INT           IDENTITY(1,1) NOT NULL,
        message_id INT           NOT NULL,
        file_url   VARCHAR(500)  NOT NULL,
        file_type  VARCHAR(50)   NULL,
        file_size  BIGINT        NULL,
        file_name  NVARCHAR(255) NULL,
        created_at DATETIME      NOT NULL CONSTRAINT DF_MsgAttach_created_at DEFAULT GETUTCDATE(),
        CONSTRAINT PK_MessageAttachments      PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_MsgAttach_Message       FOREIGN KEY (message_id) REFERENCES dbo.Messages(id) ON DELETE CASCADE
    );
    PRINT 'Tabla MessageAttachments creada.';
END
GO

-- ------------------------------------------------------------
-- 12. MessageStatus
--     Uno por mensaje × destinatario (en grupos: un registro por miembro)
-- ------------------------------------------------------------
IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[MessageStatus]') AND type = 'U'
)
BEGIN
    CREATE TABLE dbo.MessageStatus (
        id         INT      IDENTITY(1,1) NOT NULL,
        message_id INT      NOT NULL,
        user_id    INT      NOT NULL,
        status     VARCHAR(10) NOT NULL
            CONSTRAINT DF_MsgStatus_status  DEFAULT 'sent'
            CONSTRAINT CHK_MsgStatus_Status CHECK (status IN ('sent', 'delivered', 'read')),
        updated_at DATETIME NOT NULL CONSTRAINT DF_MsgStatus_updated_at DEFAULT GETUTCDATE(),
        CONSTRAINT PK_MessageStatus         PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_MsgStatus_Message     FOREIGN KEY (message_id) REFERENCES dbo.Messages(id) ON DELETE CASCADE,
        CONSTRAINT FK_MsgStatus_User        FOREIGN KEY (user_id)    REFERENCES dbo.Users(id),
        CONSTRAINT UQ_MsgStatus_Pair        UNIQUE (message_id, user_id)
    );
    PRINT 'Tabla MessageStatus creada.';
END
GO

-- ------------------------------------------------------------
-- 13. Groups
-- ------------------------------------------------------------
IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[Groups]') AND type = 'U'
)
BEGIN
    CREATE TABLE dbo.[Groups] (
        id          INT           IDENTITY(1,1) NOT NULL,
        chat_id     INT           NOT NULL,
        name        NVARCHAR(100) NOT NULL,
        description NVARCHAR(500) NULL,
        avatar_url  VARCHAR(500)  NULL,
        created_by  INT           NOT NULL,
        created_at  DATETIME      NOT NULL CONSTRAINT DF_Groups_created_at DEFAULT GETUTCDATE(),
        updated_at  DATETIME      NOT NULL CONSTRAINT DF_Groups_updated_at DEFAULT GETUTCDATE(),
        CONSTRAINT PK_Groups          PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_Groups_Chat     FOREIGN KEY (chat_id)    REFERENCES dbo.Chats(id),
        CONSTRAINT FK_Groups_Creator  FOREIGN KEY (created_by) REFERENCES dbo.Users(id)
    );
    PRINT 'Tabla Groups creada.';
END
GO

-- ------------------------------------------------------------
-- 14. GroupMembers
-- ------------------------------------------------------------
IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[GroupMembers]') AND type = 'U'
)
BEGIN
    CREATE TABLE dbo.GroupMembers (
        id        INT      IDENTITY(1,1) NOT NULL,
        group_id  INT      NOT NULL,
        user_id   INT      NOT NULL,
        role      VARCHAR(10) NOT NULL
            CONSTRAINT DF_GroupMembers_role  DEFAULT 'member'
            CONSTRAINT CHK_GroupMembers_Role CHECK (role IN ('admin', 'member')),
        is_active BIT      NOT NULL CONSTRAINT DF_GroupMembers_is_active DEFAULT 1,
        joined_at DATETIME NOT NULL CONSTRAINT DF_GroupMembers_joined_at DEFAULT GETUTCDATE(),
        left_at   DATETIME NULL,
        CONSTRAINT PK_GroupMembers        PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_GroupMembers_Group  FOREIGN KEY (group_id) REFERENCES dbo.[Groups](id) ON DELETE CASCADE,
        CONSTRAINT FK_GroupMembers_User   FOREIGN KEY (user_id)  REFERENCES dbo.Users(id),
        CONSTRAINT UQ_GroupMembers_Pair   UNIQUE (group_id, user_id)
    );
    PRINT 'Tabla GroupMembers creada.';
END
GO

-- ------------------------------------------------------------
-- 15. Stories
-- ------------------------------------------------------------
IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[Stories]') AND type = 'U'
)
BEGIN
    CREATE TABLE dbo.Stories (
        id           INT           IDENTITY(1,1) NOT NULL,
        user_id      INT           NOT NULL,
        content_type VARCHAR(10)   NOT NULL
            CONSTRAINT DF_Stories_content_type  DEFAULT 'text'
            CONSTRAINT CHK_Stories_Type         CHECK (content_type IN ('text', 'image', 'video')),
        content_url  VARCHAR(500)  NULL,
        text_content NVARCHAR(500) NULL,
        bg_color     VARCHAR(10)   NULL CONSTRAINT DF_Stories_bg_color DEFAULT '#000000',
        duration     INT           NULL CONSTRAINT DF_Stories_duration  DEFAULT 5,  -- segundos
        expires_at   DATETIME      NOT NULL
            CONSTRAINT DF_Stories_expires_at DEFAULT (DATEADD(HOUR, 24, GETUTCDATE())),
        is_active    BIT           NOT NULL CONSTRAINT DF_Stories_is_active DEFAULT 1,
        created_at   DATETIME      NOT NULL CONSTRAINT DF_Stories_created_at DEFAULT GETUTCDATE(),
        CONSTRAINT PK_Stories       PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_Stories_User  FOREIGN KEY (user_id) REFERENCES dbo.Users(id) ON DELETE CASCADE
    );
    PRINT 'Tabla Stories creada.';
END
GO

-- ------------------------------------------------------------
-- 16. StoryViews
-- ------------------------------------------------------------
IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[StoryViews]') AND type = 'U'
)
BEGIN
    CREATE TABLE dbo.StoryViews (
        id        INT      IDENTITY(1,1) NOT NULL,
        story_id  INT      NOT NULL,
        viewer_id INT      NOT NULL,
        viewed_at DATETIME NOT NULL CONSTRAINT DF_StoryViews_viewed_at DEFAULT GETUTCDATE(),
        CONSTRAINT PK_StoryViews          PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_StoryViews_Story    FOREIGN KEY (story_id)  REFERENCES dbo.Stories(id) ON DELETE CASCADE,
        CONSTRAINT FK_StoryViews_Viewer   FOREIGN KEY (viewer_id) REFERENCES dbo.Users(id),
        CONSTRAINT UQ_StoryViews_Pair     UNIQUE (story_id, viewer_id)
    );
    PRINT 'Tabla StoryViews creada.';
END
GO

-- ------------------------------------------------------------
-- 17. StoryMutes
-- ------------------------------------------------------------
IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[StoryMutes]') AND type = 'U'
)
BEGIN
    CREATE TABLE dbo.StoryMutes (
        id            INT      IDENTITY(1,1) NOT NULL,
        user_id       INT      NOT NULL,   -- quien silencia
        muted_user_id INT      NOT NULL,   -- a quien silencia
        created_at    DATETIME NOT NULL CONSTRAINT DF_StoryMutes_created_at DEFAULT GETUTCDATE(),
        CONSTRAINT PK_StoryMutes           PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_StoryMutes_User      FOREIGN KEY (user_id)       REFERENCES dbo.Users(id),
        CONSTRAINT FK_StoryMutes_MutedUser FOREIGN KEY (muted_user_id) REFERENCES dbo.Users(id),
        CONSTRAINT UQ_StoryMutes_Pair      UNIQUE (user_id, muted_user_id),
        CONSTRAINT CHK_StoryMutes_Self     CHECK (user_id <> muted_user_id)
    );
    PRINT 'Tabla StoryMutes creada.';
END
GO

-- ------------------------------------------------------------
-- 18. Notifications
-- ------------------------------------------------------------
IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[Notifications]') AND type = 'U'
)
BEGIN
    CREATE TABLE dbo.Notifications (
        id          INT           IDENTITY(1,1) NOT NULL,
        user_id     INT           NOT NULL,
        type        VARCHAR(20)   NOT NULL
            CONSTRAINT DF_Notifications_type  DEFAULT 'system'
            CONSTRAINT CHK_Notif_Type         CHECK (type IN ('message', 'story', 'contact', 'system', 'group')),
        title       NVARCHAR(100) NOT NULL,
        body        NVARCHAR(500) NULL,
        data_json   NVARCHAR(MAX) NULL,   -- JSON con datos extra para la app
        is_read     BIT           NOT NULL CONSTRAINT DF_Notifications_is_read DEFAULT 0,
        created_at  DATETIME      NOT NULL CONSTRAINT DF_Notifications_created_at DEFAULT GETUTCDATE(),
        CONSTRAINT PK_Notifications        PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_Notifications_User   FOREIGN KEY (user_id) REFERENCES dbo.Users(id) ON DELETE CASCADE
    );
    PRINT 'Tabla Notifications creada.';
END
GO

-- ------------------------------------------------------------
-- 19. AdminUsers
-- ------------------------------------------------------------
IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[AdminUsers]') AND type = 'U'
)
BEGIN
    CREATE TABLE dbo.AdminUsers (
        id            INT          IDENTITY(1,1) NOT NULL,
        username      VARCHAR(50)  NOT NULL,
        email         VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role          VARCHAR(20)  NOT NULL
            CONSTRAINT DF_AdminUsers_role  DEFAULT 'moderator'
            CONSTRAINT CHK_AdminUsers_Role CHECK (role IN ('superadmin', 'moderator')),
        is_active     BIT          NOT NULL CONSTRAINT DF_AdminUsers_is_active DEFAULT 1,
        created_at    DATETIME     NOT NULL CONSTRAINT DF_AdminUsers_created_at DEFAULT GETUTCDATE(),
        updated_at    DATETIME     NOT NULL CONSTRAINT DF_AdminUsers_updated_at DEFAULT GETUTCDATE(),
        CONSTRAINT PK_AdminUsers           PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_AdminUsers_Username  UNIQUE (username),
        CONSTRAINT UQ_AdminUsers_Email     UNIQUE (email)
    );
    PRINT 'Tabla AdminUsers creada.';
END
GO

-- ------------------------------------------------------------
-- 20. AuditLogs
-- ------------------------------------------------------------
IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[AuditLogs]') AND type = 'U'
)
BEGIN
    CREATE TABLE dbo.AuditLogs (
        id           INT           IDENTITY(1,1) NOT NULL,
        user_id      INT           NULL,          -- NULL si la acción es del sistema
        action       VARCHAR(100)  NOT NULL,
        entity_type  VARCHAR(50)   NULL,
        entity_id    INT           NULL,
        details_json NVARCHAR(MAX) NULL,
        ip_address   VARCHAR(45)   NULL,
        created_at   DATETIME      NOT NULL CONSTRAINT DF_AuditLogs_created_at DEFAULT GETUTCDATE(),
        CONSTRAINT PK_AuditLogs      PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_AuditLogs_User FOREIGN KEY (user_id) REFERENCES dbo.Users(id)
    );
    PRINT 'Tabla AuditLogs creada.';
END
GO

PRINT '=== Tablas creadas (20/20) ===';
GO


-- ============================================================
-- 03  ÍNDICES
--     Filtrados donde corresponde para mejorar rendimiento.
--     IF NOT EXISTS: seguros para re-ejecutar.
-- ============================================================

-- Users: búsqueda por phone, email, username
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UX_Users_Phone' AND object_id = OBJECT_ID('dbo.Users'))
    CREATE UNIQUE INDEX UX_Users_Phone
    ON dbo.Users (phone)
    WHERE phone IS NOT NULL AND deleted_at IS NULL;
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UX_Users_Email' AND object_id = OBJECT_ID('dbo.Users'))
    CREATE UNIQUE INDEX UX_Users_Email
    ON dbo.Users (email)
    WHERE email IS NOT NULL AND deleted_at IS NULL;
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UX_Users_Username' AND object_id = OBJECT_ID('dbo.Users'))
    CREATE UNIQUE INDEX UX_Users_Username
    ON dbo.Users (username)
    WHERE deleted_at IS NULL;
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_IsActive' AND object_id = OBJECT_ID('dbo.Users'))
    CREATE INDEX IX_Users_IsActive
    ON dbo.Users (is_active, deleted_at)
    INCLUDE (id, uuid, display_name, avatar_url);
GO

-- RefreshTokens: lookup por hash (flujo de refresh)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UX_RefreshTokens_Hash' AND object_id = OBJECT_ID('dbo.RefreshTokens'))
    CREATE UNIQUE INDEX UX_RefreshTokens_Hash
    ON dbo.RefreshTokens (token_hash);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RefreshTokens_UserId' AND object_id = OBJECT_ID('dbo.RefreshTokens'))
    CREATE INDEX IX_RefreshTokens_UserId
    ON dbo.RefreshTokens (user_id, is_revoked);
GO

-- UserDevices
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_UserDevices_UserId' AND object_id = OBJECT_ID('dbo.UserDevices'))
    CREATE INDEX IX_UserDevices_UserId
    ON dbo.UserDevices (user_id, is_active);
GO

-- Contacts
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Contacts_OwnerId' AND object_id = OBJECT_ID('dbo.Contacts'))
    CREATE INDEX IX_Contacts_OwnerId
    ON dbo.Contacts (owner_id);
GO

-- BlockedContacts: check rápido de bloqueos
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Blocked_BlockerId' AND object_id = OBJECT_ID('dbo.BlockedContacts'))
    CREATE INDEX IX_Blocked_BlockerId
    ON dbo.BlockedContacts (blocker_id);
GO

-- ChatMembers: chats de un usuario — query MÁS frecuente de la app
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ChatMembers_UserId' AND object_id = OBJECT_ID('dbo.ChatMembers'))
    CREATE INDEX IX_ChatMembers_UserId
    ON dbo.ChatMembers (user_id, is_active)
    INCLUDE (chat_id, is_archived, is_pinned);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ChatMembers_ChatId' AND object_id = OBJECT_ID('dbo.ChatMembers'))
    CREATE INDEX IX_ChatMembers_ChatId
    ON dbo.ChatMembers (chat_id, is_active);
GO

-- Messages: historial por chat — SEGUNDA query más frecuente
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Messages_ChatId_CreatedAt' AND object_id = OBJECT_ID('dbo.Messages'))
    CREATE INDEX IX_Messages_ChatId_CreatedAt
    ON dbo.Messages (chat_id, created_at DESC)
    WHERE is_deleted = 0;
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Messages_SenderId' AND object_id = OBJECT_ID('dbo.Messages'))
    CREATE INDEX IX_Messages_SenderId
    ON dbo.Messages (sender_id);
GO

-- MessageStatus
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_MessageStatus_MessageId' AND object_id = OBJECT_ID('dbo.MessageStatus'))
    CREATE INDEX IX_MessageStatus_MessageId
    ON dbo.MessageStatus (message_id, status);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_MessageStatus_UserId' AND object_id = OBJECT_ID('dbo.MessageStatus'))
    CREATE INDEX IX_MessageStatus_UserId
    ON dbo.MessageStatus (user_id);
GO

-- GroupMembers
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_GroupMembers_UserId' AND object_id = OBJECT_ID('dbo.GroupMembers'))
    CREATE INDEX IX_GroupMembers_UserId
    ON dbo.GroupMembers (user_id, is_active);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_GroupMembers_GroupId' AND object_id = OBJECT_ID('dbo.GroupMembers'))
    CREATE INDEX IX_GroupMembers_GroupId
    ON dbo.GroupMembers (group_id, is_active);
GO

-- Stories: activos no expirados por usuario
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Stories_UserId_Expires' AND object_id = OBJECT_ID('dbo.Stories'))
    CREATE INDEX IX_Stories_UserId_Expires
    ON dbo.Stories (user_id, expires_at)
    WHERE is_active = 1;
GO

-- Notifications: no leídas por usuario
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notifications_UserId_IsRead' AND object_id = OBJECT_ID('dbo.Notifications'))
    CREATE INDEX IX_Notifications_UserId_IsRead
    ON dbo.Notifications (user_id, is_read, created_at DESC);
GO

-- AuditLogs
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AuditLogs_UserId' AND object_id = OBJECT_ID('dbo.AuditLogs'))
    CREATE INDEX IX_AuditLogs_UserId
    ON dbo.AuditLogs (user_id, created_at DESC);
GO

PRINT '=== Índices creados ===';
GO


-- ============================================================
-- 04  DATOS SEMILLA
--     ⚠️ CAMBIAR CONTRASEÑAS ANTES DE PRODUCCIÓN
--     ⚠️ Eliminar usuarios de prueba en producción
-- ============================================================

-- ------------------------------------------------------------
-- Roles base
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE name = 'user')
    INSERT INTO dbo.Roles (name, description)
    VALUES ('user', 'Usuario regular de BeeChat');

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE name = 'admin')
    INSERT INTO dbo.Roles (name, description)
    VALUES ('admin', 'Administrador del sistema');

PRINT 'Roles insertados.';
GO

-- ------------------------------------------------------------
-- Admin por defecto
-- Credenciales:  admin@beechat.com  /  Admin@BeeChat2024
-- Hash bcrypt rounds=12 — CAMBIAR EN PRODUCCIÓN
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM dbo.AdminUsers WHERE email = 'admin@beechat.com')
BEGIN
    INSERT INTO dbo.AdminUsers (username, email, password_hash, role, is_active)
    VALUES (
        'superadmin',
        'admin@beechat.com',
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK1P8kzJW',
        'superadmin',
        1
    );
    PRINT 'Admin por defecto creado: admin@beechat.com / Admin@BeeChat2024';
END
GO

-- ------------------------------------------------------------
-- Usuarios de prueba (solo desarrollo)
-- Contraseña de todos: password
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE username = 'alice_dev')
BEGIN
    INSERT INTO dbo.Users (phone, email, username, password_hash, display_name, bio, is_verified, is_active)
    VALUES (
        '+5491155551001',
        'alice@beechat.dev',
        'alice_dev',
        '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Alice Dev',
        'Flutter dev 🐝',
        1, 1
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE username = 'bob_dev')
BEGIN
    INSERT INTO dbo.Users (phone, email, username, password_hash, display_name, bio, is_verified, is_active)
    VALUES (
        '+5491155551002',
        'bob@beechat.dev',
        'bob_dev',
        '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Bob Dev',
        'Backend dev 🚀',
        1, 1
    );
END
GO

-- Asignar rol 'user' a los usuarios de prueba
DECLARE @roleId  INT = (SELECT id FROM dbo.Roles WHERE name = 'user');
DECLARE @aliceId INT = (SELECT id FROM dbo.Users WHERE username = 'alice_dev');
DECLARE @bobId   INT = (SELECT id FROM dbo.Users WHERE username = 'bob_dev');

IF @aliceId IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.UserRoles WHERE user_id = @aliceId AND role_id = @roleId)
    INSERT INTO dbo.UserRoles (user_id, role_id) VALUES (@aliceId, @roleId);

IF @bobId IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.UserRoles WHERE user_id = @bobId AND role_id = @roleId)
    INSERT INTO dbo.UserRoles (user_id, role_id) VALUES (@bobId, @roleId);

PRINT 'Usuarios de prueba insertados.';
GO


-- ============================================================
-- RESUMEN FINAL
-- ============================================================
PRINT '';
PRINT '╔══════════════════════════════════════════════════════╗';
PRINT '║            BeeChat — Setup completado                ║';
PRINT '╠══════════════════════════════════════════════════════╣';
PRINT '║  Base de datos : BeeChat                             ║';
PRINT '║  Tablas        : 20                                  ║';
PRINT '║  Índices       : 18                                  ║';
PRINT '╠══════════════════════════════════════════════════════╣';
PRINT '║  Admin panel                                         ║';
PRINT '║    Email    : admin@beechat.com                      ║';
PRINT '║    Password : Admin@BeeChat2024                      ║';
PRINT '╠══════════════════════════════════════════════════════╣';
PRINT '║  Usuarios de prueba (password: "password")           ║';
PRINT '║    alice_dev  /  alice@beechat.dev                   ║';
PRINT '║    bob_dev    /  bob@beechat.dev                     ║';
PRINT '╠══════════════════════════════════════════════════════╣';
PRINT '║  ⚠️  Cambiar contraseñas antes de producción         ║';
PRINT '╚══════════════════════════════════════════════════════╝';
GO
