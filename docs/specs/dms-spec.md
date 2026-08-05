# Especificação - Document Management System

## 1. Objetivo

Entregar um sistema web simples para upload, listagem e download de documentos, com metadados em memória e arquivos persistidos localmente no servidor.

## 2. Escopo

### Dentro do escopo

- Upload de documentos via API backend
- Listagem de documentos cadastrados
- Download de documento por identificador
- Gestão simples por usuário através do campo `owner` no upload
- Interface frontend React integrada ao backend via `/api` (proxy Vite)

### Fora do escopo

- Autenticação e autorização completas
- Armazenamento externo (S3, GCS, Azure Blob etc.)
- Versionamento de documentos
- Busca textual avançada
- Paginação, ordenação avançada e filtros complexos
- Limites de tipo/tamanho de arquivo nesta fase inicial

## 3. Requisitos funcionais

| ID | Requisito | Critério de aceite |
| --- | --- | --- |
| RF-01 | O usuário pode enviar um documento para o sistema | Dado um `multipart/form-data` válido com campo `file` e campo `owner`, quando o endpoint de upload for chamado, então o sistema persiste o arquivo em `backend/storage` e retorna os metadados criados com `id` único |
| RF-02 | O sistema registra metadados do documento no upload | Após upload com sucesso, deve existir um registro em memória contendo `id`, `originalName`, `storedName`, `mimeType`, `size`, `uploadedAt`, `owner` e `storagePath` |
| RF-03 | O usuário pode listar os documentos existentes | Quando o endpoint de listagem for chamado, o sistema retorna uma lista com os metadados públicos de todos os documentos cadastrados |
| RF-04 | O usuário pode baixar um documento pelo identificador | Quando o endpoint de download receber um `id` existente, o sistema retorna o binário do arquivo correspondente com headers de download apropriados |
| RF-05 | O sistema deve responder erros de validação de entrada | Se faltar `file` ou `owner` no upload, o sistema retorna erro HTTP `400` com mensagem clara |
| RF-06 | O sistema deve responder quando documento não existir | Se `GET /documents/:id/download` receber um `id` inexistente, o sistema retorna HTTP `404` |
| RF-07 | O endpoint de saúde deve permanecer disponível | `GET /health` retorna HTTP `200` com payload indicando status de operação |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | O backend deve seguir Clean Architecture simples com camadas `routes -> controllers -> services -> repositories` |
| RNF-02 | Arquivos devem ser gravados no filesystem local em `backend/storage` usando `multer` com `diskStorage` |
| RNF-03 | Metadados devem permanecer em memória nesta fase (sem banco de dados) |
| RNF-04 | Configuração deve seguir 12-Factor, com valores via variáveis de ambiente (`PORT`, caminhos de storage quando aplicável) |
| RNF-05 | API deve usar JSON para respostas de metadados e erros padronizados |
| RNF-06 | Código deve manter simplicidade (KISS/YAGNI), funções pequenas e sem overengineering |
| RNF-07 | Frontend deve consumir backend apenas via `/api` (proxy local no Vite) |

## 5. Modelo de dados (metadados do documento)

### Entidade: DocumentMetadata

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| id | string | Sim | Identificador único do documento (UUID ou similar) |
| originalName | string | Sim | Nome original do arquivo enviado pelo cliente |
| storedName | string | Sim | Nome persistido fisicamente no storage local |
| mimeType | string | Sim | Tipo MIME informado pelo upload |
| size | number | Sim | Tamanho em bytes |
| uploadedAt | string (ISO 8601) | Sim | Data e hora do upload |
| owner | string | Sim | Dono lógico do documento, informado no upload |
| storagePath | string | Sim | Caminho absoluto ou relativo interno para o arquivo no disco |

### Regras de validação

- `owner` deve ser string não vazia após trim
- `file` é obrigatório no upload
- `size` deve ser maior que 0
- `uploadedAt` deve ser serializado em formato ISO 8601 UTC

### Visão pública retornada pela API

Para evitar expor detalhes internos de filesystem, a listagem pode retornar:

- `id`
- `originalName`
- `mimeType`
- `size`
- `uploadedAt`
- `owner`

Campos internos como `storagePath` e `storedName` ficam reservados para uso interno.

## 6. Contratos de API

### Convenções gerais

- Base URL backend local: `http://localhost:3000`
- Prefixo no frontend: `/api` (proxy para backend)
- Formato de erro padrão:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Mensagem legível para cliente"
  }
}
```

### 6.1 GET /health

Objetivo: verificar disponibilidade da aplicação.

Resposta `200 OK`:

```json
{
  "status": "ok"
}
```

### 6.2 POST /upload

Objetivo: receber arquivo e metadados mínimos.

#### Request

- Content-Type: `multipart/form-data`
- Campos:
- `file` (binary, obrigatório)
- `owner` (string, obrigatório)

Exemplo (conceitual):

```http
POST /upload
Content-Type: multipart/form-data
```

#### Response de sucesso

Status: `201 Created`

```json
{
  "id": "a84d5cc2-6ec9-410d-a0e2-3e354a56f11d",
  "originalName": "contrato.pdf",
  "mimeType": "application/pdf",
  "size": 245123,
  "uploadedAt": "2026-08-05T13:00:00.000Z",
  "owner": "user-123"
}
```

#### Respostas de erro

- `400 Bad Request`:
- arquivo ausente
- owner ausente ou inválido
- `500 Internal Server Error`:
- falha inesperada ao persistir metadados/arquivo

### 6.3 GET /documents

Objetivo: listar todos os documentos desta fase inicial.

#### Request

Sem parâmetros obrigatórios.

#### Response de sucesso

Status: `200 OK`

```json
[
  {
    "id": "a84d5cc2-6ec9-410d-a0e2-3e354a56f11d",
    "originalName": "contrato.pdf",
    "mimeType": "application/pdf",
    "size": 245123,
    "uploadedAt": "2026-08-05T13:00:00.000Z",
    "owner": "user-123"
  }
]
```

#### Respostas de erro

- `500 Internal Server Error`:
- erro inesperado na leitura de metadados em memória

### 6.4 GET /documents/:id/download

Objetivo: baixar o arquivo físico referente ao documento.

#### Request

- Path param:
- `id` (string, obrigatório)

#### Response de sucesso

Status: `200 OK`

- Body: conteúdo binário do arquivo
- Headers esperados:
- `Content-Type`: MIME do documento
- `Content-Disposition`: `attachment; filename="<originalName>"`

#### Respostas de erro

- `404 Not Found`:
- documento não cadastrado
- arquivo não localizado no disco
- `500 Internal Server Error`:
- erro inesperado na leitura/envio do arquivo

## 7. Decisões arquiteturais

### 7.1 Backend (Clean Architecture simples)

Fluxo obrigatório de dependência:

- `routes`: define endpoints e delega ao controller
- `controllers`: interpreta HTTP (request/response), valida campos básicos e chama service
- `services`: aplica regras de negócio e orquestra casos de uso
- `repositories`: persiste/recupera metadados em memória e integra com filesystem local

Regra de acoplamento:

- camadas internas não conhecem detalhes de HTTP
- service não manipula `req`/`res`
- repository não contém regras de apresentação

### 7.2 Persistência

- Binário do arquivo: `backend/storage` via `multer.diskStorage`
- Metadados: estrutura em memória (array/map em processo Node)

### 7.3 Frontend

- React com componentes funcionais e hooks
- Comunicação com backend via `fetch` usando prefixo `/api`
- Componentes previstos:
- Upload
- Listagem
- Download por item

## 8. Plano de execução em etapas

### Etapa 1 - Estrutura de domínio e contratos internos (backend)

- Criar entidade de metadados e mapeadores de resposta
- Definir interfaces simples entre controller, service e repository
- Definir formato de erro padronizado

Critério de saída:

- contratos internos definidos e camada de serviço testável sem HTTP

### Etapa 2 - Implementar upload com persistência local

- Configurar `multer.diskStorage` em `backend/storage`
- Implementar rota/controller/service/repository de `POST /upload`
- Validar presença de `file` e `owner`

Critério de saída:

- upload salva arquivo no disco e retorna metadados públicos com `201`

### Etapa 3 - Implementar listagem de documentos

- Implementar `GET /documents` nas quatro camadas
- Retornar coleção de metadados públicos

Critério de saída:

- listagem retorna `200` e array consistente após uploads

### Etapa 4 - Implementar download por id

- Implementar `GET /documents/:id/download`
- Validar existência de metadado e arquivo físico

Critério de saída:

- download retorna arquivo quando id existe e `404` quando não existe

### Etapa 5 - Testes backend (node:test)

- Cobrir smoke test de app
- Adicionar cenários de upload/listagem/download/erros
- Cobrir casos `400`, `404` e `500` principais

Critério de saída:

- suíte de testes backend estável no comando `npm test`

### Etapa 6 - Frontend base e integração

- Criar serviço de API em `frontend/src/services`
- Criar componentes de upload, lista e botão de download
- Integrar fluxo de atualização após upload

Critério de saída:

- usuário consegue realizar fluxo fim a fim pelo frontend local

### Etapa 7 - Hardening e validação final

- Revisar tratamento de erro nas bordas HTTP
- Revisar aderência a Clean Architecture
- Revisar variáveis de ambiente e documentação

Critério de saída:

- requisitos RF e RNF rastreáveis para implementação e testes

## 9. Rastreabilidade (RF -> endpoint -> teste)

| RF | Endpoint principal | Teste mínimo |
| --- | --- | --- |
| RF-01 | `POST /upload` | Upload com `file + owner` retorna `201` |
| RF-02 | `POST /upload` | Registro em memória contém campos obrigatórios |
| RF-03 | `GET /documents` | Lista retorna array e inclui item enviado |
| RF-04 | `GET /documents/:id/download` | Download retorna binário para id existente |
| RF-05 | `POST /upload` | Falta de `file` ou `owner` retorna `400` |
| RF-06 | `GET /documents/:id/download` | Id inexistente retorna `404` |
| RF-07 | `GET /health` | Healthcheck retorna `200` e `{ status: "ok" }` |

## 10. Critérios de pronto (Definition of Done)

- Todos os requisitos funcionais RF-01 a RF-07 implementados e validados
- Todos os RNF desta fase respeitados
- Nenhum uso de armazenamento externo
- API documentada e consistente com comportamento real
- Testes automatizados backend executando com sucesso
- Frontend consumindo backend por `/api` no ambiente local
