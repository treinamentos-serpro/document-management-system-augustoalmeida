const path = require('node:path');

const uploadMaxFileSizeBytes = Number(process.env.UPLOAD_MAX_FILE_SIZE_BYTES || 10485760);

if (!Number.isSafeInteger(uploadMaxFileSizeBytes) || uploadMaxFileSizeBytes <= 0) {
  throw new Error('UPLOAD_MAX_FILE_SIZE_BYTES deve ser um inteiro positivo em bytes.');
}

module.exports = {
  storageDirectory: path.resolve(__dirname, '../storage'),
  uploadMaxFileSizeBytes,
};