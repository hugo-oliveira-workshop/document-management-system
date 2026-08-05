const path = require('node:path');
const multer = require('multer');
const express = require('express');
const documentController = require('../controllers/documentController');
const { storageDir, uploadLimits } = require('../config/env');

const router = express.Router();

function toSafeFilename(originalName) {
  const baseName = path.basename(originalName || 'file');
  const safeName = baseName
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  return safeName || 'file';
}

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, storageDir);
  },
  filename: (req, file, callback) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const safeOriginalName = toSafeFilename(file.originalname);
    callback(null, `${uniqueSuffix}-${safeOriginalName}`);
  },
});

const upload = multer({
  storage,
  limits: uploadLimits,
});

function handleSingleUpload(req, res, next) {
  upload.single('file')(req, res, (error) => {
    if (error) {
      return documentController.handleUploadMiddlewareError(error, res);
    }

    return next();
  });
}

router.post('/upload', handleSingleUpload, documentController.uploadDocument);
router.get('/documents', documentController.listDocuments);
router.get('/documents/:id/download', documentController.downloadDocument);

module.exports = router;