const logger = require('../utils/logger');
const { AppError } = require('../shared/constants');

/**
 * Middleware global de manejo de errores
 * Debe ser el último middleware en app.js
 */
// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  // Loguear siempre (excepto errores de validación comunes)
  if (!err.isOperational || err.statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} → ${err.message}`, {
      stack: err.stack,
      body: req.body,
    });
  }

  // ---- Error Operacional (AppError) ----
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  // ---- Errores de SQL Server ----
  // Duplicate key (unique constraint violation)
  if (err.number === 2627 || err.number === 2601) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'A record with those values already exists.',
      },
    });
  }

  // Foreign key violation
  if (err.number === 547) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REFERENCE',
        message: 'Referenced record does not exist.',
      },
    });
  }

  // ---- Errores de Multer ----
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: { code: 'FILE_TOO_LARGE', message: 'File size exceeds the allowed limit.' },
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: { code: 'UPLOAD_ERROR', message: 'Unexpected file field.' },
    });
  }

  // ---- Error Desconocido (bug o error no esperado) ----
  const isProd = process.env.NODE_ENV === 'production';

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
      // En desarrollo exponer detalle para facilitar debugging
      ...(isProd ? {} : { detail: err.message, stack: err.stack }),
    },
  });
}

module.exports = errorMiddleware;
