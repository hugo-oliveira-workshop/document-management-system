const fs = require('node:fs/promises');
const path = require('node:path');
const { before, beforeEach, after, test } = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');
const documentRepository = require('../src/repositories/documentRepository');

const storagePath = path.join(__dirname, '../storage');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);

  await new Promise((resolve) => {
    server.once('listening', resolve);
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
});

beforeEach(async () => {
  documentRepository.clear();

  const files = await fs.readdir(storagePath);
  const filesToDelete = files.filter((file) => file !== '.gitkeep');

  await Promise.all(
    filesToDelete.map((file) => fs.unlink(path.join(storagePath, file)))
  );
});

test('GET /health responde com status ok', async () => {
  const response = await fetch(`${baseUrl}/health`);

  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(await response.json(), { status: 'ok' });
});

test('POST /upload, GET /documents e GET /documents/:id/download funcionam em fluxo completo', async () => {
  const form = new FormData();
  form.append('owner', 'user-123');
  form.append('file', new Blob(['conteudo de teste'], { type: 'text/plain' }), 'teste.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: form,
  });

  assert.strictEqual(uploadResponse.status, 201);
  const uploadedMetadata = await uploadResponse.json();

  assert.ok(uploadedMetadata.id);
  assert.strictEqual(uploadedMetadata.originalName, 'teste.txt');
  assert.strictEqual(uploadedMetadata.owner, 'user-123');

  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(listResponse.status, 200);

  const listedDocuments = await listResponse.json();
  assert.strictEqual(listedDocuments.length, 1);
  assert.strictEqual(listedDocuments[0].id, uploadedMetadata.id);

  const downloadResponse = await fetch(
    `${baseUrl}/documents/${uploadedMetadata.id}/download`
  );

  assert.strictEqual(downloadResponse.status, 200);
  assert.match(downloadResponse.headers.get('content-disposition') || '', /attachment/);
  assert.strictEqual(await downloadResponse.text(), 'conteudo de teste');
});

test('POST /upload retorna 400 quando owner esta ausente', async () => {
  const form = new FormData();
  form.append('file', new Blob(['conteudo de teste'], { type: 'text/plain' }), 'teste.txt');

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: form,
  });

  assert.strictEqual(response.status, 400);
  assert.deepStrictEqual(await response.json(), {
    error: {
      code: 'VALIDATION_ERROR',
      message: 'O campo owner e obrigatorio',
    },
  });
});

test('POST /upload retorna 400 quando arquivo esta vazio', async () => {
  const form = new FormData();
  form.append('owner', 'user-123');
  form.append('file', new Blob([]), 'vazio.txt');

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: form,
  });

  assert.strictEqual(response.status, 400);
  assert.deepStrictEqual(await response.json(), {
    error: {
      code: 'VALIDATION_ERROR',
      message: 'O arquivo precisa conter dados',
    },
  });
});

test('POST /upload impede escape de storage no nome de arquivo', async () => {
  const form = new FormData();
  form.append('owner', 'user-123');
  form.append('file', new Blob(['conteudo seguro']), '../segredo.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: form,
  });

  assert.strictEqual(uploadResponse.status, 201);
  const uploadedMetadata = await uploadResponse.json();

  const storedMetadata = documentRepository.findById(uploadedMetadata.id);
  assert.ok(storedMetadata);
  assert.ok(storedMetadata.storedName.includes('segredo.txt'));
  assert.ok(!storedMetadata.storedName.includes('..'));
  assert.ok(storedMetadata.storagePath.startsWith(storagePath));
});

test('GET /documents/:id/download retorna 404 para id inexistente', async () => {
  const response = await fetch(
    `${baseUrl}/documents/11111111-1111-1111-1111-111111111111/download`
  );

  assert.strictEqual(response.status, 404);
  assert.deepStrictEqual(await response.json(), {
    error: {
      code: 'DOCUMENT_NOT_FOUND',
      message: 'Documento nao encontrado',
    },
  });
});
