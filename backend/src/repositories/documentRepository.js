const documents = [];

function create(documentMetadata) {
  documents.push(documentMetadata);
  return documentMetadata;
}

function list() {
  return [...documents];
}

function findById(id) {
  return documents.find((document) => document.id === id) || null;
}

function clear() {
  documents.length = 0;
}

module.exports = {
  create,
  list,
  findById,
  clear,
};