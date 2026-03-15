/**
 * Helpers para respuestas HTTP consistentes
 */

/**
 * Respuesta de éxito estándar con un recurso
 */
function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

/**
 * Respuesta de creación (201)
 */
function sendCreated(res, data) {
  return res.status(201).json({ success: true, data });
}

/**
 * Respuesta de lista paginada
 */
function sendPaginated(res, rows, total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  return res.status(200).json({
    success: true,
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
}

/**
 * Respuesta con solo mensaje (sin data)
 */
function sendMessage(res, message, statusCode = 200) {
  return res.status(statusCode).json({ success: true, message });
}

/**
 * Wrapper para controladores async — propaga errores al middleware global
 * Evita repetir try/catch en cada controlador
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendMessage,
  asyncHandler,
};
