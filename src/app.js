const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const logger = require('./utils/logger');
const { swaggerConfig } = require('./config/swagger.config');

// Routers
const authRoutes          = require('./modules/auth/auth.routes');
const usersRoutes         = require('./modules/users/users.routes');
const devicesRoutes       = require('./modules/devices/devices.routes');
const contactsRoutes      = require('./modules/contacts/contacts.routes');
const chatsRoutes         = require('./modules/chats/chats.routes');
const { chatMessagesRouter, messagesRouter } = require('./modules/messages/messages.routes');
const pollsRoutes            = require('./modules/polls/polls.routes');
const groupsRoutes        = require('./modules/groups/groups.routes');
const storiesRoutes       = require('./modules/stories/stories.routes');
const uploadsRoutes       = require('./modules/uploads/uploads.routes');
const notificationsRoutes = require('./modules/notifications/notifications.routes');
const adminRoutes         = require('./modules/admin/admin.routes');
const beeAssistRoutes     = require('./modules/bee_assist/bee_assist.routes');
const e2eRoutes           = require('./modules/e2e/e2e.routes');

// Middlewares globales
const { defaultLimiter } = require('./middlewares/rateLimiter.middleware');
const notFoundMiddleware  = require('./middlewares/notFound.middleware');
const errorMiddleware     = require('./middlewares/error.middleware');

const app = express();

// ============================================================
// Seguridad
// ============================================================
app.use(helmet());

// CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3001')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir herramientas sin origen (Postman, curl) en desarrollo
      if (!origin || process.env.NODE_ENV === 'development') return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// ============================================================
// Parsers
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ============================================================
// Logging HTTP
// ============================================================
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: logger.stream }));
}

// ============================================================
// Archivos estáticos (uploads servidos públicamente)
// ============================================================
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
app.use('/uploads', express.static(path.resolve(uploadDir)));

// ============================================================
// Rate Limiting general
// ============================================================
app.use('/api/', defaultLimiter);

// ============================================================
// Swagger UI  →  GET /api/docs
// ============================================================
const swaggerSpec = swaggerJsdoc(swaggerConfig);

app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'BeeChat API Docs',
    swaggerOptions: { persistAuthorization: true },
  })
);

// JSON del spec (útil para importar en Postman/Insomnia)
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ============================================================
// Health Check (sin auth, sin rate limit)
// ============================================================
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    },
  });
});

// ============================================================
// Rutas API v1
// ============================================================
app.use('/api/v1/auth',          authRoutes);
app.use('/api/v1/users',         usersRoutes);
app.use('/api/v1/devices',       devicesRoutes);
app.use('/api/v1/contacts',      contactsRoutes);
app.use('/api/v1/chats',                   chatsRoutes);
app.use('/api/v1/chats/:chatId/messages',  chatMessagesRouter);
app.use('/api/v1/chats/:chatId/polls',     pollsRoutes);
app.use('/api/v1/messages',                messagesRouter);

app.use('/api/v1/groups',        groupsRoutes);
app.use('/api/v1/stories',       storiesRoutes);
app.use('/api/v1/uploads',       uploadsRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/admin',         adminRoutes);
app.use('/api/v1/bee-assist',    beeAssistRoutes);
app.use('/api/v1/keys',         e2eRoutes);

// ============================================================
// Manejo de errores (siempre al final)
// ============================================================
app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
