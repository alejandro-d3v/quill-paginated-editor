# AGENTS.md — quill-paginated-editor

This is the operational manual for AI coding agents working in this repository. It is derived from the actual repository configuration and code, not from generic Angular guidance. The repository is the primary source of truth: when this document and the code disagree, verify against the code and prefer the smallest change consistent with both.

**Workflow (mandatory order):** Understand → Analyze → Plan → Implement → Validate.

**Minimum bar for any change:** `npm run lint` + `npm run build` clean (or honestly reported as not run). Tests when touching tested logic.
**Session start:** read `MEMORY.md` (state, decisions, pitfalls) before touching code.
**Session end:** update `MEMORY.md`. See #5 → Memoria.

## 0. How to Use This Document

- **You are an AI coding agent** operating in this repository. This file is your contract, not background reading.
- Read #1 (principles) and #15 (decision making) before any non-trivial change.
- Section order matters: principles override conventions; conventions override personal preference.
- When instructions conflict, resolve by #15, not by recency or convenience.
- For behavior expectations (when to ask, when to propose alternatives, how to respond), see #5.
- For pre-flight checks, see #16.

## Table of Contents

1. [Repository Overview](#1-repository-overview)
2. [Technology Stack](#2-technology-stack)
3. [Repository Structure](#3-repository-structure)
4. [Architecture](#4-architecture)
5. [Agent Behavior](#5-agent-behavior)
6. [Development Workflow](#6-development-workflow)
7. [TypeScript Rules](#7-typescript-rules)
8. [Angular Rules (v21)](#8-angular-rules-v21)
9. [State Management](#9-state-management)
10. [RxJS](#10-rxjs)
11. [Quill Integration](#11-quill-integration)
12. [UI, Accessibility, and Security](#12-ui-accessibility-and-security)
13. [Styling, Performance, and Validation](#13-styling-performance-and-validation)
14. [Infrastructure, Dependencies, and Testing](#14-infrastructure-dependencies-and-testing)
15. [Validation Commands](#15-validation-commands)
16. [Decision Making](#16-decision-making)
17. [Final Checklist](#17-final-checklist)

## 1. Repository Overview

- **Product**: A paginated document editor built on top of [Quill 2.x](https://quilljs.com/) — content is displayed as physical pages (A4/Letter/Legal, orientation, margins, headers/footers, page numbers, page breaks) instead of one continuous editor.
- **Status**: Experimental MVP under active development. The current app is a scaffold: a root shell with lazy routing, a `home` feature page, and a placeholder `editor` shared component. Quill is installed and its stylesheet is registered, but no component uses it yet. Expect significant API/architecture churn; consult `README.md` before large changes.

### Non-negotiable product principles (from README)

1. **Quill Delta is the source of truth.** The DOM is for rendering and layout measurement only — never the canonical document model.
2. **Pagination is derived state.** Recompute it from Delta; never mutate the original Delta to paginate.
3. **Never modify or fork Quill's core.** Extend via Quill APIs, Quill modules, custom Blots, Angular components, layout/pagination services, DOM measurement, and CSS. A Quill fork is a last resort requiring explicit user approval.
4. **Never paginate by character count.** Pagination is based on rendered dimensions.
5. **Never silently lose document content.**
6. **Keep pagination and PDF generation as separate concerns** from editing.
7. Prefer small, testable services.
8. Measure performance before optimizing.

## 2. Technology Stack

**Observed — in use (verified in `package.json`, `angular.json`, `eslint.config.mjs`):**

| Technology     | Version                                                                                                         | Notes                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Angular        | ^21.2                                                                                                           | Standalone APIs, signals, zoneless (no `zone.js` dependency).               |
| TypeScript     | ~5.9                                                                                                            | `strict` + strict Angular compiler options.                                 |
| Quill          | ^2.0.3                                                                                                          | Editor engine. Snow theme CSS registered globally in `angular.json`.        |
| RxJS           | ~7.8                                                                                                            | Available; almost no usage yet.                                             |
| SCSS           | —                                                                                                               | Global (`src/styles.scss`) + colocated component styles.                    |
| ESLint         | 10 + angular-eslint 22 + typescript-eslint 8 (`strictTypeChecked`, `stylisticTypeChecked`) + simple-import-sort | Major source of project conventions.                                        |
| Prettier       | 3.9                                                                                                             | Formatting: 100 cols, single quotes, semicolons, trailing commas `es5`, LF. |
| Vitest + jsdom | via `@angular/build:unit-test`                                                                                  | `npm test`; specs use vitest globals.                                       |

**Available but not yet used** (do not treat as established): `@angular/forms` (prefer Reactive Forms when forms appear), RxJS patterns, `NgOptimizedImage` (no images yet). `provideHttpClient` is **not** configured.

**Not present — do not introduce without explicit justification**: SSR/server rendering, NgRx or any state library, Tailwind or any CSS/utility framework, UI component libraries, environment files, HTTP/API layer, CI/CD, Docker. None of these exist in the repository today.

## 3. Repository Structure

```
src/
├── index.html                  # SPA shell, <app-root>
├── main.ts                     # bootstrapApplication (client-only)
├── styles.scss                 # global styles (currently empty)
└── app/
    ├── app.ts|html|scss|spec   # root shell: <router-outlet /> only
    ├── app.config.ts            # provideBrowserGlobalErrorListeners + provideRouter
    ├── app.routes.ts            # lazy loadChildren per feature; '**' → ''
    ├── common/                  # cross-feature, reusable code
    │   └── components/editor/   # intended Quill wrapper (placeholder)
    └── home/                    # feature folder
        ├── home.routes.ts       # exports HOME_ROUTES
        └── pages/home/          # feature page (placeholder)
public/                          # static assets copied verbatim (favicon.ico)
```

### Naming conventions (observed)

- **Component classes**: `App`, `Home`, `Editor` — no `Component` suffix (Angular v20+ style guide).
- **Files**: kebab-case, no type suffix — `home.ts`, `home.html`, `home.scss`, `home.spec.ts` — colocated siblings sharing a basename. `templateUrl`/`styleUrl` paths are relative to the component TS file.
- **Routes**: root `app.routes.ts` exports `routes`; each feature owns `<feature>.routes.ts` exporting a `<FEATURE>_ROUTES` constant (e.g. `HOME_ROUTES`), lazy-loaded via `loadChildren`; pages lazy-loaded via `loadComponent`.
- **Selectors**: components `app-<kebab-case>` (element), directives `app<camelCase>` (attribute). Prefix `app` enforced by ESLint and `angular.json`.
- **No barrel files** (`index.ts`).
- **Imports**: no path aliases resolve today — use relative imports. ESLint's import-sort reserves a group for a future `@common` alias, but `tsconfig.json` has no `paths` mapping, so `@common/...` imports will not compile unless that mapping is deliberately added first.
- **Import order** (ESLint error): Angular first, then third-party, then internal aliases, then parent/sibling relative imports. `npm run lint:fix` auto-fixes ordering.

## 4. Architecture

Current architecture is minimal and **feature-based**:

- `app/` — root shell, global providers, top-level routing.
- `<feature>/` — self-contained lazy-loaded feature folders (`home/` today) containing `pages/`.
- `common/` — reusable, feature-agnostic code (the `editor` wrapper today; future layout/pagination services belong here).

Target domain architecture (README, guiding principle — not yet implemented):

```
Quill Editor → Delta → Document Model → Pagination Engine → { Paginated View, PDF Renderer }
```

- Quill integration lives behind an Angular wrapper component (`common/components/editor`); the rest of the app interacts through `input()`/`output()` and signals.
- Pagination logic belongs in standalone services (layout/pagination), decoupled from the editor component and from rendering.
- Treat Delta as the model and pagination output as derived view state (recomputed, not stored as a second source of truth).
- **API/data access**: none exists (`provideHttpClient` is not configured). If a backend is introduced, isolate HTTP in `providedIn: 'root'` services with strongly typed request/response models, and treat responses as untrusted data. Ask before building a large data layer.
- SOLID and modular design are guidelines, not ceremonies. Use the simplest architecture that keeps responsibilities clear; avoid abstractions the current MVP complexity does not justify.

## 5. Agent Behavior

Behavioral rules for how to act, ask, and respond. These override convenience.

### Autonomy

Act autonomously when the repository provides sufficient context; make reasonable engineering decisions and continue. Ask the user only when:

- Critical information is missing.
- Requirements conflict.
- A decision has significant business impact.
- A destructive or breaking change is required.
- A major architectural decision cannot reasonably be inferred.
- Secrets or credentials are needed.

### Better alternatives

Do not blindly implement a technically inferior request, and do not replace technologies based on personal preference. Identify the issue, explain the trade-off, propose the alternative, and choose it when the context clearly supports it.

### Response format

Structure implementation responses as:

1. **Requirement Analysis** — brief understanding of the request.
2. **Technical Approach** — chosen strategy.
3. **Implementation Plan** — files and expected changes (before modifying code).
4. **Implementation** — what changed.
5. **Validation** — what was verified and which commands actually ran.
6. **Risks and Considerations** — limitations and future concerns.

Abbreviate freely for trivial changes.

### Memoria

- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones tomadas.
- Al terminar una tarea, actualízalo: estado actual, decisiones importantes (con su porqué) y errores a evitar.
- Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte.
- Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de dejarlo en la memoria.
- No guardes nunca datos sensibles (claves, tokens, datos personales).

## 6. Development Workflow

Work in this order: **Understand → Analyze → Plan → Implement → Validate**.

### Understand

Inspect the relevant implementation, `angular.json`, `eslint.config.mjs`, `tsconfig*.json`, and this file before changing anything. Do not assume technologies or patterns the repository does not demonstrate (e.g., no NgRx, no Tailwind, no SSR).

### Analyze

Identify requirements, affected files, dependencies, and side effects. In this project, pagination changes affect rendering, measurement, content integrity, and eventually PDF output — reason about those explicitly.

### Plan

Before modifying code, state:

1. Requirement understanding
2. Technical approach
3. Files expected to change
4. Key implementation decisions and risks

Trivial changes need a one-line plan; large changes need a detailed one.

### Implement

Deliver the smallest coherent change that solves the problem. Do not refactor unrelated code, rename things, upgrade dependencies, change configuration, or format files you did not otherwise touch.

### Validate

See #15 for commands. Review for correctness, strict TypeScript, Angular conventions, ESLint, accessibility, security, performance, and architectural consistency. **Never claim a command was executed unless it actually was.**

## 7. TypeScript Rules

Configuration: `strict: true`, `strictTemplates`, `strictInjectionParameters`, `strictInputAccessModifiers`, `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noPropertyAccessFromIndexSignature`, `isolatedModules` (target ES2022).

- **No `any`** (ESLint error). Use concrete types, or `unknown` with narrowing. Type Quill structures (Delta, ops) explicitly.
- Prefer type inference where the type is obvious; annotate return types on functions and methods (ESLint warns; inline callbacks and already-typed expressions are exempt).
- Prefix intentionally unused identifiers with `_`.
- Every promise must be correctly handled (`no-floating-promises`, `no-misused-promises`, `await-thenable` are errors). Handle errors explicitly in all async measurement/pagination paths.
- Use `??` and `?.` (not `||` and chained guards), `===` only (`eqeqeq`), braces on all control statements (`curly`).
- Index-signature properties require bracket notation (`noPropertyAccessFromIndexSignature`) — relevant for Delta ops and document settings objects.
- `console.warn`/`console.error` only; no `console.log`, no `debugger`.
- Do not pass unbound instance methods as callbacks (`unbound-method`).
- No placeholder/static-only classes (Angular-decorated classes are exempt).
- ESLint is important project guidance but not absolute authority over correctness. Never disable a rule to make weak code pass, and do not modify `eslint.config.mjs` unless explicitly requested.

## 8. Angular Rules (v21)

- **Standalone by default.** Do NOT write `standalone: true` — it has been redundant since v20. (`Home` and `Editor` still carry the leftover flag from scaffolding: remove it when already editing those files; do not mass-edit.) No NgModules.
- **Zoneless**: there is no `zone.js`. Rely on signals for change propagation; do not add zone.js.
- Use `OnPush` on new components (`@angular-eslint/prefer-on-push-component-change-detection` warns; scaffolded components predate the rule).
- Modern APIs only: `input()`, `output()`, `computed()`, `signal()`, `inject()`, signal-based view queries. Not `@Input()`/`@Output()` decorators. Host bindings/listeners go in the `host` object of `@Component`/`@Directive`, never `@HostBinding`/`@HostListener`.
- DI: `inject()` instead of constructor injection. Services: single responsibility, `providedIn: 'root'`.
- Templates: native control flow only (`@if`, `@for` with `track`, `@switch`) — `*ngIf`/`*ngFor`/`*ngSwitch` are ESLint errors. No negated `async` pipe (`@if (!(x | async))` is an error). Prefer self-closing tags (`<router-outlet />`).
- Keep templates simple; move logic into the component. Use `async` pipe for observables. Do not call browser globals (e.g. `new Date()`) in templates — pass values from code.
- External template/style files are the established convention here (colocated siblings); inline templates are acceptable for genuinely tiny components.
- Route lazily: features via `loadChildren` → `<FEATURE>_ROUTES`; pages via `loadComponent`. Add new features as siblings of `home/`, never inside another feature.
- No `ngClass`/`ngStyle` — use `class`/`style` bindings. Prefer Reactive Forms over template-driven forms when forms are introduced.
- Use `NgOptimizedImage` for static images (it does not work for inline base64 images).

## 9. State Management

- Use signals for all local component and service state; `computed()` for derived state.
- Keep transformations pure and predictable; change state only via `.set()`/`.update()`.
- Expose template-bound state as `protected readonly` signals (see `App.title`).
- No NgRx or other state libraries — do not introduce one without explicit justification. The document state is the Quill Delta; pagination is derived from it, not stored.
- Shared state that outgrows a component belongs in a `providedIn: 'root'` service exposing signals.

## 10. RxJS

- RxJS ~7.8 is available but barely used. Consume framework observables with `async` pipe or `toSignal` (in injection context); avoid manual subscriptions and leaks (`takeUntilDestroyed` when subscribing in services).
- Do not wrap callback-based Quill APIs in observables without a concrete need — signals and plain event handlers are fine.

## 11. Quill Integration

Observed: Quill ^2.0.3 is a dependency and `quill.snow.css` is registered globally in `angular.json`; no component uses Quill yet. `common/components/editor` is the intended wrapper (currently a placeholder).

- Quill is a browser/DOM library: instantiate it only after the view exists (`afterNextRender`/`afterRenderEffect`, or `ngAfterViewInit` with a signal view-child ref) — never in field initializers or constructors.
- The wrapper component owns the Quill instance; the rest of the app consumes Delta and events through `input()`/`output()` and signals.
- Extend Quill in this order before ever considering a fork: Quill APIs → Quill modules → custom Blots → application-level services/CSS.
- Delta is the model; the DOM is measurement/render only. Pagination reads rendered geometry and never rewrites Delta (#1 principles).
- Editor content is untrusted user input (see #12 Security).
- When a Quill API is uncertain, consult the official **Quill 2.x** docs — Quill 1.x examples are widespread online and wrong for this project.

## 12. UI, Accessibility, and Security

### Accessibility (first-class; ESLint `templateAccessibility` is enabled)

- Target WCAG AA; changes must pass AXE checks.
- Semantic HTML, full keyboard navigation, visible focus management, correct labels, accessible error/loading states.
- Prefer native HTML semantics over unnecessary ARIA. Real `<button>`/`<a>` elements for interactive controls, never styled `<div>`s.
- The editor surface needs explicit care: `contenteditable` regions require proper semantics (e.g., `role="textbox"`, `aria-label`, `aria-multiline`) and custom behaviors must not break keyboard support.

### Security

- Never put secrets, API keys, or credentials in frontend code. No environment files exist; do not fabricate them without a requirement.
- All editor/API content is untrusted: render it through Angular's sanitization; avoid `bypassSecurityTrust*`. If rendering Quill-generated HTML ever requires it, sanitize/validate the source and state the decision explicitly.
- Never log document content or user data.
- No raw `innerHTML` DOM manipulation in TypeScript — use Angular bindings or Quill's own API.

## 13. Styling, Performance, and Validation

### Styling

- SCSS only (schematics default, `inlineStyleLanguage: scss`). Global styles in `src/styles.scss`; colocated `.scss` per component.
- Quill's Snow theme CSS is already global — do not re-import it per component.
- No Tailwind, no CSS frameworks, no CSS-in-JS.
- No design tokens exist yet. Page geometry (sizes, margins) is a product concept: when styling grows, define shared SCSS variables/mixins for it instead of scattering magic numbers, and keep it configurable (see `DocumentSettings` in README).
- Formatting is Prettier's job (`npm run format`) — do not hand-format unrelated code.
- The editor targets fixed document geometry; don't force mobile-responsive patterns onto page rendering. Surrounding UI should still behave sensibly at smaller widths.

### Performance

Production budgets are enforced by `npm run build`: initial bundle warn **500 kB** / error **1 MB**; any component style warn **4 kB** / error **8 kB**. Don't ship changes that break budgets; raise limits only with explicit justification.

- Keep every route lazy (established via `loadChildren`/`loadComponent`).
- `OnPush` + signals; `track` every `@for`.
- Pagination is measurement-heavy: batch/debounce recomputation during rapid editing, group DOM reads before writes to avoid layout thrash, cache measurements where safe.
- No premature optimization — measure first (README principle 10).
- Static images via `NgOptimizedImage`; avoid heavy base64 payloads.

### SSR / SEO / Environments

Not configured, by current design: `main.ts` uses `bootstrapApplication` (CSR only), no server build, no hydration, and the app is a tool rather than a public content site. Browser APIs are safe at runtime, but keep Quill/DOM access in view lifecycle hooks so a future SSR story remains possible. Do not add SSR, hydration, SEO metadata, or environment files unless explicitly requested.

## 14. Infrastructure, Dependencies, and Testing

### Infrastructure

- Builder: `@angular/build:application` (esbuild-based). `npm run build` defaults to production; `npm start` defaults to development.
- Package manager: **npm** (pinned `npm@10.9.3` via `packageManager`). Do not introduce other managers/lockfiles.
- `.editorconfig` + `.prettierrc`: 2-space indent, UTF-8, LF, single quotes.
- `public/` is copied verbatim to the build output; reference assets with absolute paths.
- No CI/CD, Docker, or deployment configuration exists. Do not invent deployment conventions; touch these only on explicit request.

### Dependencies

README policy: dependencies are kept to a minimum and introduced only when they provide clear value. Therefore:

- Reuse what exists (Angular, Quill, RxJS, SCSS) before adding anything.
- Verify Angular 21 compatibility and bundle cost before adding a package; no alpha or unmaintained packages; no upgrades unless required for the task.
- Do not add state libraries, UI kits, or utility libraries (e.g., lodash) by default.

### Testing

- Stack: Vitest + jsdom via `@angular/build:unit-test` (`npm test`). Specs are colocated `*.spec.ts`, use vitest globals (`describe`/`it`/`expect`), TestBed, and the zoneless `await fixture.whenStable()` pattern.
- Tests are **not mandatory** for every change and spec files are excluded from ESLint — but never break existing specs, and for pure logic (pagination math, geometry, Delta transforms) a spec is the cheapest validation.
- Known-stale spec: `app.spec.ts` asserts an `<h1>` ("Hello, quill-paginated-editor") that `app.html` no longer renders. Don't be surprised by it; fix it if you touch `App`'s template, otherwise leave it alone.

## 15. Validation Commands

Real commands from `package.json` — do not invent others:

- `npm run lint` — ESLint over all `.ts` (spec files excluded) with full type information. `npm run lint:fix` auto-fixes.
- `npm run build` — production build; full type/template checking plus budget enforcement.
- `npm test` — Vitest unit tests.
- `npm run format:check` — Prettier check (`npm run format` to fix).

Minimum bar for any change: **lint + build clean**. Run tests when the change touches tested logic. If you cannot run a command, validate by careful review and say so explicitly.

## 16. Decision Making

Resolve conflicts by this priority order:

1. Security and correctness (including the #1 content-integrity principles)
2. Explicit user requirements
3. Existing repository architecture and conventions (this file)
4. Current official Angular/TypeScript recommendations
5. Project configuration and tooling (tsconfig, ESLint, budgets)
6. Maintainability and scalability
7. Performance, accessibility, and SEO where relevant
8. Personal stylistic preference (never a reason on its own)

Consult official documentation first when an API is uncertain or may have changed: [angular.dev](https://angular.dev/), [typescriptlang.org](https://www.typescriptlang.org/), [quilljs.com](https://quilljs.com/) (Quill 2.x). Prefer official docs over blog posts — much online Angular content predates v20 standalone-by-default and is wrong for this codebase.

## 17. Final Checklist

Before finishing any change:

- [ ] Smallest coherent diff; no unrelated refactors, renames, formatting, dependency, or config churn.
- [ ] No modifications to `eslint.config.mjs`, `tsconfig*.json`, `angular.json`, or `package.json` unless the task explicitly requires it.
- [ ] No new dependency, state library, UI kit, or SSR/env file introduced without explicit justification.
- [ ] #1 principles respected: Delta untouched by pagination, no content loss, no Quill core changes, no character-count pagination.
- [ ] Strict TypeScript clean: no `any`, no floating promises, handled errors.
- [ ] Modern Angular: no `standalone: true`, `OnPush` on new components, signals, native control flow, lazy routes.
- [ ] Accessible markup; user content treated as untrusted; no secrets.
- [ ] `npm run lint` and `npm run build` pass (or honestly reported as not run).
- [ ] `MEMORY.md` actualizado si hubo cambios de estado, decisiones o errores que evitar (≤50 líneas).
- [ ] Response follows the #5 format (abbreviated for trivial changes).
