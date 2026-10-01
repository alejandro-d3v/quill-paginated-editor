# Project Constitution --- Quill Paginated Document Editor

**Status:** Authoritative engineering specification\
**Scope:** Angular 21 + TypeScript + Quill 2.x paginated document
editor\
**Primary goal:** Extend the existing editor into a maintainable,
visually paginated document system without unnecessarily modifying or
forking Quill.

------------------------------------------------------------------------

## 1. Mission

The project SHALL provide a document-editing experience similar to a
paginated word processor while preserving Quill as the editing engine.

The system SHALL progressively support:

-   A4, Letter, and Legal page sizes.
-   Portrait and landscape orientation.
-   Configurable page margins.
-   Header and footer.
-   Page numbers and total page count.
-   Automatic page breaks.
-   Semantic manual page breaks.
-   Content flowing across pages.
-   Long paragraphs continuing across pages.
-   Visual page representation while editing.
-   PDF output based on the same document/layout model.

The system SHALL be designed for maintainability and future upgrades of
Angular and Quill.

------------------------------------------------------------------------

## 2. Constitutional Principles

### Principle I --- Quill Remains the Editor

Quill SHALL remain responsible for rich-text editing, selection,
formatting, events, and its canonical content representation.

The project SHALL prefer Quill's supported extension mechanisms before
considering source modifications:

1.  Modules.
2.  Formats.
3.  Custom Blots.
4.  Quill APIs and events.
5.  Application services.
6.  Angular components.
7.  DOM measurement.
8.  CSS.

A fork or direct modification of Quill SHALL be a last resort and SHALL
require explicit architectural justification.

------------------------------------------------------------------------

### Principle II --- Delta Is the Source of Truth

The Quill Delta SHALL be the canonical representation of document body
content.

The DOM SHALL NOT become the persisted document model.

DOM measurement MAY be used for layout calculation, but measured DOM
state SHALL remain derived information.

The fundamental data flow is:

``` text
Quill
  │
  ▼
Delta
  │
  ▼
Document Model
  │
  ├───────────────┐
  ▼               ▼
Pagination       Other renderers
  │
  ▼
LayoutDocument
  │
  ├───────────────┐
  ▼               ▼
Paginated View    PDF
```

------------------------------------------------------------------------

### Principle III --- Pagination Is Derived State

Pagination SHALL be calculated from the logical document content and
document settings.

The pagination engine SHALL NOT destructively modify the canonical Delta
merely to obtain a page layout.

Conceptually:

``` text
Delta + DocumentSettings
        │
        ▼
Pagination Engine
        │
        ▼
LayoutDocument
```

The resulting page structure is derived state and MAY be recalculated
whenever document content or relevant settings change.

------------------------------------------------------------------------

### Principle IV --- Layout and PDF Are Separate Responsibilities

The project SHALL separate:

-   editing,
-   document modeling,
-   pagination/layout,
-   visual page rendering,
-   PDF rendering.

The PDF renderer SHALL consume the document/layout representation and
SHALL NOT depend directly on a live Quill editor instance.

Whenever practical, the visual editor and PDF renderer SHALL use the
same page/layout model so that their results remain consistent.

------------------------------------------------------------------------

### Principle V --- Geometry, Not Character Count

Pagination SHALL be based on rendered/layout geometry.

The system SHALL NOT determine page overflow using arbitrary character
counts.

The following factors MAY affect layout:

-   font family;
-   font size;
-   font weight;
-   line height;
-   paragraph spacing;
-   headings;
-   lists;
-   images;
-   tables;
-   blockquotes;
-   code blocks;
-   custom Blots;
-   margins;
-   headers;
-   footers;
-   orientation;
-   page dimensions.

A fixed character count SHALL never be treated as equivalent to a fixed
physical height.

------------------------------------------------------------------------

### Principle VI --- Physical Units Must Be Explicit

Physical page dimensions and margins SHALL use explicit units.

The system SHALL distinguish between:

-   physical units such as millimeters;
-   browser/CSS pixels used for measurement and rendering.

Unit conversion SHALL be centralized behind an explicit abstraction.

Conceptually:

``` ts
interface UnitConverter {
  mmToPx(mm: number): number;
  pxToMm(px: number): number;
}
```

No unexplained numeric dimension SHALL be introduced into layout code.

------------------------------------------------------------------------

### Principle VII --- Header and Footer Are Layout Elements

Headers and footers SHALL NOT be represented as ordinary body content.

They SHALL belong to document/page layout configuration.

They SHALL be designed so future functionality can include:

-   static text;
-   rich formatting;
-   page number;
-   total page count;
-   document metadata.

------------------------------------------------------------------------

### Principle VIII --- Manual Page Breaks Are Semantic

Manual page breaks SHALL be represented explicitly by the
document/layout architecture.

The implementation SHALL NOT use arbitrary invisible text or unrelated
formatting as a hidden page-break mechanism.

------------------------------------------------------------------------

### Principle IX --- Preserve Content

Pagination SHALL never silently lose document content.

The following invariant SHALL hold:

``` text
Original Delta
    │
    ▼
Pagination
    │
    ▼
Layout
```

The transformation SHALL preserve the logical content represented by the
original Delta.

------------------------------------------------------------------------

### Principle X --- Incremental Complexity

The implementation SHALL be incremental.

The project SHALL NOT attempt to solve every Quill content type,
pagination edge case, PDF feature, and performance optimization
simultaneously.

Each phase SHALL establish a stable foundation for the next phase.

------------------------------------------------------------------------

## 3. Domain Model

The implementation MAY adapt exact TypeScript types to the existing
repository, but the architectural separation SHALL remain.

### 3.1 Document Model

Conceptually:

``` ts
interface DocumentModel {
  content: Delta;
  settings: DocumentSettings;
}
```

### 3.2 Document Settings

``` ts
interface DocumentSettings {
  page: PageSettings;
  margins: PageMargins;
  header: HeaderSettings;
  footer: FooterSettings;
}
```

### 3.3 Page Settings

``` ts
interface PageSettings {
  size: 'A4' | 'LETTER' | 'LEGAL';
  orientation: 'portrait' | 'landscape';
}
```

### 3.4 Page Margins

``` ts
interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
  unit: 'mm';
}
```

### 3.5 Header and Footer

The exact content representation MAY evolve after repository inspection.

Conceptually:

``` ts
interface HeaderSettings {
  enabled: boolean;
  content?: Delta;
  height: number;
}

interface FooterSettings {
  enabled: boolean;
  content?: Delta;
  height: number;
}
```

### 3.6 Layout Model

Pagination SHALL produce derived layout data.

Conceptually:

``` ts
interface LayoutDocument {
  pages: LayoutPage[];
}

interface LayoutPage {
  index: number;
  blocks: LayoutBlock[];
}
```

The exact `LayoutBlock` model SHALL be defined according to the actual
content types supported by the repository.

------------------------------------------------------------------------

## 4. Architecture

The target architecture SHALL follow this separation:

``` text
                    Angular Application
                           │
                           ▼
                         Quill
                           │
                         Delta
                           │
                           ▼
                  Document / Layout Model
                           │
                           ▼
                    Pagination Engine
                           │
                 ┌─────────┴─────────┐
                 ▼                   ▼
          Paginated Editor       PDF Renderer
```

Recommended logical boundaries:

``` text
editor/
  Quill integration

document/
  document model
  document settings
  persistence/domain services

pagination/
  page geometry
  measurement
  layout
  pagination algorithms

pdf/
  PDF rendering

ui/
  page controls
  configuration
  visual presentation

testing/
  unit/integration/visual regression infrastructure
```

The exact repository structure SHALL be determined during discovery
rather than imposed blindly.

------------------------------------------------------------------------

## 5. Mandatory Architectural Rules

### RULE-001 --- Do Not Modify Quill Unnecessarily

Never modify Quill source code when the requirement can be solved at the
application level or through supported Quill extension mechanisms.

### RULE-002 --- No Quill Fork by Default

Do not fork Quill to solve a pagination or document-layout requirement
unless a concrete technical limitation is demonstrated and documented.

### RULE-003 --- Delta Is Canonical

Quill Delta is the canonical document-content representation.

### RULE-004 --- DOM Is Not Canonical

DOM state is derived and MAY be measured, but it SHALL NOT become the
persisted source of truth.

### RULE-005 --- Pagination Must Be Deterministic

Given equivalent document content, settings, fonts, and rendering
environment, pagination SHALL produce a deterministic layout.

### RULE-006 --- Pagination Must Be Independently Testable

Pagination logic SHALL NOT depend on Angular component state when such
dependency can reasonably be avoided.

### RULE-007 --- PDF Must Not Depend on Live Quill

PDF generation SHALL operate from document/layout data rather than
requiring the active editor instance.

### RULE-008 --- Editor Settings and Page Settings Are Separate

Quill editor configuration SHALL remain distinct from document page
configuration.

### RULE-009 --- Explicit Units

All physical dimensions SHALL have explicit units.

### RULE-010 --- Never Paginate by Character Count

Overflow SHALL be determined using layout geometry.

### RULE-011 --- Never Silently Lose Content

Every pagination operation SHALL preserve document content.

### RULE-012 --- Preserve the Original Delta

Pagination SHALL NOT mutate the canonical Delta simply to represent page
boundaries.

### RULE-013 --- Manual Breaks Are Semantic

Manual page breaks SHALL have an explicit representation.

### RULE-014 --- Header/Footer Are Layout Elements

Header and footer SHALL remain outside ordinary body content.

### RULE-015 --- Avoid Unnecessary DOM Reconstruction

The implementation SHALL avoid rebuilding large portions of the DOM when
the affected layout region can be recalculated more narrowly.

### RULE-016 --- Every Feature Requires Tests

Every new behavior SHALL include appropriate automated tests.

### RULE-017 --- Dependencies Require Justification

No dependency SHALL be introduced without documenting its purpose and
why the existing stack is insufficient.

### RULE-018 --- Strict TypeScript

Do not introduce `any` unless explicitly justified.

### RULE-019 --- Do Not Rewrite Working Code Without Cause

Existing working functionality SHALL NOT be rewritten merely for
stylistic preference.

### RULE-020 --- Preserve Existing Behavior

Backward compatibility with the existing editor SHALL be treated as
mandatory unless a deliberate breaking change is explicitly approved.

------------------------------------------------------------------------

## 6. Pagination Engine Contract

The pagination engine SHALL conceptually expose a contract equivalent
to:

``` ts
paginate(
  delta: Delta,
  settings: DocumentSettings
): LayoutDocument
```

The engine SHOULD be:

-   deterministic;
-   testable;
-   as pure as practical;
-   independent of Angular UI state;
-   explicit about measurement dependencies;
-   non-destructive with respect to the source Delta.

The engine SHALL progressively support:

1.  paragraphs;
2.  headings;
3.  formatted text;
4.  long paragraphs;
5.  lists;
6.  images;
7.  blockquotes;
8.  code blocks;
9.  tables;
10. custom Quill Blots.

Complex content SHALL be implemented incrementally.

------------------------------------------------------------------------

## 7. Pagination Behavior

### 7.1 Available Content Area

The available page content area SHALL account for:

-   page height;
-   top margin;
-   bottom margin;
-   header height when enabled;
-   footer height when enabled.

Conceptually:

``` text
availableHeight =
  pageHeight
  - marginTop
  - marginBottom
  - headerHeight
  - footerHeight
```

The exact calculation SHALL account for orientation and unit conversion.

### 7.2 Overflow

When the next content element exceeds the remaining page area, the
engine SHALL create or continue on the next page as appropriate.

### 7.3 Splittable Content

Long paragraphs and other splittable content SHALL be capable of
continuing across page boundaries.

### 7.4 Unsplittable Content

Elements that cannot reasonably be split SHALL move to the next page
when required by their layout constraints.

### 7.5 Content Preservation

No content may disappear because of a page boundary.

------------------------------------------------------------------------

## 8. Visual Editor Requirements

The editor SHALL visually represent physical pages.

Conceptually:

``` text
┌──────────────────────────────┐
│            HEADER            │
├──────────────────────────────┤
│                              │
│            CONTENT           │
│                              │
│                              │
├──────────────────────────────┤
│            FOOTER            │
└──────────────────────────────┘
```

Page rendering SHALL reflect:

-   page width;
-   page height;
-   orientation;
-   margins;
-   content area;
-   header area;
-   footer area.

The visual editor SHOULD make the page boundary obvious while retaining
a natural editing experience.

------------------------------------------------------------------------

## 9. Angular Rules

The project SHALL follow Angular 21 conventions.

Prefer:

-   standalone components;
-   signals where appropriate;
-   dependency injection;
-   lifecycle-safe subscriptions;
-   clean separation between UI and domain logic;
-   independently testable services.

Avoid:

-   unnecessary change detection;
-   memory leaks;
-   large pagination algorithms inside UI components;
-   unnecessary direct DOM manipulation;
-   coupling pagination to component-specific state.

Angular components SHOULD orchestrate behavior rather than own the core
pagination algorithm.

------------------------------------------------------------------------

## 10. TypeScript Rules

The project SHALL use strict TypeScript.

Prefer:

-   explicit domain interfaces;
-   discriminated unions;
-   explicit return types for important public APIs;
-   immutable data where practical;
-   small pure functions;
-   null-safe APIs;
-   narrow types.

Avoid:

-   `any`;
-   untyped public APIs;
-   hidden coercions;
-   global mutable state;
-   duplicated domain definitions.

------------------------------------------------------------------------

## 11. Performance Constitution

Typing SHALL remain responsive.

The system SHALL NOT synchronously rebuild the complete layout on every
keystroke without first measuring the impact.

The implementation SHOULD use, where appropriate:

-   debouncing;
-   scheduling;
-   incremental pagination;
-   dirty-region recalculation;
-   cached measurements;
-   selective rerendering.

Optimization SHALL be evidence-driven.

The project SHALL measure before introducing complicated optimization.

Large-document behavior SHALL eventually be evaluated at approximately:

-   10 pages;
-   50 pages;
-   100 pages;
-   500 pages.

Measurements SHOULD include:

-   typing latency;
-   pagination latency;
-   memory use;
-   DOM node count;
-   layout/render frequency.

------------------------------------------------------------------------

## 12. PDF Constitution

PDF generation SHALL be a separate rendering concern.

The PDF output SHALL use the same logical document and, whenever
practical, the same `LayoutDocument` produced for the visual editor.

The following should remain consistent between visual pages and PDF:

-   page size;
-   orientation;
-   margins;
-   content position;
-   header;
-   footer;
-   page numbers;
-   page breaks;
-   supported images;
-   supported formatting.

The PDF renderer SHALL NOT independently invent a second pagination
model unless an explicit technical reason is documented.

------------------------------------------------------------------------

## 13. Testing Constitution

Every new feature SHALL include tests.

At minimum, the test suite SHALL progressively cover:

### Page Geometry

-   A4;
-   Letter;
-   Legal;
-   portrait;
-   landscape;
-   margins;
-   unit conversion.

### Document Content

-   empty document;
-   one paragraph;
-   multiple paragraphs;
-   long paragraph;
-   formatted text;
-   headings;
-   lists;
-   images;
-   tables when supported;
-   custom Blots when supported.

### Pagination

-   no overflow;
-   one-page overflow;
-   multiple pages;
-   long content;
-   content split across pages;
-   unsplittable content;
-   manual page break;
-   page-break preservation.

### Layout

-   header;
-   footer;
-   page number;
-   total page count;
-   content area calculation.

### Invariants

Tests SHALL verify:

-   original Delta is not destructively modified;
-   no content is silently lost;
-   pagination is deterministic;
-   existing editor behavior remains functional.

------------------------------------------------------------------------

## 14. Development Workflow

Before modifying code, the agent SHALL:

1.  Inspect the repository.
2.  Inspect `package.json`.
3.  Determine the installed Quill version.
4.  Determine the Angular version.
5.  Locate the current Quill integration.
6.  Locate existing Delta handling.
7.  Locate existing document models.
8.  Locate existing PDF generation.
9.  Locate existing custom Blots/modules.
10. Locate relevant styles.
11. Locate existing tests.
12. Identify reusable abstractions.
13. Identify files that should remain untouched.

Only after discovery SHALL the agent propose implementation changes.

For each implementation task, the agent SHALL:

1.  State the smallest coherent change.
2.  Implement only the required scope.
3.  Run type checking.
4.  Run relevant tests.
5.  Run the Angular build where appropriate.
6.  Review the resulting diff.
7.  Verify unrelated files were not modified.
8.  Report changed files and reasons.

The agent SHALL NOT implement assumptions that contradict the
repository.

------------------------------------------------------------------------

## 15. Implementation Phases

### Phase 0 --- Repository Discovery

Produce an architecture/discovery report before making major changes.

The report SHOULD identify:

-   current Quill version;
-   current Angular version;
-   editor architecture;
-   Delta handling;
-   PDF implementation;
-   custom Blots;
-   custom modules;
-   styles;
-   involved components;
-   involved services;
-   reusable abstractions;
-   files that should not be modified;
-   risks;
-   recommended implementation order.

### Phase 1 --- Document Model

Implement the domain model for:

-   document;
-   page settings;
-   margins;
-   header;
-   footer.

Do not implement advanced pagination yet.

### Phase 2 --- Page Geometry

Implement:

-   A4;
-   Letter;
-   Legal;
-   portrait;
-   landscape;
-   unit conversion;
-   page geometry calculations.

Add tests.

### Phase 3 --- Visual Pages

Create the visual page representation with:

-   page dimensions;
-   content area;
-   header;
-   footer.

### Phase 4 --- Pagination MVP

Support:

-   paragraphs;
-   headings;
-   formatted text;
-   automatic page creation;
-   overflow detection.

### Phase 5 --- Content Splitting

Support long paragraphs and other splittable content continuing across
pages.

### Phase 6 --- Complex Content

Incrementally add:

-   lists;
-   images;
-   tables;
-   blockquotes;
-   code blocks;
-   custom Blots.

Do not attempt every complex content type in one change.

### Phase 7 --- Manual Page Breaks

Add semantic manual page breaks.

### Phase 8 --- Header/Footer

Add:

-   header;
-   footer;
-   page numbers;
-   total page count.

### Phase 9 --- PDF

Generate the PDF from the document/layout model.

The PDF phase SHALL follow successful validation of the visual page
model.

### Phase 10 --- Performance

Measure:

-   typing latency;
-   pagination latency;
-   memory;
-   DOM size;
-   large-document behavior.

Optimize based on profiling evidence.

------------------------------------------------------------------------

## 16. Agent Responsibilities

If a multi-agent workflow is used, responsibilities SHOULD be separated
as follows.

### Architect

Owns:

-   architecture;
-   domain boundaries;
-   integration strategy;
-   dependency decisions;
-   prevention of unnecessary Quill changes.

The architect SHALL not implement large features before architecture is
understood.

### Quill Specialist

Owns:

-   Quill 2.x;
-   Delta;
-   Parchment;
-   Blots;
-   Modules;
-   formats;
-   clipboard;
-   selection;
-   Quill events;
-   supported Quill APIs.

The specialist SHALL prefer extending Quill over modifying its
internals.

### Pagination Engineer

Owns:

-   measurement;
-   page geometry;
-   overflow;
-   page creation;
-   content splitting;
-   layout algorithms;
-   pagination invariants.

This role owns the core layout engine.

### Angular Engineer

Owns:

-   Angular 21 integration;
-   standalone components;
-   services;
-   signals where appropriate;
-   lifecycle handling;
-   change detection;
-   editor integration;
-   memory safety.

### PDF Engineer

Owns:

-   PDF rendering;
-   page geometry;
-   headers/footers;
-   page numbers;
-   content placement;
-   consistency with the layout model.

### UI Engineer

Owns:

-   visual page presentation;
-   page controls;
-   document settings UI;
-   zoom;
-   toolbar integration;
-   editing experience.

The UI engineer SHALL NOT alter pagination algorithms to solve purely
visual styling problems.

### Test Engineer

Owns:

-   unit tests;
-   integration tests;
-   regression tests;
-   visual regression where viable;
-   edge cases;
-   performance tests.

### Reviewer

Acts as an independent gate.

The reviewer SHALL inspect:

-   architecture;
-   TypeScript;
-   Angular conventions;
-   tests;
-   performance;
-   content preservation;
-   regressions;
-   dependency additions;
-   unnecessary Quill modifications.

The reviewer SHOULD NOT implement the primary feature being reviewed.

------------------------------------------------------------------------

## 17. Skills / Knowledge Areas

An agent implementing this project SHOULD have access to or demonstrate
knowledge of:

``` text
quill-architecture
quill-delta
quill-custom-modules
quill-blots
document-layout
pagination
css-print-layout
angular-21
typescript-strict
pdf-generation
document-testing
performance
```

These knowledge areas SHALL reinforce the constitutional principles
rather than override them.

------------------------------------------------------------------------

## 18. Definition of Done

A feature SHALL NOT be considered complete merely because it visually
appears to work.

Where applicable, completion requires:

-   TypeScript compiles.
-   Angular build succeeds.
-   Existing tests pass.
-   New tests pass.
-   No document content is silently lost.
-   Original Delta remains intact.
-   Pagination is deterministic.
-   Page configuration works.
-   Margins work.
-   Header works.
-   Footer works.
-   Page numbering works.
-   PDF generation works.
-   Visual and PDF layouts agree within the supported rendering
    contract.
-   No new console errors are introduced.
-   No unnecessary Quill source modifications were made.
-   No unrelated functionality regressed.
-   New dependencies are justified.
-   The diff contains only relevant changes.

------------------------------------------------------------------------

## 19. Change Control

Any change that violates a constitutional principle SHALL require
explicit architectural justification.

In particular, the following require heightened review:

-   modifying Quill source;
-   forking Quill;
-   making DOM state canonical;
-   introducing a second independent pagination algorithm;
-   coupling PDF generation directly to the editor;
-   replacing strict types with `any`;
-   adding a large dependency for a narrowly scoped problem;
-   introducing synchronous full-document layout on every keystroke;
-   changing existing editor behavior without tests.

When a rule must be violated, the implementation SHALL document:

1.  Which rule is being violated.
2.  Why the rule cannot reasonably be followed.
3.  What alternatives were evaluated.
4.  What risks are introduced.
5.  How the implementation will be tested.
6.  Whether the exception is intended to be temporary or permanent.

------------------------------------------------------------------------

## 20. Final Architectural Direction

The project SHALL prefer:

``` text
Existing Quill
      +
Custom Modules / Services
      +
Document Model
      +
Pagination Engine
      +
Paginated View
      +
PDF Renderer
```

over:

``` text
Forked Quill
      +
Large modifications to Quill internals
      +
Application-specific pagination inside Quill
```

The objective is not merely to make pages appear on screen.

The objective is to establish a maintainable document architecture in
which:

``` text
Quill Delta
     │
     ▼
Document Model
     │
     ▼
Pagination / Layout
     │
     ├───────────────┐
     ▼               ▼
Visual Pages        PDF
```

remains understandable, testable, deterministic, extensible, and
upgradeable.

------------------------------------------------------------------------

## 21. Constitutional Priority Order

When requirements conflict, use this priority order:

1.  Preserve document content.
2.  Preserve the canonical Delta model.
3.  Preserve existing editor behavior.
4.  Preserve architectural separation.
5.  Preserve deterministic pagination.
6.  Preserve testability.
7.  Preserve performance and responsiveness.
8.  Add the requested feature.
9.  Optimize implementation details.

A visually convenient solution SHALL NOT be accepted if it silently
loses content, corrupts the canonical document model, or creates an
unnecessary dependency on Quill internals.

------------------------------------------------------------------------

## 22. Agent Operating Principle

Before acting, the agent SHALL ask:

> Can this requirement be implemented without modifying Quill?

If yes, prefer that solution.

Then:

> Is the change represented in the document model, or am I accidentally
> making the DOM the source of truth?

Then:

> Can the behavior be tested independently?

Then:

> Does the implementation preserve existing behavior and document
> content?

Only after these questions are satisfied SHOULD implementation proceed.

This constitution is the governing engineering contract for the
paginated document editor.
