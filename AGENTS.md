# Repository Guidelines

## Project Structure & Module Organization

FUNDERR is a PHP 8.5 server-rendered application. Application services live in
`src/Application/`, HTTP controllers in `src/Controller/`, and routing/request helpers
in `src/Http/`. Domain objects and persistence adapters are under `src/Domain/` and
`src/Infrastructure/`. HTML templates are in `templates/`; browser assets and the
front controller are in `public/`. Database changes belong in ordered SQL files under
`migrations/` (for example, `008_add_report_fields.sql`). Tests use the custom runner
in `tests/run.php`. Keep historical analysis and spreadsheet-parity notes in `docs/`.

## Build, Test, and Development Commands

- `composer install` installs PHP dependencies and generates the PSR-4 autoloader.
- `composer migrate` applies pending SQLite migrations to `data/funderr.sqlite`.
- `composer start` serves the app on `0.0.0.0:8000` with visible request logs.
- `composer test` runs the complete automated test suite.
- `composer validate --strict` checks `composer.json` before dependency-related commits.
- `php -l path/to/file.php` performs a quick syntax check on an edited PHP file.

Run migrations and tests before presenting or submitting database-related changes.

## Coding Style & Naming Conventions

Use `declare(strict_types=1);`, four-space indentation, typed parameters, and explicit
return types. Follow PSR-4 namespaces rooted at `Funderr\`. Classes use PascalCase;
methods and variables use camelCase; database columns and migration names use
snake_case. Keep controllers focused on HTTP concerns and place validation,
calculations, and transactions in application services. Escape rendered values with
`View::escape()` and include `Csrf::field()` in every state-changing form.

## Testing Guidelines

Add regression tests to `tests/run.php` using descriptive Portuguese names, such as
`test('auditoria identifica o dispositivo responsável', ...)`. Use the in-memory
SQLite helper so every test runs against all migrations. Cover successful behavior,
validation failures, calculations, and workflow sequencing. No coverage threshold is
configured; changes should nevertheless exercise every new rule and bug fix.

## Commit & Pull Request Guidelines

History generally follows Conventional Commit prefixes: `feat:`, `fix:`, `refactor:`,
and `chore:`. Keep commits focused and use imperative summaries. Pull requests should
describe the business rule, affected workflow, migration impact, and verification
performed. Link the relevant issue or `docs/` analysis and include screenshots for UI
changes. Never commit SQLite databases, uploaded documents, credentials, or real
personal data.

## Security & Configuration

The current application has no authentication. Use it only on trusted local networks,
never expose the PHP development server directly to the internet, and anonymize all
examples used in tests or documentation.
