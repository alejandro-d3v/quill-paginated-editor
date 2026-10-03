# Page Geometry — Tasks

## Preparation

- [x] Leer `docs/constitution.md` §3.3–§3.4, §7.1, §13 y Principle VI
      (RULE-005, RULE-006, RULE-009, RULE-017, RULE-018).
- [x] Leer `docs/discovery.md` §4 (seam de medición) y §5 (estructura de
      carpetas).
- [x] Leer `spec.md` y `plan.md` de esta spec (versión amendada `de69744`).
- [x] Leer en `AGENTS.md` las secciones "Development Workflow",
      "Spec-Driven Development", "Validation Commands" y "Final Checklist"
      (por nombre; la numeración de secciones cambia).
- [x] Leer `MEMORY.md`.
- [x] Confirmar línea base verde (`npm run lint`, `npm test`,
      `npm run build`) antes de empezar.
      → PASS / PASS (13 tests) / PASS (ejecutados 2026-10-03, antes de
      tocar nada).
- [x] Confirmar la dependencia de 01: `src/app/common/document/document-settings.ts`
      existe y exporta `DocumentSettings`, `PageSettings`, `PageMargins`,
      `HeaderSettings`, `FooterSettings`, `DEFAULT_DOCUMENT_SETTINGS`.
      → verificado; consumido por `page-geometry.ts` como imports de tipos.

## Implementation (REQ-01..REQ-04)

- [x] Crear `src/app/common/pagination/unit-converter.ts`:
      `MM_PER_INCH`, `CSS_PX_PER_INCH`, `mmToPx`, `pxToMm`
      (puras, totales, sin redondeo).
- [x] Crear `src/app/common/pagination/page-geometry.ts`: - `PAGE_DIMENSIONS_MM` (A4 210×297; LETTER 215.9×279.4;
      LEGAL 215.9×355.6), - `PageDimensionsMm` + `pageDimensionsMm(settings)`
      (landscape = swap de width/height), - `PageGeometry` + `computePageGeometry(settings)` (§7.1 en px;
      header/footer deshabilitados aportan 0; sin redondeo), - `isValidPageGeometry(settings)` (veredicto derivado de
      `computePageGeometry` — REQ-04, única ruta aritmética).

## Tests (REQ-05)

- [x] Crear `unit-converter.spec.ts`: - `mmToPx(25.4) ≈ 96` y `pxToMm(96) ≈ 25.4` (`toBeCloseTo` ≥ 6), - Letter: `mmToPx(215.9) ≈ 816`, `mmToPx(279.4) ≈ 1056`, - roundtrip `pxToMm(mmToPx(x)) ≈ x`, - `mmToPx(0) === 0`.
      → 6 tests.
- [x] Crear `page-geometry.spec.ts`: - dimensiones exactas 3 tamaños × portrait/landscape, - §7.1 con header/footer disabled (aportan 0) y enabled, - origen del área de contenido (`marginLeft`; `marginTop + headerHeight`), - márgenes cero, - `isValidPageGeometry`: defaults → `true`; márgenes que exceden
      página → `false`; área ≤ 0 → `false`.
      → 12 tests.
- [x] Confirmar que los valores esperados se calculan de forma independiente
      (física conocida), no re-ejecutando las funciones bajo test.
      → `toPx` local en el spec (fórmula 96/25.4 inline); `mmToPx` no se
      importa en `page-geometry.spec.ts`.
- [x] Ejecutar `npm test`. → PASS: 31 tests / 6 archivos (18 nuevos).
- [x] Las dimensiones ISO/US usadas en los tests están hardcodeadas en el
      propio test (210, 297, 215.9, 279.4, 355.6), **no** importadas de
      `PAGE_DIMENSIONS_MM` (evita tautología).

## Integration

- [x] Confirmar que `common/pagination/` no importa Angular ni DOM
      (RULE-006): solo tipos de `common/document/`.
      → grep verificado: 0 matches de `@angular`, DOM, `Math.random` o
      `new Date` en los archivos de `common/pagination/`.
- [x] Confirmar que no se tocó `common/document/`, el wrapper del editor,
      ni configuración (`eslint.config.mjs`, `tsconfig*.json`, `angular.json`,
      `package.json`). → diff revisado.
- [x] Confirmar determinismo por re-ejecución de la suite: mismas entradas →
      mismos resultados (RULE-005).
      → sin fuentes no deterministas (inspección del diff); la suite asierta
      valores exactos en cada ejecución.

## Review

- [x] `npm run lint` → PASS.
- [x] `npm test` → PASS (31/31).
- [x] `npm run build` → PASS (initial 221.41 kB, sin cambios respecto a la
      base: `common/pagination/` aún no lo consume la app — lo harán
      03/04; warning preexistente `quill-delta` CommonJS).
- [x] `npx prettier --write` sobre los archivos creados (no repo-wide:
      `format:check` repo-wide ya falla por archivos preexistentes fuera
      de scope). → ejecutado; `--check` PASS en los 4.
- [x] `tasks.md` refleja el estado real. (esta actualización; los sub-bullets
      colapsados por el amend `de69744` fueron restaurados — solo formato.)
- [x] `MEMORY.md` actualizado (≤ 50 líneas).
- [x] Reportar archivos modificados, comandos ejecutados y resultado.
- [x] NO iniciar `03-visual-pages`.
