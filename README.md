# FUNDERR

Sistema interno do Instituto de Assistência Técnica e Extensão Rural do Estado de
Roraima (IATER) para elaboração e gestão de projetos de crédito rural destinados à
Desenvolve RR.

## Estado da migração

A aplicação está sendo migrada para Laravel. A infraestrutura já contém PostgreSQL,
Redis, Horizon, scheduler, PHP-FPM e Nginx. O código anterior permanece em `legacy/`
como referência para transportar as regras de negócio e os testes.

A autenticação por CPF, os perfis operacionais e os módulos de propostas ainda estão
em implementação. Esta versão não deve receber dados reais até a conclusão e a
validação desses controles.

## Execução com Docker

Copie o arquivo de ambiente e defina uma senha própria para o PostgreSQL:

```bash
cp .env.example .env
php artisan key:generate
```

Construa e inicie os serviços e aplique as migrations:

```bash
docker compose up -d --build --wait
docker compose run --rm app php artisan migrate
```

A aplicação fica disponível em `http://localhost:8080`. Durante o desenvolvimento,
o painel do Horizon fica em `http://localhost:8080/horizon`.

## Desenvolvimento e validação

```bash
composer install
pnpm install
pnpm run build
composer test
vendor/bin/pint --dirty
composer validate --strict
```

Os testes locais usam SQLite em memória. Funcionalidades específicas de PostgreSQL,
Redis e processamento assíncrono também devem ser verificadas nos containers.

## Dados e documentos

Arquivos privados são armazenados pelo disco local do Laravel em um volume
persistente compartilhado entre a aplicação e o Horizon. Bancos, anexos,
credenciais e dados pessoais reais nunca devem ser adicionados ao Git.

## Licença

Software proprietário do IATER. Consulte [LICENSE](LICENSE).
