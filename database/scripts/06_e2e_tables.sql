-- ============================================================
-- BeeChat - Script 06: End-to-End Encryption Tables
-- Ejecutar en la base de datos BeeChat
-- ============================================================

USE BeeChat;
GO

-- ============================================================
-- E2EDeviceKeys — identity key bundle per user
-- Stores the X25519 identity public key uploaded by each device.
-- The server only stores/routes public keys — private keys NEVER leave the device.
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[E2EDeviceKeys]') AND type = 'U')
BEGIN
    CREATE TABLE E2EDeviceKeys (
        id              INT           IDENTITY(1,1) PRIMARY KEY,
        user_id         INT           NOT NULL,
        identity_key    VARCHAR(512)  NOT NULL,  -- X25519 public key, base64url
        key_version     INT           NOT NULL DEFAULT 1,
        created_at      DATETIME      NOT NULL DEFAULT GETUTCDATE(),
        updated_at      DATETIME      NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_E2EDeviceKeys_User FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
        CONSTRAINT UQ_E2EDeviceKeys_User UNIQUE (user_id)
    );
    CREATE INDEX IX_E2EDeviceKeys_User ON E2EDeviceKeys (user_id);
    PRINT 'Table E2EDeviceKeys created.';
END
GO

PRINT 'Script 06 (E2E tables) complete.';
GO
