# Especificação - Document Management System

## 1. Objetivo

Permitir que usuários enviem, listem e baixem seus documentos por meio de uma aplicação web, mantendo os arquivos no filesystem local e seus metadados em memória.

## 2. Escopo

### Dentro do escopo

- Upload de um documento por requisição.
- Listagem dos documentos associados ao usuário informado na requisição.
- Download de um documento pelo identificador, permitido somente ao usuário proprietário.
- Interface web para upload, listagem e download.
- Tratamento consistente de erros de entrada, arquivo inexistente e falhas de persistência.

### Fora do escopo

- Autenticação, autorização integrada a provedor de identidade ou gestão de contas.
- Armazenamento externo ou em nuvem.
- Persistência de metadados em banco de dados.
- Versionamento, edição, exclusão e compartilhamento de documentos.
- Pré-visualização de conteúdo e busca avançada.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve aceitar o upload de um arquivo por requisição, recebido como `multipart/form-data` no campo `file`. |
| RF-02 | O sistema deve gravar o conteúdo do arquivo no diretório local `backend/storage`, usando Multer com `diskStorage`. |
| RF-03 | Após um upload válido, o sistema deve gerar um identificador único, registrar os metadados em memória e retornar os metadados criados. |
| RF-04 | O sistema deve associar cada documento ao identificador de usuário informado na requisição. |
| RF-05 | O usuário deve poder listar somente os documentos associados ao seu identificador. |
| RF-06 | A listagem deve apresentar os documentos do mais recente para o mais antigo. |
| RF-07 | O usuário deve poder baixar um documento pelo identificador, desde que seja seu proprietário. |
| RF-08 | O sistema deve retornar erro apropriado para requisições inválidas, ausência de arquivo, arquivo acima do limite, documento inexistente ou documento pertencente a outro usuário. |
| RF-09 | A interface deve permitir selecionar e enviar um arquivo, consultar a lista de documentos e iniciar o download de um item. |
| RF-10 | A interface deve apresentar estados de carregamento, sucesso e erro para as operações da API. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | O armazenamento dos arquivos deve ser local, em `backend/storage`, por meio de Multer `diskStorage`; provedores externos são proibidos. |
| RNF-02 | Os metadados devem permanecer em memória nesta fase e, portanto, não sobreviverão à reinicialização do processo. |
| RNF-03 | A aplicação deve obter configurações operacionais de variáveis de ambiente, incluindo `PORT` e `UPLOAD_MAX_FILE_SIZE_BYTES`. |
| RNF-04 | O limite inicial de upload deve ser 10 MiB (10.485.760 bytes), configurável por ambiente e aplicado pelo Multer. |
| RNF-05 | O caminho físico e o nome interno do arquivo devem ser gerados pela aplicação; o nome original nunca deve ser usado para compor o caminho de gravação. |
| RNF-06 | O backend deve usar Node.js, Express e JavaScript CommonJS; os testes devem usar `node:test`. |
| RNF-07 | O frontend deve usar React, Vite, JavaScript ESM e `fetch`, conforme as dependências já presentes. |
| RNF-08 | O código deve manter responsabilidades separadas nas camadas routes, controllers, services e repositories. |
| RNF-09 | Erros inesperados não devem expor caminhos locais, stack traces ou detalhes internos ao cliente. |

## 5. Modelo de dados

### Metadados públicos do documento

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string | Sim | Identificador único, gerado pela aplicação (UUID). |
| `originalName` | string | Sim | Nome original informado pelo cliente, tratado como dado e não como caminho. |
| `size` | number | Sim | Tamanho do conteúdo em bytes. |
| `uploadedAt` | string | Sim | Data e hora de criação em formato ISO 8601 UTC. |
| `owner` | string | Sim | Identificador do usuário associado ao documento. |

### Dados internos de persistência

O repositório mantém, além dos metadados públicos, a referência ao nome/caminho interno gerado para localizar o arquivo em `backend/storage`. Essa referência não deve ser exposta nos contratos da API. Os metadados ficam em uma estrutura em memória indexada por `id`. Se o processo reiniciar, os metadados serão perdidos; arquivos locais remanescentes podem ficar órfãos e não fazem parte da listagem.

### Identificação do usuário nesta fase

As operações recebem o identificador pelo header `X-User-Id`. Esse mecanismo serve apenas para separar dados no protótipo: não autentica o solicitante e pode ser falsificado. Não deve ser apresentado como controle de segurança em produção. A inclusão de autenticação está fora do escopo desta especificação.

## 6. Contratos de API

As rotas do backend são montadas sem o prefixo `/api`. O frontend chama `/api/...`; o proxy do Vite remove `/api` e encaminha a chamada ao backend local.

### Formato de erro

As respostas de erro usam JSON no formato:

```json
{
  "error": {
    "code": "FILE_REQUIRED",
    "message": "Envie um arquivo no campo file."
  }
}
```

`code` é estável para tratamento pelo cliente; `message` é legível e pode ser exibida pela interface. Erros internos devem retornar mensagem genérica.

### `POST /upload` (cliente: `/api/upload`)

- Header obrigatório: `X-User-Id: <identificador>`.
- Corpo: `multipart/form-data`, com exatamente um arquivo no campo `file`.
- Limite: valor de `UPLOAD_MAX_FILE_SIZE_BYTES`, inicialmente 10 MiB.
- Sucesso: `201 Created`, com `Content-Type: application/json`.

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-10-06T12:00:00.000Z",
  "owner": "usuario-123"
}
```

- Erros: `400 USER_ID_REQUIRED` ou `FILE_REQUIRED`; `413 FILE_TOO_LARGE`; `500 STORAGE_ERROR` para falha de gravação.

### `GET /documents` (cliente: `/api/documents`)

- Header obrigatório: `X-User-Id: <identificador>`.
- Sucesso: `200 OK`, com array JSON dos documentos do usuário, em ordem decrescente de `uploadedAt`. Sem documentos, retornar array vazio.

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "originalName": "relatorio.pdf",
    "size": 24576,
    "uploadedAt": "2026-10-06T12:00:00.000Z",
    "owner": "usuario-123"
  }
]
```

- Erro: `400 USER_ID_REQUIRED` se o header estiver ausente ou vazio.

### `GET /documents/:id/download` (cliente: `/api/documents/:id/download`)

- Header obrigatório: `X-User-Id: <identificador>`.
- Sucesso: `200 OK`, conteúdo binário, `Content-Disposition: attachment` e nome de download baseado no nome original sanitizado.
- Erros: `400 USER_ID_REQUIRED`; `404 DOCUMENT_NOT_FOUND` quando o ID não existir ou não pertencer ao usuário; `500 STORAGE_ERROR` em falha de leitura.
- Não retornar ao cliente o caminho local do arquivo.

### Códigos HTTP

| Status | Uso |
| --- | --- |
| `200` | Listagem ou download concluído. |
| `201` | Upload concluído. |
| `400` | Header obrigatório ausente, campo de arquivo ausente ou entrada inválida. |
| `404` | Documento inexistente ou não pertencente ao usuário. |
| `413` | Arquivo excede o limite configurado. |
| `500` | Falha inesperada de leitura ou gravação. |

## 7. Decisões arquiteturais

### Backend

Fluxo de dependência: `routes -> controllers -> services -> repositories`.

| Camada | Responsabilidade |
| --- | --- |
| `routes/` | Declarar endpoints, aplicar middleware de upload e encaminhar chamadas aos controllers. |
| `controllers/` | Ler parâmetros, headers e arquivo recebido; validar a entrada HTTP; chamar services; definir status, headers e corpo da resposta. |
| `services/` | Aplicar regras de negócio: associar proprietário, registrar metadados, filtrar listagem e verificar propriedade antes do download. |
| `repositories/` | Persistir arquivos localmente e metadados em memória; localizar metadados e arquivos para leitura. |

Multer deve usar `diskStorage` no diretório local definido para o sistema. O middleware limita tamanho e quantidade de arquivos. A configuração do armazenamento fica na borda HTTP; as regras de negócio não devem depender de objetos Express ou Multer. Falhas devem ser convertidas em erros tratados pelo controller/handler HTTP.

### Frontend

- Componentes funcionais React organizados em `components/`, `pages/` e `services/`.
- O serviço de API usa `fetch` com o prefixo `/api` e envia `X-User-Id` nas operações.
- Upload usa `FormData`; o navegador define o `Content-Type` multipart com seu boundary.
- A interface exibe nome, tamanho e data de upload, além de ações de envio e download.
- Erros e estados vazios devem ser comunicados sem expor detalhes internos do backend.

### Configuração inicial

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP do backend. |
| `UPLOAD_MAX_FILE_SIZE_BYTES` | `10485760` | Limite máximo de tamanho por arquivo. |

O diretório de armazenamento permanece `backend/storage`, relativo à aplicação, sem configuração de provedor remoto.

## 8. Plano de execução

Etapas futuras de desenvolvimento. A criação desta especificação não implementa nem modifica arquivos de backend ou frontend.

1. Revisar e aprovar os requisitos, a identificação provisória do usuário, o limite de upload e os contratos HTTP.
2. Implementar o fluxo backend de upload local, metadados em memória, listagem por proprietário e download com verificação de propriedade, mantendo as quatro camadas definidas.
3. Construir a interface React para upload, listagem e download, consumindo a API via `fetch` e o proxy `/api` do Vite.
4. Validar os contratos e cenários de erro com testes backend usando `node:test` e testes manuais do fluxo integrado.
5. Documentar limitações conhecidas, em especial a perda de metadados após reinicialização e a ausência de autenticação real.

## 9. Critérios de aceite

- Um usuário consegue enviar um arquivo dentro do limite e recebe os metadados definidos.
- A listagem apresenta somente documentos associados ao identificador informado e ordena do mais recente para o mais antigo.
- O download retorna o conteúdo como anexo somente ao proprietário; IDs inexistentes e de outro usuário não revelam o caminho local.
- Ausência de arquivo, identificador de usuário ausente, limite excedido e falhas de armazenamento resultam nos códigos HTTP e formatos de erro especificados.
- Nenhum arquivo é enviado a serviço externo; arquivos são gravados localmente com Multer `diskStorage`.
- As etapas do plano são futuras e não implicam execução de código de backend ou frontend ao produzir esta especificação.
