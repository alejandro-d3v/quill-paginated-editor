# MEMORY.md — quill-paginated-editor

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte. Las reglas permanentes viven en `AGENTS.md`, no aquí.

## Estado actual

- **06-complex-blocks COMPLETA** (2026-10-04): clasificación por tipo (`blockKind`: paragraph/heading/list/blockquote/code-block) + matriz de divisibilidad (heading único indivisible conocido); unidades de corte por tipo — listas miden flujos de `<li>` (corte solo en fronteras de ítem), blockquote/code-block por líneas de texto; imágenes async (`imagesReady` + listener captura load/error en home).
- **El motor `paginate.ts` NO cambió en 06** (diff vacío — la unidad la fija la medición); exactamente 3 updates declarados a tests de 05 (list/blockquote/code-block → divisibles).
- Suite verde: 111 tests / 12 archivos (+17). Lint 0/0; build 240.2 kB initial. Warning preexistente `quill-delta` CommonJS.
- Aún sin: breaks manuales (07), bandas (08), PDF (09), incremental/viudas (10), tablas (06b o descope).
- **Hallazgo de verificación manual de 04/05 SIN ASIGNAR**: offset del toolbar (66px medidos) — las líneas de corte caen 66px arriba del corte real; el motor sobrellena la página 1. Requiere decisión del humano (parche standalone / incluir en una spec / diferir a 10). El usuario debe hacer hard-reload del tab de dev-server (módulo JS viejo en el navegador explicaba "no veo nada").

## Decisiones (00-discovery en `docs/discovery.md`; 01–06 aquí)

- **06 — unidad-li**: las listas cortan SOLO en fronteras de `<li>` porque la medición no emite unidades más finas; el motor consume unidades genéricamente (RULE-006/019). `lineRange` en bloques list = índices de `<li>` (contrato para 09).
- **06 — matriz**: la rama defensiva de 05 se conserva (sin op terminador → indivisible); heading indivisible; `align`/`indent` no cambian el tipo.
- **06 — imágenes**: medir solo geometría renderizada (`complete === true`; el error de carga también habilita — URL rota no cuelga el flujo); gate mantiene el último layout válido; listener en captura vive y muere con el elemento.
- **05** — descriptores `lineRange` (semicerrado); regla de última línea (`sum === heightPx`); huérfana mínima = 1 línea por lado; fallback medición → atómico.
- **04** — seam `paginate` puro + `measure(blocks, container)` fail-fast; alturas de flujo por diferencia de offsets; embeds inline acumulan en su línea; runs de listas fusionados.
- **01–03** — Delta desde `'quill'`; validadores estructural/geométrico separados; caparazón visual A1 con `PageFrame`/`PagesContainer` + indicadores.

## Aprendizajes y errores a evitar

- `BlockKind`/`Block` son tipos nuestros (`./block`) — `Delta`/`Op` sí de `'quill'` (TS2614/TS2304 si se cruzan).
- `@typescript-eslint/array-type`: `readonly T[]`, no `ReadonlyArray<T>`.
- Tests DOM previos: los `.toBe(false)` multilínea escapan a greps de una línea — auditar diffs con `-U2` y patrón de título.
- jsdom no carga imágenes reales: `imagesReady` se testea con `Object.defineProperty(img, 'complete', {...})`.
- CD de dev-server: hacer hard-reload del tab tras cambios grandes (el módulo JS viejo del navegador simula "no funciona".
- Alias `@common` no resuelve; sub-bullets anidados rompen Prettier en tasks.md; skills citan secciones AGENTS.md por nombre.

## Próximos pasos

- **Revisión manual humana en navegador** (pendiente de 04/05/06): párrafos, listas y blockquotes largos cortándose; imagen remota → layout al cargar; hard-reload primero; AXE.
- Luego: `/spec-write 07-manual-page-breaks` (plantilla) → review → feature. Blot de salto manual + bandera en MeasuredBlock.
- Decidir el offset del toolbar (ver Estado actual) y las tablas (06b o descope).

## Pendientes / dudas abiertas

- PDF (09) · tablas 06b · virtualización (10) · calibración viudas (10: la viuda requiere extensión simétrica del motor) · render de header/footer: tokens vs Delta (08).
- Corregir referencias cruzadas de skills y ubicar/eliminar `temp/pagination-spec/` — requieren aprobación del usuario.
