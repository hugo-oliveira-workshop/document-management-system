const documentService = require('../services/documentService');

function validationError(res, message) {
  return res.status(400).json({
    error: {
      code: 'VALIDATION_ERROR',
      message,
    },
  });
}

function internalError(res) {
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Erro interno ao processar a requisicao',
    },
  });
}

async function uploadDocument(req, res) {
  try {
    const owner = typeof req.body?.owner === 'string' ? req.body.owner.trim() : '';

    if (!req.file) {
      return validationError(res, 'O campo file e obrigatorio');
    }

    if (!owner) {
      return validationError(res, 'O campo owner e obrigatorio');
    }

    const metadata = await documentService.createDocument({
      file: req.file,
      owner,
    });

    return res.status(201).json(metadata);
  } catch (error) {
    return internalError(res);
  }
}

function listDocuments(req, res) {
  try {
    const documents = documentService.listDocuments();
    return res.status(200).json(documents);
  } catch (error) {
    return internalError(res);
  }
}

async function downloadDocument(req, res) {
  try {
    const download = await documentService.getDownloadById(req.params.id);

    return res.download(download.storagePath, download.originalName, (error) => {
      if (error && !res.headersSent) {
        return internalError(res);
      }

      return null;
    });
  } catch (error) {
    if (error.code === 'DOCUMENT_NOT_FOUND' || error.code === 'FILE_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Documento nao encontrado',
        },
      });
    }

    return internalError(res);
  }
}

module.exports = {
  uploadDocument,
  listDocuments,
  downloadDocument,
};