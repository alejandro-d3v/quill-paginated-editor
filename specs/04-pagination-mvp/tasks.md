# Pagination MVP — Tasks

## Preparation

- [x] Leer `docs/constitution.md` §3.6 (Layout Model), §6 (contrato del
      motor), §7 (overflow/indivisible), §11, §13 (catálogo Pagination e
      invariants), §15 Phase 4; RULE-003/004/005/006/010/011/012/015.
- [x] Leer `docs/discovery.md` §3 (A1), §4 (seam: contrato completo de
      `MeasuredBlock`/`MeasurementService`), §7 (regla indivisible),
      §10 (riesgos #4/#5/#7), §11 (orden).
- [x] Leer `spec.md` y `plan.md` de esta spec (versión amendada `02e3774`).
- [x] Leer en `AGENTS.md` las secciones "Development Workflow",
      "Spec-Driven Development", "Angular Rules (v21)", "Quill
      Integration", "UI, Accessibility, and Security", "Validation
      Commands" y "Final Checklist" (por nombre; la numeración cambia).
- [x] Leer `MEMORY.md` (estado post-03) y la skill
      `.agents/skills/quill-wrapper/SKILL.md` (guardarraíles de
      exposición; la paginación lee el DOM renderizado sin tocar el
      wrapper).
- [x] Confirmar dependencias: `common/document/` (`Delta` via quill,
      `DEFAULT_DOCUMENT_SETTINGS`), `common/pagination/page-geometry.ts`
      (`PageGeometry`/`computePageGeometry`), `common/editor/`
      (`deltaChange`), `common/components/` (marco/canvas) — todos
      implementados (specs 01–03).
- [x] Confirmar línea base verde (`npm run lint`, `npm test`,
      `npm run build`). → PASS / PASS (40 tests) / PASS (ejecutados
      2026-10-04, antes de tocar nada).

## Implementation (REQ-01..REQ-05)

- [x] Crear `src/app/common/pagination/block.ts`: `BlockId`, `Block`,
      `MeasuredBlock` (readonly; `splittable` documentado como siempre
      `false` en 04, habilitado en 05).
- [x] Crear `src/app/common/pagination/extract-blocks.ts`:
      `extractBlocks(delta)` puro — un bloque por elemento block-level,
      multi-línea → un bloque por línea, embeds inline acumulados en el
      bloque de su línea (embed en línea propia → un bloque con embed +
      `\n`), runs de listas del mismo tipo fusionados en un bloque, ids
      ordinales, sin mutar el Delta.
      → fragmentos contiguos de un mismo op se fusionan en ops naturales
      por línea ("a" + "\n" → "a\n").
- [x] Crear `src/app/common/pagination/paginate.ts`:
      `LayoutBlock`/`LayoutPage`/`LayoutDocument` + `paginate` greedy:
      cabe → misma página; no cabe → siguiente; bloque que no cabe ni
      en una página vacía → solo en su propia página (desborda, jamás se
      pierde); vacío → una página vacía; degenerado (`≤ 0`) → cada bloque
      solo; determinista, sin Angular/DOM, consume solo alturas.
- [x] Crear `src/app/common/pagination/measurement.ts`:
      `MeasurementService` con
      `measure(blocks, editorContainer): readonly MeasuredBlock[]` — ids
      desde `blocks` (canónicos de `extractBlocks`), localiza
      `.ql-editor` (sin editor y blocks vacío → `[]`; desalineo de
      conteo → `Error` descriptivo, fail-fast), mide el hijo i-ésimo
      para el bloque i-ésimo en una sola pasada, `heightPx` = alto de
      flujo (diferencia de offsets; último: rect + margin inferior),
      `splittable: false`.
- [x] Exponer la superficie de medición en el wrapper:
      `editorElement` (`viewChild.required`) pasa de privado a readonly
      público en `src/app/common/editor/editor.ts` — solo el elemento
      contenedor, nunca la instancia de Quill.
- [x] Crear `src/app/common/components/page-break-indicators/page-break-indicators.{ts,html,scss}`:
      `PageBreakIndicators`, selector `app-page-break-indicators`,
      `OnPush`, inputs `layout` (nullable) y `geometry`; una línea
      decorativa (`aria-hidden`) por frontera interna de página en el
      offset acumulado; sin líneas con layout null o de una página;
      `position: relative` añadida a `.content-area` en
      `page-frame.scss`.
      → offsets en un `computed`; `pointer-events: none` en el host para
      no interferir la edición.
- [x] Cablear `src/app/home/pages/home/home.{ts,html}`: `content` signal
      desde `(deltaChange)`, `layout` con el resultado de
      `extractBlocks(content)` → `measure(blocks, editorElement())` →
      `paginate(measured, geometry())`; recomputación coalescida (N
      eventos → 1 recomputación con el último estado), lecturas DOM no
      reactivas, el pipeline nunca escribe `content`/`settings`;
      indicadores dentro del marco en el template.
      → implementado como `effect()` en el constructor: una ejecución
      por lote de cambios con el último estado (coalescing de CD),
      flujo unidireccional, `layout` no es leído por el effect.

## Tests (REQ-06)

- [x] Crear `paginate.spec.ts` (puro, sin TestBed): sin pérdida (ids
      concatenados == entrada, orden preservado) con fixtures normales,
      desbordantes y degenerados; determinismo (dos llamadas deep-equal);
      sin overflow → una página; overflow greedy verificable
      (`contentHeightPx 100`, bloques `[30,30,30,30]` → 2 páginas 3+1);
      bloque que no cabe ni en una página vacía → solo; vacío → una
      página vacía; entrada no mutada.
      → 9 tests.
- [x] Crear `extract-blocks.spec.ts` (puro): Delta vacío → `[]`; un
      párrafo; multi-línea → un bloque por línea; heading con atributos;
      run de listas de un tipo → un bloque; `ordered` vs `bullet`
      consecutivos → bloques distintos; embed en su propia línea → un
      bloque (embed + `\n`); embed inline entre texto → un solo bloque;
      Delta de entrada intacto (deep-equal).
      → 11 tests (incluye párrafo vacío y cierre de lista por texto sin
      lista).
- [x] Crear `measurement.spec.ts`: `blocks` vacío sin `.ql-editor` →
      `[]`; desalineo de conteo → `Error`; hijos con alturas de flujo
      stubbeadas → un `MeasuredBlock` por bloque con ids y alturas
      esperados.
      → 5 tests (rects stubbeados; margin del último = 0 en jsdom).
- [x] Crear `page-break-indicators.spec.ts`: layout de 3 páginas con
      alturas conocidas → 2 líneas en los offsets acumulados esperados;
      layout null o de una página → sin líneas.
      → 4 tests (incluye ancho de línea = contentWidthPx).
- [x] Extender `home.spec.ts`: el template renderiza
      `app-page-break-indicators` dentro del marco.
      → +1 test (el pipeline end-to-end con Quill real no es viable en
      jsdom — ver Integración).
- [x] Ejecutar `npm test`. → PASS: 72 tests / 12 archivos (+32).

## Integration

- [x] Confirmar que `block.ts`, `extract-blocks.ts` y `paginate.ts` no
      importan Angular ni DOM (RULE-006) — solo `measurement.ts` es
      Angular, y nada del dominio puro lo importa.
      → grep: 0 matches de `@angular`/DOM en los módulos puros.
- [x] Confirmar que la instancia de Quill no se filtra (grep de tipos de
      Quill fuera del wrapper) y que el DOM del editor solo se lee
      (A1/RULE-015 — inspección de diff).
      → grep `Quill` fuera de `common/editor/`: 0 matches; el pipeline
      solo mide (`getBoundingClientRect`/`getComputedStyle` de lectura).
- [x] Confirmar por grep: `position: relative` presente en
      `.content-area` de `page-frame.scss`. → 1 match.
- [x] Confirmar la guarda de bucle: el pipeline no escribe
      `content`/`settings`; recomputación coalescida (inspección de
      diff + suite termina sin timeouts).
      → effect unidireccional; `layout` no es dependencia del effect.
- [x] Confirmar que el toolbar actual (listas/imágenes/blockquotes/
      code-blocks) fluye por la regla indivisible del motor — cubierto
      por los fixtures de "bloque ≥ página" y sin pérdida.
      → `extractBlocks` trata listas como un bloque indivisible;
      cualquier bloque desborda solo, sin pérdida (fixtures del motor).
- [x] Confirmar que no se tocó `common/document/`, `common/pagination/`
      (02), el wrapper ni config más allá de lo que exige REQ-05
      (`eslint.config.mjs`, `tsconfig*.json`, `angular.json`,
      `package.json` intactos).
      → git status: solo los archivos de REQ-05 + módulos nuevos.
- [ ] Verificación manual en navegador (recomendada, no bloqueante):
      pipeline end-to-end con texto real (varias páginas), indicadores
      visibles en los cortes, y auditoría AXE; jsdom no puede cubrir el
      flujo medido. Documentar hallazgos para specs futuras.
      → NO EJECUTADA por el agente: requiere revisión humana en
      navegador; los módulos puros y el servicio están cubiertos por
      la suite. No bloqueante por diseño de la spec (REQ-06/plan).

## Review

- [x] `npm run lint` → PASS (tras 3 correcciones: narrowing de TS en
      closures de `extract-blocks` resuelto con `flushBlock` parametrizado,
      `String()` en template literals de `measurement`, orden de imports
      en `home` vía `lint:fix`).
- [x] `npm test` → PASS (72/72).
- [x] `npm run build` → PASS (initial 240.19 kB / 63.59 kB transfer;
      +8.84 kB por el motor; warning preexistente `quill-delta`
      CommonJS).
- [x] `npx prettier --write` sobre los archivos tocados (no repo-wide:
      `format:check` repo-wide ya falla por archivos preexistentes fuera
      de scope). → ejecutado sobre los 16 tocados.
- [x] `tasks.md` refleja el estado real. (esta actualización)
- [x] `MEMORY.md` actualizado (≤ 50 líneas) con las decisiones del seam.
- [x] Sincronizar `AGENTS.md` (secciones por nombre): el overview de
      "Repository Overview" gana el motor de paginación y los
      indicadores; "Repository Structure" gana los archivos nuevos
      (sin cambio de árbol: `pagination/` y `components/` ya listados).
- [x] Reportar archivos modificados, comandos ejecutados y resultado.
- [x] NO iniciar `05-content-splitting`.
