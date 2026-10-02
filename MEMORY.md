# MEMORY.md — quill-paginated-editor

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte. Las reglas permanentes viven en `AGENTS.md`, no aquí.

## Estado actual

- **00-discovery COMPLETA** (2026-10-02): reporte en `docs/discovery.md` (11 secciones, REQ-01..07).
- Editor de Quill implementado: `EditorComponent` en `common/components/editor/` (snow theme, toolbar completo, init en `ngAfterViewInit`). Aún **no expone Delta** (lo añade 01).
- Línea base VERDE (2026-10-02): lint 0/0, tests 3/3, build 220.8 kB initial. Correcciones previas del usuario: `editor.spec.ts` (import), `app.spec.ts` (aserción h1 stale eliminada), `home.html` (self-closing) y skill `systematic-debugging` borrada (causaba el error de lint).
- Warning de build conocido: `quill-delta` CommonJS → bailout de optimización; mitigación futura `allowedCommonJsDependencies` (requiere aprobación).
- Sin modelo de documento, geometría, paginación, medición ni PDF; sin backend ni services.

## Decisiones (cerradas en 00-discovery — detalle en docs/discovery.md)

- **A1 — editor continuo + overlay visual de páginas**: nunca se reestructura el DOM de Quill (RULE-015/020); 05 produce descriptores de corte, no división física.
- **Seam de medición**: motor puro `paginate(measuredBlocks, geometry)` + `MeasurementService` (Angular, browser-only, lecturas agrupadas). jsdom no mide layout; sin este seam los tests del motor serían ciegos (RULE-006).
- **Carpetas**: `common/{document,pagination,pdf,editor}`; el wrapper migra a `common/editor/` en 01; `app/` y `home/` no se mueven.
- **PDF**: decisión diferida a 09 (criterios y candidatos en discovery §6); prohibido el snapshot de DOM (RULE-007/P-IV).
- **Tablas**: fuera de 06; regla por defecto del motor: bloque desconocido = indivisible, nunca se pierde contenido (RULE-011).

## Aprendizajes y errores a evitar

- El toolbar ya produce listas/imágenes/blockquotes/code-blocks: 04 necesita la regla indivisible desde el día uno.
- Skills citan secciones de AGENTS.md por número desfasado (renumbering `fd35e32`): guiarse por NOMBRE de sección (listado en discovery §8, sin corregir).
- Alias `@common` NO resuelve (sin `paths` en tsconfig): usar imports relativos.
- ESLint excluye `*.spec.ts`: la calidad de los specs es responsabilidad manual.
- Código nuevo: `viewChild()`/`input()`/`output()` + OnPush, sin `standalone: true`; Quill solo tras la vista.

## Próximos pasos

- Implementar **01-document-model** (siguiente spec; una a la vez).
- En el plan de 01: exposición de Delta por el wrapper (`output()`/signal en `text-change`), migración `common/components/editor/` → `common/editor/`, y ratificar nombre de clase (`EditorComponent` vs AGENTS.md §3 sin sufijo — el usuario mantuvo el sufijo).

## Pendientes / dudas abiertas

- Tecnología PDF (09) · tablas 06b o descope · virtualización de páginas (10) · widows/orphans (05) · render de header/footer: tokens vs Delta (08).
- Corregir referencias cruzadas de skills (discovery §8) y ubicar/eliminar `temp/pagination-spec/` — requieren aprobación del usuario.
