# Resumo executivo

## O que é o legado

O FUNDERR v0.10.2 é um web app Google Apps Script vinculado a Google Sheets.

A exportação analisada contém:

- 34 arquivos;
- ~32 mil linhas;
- 15 abas/tabelas lógicas;
- 131 funções server-side;
- 31 funções públicas chamadas pelo cliente;
- 7 views principais;
- integração Google Maps;
- camada de compatibilidade GovBR-DS;
- regras financeiras e de progressão entre etapas.

## Navegação atual

Menu principal:

1. Processos
2. Beneficiários
3. Propriedades

Dentro de um processo:

1. Dados gerais
2. Beneficiário
3. Propriedade
4. Levantamento patrimonial
5. Identificação da proposta
6. Fluxo de caixa
7. Financiamento
8. Documentos

A etapa **Documentos** existe visualmente, mas não possui implementação funcional no legado.

## Dependência crítica

A aplicação não é um conjunto de formulários independentes.

Existe uma cadeia:

**Patrimônio → Identificação → Fluxo de Caixa → Financiamento**

Cada etapa concluída guarda o timestamp da etapa anterior que foi revisada. Se a anterior for alterada depois disso, a etapa posterior passa efetivamente para `EM_REVISAO`.

Isso deve ser mantido na v1.

## Melhorias obrigatórias da v1

- autenticação real;
- RBAC;
- Firestore;
- Storage e documentos;
- auditoria;
- Security Rules;
- App Check;
- observabilidade;
- testes de domínio;
- versionamento Git;
- separação entre regras determinísticas e IA;
- eliminação de segredos no HTML;
- tratamento adequado de concorrência;
- deploy reproduzível.
