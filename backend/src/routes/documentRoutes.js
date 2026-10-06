const express = require('express');
const multer = require('multer');
const { randomUUID } = require('node:crypto');
const { mkdir } = require('node:fs');
const documentController = require('../controllers/documentController');
const { storageDirectory, uploadMaxFileSizeBytes } = require('../config');

const router = express.Router();
const storage = multer.diskStorage({
  destination(req, file, callback) {
    mkdir(storageDirectory, { recursive: true }, (error) => {
      callback(error, storageDirectory);
    });
  },
  filename(req, file, callback) {
    callback(null, randomUUID());
  },
});
const upload = multer({
  storage,
  limits: { fileSize: uploadMaxFileSizeBytes, files: 1 },
});

router.post('/upload', documentController.requireOwner, upload.single('file'),
  documentController.uploadDocument);
router.get('/documents', documentController.requireOwner, documentController.listDocuments);
router.get('/documents/:id/download', documentController.requireOwner,
  documentController.downloadDocument);

router.use(documentController.handleError);

module.exports = router;