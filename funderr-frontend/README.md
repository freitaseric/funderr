# FUNDERR Frontend

SPA do FUNDERR em React 19, Vite, TanStack Router e Bun. A autenticação continua no Firebase Authentication com Conta Google; o ID token é enviado à API em cada requisição.

## Desenvolvimento

```bash
cp .env.example .env.local
bun install
bun run dev
```

Com `VITE_API_URL` vazio, o Vite encaminha `/api` para `VITE_API_PROXY_TARGET` (por padrão `http://127.0.0.1:3001`).

## Rotas

- `/`: painel;
- `/processos` e `/processos/:proposalId`;
- `/beneficiarios`;
- `/propriedades`;
- `/linhas-credito`;
- `/documentos`;
- `/auditoria`;
- `/configuracoes`.

## Verificação

```bash
bun run typecheck
bun run build
bun run preview
```

## Vercel

Crie um projeto apontando esta pasta como Root Directory. O `vercel.json` força instalação e build com Bun e inclui o fallback de SPA necessário para abrir rotas diretamente.

Configure `VITE_API_URL` com a URL HTTPS pública do backend, sem `/api` no final, e todas as variáveis `VITE_FIREBASE_*`. Depois, adicione os domínios de produção e preview da Vercel aos domínios autorizados do Firebase Authentication e às `FRONTEND_ORIGINS` do backend.
