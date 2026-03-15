/**
 * BeeChat — Socket.IO Entry Point (STUB — Fase 2)
 *
 * Este archivo está preparado para la siguiente fase de desarrollo.
 * Para activarlo, instalar Socket.IO y descomentar en server.js.
 *
 * npm install socket.io
 */

// const authMiddleware = require('../middlewares/auth.middleware');
// const logger = require('../utils/logger');

/**
 * Inicializa todos los namespaces y handlers de Socket.IO
 * @param {import('socket.io').Server} io
 */
function initSockets(io) {
  // ---- Middleware de autenticación para sockets ----
  // io.use((socket, next) => {
  //   const token = socket.handshake.auth.token;
  //   if (!token) return next(new Error('Authentication required'));
  //   try {
  //     const decoded = verifyAccessToken(token);
  //     socket.user = decoded;
  //     next();
  //   } catch {
  //     next(new Error('Invalid token'));
  //   }
  // });

  // ---- Namespace principal ----
  // io.on('connection', (socket) => {
  //   logger.info(`Socket connected: ${socket.id} user: ${socket.user?.sub}`);
  //
  //   // Unirse a una sala de chat
  //   socket.on('join:chat', (chatId) => {
  //     socket.join(`chat:${chatId}`);
  //   });
  //
  //   // Enviar mensaje en tiempo real
  //   socket.on('message:send', async (data) => {
  //     // Guardar en DB via messagesService
  //     // Emitir a todos en la sala del chat
  //     io.to(`chat:${data.chatId}`).emit('message:new', data);
  //   });
  //
  //   // Indicador de escritura
  //   socket.on('typing:start', (chatId) => {
  //     socket.to(`chat:${chatId}`).emit('typing:start', { userId: socket.user.sub });
  //   });
  //
  //   socket.on('typing:stop', (chatId) => {
  //     socket.to(`chat:${chatId}`).emit('typing:stop', { userId: socket.user.sub });
  //   });
  //
  //   // Confirmación de lectura
  //   socket.on('message:read', (data) => {
  //     io.to(`chat:${data.chatId}`).emit('message:read', data);
  //   });
  //
  //   socket.on('disconnect', () => {
  //     logger.info(`Socket disconnected: ${socket.id}`);
  //   });
  // });

  // Stub: log de activación
  console.log('Socket.IO initialized (stub mode — no handlers active)');
}

module.exports = initSockets;
