import { FileText } from 'lucide-react';
import DownloadButton from './DownloadButton';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const sizeFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${sizeFormatter.format(bytes / 1024)} KB`;
  return `${sizeFormatter.format(bytes / (1024 * 1024))} MB`;
}

export default function DocumentList({ documents, owner }) {
  if (documents.length === 0) {
    return <p className="empty-state">Nenhum documento encontrado.</p>;
  }

  return (
    <div className="table-container">
      <table>
        <caption className="sr-only">Documentos de {owner}</caption>
        <thead>
          <tr><th scope="col">Nome</th><th scope="col">Tamanho</th>
            <th scope="col">Enviado em</th><th scope="col">Download</th></tr>
        </thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id}>
              <td><span className="document-name"><FileText size={18} aria-hidden="true" />
                <span>{document.originalName}</span></span></td>
              <td className="size-cell">{formatSize(document.size)}</td>
              <td><time dateTime={document.uploadedAt}>
                {dateFormatter.format(new Date(document.uploadedAt))}</time></td>
              <td><DownloadButton document={document} owner={owner} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}