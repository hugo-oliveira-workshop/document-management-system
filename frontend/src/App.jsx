import { useCallback, useEffect, useState } from 'react';
import UploadComponent from './components/UploadComponent';
import DocumentList from './components/DocumentList';
import { listDocuments, uploadDocument } from './services/documentApi';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const loadDocuments = useCallback(async ({ signal } = {}) => {
    setIsLoadingDocuments(true);
    setLoadErrorMessage('');

    try {
      const documentList = await listDocuments({ signal });
      setDocuments(documentList);
    } catch (error) {
      if (signal?.aborted) {
        return;
      }

      setLoadErrorMessage(error.message || 'Nao foi possivel listar os documentos.');
    } finally {
      if (!signal?.aborted) {
        setIsLoadingDocuments(false);
      }
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    loadDocuments({ signal: abortController.signal });

    return () => {
      abortController.abort();
    };
  }, [loadDocuments]);

  async function handleUpload({ file, owner }) {
    setIsUploading(true);
    setStatusMessage('');

    try {
      await uploadDocument({ file, owner });
      setStatusMessage('Documento enviado com sucesso.');
      await loadDocuments();
    } catch (error) {
      throw new Error(error.message || 'Nao foi possivel enviar o documento.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>Document Management System</h1>

      <UploadComponent onUpload={handleUpload} isUploading={isUploading} />

      {statusMessage ? <p style={{ color: '#166534' }}>{statusMessage}</p> : null}

      <hr style={{ margin: '2rem 0' }} />

      <DocumentList
        documents={documents}
        isLoading={isLoadingDocuments}
        errorMessage={loadErrorMessage}
      />
    </main>
  );
}
