-- ============================================================
-- BeeChat - Script 05: Tabla VerificationCodes
-- Ejecutar después de 04_seed_data.sql
-- ============================================================

USE BeeChat;
GO

IF NOT EXISTS (
    SELECT * FROM sys.objects
    WHERE object_id = OBJECT_ID(N'[dbo].[VerificationCodes]') AND type = 'U'
)
BEGIN
    CREATE TABLE dbo.VerificationCodes (
        id          INT           IDENTITY(1,1) NOT NULL,
        user_id     INT           NOT NULL,
        code_hash   VARCHAR(64)   NOT NULL,   -- SHA-256 del código de 6 dígitos
        purpose     VARCHAR(30)   NOT NULL
            CONSTRAINT DF_VC_purpose   DEFAULT 'verify_account'
            CONSTRAINT CHK_VC_purpose  CHECK (purpose IN ('verify_account', 'change_phone', 'reset_password')),
        attempts    INT           NOT NULL CONSTRAINT DF_VC_attempts DEFAULT 0,
        max_attempts INT          NOT NULL CONSTRAINT DF_VC_max      DEFAULT 5,
        expires_at  DATETIME      NOT NULL,
        used_at     DATETIME      NULL,
        created_at  DATETIME      NOT NULL CONSTRAINT DF_VC_created_at DEFAULT GETUTCDATE(),
        CONSTRAINT PK_VerificationCodes    PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_VC_User              FOREIGN KEY (user_id) REFERENCES dbo.Users(id) ON DELETE CASCADE,
        CONSTRAINT CHK_VC_attempts_range   CHECK (attempts >= 0 AND attempts <= max_attempts)
    );

    CREATE INDEX IX_VC_UserId_Purpose
        ON dbo.VerificationCodes (user_id, purpose, expires_at)
        WHERE used_at IS NULL;

    PRINT 'Tabla VerificationCodes creada.';
END
ELSE
BEGIN
    PRINT 'Tabla VerificationCodes ya existe.';
END
GO
