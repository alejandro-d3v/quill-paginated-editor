# Project Discovery

## Status

Active implementation specification.

## Authority

This specification is subordinate to `docs/constitution.md`.
The constitution is authoritative if there is a conflict.

## Purpose

Establecer el estado real del repositorio **y cerrar las decisiones
arquitectónicas** que condicionan las specs 01–11, produciendo un
documento `docs/discovery.md` verificable.

Esta spec NO produce código de producción. Produce:

1. Un reporte de descubrimiento en `docs/discovery.md`.
2. Cinco decisiones arquitectónicas cerradas y documentadas.
3. Un conjunto de actualizaciones mínimas a `MEMORY.md` y a las
   referencias cruzadas de skills/commands (ver REQ-06).

## Scope

- Inspeccionar el repositorio según el checklist de `constitution.md` §14.
- Producir `docs/discovery.md` con la estructura definida en `plan.md`.
- Cerrar y documentar las cinco decisiones listadas en REQ-01..REQ-05.
- Verificar que `npm run lint`, `npm test` y `npm run build` están verdes
  y dejar constancia de ello en el reporte.
- Identificar referencias cruzadas rotas entre skills, commands y
  `AGENTS.md` (numeración de secciones desactualizada) y listarlas en
  el reporte. **No corregirlas todavía** salvo que el usuario lo pida.

## Architectural constraints

Heredados de la constitución. No se redefinen aquí. Ver
`docs/constitution.md` §2 y §5.

Se preservan explícitamente:

- Quill 2.x es el editor; no se modifica su core (RULE-001, RULE-002).
- Delta es el modelo canónico (RULE-003).
- El DOM no es la fuente de verdad (RULE-004).
- La paginación es estado derivado (RULE-012).
- No se pagina por conteo de caracteres (RULE-010).
- No se pierde contenido (RULE-011).
- Unidades físicas explícitas (RULE-009).
- La paginación debe ser testeable sin Angular (RULE-006).

## Requirements

### REQ-01 — Modelo de edición paginada

`docs/discovery.md` MUST documentar la decisión sobre cómo se edita
contenido dentro de páginas físicas, eligiendo entre:

- A1 — editor continuo + overlay visual de páginas (recomendado),
- A2 — split del DOM de Quill en páginas (rechazado por defecto),
- A3 — editor oculto + páginas renderizadas desde Delta.

La decisión MUST explicar cómo preserva RULE-003, RULE-004, RULE-012,
RULE-015 y RULE-020. Si se elige A2, MUST documentar la justificación
arquitectónica según `constitution.md` §19.

### REQ-02 — Seam de medición

`docs/discovery.md` MUST definir el contrato conceptual entre el motor
de paginación y la capa que mide el DOM:

- La función pura del motor: `paginate(measuredBlocks, geometry): LayoutDocument`.
- El contrato de `MeasuredBlock` (qué información mínima necesita el motor).
- La responsabilidad del `MeasurementService` (Angular, browser-only).
- Por qué esta separación es necesaria para RULE-006 y para testear en jsdom.

### REQ-03 — Estructura de carpetas

`docs/discovery.md` MUST proponer una estructura de carpetas concreta
bajo `src/app/`, coherente con `constitution.md` §4 y con el estado
actual del repositorio. MUST indicar explícitamente:

- qué carpetas son nuevas,
- qué código existente migra,
- en qué spec se hace cada migración,
- qué se deja donde está para no romper `common/`.

### REQ-04 — Estrategia PDF

`docs/discovery.md` MUST documentar:

- que la decisión tecnológica final se toma en `09-pdf`,
- el criterio de selección (cliente-first, sin servidor, licencia permisiva, presupuesto de bundle),
- los candidatos considerados (`pdf-lib`, `jspdf`, `pdfmake`, `window.print()` + CSS `@media print`),
- por qué la decisión puede diferirse sin bloquear 01–08.

### REQ-05 — Estrategia de tablas

`docs/discovery.md` MUST documentar:

- que Quill 2 core no incluye tablas,
- la decisión sobre `06-complex-blocks`: tablas NO entran en `06`,
- la regla por defecto para bloques desconocidos: **indivisible, nunca se pierde contenido** (RULE-011),
- dónde se reevalúa (spec futura `06b-tables` o descarte documentado).

### REQ-06 — Reporte de referencias cruzadas rotas

`docs/discovery.md` MUST incluir una sección con las referencias
cruzadas rotas detectadas (skills `quill-wrapper`, `preflight-audit`,
`angular-scaffold`, `memory-sync`, `feature.md`, `temp/pagination-spec`)
producto del renumbering de `AGENTS.md` (commit `fd35e32`).
Solo listar; no corregir.

### REQ-07 — Estado de la línea base

`docs/discovery.md` MUST registrar el resultado de:

- `npm run lint`
- `npm test`
- `npm run build`

con los comandos exactos ejecutados y su salida resumida (PASS/FAIL,
warnings relevantes como `quill-delta` CommonJS).

## Acceptance criteria

Esta spec es **documental**. Sus criterios son verificables por
inspección del archivo producido, no por tests automatizados.

- Existe `docs/discovery.md`.
- Contiene las secciones REQ-01..REQ-07 cubiertas.
- Cada decisión de REQ-01..REQ-05 tiene: decisión elegida, alternativas
  consideradas, justificación ligada a la constitución.
- La sección de REQ-07 incluye los comandos realmente ejecutados y su
  resultado, sin inventar.
- `MEMORY.md` está actualizado (estado del editor, decisiones abiertas).
- `npm run lint`, `npm test` y `npm run build` están verdes y así se
  registra.
- No se ha modificado código de producción más allá de lo estrictamente
  necesario para dejar la línea base verde (si ya estaba verde, cero
  cambios de código).

## Out of scope

- Implementar cualquier parte del motor de paginación.
- Tocar `editor.ts` más allá de lo que la línea base requiera.
- Elegir la librería PDF definitiva.
- Implementar tablas.
- Corregir referencias cruzadas de skills (solo listarlas).
- Implementar A2 o A3.
- Cualquier refactor cosmético no exigido por la línea base.