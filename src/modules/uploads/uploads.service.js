const path = require('path');

/**
 * Procesa el archivo subido por multer y construye la URL pública
 * Punto de extensión: reemplazar con S3 / Cloudinary sin cambiar el controller
 */
function processUpload(file, type) {
  if (!file) return null;

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const url = `${baseUrl}/uploads/${type}/${file.filename}`;

  return {
    url,
    fileName: file.filename,
    originalName: file.originalname,
    fileSize: file.size,
    fileType: file.mimetype,
    type,
  };
}

module.exports = { processUpload };
