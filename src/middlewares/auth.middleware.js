const { verifyAccessToken } = require('../utils/token.helper');
const { ERRORS } = require('../shared/constants');

/**
 * Middleware de autenticación JWT
 * Extrae el Bearer token del header Authorization, verifica y setea req.user
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ERRORS.UNAUTHORIZED('No token provided'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);

    if (decoded.type !== 'access' && decoded.type !== 'admin') {
      return next(ERRORS.UNAUTHORIZED('Invalid token type'));
    }

    // Adjuntar datos del usuario a la request para uso en controllers/services
    req.user = {
      id: decoded.sub,
      uuid: decoded.uuid,
      roles: decoded.roles || [],
      role: decoded.role, // para admins
      type: decoded.type,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(ERRORS.UNAUTHORIZED('Token expired'));
    }
    return next(ERRORS.UNAUTHORIZED('Invalid token'));
  }
}

module.exports = authMiddleware;
