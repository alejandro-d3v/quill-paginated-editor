# Visual Pages

## Status

Active implementation specification.

## Authority

This specification is subordinate to `docs/constitution.md`.
The constitution is authoritative if there is a conflict.

## Purpose

Representar visualmente el documento como páginas físicas bajo el modelo A1
(editor continuo + overlay, discovery §3): un canvas y un marco de página
con la geometría de la spec 02 que envuelven al editor, sin reestructurar
jamás el DOM de Quill (RULE-015).

Esta spec NO mide contenido, NO pagina y NO dibuja indicadores de salto
(spec 04); no renderiza contenido de header/footer ni numeración (spec 08).
Es el caparazón visual — y ejecuta el refactor de convenciones del wrapper
que `01-document-model` REQ-07 diferió explícitamente a esta spec.

## Scope

- `PageFrame` — marco de página: dimensiones, márgenes, bandas reservadas de
  header/footer y área de contenido, todo desde `PageGeometry` (spec 02).
- `PagesContainer` — canvas del documento que apila marcos (en esta spec:
  exactamente uno, continuo).
- Integración en `home`: composición canvas → marco → editor, con settings
  desde `DEFAULT_DOCUMENT_SETTINGS` (spec 01) y geometría vía `computed()`.
- Refactor de convenciones del wrapper de Quill (deuda de 01 REQ-07):
  OnPush, sin `standalone: true`, sin `imports: []`, `viewChild()` signal,
  ARIA del editor y eliminación de `::ng-deep`.
- Tests de componente: rendering por geometría, composición y ARIA.

## Architectural constraints

Heredados de la constitución y de discovery. Se preservan explícitamente:

- **A1** (discovery §3): el DOM del editor nunca se reestructura; el overlay
  son decoraciones que envuelven (RULE-015). El editor conserva selección,
  cursor, undo/redo y clipboard (RULE-020).
- La geometría es dato puro de la spec 02 (`computePageGeometry`); la vista
  solo la consume (extensión de RULE-004: ningún layout se deriva del DOM
  de la vista).
- Angular 21 (AGENTS.md, sección "Angular Rules"): `OnPush`, signals,
  `input()`, `viewChild()`, control flow nativo, sin `standalone: true`,
  plantillas externas, sin `ngStyle`/`ngClass`.
- Accesibilidad (AGENTS.md, sección "UI, Accessibility, and Security"):
  WCAG AA, semántica nativa primero; ARIA solo donde la semántica nativa
  no alcanza — el `contenteditable` de Quill: `role="textbox"`,
  `aria-label`, `aria-multiline` (skill `quill-wrapper`).
- Sin `any` (RULE-018); sin dependencias nuevas (RULE-017) — incluido
  `axe-core`: las verificaciones de esta spec son aserciones DOM en
  TestBed; una auditoría AXE en navegador queda como paso manual
  recomendado, no automatizado.
- Componentes tontos: la orquestación vive en `home`; `PageFrame` y
  `PagesContainer` solo presentan (constitution §9: los componentes no
  poseen algoritmos de paginación).

## Requirements

### REQ-01 — `PageFrame`

Bajo `src/app/common/components/page-frame/` MUST existir el componente
`PageFrame` (selector `app-page-frame`, clase sin sufijo — AGENTS.md
"Repository Structure"), `OnPush`, plantilla externa, con:

- `readonly geometry = input.required<PageGeometry>();` — el tipo puro de
  la spec 02; sin otra entrada.
- Style bindings en px CSS (sin redondeo: CSS acepta px fraccionales):
  - marco: `width` = `geometry().pageWidthPx`, `min-height` =
    `geometry().pageHeightPx`;
  - márgenes como `padding` (`marginTopPx`, `marginRightPx`,
    `marginBottomPx`, `marginLeftPx`);
  - banda de header reservada (vacía) con `height` = `headerHeightPx`,
    renderizada solo con `@if (… > 0)`;
  - banda de footer reservada (vacía) con `height` = `footerHeightPx`,
    solo con `@if (… > 0)`;
  - área de contenido con `width` = `contentWidthPx` y `<ng-content />`.

Comportamiento continuo pre-paginación (documentado; la spec 04 lo
sustituirá con páginas reales e indicadores): el marco crece con el
contenido más allá de `min-height` y la banda de footer queda al final del
flujo. Sin lógica de paginación aquí (P-X).

### REQ-02 — `PagesContainer`

Bajo `src/app/common/components/pages-container/` MUST existir
`PagesContainer` (selector `app-pages-container`), `OnPush`,
presentacional — sin inputs obligatorios: el canvas del documento (fondo
neutro que contrasta con el papel del marco, centra la columna de páginas)
que proyecta su contenido con `<ng-content />`.

### REQ-03 — Integración en `home`

`home` MUST componer la superficie del documento:

- `protected readonly settings = signal(DEFAULT_DOCUMENT_SETTINGS);`
- `protected readonly geometry = computed(() => computePageGeometry(this.settings()));`
- Plantilla:

  ```html
  <app-pages-container>
    <app-page-frame [geometry]="geometry()">
      <app-editor />
    </app-page-frame>
  </app-pages-container>
  ```

- Aprovechando que `home.ts` ya se modifica: eliminar su `standalone: true`
  redundante y añadir `OnPush` (RULE-019: solo lo que ya se toca, nada más).
- Los settings provienen de `DEFAULT_DOCUMENT_SETTINGS`; la UI de
  configuración no existe y no se crea aquí.

### REQ-04 — Refactor de convenciones del wrapper

`EditorComponent` (`src/app/common/editor/`, spec 01) MUST alinearse con
AGENTS.md ("Angular Rules" y "UI, Accessibility, and Security") — la deuda
que 01 REQ-07 asignó a esta spec — SIN cambiar comportamiento (RULE-020):

- Eliminar `standalone: true` (redundante) y `imports: []` (vacío).
- Añadir `changeDetection: ChangeDetectionStrategy.OnPush`.
- Sustituir `@ViewChild('editor', { static: true })` + campo `ElementRef`
  por `viewChild.required<ElementRef<HTMLDivElement>>('editor')`; el ciclo
  de vida se mantiene en `ngAfterViewInit` (AGENTS.md "Quill Integration"
  lo permite; cambio mínimo).
- ARIA del editor (en `editor.html`, sobre el contenedor `#editor`):
  `role="textbox"`, `aria-label="Editor de documento"`,
  `aria-multiline="true"`.
- Eliminar `::ng-deep` de `editor.scss`: mover los overrides `.ql-*`
  byte-idénticos a `src/styles.scss` (el tema Snow ya es global);
  `editor.scss` conserva solo los estilos propios del contenedor.
- Se conservan intactos: clase `EditorComponent`, selector `app-editor`,
  theme/toolbar/placeholder, `deltaChange` con su wiring `text-change` y la
  limpieza real de `ngOnDestroy`.

### REQ-05 — Tests

Puros de componente (TestBed + `await fixture.whenStable()`; jsdom no
computa layout → se asertan style bindings inline, no
`getBoundingClientRect`):

- `page-frame.spec.ts`: con `computePageGeometry(DEFAULT_DOCUMENT_SETTINGS)`
  el marco renderiza `width`/`min-height` esperados en style; las bandas
  están ausentes con los defaults (`enabled: false` → alturas 0) y presentes
  con las alturas correctas con settings que las habilitan; padding de
  márgenes y ancho del área de contenido según geometría.
- `pages-container.spec.ts`: creación y proyección de contenido.
- `home.spec.ts` (extender): renderiza `app-pages-container` >
  `app-page-frame` > `app-editor` anidados, y el marco recibe la geometría
  (style width esperado de los defaults). El editor real de Quill sigue
  ejercitándose aquí sin mock.
- `editor.spec.ts` (extender): el contenedor del editor expone
  `role="textbox"`, `aria-label` y `aria-multiline`; los tests existentes
  de `deltaChange` y cleanup siguen pasando sin cambios de semántica.

### REQ-06 — NO avanzar a specs posteriores

Esta spec MUST NOT:

- Medir contenido, crear `MeasurementService`, implementar `paginate`,
  `LayoutDocument` o indicadores de salto (spec 04).
- Renderizar contenido de header/footer, numeración o total de páginas
  (spec 08).
- Crear UI de configuración de settings, zoom o page controls.
- Virtualizar páginas (spec 10) ni introducir dependencias (incluido
  `axe-core`).
- Reestructurar el DOM del editor (A1, RULE-015) o alterar el core de Quill
  (RULE-001/002).

## Acceptance criteria

- Existen `page-frame/` y `pages-container/` bajo
  `src/app/common/components/` con las firmas de REQ-01/02 (verificable por
  compilación y tests).
- `PageFrame` renderiza width/min-height/padding/bandas desde
  `PageGeometry`, con bandas condicionales (`@if`) — verificado por tests
  sobre style bindings en jsdom.
- `home` compone canvas → marco → editor con geometría computada por
  signal; los tres selectores anidados se renderizan — verificado por
  tests.
- El wrapper queda sin `standalone: true` ni `imports: []`, con `OnPush` y
  `viewChild()` signal (verificable por inspección del diff); su contenedor
  expone `role="textbox"`, `aria-label` y `aria-multiline` — verificado por
  tests DOM.
- `::ng-deep` ya no aparece en `editor.scss` y los overrides `.ql-*` viven
  en `src/styles.scss` — verificable por grep.
- Los tests de 01 (`deltaChange`, cleanup, creación) pasan sin cambios de
  semántica (RULE-020).
- `npm run lint`, `npm test` y `npm run build` pasan.
- Sin medición, paginación, contenido de bandas, UI de settings, zoom ni
  dependencias nuevas; config (`eslint.config.mjs`, `tsconfig*.json`,
  `angular.json`, `package.json`) intacta.
- Estilos por componente dentro del presupuesto (warn 4 kB / error 8 kB,
  `angular.json`).
- El Delta canónico queda intacto y el DOM del editor no se reestructura
  (RULE-003/015): la composición envuelve al editor, no lo modifica.

## Out of scope

- Indicadores de salto, `LayoutDocument`, medición y paginación (spec 04).
- Contenido de header/footer y numeración de páginas (spec 08).
- UI de configuración de settings, zoom y page controls (sin spec asignada
  en el roadmap; no inventar).
- Virtualización de páginas para documentos grandes (spec 10).
- Cualquier cosa relacionada con PDF (spec 09).
- Refactors del wrapper o de `home` más allá de REQ-03/04 (RULE-019).
- Trabajo no relacionado; optimización prematura (constitution §11).
