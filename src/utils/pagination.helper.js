const { PAGINATION } = require('../shared/constants');

/**
 * Extrae y valida parámetros de paginación de req.query
 * @returns {{ page, limit, offset }}
 */
function parsePagination(query) {
  let page = parseInt(query.page, 10) || PAGINATION.DEFAULT_PAGE;
  let limit = parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT;

  // Guardarriles
  if (page < 1) page = 1;
  if (limit < 1) limit = 1;
  if (limit > PAGINATION.MAX_LIMIT) limit = PAGINATION.MAX_LIMIT;

  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Construye el envelope de paginación (usado en service/controller si no se usa sendPaginated directo)
 */
function buildPaginatedResponse(rows, total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  return {
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

module.exports = { parsePagination, buildPaginatedResponse };
