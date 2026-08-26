# Arquitetura alvo

## Decisão

A v1 será um web app React/TypeScript construído no Google AI Studio e conectado a um projeto Firebase dedicado.

### Região recomendada

` southamerica-east1 ` — São Paulo.

Motivos:

- usuários e operação no Brasil;
- Firestore disponível em São Paulo;
- Cloud Functions/serviços Google compatíveis;
- menor latência regional esperada;
- Firebase AI Logic também possui suporte em São Paulo.

A região deve ser escolhida conscientemente na primeira integração, pois é difícil/impossível alterar vários recursos depois.

## Camadas

### Cliente React

Responsável por:

- UI GovBR-DS;
- rotas;
- forms;
- validação imediata de UX;
- listeners Firestore quando apropriado;
- upload controlado;
- previews de cálculos;
- feedback de sincronização.

### Domínio compartilhado

Funções puras TypeScript:

- CPF/normalizações;
- completude;
- patrimônio;
- fluxo de caixa;
- financiamento;
- estados;
- regras de revisão.

Essas funções devem ter testes unitários.

### Servidor Node

Responsável por operações autoritativas:

- criação do número sequencial do processo;
- mudanças de estado;
- conclusão/reabertura;
- validações críticas;
- cálculo definitivo do financiamento;
- escrita de auditoria;
- permissões privilegiadas;
- rotinas administrativas;
- futura integração segura com Gemini/APIs.

Nunca confiar em valores derivados enviados pelo cliente.

### Firebase

- Authentication: identidade;
- Firestore: dados transacionais;
- Storage: documentos;
- App Check: reduzir abuso de clientes não autorizados;
- Analytics: uso sem PII;
- Performance: observabilidade;
- AI Logic: recursos assistivos posteriores.

## Estrutura React sugerida

```text
src/
  app/
    router/
    providers/
    layout/
  components/
    govbr/
    feedback/
    forms/
  features/
    auth/
    beneficiaries/
    properties/
    proposals/
    patrimony/
    identification/
    cash-flow/
    financing/
    documents/
    administration/
  domain/
    beneficiary/
    property/
    proposal/
    patrimony/
    identification/
    cash-flow/
    financing/
  lib/
    firebase/
    maps/
    analytics/
  server/
    authz/
    audit/
    proposals/
    financing/
  types/
  test/
```

A estrutura final pode variar conforme as convenções do Google AI Studio, mas a separação de domínio deve ser preservada.

## Deploy

Para a primeira v1, priorize o fluxo suportado diretamente pelo Google AI Studio:

- app full-stack;
- Firebase integrado;
- publicação no mesmo projeto Google Cloud;
- Cloud Run para runtime full-stack.

Não introduza Next.js/SSR sem necessidade. O FUNDERR é um sistema autenticado e não depende de SEO.

## GitHub

GitHub deve ser a fonte de verdade:

- AI Studio importa o repositório;
- AI Studio pode push/pull;
- commits pequenos por módulo;
- legacy preservado;
- tags para milestones.
