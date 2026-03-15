const sql = require('mssql');
const { dbConfig } = require('../config/db.config');
const logger = require('../utils/logger');

let pool = null;

/**
 * Inicializa y conecta el pool de conexiones a SQL Server.
 * Llamar una sola vez al arrancar el servidor.
 */
async function connect() {
  try {
    pool = await sql.connect(dbConfig);
    logger.info(`✅ SQL Server connected → ${dbConfig.server}:${dbConfig.port}/${dbConfig.database}`);

    // Si el pool emite un error inesperado, loguear y salir
    pool.on('error', (err) => {
      logger.error('SQL Server pool error:', err);
      process.exit(1);
    });

    return pool;
  } catch (err) {
    logger.error('❌ SQL Server connection failed:', err.message);
    throw err;
  }
}

/**
 * Devuelve el pool activo.
 * Lanza si connect() no fue llamado primero.
 */
function getPool() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call connect() first.');
  }
  return pool;
}

/**
 * Cierra el pool de forma segura (para graceful shutdown).
 */
async function disconnect() {
  if (pool) {
    await pool.close();
    pool = null;
    logger.info('SQL Server pool closed.');
  }
}

module.exports = { connect, getPool, disconnect };
