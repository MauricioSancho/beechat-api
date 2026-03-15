const { AppError } = require('../shared/constants');

/**
 * Middleware para rutas no encontradas (404)
 * Colocar ANTES del errorMiddleware y DESPUÉS de todos los routers
 */
function notFoundMiddleware(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND'));
}

module.exports = notFoundMiddleware;
