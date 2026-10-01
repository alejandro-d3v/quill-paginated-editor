# Visual Pages

## Status

Proposed implementation specification.

## Authority

This specification is subordinate to `docs/constitution.md`. The constitution is authoritative if there is a conflict.

## Purpose

Representar visualmente el documento como páginas físicas.

## Scope

- Contenedor de páginas.
- Página individual.
- Dimensiones y márgenes.
- Área de contenido.
- Integración con el contenido de Quill.

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

The implementation MUST address: **Contenedor de páginas.**.

### REQ-02

The implementation MUST address: **Página individual.**.

### REQ-03

The implementation MUST address: **Dimensiones y márgenes.**.

### REQ-04

The implementation MUST address: **Área de contenido.**.

### REQ-05

The implementation MUST address: **Integración con el contenido de Quill.**.


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
