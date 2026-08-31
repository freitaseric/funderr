# FUNDERR Backend

API autoritativa do FUNDERR em Fastify 5, TypeScript e Bun. O backend valida tokens do Firebase Authentication, aplica os papéis `ADMIN`, `GESTOR`, `TECNICO` e `CONSULTA`, executa as regras de negócio e persiste dados no Cloud Firestore e arquivos no Cloud Storage.

## Desenvolvimento

```bash
cp .env.example .env.local
bun install
bun run dev
```

Para executar sem credenciais Firebase, use `FUNDERR_DATA_BACKEND=memory` apenas localmente. A API fica em `http://localhost:3001`; o health check público é `GET /api/health`.

## Verificação

```bash
bun run typecheck
bun test
bun run build
```

## Firebase

Use Application Default Credentials localmente ou defina `FIREBASE_SERVICE_ACCOUNT_JSON` como segredo no provedor. As regras, índices, Remote Config e configuração do provedor Google estão nesta pasta.

```bash
bun run firebase:emulators
bun run firebase:deploy
```

O Admin SDK não usa as regras do cliente; a conta de serviço deve receber somente as permissões IAM necessárias. Nunca envie `FIREBASE_SERVICE_ACCOUNT_JSON` ao frontend.

## Railway

O projeto inclui `Dockerfile` e `railway.json`. Crie um serviço Railway apontando esta pasta como Root Directory, configure as variáveis de `.env.example` e gere um domínio público. Não defina `PORT`: a Railway fornece esse valor.

Configure `FRONTEND_ORIGINS` com os domínios exatos da Vercel e use `/api/health` como health check. Como o estado é carregado do Firestore na inicialização, mantenha uma única réplica até que a camada de persistência seja convertida para operações Firestore transacionais por requisição.

## Importação do JSON legado

```bash
bun run migrate:firestore
bun run migrate:firestore --execute
```

O primeiro comando somente valida e contabiliza; `--execute` grava de forma idempotente.
