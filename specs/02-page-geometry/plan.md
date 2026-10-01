# Page Geometry — Plan

## Objective

Implement this capability while preserving the architecture defined by `docs/constitution.md`.

## Approach

1. Inspect the existing repository implementation first.
2. Reuse existing abstractions where appropriate.
3. Define strict domain types before implementation.
4. Implement the smallest coherent change.
5. Integrate through stable Quill/Angular boundaries.
6. Add automated tests.
7. Run type checking, tests and build.
8. Review the diff for regressions and unnecessary changes.

## Design constraints

- Do not make DOM state canonical.
- Do not mutate the canonical Delta merely to represent layout.
- Prefer deterministic and independently testable logic.
- Avoid unnecessary full-document synchronous relayout.
- Do not introduce a second competing source of truth.

## Risks

- Browser measurement differences.
- Layout thrashing.
- Hidden coupling to existing Quill modules.
- Content loss during transformation.
- Non-deterministic pagination.
- Existing behavior regressions.

## Verification

The work is complete only when the acceptance criteria in `spec.md` are demonstrably satisfied.
