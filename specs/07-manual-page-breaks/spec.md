# Manual Page Breaks

## Status

Active implementation specification.

## Authority

This specification is subordinate to `docs/constitution.md`.
The constitution is authoritative if there is a conflict.

## Purpose

Representar saltos de página manuales de forma semántica (Principle VIII,
RULE-013): un Blot custom de Quill (`pageBreak`) visible y etiquetado que
vive en el Delta como `{ insert: { pageBreak: true } }`, se inserta con un
botón de toolbar, y fuerza el cierre de página en el motor tras el bloque
que lo porta (`MeasuredBlock.manualBreakAfter` — flag reservado por
discovery §4).

Esta spec NO renderiza contenido de header/footer ni numeración (08), NO
implementa el PDF (09 — el salto fluye por `LayoutDocument`
naturalmente) y NO optimiza (10).

## Scope

- Blot semántico `pageBreak` (BlockEmbed de Quill 2.x, sin tocar el core
  — custom Blots son el mecanismo sancionado: constitución §6 escalón 9,
  discovery §3 orden de extensión).
- Inserción por botón de toolbar con nombre accesible; eliminación nativa
  (Backspace/Delete sobre el embed).
- Persistencia: round-trip del embed por `getContents`/`setContents`.
- Clasificación: `BlockKind` gana `'page-break'` (indivisible);
  `MeasuredBlock` gana `manualBreakAfter`.
- Motor: cierre de página forzado tras un bloque con `manualBreakAfter`
  (prioridad del salto manual sobre el espacio restante); la paginación
  automática continúa en la página nueva.

## Architectural constraints

Heredados de la constitución y de discovery. Se preservan explícitamente:

- **Principle VIII / RULE-013**: el salto manual tiene representación
  EXPLÍCITA — jamás texto invisible ni formatos ajenos como mecanismo
  oculto. El embed es visible y accesible en el editor.
- **RULE-001/002**: el Blot es una extensión soportada de Quill
  (BlockEmbed + `Quill.register`), jamás una modificación del core.
- **A1** (discovery §3): el DOM del editor nunca se reestructura; el
  salto es contenido del Delta (RULE-003) y el cierre de página es un
  descriptor del motor — los indicadores existentes dibujan la frontera
  automáticamente (sin cambios de vista en esta spec).
- **Seam** (discovery §4): `blockKind`, `extractBlocks` y `paginate`
  siguen puros; la bandera `manualBreakAfter` es la extensión reservada
  para esta spec; la medición es browser-only.
- **RULE-011**: el embed es contenido — jamás se pierde en paginación ni
  en round-trips.
- **RULE-019/020**: aditivo. El motor SÍ cambia en esta spec (declarado:
  cierre forzado), pero la suite 04–06 pasa SIN cambios — los fixtures
  existentes no llevan la bandera y no activan el nuevo cierre.
- Sin `any` (RULE-018); sin dependencias nuevas (RULE-017); a11y del
  botón y del marcador (AGENTS.md "UI, Accessibility, and Security").

## Requirements

### REQ-01 — Blot semántico `pageBreak`

Bajo `src/app/common/editor/page-break-blot.ts` MUST existir un Blot
custom de Quill 2.x (BlockEmbed — `Quill.import('blots/block/embed')`):

- `static blotName = 'pageBreak'`; `static tagName = 'div'`;
  `static className = 'page-break'`.
- En el Delta: `{ insert: { pageBreak: true } }` — representación
  semántica (Principle VIII), persistida por Quill en
  `getContents`/`setContents` (verificado: Quill 2.0.3 soporta
  BlockEmbed nativamente, p. ej. el blot `video`).
- En el DOM: un `<div class="page-break">` visible (marcador del salto,
  distinguible del indicador punteado del overlay) con
  `role="separator"` y `aria-label="Salto de página"`.
- El wrapper (`EditorComponent`) MUST registrar el blot
  (`Quill.register(PageBreakBlot)`) en `initializeEditor`, antes de
  crear la instancia — cambio del wrapper sancionado por esta spec
  (agregar el botón REQ-02); fuera de eso, el wrapper no se refactoriza
  (RULE-019).

### REQ-02 — Inserción y eliminación

- El toolbar del wrapper (config existente en `initializeEditor`) MUST
  ganar un botón custom: entrada `'page-break'` en el `container` y un
  handler `'page-break'` que inserta el embed en la posición del cursor
  (`insertEmbed(index, 'pageBreak', true)`) y deja el cursor después
  del marcador.
- El botón MUST tener nombre accesible (`aria-label="Insertar salto de
página"`) e icono/texto visible (estilo mínimo en `styles.scss`).
- Eliminación: nativa de Quill — Backspace/Delete sobre el embed elimina
  el op del Delta. No se implementa lógica extra; se cubre con el
  round-trip de REQ-05.

### REQ-03 — Clasificación y bandera en el seam

- `BlockKind` (spec 06) gana `'page-break'` en su unión.
- `blockKind(block)` MUST devolver `'page-break'` cuando algún op del
  bloque es un embed `pageBreak` (`{ insert: { pageBreak: … } }`) —
  con precedencia sobre los atributos del terminador (el embed no es un
  atributo). Un párrafo con embeds inline normales (p. ej. image) sigue
  siendo `'paragraph'`: la detección es específica de la clave
  `pageBreak`.
- `'page-break'` NO es divisible (fuera de `SPLITTABLE_KINDS`) y se
  comporta como bloque atómico: `extractBlocks` produce el bloque
  normal (embed + `\n`, patrón de embed-en-línea-propia de 04);
  `isSplittableBlock` → `false`.
- `MeasuredBlock` gana `readonly manualBreakAfter?: boolean` (flag
  reservado por discovery §4 para esta spec). `MeasurementService`
  MUST emitir `manualBreakAfter: true` para bloques cuyo
  `blockKind === 'page-break'`; su `heightPx` es el flujo normal del
  elemento (medición de 04, sin cambios).
- Opcional en el tipo (`?`): los fixtures de 04–06 compilan sin editar;
  el motor lo trata con `?? false`.

### REQ-04 — Corte manual en el motor

`paginate` (puro, firma sin cambios) MUST cerrar la página tras colocar
un bloque con `manualBreakAfter === true`, incluso si queda espacio
(prioridad del salto manual sobre el llenado automático):

- El cierre manual abre página nueva y la paginación automática continúa
  en ella con `remainingPx` completo (§7.2).
- El bloque de salto sigue el camino atómico de 04 (indivisible): si no
  cabe, pasa solo a la página siguiente y el cierre manual aplica ahí.
  El cierre manual NUNCA produce una página vacía: si el desborde ya
  cerró la página que porta el marcador, no se cierra dos veces (el
  fixture de salto desbordante aserta que ninguna página queda vacía).
- Fronteras: un salto como último bloque del documento NO produce una
  página vacía final (la guarda de cierre de 04 lo impide); saltos
  consecutivos producen páginas que portan solo su marcador — contenido
  visible, sin pérdida (RULE-011).
- Declaración de cambio: `paginate.ts` SÍ se modifica en esta spec
  (a diferencia de 06) — de forma aditiva; TODO fixture sin
  `manualBreakAfter` produce el mismo `LayoutDocument` que en 04–06.

### REQ-05 — Tests

- `page-break-blot.spec.ts` (Quill REAL en jsdom, patrón de
  `home.spec`): tras registrar el blot, `insertEmbed` produce
  `{ insert: { pageBreak: true } }` en `getContents` (persistencia);
  `setContents` con ese op renderiza el `div.page-break` con
  `role="separator"` y `aria-label` (representación).
- `extract-blocks.spec.ts`: ops `[{ insert: { pageBreak: true } },
{ insert: '\n' }]` → un bloque `kind 'page-break'`, indivisible;
  párrafo con image inline sigue `'paragraph'` (regresión de 06).
- `measurement.spec.ts`: bloque page-break (DOM fixture del marcador) →
  `manualBreakAfter: true`, `splittable: false`,
  `lineHeightsPx: []`, `heightPx` de flujo normal.
- `paginate.spec.ts` (fixtures): `[atómico 30, salto (manualBreakAfter,
height 10), atómico 40]` con `contentHeightPx 100` → 2 páginas
  (página 1: [30, 10] cerrada por el salto con 60px de sobrante; página
  2: [40]); salto final sin página vacía extra; saltos consecutivos;
  salto que no cabe → solo en página siguiente y cierre manual allí,
  sin página vacía intercalada (aserción explícita).
- `editor.spec.ts` (mock): la config de Quill recibida por el
  constructor incluye el botón `'page-break'` en el container del
  toolbar y el handler; invocar el handler con el mock llama
  `insertEmbed` con `'pageBreak'` en la posición del cursor. Declarado:
  el mock de Quill gana `register: vi.fn()`, `import: vi.fn()`
  (devolviendo una clase base stub para `'blots/block/embed'` — el Blot
  la extiende en el scope del módulo; sin el stub, el import de
  `page-break-blot.ts` crashea todos los tests mockeados) e
  `insertEmbed: vi.fn()` (stubs de la API soportada, no cambio de
  semántica de app).

### REQ-06 — NO avanzar a specs posteriores

Esta spec MUST NOT:

- Renderizar contenido de header/footer ni numeración de páginas (08).
- Implementar el renderizado PDF por `lineRange` ni la consistencia
  visual↔PDF (09 — el salto fluye por `LayoutDocument` como frontera
  normal).
- Implementar atajos de teclado para insertar saltos (mejora futura sin
  spec asignada), debounce/incremental (10) ni tablas (06b).
- Cambiar los indicadores del overlay ni la vista (la frontera manual
  se dibuja con el indicador existente).
- Introducir dependencias (RULE-017) ni tocar el core de Quill
  (RULE-001/002).

## Acceptance criteria

- El blot existe, se registra y el round-trip Delta↔DOM pasa con Quill
  real: `insertEmbed` → `getContents` contiene
  `{ insert: { pageBreak: true } }`; `setContents` renderiza el
  marcador con `role="separator"` y `aria-label` (REQ-01/03/05).
- El toolbar incluye el botón con nombre accesible y el handler inserta
  (verificado con el mock en `editor.spec`); la eliminación nativa
  queda cubierta por el round-trip.
- `blockKind` clasifica `'page-break'` con precedencia sobre atributos;
  el párrafo con image inline sigue `'paragraph'` (regresión 06 en
  verde).
- `MeasuredBlock.manualBreakAfter` emitido solo para page-break; los
  fixtures de 04–06 compilan sin editar (opcionalidad).
- `paginate` cierra tras el salto con los fixtures explícitos:
  prioridad sobre el espacio restante, salto final sin página vacía,
  consecutivos, salto desbordante — todo en verde.
- Suite 04–06 pasa SIN cambios de expectativa (el cambio del motor es
  aditivo; el diff de los specs previos contiene solo las adiciones y
  los stubs del mock declarados en REQ-05).
- `npm run lint`, `npm test` y `npm run build` pasan; sin deps nuevas;
  config intacta.
- El Delta jamás se muta para representar saltos (RULE-012: el embed ES
  contenido del usuario, no un artifacto del motor) y ningún contenido se
  pierde (invariant de reconstrucción de 05/06 en verde con los
  fixtures de salto).

## Out of scope

- Contenido y numeración de header/footer (08).
- Renderizado PDF y consistencia visual↔PDF (09).
- Debouncing, invalidación incremental, cacheo, virtualización y
  calibración de viudas/huérfanas (10).
- Tablas (06b o descope documentado — discovery §7).
- Atajos de teclado para saltos; cambios en los indicadores del overlay
  o en la vista (RULE-019).
- Trabajo no relacionado; optimización prematura (constitution §11).
