# MEMORY.md — quill-paginated-editor

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte. Las reglas permanentes viven en `AGENTS.md`, no aquí.

## Estado actual

- **05-content-splitting COMPLETA** (2026-10-04): los párrafos se cortan entre páginas por líneas renderizadas. `MeasuredBlock.lineHeightsPx` (sum === alto de flujo) + `minFragmentHeightPx` (primera línea); motor emite fragmentos `LayoutBlock.lineRange {from,to}` (semicerrado; ausente = bloque completo). Solo párrafos divisibles (`isSplittableBlock`); headings/listas/blockquotes/code-blocks atómicos hasta 06.
- Vista, wrapper y DOM del editor **intactos** (diff: solo `common/pagination/`) — los fragmentos acarrean `heightPx`, indicadores transparentes al corte.
- Suite verde: 94 tests / 12 archivos (+22 del corte). Lint 0/0; build 240.2 kB initial (+1.4 kB). Warning preexistente `quill-delta` CommonJS.
- Pendiente de 10: calibración de viudas/huérfanas (huérfana = medición; **viuda requiere extensión simétrica del motor** — anotado en la spec).

## Decisiones (00-discovery en `docs/discovery.md`; 01–05 aquí)

- **05 — descriptores, no división física** (discovery §3): el Delta permanece continuo; `lineRange` es el contrato para 09 (PDF resolverá contenido por id + rango de líneas).
- **05 — regla de última línea**: `sum(lineHeightsPx) === heightPx` (línea i = top_{i+1}−top_i; la última completa) — los offsets acumulados de los indicadores quedan exactos sin tocar la vista.
- **05 — huérfana mínima**: `minFragmentHeightPx` = primera línea; ≥1 línea por lado garantizado estructuralmente. El chequeo del lado inicial es hook de tuning (tautológico al valor 05).
- **05 — fallback de medición**: sin rects/Range (jsdom) → `[heightPx]` → bloque de facto atómico (degradación segura). Dos fases en el motor (simulación sin mutar `remainingPx`) para que un corte inválido caiga a atómico sin deshacer consumo.
- **04** — seam `paginate` puro + `measure(blocks, container)` fail-fast; alturas de flujo por diferencia de offsets; embeds inline acumulan en su línea; runs de listas fusionados.
- **01–03** — Delta desde `'quill'`; validadores estructural/geométrico separados; caparazón visual A1.

## Aprendizajes y errores a evitar

- `Block` es tipo nuestro (`./block`), no de Quill — TS2614 si se importa desde `'quill'`.
- `no-useless-assignment`: inicializadores de `let` nunca leídos; extraer helpers (`lineRects` con try/catch).
- Grep de pureza con "Range" da falsos positivos por `lineRange` — usar patrones precisos (`createRange`/`getClientRects`).
- `vi.spyOn(document, 'createRange')` + `mockReturnValue(fakeRange)` para tests de medición de líneas; `vi.restoreAllMocks()` en afterEach.
- Contratos evolucionados (REQ-01 de 05): el productor SIEMPRE emite `lineHeightsPx` — las expectativas de 04 ganaron `lineHeightsPx: []` (semántica intacta).
- Alias `@common` no resuelve; sub-bullets anidados rompen Prettier en tasks.md; skills citan secciones AGENTS.md por nombre.

## Próximos pasos

- **Revisión manual humana en navegador** (pendiente de 04 y 05): párrafos largos reales cortándose, indicadores en las fronteras, AXE.
- Luego: `/spec-write 06-complex-blocks` (plantilla) → review → feature. Clasificación real de bloques (reemplaza el predicado minimal), reglas de listas, imágenes async; tablas → 06b o descope.

## Pendientes / dudas abiertas

- PDF (09) · tablas 06b · virtualización (10) · calibración viudas/huérfanas (10) · render de header/footer: tokens vs Delta (08).
- Corregir referencias cruzadas de skills y ubicar/eliminar `temp/pagination-spec/` — requieren aprobación del usuario.
