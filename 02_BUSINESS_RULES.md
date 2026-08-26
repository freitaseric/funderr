# Regras de negócio críticas

## Beneficiário

Obrigatórios para cadastro ampliado completo:

- nome;
- CPF;
- telefone;
- nacionalidade;
- naturalidade;
- estado civil;
- data de nascimento;
- profissão;
- RG;
- escolaridade;
- endereço;
- número de dependentes.

Para `CASADO` ou `UNIAO_ESTAVEL`, também:

- nome do cônjuge;
- RG do cônjuge;
- CPF do cônjuge.

Regras:

- CPF válido;
- CPF do cônjuge não pode ser igual ao do beneficiário;
- CPF do beneficiário é único;
- telefone com DDD e 10/11 dígitos;
- dependentes inteiro >= 0.

## Propriedade

Requisitos de completude:

- denominação;
- endereço/localização;
- município;
- estado;
- área total;
- forma de ocupação;
- tempo de exploração/moradia;
- documento existente.

Regras adicionais:

- estado fixado em Roraima;
- município precisa ser um dos 15 municípios de RR;
- latitude e longitude devem ser informadas juntas;
- propriedade pertence a um beneficiário;
- beneficiário da propriedade existente não pode ser trocado;
- Google Maps/localização faz parte da UX.

## Processo/proposta

Criação exige:

- beneficiário existente;
- propriedade existente;
- propriedade pertencente ao beneficiário;
- data;
- atividade.

Número legado:

`AAAA-NNNN`, sequencial por ano.

Status inicial do processo no legado: `EM ELABORAÇÃO`.

A geração do número usa lock global no Apps Script; na v1 deve ser transacional/atômica server-side.

## Status de etapas

Estados operacionais:

- `PENDENTE`
- `RASCUNHO`
- `EM_REVISAO`
- `CONCLUIDO`

### Regra de revisão em cascata

Patrimônio concluído alterado → Patrimônio `EM_REVISAO`.

Identificação concluída só permanece efetivamente concluída se:

- patrimônio continua completo; e
- `patrimonio.updatedAt <= identificacao.patrimonioRevisadoEm`.

Fluxo concluído só permanece efetivamente concluído se:

- identificação continua completa; e
- `identificacao.updatedAt <= fluxo.identificacaoRevisadaEm`.

Financiamento concluído só permanece efetivamente concluído se:

- fluxo continua completo; e
- `fluxo.updatedAt <= financiamento.fluxoRevisadoEm`.

Essa regra é essencial.

## Patrimônio

Categorias:

- `TERRA_COBERTURAS`
- `CONSTRUCOES_CIVIS`
- `ESTRUTURA_AGROPECUARIA`
- `INFRAESTRUTURA`
- `MAQUINAS_EQUIPAMENTOS`
- `SEMOVENTES`
- `OUTROS_BENS_URBANOS`

Para concluir:

- pelo menos 1 item patrimonial;
- situação das dívidas confirmada.

Cálculos:

- patrimônio bruto = soma das categorias agropecuárias;
- outros bens urbanos são mostrados separadamente;
- total de dívidas = soma do saldo devedor;
- patrimônio líquido = patrimônio bruto - dívidas;
- total informado = patrimônio bruto + outros bens urbanos.

## Identificação

Empregos:

- `ADMINISTRATIVA`
- `TECNICA`
- `PRODUTIVA`
- `OUTROS`

Usos:

- Terra e coberturas
- Construções civis
- Estrutura agropecuária
- Infraestrutura
- Máquinas/veículos/equipamentos
- Semoventes

Fontes:

- `RECURSOS_PROPRIOS`
- `DIVIDAS_AGROPECUARIAS`
- `FINANCIAMENTO`
- `OUTROS`

Para concluir:

- patrimônio concluído;
- finalidade;
- mercado;
- faturamento do último ano;
- análise da localização;
- empregos confirmados;
- usos e fontes confirmados.

## Fluxo de caixa

Tipos:

- `RECEITA`
- `CUSTO_VARIAVEL`
- `CUSTO_FIXO`

Horizonte: **7 anos**.

Para concluir:

- identificação concluída;
- pelo menos uma receita;
- pelo menos um custo;
- projeção confirmada.

Cálculos por ano:

- despesas = custos variáveis + custos fixos;
- resultado = receitas - despesas;
- acumulado = acumulado anterior + resultado.

## Linhas de crédito

Campos principais:

- código/nome/ativo;
- teto;
- taxa anual;
- prazo máximo;
- carência máxima;
- percentual financiável máximo;
- percentual ATER padrão;
- observações.

O ZIP de código não contém os registros reais da planilha `LinhasCredito`.

## Financiamento

Tipos de garantia:

- `AVAL_PESSOAL`
- `BEM`
- `OUTRA`

Cálculos:

- valor financiado = valor proposta × percentual financiável;
- valor ATER = valor proposta × percentual ATER;
- valor projeto = valor financiado + valor ATER.

Validações contra a linha:

- teto de financiamento;
- prazo máximo;
- carência máxima;
- percentual financiável máximo.

Carência:

- `PAGAR`: paga juros durante a carência;
- `CAPITALIZAR`: juros são incorporados ao saldo.

Cronograma:

- anual;
- amortização constante após carência;
- calcula saldo inicial/final, juros, amortização, prestação;
- compara prestação ao resultado operacional do fluxo;
- marca capacidade insuficiente quando resultado após dívida < 0.

Para concluir:

- fluxo de caixa concluído;
- condições do financiamento informadas;
- garantias confirmadas;
- cronograma/capacidade revisados e confirmados.

## IA

IA nunca deve decidir ou substituir:

- CPF válido;
- cálculos monetários;
- cronograma;
- capacidade;
- limites da linha;
- transições de estado;
- autorização.

Gemini deve ser assistivo: extração, resumo, classificação ou detecção de inconsistências para revisão humana.
