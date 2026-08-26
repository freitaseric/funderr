# Checklist de aceitação

## Geral

- [ ] Login funciona
- [ ] usuário não autorizado é bloqueado
- [ ] roles são respeitadas server-side
- [ ] nenhuma regra Firestore permissiva
- [ ] App Check configurado para produção
- [ ] TypeScript sem erros
- [ ] testes passam
- [ ] nenhuma chave secreta no bundle
- [ ] GovBR-DS acessível e responsivo

## Beneficiário

- [ ] CPF válido/inválido replica o legado
- [ ] CPF único
- [ ] cônjuge obrigatório somente nos estados civis aplicáveis
- [ ] CPF cônjuge != CPF beneficiário
- [ ] completude e percentual corretos
- [ ] referências são salvas

## Propriedade

- [ ] vínculo com beneficiário
- [ ] beneficiário não pode ser trocado em propriedade existente sem regra explícita
- [ ] 15 municípios RR
- [ ] lat/lng em par
- [ ] mapa funciona
- [ ] completude correta

## Processo

- [ ] criação exige beneficiário+propriedade compatíveis
- [ ] numeração `AAAA-NNNN` sem colisões concorrentes
- [ ] busca/listagem
- [ ] progresso de 8 etapas

## Patrimônio

- [ ] CRUD itens
- [ ] CRUD dívidas
- [ ] totais por categoria
- [ ] patrimônio bruto
- [ ] total dívidas
- [ ] patrimônio líquido
- [ ] conclusão exige item + confirmação dívidas
- [ ] edição após conclusão => revisão

## Identificação

- [ ] campos e empregos
- [ ] usos/fontes
- [ ] conclusão depende do patrimônio
- [ ] mudança posterior no patrimônio => identificação efetivamente em revisão

## Fluxo de caixa

- [ ] receitas/custos
- [ ] 7 anos
- [ ] resumo anual e acumulado
- [ ] conclusão depende da identificação
- [ ] mudança posterior na identificação => revisão

## Financiamento

- [ ] linhas ativas
- [ ] limites da linha
- [ ] ATER
- [ ] garantias
- [ ] PAGAR/CAPITALIZAR
- [ ] cronograma anual
- [ ] capacidade de pagamento
- [ ] conclusão depende do fluxo
- [ ] mudança posterior no fluxo => revisão
- [ ] cálculo definitivo server-side

## Documentos (novo)

- [ ] upload
- [ ] metadados
- [ ] download autorizado
- [ ] remoção autorizada
- [ ] auditoria
- [ ] regras Storage
- [ ] nenhuma análise Gemini automática

## Migração

- [ ] IDs preservados
- [ ] contagem por entidade confere
- [ ] totais monetários de amostras conferem
- [ ] processos históricos abrem
- [ ] timestamps preservados quando disponíveis
- [ ] relatório de inconsistências arquivado
