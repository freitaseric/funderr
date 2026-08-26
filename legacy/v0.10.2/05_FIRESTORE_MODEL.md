# Modelo Firestore recomendado

## Princípios

1. IDs legados devem ser preservados na migração.
2. Beneficiário e propriedade são entidades reutilizáveis, portanto top-level.
3. Seções específicas do processo ficam sob o processo.
4. Itens repetíveis ficam em subcollections.
5. Campos derivados importantes podem ter snapshots, mas a fonte deve ser clara.
6. Não duplicar CPF/dados pessoais em toda proposta sem necessidade.
7. Usar `serverTimestamp()` para auditoria temporal.
8. Acrescentar `schemaVersion`.

## Coleções

### users/{uid}

```ts
{
  displayName,
  email,
  role: 'ADMIN' | 'GESTOR' | 'TECNICO' | 'CONSULTA',
  active,
  createdAt,
  updatedAt
}
```

Usuário novo deve começar sem privilégio operacional até autorização.

### beneficiaries/{id}

Campos do legado em camelCase +:

```ts
{
  createdAt,
  createdBy,
  updatedAt,
  updatedBy,
  schemaVersion: 1
}
```

### beneficiaries/{id}/references/{referenceId}

Referências pessoais.

### properties/{id}

Referência:

`beneficiaryId`

Manter coordenadas como números. Considerar `GeoPoint` além dos campos numéricos, se útil para consultas geoespaciais futuras.

### proposals/{id}

```ts
{
  number,
  beneficiaryId,
  propertyId,
  proposalDate,
  activity,
  status: 'EM_ELABORACAO' | ...,
  progressSummary: { ... },
  createdAt,
  createdBy,
  updatedAt,
  updatedBy,
  schemaVersion
}
```

### proposals/{id}/sections/patrimony

```ts
{
  status,
  debtsConfirmed,
  completedAt,
  updatedAt,
  updatedBy
}
```

### proposals/{id}/patrimonyItems/{itemId}

Itens patrimoniais.

### proposals/{id}/patrimonyDebts/{debtId}

Dívidas.

### proposals/{id}/sections/identification

Inclui:

- finalidade;
- mercado;
- faturamento;
- análise localização;
- considerações;
- flags de confirmação;
- `patrimonyReviewedAt`;
- status/timestamps.

### proposals/{id}/jobs/{jobId}

Empregos.

### proposals/{id}/usesSources/{itemId}

`type: USO | FONTE`.

### proposals/{id}/sections/cashFlow

- status;
- projectionConfirmed;
- `identificationReviewedAt`;
- timestamps.

### proposals/{id}/cashFlowItems/{itemId}

- tipo;
- descrição;
- unidade;
- quantidade;
- valor unitário;
- `years: [number, number, number, number, number, number, number]`.

Migrar as sete colunas `ano_1...ano_7` para array somente se os relatórios/queries não precisarem filtrar individualmente por ano. Caso contrário, manter campos explícitos.

### creditLines/{id}

Configuração administrativa.

Alterações em linhas de crédito não devem reescrever silenciosamente financiamentos históricos; o financiamento deve manter snapshot das condições usadas.

### proposals/{id}/sections/financing

Snapshot:

- linha;
- valores;
- percentuais;
- taxa;
- prazos;
- carência;
- tratamento juros;
- confirmações;
- `cashFlowReviewedAt`;
- status/timestamps.

### proposals/{id}/guarantees/{id}

Garantias.

### proposals/{id}/documents/{id}

```ts
{
  category,
  originalName,
  storagePath,
  contentType,
  size,
  uploadedAt,
  uploadedBy,
  status
}
```

### auditLogs/{eventId}

```ts
{
  actorUid,
  action,
  entityType,
  entityId,
  proposalId?,
  occurredAt,
  metadata
}
```

Somente servidor pode criar; cliente não pode atualizar/excluir.

## Contadores

Para gerar `AAAA-NNNN` de forma segura, usar documento de contador transacional, por exemplo:

`counters/proposals-2026`

com transaction no servidor.

Não usar “buscar maior número + 1” sem transação.
