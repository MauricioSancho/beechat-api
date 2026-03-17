-- ============================================================
-- 07_polls_tables.sql
-- Tablas para encuestas en chats (Polls feature)
-- Ejecutar después de 06_e2e_tables.sql
-- ============================================================

USE BeeChat;
GO

-- Encuesta vinculada a un mensaje de tipo 'poll'
CREATE TABLE Polls (
    id             INT IDENTITY(1,1) PRIMARY KEY,
    message_id     INT NOT NULL REFERENCES Messages(id) ON DELETE CASCADE,
    chat_id        INT NOT NULL REFERENCES Chats(id),
    question       NVARCHAR(500) NOT NULL,
    allow_multiple BIT NOT NULL DEFAULT 0,
    is_closed      BIT NOT NULL DEFAULT 0,
    created_at     DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

-- Opciones de la encuesta
CREATE TABLE PollOptions (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    poll_id     INT NOT NULL REFERENCES Polls(id) ON DELETE CASCADE,
    option_text NVARCHAR(200) NOT NULL,
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

-- Votos: un usuario puede votar una opción una sola vez
-- Para single-choice: el service borra el voto anterior antes de insertar
CREATE TABLE PollVotes (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    poll_id    INT NOT NULL REFERENCES Polls(id),
    option_id  INT NOT NULL REFERENCES PollOptions(id),
    user_id    INT NOT NULL REFERENCES Users(id),
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_PollVotes UNIQUE (poll_id, option_id, user_id)
);
GO

CREATE INDEX IX_PollOptions_PollId ON PollOptions(poll_id);
CREATE INDEX IX_PollVotes_PollId   ON PollVotes(poll_id);
CREATE INDEX IX_Polls_MessageId    ON Polls(message_id);
GO
