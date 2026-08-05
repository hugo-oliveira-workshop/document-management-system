import { useState } from 'react';

export default function UploadComponent({ onUpload, isUploading }) {
  const [owner, setOwner] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedFile) {
      setErrorMessage('Selecione um arquivo para envio.');
      return;
    }

    if (!owner.trim()) {
      setErrorMessage('Informe o proprietario do documento.');
      return;
    }

    setErrorMessage('');

    try {
      await onUpload({
        file: selectedFile,
        owner: owner.trim(),
      });

      setSelectedFile(null);
      setOwner('');
      event.target.reset();
    } catch (error) {
      setErrorMessage(error.message || 'Nao foi possivel enviar o documento.');
    }
  }

  return (
    <section>
      <h2>Upload</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="owner-input">Proprietario</label>
          <br />
          <input
            id="owner-input"
            type="text"
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            disabled={isUploading}
          />
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="file-input">Arquivo</label>
          <br />
          <input
            id="file-input"
            type="file"
            onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
            disabled={isUploading}
          />
        </div>

        <button type="submit" disabled={isUploading}>
          {isUploading ? 'Enviando...' : 'Enviar documento'}
        </button>
      </form>

      {errorMessage ? (
        <p role="alert" style={{ color: '#b91c1c' }}>
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
}
