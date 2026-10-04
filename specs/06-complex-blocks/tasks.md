# Complex Blocks — Tasks

## Preparation

- [x] Leer `docs/constitution.md` §6 (soporte progresivo del motor),
      §7.3, §13; RULE-003/004/006/010/011/012/015/017/018/019/020.
- [x] Leer `docs/discovery.md` §4 (extensión sancionada: tipo de bloque
      para 06), §7 (tablas fuera; regla indivisible por defecto), §10
      (riesgo #7), §11 (orden).
- [x] Leer `spec.md` y `plan.md` de esta spec (versión amendada `96f3c49`).
- [x] Leer en `AGENTS.md` las secciones "Development Workflow",
      "Spec-Driven Development", "Angular Rules (v21)", "Quill
      Integration", "Validation Commands" y "Final Checklist" (por
      nombre; la numeración cambia).
- [x] Leer `MEMORY.md` (estado post-05) y la skill
      `.agents/skills/quill-wrapper/SKILL.md` (la paginación lee el DOM
      renderizado; jamás lo reestructura).
- [x] Confirmar dependencias de 04/05: `block.ts`, `extract-blocks.ts`,
      `paginate.ts`, `measurement.ts` con las firmas del seam
      (commit `9b730c6`).
- [x] Confirmar línea base verde (`npm run lint`, `npm test`,
      `npm run build`). → PASS / PASS (94 tests) / PASS (ejecutados
      2026-10-04, antes de tocar nada).

## Implementation (REQ-01..REQ-04)

- [x] Añadir `BlockKind` a `src/app/common/pagination/block.ts`
      (`'paragraph' | 'heading' | 'list' | 'blockquote' | 'code-block'`)
      con el contrato documentado (derivado del op terminador;
      `align`/`indent` y formatos inline no cambian el tipo).
- [x] Añadir el clasificador puro `blockKind(block: Block): BlockKind`
      en `src/app/common/pagination/extract-blocks.ts` con precedencia
      de atributos: `list` > `header` > `blockquote` > `code-block` >
      párrafo por defecto; sin Angular/DOM (RULE-006).
      → KIND_BY_ATTRIBUTE (orden defensivo; los atributos de bloque son
      excluyentes por línea en Quill) + helper `terminatorOp`.
- [x] Redefinir `isSplittableBlock` sobre la matriz: paragraph, list,
      blockquote y code-block divisibles; heading indivisible. Los tests
      de 05 para list/blockquote/code-block se actualizan a divisible —
      los 3 ÚNICOS cambios sancionados a la suite previa.
      → rama defensiva conservada: sin op terminador → `false`
      (independiente de la matriz); el test de 05 pasa sin cambios.
- [x] Extender `src/app/common/pagination/measurement.ts` con las
      unidades por tipo: bloques `list` miden flujos de `<li>`
      (offsets entre ítems; regla de cierre `sum === heightPx`), solo
      cortables en fronteras de ítem; `paragraph`/`blockquote`/
      `code-block` siguen con líneas de texto (camino de 05); `heading`
      indivisible. Exportar `imagesReady(editorContainer): boolean`
      (todos los `<img>` con `complete === true`; el error de carga
      también habilita).
      → `measureUnits` (despacha por blockKind) + `measureListUnits`
      (regla de cierre absorbe el espaciado residual del `<ol>`).
- [x] Cablear `src/app/home/pages/home/home.ts`: el pipeline no
      recomputa mientras `imagesReady` sea false (mantiene el último
      layout válido); listener delegado en fase de captura sobre el
      elemento del editor para `load`/`error` de imágenes que
      incrementa un signal leído por el efecto (recomputación al
      cargar; coalescida por el efecto; sin bucles).
      → `imagesVersion` signal + `listenToImages` (guard por host;
      armado en la primera ejecución con el elemento disponible; sin
      cleanup manual — vive y muere con el elemento).

## Tests (REQ-05)

- [x] Extender `extract-blocks.spec.ts`: `blockKind` para cada tipo
      (párrafo puro/inline/embed, header, list bullet/ordered,
      blockquote, code-block; `align`/`indent` → párrafo); matriz de
      `isSplittableBlock` por tipo; los 3 updates declarados de 05
      como tests actualizados.
      → +9 tests de blockKind; 3 updates verificados por diff.
- [x] Extender `measurement.spec.ts`: fixture `<ol>` con `<li>`
      stubbeados → `lineHeightsPx` por ítem, `minFragmentHeightPx` =
      primer ítem, `sum === heightPx`; blockquote (líneas de texto);
      code-block en `<pre>`; `imagesReady` con y sin `<img>` sin
      `complete`; regresión de 04/05 sin cambios.
      → +7 tests (lista con 3 ítems, lista monoítem, blockquote,
      code-block, 3 de imagesReady); regresión intacta.
- [x] Añadir a `paginate.spec.ts` UN fixture end-to-end de lista
      divisible: bloque `list` con unidades `[50,20,50]` y
      `contentHeightPx 100` → corte exacto en frontera de ítem;
      invariant de reconstrucción (unidades tilean `[0,n)` y suman el
      flujo del bloque).
      → +1 test dedicado + fixture de lista añadido al invariant
      multi-fixture de 05.
- [x] Confirmar que el diff de la suite previa contiene exactamente
      los 3 updates declarados (ningún otro cambio de expectativa).
      → verificado por diff: 3 títulos indivisible→divisible + 3
      expectativas false→true; heading y defensivo intactos.
- [x] Ejecutar `npm test`. → PASS: 111 tests / 12 archivos (+17).

## Integration

- [x] Confirmar por diff que `paginate.ts` NO cambia (el corte por tipo
      lo logra la elección de unidades en la medición — RULE-019).
      → `git diff --stat -- paginate.ts`: vacío.
- [x] Confirmar pureza (RULE-006): `blockKind`/`isSplittableBlock` sin
      Angular/DOM; `<li>`/Range solo en `measurement.ts`.
      → grep: 0 matches de Angular/DOM en extract-blocks.ts.
- [x] Confirmar el fallback indivisible: tipo desconocido o fallback de
      medición → bloque atómico, jamás se pierde contenido (discovery
      §7, RULE-011).
      → sin terminador → `false` (rama defensiva); heading → `[]`;
      fallback `[heightPx]` intacto de 05.
- [x] Confirmar Delta/DOM del editor intactos y vista sin cambios salvo
      el wiring de `home.ts` (A1/RULE-015); config intacta
      (`eslint.config.mjs`, `tsconfig*.json`, `angular.json`,
      `package.json`); sin deps nuevas.
      → git status: solo `common/pagination/` + `home.ts`; config
      ausente del diff.
- [ ] Verificación manual en navegador (recomendada, no bloqueante):
      listas largas cortándose entre ítems, blockquote cortándose,
      imagen con URL remota → el layout aparece al cargarla; AXE.
      Documentar hallazgos (incl. listas anidadas y `<pre>` con scroll)
      para la spec 10.
      → NO EJECUTADA por el agente: requiere revisión humana en
      navegador; clasificador, unidades e imágenes están cubiertos por
      la suite. No bloqueante por diseño de la spec (REQ-06/plan).

## Review

- [x] `npm run lint` → PASS (tras `lint:fix`: estilo `readonly T[]` en
      KIND_BY_ATTRIBUTE y orden de imports en `home.ts`).
- [x] `npm test` → PASS (111/111).
- [x] `npm run build` → PASS (initial 240.19 kB / 63.59 kB transfer;
      chunk home 215.05 kB; warning preexistente `quill-delta`
      CommonJS).
- [x] `npx prettier --write` sobre los archivos tocados (no repo-wide:
      `format:check` repo-wide ya falla por archivos preexistentes fuera
      de scope). → ejecutado sobre los 7 tocados; `--check` PASS.
- [x] `tasks.md` refleja el estado real. (esta actualización)
- [x] `MEMORY.md` actualizado (≤ 50 líneas) con las decisiones de esta
      spec (unidad-li, matriz, imágenes async) y el estado del hallazgo
      del toolbar.
- [x] Sincronizar `AGENTS.md` (secciones por nombre): el overview de
      "Repository Overview" gana la clasificación y las reglas por
      tipo.
- [x] Reportar archivos modificados, comandos ejecutados y resultado.
- [x] NO iniciar `07-manual-page-breaks`.
