# Manual Page Breaks — Plan

## Objective

Saltos de página manuales semánticos de punta a punta: Blot custom visible
y accesible → botón de toolbar → clasificación pura → bandera
`manualBreakAfter` en el seam → cierre forzado en el motor — sin tocar el
core de Quill y sin cambios de vista (el indicador existente dibuja la
frontera).

## Deliverable

Nuevos:

- `src/app/common/editor/page-break-blot.ts` — Blot `pageBreak`
  (BlockEmbed) + registro.
- `src/app/common/editor/page-break-blot.spec.ts` — round-trip con
  Quill real en jsdom.

Modificados:

- `src/app/common/pagination/block.ts` — `BlockKind` + `'page-break'`;
  `MeasuredBlock.manualBreakAfter?`.
- `src/app/common/pagination/extract-blocks.ts` + `.spec.ts` —
  detección del embed con precedencia; regresión 06.
- `src/app/common/pagination/measurement.ts` + `.spec.ts` — emisión de
  `manualBreakAfter` para page-break.
- `src/app/common/pagination/paginate.ts` + `.spec.ts` — cierre forzado
  tras `manualBreakAfter` (cambio declarado) + fixtures de frontera.
- `src/app/common/editor/editor.ts` + `.spec.ts` — registro del blot +
  botón/handler de toolbar; mock de Quill gana
  `register`/`import`(clase base stub)/`insertEmbed`
  (declarado).
- `src/styles.scss` — marcador `.page-break` visible + icono del botón
  (`.ql-page-break`).

SIN cambios: `home/`, `common/components/` (indicadores), envoltura del
pipeline, config.

## Approach

1. Leer constitution Principle VIII/RULE-013, §6 (escalón 9: custom
   Blots), §7.2, §13 ("manual page break" + "page-break preservation");
   discovery §3 (orden de extensión), §4 (flag reservado), §11; specs
   04–06 (seam implementado); AGENTS.md por nombre de sección.
2. Confirmar dependencias: 06 implementada (`428def3`); línea base
   verde; verificado en `package.json`: `quill ^2.0.3` (BlockEmbed
   nativo).
3. Crear el Blot (BlockEmbed, `blotName 'pageBreak'`, clase
   `.page-break`, `role="separator"`, `aria-label`) + su spec con Quill
   real: round-trip Delta↔DOM.
4. Extender el seam: `BlockKind + 'page-break'` (detección del embed
   con precedencia sobre atributos) y `MeasuredBlock.manualBreakAfter?`
   (opcional — fixtures de 04–06 compilan sin editar).
5. Extender `MeasurementService`: emitir la bandera para page-break;
   altura de flujo normal (medición de 04 sin cambios).
6. Extender el motor: en el camino atómico, cerrar página tras un bloque
   con `manualBreakAfter`; cubrir salto final/consecutivo/desbordante.
   Extender `paginate.spec` con los 4 fixtures de frontera.
7. Cablear el wrapper: `Quill.register(PageBreakBlot)` en
   `initializeEditor`; botón `'page-break'` (container + handler con
   `insertEmbed` y cursor tras el marcador; `aria-label` del botón).
   Extender `editor.spec`: mock con
   `register`/`import`(clase base stub)/`insertEmbed`, aserción
   de config + invocación del handler.
8. Estilos mínimos en `styles.scss` (marcador distinguible del
   indicador punteado; icono del botón).
9. `npm test`, `npm run lint`, `npm run build`; `npx prettier --write`
   sobre los tocados. Verificar por diff: suite previa 04–06 sin
   cambios de expectativa; solo `paginate.ts` del dominio puro cambia.
   Actualizar `tasks.md`/`MEMORY.md`/`AGENTS.md`. Verificación manual
   en navegador: insertar salto → frontera exacta en el marcador;
   eliminar con Backspace; AXE.

## Design constraints

- El Blot usa SOLO APIs soportadas: `Quill.import('blots/block/embed')`
  - `Quill.register` (RULE-001/002; discovery §3 orden de extensión).
- Semántica explícita (Principle VIII/RULE-013): embed visible y
  etiquetado; jamás texto invisible ni formatos ajenos.
- El embed ES contenido del usuario: el motor solo lee la bandera y
  cierra la página (RULE-011/012); los indicadores existentes dibujan la
  frontera — vista intacta.
- Pureza (RULE-006): `blockKind`/`extractBlocks`/`paginate` sin
  Angular/DOM; el Blot y el registro viven en el lado editor.
- Aditivo (RULE-019/020): la bandera es opcional; los fixtures de
  04–06 compilan sin editar y sus expectativas no cambian.
- Sin `any` (RULE-018); sin deps (RULE-017).

## Risks

- **Blot + mock de Quill:** el mock de `editor.spec` no tiene
  `register`/`import`/`insertEmbed` → el wiring rompería los tests
  existentes (el Blot extiende `Quill.import('blots/block/embed')` en
  el scope del módulo: sin stub de `import`, el import crashea todos
  los tests mockeados). Mitigación: extender el mock (declarado en la
  spec) con stubs de la
  API soportada; el round-trip real se prueba con Quill real en
  `page-break-blot.spec` (patrón `home.spec`).
- **Forma exacta del op del BlockEmbed en el Delta:** el embed en
  línea propia debe producir ops `[embed, '\n']` (patrón de embed de
  04). Mitigación: el round-trip con Quill real fija la forma
  contractually; si Quill la normaliza distinto, `extractBlocks` se
  ajusta en la implementación (la clasificación es por clave
  `pageBreak`, no por forma del op).
- **Cierres manuales + indicadores:** la frontera cae al final del
  bloque-marcador; un desvío de margen haría el indicador
  ligeramente posterior al marcador. Aceptable bajo A1 (desvío
  contenido intra-bloque, calibración en 10).
- **Saltos consecutivos** producen páginas solo con marcadores —
  comportamiento documentado, sin pérdida; alternativa (colapsar) sería
  trabajo de vista, fuera de scope.
- **Botón custom de toolbar:** Quill no genera labels accesibles para
  handlers custom — el nombre accesible se añade explícitamente
  (post-init o atributo en el container); AXE en la verificación
  manual.

## Verification

`07-manual-page-breaks` está completa cuando:

- REQ-01..REQ-05 implementados y REQ-06 respetado.
- El round-trip con Quill real pasa (Delta↔DOM, representación y
  persistencia) y los 4 fixtures del motor están en verde.
- La suite 04–06 pasa sin cambios de expectativa (diff de specs previos
  vacío) y los fixtures previos compilan sin editar.
- `npm run lint`, `npm test` y `npm run build` pasan; config intacta;
  sin deps.
- `tasks.md` refleja el estado y `MEMORY.md` queda actualizado con las
  decisiones (blot BlockEmbed, precedencia de clasificación, bandera
  manualBreakAfter, cierre declarado del motor).
