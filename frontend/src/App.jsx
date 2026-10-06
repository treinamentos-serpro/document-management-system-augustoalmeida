import { useEffect, useState } from 'react';
import { Files, RefreshCw } from 'lucide-react';
import UploadComponent from './components/UploadComponent';
import DocumentList from './components/DocumentList';
import { listDocuments } from './services/documentApi';
import './App.css';

export default function App() {
  const [owner, setOwner] = useState('usuario-demo');
  const [ownerInput, setOwnerInput] = useState('usuario-demo');
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError('');
    setDocuments([]);
    listDocuments(owner, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setDocuments(result);
      })
      .catch((listError) => {
        if (!controller.signal.aborted) setError(listError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [owner, refreshCount]);

  function refreshDocuments() {
    setRefreshCount((count) => count + 1);
  }

  function handleOwnerChange(event) {
    event.preventDefault();
    const nextOwner = ownerInput.trim();
    if (!nextOwner) return;
    setOwnerInput(nextOwner);
    setOwner(nextOwner);
  }

  return (
    <>
      <header className="app-header">
        <div className="header-content"><Files size={28} aria-hidden="true" />
          <h1>Document Management System</h1></div>
      </header>
      <main>
        <form className="owner-form" onSubmit={handleOwnerChange}>
          <div><label htmlFor="owner">Identificador do usuário</label>
            <input id="owner" value={ownerInput} required
              onChange={(event) => setOwnerInput(event.target.value)} /></div>
          <button type="submit" disabled={!ownerInput.trim() || ownerInput.trim() === owner}>
            Aplicar
          </button>
        </form>
        <UploadComponent key={owner} owner={owner} onUploaded={refreshDocuments} />
        <section aria-labelledby="documents-heading" className="documents-section" aria-busy={isLoading}>
          <div className="section-heading">
            <h2 id="documents-heading">Documentos <span className="document-count">{documents.length}</span></h2>
            <button className="icon-button" type="button" onClick={refreshDocuments}
              disabled={isLoading} title="Atualizar lista" aria-label="Atualizar lista">
              <RefreshCw size={18} className={isLoading ? 'spin' : undefined} />
            </button>
          </div>
          {isLoading ? <p className="empty-state" role="status">Carregando documentos…</p>
            : error ? <p className="error-message" role="alert">{error}</p>
              : <DocumentList key={owner} documents={documents} owner={owner} />}
        </section>
      </main>
    </>
  );
}
