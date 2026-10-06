const path = require('node:path');
const multer = require('multer');
const documentService = require('../services/documentService');

function requireOwner(req, res, next) {
  const owner = req.get('X-User-Id')?.trim();
  if (!owner) {
    return next(Object.assign(new Error('Informe o identificador do usuário.'), {
      code: 'USER_ID_REQUIRED',
    }));
  }
  res.locals.owner = owner;
  next();
}

function uploadDocument(req, res, next) {
  if (!req.file) {
    return next(Object.assign(new Error('Envie um arquivo no campo file.'), {
      code: 'FILE_REQUIRED',
    }));
  }
  const document = documentService.createDocument({
    originalName: req.file.originalname,
    size: req.file.size,
    storageName: req.file.filename,
  }, res.locals.owner);
  res.status(201).json(document);
}

function listDocuments(req, res) {
  res.json(documentService.listDocuments(res.locals.owner));
}

async function downloadDocument(req, res, next) {
  const document = await documentService.getDocumentDownload(req.params.id, res.locals.owner);
  const downloadName = path.win32.basename(path.basename(document.originalName))
    .replace(/[\x00-\x1f\x7f]/g, '_') || 'documento';
  res.set('X-Content-Type-Options', 'nosniff');
  res.download(document.filePath, downloadName, (error) => {
    if (error) next(error);
  });
}

function handleError(error, req, res, next) {
  if (res.headersSent) return next(error);

  const errors = {
    USER_ID_REQUIRED: [400, 'Informe o identificador do usuário.'],
    FILE_REQUIRED: [400, 'Envie um arquivo no campo file.'],
    DOCUMENT_NOT_FOUND: [404, 'Documento não encontrado.'],
  };
  let code = error.code;
  let result = Object.hasOwn(errors, code) ? errors[code] : undefined;

  if (error instanceof multer.MulterError) {
    code = error.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE' : 'INVALID_UPLOAD';
    result = code === 'FILE_TOO_LARGE'
      ? [413, 'O arquivo excede o limite permitido.']
      : [400, 'Envie apenas um arquivo no campo file.'];
  } else if (/^(Multipart:|Unexpected end of (form|file))/.test(error.message)) {
    code = 'INVALID_UPLOAD';
    result = [400, 'O formulário de upload é inválido.'];
  }

  if (!result) {
    code = 'STORAGE_ERROR';
    result = [500, 'Não foi possível concluir a operação com o arquivo.'];
  }
  res.status(result[0]).json({ error: { code, message: result[1] } });
}

module.exports = { requireOwner, uploadDocument, listDocuments, downloadDocument, handleError };