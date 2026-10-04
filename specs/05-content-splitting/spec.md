# Content Splitting

## Status

Active implementation specification.

## Authority

This specification is subordinate to `docs/constitution.md`.
The constitution is authoritative if there is a conflict.

## Purpose

Habilitar el corte real de párrafos entre páginas (constitution §7.3) sobre
el seam de la spec 04: `MeasuredBlock` gana geometría por línea, el motor
`paginate` corta por líneas y `LayoutDocument` gana descriptores de
fragmento (`lineRange`). Bajo A1 (discovery §3) esto son **descriptores de
corte**, nunca división física: el Delta subyacente permanece continuo, el
DOM del editor no se toca y la vista no cambia.

Esta spec NO clasifica bloques complejos ni refina listas/tablas (06), NO
introduce saltos manuales (07) y NO optimiza (10).

## Scope

- Extensión del seam: `MeasuredBlock.lineHeightsPx` y `minFragmentHeightPx`
  operativo; `LayoutBlock.lineRange` como descriptor de fragmento.
- Splittabilidad pura: `isSplittableBlock` — solo párrafos en esta spec.
- Medición de líneas renderizadas (`MeasurementService`): alturas de line
  boxes en orden de flujo (RULE-010: geometría, no caracteres).
- Corte en el motor: greedy por líneas con continuidad multi-página,
  regla de huérfanas mínima (≥ 1 línea por lado) y sin pérdida jamás.
- Invariants de splitting: reconstrucción exacta de líneas por bloque.

## Architectural constraints

Heredados de la constitución y de discovery. Se preservan explícitamente:

- **A1** (discovery §3): descriptores de corte, no división física. El
  Delta jamás se muta ni reescribe para representar cortes (RULE-003/012);
  el DOM del editor solo se lee (RULE-015) y la vista no cambia.
- **Seam** (discovery §4): el motor sigue siendo puro — consume líneas ya
  medidas, sin Angular ni DOM (RULE-006); la medición de líneas es
  browser-only, dentro de `MeasurementService`.
- **RULE-010 / Principle V**: los puntos de corte se calculan sobre
  geometría de líneas renderizadas — nunca por conteo de caracteres.
- **RULE-011**: ninguna línea se pierde ni se recorta; una línea más alta
  que una página desborda sola en su propia página.
- **RULE-005**: determinismo; **RULE-018**: sin `any`; **RULE-017**: sin
  dependencias nuevas.
- **RULE-019/020**: extensión aditiva de la spec 04 — el camino atómico
  de 04 queda intacto y su suite sigue pasando sin cambios de semántica.

## Requirements

### REQ-01 — Extensión del seam

En `src/app/common/pagination/block.ts` y `paginate.ts` MUST:

- `MeasuredBlock` gana `readonly lineHeightsPx?: readonly number[]` —
  alturas de las líneas renderizadas del bloque en orden de flujo.
  Contrato del productor: `MeasurementService` SIEMPRE lo emite — `[]`
  para bloques indivisibles. Es opcional en el tipo solo para que los
  fixtures de 04 sigan compilando sin editar (RULE-019); el motor lo
  trata con `?? []`.
- `minFragmentHeightPx` (declarado en 04) pasa a operativo: altura mínima
  que el fragmento inicial debe alcanzar para que un corte sea válido.
  En esta spec = altura de la primera línea del bloque (regla de
  huérfanas mínima: ≥ 1 línea por lado, garantizado estructuralmente —
  el fragmento inicial contiene la línea 0 y la continuación conserva al
  menos una línea). Afinar la **huérfana** (lado inicial, ≥ 2 líneas) es
  calibración de la medición; afinar la **viuda** (lado de continuación)
  exigirá extender el motor con un chequeo simétrico — anotado para la
  spec 10, no es trabajo de esta spec.
- Contrato de consistencia de flujo: `sum(lineHeightsPx) === heightPx`
  del bloque (la misma altura de flujo de 04). Regla de cierre: la línea
  i (< última) mide `top_{i+1} − top_i` (geometría de line boxes); la
  última completa hasta `heightPx`. Esto mantiene los offsets acumulados
  de los indicadores exactos (RULE-005, A1).
- `LayoutBlock` gana
  `readonly lineRange?: { readonly from: number; readonly to: number }` —
  presente SOLO en fragmentos de bloques divididos: rango semicerrado
  `[from, to)` de índices de línea del bloque fuente. Ausente = bloque
  completo. El PDF (spec 09) resolverá contenido por `id` + `lineRange`;
  esta spec no lo implementa.

### REQ-02 — Splittabilidad pura

En `src/app/common/pagination/extract-blocks.ts` MUST exportarse:

`export const isSplittableBlock = (block: Block): boolean;`

Pura (RULE-006): `true` si y solo si el op terminador del bloque (el
último op con `insert` terminado en `\n`) NO tiene atributos block-level
entre `header`, `list`, `blockquote`, `code-block`. Los formatos inline y
los embeds inline (p. ej. una imagen dentro del párrafo) NO impiden el
corte — pertenecen a su línea. En esta spec solo los párrafos son
divisibles; la clasificación completa es de la spec 06 (RULE-019:
aditivo). Un párrafo de una sola línea es splittable por tipo; el motor
jamás lo divide (REQ-04).

### REQ-03 — Medición de líneas

`MeasurementService.measure` (firma de 04, sin cambios) MUST, para cada
bloque con `isSplittableBlock(block) === true`:

- Producir `lineHeightsPx` a partir de las **líneas renderizadas** del
  elemento del bloque (RULE-010): técnica sugerida — `Range` sobre el
  contenido del hijo block-level + `getClientRects()`, agrupando rects
  por `top` (una línea por grupo), aplicando la regla de cierre de
  REQ-01 (`sum === heightPx`).
- Emitir `splittable: isSplittableBlock(block)` — deja de ser siempre
  `false` — y `minFragmentHeightPx: lineHeightsPx[0]`.
- Fallback determinista cuando el `Range` no produce rects (p. ej. jsdom o
  contenido vacío): `lineHeightsPx = [heightPx]` — con la consecuencia de
  que `minFragmentHeightPx = heightPx` y el bloque se degrada a
  **atómico** (corte imposible). Degradación segura y determinista: nunca
  pierde contenido (RULE-011).
- Si la agrupación por `top` no es exacta (imágenes inline producen
  varios rects por línea), la regla de cierre mantiene la suma exacta —
  el desvío queda contenido dentro del bloque (ver riesgos del plan).
- Para bloques indivisibles: `lineHeightsPx = []`,
  `minFragmentHeightPx` ausente, `splittable: false` — exactamente como
  en 04.

### REQ-04 — Corte en el motor

`paginate` (firma de 04, sin cambios) MUST extender el greedy para
bloques con `splittable === true` y `lineHeightsPx.length > 1` (reglas
constitution §7.2/§7.3/§7.5):

- Las líneas llenan el alto restante en orden de flujo.
- Cuando la siguiente línea no cabe y el fragmento colocado alcanza
  `minFragmentHeightPx` y queda al menos una línea restante: se emite el
  fragmento `{ id, heightPx: suma colocada, lineRange: { from, to } }`
  en la página actual, se cierra la página y el bloque **continúa** en la
  siguiente (§7.3) — pudiendo cortarse de nuevo (párrafos multi-página).
  Nota: al valor de esta spec, todo fragmento inicial contiene la línea 0
  y por tanto alcanza `minFragmentHeightPx` — el chequeo es el hook del
  contrato de tuning (discovery §4), no una restricción activa aquí.
- Si la primera línea del bloque no cabe en la página actual, el bloque
  arranca en la página siguiente sin cortar (§7.4 a nivel de bloque).
- Una línea más alta que una página completa se coloca sola en su
  propia página y desborda — jamás se pierde (RULE-011).
- Bloques indivisibles o de una línea siguen el camino atómico de 04,
  byte a byte (RULE-020): ningún test de 04 cambia de semántica.
- El motor no toca Angular, DOM ni Delta (RULE-006/012); los cortes son
  descriptores `lineRange`, no mutación del contenido.

### REQ-05 — Invariants de splitting (engine)

En `paginate.spec.ts` (puro, fixtures con literales), además de los de 04:

- **Reconstrucción sin pérdida por línea** (RULE-011, §13 "content split
  across pages"): para cada `id`, los fragmentos ordenados tilean
  `[0, n)` exactamente (sin huecos ni solapes) y la suma de sus
  `heightPx` es `sum(lineHeightsPx)` del bloque.
- Fixture de corte simple: bloque atómico 30 + párrafo `[30,30,30]` con
  `contentHeightPx 100` → página 1 con el atómico + fragmento
  `{lineRange {0,2}}`; página 2 con continuación `{lineRange {2,3}}`.
- Fixture multi-split: párrafo `[40,40,40,40,40]` solo, con 100 →
  3 páginas: `{0,2}`, `{2,4}`, `{4,5}`.
- Primer línea que no cabe → bloque entero en la página siguiente, sin
  fragmento de cero líneas.
- `minFragmentHeightPx` respetado: un fragmento inicial de altura menor
  jamás se produce (huérfana de cero líneas imposible).
- Línea desbordante (250 con página de 100) → sola en su página y el
  bloque continúa (sin pérdida).
- Sin cortes para `splittable: false` y para bloques de una línea.
- Determinismo (doble llamada deep-equal) y entrada no mutada
  (deep-equal tras la llamada).

### REQ-06 — Tests de medición de líneas

En `measurement.spec.ts` (jsdom, stubs deterministas):

- Stub de `document.createRange` cuyo `getClientRects` devuelve rects por
  línea y cuyo rango se aplica al hijo correcto → `lineHeightsPx`
  ordenados, `minFragmentHeightPx` = primera línea y
  `sum(lineHeightsPx) === heightPx` (con el `getBoundingClientRect` del
  hijo stubbeado como en 04).
- `Range` sin rects → fallback `[heightPx]` (una línea).
- Bloque indivisble (heading, vía fixture `Block`) → `lineHeightsPx:
[]`, `splittable: false`.
- Párrafo fixture `Block` → `splittable: true`.

### REQ-07 — NO avanzar a specs posteriores

Esta spec MUST NOT:

- Clasificar tipos de bloque más allá del predicado de REQ-02, dividir
  listas/tablas, ni medir imágenes asíncronas (spec 06).
- Introducir saltos manuales ni extender `MeasuredBlock` con banderas de
  break (spec 07).
- Renderizar contenido de header/footer ni numeración (spec 08).
- Implementar el renderizador por `lineRange` del PDF (spec 09 — la
  vista y el PDF consumen `LayoutDocument` tal cual).
- Implementar debouncing, invalidación incremental ni virtualización
  (spec 10).
- Tocar el DOM del editor, el wrapper, `home`, `PageBreakIndicators` o
  `page-frame` (A1/RULE-015: los fragmentos fluyen por `heightPx`; la
  vista es transparente al corte).
- Introducir dependencias (RULE-017) ni modificar config.

## Acceptance criteria

- `block.ts` declara `lineHeightsPx` con su contrato y `paginate.ts`
  declara `LayoutBlock.lineRange` (verificable por compilación);
  `isSplittableBlock` exportado (grep).
- `paginate.spec.ts` cubre el catálogo §13 "content split across pages"
  con los fixtures explícitos de REQ-05 y el invariant de reconstrucción
  (tile exacto + sumas) — todo pasa.
- Regresión 04: la suite previa de `paginate`/`extract-blocks`/
  `measurement` pasa SIN cambios de semántica, y los fixtures de 04
  compilan sin editar (`lineHeightsPx` opcional) — verificado por diff.
- `measurement.spec.ts` pasa con `createRange` stubbeado (líneas,
  `minFragmentHeightPx`, `sum === heightPx`); fallback y casos
  indivisibles cubiertos.
- `isSplittableBlock` testado: párrafos (puros, con inline formats y
  con embed inline) → `true`; header/list/blockquote/code-block →
  `false`.
- La vista y el wrapper quedan intactos: `git diff` NO toca `home/`,
  `common/components/`, `common/editor/` (los indicadores siguen
  funcionando porque los fragmentos acarrean `heightPx`).
- `npm run lint`, `npm test` y `npm run build` pasan; sin deps nuevas;
  config intacta.
- Determinismo por construcción: sin `Date`/`Math.random`/DOM en el
  motor y el predicado (inspección de diff; suite re-ejecutable).
- El Delta queda intacto: los tests de no-mutación de 04 siguen pasando
  (RULE-012 — solo descriptores).

## Out of scope

- Clasificación de bloques complejos, listas divisibles, tablas (06 y
  06b), medición asíncrona de imágenes (06).
- Saltos manuales de página (07).
- Contenido y numeración de header/footer (08).
- Renderizado PDF por `lineRange` (09).
- Debouncing, invalidación incremental, cacheo, virtualización y
  afinado de viudas/huérfanas (10 — la huérfana es calibración de la
  medición vía `minFragmentHeightPx`; la viuda requiere la extensión
  simétrica del motor anotada en REQ-01).
- Cambios en la vista, el wrapper o el DOM del editor (RULE-015/019).
- Trabajo no relacionado; optimización prematura (constitution §11).
