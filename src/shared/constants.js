/**
 * Constantes globales y clase AppError
 */

// ---- HTTP Status Codes ----
const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
});

// ---- Paginación ----
const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
});

// ---- Seguridad ----
const BCRYPT_ROUNDS = 12;
const STORY_EXPIRY_HOURS = 24;

// ---- Tipos de Token ----
const TOKEN_TYPES = Object.freeze({
  ACCESS: 'access',
  REFRESH: 'refresh',
  ADMIN: 'admin',
});

// ---- Clase AppError ----
// Error operacional tipado. Tiene statusCode y code para mapeo HTTP consistente.
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // distingue errores esperados de bugs de programación
    Error.captureStackTrace(this, this.constructor);
  }
}

// ---- Factory de Errores Comunes ----
const ERRORS = {
  NOT_FOUND: (entity = 'Resource') =>
    new AppError(`${entity} not found`, HTTP_STATUS.NOT_FOUND, 'NOT_FOUND'),

  UNAUTHORIZED: (message = 'Unauthorized') =>
    new AppError(message, HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED'),

  FORBIDDEN: (message = 'Access denied') =>
    new AppError(message, HTTP_STATUS.FORBIDDEN, 'FORBIDDEN'),

  CONFLICT: (message) =>
    new AppError(message, HTTP_STATUS.CONFLICT, 'CONFLICT'),

  VALIDATION_FAILED: (message = 'Validation failed') =>
    new AppError(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_FAILED'),

  INTERNAL: (message = 'Internal server error') =>
    new AppError(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'INTERNAL_ERROR'),

  NOT_IMPLEMENTED: (feature = 'Feature') =>
    new AppError(`${feature} is not available`, HTTP_STATUS.NOT_IMPLEMENTED, 'FEATURE_DISABLED'),

  BAD_REQUEST: (message = 'Bad request') =>
    new AppError(message, HTTP_STATUS.BAD_REQUEST, 'BAD_REQUEST'),

  TOO_MANY_REQUESTS: (message = 'Too many requests') =>
    new AppError(message, HTTP_STATUS.TOO_MANY_REQUESTS, 'TOO_MANY_REQUESTS'),

  FILE_TOO_LARGE: () =>
    new AppError('File size exceeds the allowed limit', 413, 'FILE_TOO_LARGE'),

  UPLOAD_ERROR: (message = 'File upload failed') =>
    new AppError(message, HTTP_STATUS.BAD_REQUEST, 'UPLOAD_ERROR'),
};

module.exports = {
  HTTP_STATUS,
  PAGINATION,
  BCRYPT_ROUNDS,
  STORY_EXPIRY_HOURS,
  TOKEN_TYPES,
  AppError,
  ERRORS,
};
