# Page Geometry — Tasks

## Preparation

- [ ] Leer `docs/constitution.md` §3.3–§3.4, §7.1, §13 y Principle VI
      (RULE-005, RULE-006, RULE-009, RULE-017, RULE-018).
- [ ] Leer `docs/discovery.md` §4 (seam de medición) y §5 (estructura de
      carpetas).
- [ ] Leer `spec.md` y `plan.md` de esta spec.
- [ ] Leer en `AGENTS.md` las secciones "Development Workflow",
      "Spec-Driven Development", "Validation Commands" y "Final Checklist"
      (por nombre; la numeración de secciones cambia).
- [ ] Leer `MEMORY.md`.
- [ ] Confirmar línea base verde (`npm run lint`, `npm test`,
      `npm run build`) antes de empezar.
- [ ] Confirmar la dependencia de 01: `src/app/common/document/document-settings.ts`
      existe y exporta `DocumentSettings`, `PageSettings`, `PageMargins`,
      `HeaderSettings`, `FooterSettings`, `DEFAULT_DOCUMENT_SETTINGS`.

## Implementation (REQ-01..REQ-04)

- [ ] Crear `src/app/common/pagination/unit-converter.ts`:
      `MM_PER_INCH`, `CSS_PX_PER_INCH`, `mmToPx`, `pxToMm`
      (puras, totales, sin redondeo).
- [ ] Crear `src/app/common/pagination/page-geometry.ts`: - `PAGE_DIMENSIONS_MM` (A4 210×297; LETTER 215.9×279.4;
      LEGAL 215.9×355.6), - `PageDimensionsMm` + `pageDimensionsMm(settings)`
      (landscape = swap de width/height), - `PageGeometry` + `computePageGeometry(settings)` (§7.1 en px;
      header/footer deshabilitados aportan 0; sin redondeo), - `isValidPageGeometry(settings)` (márgenes que exceden la página o
      área ≤ 0 → `false`).

## Tests (REQ-05)

- [ ] Crear `unit-converter.spec.ts`: - `mmToPx(25.4) ≈ 96` y `pxToMm(96) ≈ 25.4` (`toBeCloseTo` ≥ 6), - Letter: `mmToPx(215.9) ≈ 816`, `mmToPx(279.4) ≈ 1056`, - roundtrip `pxToMm(mmToPx(x)) ≈ x`, - `mmToPx(0) === 0`.
- [ ] Crear `page-geometry.spec.ts`: - dimensiones exactas 3 tamaños × portrait/landscape, - §7.1 con header/footer disabled (aportan 0) y enabled, - origen del área de contenido (`marginLeft`; `marginTop + headerHeight`), - márgenes cero, - `isValidPageGeometry`: defaults → `true`; márgenes que exceden
      página → `false`; área ≤ 0 → `false`.
- [ ] Confirmar que los valores esperados se calculan de forma independiente
      (física conocida), no re-ejecutando las funciones bajo test.
- [ ] Ejecutar `npm test`.
- [ ] Las dimensiones ISO/US usadas en los tests MUST estar hardcodeadas en el propio test (210, 297, 215.9, 279.4, 355.6), **no** importadas de `PAGE_DIMENSIONS_MM` (evita tautología).

## Integration

- [ ] Confirmar que `common/pagination/` no importa Angular ni DOM
      (RULE-006): solo tipos de `common/document/`.
- [ ] Confirmar que no se tocó `common/document/`, el wrapper del editor,
      ni configuración (`eslint.config.mjs`, `tsconfig*.json`, `angular.json`,
      `package.json`).
- [ ] Confirmar determinismo por re-ejecución de la suite: mismas entradas →
      mismos resultados (RULE-005).

## Review

- [ ] `npm run lint` → PASS.
- [ ] `npm test` → PASS.
- [ ] `npm run build` → PASS.
- [ ] `npx prettier --write` sobre los archivos creados (no repo-wide:
      `format:check` repo-wide ya falla por archivos preexistentes fuera
      de scope).
- [ ] `tasks.md` refleja el estado real.
- [ ] `MEMORY.md` actualizado (≤ 50 líneas).
- [ ] Reportar archivos modificados, comandos ejecutados y resultado.
- [ ] NO iniciar `03-visual-pages`.
