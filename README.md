# FUNDERR — pacote de migração para Google AI Studio + Firebase

Este repositório foi preparado a partir do **FUNDERR v0.10.2**, exportado do Google Apps Script.

## Objetivo

Transformar o sistema legado em uma aplicação web moderna, full-stack e versionada, mantendo **paridade funcional** com a v0.10.2 e adicionando uma fundação Firebase apropriada para produção.

### Destino arquitetural

- React 19 + TypeScript
- Google AI Studio Build mode como ambiente de construção assistida
- Firebase Authentication
- Cloud Firestore
- Cloud Storage
- Firebase App Check
- Firebase Analytics e Performance Monitoring
- Firebase AI Logic/Gemini preparado para funcionalidades assistivas
- Runtime Node.js server-side para regras autoritativas, cálculos e operações privilegiadas
- GovBR-DS React
- Google Maps
- Deploy pelo fluxo do Google AI Studio/Google Cloud
- GitHub como fonte de verdade do código

## Regra principal

**Não apagar, editar ou “modernizar” a pasta `legacy/v0.10.2`.**

Ela é a especificação executável do comportamento existente.

## Desenvolvimento local

1. Copie `.env.example` para `.env.local` e preencha a configuração pública do app Web Firebase.
2. Defina `FIREBASE_PROJECT_ID` e `FUNDERR_BOOTSTRAP_EMAIL`.
3. Autentique o backend sem chave permanente com `gcloud auth application-default login`.
4. Execute `bun run dev`.

O acesso ao FUNDERR é feito exclusivamente por Conta Google. No primeiro acesso, usuários ainda não aprovados são cadastrados como `PENDING`; um administrador atribui o papel e ativa a conta em Configurações. A senha Google nunca é recebida pelo FUNDERR.

A configuração versionada de provedores está em `firebase.json`. Para publicá-la no projeto associado em `.firebaserc`, use `bunx firebase-tools deploy --only auth`.

## Como usar no Google AI Studio

1. Crie um repositório GitHub novo para este conteúdo.
2. Faça upload/commit deste pacote.
3. Abra Google AI Studio > Build.
4. No campo de prompt, use **Add files (+) > Import from GitHub** e selecione o repositório.
5. Cole o conteúdo de `AI_STUDIO_MASTER_PROMPT.md`.
6. Antes de habilitar Firebase, leia `docs/04_TARGET_ARCHITECTURE.md` e `docs/06_SECURITY_MODEL.md`.
7. Ao aparecer a integração Firebase, escolha um projeto novo/vazio e a localização **São Paulo (`southamerica-east1`)**, salvo restrição institucional em contrário.
8. O prompt mestre executará primeiro a auditoria (`prompts/01_ANALYZE.md`). Depois, execute `prompts/02_BOOTSTRAP_FIREBASE.md` em diante, uma fase por vez.

## O que este ZIP contém

- fonte original v0.10.2 preservada;
- inventário funcional e de dados;
- regras de negócio críticas;
- modelo Firestore recomendado;
- arquitetura e segurança;
- plano de migração;
- checklist de aceitação;
- prompts sequenciais para o agente do AI Studio;
- manifestos JSON de schema e API legado.

## O que NÃO está neste ZIP

A exportação recebida contém **somente o código do Apps Script**. Os dados reais da planilha não vieram junto.

Portanto, este pacote ainda não contém:

- beneficiários reais;
- propriedades reais;
- processos/propostas reais;
- itens patrimoniais;
- fluxos de caixa;
- financiamentos;
- garantias;
- linhas de crédito cadastradas na planilha.

Esses registros devem ser migrados em uma etapa separada a partir de XLSX/CSV/Google Sheets.

## Versionamento sugerido

- `legacy-v0.10.2`: último baseline Apps Script
- `v1.0.0-alpha.1`: primeiro scaffold Firebase
- `v1.0.0-beta.1`: paridade funcional completa
- `v1.0.0`: produção
