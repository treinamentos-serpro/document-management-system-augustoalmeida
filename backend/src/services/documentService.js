const { randomUUID } = require('node:crypto');
const documentRepository = require('../repositories/documentRepository');

function createDocument(file, owner) {
  const metadata = {
    id: randomUUID(),
    originalName: file.originalName,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
  };
  return documentRepository.save(metadata, file.storageName);
}

function listDocuments(owner) {
  return documentRepository.findAll()
    .filter((document) => document.owner === owner)
    .reverse()
    .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt));
}

async function getDocumentDownload(id, owner) {
  const document = documentRepository.findById(id);
  if (!document || document.owner !== owner) {
    throw Object.assign(new Error('Documento não encontrado.'), {
      code: 'DOCUMENT_NOT_FOUND',
    });
  }
  return {
    originalName: document.originalName,
    filePath: await documentRepository.getFilePath(id),
  };
}

module.exports = { createDocument, listDocuments, getDocumentDownload };