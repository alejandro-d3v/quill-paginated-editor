# MEMORY.md — quill-paginated-editor

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte. Las reglas permanentes viven en `AGENTS.md`, no aquí.

## Estado actual

- **03-visual-pages COMPLETA** (2026-10-04): `common/components/` con `PageFrame` (geometría de 02 por `input.required`, bandas reservadas condicionales, flujo header→contenido→footer) + `PagesContainer` (canvas). `home` compone canvas → marco → editor con `settings` signal + `geometry` computed (OnPush).
- Wrapper alineado a convenciones (OnPush, `viewChild.required` signal, ARIA en `#editor`, sin `standalone: true`/`imports: []`/`::ng-deep`); overrides `.ql-*` reubicados en `styles.scss` (declaraciones byte-idénticas). Deuda de 01 REQ-07: **resuelta**.
- Pre-paginación (A1): una sola página continua (`min-height` = página); footer fluye al final del contenido; indicadores → 04.
- Suite verde: 40 tests / 8 archivos. Lint 0/0; build 231.4 kB initial (+9.9 kB por el caparazón). Warning preexistente `quill-delta` CommonJS.
- `AGENTS.md` sincronizado (§1 estado, §3 árbol).

## Decisiones (00-discovery en `docs/discovery.md`; 01–03 aquí)

- **03 — orden de flujo del marco**: header → contenido → footer, anclado a `contentYPx` de 02 (§7.1); bandas vacías (contenido de bandas es de 08).
- **03 — overrides `.ql-*` globales** en `styles.scss`: Snow ya es global y solo existe un editor → mismo resultado visual sin `::ng-deep`.
- **03 — ARIA a nivel de contenedor** `#editor` (patrón skill `quill-wrapper`): `role="textbox"`, `aria-label`, `aria-multiline`. AXE manual queda como revisión humana (no hay tooling; RULE-017).
- **02/03 — aserciones de styles en jsdom**: `parseFloat` + `toBeCloseTo ≥ 6` con `toPx` independiente; nunca strings de floats.
- **01** — `import type { Delta } from 'quill'`; validador estructural sobre `unknown`; wrapper en `common/editor/` con `deltaChange`.

## Aprendizajes y errores a evitar

- `ComponentFixture.nativeElement` está tipado `any`: los genéricos `querySelector<HTMLElement>` sobre él fallan con TS2347 — asignar primero `const native: HTMLElement = fixture.nativeElement`.
- `input.required` en TestBed: `fixture.componentRef.setInput(...)` ANTES del primer `whenStable()`.
- Sub-bullets `-` anidados dentro de ítems `- [ ]` rompen la idempotencia de Prettier en tasks.md — usar prosa.
- En tests de lógica matemática: fórmula esperada inline, nunca importar la función bajo test; `toBeCloseTo ≥ 6` para px.
- Alias `@common` no resuelve: imports relativos. Skills citan secciones AGENTS.md por número desfasado: por nombre.

## Próximos pasos

- **Redactar `04-pagination-mvp`** (plantilla → `/spec-write`; luego review + feature). Es el núcleo: consume `deltaChange` + `computePageGeometry`; define `MeasuredBlock`/`extractBlocks`/`MeasurementService` (seam, discovery §4), `paginate` puro, `LayoutDocument` e indicadores de salto; la invariants suite nace ahí.

## Pendientes / dudas abiertas

- PDF (09) · tablas 06b · virtualización (10) · widows/orphans (05) · render de header/footer: tokens vs Delta (08).
- Revisión manual humana en navegador de 03 (apariencia + AXE) — recomendada, no bloqueante.
- Corregir referencias cruzadas de skills y ubicar/eliminar `temp/pagination-spec/` — requieren aprobación.
