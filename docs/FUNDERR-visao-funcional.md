# FUNDERR — Documento de Visão Funcional e Fluxo Operacional

**Sistema:** FUNDERR — Sistema de elaboração de projetos
**Documento:** Visão funcional, regras de fluxo e objetivo final
**Referência funcional:** evolução atual do projeto até a série v0.10.x
**Finalidade deste documento:** definir, de maneira independente da implementação, **o que o FUNDERR deve fazer, como o usuário deve trabalhar dentro dele e qual produto final o sistema deve gerar**.

---

## 1. Visão geral

O **FUNDERR** deve ser um sistema web destinado à **elaboração estruturada de projetos de crédito rural**, substituindo o fluxo anteriormente executado por uma planilha Excel/VBA por uma aplicação centralizada, guiada e auditável.

A função do sistema não deve ser simplesmente armazenar cadastros. Seu papel principal é **conduzir o técnico por todo o processo de elaboração do projeto**, garantindo que informações cadastrais, patrimoniais, produtivas, econômicas e financeiras estejam relacionadas corretamente antes da conclusão.

Em termos conceituais:

```text
Beneficiário
      ↓
Propriedade
      ↓
Processo de crédito
      ↓
Levantamento patrimonial
      ↓
Identificação da proposta
      ↓
Fluxo de caixa
      ↓
Financiamento
      ↓
Documentos
      ↓
PROJETO FINAL
```

O FUNDERR deve atuar, portanto, como **sistema de elaboração e validação de um dossiê de crédito rural**, e não como uma simples ficha cadastral.

---

## 2. Objetivo final do sistema

O objetivo final é permitir que um técnico parta de um beneficiário e chegue a um **projeto rural completo, coerente e pronto para formalização**, sem precisar controlar manualmente em várias planilhas:

- cadastro do produtor;
- informações da propriedade;
- patrimônio;
- dívidas;
- proposta de investimento;
- empregos;
- usos e fontes;
- receitas;
- custos;
- capacidade de pagamento;
- condições do financiamento;
- garantias;
- cronograma financeiro;
- documentos resultantes.

O sistema deve garantir que esses módulos **conversem entre si**.

Por exemplo:

```text
Patrimônio
   ↓
Identificação da proposta
   ↓
Fluxo de caixa
   ↓
Financiamento
```

Não deve ser necessário redigitar em Financiamento aquilo que já foi calculado no Fluxo de Caixa, nem informar manualmente na Identificação valores patrimoniais já cadastrados anteriormente.

Esse princípio de **fonte única da verdade** é fundamental para a arquitetura do FUNDERR.

---

## 3. Princípios funcionais

O sistema deve seguir quatro princípios.

### 3.1. Informação cadastrada uma vez

Um beneficiário pode participar de vários processos, portanto seus dados não pertencem ao processo individualmente.

O mesmo vale para propriedade.

A estrutura conceitual deve ser:

```text
Beneficiário
 ├── Propriedade A
 ├── Propriedade B
 └── Propriedade C

Beneficiário
 ├── Processo 2026-0001 → Propriedade A
 ├── Processo 2026-0005 → Propriedade A
 └── Processo 2027-0002 → Propriedade C
```

Isso evita duplicação e divergência cadastral.

### 3.2. O processo é o centro da elaboração

O cadastro é apenas a base.

Depois que o processo é criado, ele se torna o objeto central e deve mostrar todas as etapas do projeto:

1. Dados gerais
2. Beneficiário
3. Propriedade
4. Levantamento patrimonial
5. Identificação da proposta
6. Fluxo de caixa
7. Financiamento
8. Documentos

### 3.3. O backend é responsável pelas regras

O navegador deve coletar e apresentar dados, mas cálculos e validações importantes precisam ser autoritativos no Apps Script.

Não devemos confiar em:

```text
HTML → calcula → grava resultado pronto
```

O correto é:

```text
HTML
 ↓
envia dados brutos
 ↓
Apps Script valida
 ↓
Apps Script calcula
 ↓
Apps Script grava
 ↓
Apps Script devolve resultado
```

Isso vale particularmente para patrimônio, fluxo de caixa e financiamento.

### 3.4. Conclusão não é igual a preenchimento

Cada etapa pode ser parcialmente preenchida e salva.

O FUNDERR deve diferenciar:

| Estado         | Significado                                                                   |
| -------------- | ----------------------------------------------------------------------------- |
| **PENDENTE**   | etapa ainda não iniciada                                                      |
| **RASCUNHO**   | etapa iniciada, mas não concluída                                             |
| **CONCLUÍDO**  | etapa passou pelas validações necessárias                                     |
| **EM REVISÃO** | etapa já havia sido concluída, mas algo relevante foi posteriormente alterado |

A mesma ideia deve valer para todas as etapas controladas pelo fluxo.

---

## 4. Fluxo operacional completo

O fluxo esperado do técnico é:

1. **Localizar ou cadastrar o beneficiário.**
2. **Localizar ou cadastrar uma propriedade.**
3. **Criar um processo FUNDERR.**
4. **Revisar Beneficiário e Propriedade.**
5. **Executar o Levantamento Patrimonial.**
6. **Executar a Identificação da Proposta.**
7. **Elaborar o Fluxo de Caixa.**
8. **Configurar o Financiamento.**
9. **Gerar e organizar Documentos.**
10. **Encerrar o projeto.**

O resultado final deve ser um dossiê coerente, rastreável e reproduzível a partir dos dados registrados no sistema.

---

## 5. Beneficiários

### 5.1. Objetivo

O módulo **Beneficiários** representa a pessoa que será proponente do crédito.

O beneficiário deve existir independentemente dos processos. Isso permite reaproveitamento do cadastro ao longo do tempo.

### 5.2. Dados

O cadastro contempla, entre outros:

| Grupo         | Informações                                        |
| ------------- | -------------------------------------------------- |
| Identificação | nome, apelido, CPF, RG                             |
| Contato       | telefone, endereço                                 |
| Pessoais      | nacionalidade, naturalidade, nascimento            |
| Sociais       | estado civil, escolaridade, profissão, dependentes |
| Cônjuge       | nome, RG e CPF quando aplicável                    |
| Referências   | contatos pessoais de referência                    |

CPF deve ser validado tanto estruturalmente quanto pelos dígitos verificadores.

O estado civil determina se os dados de cônjuge são aplicáveis.

### 5.3. Completude

O sistema deve permitir salvar o cadastro incompleto.

Porém, deve apresentar algo como:

```text
Cadastro 75% concluído

Pendências:
RG
Escolaridade
Endereço
```

Ou:

```text
Cadastro completo
```

Assim, **salvar** e **estar pronto para uso final** são conceitos diferentes.

---

## 6. Propriedades

### 6.1. Relação com beneficiário

Toda propriedade possui um beneficiário associado.

Um beneficiário pode possuir várias propriedades.

No momento de criar um processo:

```text
Beneficiário = João
```

o campo Propriedade deve mostrar **somente propriedades cujo `beneficiarioId` seja João**.

Essa relação é fundamental para evitar vincular acidentalmente o processo rural de uma pessoa à propriedade de outra.

### 6.2. Dados principais

A propriedade contém:

| Grupo          | Dados                                             |
| -------------- | ------------------------------------------------- |
| Identificação  | denominação e localização                         |
| Territorial    | município, estado, área total, disponível e legal |
| Posse          | forma de ocupação e tempo de exploração           |
| Documentação   | documento da propriedade                          |
| Georreferência | latitude e longitude                              |
| Limites        | confrontações Norte, Sul, Leste e Oeste           |
| Gestão         | descrição da administração                        |

Latitude e longitude devem ser informadas conjuntamente.

A interface pode utilizar Google Maps para auxiliar o preenchimento, mas **o mapa é auxiliar**. Latitude e longitude permanecem sendo os dados estruturados efetivamente armazenados.

---

## 7. Processo FUNDERR

O Processo representa uma **elaboração específica de crédito**.

Um processo possui:

```text
Número
Data
Beneficiário
Propriedade
Atividade
Status
```

Por exemplo:

```text
Processo: 2026-0023

Beneficiário:
José da Silva

Propriedade:
Fazenda Boa Esperança

Município:
Cantá

Atividade:
Bovinocultura de corte
```

A partir desse momento, o usuário deve trabalhar principalmente dentro do processo.

---

## 8. Painel do processo

Ao abrir um processo, o sistema deve mostrar imediatamente:

| Informação         | Função            |
| ------------------ | ----------------- |
| número do processo | identificação     |
| beneficiário       | proponente        |
| CPF                | identificação     |
| propriedade        | unidade produtiva |
| município          | localização       |
| atividade          | objeto produtivo  |
| data               | referência        |
| status             | situação global   |

Abaixo deve existir um **indicador de progresso** com as oito etapas.

O estágio visualmente ativo deve ser a primeira etapa ainda não concluída.

---

## 9. Levantamento Patrimonial

### 9.1. Objetivo

Responder à pergunta:

> **Qual é a situação patrimonial atual do proponente e quais dívidas incidem sobre ela?**

O patrimônio será utilizado nas etapas posteriores da proposta.

### 9.2. Categorias

O modelo divide os bens em:

| Código                 | Categoria                         |
| ---------------------- | --------------------------------- |
| TERRA_COBERTURAS       | Terra e coberturas                |
| CONSTRUCOES_CIVIS      | Construções civis                 |
| ESTRUTURA_AGROPECUARIA | Estrutura agropecuária            |
| INFRAESTRUTURA         | Infraestrutura                    |
| MAQUINAS_EQUIPAMENTOS  | Máquinas, veículos e equipamentos |
| SEMOVENTES             | Semoventes                        |
| OUTROS_BENS_URBANOS    | Outros bens urbanos               |

Cada item deve permitir, conceitualmente:

```text
Categoria
Especificação
Unidade
Quantidade
Valor unitário
Valor total
```

O valor total deve ser calculado a partir dos dados, e não aceito cegamente do navegador.

### 9.3. Dívidas

Também são registradas dívidas, com informações como:

```text
Credor
Finalidade
Vencimento
Saldo devedor
```

Ao final, o usuário precisa confirmar que a situação das dívidas foi revisada.

### 9.4. Cálculos

O sistema calcula:

```text
Patrimônio bruto agropecuário
+ Outros bens urbanos
= Patrimônio total informado

Patrimônio bruto agropecuário
- Dívidas
= Patrimônio líquido agropecuário
```

Os seis primeiros grupos patrimoniais entram no patrimônio agropecuário; `OUTROS_BENS_URBANOS` é apresentado separadamente.

### 9.5. Conclusão

Para concluir, devem existir os requisitos definidos para a etapa, incluindo pelo menos um item patrimonial e a confirmação da situação das dívidas.

---

## 10. Identificação da Proposta

Esta etapa começa a transformar o cadastro em um **projeto econômico**.

### 10.1. Finalidade

Deve responder:

> **O que será feito, por quê, em que contexto produtivo e de onde virão os recursos?**

São tratados:

```text
Finalidade
Mercado
Faturamento do último ano
Análise da localização
Considerações
Empregos
Usos
Fontes
```

A conclusão deve depender dos campos e confirmações relevantes da etapa.

---

## 11. Empregos

O projeto deve identificar o impacto sobre mão de obra.

As categorias previstas são:

```text
Administrativa
Técnica
Produtiva
Outros
```

Cada uma deve apresentar:

```text
Situação atual
Expansão prevista
Total
```

Isso permite demonstrar:

```text
Hoje: 3 empregos
Após projeto: 5 empregos
Expansão: +2
```

Não deve ser necessário transformar emprego em dinheiro; trata-se de indicador físico/social do projeto.

---

## 12. Usos e Fontes

### 12.1. Usos

“Usos” representam **onde o dinheiro será aplicado**.

Exemplo:

```text
Máquinas                R$ 60.000
Infraestrutura          R$ 25.000
Semoventes              R$ 20.000
---------------------------------
Total dos usos          R$ 105.000
```

Valores de patrimônio já existentes podem alimentar a coluna correspondente a realizado, evitando redigitação.

### 12.2. Fontes

“Fontes” representam **de onde virá o recurso**:

```text
Recursos próprios
Dívidas agropecuárias
Financiamento
Outros
```

O sistema deve mostrar:

```text
Total dos usos
Total das fontes
Diferença
```

Uma divergência deve ser visualmente destacada.

---

## 13. Dependência Patrimônio → Identificação

A Identificação depende do Patrimônio.

Não basta concluir o Patrimônio uma vez e esquecê-lo.

Conceitualmente:

```text
Patrimônio CONCLUÍDO
        ↓
Identificação CONCLUÍDA
```

Se o patrimônio relevante for alterado depois:

```text
Identificação
    ↓
EM REVISÃO
```

Esse mecanismo impede que um projeto continue aparentando estar aprovado com base em dados que já mudaram.

---

## 14. Fluxo de Caixa

### 14.1. Objetivo

Responder à pergunta:

> **A atividade gera resultado econômico suficiente ao longo do horizonte analisado?**

O fluxo não é o cronograma do empréstimo.

Ele representa **a operação econômica da atividade**.

### 14.2. Tipos de item

São utilizados:

```text
RECEITA
CUSTO_VARIAVEL
CUSTO_FIXO
```

Por exemplo:

```text
Receita
Venda de bezerros

Custos variáveis
Ração
Medicamentos
Combustível

Custos fixos
Manutenção
Energia
Mão de obra fixa
```

### 14.3. Horizonte

O modelo atual trabalha com até **sete anos**.

Para o Ano 1, o sistema pode utilizar:

```text
Quantidade × Valor unitário
```

Nos anos seguintes o usuário informa/projeta os valores anuais.

### 14.4. Resultado

Para cada ano:

```text
Receitas
- Custos variáveis
- Custos fixos
-------------------
Resultado operacional
```

O sistema também mantém resultado acumulado ao longo do período.

### 14.5. Conclusão

O fluxo só deve poder ser concluído quando houver:

```text
Identificação concluída
Pelo menos uma receita
Pelo menos um custo
Confirmação da projeção
```

---

## 15. Dependência Identificação → Fluxo

A cadeia de integridade passa a ser:

```text
Patrimônio
    ↓
Identificação
    ↓
Fluxo de caixa
```

Alterar uma informação estrutural anterior pode invalidar semanticamente a etapa posterior.

Por isso o FUNDERR trabalha com revisão:

```text
CONCLUÍDO
   ↓ alteração upstream
EM REVISÃO
   ↓ técnico verifica
CONCLUÍDO novamente
```

Essa é uma característica importante do sistema e deve ser mantida em futuras arquiteturas.

---

## 16. Financiamento

### 16.1. Objetivo

Responder:

> **Qual é a estrutura financeira do crédito e o resultado operacional projetado suporta seu pagamento?**

O financiamento deve consumir o resultado do Fluxo de Caixa, não substituí-lo.

---

## 17. Condições financeiras

Um financiamento contempla, entre outros:

| Informação             | Função                          |
| ---------------------- | ------------------------------- |
| linha de crédito       | conjunto opcional de parâmetros |
| valor da proposta      | base do investimento            |
| percentual financiável | parte elegível ao crédito       |
| valor financiado       | resultado calculado             |
| percentual de ATER     | percentual aplicável            |
| valor de ATER          | cálculo                         |
| valor do projeto       | total considerado               |
| taxa anual             | juros                           |
| prazo total            | duração                         |
| carência               | período inicial                 |
| periodicidade          | atualmente anual                |
| juros na carência      | pagar ou capitalizar            |

O modelo interno trabalha com periodicidade anual e tratamento da carência como `PAGAR` ou `CAPITALIZAR`.

---

## 18. Linhas de crédito

As linhas de crédito devem funcionar como **parâmetros configuráveis**, não como valores mágicos codificados no sistema.

Uma linha pode conter:

```text
Código
Nome
Teto
Taxa de juros
Prazo máximo
Carência máxima
Percentual financiável máximo
Percentual padrão de ATER
Observações
```

Ao aplicar uma linha, o sistema deve validar os limites configurados.

Isso é importante porque regras de crédito podem mudar.

O sistema não deve depender de constantes enterradas no código.

---

## 19. Cronograma financeiro

O cronograma deve ser calculado no backend.

A lógica atualmente adotada é de amortização anual constante após a carência.

Durante a carência existem dois cenários.

### PAGAR

```text
Amortização = 0
Juros = pagos
Saldo principal permanece
```

### CAPITALIZAR

```text
Amortização = 0
Juros = incorporados ao saldo
Saldo cresce
```

Após a carência:

```text
Prestação = Amortização + Juros
```

---

## 20. Capacidade de pagamento

Essa é uma das integrações mais importantes do FUNDERR.

O sistema compara:

```text
Resultado operacional do ano
-
Prestação do financiamento no ano
=
Saldo após dívida
```

Se:

```text
Saldo após dívida ≥ 0
```

a capacidade daquele período é marcada como suficiente.

Se:

```text
Saldo após dívida < 0
```

o sistema sinaliza insuficiência.

É importante observar que isso é um **indicador operacional**, e não deve ser apresentado como aprovação bancária automática.

O FUNDERR auxilia a análise; ele não substitui as regras formais da instituição financeira.

---

## 21. Garantias

O técnico deve poder cadastrar as garantias relacionadas ao financiamento, incluindo informações compatíveis com o tipo escolhido.

A etapa só pode ser considerada pronta quando o técnico **revisar e confirmar a situação das garantias**.

Da mesma maneira, ele precisa confirmar o cronograma.

A completude deve considerar:

```text
Fluxo de Caixa concluído
Condições do financiamento informadas
Garantias confirmadas
Cronograma financeiro confirmado
```

---

## 22. Dependência Fluxo → Financiamento

A cadeia completa torna-se:

```text
Patrimônio
    ↓
Identificação
    ↓
Fluxo
    ↓
Financiamento
```

O financiamento não deve poder ser considerado concluído se o fluxo de caixa estiver pendente.

---

## 23. Sistema de revisão em cascata

Esta é uma das regras mais importantes do projeto.

Imagine:

```text
Patrimônio          CONCLUÍDO
Identificação       CONCLUÍDA
Fluxo               CONCLUÍDO
Financiamento       CONCLUÍDO
```

O técnico descobre que uma informação relevante do Patrimônio estava errada.

Após a alteração, as etapas dependentes **não podem continuar sendo tratadas como se nada tivesse acontecido**.

Conceitualmente:

```text
Alteração no Patrimônio
          ↓
Identificação precisa ser revista
          ↓
Fluxo pode precisar ser revisto
          ↓
Financiamento pode precisar ser revisto
```

Por isso o status `EM_REVISAO` existe.

Isso é muito superior ao comportamento de uma planilha tradicional, onde uma alteração pode modificar silenciosamente um resultado sem deixar claro que decisões posteriores foram baseadas em dados anteriores.

---

## 24. Documentos

### 24.1. Situação atual

O módulo aparece como a oitava etapa, mas ainda deve ser implementado como etapa produtiva completa.

### 24.2. Objetivo final

Esta etapa deve transformar **dados estruturados** em **documentos formais**.

A ideia não deve ser fazer o usuário escrever novamente tudo em um editor.

O FUNDERR já deve saber:

```text
quem é o beneficiário
onde está a propriedade
qual é o patrimônio
qual é a finalidade
quais são os usos
de onde vêm as fontes
qual é o fluxo econômico
qual é o financiamento
quais são as garantias
```

Portanto, deve conseguir gerar documentos a partir dessas informações.

A arquitetura prevista para esta fase é usar modelos de Google Docs e gerar versões em PDF armazenadas no Google Drive, mantendo histórico de geração quando necessário.

---

## 25. Produto final esperado

Ao terminar todo o fluxo, o processo deve funcionar conceitualmente como um **dossiê digital de elaboração de crédito rural**.

Ele deverá reunir:

```text
IDENTIFICAÇÃO
Beneficiário
Propriedade

DIAGNÓSTICO
Patrimônio
Dívidas

PROJETO
Finalidade
Mercado
Localização
Empregos
Usos e fontes

VIABILIDADE
Receitas
Custos
Resultado
Projeção

CRÉDITO
Condições financeiras
Cronograma
Capacidade de pagamento
Garantias

DOCUMENTAÇÃO
Relatórios
Formulários
Projeto técnico
PDFs
Anexos
```

O objetivo não é simplesmente mostrar esses itens em uma tela.

O objetivo é que eles constituam **um único processo coerente**.

---

## 26. Arquitetura funcional

A arquitetura atual segue:

```text
Navegador
    │
    │ HTML + GovBR-DS + JavaScript
    │
    ▼
google.script.run
    │
    ▼
Google Apps Script
    │
    ├── validações
    ├── regras de negócio
    ├── cálculos
    └── autorização de gravação
    │
    ▼
Google Sheets
```

No futuro:

```text
                        ┌─ Google Sheets
Apps Script ────────────┼─ Google Drive
                        └─ Google Docs / PDF
```

O usuário não precisa operar diretamente a planilha utilizada como armazenamento.

Ela é infraestrutura.

O **FUNDERR é a interface oficial de manipulação dos dados**.

---

## 27. Organização lógica dos dados

O modelo pode ser entendido assim:

```text
Beneficiário
│
├── Referências
│
└── Propriedades
       │
       └── Processo
            │
            ├── Patrimônio
            │    ├── Itens
            │    └── Dívidas
            │
            ├── Identificação
            │    ├── Empregos
            │    └── Usos e fontes
            │
            ├── Fluxo de caixa
            │    └── Itens
            │
            ├── Financiamento
            │    └── Garantias
            │
            └── Documentos
```

Esse relacionamento deve continuar valendo mesmo se futuramente trocarmos Google Sheets por Firestore, PostgreSQL ou outra infraestrutura.

**A regra de negócio não deve depender da tecnologia de armazenamento.**

---

## 28. Experiência esperada do usuário

O FUNDERR não deve parecer uma planilha transportada para um navegador.

Ele deve funcionar como **wizard/process manager**.

O técnico abre:

> Processo 2026-0015

e imediatamente sabe:

```text
✓ Dados gerais
✓ Beneficiário
✓ Propriedade
✓ Levantamento patrimonial
! Identificação da proposta — 83%
○ Fluxo de caixa
○ Financiamento
○ Documentos
```

Ele também deve saber **por que** uma etapa não está concluída.

Por exemplo:

> Identificação — 83%
> Pendência: confirmar usos e fontes.

Em vez de obrigá-lo a descobrir qual campo está faltando.

---

## 29. GovBR-DS

A migração visual deve preservar uma regra arquitetural clara:

```text
View
   ↓
componente GovBR-DS real
   ↓
Client JavaScript
   ↓
Apps Script
```

Não:

```text
HTML nativo
   ↓
proxy escondido
   ↓
MutationObserver
   ↓
componente GovBR
```

A decisão de reescrever diretamente as Views é importante porque reduz estado duplicado, efeitos colaterais e dependência de manipulação artificial do DOM.

O GovBR-DS deve servir para:

```text
inputs
selects
botões
mensagens
tags
cards
tabelas
etapas
checkboxes
datas
modais
```

enquanto o CSS do FUNDERR deve concentrar-se em **layout e necessidades específicas do produto**.

---

## 30. O que o FUNDERR não deve fazer

O sistema não deve:

| Comportamento indesejado                                      | Motivo                                        |
| ------------------------------------------------------------- | --------------------------------------------- |
| inventar parâmetros de crédito                                | regras financeiras precisam ser configuráveis |
| aprovar automaticamente um crédito                            | a decisão pertence ao processo institucional  |
| duplicar dados calculados                                     | gera inconsistência                           |
| permitir alterar valores derivados                            | resultados devem vir da fonte correta         |
| esconder divergências                                         | técnico precisa ser informado                 |
| impedir todo salvamento incompleto                            | atendimento ocorre gradualmente               |
| tratar rascunho como concluído                                | integridade operacional                       |
| manter uma etapa concluída após dado upstream relevante mudar | gera análise desatualizada                    |
| reproduzir cegamente erros da planilha antiga                 | o novo sistema deve corrigir o modelo         |

---

## 31. Meta de maturidade

A evolução correta do FUNDERR pode ser enxergada em quatro níveis:

| Nível        | Resultado                                              |
| ------------ | ------------------------------------------------------ |
| **Cadastro** | Beneficiário e propriedade estruturados                |
| **Processo** | fluxo guiado de elaboração                             |
| **Análise**  | patrimônio, proposta, fluxo e financiamento integrados |
| **Produção** | documentos, histórico, controle e dossiê final         |

---

## 32. Definição de “processo concluído”

No estado final do produto, um processo só deveria ser considerado **completo** quando:

```text
Beneficiário completo
        AND
Propriedade completa
        AND
Patrimônio concluído
        AND
Identificação concluída
        AND
Fluxo de caixa concluído
        AND
Financiamento concluído
        AND
Documentação obrigatória concluída
```

Não é necessário que isso impeça o técnico de navegar.

Mas o sistema deve impedir que:

> “Projeto concluído”

seja exibido quando uma das condições essenciais ainda não foi satisfeita.

---

## 33. Resultado pretendido

A melhor descrição curta do FUNDERR é:

> **O FUNDERR é um sistema web para elaboração, análise e formalização de projetos de crédito rural. Ele organiza os dados do beneficiário e da propriedade, conduz o técnico por um fluxo estruturado de levantamento patrimonial, identificação da proposta, projeção econômica e financiamento, controla a completude e a revisão das etapas e, ao final, utiliza essas informações para compor o dossiê documental do projeto.**

E, arquiteturalmente, a ideia central é:

> **cada dado deve ter uma única origem, cada cálculo deve possuir uma regra explícita, cada etapa deve conhecer suas dependências e nenhuma conclusão posterior deve permanecer válida silenciosamente quando sua base de informação mudar.**

Esse deve ser o **documento norteador do desenvolvimento do FUNDERR** daqui em diante.
