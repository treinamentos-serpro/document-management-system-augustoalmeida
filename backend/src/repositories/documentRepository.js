const path = require('node:path');
const { access } = require('node:fs/promises');
const { constants } = require('node:fs');
const { storageDirectory } = require('../config');

const documents = new Map();

function save(metadata, storageName) {
  documents.set(metadata.id, { metadata: { ...metadata }, storageName });
  return { ...metadata };
}

function findAll() {
  return [...documents.values()].map((document) => ({ ...document.metadata }));
}

function findById(id) {
  const document = documents.get(id);
  return document ? { ...document.metadata } : undefined;
}

async function getFilePath(id) {
  const document = documents.get(id);
  const filePath = path.join(storageDirectory, document.storageName);
  await access(filePath, constants.R_OK);
  return filePath;
}

module.exports = { save, findAll, findById, getFilePath };