# Manual Page Breaks

## Status

Proposed implementation specification.

## Authority

This specification is subordinate to `docs/constitution.md`. The constitution is authoritative if there is a conflict.

## Purpose

Representar saltos de página manuales de forma semántica.

## Scope

- Representación.
- Inserción y eliminación.
- Persistencia.
- Interacción con paginación automática.
- Prioridad y preservación de contenido.

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

The implementation MUST address: **Representación.**.

### REQ-02

The implementation MUST address: **Inserción y eliminación.**.

### REQ-03

The implementation MUST address: **Persistencia.**.

### REQ-04

The implementation MUST address: **Interacción con paginación automática.**.

### REQ-05

The implementation MUST address: **Prioridad y preservación de contenido.**.


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
