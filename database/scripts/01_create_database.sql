-- ============================================================
-- BeeChat - Script 01: Crear Base de Datos
-- Ejecutar conectado a la instancia SQL Server como master
-- ============================================================

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'BeeChat')
BEGIN
    CREATE DATABASE BeeChat
        COLLATE Latin1_General_CI_AS;
    PRINT 'Database BeeChat created.';
END
ELSE
BEGIN
    PRINT 'Database BeeChat already exists.';
END
GO

USE BeeChat;
GO

PRINT 'Using database: BeeChat';
GO
