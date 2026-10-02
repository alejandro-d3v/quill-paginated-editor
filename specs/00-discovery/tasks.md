# Project Discovery — Tasks

## Preparation

- [x] Leer `docs/constitution.md` (especialmente §2, §5, §6, §14, §15).
- [x] Leer `AGENTS.md` (§6, §7, §16).
- [x] Leer `spec.md` y `plan.md` de esta spec.
- [x] Leer `README.md` del repositorio.
- [x] Leer `MEMORY.md`.
- [x] Inspeccionar `package.json`, `angular.json`, `tsconfig*.json`,
      `eslint.config.mjs`.

## Baseline verification

- [x] Ejecutar `npm run lint` y registrar el resultado exacto.
      → **PASS** (0 errores, 0 warnings) — ver `docs/discovery.md` §9.
- [x] Ejecutar `npm test` y registrar el resultado exacto.
      → **PASS** (3 archivos, 3 tests: App, Home, Editor) — §9.
- [x] Ejecutar `npm run build` y registrar el resultado exacto
      (incluyendo warnings como `quill-delta` CommonJS).
      → **PASS** (initial 220.80 kB / 57.81 kB transfer; warning `quill-delta`
      CommonJS registrado) — §9.
- [x] Si algo falla, corregir **solo lo mínimo** y volver a verificar.
      → N/A: la línea base llegó verde (correcciones previas del usuario
      verificadas y documentadas en §9); esta spec no requirió arreglos.
- [x] Registrar en el reporte los comandos exactos ejecutados. — §9.

## Repository inspection (constitution §14)

- [x] Determinar versión de Angular instalada. → 21.2.25 — §1.1.
- [x] Determinar versión de Quill instalada. → 2.0.3 — §1.1.
- [x] Localizar la integración actual de Quill
      (`src/app/common/components/editor/`). — §1.3.
- [x] Localizar el manejo actual de Delta (hoy: ninguno).
      → sin `text-change`, sin `output()`/signal — §1.3.
- [x] Localizar modelos de documento existentes (hoy: ninguno). — §1.2.
- [x] Localizar generación de PDF existente (hoy: ninguna). — §1.2.
- [x] Localizar Blots/módulos custom (hoy: ninguno). — §1.2.
- [x] Localizar estilos relevantes (`quill.snow.css`, `editor.scss`,
      `styles.scss`). — §1.2/§1.3.
- [x] Localizar tests existentes (`app.spec.ts`, `editor.spec.ts`,
      `home.spec.ts`). — §9.
- [x] Identificar abstracciones reutilizables.
      → rutas lazy (`HOME_ROUTES`), convenciones de scaffold, setup
      vitest+jsdom — §1.2.
- [x] Identificar archivos que NO deben modificarse.
      → config (angular.json/tsconfig/eslint/package.json), Quill core,
      `public/`, `app/`, `home/` — §5/§10.

## Decisions (REQ-01..REQ-05)

- [x] REQ-01: documentar la decisión sobre modelo de edición paginada
      (A1 recomendado; A2/A3 con justificación si se eligen).
      → **A1 elegida**, justificada contra RULE-003/004/012/015/020;
      A2 rechazada, A3 como evolución post-MVP — §3.
- [x] REQ-02: documentar el contrato del seam de medición
      (`paginate(measuredBlocks, geometry)` puro + `MeasurementService`).
      → contrato, `MeasuredBlock`, responsabilidades, rationale jsdom/RULE-006,
      diagrama de flujo — §4.
- [x] REQ-03: documentar la estructura de carpetas propuesta bajo
      `src/app/` y qué migra en qué spec.
      → `common/{document,pagination,pdf,editor}`; wrapper migra en 01;
      qué NO se mueve — §5.
- [x] REQ-04: documentar la estrategia PDF diferida a `09`, con
      criterios de selección y candidatos.
      → 6 criterios, 5 candidatos con notas, por qué es diferible — §6.
- [x] REQ-05: documentar que tablas NO entran en `06` y la regla por
      defecto para bloques desconocidos.
      → verificado quill 2.0.3 sin tablas; regla indivisible (RULE-011);
      reevaluación en 06b o descope — §7.

## Cross-reference audit (REQ-06)

- [x] Listar referencias cruzadas rotas en `.agents/skills/*` y
      `.opencode/commands/*` producto del renumbering de `AGENTS.md`.
      → 6 archivos con el detalle sección por sección — §8.
- [x] Listar el estado del `temp/pagination-spec/` (fuera de
      `skills-lock.json`). — §8 (nota final).
- [x] NO corregir; solo listar en `docs/discovery.md`. — sin cambios en
      skills/commands.

## Report

- [x] Crear `docs/discovery.md` con las 11 secciones del `plan.md`.
- [x] Actualizar `MEMORY.md`: - estado real del editor (implementado, renombrado a
      `EditorComponent`, spec corregido), - decisiones abiertas (las 5), - próxima spec (`01-document-model`).
- [x] Verificar que `docs/discovery.md` cubre REQ-01..REQ-07.
      → §3=REQ-01, §4=REQ-02, §5=REQ-03, §6=REQ-04, §7=REQ-05,
      §8=REQ-06, §9=REQ-07.
- [x] Verificar que `npm run lint`, `npm test` y `npm run build` siguen
      verdes tras cualquier cambio realizado.
      → re-ejecutados tras los cambios (solo `.md`): resultados en el
      reporte de la spec.
- [x] Confirmar que no se ha implementado nada de specs futuras.
      → cero cambios en `src/`, `angular.json`, `tsconfig*.json`,
      `eslint.config.mjs`, `package.json`.
- [x] Confirmar que `tasks.md` refleja el estado real. (esta actualización)
- [x] NO iniciar `01-document-model`.

## Review

- [x] `docs/discovery.md` es autocontenido y legible por alguien que no
      conoce el proyecto. → §1–§2 dan el contexto; cada decisión explica
      sus alternativas.
- [x] Las cinco decisiones están justificadas contra la constitución.
      → §3 (RULE-003/004/012/015/020), §4 (RULE-005/006), §6 (RULE-007/P-IV),
      §7 (RULE-011/017).
- [x] Los riesgos pendientes para 01–04 están identificados. — §10.
- [x] La sección de línea base no inventa comandos ni resultados.
      → §9: solo los tres comandos realmente ejecutados, con fecha y
      salida exacta.
