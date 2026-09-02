# FUNDERR PHP

Aplicação fullstack server-rendered para elaboração de projetos de crédito rural.

## Execução

Requisitos: PHP 8.2 ou superior, extensões PDO SQLite, mbstring e fileinfo, e Composer.

```bash
composer install
composer migrate
composer start
```

Abra `http://127.0.0.1:8000`. O sistema não possui autenticação e todas as funções ficam disponíveis diretamente.

O banco padrão fica em `data/funderr.sqlite` e os anexos privados em `data/documents`. Para testes ou instalações alternativas, use `FUNDERR_DATABASE_PATH` e `FUNDERR_DOCUMENTS_PATH`.

## Módulos migrados

- painel operacional;
- beneficiários e referências pessoais;
- propriedades e validação do vínculo com beneficiário;
- processos, completude e máquina de estados;
- patrimônio e dívidas;
- identificação, empregos, usos e fontes;
- fluxo de caixa de sete anos;
- financiamento SAC, garantias e capacidade de pagamento;
- documentos privados com confirmação humana;
- linhas de crédito, auditoria e configurações.

As páginas usam HTML semântico, formulários server-rendered e uma interface responsiva sem dependências de frontend.

## Validação

```bash
composer test
```
