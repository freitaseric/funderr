# Prompt mestre — FUNDERR v1

Você está recebendo o código-fonte completo do **FUNDERR v0.10.2**, atualmente implementado em Google Apps Script + Google Sheets + HTML/CSS/JavaScript.

Sua missão é transformar este repositório em **FUNDERR v1**, uma aplicação web full-stack moderna usando **React + TypeScript + Firebase**, sem perder nenhuma regra de negócio existente.

## 1. Fonte de verdade

A pasta `legacy/v0.10.2` é SOMENTE LEITURA.

- Não altere.
- Não exclua.
- Não mova.
- Não reescreva arquivos dentro dela.
- Use-a como especificação executável da aplicação antiga.

Leia também todos os arquivos em `docs/` e `migration/` antes de implementar.

## 2. Não faça um simples “port”

Não converta o Apps Script linha por linha.

Reconstrua a aplicação usando arquitetura moderna, mas preserve:

- todas as funcionalidades existentes;
- os campos existentes;
- validações;
- cálculos;
- regras de completude;
- relações entre beneficiário, propriedade e processo;
- progresso das etapas;
- status;
- dependências entre etapas;
- lógica de revisão quando dados anteriores mudam;
- cálculos patrimoniais;
- fluxo de caixa de sete anos;
- cronograma de financiamento e capacidade de pagamento;
- linhas de crédito;
- garantias;
- integração com Google Maps;
- GovBR-DS e acessibilidade.

## 3. Stack alvo

Use:

- React 19;
- TypeScript estrito;
- uma SPA moderna;
- Firebase Authentication;
- Cloud Firestore;
- Cloud Storage;
- Firebase App Check;
- Firebase Analytics;
- Firebase Performance Monitoring;
- Firebase AI Logic preparado, mas sem colocar IA em cálculos determinísticos;
- runtime Node.js server-side do Google AI Studio para operações privilegiadas;
- Firebase Admin SDK no servidor quando necessário;
- GovBR-DS via wrapper React oficial `@govbr-ds/webcomponents-react`;
- Google Maps com chave protegida/restrita adequadamente.

Organize a aplicação por domínio/feature, não por “arquivo de tela gigante”.

## 4. Localização

Ao habilitar Firebase, use preferencialmente:

`southamerica-east1` — São Paulo

NÃO escolha uma localização automaticamente sem mostrar qual será usada.

A localização inicial do Firebase/Google Cloud é uma decisão difícil de reverter.

## 5. Firebase

Quando eu autorizar a integração Firebase:

1. conecte um projeto Firebase novo/vazio;
2. configure Firebase Authentication;
3. configure Cloud Firestore;
4. gere `/src/lib/firebase.ts`;
5. crie regras iniciais de segurança;
6. mantenha o acesso fechado por padrão;
7. não use regras permissivas do tipo `allow read, write: if true`;
8. prepare Cloud Storage para documentos;
9. mantenha segredos server-side fora do bundle cliente.

## 6. Autenticação e autorização

A v0.10.2 era um web app Apps Script com acesso `MYSELF`; a v1 terá usuários reais.

Implemente:

- login com Google;
- documento `users/{uid}`;
- perfis iniciais: `ADMIN`, `GESTOR`, `TECNICO`, `CONSULTA`;
- usuário novo sem acesso operacional até ser autorizado;
- guards de rota;
- validação server-side de permissão para operações privilegiadas;
- Security Rules consistentes com os papéis.

Não confie em role enviada pelo cliente.

## 7. Modelo de dados

Use `docs/05_FIRESTORE_MODEL.md` e `migration/firestore-mapping.json` como referência.

Preserve os IDs legados durante a migração dos dados.

Use timestamps do servidor e acrescente:

- `createdBy`;
- `updatedBy`;
- `schemaVersion`;
- `legacyId` quando necessário.

Não duplique dados pessoais desnecessariamente em documentos de proposta.

## 8. Workflow obrigatório

A ordem funcional é:

Dados gerais
→ Beneficiário
→ Propriedade
→ Levantamento patrimonial
→ Identificação da proposta
→ Fluxo de caixa
→ Financiamento
→ Documentos

Os módulos possuem estados:

- `PENDENTE`
- `RASCUNHO`
- `EM_REVISAO`
- `CONCLUIDO`

Regra crítica:

**se uma etapa concluída depender de uma etapa anterior que mudou depois da sua última revisão, a etapa posterior precisa voltar efetivamente para `EM_REVISAO`.**

Não reduza esta regra a um simples booleano de “completo”.

## 9. Operações autoritativas

Não confie no browser para:

- concluir etapas;
- recalcular financiamento definitivo;
- validar linha de crédito;
- gerar número sequencial de processo;
- aplicar permissões;
- escrever auditoria;
- mudar estados finais.

O cliente pode calcular previews para UX, mas o servidor deve recalcular/validar antes de persistir.

## 10. Novo módulo Documentos

Na v0.10.2, “Documentos” já aparece na barra de progresso, mas está permanentemente pendente.

Na v1 implemente esse módulo de verdade:

- upload para Cloud Storage;
- metadados no Firestore;
- tipo/categoria do documento;
- nome original;
- tamanho;
- MIME type;
- autor;
- timestamps;
- vínculo com processo;
- remoção controlada;
- visualização/download autorizado;
- regras de Storage;
- auditoria;
- estrutura preparada para futura extração assistida por Gemini.

Não envie documentos sigilosos para modelos de IA automaticamente.

## 11. Auditoria

Crie `auditLogs` para ações relevantes:

- login/autorização;
- criação/edição de beneficiário;
- criação/edição de propriedade;
- criação de processo;
- edição/conclusão/reabertura de cada etapa;
- upload/exclusão de documento;
- mudanças de linha de crédito e regras administrativas.

Logs de auditoria devem ser gerados pelo servidor e não editáveis pelo usuário comum.

## 12. Código e testes

Crie testes para regras de domínio antes de considerar uma feature migrada.

Prioridades:

1. validações de CPF e dados;
2. completude;
3. patrimônio;
4. usos/fontes;
5. fluxo de caixa;
6. financiamento;
7. status/revisão;
8. autorização.

Extraia funções matemáticas e regras puras para módulos testáveis, sem dependência do Firebase.

## 13. UX

Preserve a lógica da v0.10.2, mas melhore:

- responsividade;
- loading/skeletons;
- tratamento de erros;
- autosave apenas onde seguro;
- confirmação de alterações não salvas;
- acessibilidade;
- navegação por rotas reais;
- estados vazios;
- busca/filtros;
- feedback de sincronização;
- proteção contra double-submit.

Use GovBR-DS como fonte visual principal. Remova a camada de “proxy DOM” usada no legado; em React use os componentes oficiais diretamente.

## 14. Execução desta primeira rodada

Agora execute **somente** a fase descrita em `prompts/01_ANALYZE.md`.

Nesta primeira rodada:

1. leia TODO o legado;
2. leia TODO `docs/` e `migration/`;
3. produza a auditoria técnica solicitada;
4. identifique divergências entre documentação e código;
5. valide ou proponha correções para o modelo Firestore;
6. NÃO crie o scaffold ainda;
7. NÃO provisione Firebase ainda;
8. NÃO modifique `legacy/v0.10.2`;
9. NÃO migre dados;
10. NÃO implemente Gemini.

Ao final, mostre:

- principais descobertas;
- riscos;
- divergências encontradas;
- modelo de dados recomendado;
- plano de commits;
- confirmação de que nenhum arquivo legado foi modificado.

Pare após a auditoria. A implementação começará somente no Prompt 02.
