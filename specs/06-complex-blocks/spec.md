# Complex Blocks

## Status

Active implementation specification.

## Authority

This specification is subordinate to `docs/constitution.md`.
The constitution is authoritative if there is a conflict.

## Purpose

Clasificar los bloques por tipo (`BlockKind`) y completar el soporte del
motor para el contenido que el toolbar ya produce (constitution §6): listas
divisibles a nivel de ítem, blockquotes y code-blocks divisibles a nivel de
línea, y medición de imágenes asíncrona. La regla indivisible de discovery
§7 sigue siendo el fallback para cualquier tipo desconocido.

Esta spec NO incluye tablas (decisión cerrada: discovery §7), NO introduce
saltos manuales (07) ni bandas de header/footer (08), y NO repara el offset
del toolbar detectado en la verificación manual de 05 (hallazgo confirmado
sin spec asignada — decisión pendiente del humano, ver reporte de
spec-write).

## Scope

- `BlockKind` y el clasificador puro `blockKind(block)` (discovery §4:
  "tipo de bloque para reglas específicas (06)").
- Matriz de divisibilidad por tipo; `isSplittableBlock` redefinido sobre
  la clasificación (updates declarados a 3 tests de 05).
- Unidades de medición por tipo: `<li>` para listas; líneas de texto para
  párrafo/blockquote/code-block — el motor NO cambia (consume
  `lineHeightsPx` genéricamente; la unidad de corte la fija la medición).
- Imágenes asíncronas: `imagesReady` + recomputación al cargar.
- La regla indivisible por defecto (discovery §7) como fallback.

## Architectural constraints

Heredados de la constitución y de discovery. Se preservan explícitamente:

- **A1** (discovery §3): descriptores de corte; el Delta, el DOM del
  editor y la vista no se reestructuran (RULE-012/015). Para bloques
  `list`, `lineRange` refiere índices de `<li>` (contrato para 09).
- **Seam** (discovery §4): `blockKind` y la clasificación son puros;
  las unidades por tipo las produce `MeasurementService` (browser-only);
  el motor consume `lineHeightsPx` sin conocer tipos (RULE-006).
- **RULE-010 / Principle V**: unidades de corte medidas del render
  (offsets de `<li>`, line boxes) — jamás conteo de caracteres.
- **RULE-011**: la regla indivisible por defecto (desconocido → atómico)
  NUNCA pierde contenido; discovery §7.
- **RULE-019/020**: extensión aditiva. El motor `paginate` NO debe
  requerir cambios en esta spec; los 3 updates de tests de 05
  (list/blockquote/code-block pasan a divisibles) están sancionados por
  este alcance y son los ÚNICOS cambios de semántica previa.
- Sin `any` (RULE-018); sin dependencias nuevas (RULE-017); Quill core
  intocado (RULE-001/002).

## Requirements

### REQ-01 — Vocabulario y clasificador puro

En `src/app/common/pagination/block.ts` MUST declararse:

`export type BlockKind = 'paragraph' | 'heading' | 'list' | 'blockquote' | 'code-block';`

En `extract-blocks.ts` MUST exportarse el clasificador puro:

`export const blockKind = (block: Block): BlockKind;`

Derivado de los atributos del op terminador (el último op con `insert`
terminado en `\n`), con precedencia: `list` → `'list'`; `header` →
`'heading'`; `blockquote` → `'blockquote'`; `code-block` →
`'code-block'`; sin atributos block-level o con atributos que no son de
tipo (p. ej. `align`, `indent`, formatos inline) → `'paragraph'`. Los
atributos de bloque son excluyentes por línea en Quill — la precedencia
es únicamente defensiva para entrada malformada, no una búsqueda de
combinaciones reales.
Discovered evidence: discovery §4 sanciona la extensión "tipo de bloque
(06)"; el set de atributos block-level es el ya verificado de 04/05
(`BLOCK_LEVEL_ATTRIBUTES`). Puro: sin Angular ni DOM (RULE-006).

### REQ-02 — Matriz de divisibilidad

`isSplittableBlock` (05) MUST redefinirse sobre la clasificación —
`blockKind(block)` en `{ 'paragraph', 'list', 'blockquote', 'code-block' }`
→ divisible; `'heading'` → indivisible. El `splittable` del
`MeasuredBlock` fluye de esta matriz. `isSplittableBlock` CONSERVA la
rama defensiva de 05: un bloque sin op terminador (entrada malformada)
→ `false`, con independencia de la matriz — así los updates declarados
siguen siendo exactamente 3. Justificación de la ampliación
respecto a 05 (donde solo los párrafos eran divisibles): constitution §6
lista lists/blockquotes/code-blocks como soporte progresivo del motor, y
el template de esta spec los trae en scope. **Updates declarados**: los
tests de 05 que afirman list/blockquote/code-block → indivisible se
actualizan a divisible — única semántica previa que cambia; todo lo demás
de la suite 04/05 pasa sin cambios.

### REQ-03 — Unidades de medición por tipo

`MeasurementService` MUST producir las unidades de corte (`lineHeightsPx`)
según el `blockKind` del bloque, con la misma regla de cierre de 05
(`sum === heightPx`; última unidad completa):

- `'list'`: unidades = **flujos de los `<li>`** del elemento `<ol>/<ul>`:
  `li[i+1].top − li[i].top` entre ítems contiguos. Un bloque de lista SOLO
  puede cortarse en fronteras de ítem — garantizado porque la medición no
  emite unidades más finas que el `<li>` (el motor consume unidades, no
  las inventa). Los `<li>` con listas anidadas (`indent`) miden con su
  contenido anidado incluido; la alineación 1:1 con el hijo
  `<ol>/<ul>` de `.ql-editor` se mantiene (run fusionado en 04).
- `'paragraph'` / `'blockquote'` / `'code-block'`: unidades = líneas de
  texto renderizadas (Range + `getClientRects` agrupados por `top`, como
  en 05) — blockquote y code-block son elementos de texto único, misma
  técnica.
- `'heading'`: indivisible → `lineHeightsPx: []`, `splittable: false`,
  sin `minFragmentHeightPx` (como en 04/05).
- `minFragmentHeightPx` = primera unidad (línea para texto, primer
  `<li>` para listas); fallback `[heightPx]` idéntico al de 05.
- Como en 05, la unidad final absorbe el espaciado residual del elemento
  (incluido el padding del `<ol>`/`<blockquote>`/`<pre>`) —
  `sum === heightPx` es exacto aunque el espaciado no se reparta
  simétricamente entre unidades; no "repartir" el padding a mano.
- El motor `paginate` NO cambia: cualquier diff en `paginate.ts` en esta
  spec es una anomalía a justificar (verificación por diff).

### REQ-04 — Imágenes asíncronas

Las imágenes son embeds inline (04): viven en una línea de texto y esa
línea simplemente crece — el riesgo es medir ANTES de que carguen
(RULE-010: geometría del render real). MUST:

- `MeasurementService` exportar
  `imagesReady(editorContainer: HTMLElement): boolean` — `true` cuando
  todos los `<img>` del contenedor tienen `complete === true` (una imagen
  con error también deja `complete` en `true` → el flujo nunca se queda
  colgado por una URL rota).
- `home` MUST gatear la recomputación: el pipeline no recalcula el layout
  mientras `imagesReady` sea `false` (mantiene el último layout válido);
  y MUST re-disparar la recomputación cuando las imágenes terminen: un
  listener delegado en fase de captura (`load` y `error` no burbujean)
  sobre el elemento del editor que incrementa un signal (p. ej.
  `imagesVersion`) leído por el efecto del pipeline. Coalescido por el
  propio efecto (04/05); sin bucles (los eventos de carga son one-shot
  por imagen). El listener se arma en la primera ejecución del pipeline
  con el elemento disponible (tras resolver `editorElement()`) y no
  requiere cleanup manual: vive y muere con el elemento del editor.

### REQ-05 — Tests

- `extract-blocks.spec.ts`: `blockKind` — párrafo puro/con inline/embed
  → `'paragraph'`; `header` → `'heading'`; `list` (bullet y ordered) →
  `'list'`; `blockquote` → `'blockquote'`; `code-block` → `'code-block'`;
  `align`/`indent` sin otro atributo → `'paragraph'`. Matriz:
  `isSplittableBlock` para cada tipo + los 3 updates declarados de 05.
- `measurement.spec.ts`: fixture `<ol>` con 3 `<li>` (tops stubbeados) →
  `lineHeightsPx` = flujos por ítem, `minFragmentHeightPx` = primer ítem,
  `sum === heightPx`; bloquequote fixture (líneas de texto, mismo camino
  que párrafo); code-block fixture (líneas de texto en `<pre>`);
  `imagesReady` con/sin imágenes incompletas; regresión: los fixtures de
  04/05 (heading indivisible, párrafo con líneas, fallback) pasan sin
  cambios.
- `paginate.spec.ts`: UN fixture end-to-end de lista divisible (bloque
  `list` con unidades `[50,20,50]` con `contentHeightPx 100`) que
  demuestre el corte en fronteras de ítem — el motor sin cambios, la
  prueba de que la unidad la fija la medición. Invariant de
  reconstrucción de 05 aplicado al fixture de lista.

### REQ-06 — NO avanzar a specs posteriores

Esta spec MUST NOT:

- Implementar tablas (decisión cerrada: discovery §7; reevaluación en
  `06b-tables` o descope documentado).
- Introducir saltos manuales ni Blots custom (07).
- Renderizar contenido de header/footer ni numeración (08).
- Implementar el renderizado por `lineRange` del PDF (09).
- Implementar debouncing, invalidación incremental ni calibración de
  viudas/huérfanas (10).
- Reparar el offset del toolbar (hallazgo de la verificación manual de
  05: sin spec asignada; requiere decisión del humano).
- Tocar el core de Quill (RULE-001/002), introducir dependencias
  (RULE-017) ni reescribir el motor sin causa (RULE-019).

## Acceptance criteria

- `blockKind` y la matriz de divisibilidad existen con las firmas de
  REQ-01/02 (compilación + tests); el fallback de tipo desconocido sigue
  siendo párrafo-divisible o —para atributos no cubiertos— la regla
  indivisible por defecto de discovery §7 (bloques atómicos jamás se
  pierden).
- Los 3 updates declarados a tests de 05 son los ÚNICOS cambios en la
  suite previa (verificable por diff): todo lo demás de 04/05 pasa sin
  cambios de semántica.
- `paginate.ts` queda SIN cambios (verificable por diff — el corte en
  fronteras de ítem se logra por la elección de unidades en la medición).
- El fixture de lista divisible pasa: corte exacto en fronteras de
  `<li>`, invariant de reconstrucción (unidades tilean y suman el
  flujo del bloque).
- `imagesReady` testado (con/sin `<img>` incompletas); el wiring de
  `home` (gate + listener captura) verificable por inspección de diff.
- `npm run lint`, `npm test` y `npm run build` pasan; sin deps nuevas;
  config intacta.
- Determinismo por construcción (clasificador y unidades son funciones
  puras o lecturas agrupadas; suite re-ejecutable).
- El Delta y el DOM del editor quedan intactos (RULE-003/012/015 — solo
  lectura; descriptores, no división física).

## Out of scope

- Tablas (06b o descope documentado — discovery §7).
- Saltos manuales de página y Blots custom (07).
- Contenido y numeración de header/footer (08).
- Renderizado PDF por `lineRange` (09 — esta spec solo fija el contrato
  de índices de `<li>` para bloques list).
- Debouncing, invalidación incremental, cacheo, virtualización y
  calibración de viudas/huérfanas (10).
- Reparación del offset del toolbar (hallazgo confirmado de la
  verificación manual de 05 — pendiente de asignación por el humano).
- Refactors del motor o de la vista más allá de lo listado (RULE-019).
- Trabajo no relacionado; optimización prematura (constitution §11).
