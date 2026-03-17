const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const uploadDir = process.env.UPLOAD_DIR || 'uploads';

// ---- Storage con nombre único por UUID ----
function createDiskStorage(subDir) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(uploadDir, subDir));
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}-${Date.now()}${ext}`);
    },
  });
}

// ---- Filtros por tipo MIME ----
function imageFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'application/octet-stream'];
  cb(null, allowed.includes(file.mimetype));
}

function videoFilter(req, file, cb) {
  const allowed = ['video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp'];
  cb(null, allowed.includes(file.mimetype));
}

function audioFilter(req, file, cb) {
  const allowed = ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/aac', 'audio/mp4', 'audio/x-m4a', 'application/octet-stream'];
  cb(null, allowed.includes(file.mimetype));
}

function documentFilter(req, file, cb) {
  const allowed = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ];
  cb(null, allowed.includes(file.mimetype));
}

// ---- Instancias Multer por tipo ----
const MB = 1024 * 1024;

const imageUpload = multer({
  storage: createDiskStorage('images'),
  fileFilter: imageFilter,
  limits: { fileSize: parseInt(process.env.MAX_IMAGE_SIZE_MB, 10) * MB || 5 * MB },
});

const videoUpload = multer({
  storage: createDiskStorage('videos'),
  fileFilter: videoFilter,
  limits: { fileSize: parseInt(process.env.MAX_VIDEO_SIZE_MB, 10) * MB || 50 * MB },
});

const audioUpload = multer({
  storage: createDiskStorage('audio'),
  fileFilter: audioFilter,
  limits: { fileSize: parseInt(process.env.MAX_AUDIO_SIZE_MB, 10) * MB || 10 * MB },
});

const documentUpload = multer({
  storage: createDiskStorage('documents'),
  fileFilter: documentFilter,
  limits: { fileSize: parseInt(process.env.MAX_DOCUMENT_SIZE_MB, 10) * MB || 20 * MB },
});

module.exports = { imageUpload, videoUpload, audioUpload, documentUpload };
