const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const documentRepository = require('../repositories/documentRepository');
const { storageDir } = require('../config/env');

function ensurePathIsInsideStorage(filePath) {
  const absoluteStorageDir = path.resolve(storageDir);
  const absoluteFilePath = path.resolve(filePath);
  const relativePath = path.relative(absoluteStorageDir, absoluteFilePath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    const error = new Error('File path is outside the storage directory');
    error.code = 'INVALID_STORAGE_PATH';
    throw error;
  }
}

function toPublicMetadata(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    mimeType: document.mimeType,
    size: document.size,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
  };
}

async function createDocument({ file, owner }) {
  ensurePathIsInsideStorage(file.path);

  const metadata = {
    id: randomUUID(),
    originalName: file.originalname,
    storedName: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    storagePath: file.path,
  };

  documentRepository.create(metadata);

  return toPublicMetadata(metadata);
}

function listDocuments() {
  return documentRepository.list().map(toPublicMetadata);
}

async function getDownloadById(id) {
  const metadata = documentRepository.findById(id);

  if (!metadata) {
    const error = new Error('Document not found');
    error.code = 'DOCUMENT_NOT_FOUND';
    throw error;
  }

  ensurePathIsInsideStorage(metadata.storagePath);

  try {
    await fs.access(metadata.storagePath);
  } catch (error) {
    const fileError = new Error('Stored file not found');
    fileError.code = 'FILE_NOT_FOUND';
    throw fileError;
  }

  return {
    storagePath: metadata.storagePath,
    originalName: metadata.originalName,
    mimeType: metadata.mimeType,
  };
}

module.exports = {
  createDocument,
  listDocuments,
  getDownloadById,
};