const path = require('node:path');

function parsePositiveInt(value, fallbackValue) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackValue;
  }

  return parsed;
}

const storageDir = process.env.DOCUMENT_STORAGE_DIR
  ? path.resolve(process.env.DOCUMENT_STORAGE_DIR)
  : path.resolve(__dirname, '../../storage');

const uploadLimits = {
  fileSize: parsePositiveInt(process.env.DOCUMENT_MAX_FILE_SIZE_BYTES, 10 * 1024 * 1024),
  files: 1,
  fields: parsePositiveInt(process.env.DOCUMENT_MAX_FIELDS, 10),
  parts: parsePositiveInt(process.env.DOCUMENT_MAX_PARTS, 20),
};

module.exports = {
  port: parsePositiveInt(process.env.PORT, 3000),
  storageDir,
  uploadLimits,
};
