const uploadsService = require('./uploads.service');
const { sendCreated, asyncHandler } = require('../../utils/response.helper');
const { ERRORS } = require('../../shared/constants');

function createUploadHandler(type) {
  return asyncHandler(async (req, res) => {
    if (!req.file) throw ERRORS.BAD_REQUEST('No file provided. Use field name "file"');
    const result = uploadsService.processUpload(req.file, type);
    return sendCreated(res, result);
  });
}

const uploadImage    = createUploadHandler('images');
const uploadVideo    = createUploadHandler('videos');
const uploadAudio    = createUploadHandler('audio');
const uploadDocument = createUploadHandler('documents');

module.exports = { uploadImage, uploadVideo, uploadAudio, uploadDocument };
