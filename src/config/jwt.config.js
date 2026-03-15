/**
 * Configuración JWT
 */

const jwtConfig = {
  accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_in_production_64chars',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_in_production_64chars',
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  refreshCookieName: 'beeRefresh',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días en ms
    path: '/',
  },
};

module.exports = { jwtConfig };
