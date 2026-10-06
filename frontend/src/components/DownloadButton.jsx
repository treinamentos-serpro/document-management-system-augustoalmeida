import { useEffect, useRef, useState } from 'react';
import { Download, LoaderCircle } from 'lucide-react';
import { downloadDocument } from '../services/documentApi';

export default function DownloadButton({ document, owner }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');
  const pendingRequest = useRef(null);

  useEffect(() => () => pendingRequest.current?.abort(), []);

  async function handleDownload() {
    if (isDownloading) return;
    const controller = new AbortController();
    pendingRequest.current = controller;
    setIsDownloading(true);
    setError('');
    try {
      const blob = await downloadDocument(document.id, owner, controller.signal);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.originalName.split(/[\\/]/).pop()
        .replace(/[\x00-\x1f\x7f]/g, '_') || 'documento';
      window.document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (downloadError) {
      if (!controller.signal.aborted) setError(downloadError.message);
    } finally {
      if (!controller.signal.aborted) setIsDownloading(false);
    }
  }

  return (
    <div className="download-action">
      <button className="icon-button" type="button" onClick={handleDownload}
        disabled={isDownloading} title={isDownloading ? 'Baixando' : 'Baixar documento'}
        aria-label={`Baixar ${document.originalName}`} aria-busy={isDownloading}>
        {isDownloading ? <LoaderCircle className="spin" size={18} /> : <Download size={18} />}
      </button>
      {error && <p className="error-message" role="alert">{error}</p>}
    </div>
  );
}