# Document Model

## Status

Proposed implementation specification.

## Authority

This specification is subordinate to `docs/constitution.md`. The constitution is authoritative if there is a conflict.

## Purpose

Definir el modelo canónico del documento y su configuración.

## Scope

- DocumentModel con Delta y settings.
- PageSettings y márgenes.
- Header/footer settings.
- Tipos estrictos y unidades explícitas.

## Architectural constraints

- Quill remains the editor.
- Quill Delta remains the canonical content representation.
- DOM state is derived and must not become the source of truth.
- Pagination/layout is derived state.
- Geometry is based on rendered dimensions, not character counts.
- Physical units are explicit.
- Content must never be silently lost.
- Existing editor behavior must be preserved.
- Quill internals must not be modified unless explicitly justified.

## Requirements

### REQ-01

The implementation MUST address: **DocumentModel con Delta y settings.**.

### REQ-02

The implementation MUST address: **PageSettings y márgenes.**.

### REQ-03

The implementation MUST address: **Header/footer settings.**.

### REQ-04

The implementation MUST address: **Tipos estrictos y unidades explícitas.**.


## Acceptance criteria

- All applicable requirements are implemented.
- Critical behavior has automated test coverage.
- TypeScript remains strict.
- Existing tests pass.
- The Angular build passes.
- No content is silently lost.
- The canonical Delta is preserved.
- Results are deterministic for equivalent inputs.

## Out of scope

- Forking Quill.
- Replacing Delta with a DOM document model.
- Introducing an unrelated editor framework.
- Unrelated feature work.
- Premature optimization.
