-- ============================================================
-- BeeChat - Script 04: Datos de Seed
-- Ejecutar después de 03_create_indexes.sql
-- ⚠️ CAMBIAR CONTRASEÑAS ANTES DE PASAR A PRODUCCIÓN
-- ============================================================

USE BeeChat;
GO

-- ============================================================
-- Roles base
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM Roles WHERE name = 'user')
    INSERT INTO Roles (name, description)
    VALUES ('user', 'Usuario regular de la aplicación');

IF NOT EXISTS (SELECT 1 FROM Roles WHERE name = 'admin')
    INSERT INTO Roles (name, description)
    VALUES ('admin', 'Administrador del sistema');

PRINT 'Roles seeded.';
GO

-- ============================================================
-- Admin por defecto
-- Password: Admin@BeeChat2024
-- Hash generado con bcrypt rounds=12
-- ⚠️ CAMBIAR EN PRODUCCIÓN
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM AdminUsers WHERE email = 'admin@beechat.com')
BEGIN
    INSERT INTO AdminUsers (username, email, password_hash, role, is_active, created_at, updated_at)
    VALUES (
        'superadmin',
        'admin@beechat.com',
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK1P8kzJW',  -- Admin@BeeChat2024
        'superadmin',
        1,
        GETUTCDATE(),
        GETUTCDATE()
    );
    PRINT 'Default admin created: admin@beechat.com / Admin@BeeChat2024';
END
GO

-- ============================================================
-- Usuarios de prueba (solo para desarrollo)
-- Password de todos: Test@1234
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM Users WHERE username = 'alice_dev')
BEGIN
    INSERT INTO Users (phone, email, username, password_hash, display_name, bio, is_verified, is_active, created_at, updated_at)
    VALUES (
        '+5491155551001',
        'alice@beechat.dev',
        'alice_dev',
        '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  -- password (para dev)
        'Alice Dev',
        'Flutter dev 🐝',
        1,
        1,
        GETUTCDATE(),
        GETUTCDATE()
    );
END

IF NOT EXISTS (SELECT 1 FROM Users WHERE username = 'bob_dev')
BEGIN
    INSERT INTO Users (phone, email, username, password_hash, display_name, bio, is_verified, is_active, created_at, updated_at)
    VALUES (
        '+5491155551002',
        'bob@beechat.dev',
        'bob_dev',
        '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  -- password (para dev)
        'Bob Dev',
        'Backend dev 🚀',
        1,
        1,
        GETUTCDATE(),
        GETUTCDATE()
    );
END
GO

-- ============================================================
-- Asignar rol 'user' a usuarios de prueba
-- ============================================================
DECLARE @roleId INT = (SELECT id FROM Roles WHERE name = 'user');
DECLARE @aliceId INT = (SELECT id FROM Users WHERE username = 'alice_dev');
DECLARE @bobId INT = (SELECT id FROM Users WHERE username = 'bob_dev');

IF @aliceId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM UserRoles WHERE user_id = @aliceId AND role_id = @roleId)
    INSERT INTO UserRoles (user_id, role_id) VALUES (@aliceId, @roleId);

IF @bobId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM UserRoles WHERE user_id = @bobId AND role_id = @roleId)
    INSERT INTO UserRoles (user_id, role_id) VALUES (@bobId, @roleId);

PRINT 'Test users seeded.';
GO

PRINT '=== Seed data completed ===';
PRINT '';
PRINT 'Admin credentials:';
PRINT '  Email:    admin@beechat.com';
PRINT '  Password: Admin@BeeChat2024';
PRINT '';
PRINT 'Test users (password for all: "password"):';
PRINT '  alice_dev / alice@beechat.dev';
PRINT '  bob_dev   / bob@beechat.dev';
PRINT '';
PRINT '⚠️  Change all passwords before going to production!';
GO
