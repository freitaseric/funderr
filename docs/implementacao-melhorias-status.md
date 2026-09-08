# Checkpoint de implementação — melhorias e segurança

## Estado atual

- Última atualização: 2026-09-08.
- Fases de experiência, normalização monetária, validação e tramitação: concluídas.
- Correção de autorização por registro: concluída e validada.
- Próxima retomada: validação manual opcional em viewport móvel e temas `corporate`/`business`.

## Segurança implementada nesta execução

- Técnicos não acessam propostas de outra unidade ou de outro técnico.
- `ProposalPolicy` é aplicada em leitura, edição, impressão, Livewire e tramitação.
- A tramitação revalida autorização dentro da transação com lock antes de alterar o status.
- Listagens de propostas usam `Proposal::visibleTo()` e não enumeram propostas fora do escopo do técnico.
- Beneficiários e propriedades possuem policies de leitura, criação e edição.
- Controllers e componentes Livewire verificam a autorização do registro exato.
- Beneficiários e propriedades novos registram `created_by`.
- Listagens e seletores Livewire filtram registros não autorizados.
- Foram adicionados testes IDOR para detalhe, edição, impressão, índice e tentativa direta de tramitação.
- O histórico de tramitação registra `ip_address` e `user_agent`; o IP é exibido somente para Administrador na revisão.
- CPF e telefone são mascarados na apresentação para perfis não administradores, sem alterar os valores originais no banco.
- Rotas sensíveis receberam `throttle:sensitive-read` e ações administrativas de escrita receberam `throttle:sensitive-write`, limitados por usuário e IP.
- Foi criado o comando `funderr:assign-legacy-owner {user} {--model=all|beneficiaries|properties} {--dry-run}` para atribuir registros legados de forma explícita e transacional.

## Regra de perfis

- Administrador mantém acesso global explícito e gerencia usuários/linhas de crédito.
- Núcleo mantém consulta global e pode processar propostas.
- Técnico pode trabalhar nos próprios cadastros e em propostas criadas por ele ou da própria unidade IATER.

## Ressalva de dados legados

Registros antigos sem `created_by` ficam indisponíveis para técnicos até serem atribuídos a um responsável. Administrador e Núcleo continuam podendo consultá-los. Antes da liberação operacional, deve ser feita a atribuição desses registros ou uma migração de ownership aprovada.

## Validações executadas

- PHPUnit: 76 testes, 292 asserções — passou.
- Pint nos arquivos PHP alterados — passou.
- `pnpm run build` — passou.
- `./dev artisan view:cache` — passou.
- `./dev artisan migrate` — migration aplicada com sucesso.
- `git diff --check` — passou.
- PHPUnit após esta etapa: 76 testes, 292 asserções — passou.

## Arquivos principais desta correção

- `database/migrations/2026_09_08_040000_add_created_by_to_beneficiaries_and_properties.php`
- `database/migrations/2026_09_08_050000_add_network_metadata_to_proposal_status_histories.php`
- `app/Console/Commands/AssignLegacyOwner.php`
- `app/Models/ProposalStatusHistory.php`
- `app/Providers/AppServiceProvider.php`
- `app/Policies/BeneficiaryPolicy.php`
- `app/Policies/PropertyPolicy.php`
- `app/Policies/ProposalPolicy.php`
- `app/Models/Beneficiary.php`
- `app/Models/Property.php`
- `app/Models/Proposal.php`
- `app/Http/Controllers/BeneficiaryController.php`
- `app/Http/Controllers/PropertyController.php`
- `app/Http/Controllers/ProposalController.php`
- `app/Livewire/Beneficiaries/Form.php`
- `app/Livewire/Properties/Form.php`
- `app/Livewire/Proposals/Create.php`
- `tests/Feature/RegistrationWorkflowsTest.php`
- `tests/Feature/ProposalWorkflowTest.php`
- `tests/Feature/SecurityMaintenanceTest.php`

## Próximo passo exato

1. Ler este arquivo antes de qualquer alteração.
2. Executar inspeção manual com técnico de outra unidade nas URLs de detalhe, edição, impressão e tramitação.
3. Conferir que as listagens e seletores não exibem registros fora do escopo.
4. Testar a interface em viewport móvel e nos temas `corporate` e `business`.
5. Se surgir novo defeito, registrar aqui a rota, perfil, identificador, resposta esperada e arquivo provável antes de corrigir.

## Retomada desta etapa de segurança

- Para listar registros legados antes de alterar: `./dev artisan funderr:assign-legacy-owner ID --dry-run`.
- Para atribuir somente beneficiários: `./dev artisan funderr:assign-legacy-owner ID --model=beneficiaries`.
- Para atribuir somente propriedades: `./dev artisan funderr:assign-legacy-owner ID --model=properties`.
- Não executar a atribuição em produção sem aprovação do responsável pelos dados; o comando altera todos os registros selecionados cujo `created_by` ainda seja `NULL`.
- A auditoria implementada cobre tramitações de propostas. Auditoria de simples visualização/download e mascaramento específico por permissão fina continuam como evolução futura.
