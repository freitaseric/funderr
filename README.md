# FUNDERR

Migração do FUNDERR v0.10.2 para dois sistemas independentes, ambos gerenciados com Bun:

- [`funderr-frontend`](./funderr-frontend): React 19, Vite e TanStack Router, preparado para Vercel;
- [`funderr-backend`](./funderr-backend): Fastify 5 e Bun, preparado para Railway via Docker;
- [`legacy/v0.10.2`](./legacy/v0.10.2): baseline imutável do Google Apps Script usado para conferir a paridade funcional.

Firebase Authentication, Cloud Firestore, Cloud Storage, regras, índices e Remote Config foram mantidos. O frontend só recebe configuração pública `VITE_*`; credenciais administrativas permanecem no backend.

## Instalação

Cada aplicação tem seu próprio `package.json`, `bun.lock`, `.env.example` e README, podendo virar um repositório separado sem depender da raiz.

```bash
cd funderr-backend
cp .env.example .env.local
bun install

cd ../funderr-frontend
cp .env.example .env.local
bun install
```

Inicie cada projeto em um terminal:

```bash
bun run dev:backend
bun run dev:frontend
```

O frontend abre em `http://localhost:5173`; a API, em `http://localhost:3001`.

## Verificação conjunta

```bash
bun run typecheck
bun test
bun run build
```

## Deploy

### Frontend — Vercel

Crie o projeto com Root Directory `funderr-frontend`. O manifesto usa Bun para instalar e compilar e mantém deep links do TanStack Router funcionando.

Defina as variáveis `VITE_FIREBASE_*` e `VITE_API_URL=https://SEU-BACKEND`. Adicione todos os domínios da Vercel usados em produção/preview no Firebase Authentication.

### Backend — Railway

Crie o serviço com Root Directory `funderr-backend`. Railway detectará o `Dockerfile`; o `railway.json` configura `/api/health`. Defina:

- `FIREBASE_PROJECT_ID`;
- `FIREBASE_STORAGE_BUCKET`;
- `FIREBASE_SERVICE_ACCOUNT_JSON` como segredo;
- `FUNDERR_BOOTSTRAP_EMAIL`;
- `FRONTEND_ORIGINS`, com os domínios exatos da Vercel separados por vírgula.

O processo lê a variável `PORT` fornecida pela Railway e escuta em `0.0.0.0`. Mantenha uma única réplica enquanto a persistência usar o snapshot em memória sincronizado com Firestore.

## Observação sobre dados

O JSON incluído é apenas uma base de demonstração. Dados reais da planilha original não vieram com a exportação e ainda exigem uma importação separada a partir de XLSX, CSV ou Google Sheets.
