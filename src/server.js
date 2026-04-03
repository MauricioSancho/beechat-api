// dotenv PRIMERO, antes de cualquier otro import
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const fs   = require('fs');
const path = require('path');
const http = require('http');
const app  = require('./app');
const { connect, disconnect } = require('./database/connection');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

// ============================================================
// Servidor HTTP
// ============================================================
const httpServer = http.createServer(app);

// ============================================================
// Preparación Socket.IO (Fase 2 — descomentar para activar)
// ============================================================
// const { Server } = require('socket.io');
// const initSockets = require('./sockets');
//
// const io = new Server(httpServer, {
//   cors: {
//     origin: (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()),
//     credentials: true,
//   },
// });
// initSockets(io);

// ============================================================
// Arranque del servidor
// ============================================================
async function startServer() {
  try {
    // 0. Crear directorios de uploads si no existen
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    for (const sub of ['images', 'videos', 'audio', 'documents']) {
      fs.mkdirSync(path.join(uploadDir, sub), { recursive: true });
    }

    // 1. Conectar a la base de datos primero (fail-fast)
    await connect();

    // 2. Levantar el servidor HTTP
    httpServer.listen(PORT, () => {
      logger.info('================================================');
      logger.info(`🐝 BeeChat API running on port ${PORT}`);
      logger.info(`   Environment : ${process.env.NODE_ENV || 'development'}`);
      logger.info(`   Base URL    : ${process.env.BASE_URL || `http://localhost:${PORT}`}`);
      logger.info(`   Health      : http://localhost:${PORT}/api/v1/health`);
      logger.info(`   Status v2   : message status system active ✓`);
      logger.info('================================================');
    });
  } catch (err) {
    logger.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

// ============================================================
// Graceful Shutdown
// ============================================================
async function shutdown(signal) {
  logger.info(`${signal} received. Shutting down gracefully...`);

  httpServer.close(async () => {
    logger.info('HTTP server closed.');
    await disconnect();
    logger.info('Database pool closed. Goodbye 🐝');
    process.exit(0);
  });

  // Forzar salida si el shutdown tarda más de 10s
  setTimeout(() => {
    logger.error('Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// Errores no capturados (bugs de programación — siempre crashear)
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', reason);
  shutdown('unhandledRejection');
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  shutdown('uncaughtException');
});

startServer();
