# Content Splitting — Tasks

## Preparation

- [x] Leer `docs/constitution.md` §3.6, §6 (soporte progresivo: long
      paragraphs), §7.2–§7.5, §10, §13; RULE-005/006/010/011/012/019/020.
- [x] Leer `docs/discovery.md` §3 (05 = descriptores de corte; el Delta
      permanece continuo), §4 (`MeasuredBlock` completo con
      `minFragmentHeightPx`), §7, §11.
- [x] Leer `spec.md` y `plan.md` de esta spec (versión amendada `eb5ac0d`).
- [x] Leer en `AGENTS.md` las secciones "Development Workflow",
      "Spec-Driven Development", "Validation Commands" y "Final
      Checklist" (por nombre; la numeración cambia).
- [x] Leer `MEMORY.md` (estado post-04) y la skill
      `.agents/skills/quill-wrapper/SKILL.md` (la paginación lee el DOM
      renderizado; jamás lo reestructura).
- [x] Confirmar dependencias de 04: `block.ts`, `extract-blocks.ts`,
      `paginate.ts` y `measurement.ts` existen con las firmas del seam
      (commit `ba1c137`).
- [x] Confirmar línea base verde (`npm run lint`, `npm test`,
      `npm run build`). → PASS / PASS (72 tests) / PASS (ejecutados
      2026-10-04, antes de tocar nada).

## Implementation (REQ-01..REQ-04)

- [x] Extender `src/app/common/pagination/block.ts`: añadir
      `lineHeightsPx?: readonly number[]` a `MeasuredBlock` con su
      contrato documentado (productor siempre lo emite; `[]` para
      indivisibles; `sum === heightPx` con regla de última línea;
      opcional solo para no editar fixtures de 04) y documentar
      `minFragmentHeightPx` como operativo (= primera línea en 05;
      fallback → `heightPx` → de facto atómico).
- [x] Extender `src/app/common/pagination/paginate.ts`: añadir
      `lineRange?: { from; to }` a `LayoutBlock` (presente solo en
      fragmentos; rango semicerrado de líneas del bloque fuente).
- [x] Añadir en `src/app/common/pagination/extract-blocks.ts` la
      función pura `isSplittableBlock(block: Block): boolean` — true si
      el op terminador no tiene atributos `header`/`list`/`blockquote`/
      `code-block`; inline formats y embeds inline no impiden el corte.
      → bucle inverso sobre ops; set de exclusión `BLOCK_LEVEL_ATTRIBUTES`.
- [x] Extender el motor en `src/app/common/pagination/paginate.ts`:
      greedy por líneas para bloques splittables con más de una línea
      (corte cuando la siguiente línea no cabe, fragmento ≥
      `minFragmentHeightPx` y ≥ 1 línea restante; continuidad
      multi-página; primer línea que no cabe → bloque entero en la
      siguiente; línea desbordante → sola sin pérdida; camino atómico
      de 04 intacto).
      → dos fases por ronda (simulación sin mutar `remainingPx`, luego
      emisión) para que el hook de tuning invalid-splits caiga al
      tratamiento atómico sin deshacer consumo.
- [x] Extender `src/app/common/pagination/measurement.ts`: para bloques
      splittables, medir line boxes con `Range` + `getClientRects`
      agrupados por `top`, aplicar la regla de última línea
      (`sum === heightPx`), emitir `minFragmentHeightPx` = primera línea
      y `splittable: isSplittableBlock(block)`; fallback `[heightPx]`
      sin rects o sin soporte de Range; indivisibles → `[]` como
      contrato REQ-01.
      → helper `lineRects` con try/catch: jsdom (Range sin soporte o sin
      rects) cae al fallback sin romper el pipeline.

## Tests (REQ-05, REQ-06)

- [x] Extender `extract-blocks.spec.ts`: `isSplittableBlock` — párrafo
      puro → true; párrafo con bold y con embed inline → true; `align`
      (no es atributo de no-párrafo) → true; `header`/`list`/
      `blockquote`/`code-block` → false; sin op terminador (defensivo)
      → false.
      → +9 tests (los de extract existentes sin cambios).
- [x] Extender `paginate.spec.ts`: fixture de corte simple (atómico 30 +
      párrafo `[30,30,30]` con 100 → fragmento `{0,2}` + continuación
      `{2,3}`); multi-split (`[40,40,40,40,40]` con 100 → 3 páginas
      `{0,2}`/`{2,4}`/`{4,5}`); primer línea que no cabe → bloque entero
      sin fragmento de cero líneas; línea desbordante (250/100) sola y el
      bloque continúa; sin cortes para indivisibles y monolínea;
      degenerado (contentHeight 0) → cada línea sola; determinismo;
      entrada no mutada.
      → +9 tests (los de 04 pasan sin cambios de semántica).
- [x] Añadir el invariant de reconstrucción a `paginate.spec.ts`: por
      cada id, los fragmentos ordenados tilean `[0, n)` exactamente, sus
      `heightPx` suman el bloque y el fragmento inicial alcanza
      `minFragmentHeightPx` — aplicado a los cinco fixtures de corte en
      un solo documento.
      → +2 tests (invariant + determinismo/no-mutación con splitting).
- [x] Extender `measurement.spec.ts`: stub de `document.createRange`
      con rects por línea → `lineHeightsPx` ordenados,
      `minFragmentHeightPx` = primera línea y `sum === heightPx`; Range
      sin rects → fallback `[heightPx]`; Range que lanza → mismo
      fallback; heading fixture → `lineHeightsPx: []` y
      `splittable: false` sin `minFragmentHeightPx`.
      → +4 tests; expectativas de 04 actualizadas con `lineHeightsPx: []`
      (contrato REQ-01: el productor siempre lo emite — fixtures y
      semántica de 04 intactos).
- [x] Verificar la regresión de 04: la suite previa pasa sin cambios de
      semántica y los fixtures de 04 compilan sin editar.
      → `measured()` de 04 (sin `lineHeightsPx`) compila tal cual; los
      9 tests previos de paginate y 5 de extract pasan idénticos.
- [x] Ejecutar `npm test`. → PASS: 94 tests / 12 archivos (+22).

## Integration

- [x] Confirmar pureza (RULE-006): `isSplittableBlock` y `paginate` sin
      Angular/DOM/`Range` (grep); el `Range` vive solo en
      `measurement.ts`.
      → grep preciso: 0 matches (`@angular`/DOM/`createRange`/
      `getClientRects`) en extract-blocks.ts y paginate.ts; los matches
      de "Range" eran `lineRange` (descriptor propio, dato puro).
- [x] Confirmar que `git diff` NO toca `home/`, `common/components/` ni
      `common/editor/` (A1/RULE-015: descriptores, no división física;
      la vista fluye por `heightPx`).
      → git status: solo `common/pagination/` (7 archivos).
- [x] Confirmar el Delta intacto: solo descriptores `lineRange`; los
      tests de no-mutación de 04 siguen pasando (RULE-012).
- [x] Confirmar config intacta (`eslint.config.mjs`, `tsconfig*.json`,
      `angular.json`, `package.json`) y sin deps nuevas (RULE-017).
      → git status: config ausente del diff; package.json intacto.
- [ ] Verificación manual en navegador (recomendada, no bloqueante):
      párrafos largos reales cortándose entre páginas con indicadores en
      las fronteras exactas; documentar hallazgos de calibración
      (viudas/huérfanas, agrupación de líneas) para la spec 10.
      → NO EJECUTADA por el agente: requiere revisión humana en
      navegador; los módulos puros y la medición están cubiertos por la
      suite. No bloqueante por diseño de la spec (REQ-06/plan).

## Review

- [x] `npm run lint` → PASS (tras 1 corrección: `no-useless-assignment`
      en `measureLines` resuelto extrayendo el helper `lineRects`).
- [x] `npm test` → PASS (94/94).
- [x] `npm run build` → PASS (initial 240.19 kB / 63.59 kB transfer; +1.4
      kB en el chunk home por el corte; warning preexistente
      `quill-delta` CommonJS).
- [x] `npx prettier --write` sobre los archivos tocados (no repo-wide:
      `format:check` repo-wide ya falla por archivos preexistentes fuera
      de scope). → ejecutado sobre los 7 tocados.
- [x] `tasks.md` refleja el estado real. (esta actualización)
- [x] `MEMORY.md` actualizado (≤ 50 líneas) con las decisiones del
      corte.
- [x] Sincronizar `AGENTS.md` (secciones por nombre): el overview de
      "Repository Overview" gana splitting activo (párrafos divisibles,
      `lineRange`, `minFragmentHeightPx` = 1 línea).
- [x] Reportar archivos modificados, comandos ejecutados y resultado.
- [x] NO iniciar `06-complex-blocks`.
