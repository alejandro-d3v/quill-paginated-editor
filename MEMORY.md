# MEMORY.md — quill-paginated-editor

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte. Las reglas permanentes viven en `AGENTS.md`, no aquí.

## Estado actual

- **04-pagination-mvp COMPLETA** (2026-10-04): el motor existe. `common/pagination/` gana `block.ts`, `extract-blocks.ts`, `paginate.ts` (puros) y `measurement.ts` (`MeasurementService`, browser-only). `home` cablea el seam con `effect()` coalescido; `PageBreakIndicators` dibuja los cortes sobre el marco.
- Pipeline: `deltaChange` → `extractBlocks` → `measure(blocks, editorElement())` → `paginate(measured, geometry())` → `layout` → overlay. Bloques atómicos (regla indivisible, discovery §7).
- Suite verde: 72 tests / 12 archivos (+32 del motor: 9 paginate, 11 extract, 5 measurement, 4 indicators, 1 home, +2 ajustes). Lint 0/0; build 240.2 kB initial (+8.8 kB).
- Wrapper: `editorElement` viewChild readonly público = superficie de medición (la instancia de Quill sigue encapsulada).
- Warning de build preexistente: `quill-delta` CommonJS. `AGENTS.md` sincronizado (§1 estado).
- Aún sin splitting (05), clasificación/imágenes async (06), breaks (07), bandas (08), PDF (09), incremental (10).

## Decisiones (00-discovery en `docs/discovery.md`; 01–04 aquí)

- **04 — seam**: `paginate(measuredBlocks, geometry)` puro + `MeasurementService.measure(blocks, editorContainer)`; ids canónicos desde `extractBlocks`; desalineo de conteo → `Error` (fail-fast browser-side — silenciar colocaría contenido en páginas erróneas).
- **04 — altura de flujo**: `heightPx` = diferencia de offsets entre bloques contiguos (último: rect + margin inferior) — un rect desnudo ignora márgenes y desfasa motor y overlay (Principle V).
- **04 — segmentación alineada con Quill**: embeds inline acumulan en su línea (image es inline); runs de listas del mismo tipo = un bloque; el Delta de documento es insert-only.
- **04 — recomputación coalescida** vía `effect()`: una ejecución por lote con el último estado; flujo unidireccional (el pipeline jamás escribe `content`/`settings`). Debouncing/incremental → 10.
- **01–03** — Delta desde `'quill'`; validadores estructural (01) y geométrico (02) separados; caparazón visual A1 con `PageFrame`/`PagesContainer`.

## Aprendizajes y errores a evitar

- TS no rastrea mutaciones en closures: tras un loop que muta vía closure, la variable queda falsamente estrechada — pasarla como parámetro a un helper (o reestructurar) para el chequeo final.
- `restrict-template-expressions`: números en template literals requieren `String()`.
- Quill renderiza images INLINE (dentro del `<p>`): la extracción debe acumularlas en su línea, nunca partirlas en bloque propio.
- `parseFloat(getComputedStyle(...)) || 0`: jsdom devuelve márgenes vacíos — el `|| 0` es necesario.
- Tests DOM: `const native: HTMLElement = fixture.nativeElement` (está tipado `any`); `input.required` necesita `setInput` antes del primer `whenStable()`.
- Alias `@common` no resuelve; sub-bullets anidados rompen Prettier en tasks.md; skills citan secciones AGENTS.md desfasadas (por nombre).

## Próximos pasos

- **Revisión manual humana en navegador** (pendiente de 04): pipeline end-to-end con texto real, indicadores en los cortes, AXE.
- Luego: `/spec-write 05-content-splitting` (plantilla) → review → feature. Habilita `splittable: true` para párrafos (constitution §7.3), `minFragmentHeightPx`, descriptores de corte en `LayoutDocument`.

## Pendientes / dudas abiertas

- PDF (09) · tablas 06b · virtualización (10) · widows/orphans (05) · render de header/footer: tokens vs Delta (08).
- Corregir referencias cruzadas de skills y ubicar/eliminar `temp/pagination-spec/` — requieren aprobación del usuario.
