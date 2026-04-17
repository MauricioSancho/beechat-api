const rateLimit = require('express-rate-limit');

// ---- Rate Limiter General ----
// 30 usuarios simultáneos en misma red/IP universitaria → ~2000 req/min mínimo
const defaultLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minuto
  max: 3000,            // 3000 requests por minuto por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests, please try again later.',
    },
  },
});

// ---- Rate Limiter Estricto para Auth ----
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5000,                   // máx 5000 intentos de login/register
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts, please try again in 15 minutes.',
    },
  },
});

// ---- Rate Limiter para Bee Assist (IA) ----
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'AI assistant rate limit exceeded. Max 10 requests per minute.',
    },
  },
});

module.exports = { defaultLimiter, authLimiter, aiLimiter };
