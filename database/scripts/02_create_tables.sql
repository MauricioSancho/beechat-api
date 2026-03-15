-- ============================================================
-- BeeChat - Script 02: Crear Tablas
-- Ejecutar en la base de datos BeeChat
-- Las tablas se crean en orden de dependencia de FK
-- ============================================================

USE BeeChat;
GO

-- ============================================================
-- 1. Roles
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Roles]') AND type = 'U')
BEGIN
    CREATE TABLE Roles (
        id          INT           IDENTITY(1,1) PRIMARY KEY,
        name        VARCHAR(30)   NOT NULL,
        description NVARCHAR(200) NULL,
        created_at  DATETIME      NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_Roles_Name UNIQUE (name)
    );
    PRINT 'Table Roles created.';
END
GO

-- ============================================================
-- 2. Users
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND type = 'U')
BEGIN
    CREATE TABLE Users (
        id             INT              IDENTITY(1,1) PRIMARY KEY,
        uuid           UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        phone          VARCHAR(20)      NULL,
        email          VARCHAR(255)     NULL,
        username       VARCHAR(50)      NOT NULL,
        password_hash  VARCHAR(255)     NOT NULL,
        display_name   NVARCHAR(100)    NOT NULL,
        bio            NVARCHAR(300)    NULL,
        avatar_url     VARCHAR(500)     NULL,
        is_verified    BIT              NOT NULL DEFAULT 0,
        is_active      BIT              NOT NULL DEFAULT 1,
        last_seen      DATETIME         NULL,
        created_at     DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        updated_at     DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        deleted_at     DATETIME         NULL,
        CONSTRAINT UQ_Users_UUID UNIQUE (uuid)
    );
    PRINT 'Table Users created.';
END
GO

-- ============================================================
-- 3. UserRoles
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UserRoles]') AND type = 'U')
BEGIN
    CREATE TABLE UserRoles (
        user_id    INT NOT NULL,
        role_id    INT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT PK_UserRoles PRIMARY KEY (user_id, role_id),
        CONSTRAINT FK_UserRoles_User FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
        CONSTRAINT FK_UserRoles_Role FOREIGN KEY (role_id) REFERENCES Roles(id) ON DELETE CASCADE
    );
    PRINT 'Table UserRoles created.';
END
GO

-- ============================================================
-- 4. RefreshTokens
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RefreshTokens]') AND type = 'U')
BEGIN
    CREATE TABLE RefreshTokens (
        id          INT          IDENTITY(1,1) PRIMARY KEY,
        user_id     INT          NOT NULL,
        token_hash  VARCHAR(64)  NOT NULL,  -- SHA-256 hex del token crudo
        device_id   INT          NULL,
        expires_at  DATETIME     NOT NULL,
        is_revoked  BIT          NOT NULL DEFAULT 0,
        created_at  DATETIME     NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_RefreshTokens_User FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
    );
    PRINT 'Table RefreshTokens created.';
END
GO

-- ============================================================
-- 5. UserDevices
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UserDevices]') AND type = 'U')
BEGIN
    CREATE TABLE UserDevices (
        id              INT           IDENTITY(1,1) PRIMARY KEY,
        user_id         INT           NOT NULL,
        device_token    VARCHAR(200)  NULL,
        device_type     VARCHAR(10)   NOT NULL DEFAULT 'android'
            CONSTRAINT CHK_UserDevices_Type CHECK (device_type IN ('android', 'ios', 'web')),
        device_name     NVARCHAR(100) NULL,
        push_token      VARCHAR(500)  NULL,
        is_active       BIT           NOT NULL DEFAULT 1,
        is_verified     BIT           NOT NULL DEFAULT 0,
        last_active_at  DATETIME      NULL,
        created_at      DATETIME      NOT NULL DEFAULT GETUTCDATE(),
        updated_at      DATETIME      NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_UserDevices_User FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
    );
    PRINT 'Table UserDevices created.';
END
GO

-- ============================================================
-- 6. Contacts
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Contacts]') AND type = 'U')
BEGIN
    CREATE TABLE Contacts (
        id               INT           IDENTITY(1,1) PRIMARY KEY,
        owner_id         INT           NOT NULL,
        contact_user_id  INT           NOT NULL,
        nickname         NVARCHAR(100) NULL,
        created_at       DATETIME      NOT NULL DEFAULT GETUTCDATE(),
        updated_at       DATETIME      NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_Contacts_Owner   FOREIGN KEY (owner_id)        REFERENCES Users(id),
        CONSTRAINT FK_Contacts_Contact FOREIGN KEY (contact_user_id) REFERENCES Users(id),
        CONSTRAINT UQ_Contacts_Pair    UNIQUE (owner_id, contact_user_id),
        CONSTRAINT CHK_Contacts_Self   CHECK (owner_id <> contact_user_id)
    );
    PRINT 'Table Contacts created.';
END
GO

-- ============================================================
-- 7. BlockedContacts
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[BlockedContacts]') AND type = 'U')
BEGIN
    CREATE TABLE BlockedContacts (
        id          INT      IDENTITY(1,1) PRIMARY KEY,
        blocker_id  INT      NOT NULL,
        blocked_id  INT      NOT NULL,
        created_at  DATETIME NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_Blocked_Blocker FOREIGN KEY (blocker_id) REFERENCES Users(id),
        CONSTRAINT FK_Blocked_Blocked FOREIGN KEY (blocked_id) REFERENCES Users(id),
        CONSTRAINT UQ_Blocked_Pair    UNIQUE (blocker_id, blocked_id),
        CONSTRAINT CHK_Blocked_Self   CHECK (blocker_id <> blocked_id)
    );
    PRINT 'Table BlockedContacts created.';
END
GO

-- ============================================================
-- 8. Chats
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Chats]') AND type = 'U')
BEGIN
    CREATE TABLE Chats (
        id          INT              IDENTITY(1,1) PRIMARY KEY,
        uuid        UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        type        VARCHAR(10)      NOT NULL DEFAULT 'private'
            CONSTRAINT CHK_Chats_Type CHECK (type IN ('private', 'group')),
        created_by  INT              NOT NULL,
        created_at  DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        updated_at  DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        deleted_at  DATETIME         NULL,
        CONSTRAINT UQ_Chats_UUID UNIQUE (uuid),
        CONSTRAINT FK_Chats_Creator FOREIGN KEY (created_by) REFERENCES Users(id)
    );
    PRINT 'Table Chats created.';
END
GO

-- ============================================================
-- 9. ChatMembers
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ChatMembers]') AND type = 'U')
BEGIN
    CREATE TABLE ChatMembers (
        id           INT      IDENTITY(1,1) PRIMARY KEY,
        chat_id      INT      NOT NULL,
        user_id      INT      NOT NULL,
        role         VARCHAR(10) NOT NULL DEFAULT 'member'
            CONSTRAINT CHK_ChatMembers_Role CHECK (role IN ('admin', 'member')),
        is_active    BIT      NOT NULL DEFAULT 1,
        is_archived  BIT      NOT NULL DEFAULT 0,
        is_pinned    BIT      NOT NULL DEFAULT 0,
        joined_at    DATETIME NOT NULL DEFAULT GETUTCDATE(),
        left_at      DATETIME NULL,
        CONSTRAINT FK_ChatMembers_Chat FOREIGN KEY (chat_id) REFERENCES Chats(id) ON DELETE CASCADE,
        CONSTRAINT FK_ChatMembers_User FOREIGN KEY (user_id) REFERENCES Users(id),
        CONSTRAINT UQ_ChatMembers_Pair UNIQUE (chat_id, user_id)
    );
    PRINT 'Table ChatMembers created.';
END
GO

-- ============================================================
-- 10. Messages
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Messages]') AND type = 'U')
BEGIN
    CREATE TABLE Messages (
        id            INT              IDENTITY(1,1) PRIMARY KEY,
        uuid          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        chat_id       INT              NOT NULL,
        sender_id     INT              NOT NULL,
        content       NVARCHAR(MAX)    NULL,
        message_type  VARCHAR(15)      NOT NULL DEFAULT 'text'
            CONSTRAINT CHK_Messages_Type CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document')),
        reply_to_id   INT              NULL,
        is_edited     BIT              NOT NULL DEFAULT 0,
        is_deleted    BIT              NOT NULL DEFAULT 0,
        created_at    DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        updated_at    DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_Messages_UUID UNIQUE (uuid),
        CONSTRAINT FK_Messages_Chat    FOREIGN KEY (chat_id)     REFERENCES Chats(id),
        CONSTRAINT FK_Messages_Sender  FOREIGN KEY (sender_id)   REFERENCES Users(id),
        CONSTRAINT FK_Messages_ReplyTo FOREIGN KEY (reply_to_id) REFERENCES Messages(id)
    );
    PRINT 'Table Messages created.';
END
GO

-- ============================================================
-- 11. MessageAttachments
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MessageAttachments]') AND type = 'U')
BEGIN
    CREATE TABLE MessageAttachments (
        id          INT           IDENTITY(1,1) PRIMARY KEY,
        message_id  INT           NOT NULL,
        file_url    VARCHAR(500)  NOT NULL,
        file_type   VARCHAR(50)   NULL,
        file_size   BIGINT        NULL,
        file_name   NVARCHAR(255) NULL,
        created_at  DATETIME      NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_MsgAttach_Message FOREIGN KEY (message_id) REFERENCES Messages(id) ON DELETE CASCADE
    );
    PRINT 'Table MessageAttachments created.';
END
GO

-- ============================================================
-- 12. MessageStatus
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MessageStatus]') AND type = 'U')
BEGIN
    CREATE TABLE MessageStatus (
        id          INT      IDENTITY(1,1) PRIMARY KEY,
        message_id  INT      NOT NULL,
        user_id     INT      NOT NULL,
        status      VARCHAR(10) NOT NULL DEFAULT 'sent'
            CONSTRAINT CHK_MsgStatus_Status CHECK (status IN ('sent', 'delivered', 'read')),
        updated_at  DATETIME NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_MsgStatus_Message FOREIGN KEY (message_id) REFERENCES Messages(id) ON DELETE CASCADE,
        CONSTRAINT FK_MsgStatus_User    FOREIGN KEY (user_id)    REFERENCES Users(id),
        CONSTRAINT UQ_MsgStatus_Pair    UNIQUE (message_id, user_id)
    );
    PRINT 'Table MessageStatus created.';
END
GO

-- ============================================================
-- 13. Groups
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Groups]') AND type = 'U')
BEGIN
    CREATE TABLE Groups (
        id          INT           IDENTITY(1,1) PRIMARY KEY,
        chat_id     INT           NOT NULL,
        name        NVARCHAR(100) NOT NULL,
        description NVARCHAR(500) NULL,
        avatar_url  VARCHAR(500)  NULL,
        created_by  INT           NOT NULL,
        created_at  DATETIME      NOT NULL DEFAULT GETUTCDATE(),
        updated_at  DATETIME      NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_Groups_Chat    FOREIGN KEY (chat_id)    REFERENCES Chats(id),
        CONSTRAINT FK_Groups_Creator FOREIGN KEY (created_by) REFERENCES Users(id)
    );
    PRINT 'Table Groups created.';
END
GO

-- ============================================================
-- 14. GroupMembers
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GroupMembers]') AND type = 'U')
BEGIN
    CREATE TABLE GroupMembers (
        id          INT      IDENTITY(1,1) PRIMARY KEY,
        group_id    INT      NOT NULL,
        user_id     INT      NOT NULL,
        role        VARCHAR(10) NOT NULL DEFAULT 'member'
            CONSTRAINT CHK_GroupMembers_Role CHECK (role IN ('admin', 'member')),
        is_active   BIT      NOT NULL DEFAULT 1,
        joined_at   DATETIME NOT NULL DEFAULT GETUTCDATE(),
        left_at     DATETIME NULL,
        CONSTRAINT FK_GroupMembers_Group FOREIGN KEY (group_id) REFERENCES Groups(id) ON DELETE CASCADE,
        CONSTRAINT FK_GroupMembers_User  FOREIGN KEY (user_id)  REFERENCES Users(id),
        CONSTRAINT UQ_GroupMembers_Pair  UNIQUE (group_id, user_id)
    );
    PRINT 'Table GroupMembers created.';
END
GO

-- ============================================================
-- 15. Stories
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Stories]') AND type = 'U')
BEGIN
    CREATE TABLE Stories (
        id           INT              IDENTITY(1,1) PRIMARY KEY,
        user_id      INT              NOT NULL,
        content_type VARCHAR(10)      NOT NULL DEFAULT 'text'
            CONSTRAINT CHK_Stories_Type CHECK (content_type IN ('text', 'image', 'video')),
        content_url  VARCHAR(500)     NULL,
        text_content NVARCHAR(500)    NULL,
        bg_color     VARCHAR(10)      NULL DEFAULT '#000000',
        duration     INT              NULL DEFAULT 5,  -- segundos para mostrar
        expires_at   DATETIME         NOT NULL DEFAULT DATEADD(HOUR, 24, GETUTCDATE()),
        is_active    BIT              NOT NULL DEFAULT 1,
        created_at   DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_Stories_User FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
    );
    PRINT 'Table Stories created.';
END
GO

-- ============================================================
-- 16. StoryViews
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[StoryViews]') AND type = 'U')
BEGIN
    CREATE TABLE StoryViews (
        id          INT      IDENTITY(1,1) PRIMARY KEY,
        story_id    INT      NOT NULL,
        viewer_id   INT      NOT NULL,
        viewed_at   DATETIME NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_StoryViews_Story  FOREIGN KEY (story_id)  REFERENCES Stories(id) ON DELETE CASCADE,
        CONSTRAINT FK_StoryViews_Viewer FOREIGN KEY (viewer_id) REFERENCES Users(id),
        CONSTRAINT UQ_StoryViews_Pair   UNIQUE (story_id, viewer_id)
    );
    PRINT 'Table StoryViews created.';
END
GO

-- ============================================================
-- 17. StoryMutes
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[StoryMutes]') AND type = 'U')
BEGIN
    CREATE TABLE StoryMutes (
        id              INT      IDENTITY(1,1) PRIMARY KEY,
        user_id         INT      NOT NULL,  -- quien silenció
        muted_user_id   INT      NOT NULL,  -- a quien silenció
        created_at      DATETIME NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_StoryMutes_User      FOREIGN KEY (user_id)       REFERENCES Users(id),
        CONSTRAINT FK_StoryMutes_MutedUser FOREIGN KEY (muted_user_id) REFERENCES Users(id),
        CONSTRAINT UQ_StoryMutes_Pair      UNIQUE (user_id, muted_user_id),
        CONSTRAINT CHK_StoryMutes_Self     CHECK (user_id <> muted_user_id)
    );
    PRINT 'Table StoryMutes created.';
END
GO

-- ============================================================
-- 18. Notifications
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Notifications]') AND type = 'U')
BEGIN
    CREATE TABLE Notifications (
        id          INT           IDENTITY(1,1) PRIMARY KEY,
        user_id     INT           NOT NULL,
        type        VARCHAR(20)   NOT NULL DEFAULT 'system'
            CONSTRAINT CHK_Notif_Type CHECK (type IN ('message', 'story', 'contact', 'system', 'group')),
        title       NVARCHAR(100) NOT NULL,
        body        NVARCHAR(500) NULL,
        data_json   NVARCHAR(MAX) NULL,  -- JSON con datos adicionales
        is_read     BIT           NOT NULL DEFAULT 0,
        created_at  DATETIME      NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_Notifications_User FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
    );
    PRINT 'Table Notifications created.';
END
GO

-- ============================================================
-- 19. AdminUsers
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AdminUsers]') AND type = 'U')
BEGIN
    CREATE TABLE AdminUsers (
        id            INT          IDENTITY(1,1) PRIMARY KEY,
        username      VARCHAR(50)  NOT NULL,
        email         VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role          VARCHAR(20)  NOT NULL DEFAULT 'moderator'
            CONSTRAINT CHK_AdminUsers_Role CHECK (role IN ('superadmin', 'moderator')),
        is_active     BIT          NOT NULL DEFAULT 1,
        created_at    DATETIME     NOT NULL DEFAULT GETUTCDATE(),
        updated_at    DATETIME     NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_AdminUsers_Username UNIQUE (username),
        CONSTRAINT UQ_AdminUsers_Email    UNIQUE (email)
    );
    PRINT 'Table AdminUsers created.';
END
GO

-- ============================================================
-- 20. AuditLogs
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AuditLogs]') AND type = 'U')
BEGIN
    CREATE TABLE AuditLogs (
        id           INT           IDENTITY(1,1) PRIMARY KEY,
        user_id      INT           NULL,        -- NULL si la acción es del sistema
        action       VARCHAR(100)  NOT NULL,
        entity_type  VARCHAR(50)   NULL,
        entity_id    INT           NULL,
        details_json NVARCHAR(MAX) NULL,
        ip_address   VARCHAR(45)   NULL,
        created_at   DATETIME      NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_AuditLogs_User FOREIGN KEY (user_id) REFERENCES Users(id)
    );
    PRINT 'Table AuditLogs created.';
END
GO

PRINT '=== All tables created successfully ===';
GO
