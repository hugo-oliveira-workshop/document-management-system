const fs = require('node:fs/promises');
const { randomUUID } = require('node:crypto');
const documentRepository = require('../repositories/documentRepository');

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