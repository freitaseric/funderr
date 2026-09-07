# FUNDERR — Application Rules

## Scope and Migration Status

- FUNDERR is an internal IATER application for the rural credit team to prepare proposals for Desenvolve RR. Preserve the institutional restrictions in `LICENSE`; the Laravel scaffold's package metadata and README do not define FUNDERR's license.
- The root application is now Laravel 13, with PHP `^8.3` required by `composer.json`; the current development environment uses PHP 8.5. Confirm installed versions before relying on package APIs.
- `legacy/` holds the previous PHP application as a reference. Its business modules and regression tests have not yet been ported to the root application. Preserve calculations and workflow sequencing unless the user explicitly changes those business rules.
- Keep historical analysis and spreadsheet-parity references in `docs/`. See `docs/migracao-laravel.md` for migration decisions; verify implementation status against the code rather than treating the plan as completed work.

## Current Structure and Commands

- Application code uses the `App\` namespace in `app/`; controllers are in `app/Http/Controllers/`, models in `app/Models/`, and providers in `app/Providers/`. Fortify's generated actions are in `app/Actions/Fortify/`.
- Routes are in `routes/`, Blade templates in `resources/views/`, frontend source in `resources/css/` and `resources/js/`, and the web entry point in `public/`.
- Add Laravel migrations under `database/migrations/`. The SQL files in `legacy/migrations/` belong to the old application.
- Root tests use PHPUnit under `tests/Feature/` and `tests/Unit/`; `legacy/tests/run.php` is the old custom runner, not part of the root test suite.
- `composer install` installs locked PHP dependencies and generates the autoloader. `composer test` runs the root Laravel tests; it does not establish parity with the legacy application.
- Use `php artisan migrate` for the configured database. The root project no longer has `composer migrate` or `composer start` scripts. `composer run dev` runs the scaffold's development command, not the planned production deployment.
- `npm run dev` runs Vite; `npm run build` builds frontend assets. Use `composer validate --strict` for dependency metadata changes and `php -l path/to/file.php` for targeted PHP syntax checks.
- Before database changes, confirm the target connection. Validate migrations and relevant tests against an isolated database; do not run migrations on operational data merely to verify a change. `composer run setup` includes migrations and key generation, so it is not a harmless dependency-install shortcut.

## Business Requirements — Approved, Not Yet Fully Implemented

- Use PostgreSQL for the new application, Horizon with Redis queues, and a single `docker-compose.yml` for deployment. No Compose file exists at this stage; the scaffold still defaults to SQLite and database queues when environment variables do not override them.
- Use private local storage through Laravel's `Storage` abstraction, with a persistent volume shared by the application and Horizon. The configured local disk currently points to `storage/app/private`; shared container storage is still to be implemented.
- Implement CPF/password authentication and the profiles Técnico, Equipe do núcleo, and Administrador. Fortify is installed, but its current username field is still `email`; the business profiles and access rules are not implemented yet.
- Technicians prepare proposals. The nucleus team checks them, returns them for correction, releases the dossier, and records submission and the bank's response. The same nucleus user may perform all those steps; do not introduce mandatory second-person approval.
- Submission to Desenvolve RR remains manual through WhatsApp. Downloading a dossier must not automatically count as submission, and release by the nucleus is distinct from approval by the bank.
- Use `docs/projeto final - versão antiga.pdf` as the final project template despite its filename. Make the technical assistance contract available separately for signing during preparation; the complete dossier includes the signed contract and attachments.
- Pre-projects will provide reusable proposal templates. Their detailed schema and field requirements still need definition. Distinguish data required at creation from data required to complete a stage; do not insert fictitious empty strings or zeros merely to satisfy `NOT NULL`.
- Existing data is test data and does not require import. This is not an instruction to delete existing files during unrelated work.

## Coding and Regression Rules

- Follow `.editorconfig` and the installed Pint conventions. Keep PascalCase class names, camelCase methods and variables, explicit types, and snake_case database columns.
- Keep controllers focused on HTTP concerns and business calculations and transactions out of templates. The new application is mostly scaffolding; do not claim that a complete service or repository architecture has already been established.
- In Blade, use escaped `{{ ... }}` output for untrusted values and `@csrf` in state-changing forms. `View::escape()` and `Csrf::field()` are legacy helpers, not the root application's conventions.
- Add regression coverage for migrated calculations, validation failures, successful workflows, stage sequencing, and authorization boundaries. Use descriptive business-oriented test names; Portuguese descriptions remain appropriate.
- The current `phpunit.xml` uses in-memory SQLite and synchronous queues. Do not mistake those defaults for PostgreSQL or Redis integration coverage; validate database-specific and asynchronous behavior with the intended services when implementing those features.

## Commits, Reviews, and Data Protection

- Prefer the smallest complete change and avoid unrelated edits. Use focused Conventional Commit messages such as `feat:`, `fix:`, `refactor:`, and `chore:` with imperative summaries.
- PRs should describe the business rule, affected workflow, migration impact, and verification performed. Link relevant issues or `docs/` references, and include screenshots for UI changes.
- Never commit databases, uploaded documents, credentials, or real personal data. Use anonymized examples in tests and documentation; keep private attachments out of publicly linked storage.
- This remains an internal system. Do not expose the PHP development server directly to the internet. Installed authentication packages do not prove that CPF login, business permissions, or document access are ready for operational use.

<laravel-boost-guidelines>
=== foundation rules ===

# Laravel Boost Guidelines

The Laravel Boost guidelines are specifically curated by Laravel maintainers for this application. These guidelines should be followed closely to ensure the best experience when building Laravel applications.

## Foundational Context

This application is a Laravel application running on PHP 8.5. You are an expert with the Laravel ecosystem. Always use the APIs that match the installed major version of each package — do not assume a version.

Before relying on a package's API, confirm its installed version:

- PHP packages: run `composer show --direct` to list direct dependencies with versions, or `composer show <vendor/package>` for a single package.
- JS packages: check `package.json` for the installed versions.

## Skills Activation

This project has domain-specific skills available in `**/skills/**`. You MUST activate the relevant skill whenever you work in that domain—don't wait until you're stuck.

## Conventions

- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, and naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts

- Do not create verification scripts or tinker when tests cover that functionality and prove they work. Unit and feature tests are more important.

## Application Structure & Architecture

- Stick to existing directory structure; don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Frontend Bundling

- If the user doesn't see a frontend change reflected in the UI, it could mean they need to run `npm run build`, `npm run dev`, or `composer run dev`. Ask them.

## Documentation Files

- You must only create documentation files if explicitly requested by the user.

## Replies

- Be concise in your explanations - focus on what's important rather than explaining obvious details.

=== boost rules ===

# Laravel Boost

## Tools

- Laravel Boost is an MCP server with tools designed specifically for this application. Prefer Boost tools over manual alternatives like shell commands or file reads.
- Use `database-query` to run read-only queries against the database instead of writing raw SQL in tinker.
- Use `database-schema` to inspect table structure before writing migrations or models.
- Use `get-absolute-url` to resolve the correct scheme, domain, and port for project URLs. Always use this before sharing a URL with the user.
- Use `browser-logs` to read browser logs, errors, and exceptions. Only recent logs are useful, ignore old entries.

## Searching Documentation (IMPORTANT)

- Use `search-docs` before changes that depend on Laravel ecosystem APIs, behavior, configuration, or version-specific syntax. Skip it for copy-only edits and other changes where package documentation is irrelevant. Reuse sufficient results already in context instead of searching again.
- Pass a `packages` array to scope results when you know which packages are relevant.
- Use multiple broad, topic-based queries: `['rate limiting', 'routing rate limiting', 'routing']`. Expect the most relevant results first.
- Do not add package names to queries because package info is already shared. Use `test resource table`, not `filament 4 test resource table`.

### Search Syntax

1. Use words for auto-stemmed AND logic: `rate limit` matches both "rate" AND "limit".
2. Use `"quoted phrases"` for exact position matching: `"infinite scroll"` requires adjacent words in order.
3. Combine words and phrases for mixed queries: `middleware "rate limit"`.
4. Use multiple queries for OR logic: `queries=["authentication", "middleware"]`.

## Project Rules

- This project contains committed, area-grouped rules in `.ai/rules` when that directory exists (settled decisions, non-obvious traps, standing constraints). Framework and package guidelines that only apply to specific paths (testing, frontend, components) also live there, under `.ai/rules/boost` — this is not just recorded decisions, it is load-bearing guidance you have not seen inline. Before you enter plan mode or create/edit any file, you MUST first: open @.ai/rules/index.md (it maps file globs to rule files), read every rule file whose globs cover the path(s) in scope, and run `grep -rin 'keyword' .ai/rules` to catch what a path match alone misses. Do not write code until you have read and are following every matching rule. If `.ai/rules` does not exist, continue without it.
- Record durable rules with `record-rule` so the next agent or teammate inherits them instead of working them out again. Pass a `glob` (e.g. `app/Http/Controllers/**`), a short `title`, and a few-line `note`. Always use `record-rule`, never your native memory or notes tool — native memory is personal and session-scoped; only `.ai/rules` is shared with the team and persists in the repo.

## Artisan

- Run Artisan commands directly via the command line (e.g., `php artisan route:list`). Use `php artisan list` to discover available commands and `php artisan [command] --help` to check parameters.
- Inspect routes with `php artisan route:list`. Filter with: `--method=GET`, `--name=users`, `--path=api`, `--except-vendor`, `--only-vendor`.
- Read configuration values using dot notation: `php artisan config:show app.name`, `php artisan config:show database.default`. Or read config files directly from the `config/` directory.

## Tinker

- Execute PHP in app context for debugging and testing code. Do not create models without user approval, prefer tests with factories instead. Prefer existing Artisan commands over custom tinker code.
- Always use single quotes to prevent shell expansion: `php artisan tinker --execute 'Your::code();'`
  - Double quotes for PHP strings inside: `php artisan tinker --execute 'User::where("active", true)->count();'`

=== php rules ===

# PHP

- Always use curly braces for control structures, even for single-line bodies.
- Use PHP 8 constructor property promotion: `public function __construct(public GitHub $github) { }`. Do not leave empty zero-parameter `__construct()` methods unless the constructor is private.
- Use explicit return type declarations and type hints for all method parameters: `function isAccessible(User $user, ?string $path = null): bool`
- Use TitleCase for Enum keys: `FavoritePerson`, `BestLake`, `Monthly`.
- Prefer PHPDoc blocks over inline comments. Only add inline comments for exceptionally complex logic.
- Use array shape type definitions in PHPDoc blocks.

=== deployments rules ===

# Deployment

- Laravel can be deployed using [Laravel Cloud](https://cloud.laravel.com/), which is the fastest way to deploy and scale production Laravel applications.

=== laravel/core rules ===

# Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using `php artisan list` and check their parameters with `php artisan [command] --help`.
- If you're creating a generic PHP class, use `php artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

### Model Creation

- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `php artisan make:model --help` to check the available options.

## APIs & Eloquent Resources

- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

## URL Generation

- When generating links to other pages, prefer named routes and the `route()` function.

## Testing

- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] {name}` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

## Vite Error

- If you receive an "Illuminate\Foundation\ViteException: Unable to locate file in Vite manifest" error, you can run `npm run build` or ask the user to run `npm run dev` or `composer run dev`.

=== livewire/core rules ===

# Livewire

- Livewire allows you to build dynamic, reactive interfaces in PHP without writing JavaScript.
- You can use Alpine.js for client-side interactions instead of JavaScript frameworks.
- Keep state server-side so the UI reflects it. Validate and authorize in actions as you would in HTTP requests.

=== pint/core rules ===

# Laravel Pint Code Formatter

- If you have modified any PHP files, you must run `vendor/bin/pint --dirty --format agent` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test --format agent`, simply run `vendor/bin/pint --format agent` to fix any formatting issues.

=== phpunit/core rules ===

# PHPUnit

- This project uses PHPUnit. Create tests with `php artisan make:test --phpunit {name}`.
- Do not include the test suite directory in `{name}`. Use `SomeFeatureTest`, not `Feature/SomeFeatureTest`.
- Read the `testing-best-practices` skill for guidance on coverage, naming, structure, dependency isolation, and review.

## Running Tests

- Run the narrowest set of tests that covers the change. Pass a file path or `--filter=testName` to `php artisan test --compact`.
- Rerun a test after each change to it.
- Run `vendor/bin/phpunit` to call the test runner directly. It accepts the same file path and `--filter=testName` arguments.

</laravel-boost-guidelines>
