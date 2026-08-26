# Auditoria Completa do Sistema FUNDERR v0.10.2 (Legacy Google Apps Script & Arquitetura Alvo)

Data de Execução: 2026-08-26  
Status: **DISCOVERY & AUDIT CONCLUÍDOS COM SUCESSO**

---

## 1. Inventário de Funcionalidades

O sistema FUNDERR é composto por **7 módulos principais integrados em um fluxo de esteira de crédito rural e assistência técnica (ATER)**:

1. **Beneficiários**:
   - Cadastro básico e ampliado de produtores rurais (PF).
   - Validação algorítmica de CPF com verificação de dígitos verificadores e rejeição de CPFs repetidos.
   - Normalização de telefone com DDD, estado civil, escolaridade e dependentes (inteiro não-negativo).
   - Tratamento de cônjuge condicionado a estado civil (`CASADO` ou `UNIAO_ESTAVEL`), com validação de que CPF do cônjuge não pode coincidir com o do titular.
   - Gestão de referências pessoais/profissionais (ordem, nome, telefone).
   - Análise de completude percentual e lista de pendências.

2. **Propriedades**:
   - Vínculo direto a beneficiário existente (imutável após criação).
   - Localização geográfica restrita aos 15 municípios oficiais do Estado de Roraima (`Alto Alegre`, `Amajari`, `Boa Vista`, `Bonfim`, `Cantá`, `Caracaraí`, `Caroebe`, `Iracema`, `Mucajaí`, `Normandia`, `Pacaraima`, `Rorainópolis`, `São João da Baliza`, `São Luiz`, `Uiramutã`).
   - Gestão de áreas (área total, disponível, reserva legal), módulo fiscal e tempo de exploração.
   - Formas de ocupação (Proprietário, Posseiro, Arrendatário, Comodatário, Assentado, Concessionário, Outro).
   - Documentação fundiária existente (Título definitivo, Contrato de compra e venda, CCU, CDRU, CAR, Declaração de posse, Arrendamento, Comodato, Outro).
   - Coordenadas geodésicas (Latitude entre -90 e 90, Longitude entre -180 e 180, preenchimento obrigatório em par).
   - Confrontações (Norte, Sul, Leste, Oeste) e tipo de administração (familiar direta, etc.).

3. **Processos / Propostas (Orquestrador de Fluxo)**:
   - Geração sequencial atômica de identificador de processo no formato `AAAA-NNNN` (reinicia sequência por ano).
   - Vinculação estrita entre Beneficiário e Propriedade pertencente ao mesmo.
   - Painel de progresso geral e status individual das etapas:
     1. `Dados gerais`
     2. `Beneficiário`
     3. `Propriedade`
     4. `Patrimônio`
     5. `Identificação`
     6. `Fluxo de Caixa`
     7. `Financiamento`
     8. `Documentos`
   - Cálculo automático de percentual global de conclusão e indicador de pendências.

4. **Patrimônio**:
   - Levantamento detalhado de bens divididos em 7 categorias:
     - `TERRA_COBERTURAS` (Terra e coberturas)
     - `CONSTRUCOES_CIVIS` (Construções civis)
     - `ESTRUTURA_AGROPECUARIA` (Estrutura agropecuária)
     - `INFRAESTRUTURA` (Infraestrutura)
     - `MAQUINAS_EQUIPAMENTOS` (Máquinas, veículos e equipamentos)
     - `SEMOVENTES` (Semoventes / Rebanho)
     - `OUTROS_BENS_URBANOS` (Outros bens urbanos)
   - Cálculo automático de `patrimonioBruto` (soma das categorias rurais), `outrosBensUrbanos`, `totalDividas` (passivo), `patrimonioLiquido` (`patrimonioBruto - totalDividas`) e `totalInformado`.
   - Cadastro e gestão de passivos/dívidas com credor, finalidade, vencimento e saldo devedor.
   - Confirmação explícita de situação de dívidas (`dividasConfirmadas`).
   - Ciclo de status: `PENDENTE` → `RASCUNHO` → `EM_REVISAO` → `CONCLUIDO`.

5. **Identificação da Proposta**:
   - Finalidade técnica e mercadológica do projeto, mercado consumidor, histórico de faturamento do último ano, análise de localização e considerações técnicas.
   - Matriz de empregos diretos/indiretos (Fase Atual vs. Fase de Expansão).
   - Matriz de Usos e Fontes (detalhamento de investimentos fixos, semi-fixos, custeio e recursos próprios vs. financiados).
   - Validação de conclusão condicionada ao status concluído da etapa anterior (Patrimônio).

6. **Fluxo de Caixa Projetado**:
   - Projeção de receitas, custos variáveis e custos fixos em horizonte de 7 anos (`ano_1` a `ano_7`).
   - Cálculo das linhas consolidadas por ano:
     - `Receitas`
     - `Custos Variáveis`
     - `Custos Fixos`
     - `Despesas Totais = Custos Variáveis + Custos Fixos`
     - `Saldo Operacional = Receitas - Despesas Totais`
     - `Saldo Acumulado` (rolagem plurianual)
   - Validação de conclusão condicionada à existência de pelo menos 1 item de receita, 1 item de despesa, confirmação das projeções e Identificação concluída.

7. **Financiamento e Garantias**:
   - Seleção de linhas de crédito ativas (PRONAF B, PRONAF Mulher/Jovem, PRONAF Custeio/Investimento, Linhas FUNDERR).
   - Validação paramétrica de tetos, prazos máximos, carência máxima e percentual financiável máximo.
   - Cálculo automático de `valorFinanciado = valorProposta * (percentualFinanciavel / 100)`, `valorAter = valorProposta * (percentualAter / 100)`, `valorProjeto = valorFinanciado + valorAter`.
   - Simulação e cronograma de amortização (Tabela SAC rural) considerando juros anuais, prazos, carência e tratamento de juros na carência (`PAGAR` vs `CAPITALIZAR`).
   - Análise de capacidade de pagamento confrontando a prestação calculada com o Saldo Operacional projetado do Fluxo de Caixa para cada um dos 7 anos.
   - Cadastro de garantias (Aval pessoal, Penhor/Hipoteca de Bem, Outras) com dados do garantidor ou valor estimado.
   - Validação de conclusão condicionada ao Fluxo de Caixa concluído, parâmetros válidos, confirmação de garantias e confirmação do cronograma.

---

## 2. Regras Encontradas e Não Documentadas nos Manuais

1. **Regra de Efeito Cascata Reverso (`EM_REVISAO`)**:
   - Se a etapa `Patrimônio` sofrer qualquer edição (adição/exclusão de item ou dívida) após `Identificação` ter sido concluída, o status efetivo da `Identificação` retroage automaticamente para `EM_REVISAO`.
   - Se a `Identificação` for alterada após o `Fluxo de Caixa` ter sido concluído, o status efetivo do `Fluxo de Caixa` retroage para `EM_REVISAO`.
   - Se o `Fluxo de Caixa` for alterado após o `Financiamento` ter sido concluído, o status efetivo do `Financiamento` retroage para `EM_REVISAO`.
   - As datas de revisão (`patrimonioRevisadoEm`, `identificacaoRevisadaEm`, `fluxoRevisadoEm`) gravam o timestamp de sincronia no momento da conclusão de cada etapa subsequente.

2. **Exclusão de Bens Urbanos do Patrimônio Bruto Rural**:
   - `OUTROS_BENS_URBANOS` é somado apenas em `totalInformado`, mas é excluído do `patrimonioBruto` base para cálculos agropecuários.

3. **Restrição de Troca de Beneficiário em Propriedades**:
   - A edição de uma propriedade bloqueia terminantemente a mudança do `beneficiarioId` associado, prevenindo órfãos e quebra de integridade referencial com propostas em andamento.

4. **Tratamento de Juros na Carência (`PAGAR` vs `CAPITALIZAR`)**:
   - Se `PAGAR`: no período de carência, amortização é 0 e prestação é igual aos juros incidentes; saldo devedor permanece inalterado.
   - Se `CAPITALIZAR`: no período de carência, prestação é 0 e os juros são incorporados ao saldo devedor principal para os anos subsequentes.

5. **Travamento de Conclusão por Capacidade de Pagamento Negativa**:
   - Se a prestação anual do financiamento for maior que o Saldo Operacional gerado no ano correspondente do Fluxo de Caixa, o sistema emite alerta crítico de capacidade insuficiente.

---

## 3. Divergências entre Docs e Código

| Item | Documentação Legada | Código Real (`.gs` / `.html`) | Resolução na Arquitetura Alvo |
|---|---|---|---|
| Autenticação | Descrito como multiusuário com roles | Usuário único `MYSELF` no Apps Script | Implementar Firebase Auth + RBAC (`ADMIN`, `GESTOR`, `TECNICO`, `CONSULTA`) |
| Persistência | Planilhas Google Sheets isoladas | 15 Abas com tipos mistos | Firestore com schemas tipados e subcollections |
| Geração de ID | Não especificado (fórmulas) | `Utilities.getUuid()` e regex `AAAA-NNNN` | Transação atômica em `counters/proposals-AAAA` |
| Formatação de Moeda | Float direto no Sheets | Arredondamento `Math.round((v + EPS) * 100) / 100` | BigNumber / Centavos inteiros ou helper de precisão |

---

## 4. Mapa Completo de Chamadas Cliente → Servidor (31 RPCs)

| # | RPC Name | Argumentos | Retorno |
|---|---|---|---|
| 1 | `salvarBeneficiario` | `dados: BeneficiarioInput` | `BeneficiarioDetalhado` |
| 2 | `listarBeneficiarios` | `void` | `BeneficiarioResumo[]` |
| 3 | `buscarBeneficiario` | `id: string` | `BeneficiarioDetalhado` |
| 4 | `salvarPropriedade` | `dados: PropriedadeInput` | `PropriedadeDetalhada` |
| 5 | `listarPropriedades` | `void` | `PropriedadeResumo[]` |
| 6 | `buscarPropriedade` | `id: string` | `PropriedadeDetalhada` |
| 7 | `salvarProposta` | `dados: PropostaInput` | `PropostaCriada` |
| 8 | `listarPropostas` | `void` | `PropostaResumo[]` |
| 9 | `buscarProposta` | `id: string` | `PropostaDetalhada` |
| 10 | `obterPatrimonio` | `propostaId: string` | `PatrimonioCompleto` |
| 11 | `salvarItemPatrimonio` | `dados: ItemPatrimonioInput` | `PatrimonioCompleto` |
| 12 | `excluirItemPatrimonio` | `propostaId: string, itemId: string` | `PatrimonioCompleto` |
| 13 | `salvarDividaPatrimonio` | `dados: DividaPatrimonioInput` | `PatrimonioCompleto` |
| 14 | `excluirDividaPatrimonio` | `propostaId: string, dividaId: string` | `PatrimonioCompleto` |
| 15 | `salvarRascunhoPatrimonio` | `propostaId: string, dividasConfirmadas: boolean` | `PatrimonioCompleto` |
| 16 | `concluirLevantamentoPatrimonio` | `propostaId: string` | `PatrimonioCompleto` |
| 17 | `obterIdentificacaoProposta` | `propostaId: string` | `IdentificacaoCompleta` |
| 18 | `salvarIdentificacaoProposta` | `dados: IdentificacaoInput` | `IdentificacaoCompleta` |
| 19 | `concluirIdentificacaoProposta` | `propostaId: string` | `IdentificacaoCompleta` |
| 20 | `obterFluxoCaixa` | `propostaId: string` | `FluxoCaixaCompleto` |
| 21 | `salvarItemFluxoCaixa` | `dados: ItemFluxoInput` | `FluxoCaixaCompleto` |
| 22 | `excluirItemFluxoCaixa` | `propostaId: string, itemId: string` | `FluxoCaixaCompleto` |
| 23 | `salvarRascunhoFluxoCaixa` | `propostaId: string, projecaoConfirmada: boolean` | `FluxoCaixaCompleto` |
| 24 | `concluirFluxoCaixa` | `propostaId: string` | `FluxoCaixaCompleto` |
| 25 | `listarLinhasCreditoAtivas` | `void` | `LinhaCredito[]` |
| 26 | `obterFinanciamento` | `propostaId: string` | `FinanciamentoCompleto` |
| 27 | `salvarFinanciamento` | `dados: FinanciamentoInput` | `FinanciamentoCompleto` |
| 28 | `salvarRascunhoFinanciamento` | `propostaId: string, garantiasConfirmadas: boolean, cronogramaConfirmado: boolean` | `FinanciamentoCompleto` |
| 29 | `concluirFinanciamento` | `propostaId: string` | `FinanciamentoCompleto` |
| 30 | `salvarGarantiaFinanciamento` | `dados: GarantiaInput` | `FinanciamentoCompleto` |
| 31 | `excluirGarantiaFinanciamento` | `propostaId: string, garantiaId: string` | `FinanciamentoCompleto` |

---

## 5. Dependências entre Módulos

```
Beneficiários ──┐
                ├──> Propriedades ──> Propostas (AAAA-NNNN)
                │                         │
                └─────────────────────────┼──> Patrimônio (Levantamento, Itens, Dívidas)
                                          │         │
                                          │         ▼
                                          ├──> Identificação (Empregos, Usos/Fontes)
                                          │         │
                                          │         ▼
                                          ├──> Fluxo de Caixa (7 Anos: Receitas & Custos)
                                          │         │
                                          │         ▼
                                          └──> Financiamento & Garantias (Linha, SAC, Capacidade)
```

---

## 6. Pontos de Concorrência e Transações

1. **Numeração Sequencial de Propostas (`proposals-AAAA`)**:
   - No legado: `LockService.getScriptLock()` com leitura e incremento de linhas no Sheets.
   - No Firestore: Firestore Transaction no documento `/counters/proposals-AAAA` para garantir numeração estrita sem gaps ou colisões.
2. **Atualizações de Cascata de Status**:
   - Conclusão e revisão devem ser atômicas para evitar inconsistências em leituras paralelas.

---

## 7. Riscos de Segurança e Mitigações

1. **Permissões Granulares (RBAC)**:
   - `TECNICO`: Cria e edita propostas que lhe forem atribuídas.
   - `GESTOR`: Homologa, aprova e edita linhas de crédito.
   - `ADMIN`: Gerencia usuários, configurações e logs de auditoria.
   - `CONSULTA`: Apenas leitura sem mutação.
2. **Validação de Entrada Server-Side**:
   - Todos os inputs (CPF, coordenadas, números financeiros, linhas de crédito) devem ser rigorosamente validados no backend/Firestore Rules, nunca confiando apenas no frontend.

---

## 8. Campos e Tipos do Legado (Mapeamento)

- `cpf`, `conjugeCpf`, `garantidorCpf`: `string` (11 dígitos normalizados).
- `areaTotal`, `areaDisponivel`, `areaLegal`: `number` (float 2 casas).
- `latitude`, `longitude`: `number` (float 6 casas) ou `null`.
- `valorUnitario`, `valorTotal`, `saldoDevedor`, `faturamentoUltimoAno`, `valorProposta`, `valorFinanciado`, `valorAter`, `valorProjeto`: `number` (arredondado a 2 casas decimais).
- `ano1` .. `ano7`: `number` (arredondado a 2 casas decimais).
- `taxaJurosAnual`, `percentualFinanciavel`, `percentualAter`: `number` (percentual).

---

## 9. Proposta Final de Collections Firestore

- `/users/{userId}`: Perfil, papel (`role`), status.
- `/beneficiaries/{beneficiaryId}`: Dados do beneficiário + subcollection `references`.
- `/properties/{propertyId}`: Dados da propriedade fundiária vinculada ao beneficiário.
- `/credit_lines/{lineId}`: Parâmetros das linhas de crédito.
- `/proposals/{proposalId}`: Proposta principal, status, metadados de progresso.
  - Subcollection `/patrimony_items/{itemId}`
  - Subcollection `/patrimony_debts/{debtId}`
  - Subcollection `/jobs/{jobId}`
  - Subcollection `/uses_sources/{id}`
  - Subcollection `/cashflow_items/{itemId}`
  - Subcollection `/guarantees/{guaranteeId}`
- `/counters/proposals-{year}`: Contador transacional atômico de número de proposta.
- `/audit_logs/{logId}`: Registro imutável de todas as ações de criação, alteração e conclusão.

---

## 10. Plano de Implementação em Commits Pequenos

1. **Commit 1**: Setup do servidor Node.js + Express, roteamento de RPCs legado, bridge `google.script.run`, e banco em memória com seed completo das Linhas de Crédito e dados de teste. *(Concluído)*
2. **Commit 2**: Mapeamento e documentação da auditoria técnica (`docs/AI_STUDIO_AUDIT.md`). *(Concluído)*
3. **Commit 3**: Provisionamento e integração de Firebase Firestore, Auth e Security Rules granulares conforme modelo auditado.
4. **Commit 4**: Implementação da camada React moderna com componentes GovBR-DS e painéis de esteira de crédito.
5. **Commit 5**: Testes de regressão, conferência de cálculos financeiros e homologação.
