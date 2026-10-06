---
name: validar-integracao-dms
description: "Valida upload, listagem e download do DMS através do proxy /api, usando o agente integration-validator."
argument-hint: "URL local do frontend e prefixo do usuário temporário"
agent: integration-validator
---

# Validar integração do DMS

Execute a validação definida pelo agente para conferir a aderência à
[especificação](../../docs/specs/dms-spec.md), sem modificar código ou testes.

- URL do frontend: `${input:url:URL local do frontend; padrão http://localhost:5173}`.
- Prefixo do usuário temporário: `${input:usuario:Prefixo do usuário; padrão validacao-dms}`.

Use os padrões se os valores forem omitidos e acrescente um UUID ao prefixo.
Confira testes backend, build frontend e o fluxo upload/listagem/download pelo
cliente real via `/api`. Respeite as regras de isolamento e limpeza do agente;
não reutilize um backend compartilhado para upload sem a autorização prevista.

Retorne o relatório de checks e evidências, incluindo verificações bloqueadas,
limpeza dos arquivos temporários e limitações de validação visual.