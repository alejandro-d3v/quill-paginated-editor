# Pagination MVP

## Status

Active implementation specification.

## Authority

This specification is subordinate to `docs/constitution.md`.
The constitution is authoritative if there is a conflict.

## Purpose

Implementar el motor de paginación de la geometría (constitution §6/§7),
con el seam cerrado en discovery §4: `extractBlocks` puro, un
`MeasurementService` browser-only que lee el DOM renderizado del editor
(A1) y un `paginate(measuredBlocks, geometry)` puro que produce
`LayoutDocument` — más los indicadores de salto en la vista.

Esta spec NO divide contenido entre páginas (05: los bloques son atómicos
aquí), NO clasifica tipos complejos ni mide imágenes asíncronas (06), y NO
optimiza (10: recomputación completa pero coalescida).

## Scope

- Vocabulario del seam: `Block`, `BlockId`, `MeasuredBlock` (discovery §4).
- `extractBlocks(delta)` — puro: un bloque por elemento block-level de
  Quill, runs de lista consecutivos fusionados (indivisible, discovery §7).
- `MeasurementService.measure(editorContainer)` — browser-only: mide los
  bloques renderizados del editor en una sola pasada de lecturas.
- `paginate(measuredBlocks, geometry)` — puro, determinista, atómico:
  `LayoutDocument`/`LayoutPage`/`LayoutBlock` (constitution §3.6/§6).
- Pipeline en `home`: `deltaChange` → señales → recomputación coalescida →
  `layout`; indicadores de salto (`PageBreakIndicators`) sobre el marco de
  03 (A1: el DOM del editor jamás se reestructura).
- Invariants suite (RULE-016): sin pérdida, determinismo, Delta intacto.

## Architectural constraints

Heredados de la constitución y de discovery. Se preservan explícitamente:

- **Seam de medición** (discovery §4): el motor consume alturas ya medidas;
  nunca mide, nunca toca Angular ni DOM (RULE-006). La medición es
  browser-only y agrupa lecturas (sin layout thrashing).
- **A1** (discovery §3): el overlay son decoraciones posicionadas; el DOM
  del editor nunca se reestructura (RULE-015) y su comportamiento se
  preserva (RULE-020).
- Delta canónico (RULE-003); el DOM es medible pero nunca fuente de verdad
  (RULE-004); la paginación es estado derivado y jamás muta el Delta
  (RULE-012).
- Geometría, no conteo de caracteres (RULE-010, Principle V); unidades en
  px CSS provenientes de la spec 02 (RULE-009).
- Nunca se pierde contenido (RULE-011): regla por defecto para cualquier
  bloque — **indivisible**; si excede la página, se renderiza desbordando
  en su propia página (discovery §7, aplicable desde este motor).
- Determinismo (RULE-005); sin `any` (RULE-018); sin dependencias nuevas
  (RULE-017); sin optimización prematura — medir antes (constitution §11;
  incremental/caching es de la spec 10).

## Requirements

### REQ-01 — Vocabulario del seam

Bajo `src/app/common/pagination/block.ts` MUST existir:

- `export type BlockId = number;` — ordinal del bloque (0..n−1), estable
  dentro de un cálculo; refinable en la spec 10 si la invalidación
  incremental necesita identidad más rica.
- `export interface Block { readonly id: BlockId; readonly ops: readonly Op[]; }`
  — fragmento del Delta que representa ese bloque; los formatos inline
  quedan preservados en `ops`.
- `export interface MeasuredBlock { readonly id: BlockId; readonly heightPx: number; readonly splittable: boolean; readonly minFragmentHeightPx?: number; }`
  — contrato de discovery §4. En esta spec `splittable` es SIEMPRE
  `false` (bloques atómicos; §7.3 de la constitución — splitting — es de
  la spec 05, que habilitará `true` para párrafos).

Los tipos de Quill (`Delta`, `Op`) se importan como
`import type { Delta, Op } from 'quill'` (decisión de la spec 01:
re-export verificado de quill 2.0.3; `quill-delta` es transitivo).

### REQ-02 — `extractBlocks`

Bajo `src/app/common/pagination/extract-blocks.ts` MUST existir:

`export const extractBlocks = (delta: Delta): readonly Block[];`

Pura (sin Angular/DOM, RULE-006) y no destructiva (RULE-003): el Delta de
entrada jamás se muta. Entrada esperada: el Delta de un documento
(`getContents()` — solo ops insert; los deltas de cambio con
retain/delete no son entrada válida). Segmentación (verificable contra
el DOM que Quill renderiza — un hijo block-level de `.ql-editor` por
bloque):

- un op insert cuyo texto termina en `\n` cierra un bloque; un op con
  varias líneas produce un bloque por línea;
- los embeds inline (p. ej. `{ insert: { image: … } }`) se acumulan
  dentro del bloque de su línea — así los renderiza Quill, dentro del
  mismo hijo block-level; un embed que constituye su propia línea forma
  un bloque con las ops de esa línea (embed + `\n`); solo un blot
  block-level custom (specs 06/07) será bloque propio;
- **runs de listas consecutivas del mismo tipo** (ops con el mismo
  atributo `list`) se fusionan en UN bloque — en esta spec las listas son
  contenido no soportado y por tanto indivisibles (discovery §7), y la
  fusión mantiene la alineación 1:1 con el `<ol>/<ul>` que Quill renderiza
  como un único hijo;
- `id` = ordinal en orden de documento.

### REQ-03 — Motor puro `paginate`

Bajo `src/app/common/pagination/paginate.ts` MUST existir:

- `export interface LayoutBlock { readonly id: BlockId; readonly heightPx: number; }`
- `export interface LayoutPage { readonly index: number; readonly blocks: readonly LayoutBlock[]; }`
- `export interface LayoutDocument { readonly pages: readonly LayoutPage[]; }`
  (constitution §3.6; el modelo exacto de `LayoutBlock` se define aquí:
  identidad + altura medida, suficiente para que la vista calcule offsets
  y para que el PDF de 09 resuelva contenido por `id`).
- `export const paginate = (measuredBlocks: readonly MeasuredBlock[], geometry: PageGeometry): LayoutDocument;`

Distribución greedy determinista (§7.2/§7.4, RULE-005):

- un bloque que cabe en el alto restante de la página actual se coloca en
  ella; uno que no cabe abre página siguiente;
- un bloque que no cabe ni siquiera en una página vacía (`heightPx >
contentHeightPx`, o `contentHeightPx ≤ 0`) se coloca **solo** en su
  propia página y desborda — jamás se descarta ni se recorta (RULE-011);
  en la geometría degenerada (`contentHeightPx ≤ 0`) cada bloque queda
  solo en su página;
- los bloques son atómicos (`splittable: false` en 04 — no existe división
  de bloques en esta spec);
- sin bloques de entrada → exactamente una página vacía (`index 0`);
- la función consume únicamente `heightPx` y geometría — nunca longitud de
  texto (RULE-010) — y no toca Angular, DOM ni el Delta (RULE-006/012).

### REQ-04 — `MeasurementService`

Bajo `src/app/common/pagination/measurement.ts` MUST existir
`@Injectable({ providedIn: 'root' }) export class MeasurementService` con:

`measure(blocks: readonly Block[], editorContainer: HTMLElement): readonly MeasuredBlock[];`

- Entrada canónica: los bloques de `extractBlocks` del mismo Delta
  (discovery §4 define esta entrada); los `id` del resultado fluyen de
  esos bloques, no del DOM.
- Localiza el `.ql-editor` dentro del contenedor: si no existe y
  `blocks` está vacío, devuelve `[]` (Quill aún no inicializó); si no
  existe pero hay bloques que medir, lanza un `Error` descriptivo
  (estado imposible de alinear).
- Mide el hijo block-level i-ésimo de `.ql-editor` para el bloque
  i-ésimo, en UNA sola pasada de lecturas (sin escrituras intercaladas —
  sin layout thrashing; discovery §4). Si el número de hijos no coincide
  con `blocks.length` (bug de segmentación), lanza un `Error` descriptivo
  — fail-fast en la capa browser: un desalineo silencioso colocaría
  contenido en páginas erróneas, que es peor (RULE-011); los módulos
  puros siguen sin excepciones.
- `heightPx` es el alto que el bloque ocupa **en el flujo continuo**,
  incluyendo el espaciado adyacente entre bloques (Principle V: geometría
  del render real; un rect desnudo ignora los márgenes de Quill y
  desfasaría el motor y el overlay). Técnica sugerida: diferencia de
  offsets (top del bloque siguiente − top del actual; el último: su rect
  - su margin inferior).
- Devuelve `{ id, heightPx, splittable: false }` por bloque, en el orden
  de `blocks`.
- Browser-only por diseño (RULE-006): ningún otro módulo de paginación
  importa este servicio; el motor puro no lo conoce.

### REQ-05 — Pipeline en `home` + indicadores (A1)

- El wrapper expone la superficie de medición: el viewChild
  `editorElement` de `EditorComponent` pasa de privado a
  `readonly` público. Expone el **contenedor** del editor, nunca la
  instancia de Quill (skill `quill-wrapper`; sigue siendo una API de
  signals, coherente con AGENTS.md "Quill Integration").
- `home` añade el pipeline (signals, zoneless):
  `content = signal<Delta | null>(null)` alimentado por
  `(deltaChange)`, y `layout` con el `LayoutDocument` resultante de
  `extractBlocks(content)` → `MeasurementService.measure(blocks,
editorElement())` → `paginate(measured, geometry())` — el flujo cerrado
  de discovery §4.
- Recomputación **coalescida y sin re-entradas** (constitution §11 para
  el MVP; incremental es de 10): N eventos de cambio producen UNA
  recomputación con el último estado; las lecturas de DOM son no
  reactivas; el pipeline nunca escribe `content` ni `settings`; el DOM
  del editor solo se lee (RULE-015 — jamás se reestructura).
- Nuevo componente `src/app/common/components/page-break-indicators/page-break-indicators.{ts,html,scss}`
  (clase `PageBreakIndicators`, selector `app-page-break-indicators`,
  `OnPush`): inputs `layout: LayoutDocument | null` y
  `geometry: PageGeometry`; dibuja una línea decorativa (`aria-hidden`)
  por cada frontera interna de página (`pages.length − 1`) en el offset
  acumulado de alturas de bloques de las páginas previas, desde el origen
  del área de contenido. Sin líneas si `layout` es null o tiene una sola
  página.
- `page-frame.scss`: `.content-area` gana `position: relative;` — contexto
  de posicionamiento del overlay (cambio mínimo al archivo de 03).

### REQ-06 — Invariants suite (RULE-016, constitution §13)

Colocados junto al código; los de `paginate` y `extractBlocks` son puros
(sin TestBed, vitest globals; los fixtures se escriben con literales
independientes de la implementación):

- `paginate.spec.ts`:
  - sin pérdida (RULE-011): los ids de las páginas concatenados
    reproducen los ids de entrada en orden — con fixtures normales,
    degenerados y de bloques que desbordan;
  - determinismo (RULE-005): dos llamadas con las mismas entradas
    producen `LayoutDocument` deep-equal;
  - sin overflow → una página; overflow → fixture greedy verificable
    (p. ej. `contentHeightPx 100`, bloques `[30,30,30,30]` →
    2 páginas: 3 + 1 bloques);
  - bloque que no cabe ni en una página vacía → solo en su página,
    sin pérdida;
  - entrada vacía → una página vacía; geometría degenerada (`≤ 0`) → cada
    bloque solo;
  - la entrada `measuredBlocks` no se muta (deep-equal tras la llamada).
- `extract-blocks.spec.ts`: Delta vacío → `[]`; un párrafo; op
  multi-línea → un bloque por línea; heading (atributos preservados);
  run de listas de un tipo → UN bloque; runs `ordered` vs `bullet`
  consecutivos → bloques distintos; embed en su propia línea → un
  bloque (ops: embed + `\n`); embed inline entre texto → un solo
  bloque; el Delta de entrada queda intacto (deep-equal, RULE-003).
- `measurement.spec.ts`: `blocks` vacío sin `.ql-editor` → `[]`;
  desalineo de conteo (hijos ≠ bloques) → `Error`; hijos con alturas de
  flujo stubbeadas (jsdom no mide) → un `MeasuredBlock` por bloque, ids
  desde `blocks` y alturas según los stubs (diferencia de offsets o
  margin del último).
- `page-break-indicators.spec.ts`: layout de 3 páginas con alturas
  conocidas → 2 líneas en los offsets acumulados esperados; layout null o
  de una página → sin líneas.
- `home.spec.ts` (extender): el template incluye
  `app-page-break-indicators` dentro del marco. El pipeline completo
  end-to-end con Quill real NO es automatizable en jsdom (no mide y
  `setContents` no es fiable ahí): queda como verificación manual
  recomendada en navegador (ver plan, paso final).

### REQ-07 — NO avanzar a specs posteriores

Esta spec MUST NOT:

- Dividir bloques entre páginas ni habilitar `splittable: true`
  (spec 05 — constitution §7.3).
- Clasificar tipos de bloque, reglas específicas de listas/tablas, ni
  medición asíncrona de imágenes (spec 06).
- Introducir saltos manuales ni extender `MeasuredBlock` con banderas de
  break (spec 07).
- Renderizar contenido de header/footer ni numeración (spec 08); nada de
  PDF (spec 09).
- Implementar invalidación incremental, cacheo ni virtualización (spec
  10 — la recomputación completa es intencional en el MVP, solo
  coalescida).
- Modificar el core de Quill (RULE-001/002) ni introducir dependencias
  (RULE-017).

## Acceptance criteria

- Existen `block.ts`, `extract-blocks.ts`, `paginate.ts` y
  `measurement.ts` bajo `src/app/common/pagination/` con las firmas de
  REQ-01..04 (verificable por compilación y tests).
- `paginate.spec.ts` y `extract-blocks.spec.ts` pasan y cubren el catálogo
  "Pagination" de constitution §13 aplicable a bloques atómicos (sin
  overflow / overflow / múltiples páginas / contenido largo / bloque
  indivisible) y los invariants de §13 (sin pérdida, determinismo, Delta
  no destructivo).
- La invariant de sin pérdida está testeada con fixtures explícitos:
  ids de páginas concatenados == ids de entrada, incluidos bloques que
  desbordan y geometrías degeneradas.
- `measurement.spec.ts` pasa con alturas de flujo stubbeadas: `blocks`
  vacío sin `.ql-editor` → `[]`; desalineo de conteo → `Error`.
- `page-break-indicators.spec.ts` pasa: N páginas → N−1 líneas en los
  offsets acumulados esperados.
- El wrapper expone `editorElement` readonly público (instancia de Quill
  NO expuesta — inspección de diff) y `page-frame.scss` gana
  `position: relative` en `.content-area` (grep).
- El pipeline de `home` no reestructura el DOM del editor ni escribe
  `content`/`settings` (inspección de diff); los tests de 01–03 siguen
  pasando sin cambios de semántica (RULE-020).
- `npm run lint`, `npm test` y `npm run build` pasan.
- Sin deps nuevas; config (`eslint.config.mjs`, `tsconfig*.json`,
  `angular.json`, `package.json`) intacta; presupuestos OK.
- El motor es determinista por construcción: `paginate`/`extractBlocks`
  sin `Date`/`Math.random`/DOM/Angular (inspección del diff; suite
  re-ejecutable con resultados idénticos).

## Out of scope

- Splitting de bloques y `minFragmentHeightPx` operativos (spec 05).
- Clasificación de bloques, listas como bloques divisibles, tablas,
  medición asíncrona de imágenes (spec 06).
- Saltos manuales de página (spec 07).
- Contenido y numeración de header/footer (spec 08).
- PDF y consistencia visual↔PDF (spec 09).
- Invalidación incremental, cacheo de mediciones, virtualización y
  optimización (spec 10 — medir antes, constitution §11).
- Refactors del wrapper o de la vista más allá de REQ-05 (RULE-019).
- Trabajo no relacionado; optimización prematura (constitution §11).
