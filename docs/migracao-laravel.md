# Migração do FUNDERR para Laravel

## Decisões confirmadas

- Aplicação interna do núcleo de crédito rural do IATER para elaborar propostas à Desenvolve RR.
- Laravel, autenticação por CPF e senha e interface em daisyUI com temas corporate e business.
- Horizon com filas em Redis.
- PostgreSQL como banco da nova aplicação.
- Os dados atuais são apenas testes; não será necessária importação para a nova versão.
- Deploy centralizado em um `docker-compose.yml`, com os serviços necessários.
- Arquivos privados em disco local usando `Storage` do Laravel; volume persistente compartilhado entre aplicação e Horizon.
- Perfis: técnico, equipe do núcleo e administrador. A mesma pessoa do núcleo pode conferir, devolver, liberar e registrar o envio; não há exigência de segunda aprovação.
- Envio ao banco por WhatsApp permanece manual.
- Referência documental: `docs/projeto final - versão antiga.pdf`.
- Contrato de assistência técnica disponível separadamente durante a elaboração para assinatura.
- Dossiê final reúne projeto, contrato assinado e demais anexos.
- Novos pré-projetos servirão de modelos para criar propostas.

## Decisões pendentes

- Novas tabelas, relacionamentos e obrigatoriedade de cada campo por etapa.
- Forma de provisionar usuários e recuperar senhas.

## Sequência de implementação

1. Registrar a referência de comportamento da aplicação atual.
2. Criar uma branch de migração e preparar a base Laravel e o Compose em ambiente separado dos dados atuais.
3. Configurar banco escolhido, Redis, Horizon e armazenamento privado compartilhado.
4. Implantar autenticação e autorização dos três perfis, incluindo downloads e painel do Horizon.
5. Migrar cadastros, cálculos e fluxo existente, verificando equivalência com os testes atuais.
6. Implementar o modelo de dados revisado e os pré-projetos após detalhar as novas regras.
7. Refazer as telas em daisyUI, usando Livewire onde necessário.
8. Implementar contrato separado, projeto final e montagem do dossiê por jobs.
9. Validar o fluxo técnico → núcleo → registro manual de envio e retorno do banco.
10. Ensaiar a importação, se necessária, e validar o deploy antes de substituir a instalação atual.

## Referência inicial

- Commit: `5ee9e9b` (`refactor: now the project is in PHP`).
- Verificação em 2026-09-07: `composer test`, oito testes aprovados.
- Repositório sem alterações antes deste documento.
- Branch de trabalho: `feat/laravel-migration`.
- Disponíveis no ambiente: PHP 8.5.10, Composer 2.10.3, Docker 29.8.0, Docker Compose 5.5.1 e Node 26.1.0.
- Disponibilidade do daemon Docker, construção de imagens e compatibilidade das dependências ainda não verificadas.

## Critérios de preservação

- Não substituir dados nem documentos existentes durante a preparação.
- Preservar as regras de cálculo e sequenciamento que não tenham mudança de negócio aprovada.
- Não converter ausências em valores fictícios apenas para satisfazer `NOT NULL`.
- Definir obrigatoriedade considerando elaboração, revisão e conclusão.
- Validar autorização no servidor para operações e arquivos.
- Registrar o autor das ações e preservar a versão do dossiê efetivamente enviada.

Este documento registra o ponto de partida; a aplicação ainda não foi convertida para Laravel.
