# Content Splitting — Plan

## Objective

Habilitar el corte de párrafos entre páginas (constitution §7.3) como
descriptores de fragmento sobre el seam de 04: geometría por línea en la
medición, greedy por líneas en el motor y `lineRange` en `LayoutDocument`
— sin tocar Delta, DOM del editor ni vista.

## Deliverable

Modificados (extensión aditiva, RULE-019):

- `src/app/common/pagination/block.ts` — `MeasuredBlock.lineHeightsPx`
  opcional con contrato (`sum === heightPx`, regla de última línea) y
  `minFragmentHeightPx` operativo.
- `src/app/common/pagination/paginate.ts` — `LayoutBlock.lineRange` +
  greedy por líneas con continuidad multi-página.
- `src/app/common/pagination/extract-blocks.ts` — `isSplittableBlock`
  puro (solo párrafos).
- `src/app/common/pagination/measurement.ts` — medición de line boxes
  (`Range` + `getClientRects`), `minFragmentHeightPx`, fallback.
- `src/app/common/pagination/paginate.spec.ts` — fixtures de corte +
  invariant de reconstrucción.
- `src/app/common/pagination/extract-blocks.spec.ts` — tests de
  `isSplittableBlock`.
- `src/app/common/pagination/measurement.spec.ts` — tests de líneas con
  `createRange` stubbeado.

SIN cambios: `home/`, `common/components/`, `common/editor/` — la vista es
transparente al corte (los fragmentos acarrean `heightPx`).

## Approach

1. Leer constitution §3.6, §6 (soporte progresivo: long paragraphs),
   §7.2–§7.5, §10, §13 ("content split across pages" + invariants);
   discovery §3 (descriptores de corte), §4 (`MeasuredBlock` completo),
   §7, §11; las specs 04 (seam implementado) y AGENTS.md por nombre de
   sección ("Development Workflow", "Spec-Driven Development",
   "Validation Commands", "Final Checklist").
2. Confirmar dependencias: 04 implementada (`block.ts`,
   `extract-blocks.ts`, `paginate.ts`, `measurement.ts` con las firmas
   del seam — commit `ba1c137`); línea base verde.
3. Extender `block.ts` (`lineHeightsPx` opcional + contratos
   documentados) y `LayoutBlock.lineRange` en `paginate.ts`.
4. Añadir `isSplittableBlock` en `extract-blocks.ts` + tests en su spec.
5. Extender el motor en `paginate.ts`: greedy por líneas (solo
   `splittable && lines > 1`), fragmentos con `lineRange`, continuidad
   multi-página, reglas de primer-línea/huérfana/línea desbordante;
   camino atómico intacto. Extender su spec con los fixtures de REQ-05
   (el invariant de reconstrucción como test central).
6. Extender `MeasurementService`: line boxes vía `Range` +
   `getClientRects` agrupados por `top`, regla de última línea
   (`sum === heightPx`), `minFragmentHeightPx = primera línea`, fallback
   `[heightPx]`, indivisibles → `[]`. Extender su spec con
   `document.createRange` stubbeado.
7. Ejecutar la suite completa: los tests de 04 son el arnés de
   regresión (atomic path) y deben pasar sin cambios de semántica.
8. `npm test`, `npm run lint`, `npm run build`; `npx prettier --write`
   sobre los tocados (no repo-wide).
9. Actualizar `tasks.md` y `MEMORY.md`; sincronizar `AGENTS.md`
   (overview: splitting activo, bloques divisibles = párrafos).
   Verificación manual recomendada en navegador: párrafos largos reales
   cortándose entre páginas con indicadores exactos.

## Design constraints

- Pureza (RULE-006): `isSplittableBlock` y el motor sin Angular/DOM; el
  `Range` vive solo en `measurement.ts` (browser-only).
- RULE-010: puntos de corte sobre line boxes renderizados — jamás conteo
  de caracteres.
- Aditivo (RULE-019): `lineHeightsPx` es opcional para que los fixtures
  de 04 compile sin editar; el camino atómico no se reescribe.
- Consistencia de flujo (REQ-01): `sum(lineHeightsPx) === heightPx` con
  la regla de última línea — los offsets acumulados de los indicadores
  permanecen exactos sin tocar la vista.
- A1/RULE-012: descriptores `lineRange`; el Delta y el DOM del editor
  jamás se modifican; `home`, indicadores y wrapper intactos.
- Sin `any` (RULE-018); sin deps (RULE-017).

## Risks

- **Exactitud de line boxes:** imágenes inline y spans producen varios
  rects por línea. Mitigación: agrupar rects por `top` (una línea por
  grupo) y cerrar con la regla de última línea; si un agrupamiento no es
  perfecto, la suma sigue siendo exacta — el desvío queda contenido
  dentro del bloque y solo afecta al punto de corte visual, no a los
  offsets de página. Documentar hallazgos para calibración en 10.
- **Espaciado del bloque (márgenes):** la regla de última línea asigna el
  remanente a la última línea; un corte intra-párrafo puede caer ± un
  margen respecto al hueco visual exacto. MVP aceptable bajo A1 (el
  overlay dibuja fronteras de página, acumulados exactos).
- **jsdom:** `Range.getClientRects` no mide → fallback determinista
  `[heightPx]`; los tests stubbean `document.createRange` — el pipeline
  real queda en la verificación manual.
- **Regresión del motor:** el greedy de 04 no debe cambiar para bloques
  atómicos. Mitigación: suite de 04 como arnés + fixtures de 04 sin
  editar (opcionalidad de `lineHeightsPx`).
- **Complejidad del multi-split:** párrafos que cruzan varias páginas.
  Mitigación: fixture tabular (`[40×5]` con 100 → 3 páginas) + invariant
  de reconstrucción (tile exacto de líneas por id).

## Verification

`05-content-splitting` está completa cuando:

- REQ-01..REQ-06 implementados y REQ-07 respetado.
- El invariant de reconstrucción pasa: fragmentos por id tilean `[0, n)`
  y sus alturas suman el bloque (sin pérdida a nivel de línea).
- La suite completa pasa, incluida la de 04 sin cambios de semántica.
- `npm run lint`, `npm test` y `npm run build` pasan; `git diff` no toca
  vista/wrapper; config intacta.
- `tasks.md` refleja el estado y `MEMORY.md` queda actualizado con las
  decisiones (solo párrafos divisibles, `minFragmentHeightPx` = primera
  línea, regla de última línea).
