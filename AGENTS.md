# Repository Guidelines

## Project Context

FUNDERR is an internal operational application used by the rural-credit team at
IATER to prepare, review, correct, release, and track rural-credit proposals sent
to Desenvolve RR.

This is not a marketing website and not a generic SaaS dashboard.

The interface should feel:

* professional
* institutional
* calm
* trustworthy
* efficient
* information-dense without feeling cluttered
* consistent across the entire workflow

Prioritize clarity, workflow efficiency, and visual consistency over novelty.

---

## Project Structure & Module Organization

This is a Laravel application.

Application code lives in `app/`, including models, controllers, policies, services,
jobs, Livewire components, enums, and validation rules.

HTTP and console routes are in `routes/`.

Database migrations, factories, and seeders are in `database/`.

Blade templates and frontend assets are under:

* `resources/views/`
* `resources/js/`
* `resources/css/`

Tests are split into:

* `tests/Feature/`
* `tests/Unit/`

The previous implementation is preserved in `legacy/` for reference.

Supporting documents and images are in `docs/` and `public/`.

Do not treat `legacy/` as an architectural reference for the new application unless
the task explicitly concerns compatibility or business behavior. It may be consulted
to understand workflows, terminology, and required data.

---

## Build, Test, and Development Commands

* `composer install` installs PHP dependencies.
* `pnpm install` installs frontend dependencies.
* `pnpm run build` compiles frontend assets.
* `composer test` clears configuration and runs the Laravel test suite.
* `vendor/bin/pint --dirty` formats changed PHP files.
* `docker compose up -d --build --wait` starts the application and supporting services.
* `docker compose run --rm app php artisan migrate` applies database migrations.

For initial setup:

1. copy `.env.example` to `.env`;
2. run `php artisan key:generate`;
3. start the Docker environment;
4. access the application at `http://localhost:8080`.

Prefer running application-dependent commands inside the Docker environment when the
behavior depends on PostgreSQL, Redis, Horizon, queues, or other container services.

---

## Coding Style & Naming Conventions

Use four-space PHP indentation and follow PSR-12 and Laravel conventions.

Naming conventions:

* classes: `PascalCase`
* methods and variables: `camelCase`
* database fields: `snake_case`
* configuration keys: `snake_case`

Livewire components should be organized by domain, for example:

`app/Livewire/Proposals/`

Keep domain calculations, workflow rules, and business decisions outside Blade views.

Prefer domain services in `app/Services/` where business logic would otherwise be
duplicated or become difficult to test.

Run Pint before submitting PHP changes.

Do not introduce a new architectural pattern when an established Laravel pattern
already solves the problem.

---

# Frontend & UI/UX Constitution

These rules apply to every change involving Blade, Livewire markup, Tailwind,
daisyUI, CSS, frontend JavaScript, layouts, or reusable UI components.

## Core Principle

**Consistency is more important than novelty.**

The application must look and behave like one coherent product.

A solution that matches the existing interface is preferable to a theoretically
more fashionable solution that introduces a new visual convention.

Do not casually redesign the application while implementing a feature.

A feature request is not permission to change unrelated UI.

---

## Source of Visual Truth

There is currently no external Figma design system.

Therefore, determine visual intent using the following priority order:

1. explicit instructions from the current task;
2. established application shell and layouts;
3. existing screens implementing the same or a similar workflow;
4. existing shared Blade or Livewire components;
5. dominant patterns repeated across the application;
6. existing Tailwind and daisyUI configuration;
7. daisyUI semantic primitives and defaults;
8. only then, a new visual pattern.

Never invent a new visual language simply because a page does not have an exact
existing equivalent.

When multiple implementations conflict, prefer the pattern that is:

* used most consistently;
* used by the closest related workflow;
* simpler;
* more accessible;
* easier to reuse.

Do not infer a system-wide design rule from one isolated screen.

---

## Mandatory UI Reconnaissance

Before creating or substantially modifying an interface, inspect the relevant
existing implementation.

At minimum, check when applicable:

* the parent layout;
* the nearest related screen;
* reusable components in `resources/views/components/`;
* related Livewire components;
* `resources/css/`;
* Tailwind and daisyUI configuration;
* existing forms, buttons, cards, tables, alerts, badges, and navigation patterns.

For a new page, identify the closest existing page and reuse its structural language.

Do not start by creating new components or styling conventions.

Start by discovering what already exists.

---

## Design System

The frontend uses Tailwind CSS and daisyUI.

The supported application themes are:

* `corporate`
* `business`

All new UI must work correctly and remain visually coherent in both themes.

Prefer semantic daisyUI theme tokens, including concepts such as:

* `primary`
* `secondary`
* `accent`
* `neutral`
* `base-100`
* `base-200`
* `base-300`
* `base-content`
* `info`
* `success`
* `warning`
* `error`

Do not hardcode hexadecimal, RGB, HSL, or arbitrary colors in feature UI when a
semantic theme token can express the intent.

Raw color values belong only in intentional theme configuration or exceptional
cases with a documented reason.

Do not create a new color palette as part of a feature.

---

## Visual Language

FUNDERR should favor restrained institutional design over decorative SaaS styling.

Prefer:

* strong alignment;
* predictable spacing;
* restrained use of color;
* clear typography hierarchy;
* subtle surfaces;
* meaningful grouping;
* readable data density;
* obvious primary actions;
* quiet secondary actions.

Avoid unless explicitly requested:

* gradients used as decoration;
* glassmorphism;
* glow effects;
* oversized shadows;
* excessive animations;
* decorative background shapes;
* huge marketing-style headings;
* excessive rounded containers;
* nested cards;
* unnecessary badges;
* color used purely for decoration;
* giant empty spaces;
* dashboard decoration that carries no information.

Do not make every section a card.

Use whitespace, typography, alignment, and grouping before introducing another
bordered container.

---

## Layout

Preserve the established application shell.

Without explicit authorization, do not change:

* sidebar structure;
* top navigation;
* global content width;
* page shell;
* global spacing scale;
* global typography;
* theme definitions;
* default component appearance.

Pages belonging to the same workflow should share the same layout structure.

Keep major page actions in predictable locations.

Avoid arbitrary widths such as one-off pixel values when Tailwind's existing scale
or the project's established layout can solve the problem.

Do not introduce horizontal scrolling except where genuinely required by dense data,
such as wide tables.

---

## Spacing

Use the existing Tailwind spacing scale.

Similar relationships should use similar spacing.

Examples:

* label → field spacing should be consistent;
* section → section spacing should be consistent;
* title → supporting text spacing should be consistent;
* table controls → table spacing should be consistent.

Avoid arbitrary values such as:

`mt-[13px]`, `gap-[19px]`, `w-[783px]`

unless there is a concrete technical reason.

Visual rhythm matters more than filling every available area.

---

## Typography

Reuse the established typography hierarchy.

Do not introduce arbitrary font sizes or font weights.

A typical page should establish an obvious hierarchy between:

* page title;
* optional page description;
* section title;
* primary content;
* supporting content;
* metadata.

Do not bold everything.

Do not use oversized headings merely to make a page appear modern.

Operational applications benefit from compact, readable typography.

---

## Buttons & Actions

A screen should normally have one visually dominant primary action.

Use visual hierarchy to distinguish:

* primary actions;
* secondary actions;
* tertiary actions;
* destructive actions.

Do not give every action the same visual emphasis.

Do not invent a new button style when daisyUI or an existing application pattern
already covers the action.

Keep actions for similar workflows in consistent positions.

Destructive actions must be visually distinguishable and should not sit where they
can be triggered accidentally.

Icons must not replace text when their meaning is ambiguous.

Reuse the icon system already present in the project. Do not introduce another icon
library solely for one feature.

Do not use emoji as application interface icons.

---

## Forms

Forms are a major part of FUNDERR and must prioritize speed, clarity, and error
prevention.

Maintain consistency in:

* label placement;
* input heights;
* field spacing;
* required indicators;
* helper text;
* validation errors;
* disabled states;
* readonly states;
* focus states;
* action placement.

Group fields according to the user's task and domain meaning, not merely according
to database structure.

Avoid unnecessarily long single-column forms on large screens when related fields
can be grouped clearly.

Do not create dense multi-column layouts when field relationships become ambiguous.

Validation errors must appear close to the field that caused them.

Do not rely on placeholder text as the only field label.

---

## Tables & Operational Data

For operational datasets, prefer tables or structured lists over grids of cards.

Optimize tables for:

* scanning;
* comparison;
* alignment;
* useful density;
* predictable actions;
* readable statuses.

Avoid oversized table rows and excessive vertical padding.

Numeric values should be aligned consistently.

Actions should not dominate the data they act upon.

Use badges only when they meaningfully improve recognition of states or categories.

Do not turn ordinary text values into badges merely for decoration.

---

## Cards

Cards are containers, not the default solution for every group of content.

Use a card when the content genuinely benefits from being perceived as a distinct
surface or unit.

Avoid:

* card inside card inside card;
* a card for every metric;
* cards used only to create spacing;
* unrelated radius and shadow combinations.

If hierarchy can be achieved using headings and spacing, prefer that.

---

## Feedback & Application States

Every meaningful asynchronous or workflow action must consider:

* loading;
* success;
* validation failure;
* server failure;
* disabled;
* empty;
* readonly states where relevant.

Empty states should explain what is missing and, when appropriate, what the user can
do next.

Do not make empty states visually louder than populated screens.

Success feedback should confirm completion without interrupting the workflow
unnecessarily.

Errors should be actionable whenever possible.

---

## Responsive Design

Responsive behavior must be intentional.

Do not consider a layout responsive merely because columns eventually stack.

Check:

* hierarchy;
* navigation;
* forms;
* tables;
* actions;
* overflow;
* wrapping;
* touch targets;
* reading order.

Preserve desktop efficiency. FUNDERR is an operational system and desktop usage
must not be degraded merely to simplify mobile implementation.

On smaller screens, prioritize the information and actions required to complete the
current task.

---

## Accessibility

Preserve semantic HTML.

Every interactive control must have an accessible purpose.

Maintain:

* visible keyboard focus;
* proper labels;
* semantic buttons and links;
* sufficient contrast;
* keyboard navigation;
* accessible names for icon-only controls;
* clear validation feedback.

Do not simulate buttons with non-interactive HTML elements when a real button is
appropriate.

Accessibility is part of implementation quality, not optional polish.

---

## Component Reuse

Before creating a new reusable UI component:

1. search for an existing component;
2. search for an existing implementation of the same pattern;
3. determine whether an existing component can be extended cleanly;
4. use a daisyUI primitive when appropriate;
5. create a new component only when the pattern is genuinely distinct or reusable.

Prefer:

existing project component
→ established project pattern
→ daisyUI primitive
→ new reusable component
→ one-off custom implementation

Do not create nearly identical components with slightly different styling.

Do not modify a global component to solve a single local problem unless the global
change is intentionally desired across all usages.

---

## Preventing Visual Drift

Do not change global design rules as a side effect of implementing a feature.

In particular, avoid modifying these unless the task explicitly requires it:

* theme configuration;
* global CSS;
* application layout;
* navigation structure;
* default radius;
* global spacing;
* default typography;
* shared button styling;
* shared input styling;
* shared table styling.

If an unrelated inconsistency is discovered, report it separately rather than
silently redesigning it.

Do not perform opportunistic UI cleanup outside the requested scope.

---

## Designing New Screens

When no equivalent screen exists, do not freestyle immediately.

First determine:

1. the user's primary goal;
2. the information hierarchy;
3. the primary action;
4. secondary actions;
5. required states;
6. the closest existing layout;
7. reusable components;
8. responsive behavior.

Then implement the simplest interface that communicates the hierarchy clearly.

A new screen should still look like FUNDERR even when its exact pattern has never
existed before.

---

## Improving Existing UI

When asked to make an interface "better", "cleaner", "modern", or "more professional",
do not interpret that as permission to replace the design language.

Prioritize improvements in this order:

1. information hierarchy;
2. alignment;
3. spacing consistency;
4. typography;
5. density;
6. grouping;
7. action hierarchy;
8. responsive behavior;
9. feedback states;
10. decorative styling.

Prefer removing unnecessary visual elements before adding new ones.

---

## Visual Validation

A frontend task is not complete merely because the markup compiles.

After meaningful UI changes:

1. build the frontend;
2. run the application;
3. inspect the resulting page in a real browser when browser tooling is available;
4. inspect at least one desktop viewport;
5. inspect a smaller viewport when the screen is expected to be responsive;
6. verify both `corporate` and `business` themes when theme-sensitive UI was changed;
7. compare the page with adjacent application screens;
8. check alignment, spacing, hierarchy, overflow, and interaction states;
9. correct visible regressions before finishing.

If browser automation or screenshot tooling is available, use it for frontend work.

Do not claim visual correctness solely from reading HTML or CSS.

---

## UI Self-Review

Before completing a frontend task, verify:

* Does this look like the same application as surrounding screens?
* Did I introduce a new visual convention unnecessarily?
* Did I duplicate an existing component?
* Did I add arbitrary spacing, sizing, or colors?
* Did I overuse cards, badges, borders, shadows, or rounded surfaces?
* Is the primary action obvious?
* Is important information easy to scan?
* Are forms and tables consistent with related screens?
* Does the interface work in both supported themes?
* Did I accidentally change unrelated UI?
* Did I inspect the rendered result when possible?

If the answer reveals visual drift, fix it before considering the task complete.

---

## Testing Guidelines

Tests use PHPUnit through Laravel's runner and generally run against in-memory SQLite.

Name tests descriptively with a `Test` suffix.

Use:

* `tests/Feature/` for HTTP, Livewire, workflow, authentication, and authorization behavior;
* `tests/Unit/` for isolated domain behavior.

Add or update tests for changed:

* business rules;
* authentication;
* authorization;
* calculations;
* workflow transitions.

Check PostgreSQL, Redis, Horizon, queues, and related behavior in Docker when the
change depends on those services.

Frontend changes must also pass the frontend build.

---

## Commit & Pull Request Guidelines

Recent commits use prefixes such as:

* `feat:`
* `fix:`
* `refactor:`
* `docs:`
* `test:`
* `chore:`

Follow that convention.

Keep commits focused.

Commit messages and pull requests should explain the user-visible or domain impact,
not merely list changed files.

Pull requests should describe:

* what changed;
* why;
* testing performed;
* migration requirements;
* configuration requirements;
* relevant security implications.

Include screenshots for meaningful UI changes when screenshot tooling is available.

Link the related issue or task when one exists.

---

## Security & Configuration

Never commit:

* `.env` files;
* credentials;
* secrets;
* real personal data;
* databases;
* private attachments.

The application is still under migration and must not receive real operational data
until authentication and access controls are fully validated.

Treat rural-credit proposal data and applicant information as sensitive.

Do not expose private files through public storage merely to simplify implementation.

---

## Scope Discipline

Implement the requested change completely, but do not reinterpret unrelated parts of
the product.

Before changing shared architecture, global styles, layouts, or design-system
primitives, determine whether the requested feature actually requires that change.

Prefer the smallest coherent change that solves the product problem.

When a larger redesign or refactor would be beneficial but is outside scope, mention
it separately instead of silently including it.
