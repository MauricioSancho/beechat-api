const { ERRORS } = require('../shared/constants');

/**
 * Middleware de autorización por rol
 * Usar después de authMiddleware
 * @param {...string} allowedRoles - Roles permitidos (ej: 'admin', 'superadmin')
 */
function roleAuth(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ERRORS.UNAUTHORIZED());
    }

    // Verificar en roles (array) o en role (string, para admins)
    const userRoles = req.user.roles || [];
    const adminRole = req.user.role;

    const hasRole =
      allowedRoles.some((r) => userRoles.includes(r)) ||
      allowedRoles.includes(adminRole);

    if (!hasRole) {
      return next(ERRORS.FORBIDDEN('Insufficient permissions'));
    }

    next();
  };
}

module.exports = roleAuth;
