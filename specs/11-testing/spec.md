# Document and Pagination Testing

## Status

Proposed implementation specification.

## Authority

This specification is subordinate to `docs/constitution.md`. The constitution is authoritative if there is a conflict.

## Purpose

Definir pruebas para modelo, layout, paginación y PDF.

## Scope

- Tests del modelo.
- Tests de geometría.
- Tests deterministas de paginación.
- Tests de splitting.
- Tests de manual breaks.
- Tests de header/footer.
- Tests de PDF.
- Regresiones.

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

The implementation MUST address: **Tests del modelo.**.

### REQ-02

The implementation MUST address: **Tests de geometría.**.

### REQ-03

The implementation MUST address: **Tests deterministas de paginación.**.

### REQ-04

The implementation MUST address: **Tests de splitting.**.

### REQ-05

The implementation MUST address: **Tests de manual breaks.**.

### REQ-06

The implementation MUST address: **Tests de header/footer.**.

### REQ-07

The implementation MUST address: **Tests de PDF.**.

### REQ-08

The implementation MUST address: **Regresiones.**.


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
