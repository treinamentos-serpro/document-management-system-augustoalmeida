import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, Upload } from 'lucide-react';
import { uploadDocument } from '../services/documentApi';

export default function UploadComponent({ owner, onUploaded }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const fileInput = useRef(null);
  const pendingRequest = useRef(null);

  useEffect(() => () => pendingRequest.current?.abort(), []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || isUploading) return;
    const controller = new AbortController();
    pendingRequest.current = controller;
    setIsUploading(true);
    setError('');
    setMessage('');
    try {
      const document = await uploadDocument(file, owner, controller.signal);
      setMessage(`${document.originalName} enviado.`);
      setFile(null);
      fileInput.current.value = '';
      onUploaded();
    } catch (uploadError) {
      if (!controller.signal.aborted) setError(uploadError.message);
    } finally {
      if (!controller.signal.aborted) setIsUploading(false);
    }
  }

  return (
    <section className="upload-section" aria-labelledby="upload-heading">
      <h2 id="upload-heading">Novo documento</h2>
      <form className="upload-form" onSubmit={handleSubmit}>
        <div className="file-field">
          <label htmlFor="document-file">Arquivo</label>
          <input id="document-file" type="file" ref={fileInput} required
            disabled={isUploading} onChange={(event) => {
              setFile(event.target.files[0] || null);
              setError('');
              setMessage('');
            }} />
        </div>
        <button className="primary-button" type="submit" disabled={!file || isUploading}>
          {isUploading ? <LoaderCircle className="spin" size={18} /> : <Upload size={18} />}
          {isUploading ? 'Enviando…' : 'Enviar documento'}
        </button>
      </form>
      {error && <p className="error-message" role="alert">{error}</p>}
      {message && <p className="success-message" role="status">{message}</p>}
    </section>
  );
}