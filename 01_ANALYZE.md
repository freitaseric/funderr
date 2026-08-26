# Prompt 01 — auditoria antes da implementação

Leia `legacy/v0.10.2`, `docs/` e `migration/` integralmente.

Não altere código ainda.

Produza uma análise em `docs/AI_STUDIO_AUDIT.md` contendo:

1. inventário de funcionalidades;
2. regras que você encontrou e que não estão documentadas;
3. divergências entre docs e código;
4. mapa de chamadas cliente → servidor;
5. dependências entre módulos;
6. pontos de concorrência;
7. riscos de segurança;
8. campos/tipos do legado;
9. proposta final de collections;
10. plano de implementação em commits pequenos.

Destaque qualquer comportamento que seria perdido por uma conversão ingênua para Firestore.

Ao terminar, não inicie a implementação automaticamente.
