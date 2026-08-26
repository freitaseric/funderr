# Plano de migração

## Fase A — baseline

- preservar `legacy/v0.10.2`;
- criar tag Git `legacy-v0.10.2`;
- snapshot/export da planilha original;
- registrar contagem de linhas por aba.

## Fase B — scaffold

- React + TypeScript;
- GovBR-DS React;
- router;
- layout;
- testes;
- Firebase integrado;
- Auth;
- skeleton das rotas.

## Fase C — entidades base

1. Beneficiários
2. Referências
3. Propriedades
4. Maps
5. Processos

Paridade primeiro; melhorias depois.

## Fase D — workflow

1. Patrimônio
2. Identificação
3. Fluxo de caixa
4. Linhas de crédito
5. Financiamento

Implementar o mecanismo de invalidação/revisão antes de marcar qualquer etapa como pronta.

## Fase E — novos recursos

- Documentos/Storage;
- auditoria;
- administração de usuários;
- administração de linhas de crédito;
- dashboard;
- notificações internas, se necessário.

## Fase F — migração de dados

Entrada necessária:

- XLSX da planilha inteira; ou
- CSV por aba; ou
- acesso/export controlado do Google Sheets.

Criar migrador com:

- dry-run;
- validação;
- preservação de IDs;
- relatório de erros;
- contagem origem/destino;
- idempotência;
- checkpoints;
- log de mapeamento.

Não migrar dados reais pelo browser.

## Fase G — homologação

Executar checklist `08_ACCEPTANCE_CHECKLIST.md`.

Comparar v0.10.2 e v1 em paralelo com dados de teste.

## Fase H — corte

- congelar escrita no legado;
- executar última migração incremental;
- validar contagens/totais;
- abrir v1;
- manter legado somente leitura por período definido;
- registrar rollback plan.
