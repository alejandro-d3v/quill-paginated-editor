# Pagination MVP — Plan

## Objective

Producir el corazón del proyecto según el seam de discovery §4: extracción
pura de bloques, medición browser-only del editor renderizado (A1) y el
motor `paginate` puro con su invariants suite — más el cableado en `home`
con indicadores de salto.

## Deliverable

Nuevos (bajo `src/app/common/pagination/`):

- `block.ts` — `BlockId`, `Block`, `MeasuredBlock` (REQ-01).
- `extract-blocks.ts` + `extract-blocks.spec.ts` (REQ-02).
- `paginate.ts` + `paginate.spec.ts` — `LayoutDocument`/`LayoutPage`/
  `LayoutBlock` + motor (REQ-03).
- `measurement.ts` + `measurement.spec.ts` — `MeasurementService` (REQ-04).

Nuevos (bajo `src/app/common/components/`):

- `page-break-indicators/page-break-indicators.{ts,html,scss}` y
  `page-break-indicators.spec.ts` (REQ-05).

Modificados:

- `src/app/common/editor/editor.ts` — `editorElement` pasa a readonly
  público (superficie de medición; nunca la instancia de Quill).
- `src/app/home/pages/home/home.{ts,html}` — pipeline con signals
  (`content`, `layout`), recomputación coalescida, indicadores en el
  template.
- `src/app/common/components/page-frame/page-frame.scss` —
  `.content-area { position: relative; }`.
- `src/app/home/pages/home/home.spec.ts` — presencia de
  `app-page-break-indicators`.

## Approach

1. Leer constitution §3.6, §6, §7, §11, §13 (catálogo Pagination e
   invariants), §15 Phase 4; discovery §3 (A1), §4 (seam), §7 (regla
   indivisible), §10 (riesgos #4/#5/#7), §11; specs 01–03 (contratos:
   `deltaChange`, `PageGeometry`, marco/canvas); AGENTS.md por nombre de
   sección ("Angular Rules", "Quill Integration", "UI, Accessibility, and
   Security", "Validation Commands").
2. Confirmar dependencias: `computePageGeometry`/`PageGeometry` (02),
   `deltaChange` (01), marco de 03 — implementados; línea base verde.
3. Crear `block.ts` (tipos del seam) — primer archivo: todo lo demás
   depende de él.
4. Crear `extract-blocks.ts` + su spec (puros; fixtures con literales).
5. Crear `paginate.ts` + su spec (la invariants suite: sin pérdida,
   determinismo, greedy, desbordes, degenerados).
6. Crear `measurement.ts` + su spec (firma `measure(blocks, container)`;
   alturas de flujo stubbeadas en jsdom; desalineo de conteo → `Error`).
7. Exponer `editorElement` (readonly público) en el wrapper.
8. Crear `PageBreakIndicators` + spec; añadir `position: relative` a
   `.content-area`.
9. Cablear `home`: signals, pipeline coalescido, indicadores en el
   template; extender `home.spec`.
10. `npm test`, `npm run lint`, `npm run build`; `npx prettier --write`
    sobre los tocados (no repo-wide). Actualizar `tasks.md`/`MEMORY.md`;
    sincronizar `AGENTS.md` (secciones por nombre: el overview gana el
    motor de paginación). Verificación manual en navegador
    (recomendada, no bloqueante): pipeline end-to-end con texto real,
    breaks visibles y auditoría AXE — jsdom no puede cubrir el flujo
    medido.

## Design constraints

- El motor y `extractBlocks` son puros: cero imports de Angular/DOM en
  `block.ts`, `extract-blocks.ts`, `paginate.ts` (RULE-006); solo
  `measurement.ts` es Angular/browser, y nada lo importa desde el dominio
  puro.
- `heightPx` = alto de flujo (espaciado adyacente incluido), medido por
  diferencia de offsets — jamás rects desnudos que ignoran márgenes.
- `measure(blocks, …)` exige la alineación por firma: los ids fluyen de
  `extractBlocks` (canónicos); un desalineo de conteo lanza `Error`
  (fail-fast browser-side; los módulos puros siguen sin excepciones).
- A1: el editor solo se LEE (medir su DOM renderizado); jamás se
  reestructura (RULE-015) ni se expone la instancia de Quill (skill
  `quill-wrapper`).
- Recomputación coalescida y unidireccional: `deltaChange`/settings →
  pipeline → `layout`; el pipeline nunca escribe `content`/`settings`
  (guarda de bucle zoneless, discovery §10 #4); lecturas DOM no
  reactivas.
- Bloques atómicos (`splittable: false`); la regla indivisible de
  discovery §7 aplica a TODO bloque desde el día uno (el toolbar ya
  produce listas/imágenes/blockquotes — riesgo #7).
- Sin `any` (RULE-018); sin deps (RULE-017); `import type` de quill
  (decisión 01).
- Recomputación completa por cambio es INTENCIONAL en el MVP
  (coalescida); incremental es spec 10 (constitution §11: medir antes).

## Risks

- **Alineación `extractBlocks` ↔ DOM renderizado:** la fusión de runs de
  listas y la acumulación de embeds inline en su línea (REQ-02) mantienen
  1:1 con los hijos de `.ql-editor`; un desalineo rompería los offsets del
  overlay. Mitigación: `measure(blocks, …)` exige el conteo por firma y
  lanza `Error` descriptivo en desalineo (fail-fast); fixtures en
  `measurement.spec` + verificación manual en navegador (paso 10); si
  Quill renderiza un caso no contemplado, la regla indivisible preserva
  el contenido (RULE-011) y el desalineo se corrige en 06 con la
  clasificación real.
- **jsdom no mide:** `getBoundingClientRect` devuelve 0. Mitigación:
  `measurement.spec` con alturas de flujo stubbeadas (offsets/márgenes);
  el pipeline real queda como verificación manual; los módulos puros se
  testean con fixtures numéricos.
- **Bucle de reactividad zoneless** (riesgo #4 de discovery §10):
  mitigación estructural — flujo unidireccional, lecturas no reactivas,
  recomputación coalescida con el último estado; revisión de diff como
  checklist.
- **API nueva del wrapper (exposición de elemento):** mínimo —
  visibilidad del viewChild existente; cualquier exposición mayor
  requiere replanteo (skill: nunca la instancia).
- **Tamaño del diff:** 4 módulos nuevos + componente + wiring; mantener
  cada archivo enfocado en su REQ para auditar el diff.

## Verification

`04-pagination-mvp` está completa cuando:

- REQ-01..REQ-06 implementados y REQ-07 respetado.
- La invariants suite pasa: sin pérdida (incluye desbordes y degenerados),
  determinismo, Delta intacto, alineación de medición, indicadores.
- `npm run lint`, `npm test` y `npm run build` pasan; los tests de 01–03
  siguen pasando sin cambios de semántica.
- `tasks.md` refleja el estado real y `MEMORY.md` queda actualizado con
  las decisiones (superficie de medición = editor renderizado, fusión de
  listas, ids ordinales, recomputación coalescida).
