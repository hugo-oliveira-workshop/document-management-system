import { useState } from 'react';
import { downloadDocument } from '../services/documentApi';

export default function DownloadButton({ documentId, originalName }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleDownload() {
    setIsDownloading(true);
    setErrorMessage('');

    try {
      const { blob, filename } = await downloadDocument({
        id: documentId,
        fallbackName: originalName,
      });

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename || originalName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setErrorMessage(error.message || 'Falha ao baixar o documento.');
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={handleDownload} disabled={isDownloading}>
        {isDownloading ? 'Baixando...' : 'Download'}
      </button>
      {errorMessage ? (
        <p role="alert" style={{ color: '#b91c1c', marginTop: '0.5rem' }}>
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
