# Complex Blocks

## Status

Proposed implementation specification.

## Authority

This specification is subordinate to `docs/constitution.md`. The constitution is authoritative if there is a conflict.

## Purpose

Definir layout para contenido complejo.

## Scope

- Clasificación de bloques.
- Imágenes.
- Listas.
- Tablas.
- Bloques indivisibles.
- Reglas específicas de medición y splitting.

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

The implementation MUST address: **Clasificación de bloques.**.

### REQ-02

The implementation MUST address: **Imágenes.**.

### REQ-03

The implementation MUST address: **Listas.**.

### REQ-04

The implementation MUST address: **Tablas.**.

### REQ-05

The implementation MUST address: **Bloques indivisibles.**.

### REQ-06

The implementation MUST address: **Reglas específicas de medición y splitting.**.


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
