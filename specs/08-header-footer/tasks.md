# Header and Footer — Tasks

## Preparation

- [ ] Read `docs/constitution.md`.
- [ ] Read `spec.md`.
- [ ] Read `plan.md`.
- [ ] Inspect the existing implementation before modifying it.
- [ ] Identify dependencies on preceding specs.

## Implementation

- [ ] Configuración de header.
- [ ] Configuración de footer.
- [ ] Áreas reservadas.
- [ ] Número de página.
- [ ] Total de páginas.
- [ ] Integración con geometría.

## Integration

- [ ] Preserve Quill Delta as the canonical content.
- [ ] Preserve existing editor behavior.
- [ ] Avoid unnecessary Quill internal changes.
- [ ] Keep TypeScript strict.
- [ ] Verify interactions with dependent specs.

## Tests

- [ ] Add unit tests for core rules.
- [ ] Add integration tests where Angular/Quill boundaries matter.
- [ ] Add regression coverage.
- [ ] Verify deterministic behavior.
- [ ] Verify no content is lost.
- [ ] Run relevant tests.
- [ ] Run the Angular/TypeScript build.

## Review

- [ ] Confirm no second source of truth was introduced.
- [ ] Confirm performance implications are understood.
- [ ] Confirm `spec.md` acceptance criteria are satisfied.
- [ ] Document deviations or unresolved decisions.
