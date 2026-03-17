const multer = require('multer');
const { imageUpload, videoUpload, audioUpload, documentUpload } = require('../config/multer.config');
const { AppError } = require('../shared/constants');

/**
 * Wrapper que convierte errores de Multer en AppError para manejo consistente
 */
function wrapMulter(multerInstance, fieldName) {
  return (req, res, next) => {
    multerInstance.single(fieldName)(req, res, (err) => {
      if (!err) return next();

      if (err instanceof multer.MulterError) {
        switch (err.code) {
          case 'LIMIT_FILE_SIZE':
            return next(new AppError('File size exceeds the allowed limit.', 413, 'FILE_TOO_LARGE'));
          case 'LIMIT_UNEXPECTED_FILE':
            return next(new AppError(`Unexpected field: ${err.field}`, 400, 'UPLOAD_ERROR'));
          default:
            return next(new AppError(err.message, 400, 'UPLOAD_ERROR'));
        }
      }

      // Filtro de tipo rechazó el archivo
      if (err === false || err === null) {
        return next(new AppError('File type not allowed.', 415, 'UNSUPPORTED_MEDIA_TYPE'));
      }

      next(err);
    });
  };
}

const uploadImage = wrapMulter(imageUpload, 'file');
const uploadAvatar = wrapMulter(imageUpload, 'avatar');
const uploadVideo = wrapMulter(videoUpload, 'file');
const uploadAudio = wrapMulter(audioUpload, 'file');
const uploadDocument = wrapMulter(documentUpload, 'file');

module.exports = { uploadImage, uploadAvatar, uploadVideo, uploadAudio, uploadDocument };
