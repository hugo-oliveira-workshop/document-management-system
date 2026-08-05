import DownloadButton from './DownloadButton';

function formatSize(bytes) {
  if (!Number.isFinite(bytes)) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const rounded = size >= 10 ? Math.round(size) : size.toFixed(1);
  return `${rounded} ${units[unitIndex]}`;
}

function formatDate(isoDate) {
  if (!isoDate) {
    return '-';
  }

  return new Date(isoDate).toLocaleString('pt-BR');
}

export default function DocumentList({ documents, isLoading, errorMessage }) {
  return (
    <section>
      <h2>Documentos</h2>

      {isLoading ? <p>Carregando documentos...</p> : null}
      {errorMessage ? (
        <p role="alert" style={{ color: '#b91c1c' }}>
          {errorMessage}
        </p>
      ) : null}

      {!isLoading && documents.length === 0 ? <p>Nenhum documento enviado.</p> : null}

      {!isLoading && documents.length > 0 ? (
        <ul style={{ paddingLeft: '1.25rem' }}>
          {documents.map((documentItem) => (
            <li key={documentItem.id} style={{ marginBottom: '1rem' }}>
              <p style={{ margin: 0 }}>
                <strong>{documentItem.originalName}</strong>
              </p>
              <p style={{ margin: '0.25rem 0' }}>Dono: {documentItem.owner}</p>
              <p style={{ margin: '0.25rem 0' }}>
                Tamanho: {formatSize(documentItem.size)} | Enviado em:{' '}
                {formatDate(documentItem.uploadedAt)}
              </p>
              <DownloadButton
                documentId={documentItem.id}
                originalName={documentItem.originalName}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
