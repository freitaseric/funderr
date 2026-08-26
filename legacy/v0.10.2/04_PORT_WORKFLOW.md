# Prompt 04 — workflow técnico e financeiro

Migre nesta ordem:

1. Patrimônio;
2. Identificação;
3. Fluxo de caixa;
4. Linhas de crédito;
5. Financiamento.

Antes de UI, extraia e teste regras puras TypeScript.

Implemente a cadeia de revisão:

Patrimônio → Identificação → Fluxo → Financiamento.

Uma etapa posterior concluída deve ficar efetivamente `EM_REVISAO` quando sua dependência anterior mudar ou deixar de estar completa.

O cálculo definitivo de financiamento deve ocorrer server-side.

Crie testes de regressão para:

- patrimônio;
- sete anos do fluxo;
- PAGAR;
- CAPITALIZAR;
- limites da linha;
- capacidade insuficiente;
- revisão em cascata.
