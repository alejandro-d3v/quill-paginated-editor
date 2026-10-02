# AGENTS.md — quill-paginated-editor

This is the operational manual for AI coding agents working in this repository. It is derived from the actual repository configuration, code, constitution, specifications, and project documentation. The repository is the primary source of truth for implementation details; when this document and the code disagree, verify against the code and prefer the smallest change consistent with both.

**Mandatory engineering workflow:** Understand → Analyze → Plan → Implement → Validate.

**Mandatory spec workflow:** Select Spec → Read Constitution → Read Spec → Read Plan → Read Tasks → Inspect Code → Implement Tasks → Validate → Audit → Update Tasks → Report.

**Minimum bar for any implementation change:** `npm run lint` \+ `npm run build` clean (or honestly reported as not run). Tests when touching tested logic or when required by the current spec.

**Session start:** read `MEMORY.md` before touching code.

**Session end:** update `MEMORY.md` when the session changes project state, decisions, implementation status, or known pitfalls.

**Spec progression:** implement one spec at a time. Never silently continue into the next spec.

---

## 0\. How to Use This Document

- **You are an AI coding agent** operating in this repository. This file is your contract, not background reading.
- Read #1 (principles), #5 (agent behavior), #6 (development workflow), #7 (spec-driven development), and #16 (decision making) before any non-trivial change.
- Section order matters: principles override conventions; conventions override personal preference.
- When instructions conflict, resolve them using #16, not by recency or convenience.
- For behavior expectations, see #5.
- For the spec lifecycle, see #7.
- For pre-flight and final checks, see #15 and #17.

---

## Table of Contents

1. Repository Overview
2. Technology Stack
3. Repository Structure
4. Architecture
5. Agent Behavior
6. Development Workflow
7. Spec-Driven Development
8. TypeScript Rules
9. Angular Rules (v21)
10. State Management
11. RxJS
12. Quill Integration
13. UI, Accessibility, and Security
14. Styling, Performance, and Validation
15. Infrastructure, Dependencies, and Testing
16. Validation Commands
17. Decision Making
18. Final Checklist

---

## 1\. Repository Overview

- **Product**: A paginated document editor built on top of [Quill 2.x](<https://quilljs.com/>) — content is displayed as physical pages (A4/Letter/Legal, orientation, margins, headers/footers, page numbers, page breaks) instead of one continuous editor.
- **Status**: Experimental MVP under active development. The app is a root shell with lazy routing plus a `home` feature page hosting the Quill wrapper (`common/components/editor`). The wrapper **is implemented** (`EditorComponent`: snow theme, full toolbar, Quill instantiated in `ngAfterViewInit`) but **does not expose Delta yet** (no `text-change` wiring, no `output()`/signal). Known wrapper debt (redundant `standalone: true`, empty `imports`, no `OnPush`, `@ViewChild`, fake `ngOnDestroy` cleanup, no ARIA, `::ng-deep`) — touch only what the current spec requires (RULE-019); details in `docs/discovery.md` §1.3. No document model, geometry, pagination, measurement, or PDF exists yet. Expect significant API/architecture churn; consult `README.md` and the active spec before large changes.

### Non-negotiable product principles

1. **Quill Delta is the source of truth.** The DOM is for rendering and layout measurement only — never the canonical document model.
2. **Pagination is derived state.** Recompute it from Delta; never mutate the original Delta to paginate.
3. **Never modify or fork Quill's core.** Extend via Quill APIs, Quill modules, custom Blots, Angular components, layout/pagination services, DOM measurement, and CSS. A Quill fork is a last resort requiring explicit user approval.
4. **Never paginate by character count.** Pagination is based on rendered dimensions.
5. **Never silently lose document content.**
6. **Keep pagination and PDF generation as separate concerns** from editing.
7. Prefer small, testable services.
8. Measure performance before optimizing.
9. Implement the project incrementally according to the ordered specifications in `/specs`.

---

## 2\. Technology Stack

**Observed — in use (verified in `package.json`, `angular.json`, `eslint.config.mjs`):**

| Technology | Version | Notes |
| --- | --- | --- |
| Angular | ^21.2 | Standalone APIs, signals, zoneless (no `zone.js` dependency). |
| TypeScript | \~5.9 | `strict` \+ strict Angular compiler options. |
| Quill | ^2.0.3 | Editor engine. Snow theme CSS registered globally in `angular.json`. |
| RxJS | \~7.8 | Available; almost no usage yet. |
| SCSS | — | Global (`src/styles.scss`) + colocated component styles. |
| ESLint | 10 + angular-eslint 22 + typescript-eslint 8 | `strictTypeChecked`, `stylisticTypeChecked`, simple-import-sort. |
| Prettier | 3.9 | Formatting: 100 cols, single quotes, semicolons, trailing commas `es5`, LF. |
| Vitest + jsdom | via `@angular/build:unit-test` | `npm test`; specs use Vitest globals. |

**Available but not yet used** (do not treat as established): `@angular/forms` (prefer Reactive Forms when forms appear), RxJS patterns, `NgOptimizedImage` (no images yet). `provideHttpClient` is **not** configured.

**Not present — do not introduce without explicit justification**: SSR/server rendering, NgRx or any state library, Tailwind or any CSS/utility framework, UI component libraries, environment files, HTTP/API layer, CI/CD, Docker. None of these exist in the repository today.

---

## 3\. Repository Structure

```
src/
├── index.html
├── main.ts
├── styles.scss
└── app/
    ├── app.ts|html|scss|spec
    ├── app.config.ts
    ├── app.routes.ts
    ├── common/
    │   └── components/editor/
    └── home/
        ├── home.routes.ts
        └── pages/home/

specs/
├── 00-discovery/
├── 01-document-model/
├── 02-page-geometry/
├── 03-visual-pages/
├── 04-pagination-mvp/
├── 05-content-splitting/
├── 06-complex-blocks/
├── 07-manual-page-breaks/
├── 08-header-footer/
├── 09-pdf/
├── 10-performance/
└── 11-testing/
```

Each spec directory normally contains:

```
spec.md
plan.md
tasks.md
```

### Naming conventions

- **Component classes**: no `Component` suffix by default (`App`, `Home`). The suffix is optional — the existing wrapper keeps `EditorComponent` by explicit user decision; do not mass-rename it.
- **Files**: kebab-case, no type suffix.
- **Routes**: root `app.routes.ts` exports `routes`; each feature owns `<feature>.routes.ts`.
- **Selectors**: components `app-<kebab-case>`, directives `app<camelCase>`.
- **No barrel files** (`index.ts`).
- **Imports**: no path aliases resolve today — use relative imports.
- **Import order**: Angular first, then third-party, then internal aliases, then parent/sibling relative imports.

---

## 4\. Architecture

Current architecture is minimal and feature-based:

- `app/` — root shell, global providers, top-level routing.
- `<feature>/` — self-contained lazy-loaded feature folders.
- `common/` — reusable, feature-agnostic code.

Target domain architecture:

```
Quill Editor
     ↓
   Delta
     ↓
Document Model
     ↓
Pagination Engine
     ↓
 ┌───────────────┬───────────────┐
 ↓               ↓
Paginated View   PDF Renderer
```

- Quill integration lives behind an Angular wrapper component (`common/components/editor`).
- The rest of the application interacts with the editor through `input()`/`output()` and signals.
- Pagination logic belongs in standalone services, decoupled from the editor component and rendering.
- Delta is the canonical model.
- Pagination output is derived state.
- DOM measurement is an implementation mechanism, not a source of truth.
- PDF generation is a separate concern from interactive pagination.
- API/data access does not currently exist.

---

## 5\. Agent Behavior

### Autonomy

Act autonomously when the repository provides sufficient context.

Ask the user only when:

- Critical information is missing.
- Requirements conflict.
- A decision has significant business impact.
- A destructive or breaking change is required.
- A major architectural decision cannot reasonably be inferred.
- Secrets or credentials are needed.
- A spec is internally contradictory and no safe interpretation exists.

Do **not** ask unnecessary questions when the constitution, active spec, existing code, or established architecture already provides the answer.

### Better alternatives

Do not blindly implement a technically inferior request, and do not replace technologies based on personal preference.

If the requested approach conflicts with the constitution, active spec, or established architecture:

1. Identify the conflict.
2. Explain the concrete technical issue.
3. Propose the smallest compatible alternative.
4. Implement the alternative only when the intended behavior is unambiguous.
5. Otherwise stop and report the conflict.

### Scope discipline

During implementation:

- Work only on the current task/spec.
- Do not implement future specs "because they will be needed later".
- Do not refactor unrelated code.
- Do not rewrite architecture without justification.
- Do not introduce speculative abstractions.
- Do not add dependencies unless required.
- Do not modify configuration merely to make implementation easier.
- Do not mark work complete without validation.

### Response format

Structure implementation responses as:

1. **Requirement Analysis**
2. **Technical Approach**
3. **Implementation Plan**
4. **Implementation**
5. **Validation**
6. **Risks and Considerations**

 Abbreviate freely for trivial changes.

---

## 6\. Development Workflow

All implementation work follows:

```
Understand
    ↓
Analyze
    ↓
Plan
    ↓
Implement
    ↓
Validate
```

For spec-driven work, use:

```
Select Spec
    ↓
Read Constitution
    ↓
Read Spec
    ↓
Read Plan
    ↓
Read Tasks
    ↓
Inspect Existing Code
    ↓
Identify Dependencies / Gaps
    ↓
Implement Current Tasks
    ↓
Validate
    ↓
Audit Against Requirements
    ↓
Update Tasks
    ↓
Update MEMORY.md if needed
    ↓
Report
```

### Understand

Inspect the relevant implementation and configuration before changing anything.

At minimum, consider:

- `docs/constitution.md`
- `README.md`
- `MEMORY.md`
- relevant `spec.md`
- relevant `plan.md`
- relevant `tasks.md`
- relevant skills under `.agents/skills/`
- affected source files
- `angular.json`
- `eslint.config.mjs`
- `tsconfig*.json`
- `package.json`

### Analyze

Identify:

- requirements;
- affected files;
- dependencies;
- architectural constraints;
- side effects;
- validation requirements;
- potential conflicts with later architecture.

For pagination changes, explicitly reason about:

- Delta integrity;
- rendered geometry;
- measurement;
- pagination boundaries;
- content splitting;
- visual rendering;
- eventual PDF output.

### Plan

Before modifying code, determine:

1. What the current requirement means.
2. Which existing code participates.
3. Which files are expected to change.
4. Which tasks are being implemented.
5. Which decisions are required.
6. Which risks need validation.

Do not create an unnecessarily elaborate plan for trivial changes.

### Implement

Implement the smallest coherent change that satisfies the current requirement.

### Validate

Run the relevant checks described in #16.

Never claim a command was executed unless it actually was.

---

# 7\. Spec-Driven Development

The `/specs` directory defines the project's incremental implementation roadmap.

The current intended progression is:

```
00-discovery
    ↓
01-document-model
    ↓
02-page-geometry
    ↓
03-visual-pages
    ↓
04-pagination-mvp
    ↓
05-content-splitting
    ↓
06-complex-blocks
    ↓
07-manual-page-breaks
    ↓
08-header-footer
    ↓
09-pdf
    ↓
10-performance
    ↓
11-testing
```

The exact dependencies must be verified from the specs themselves. Do not assume that a later spec can safely be implemented before its prerequisites.

## 7.1 Source-of-truth hierarchy

When deciding what to implement, use this priority:

1. `docs/constitution.md`
2. The active `spec.md`
3. The active `plan.md`
4. The active `tasks.md`
5. Existing architecture and code
6. `README.md`
7. `AGENTS.md` implementation conventions
8. Official framework/library documentation
9. Personal engineering preference

This hierarchy applies to **feature requirements**.

Security, correctness, and explicit user requirements still override ordinary implementation conventions as described in #17.

If two authoritative documents contradict each other, do not silently choose one. Identify the contradiction and resolve it using #17 or ask the user when necessary.

## 7.2 One spec at a time

An agent MUST implement **one spec at a time**.

When asked to implement a spec:

- Read its `spec.md`, `plan.md`, and `tasks.md`.
- Inspect the current repository state.
- Implement only that spec.
- Complete its tasks in dependency order.
- Validate the result.
- Audit the implementation against the spec.
- Update its `tasks.md`.
- Report the result.

The agent MUST NOT automatically start the next spec.

Even when the current spec is completed successfully, stop at its boundary and report completion.

## 7.3 Never skip the constitution

Before implementing any spec, read:

```
docs/constitution.md
```

The constitution defines project-level principles and constraints.

If a task appears to violate the constitution:

- do not silently work around it;
- identify the conflict;
- determine whether the task has a safe interpretation;
- otherwise stop and report the conflict.

 ## 7.4 Spec contract

 The active spec defines **what must be achieved**.

 The plan defines **how the spec is expected to be decomposed**.

 The tasks define **the execution checklist**.

 Do not treat `tasks.md` as the only source of requirements. A task may be incomplete even when every checkbox is marked if the acceptance criteria in `spec.md` are not satisfied.

 Likewise, do not invent new requirements merely because they appear technically convenient.

 ## 7.5 Pre-implementation spec audit

 Before implementation, verify:

 - Are the requirements internally consistent?
- Are acceptance criteria testable?
- Are task dependencies clear?
- Does the existing code provide the expected foundation?
- Does the implementation conflict with earlier completed specs?
- Does the spec depend on a feature that is not implemented?
- Is any requirement ambiguous enough to materially change architecture?

 If a problem is minor and can be resolved from existing project principles, resolve it using #17.

 If it materially changes architecture or product behavior, report it before implementation.

 ## 7.6 Task execution

 Tasks should normally be executed in the order defined by `tasks.md`.

 Before each task:

 - understand its purpose;
- identify affected code;
- verify prerequisites;
- implement only the necessary changes.

 A task can be considered complete only when:

 - its implementation exists;
- its acceptance criteria are satisfied;
- relevant validation passes;
- no known blocking issue remains.

 Do not mark tasks complete merely because code was written.

 ## 7.7 Future-spec isolation

 Do not implement future functionality simply because it seems useful.

 Examples:

 - Do not implement manual page breaks during pagination MVP.
- Do not implement headers/footers while building basic page geometry unless the current spec explicitly requires the foundation.
- Do not implement PDF-specific abstractions while building interactive pagination unless required by the active spec.
- Do not optimize pagination before performance requirements are active.
- Do not introduce complex block splitting before the relevant spec.

 However, architecture may expose clean extension points when doing so does not introduce speculative functionality.

 ## 7.8 Handling incomplete specifications

 If the active spec requires a prerequisite that is missing:

 1. Check whether the prerequisite belongs to an earlier spec.
2. Check whether it is actually required or only assumed.
3. Determine whether the smallest compatible implementation can be added without violating scope.
4. If yes, implement the minimum necessary foundation and document it.
5. If no, stop and report the dependency.

 Do not silently implement an entire previous or future spec.

 ## 7.9 Updating tasks

 After implementation:

 - Mark only genuinely completed tasks.
- Do not mark tasks as complete if validation failed.
- Do not mark tasks complete because the code "looks correct".
- Preserve unfinished tasks.
- If implementation reveals a task that is incorrectly specified, document the discrepancy rather than hiding it.

 If task wording needs correction, make the smallest documentation change necessary and report it.

 ## 7.10 Spec completion criteria

 A spec is complete only when:

 - Its acceptance criteria are implemented.
- Its required tasks are complete.
- Relevant tests pass.
- `npm run lint` passes.
- `npm run build` passes.
- No known blocking issue remains.
- `tasks.md` accurately reflects reality.
- The implementation does not violate the constitution.
- No accidental future-spec functionality was introduced.

 A spec may be reported as **partially complete** when implementation is blocked or validation is incomplete.

---

 ## 8\. TypeScript Rules

 Configuration: `strict: true`, `strictTemplates`, `strictInjectionParameters`, `strictInputAccessModifiers`, `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noPropertyAccessFromIndexSignature`, `isolatedModules` (target ES2022).

 - **No `any`**. Use concrete types, or `unknown` with narrowing.
- Type Quill structures explicitly.
- Prefer type inference where obvious; annotate return types on functions and methods.
- Prefix intentionally unused identifiers with `_`.
- Every promise must be correctly handled.
- Use `??` and `?.`, not `||` and chained guards.
- Use `===` only.
- Use braces on all control statements.
- Index-signature properties require bracket notation.
- `console.warn`/`console.error` only; no `console.log`, no `debugger`.
- Do not pass unbound instance methods as callbacks.
- No placeholder/static-only classes.
- Do not disable ESLint rules merely to make weak code pass.
- Do not modify `eslint.config.mjs` unless explicitly required.

---

 ## 9\. Angular Rules (v21)

 - **Standalone by default.** Do NOT write `standalone: true`.
- No NgModules.
- Use `OnPush` on new components.
- Use `input()`, `output()`, `computed()`, `signal()`, `inject()`.
- Do not use `@Input()`/`@Output()` decorators for new code.
- Host bindings/listeners go in the `host` object.
- DI uses `inject()`.
- Services use `providedIn: 'root'` unless a narrower scope is explicitly justified.
- Use native control flow: `@if`, `@for` with `track`, `@switch`.
- Do not use `*ngIf`, `*ngFor`, or `*ngSwitch`.
- Prefer self-closing tags.
- Keep templates simple.
- Do not call browser globals directly from templates.
- Use external templates/styles by default.
- Lazy-load features and pages.
- No `ngClass`/`ngStyle`.
- Prefer Reactive Forms when forms are introduced.

---

 ## 10\. State Management

 - Use signals for local component and service state.
- Use `computed()` for derived state.
- Expose template-bound state as `protected readonly` signals where appropriate.
- No NgRx or other state libraries without explicit justification.
- Document state is the Quill Delta.
- Pagination is derived from document state.
- Do not create a second mutable canonical document representation.
- Shared state belongs in focused services.

---

 ## 11\. RxJS

 - RxJS \~7.8 is available but barely used.
- Prefer `async` pipe or `toSignal`.
- Avoid manual subscriptions when unnecessary.
- Use `takeUntilDestroyed` when subscriptions are genuinely required.
- Do not wrap callback-based Quill APIs in observables without a concrete need.

---

 ## 12\. Quill Integration

 Observed: Quill ^2.0.3 is installed and Snow theme CSS is registered globally.

 - Instantiate Quill only after the view exists.
- The editor wrapper owns the Quill instance.
- The rest of the application consumes Delta and events through explicit component APIs.
- Extend Quill in this order:
  1. Quill APIs
  2. Quill modules
  3. Custom Blots
  4. Application services/CSS
  5. Quill fork only with explicit user approval
- Delta is the canonical document model.
- DOM is for rendering and measurement only.
- Pagination must never mutate the canonical Delta.
- Do not paginate by character count.
- Never silently discard content.
- When uncertain about Quill behavior, consult official Quill 2.x documentation.

---

 ## 13\. UI, Accessibility, and Security

 ### Accessibility

 - Target WCAG AA.
- Use semantic HTML.
- Support keyboard navigation.
- Maintain visible focus.
- Use correct labels and accessible states.
- Prefer native semantics over unnecessary ARIA.
- Real `<button>`/`<a>` elements for interactive controls.
- Editor surfaces require appropriate textbox semantics and keyboard behavior.

 ### Security

 - Never put secrets or credentials in frontend code.
- Treat document/editor content as untrusted.
- Use Angular sanitization.
- Avoid `bypassSecurityTrust*`.
- Do not use raw `innerHTML` manipulation in TypeScript.
- Do not log document content or user data.

---

 ## 14\. Styling, Performance, and Validation

 ### Styling

 - SCSS only.
- Global styles belong in `src/styles.scss`.
- Component styles are colocated.
- Do not re-import Quill Snow CSS per component.
- No Tailwind or CSS frameworks.
- Avoid scattering page-geometry magic numbers.
- Formatting is Prettier's responsibility.
- Do not hand-format unrelated code.
- Keep document pages physically accurate rather than forcing responsive layouts onto them.

 ### Performance

 Production budgets are enforced by `npm run build`:

 - Initial bundle warning: **500 kB**
- Initial bundle error: **1 MB**
- Component style warning: **4 kB**
- Component style error: **8 kB**

 Do not increase budgets without explicit justification.

 Pagination is measurement-heavy:

 - batch/debounce recomputation where appropriate;
- group DOM reads before writes;
- avoid layout thrashing;
- cache measurements only when correctness is preserved;
- measure before optimizing.

 Do not prematurely optimize.

---

 ## 15\. Infrastructure, Dependencies, and Testing

 ### Infrastructure

 - Builder: `@angular/build:application`.
- Package manager: npm.
- Do not introduce other package managers or lockfiles.
- No CI/CD, Docker, deployment, or server configuration exists.
- Do not invent infrastructure conventions.

 ### Dependencies

 - Reuse existing dependencies first.
- Verify Angular 21 compatibility before adding packages.
- Avoid alpha/unmaintained packages.
- Do not upgrade dependencies unless required.
- Do not add state libraries, UI kits, utility libraries, or rendering frameworks without explicit justification.

 ### Testing

 - Stack: Vitest + jsdom via `@angular/build:unit-test`.
- Specs are colocated `*.spec.ts`.
- Use Vitest globals.
- Use TestBed where appropriate.
- Use zoneless `await fixture.whenStable()` patterns.
- Pure logic such as geometry, pagination calculations, and Delta transforms should generally have focused unit tests.
- Never break existing tests silently.

---

 ## 16\. Validation Commands

 Use only commands that actually exist in `package.json`.

 ### Lint

```
npm run lint
```

 ### Lint with automatic fixes

```
npm run lint:fix
```

 ### Production build

```
npm run build
```

 ### Tests

```
npm test
```

 ### Formatting check

```
npm run format:check
```

 ### Formatting

```
npm run format
```

 ### Minimum validation bar

 For implementation changes:

```
npm run lint
npm run build
```

 Run tests when:

 - tested logic is modified;
- the active spec requires tests;
- pure domain logic is introduced;
- pagination, geometry, Delta transformation, or content splitting behavior changes.

 Never claim a command was executed unless it actually ran.

 If validation cannot be executed, explicitly report that limitation.

---

 ## 17\. Decision Making

 Resolve conflicts using this priority order:

 1. Security and correctness.
2. Explicit user requirements.
3. `docs/constitution.md`.
4. Active `spec.md`.
5. Active `plan.md`.
6. Active `tasks.md`.
7. Existing repository architecture and conventions.
8. Current official Angular/TypeScript/Quill recommendations.
9. Project configuration and tooling.
10. Maintainability and scalability.
11. Performance and accessibility where relevant.
12. Personal stylistic preference.

 ### Important distinction

 The constitution and specs define **what the product must do**.

 `AGENTS.md` defines **how the agent operates and implements it**.

 Existing code defines **what currently exists**.

 When these differ, do not blindly overwrite one with another. Determine whether the difference represents:

 - intended future work;
- incomplete implementation;
- stale documentation;
- an actual contradiction.

 Report meaningful contradictions rather than hiding them.

 Consult official documentation when APIs are uncertain or may have changed:

 - [Angular](<https://angular.dev/>)
- [TypeScript](<https://www.typescriptlang.org/>)
- [Quill](<https://quilljs.com/>)

 Prefer official documentation over blog posts and outdated Angular examples.

---

 ## 18\. Final Checklist

 Before finishing any implementation task:

 ### Scope

 - [ ] Only the requested/current spec was implemented.
- [ ] No future spec was silently implemented.
- [ ] No unrelated refactors were introduced.
- [ ] No unnecessary dependency/configuration changes were made.

 ### Requirements

 - [ ] `docs/constitution.md` was considered.
- [ ] Active `spec.md` was read.
- [ ] Active `plan.md` was read.
- [ ] Active `tasks.md` was read.
- [ ] Acceptance criteria are satisfied.
- [ ] No known requirement conflict remains.

 ### Architecture

 - [ ] Delta remains the canonical document model.
- [ ] Pagination does not mutate Delta.
- [ ] No character-count pagination.
- [ ] No Quill core modification.
- [ ] No silent content loss.
- [ ] Pagination and PDF concerns remain separated.

 ### Code quality

 - [ ] Strict TypeScript passes.
- [ ] No `any`.
- [ ] Promises are handled.
- [ ] Angular conventions are respected.
- [ ] New components use `OnPush`.
- [ ] Signals are used appropriately.
- [ ] Accessibility requirements are respected.
- [ ] Security requirements are respected.

 ### Validation

 - [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] Relevant tests pass.
- [ ] `npm run format:check` passes when formatting-sensitive changes were made.
- [ ] Commands actually executed are accurately reported.

 ### Spec state

 - [ ] `tasks.md` reflects the actual implementation state.
- [ ] No task is marked complete without verification.
- [ ] Remaining work is clearly identified.
- [ ] The agent did not automatically start the next spec.

 ### Memory

 - [ ] `MEMORY.md` was updated if project state, decisions, or pitfalls changed.
- [ ] `MEMORY.md` remains concise (approximately ≤50 lines).
- [ ] No secrets or sensitive information were added.

 ### Final report

 The final response should summarize:

 1. Requirement analysis.
2. Technical approach.
3. Files changed.
4. Implementation completed.
5. Validation commands and actual results.
6. Remaining tasks.
7. Risks or decisions requiring attention.
8. Whether the current spec is complete or partial.