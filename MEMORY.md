# MEMORY.md — quill-paginated-editor

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte. Las reglas permanentes viven en `AGENTS.md`, no aquí.

## Estado actual

- **07-manual-page-breaks COMPLETA** (2026-10-04): Blot `pageBreak` (BlockEmbed, `{ insert: { pageBreak: true } }`, `role="separator"`) + botón de toolbar con handler + `BlockKind 'page-break'` + `MeasuredBlock.manualBreakAfter` + cierre manual declarado en el camino atómico (guarda anti-doble-cierre: si desborda, la página del marcador ya se cerró). Suite 131/131, lint/build verdes, verificado en navegador (Edge headless + CDP).
- **06-complex-blocks COMPLETA**: `blockKind` + matriz de divisibilidad (heading y page-break indivisibles); listas cortan en fronteras de `<li>`; imágenes async (`imagesReady`).
- Aún sin: header/footer (08), PDF (09), incremental/viudas (10), tablas (06b o descope).
- **Offset del toolbar SIN ASIGNAR** (hallazgo de 04/05): nuevo dato de la verificación de 07 — con las alturas de flujo de 05, la frontera cae solo ~3–5px por encima del fondo visual del marcador (75 vs 78; 104 vs 109). El "66px" anterior puede haber sido absorbido por la regla de última línea de 05; RE-MEDIR antes de asignar el fix. Decisión humana: parche / spec / diferir a 10.

## Decisiones (00-discovery en `docs/discovery.md`; 01–07 aquí)

- **07 — bloque propio sin terminador**: en el Delta de Quill los block embeds AUTO-TERMINAN su línea (sin `\n` propio; espejo de `Scroll#deltaToRenderBlocks`). `extractBlocks` corta la línea pendiente y emite el marcador como bloque propio (1:1 con el DOM). Sin esto, el pipeline real fallaba: desalineo 3 hijos vs 2 bloques. Detectado por clave `pageBreak` (único block embed registrado); un block embed desconocido falla rápido en `MeasurementService`.
- **07 — tipado del Blot**: base `Quill.import('blots/block/embed')` afirmada como `Parchment.BlotConstructor` (import de `Parchment` desde `'quill'` da tipos + enum `Scope`); statics con `override` (blotName/tagName/className/scope/create); registro `Quill.register(PageBreakBlot, true)` (warn-only ante re-definición; overwrite lo silencia).
- **07 — botón de toolbar**: Quill inserta el toolbar como HERMANO de `#editor` (dentro del host) → el `aria-label` se busca con `inject<ElementRef<HTMLElement>>(ElementRef)`, no desde `#editor`. Botón = grupo `['page-break']` (como `['clean']`).
- **06** — unidad-li; matriz con rama defensiva intacta; imágenes `complete === true`.
- **05** — `lineRange` semicerrado; regla de última línea; huérfana 1 línea; fallback → atómico.
- **04** — seam `paginate` puro + `measure` fail-fast; alturas de flujo por diferencia de offsets; runs de listas fusionados.
- **01–03** — Delta desde `'quill'`; validadores separados; caparazón A1 con indicadores.

## Aprendizajes y errores a evitar

- `getSelection(true)` retorna `Range` NO nulo según los typings (sobrecarga `focus: true`) — no chequear null (no-unnecessary-condition).
- `setContents` tipado exige `Delta` (clase) o `Op[]` — pasar el ARRAY de ops, no `{ ops: [...] }`.
- `never[]` en constructores estructurales rompe la asignabilidad a `new (...args: any[])` — usar el tipo real de Parchment.
- El mock de 'quill' debe exportar también `Parchment` (el Blot lee `Parchment.Scope` al DEFINIRSE la clase, en import time) y stubs `register`/`import` (clase base).
- `BlockKind`/`Block` son tipos nuestros (`./block`) — `Delta`/`Op` sí de `'quill'`.
- `.toBe(false)` multilínea escapa greps de una línea — auditar diffs con `-U2`.
- jsdom no carga imágenes: `Object.defineProperty(img, 'complete', {...})`. CD de dev-server: hard-reload del tab.

## Próximos pasos

- Esperar commit del usuario de 07; luego `/spec-write 08-header-footer` cuando lo pida.
- Re-medir el offset de toolbar (ver Estado actual) y decidir: parche / spec / 10. Tablas: 06b o descope.
- Revisión humana en navegador pendiente de 04–07 (hard-reload primero; AXE sobre botón y marcador).

## Pendientes / dudas abiertas

- PDF (09) · tablas 06b · virtualización/viudas (10) · header/footer: tokens vs Delta (08).
- Corregir referencias cruzadas de skills y ubicar/eliminar `temp/pagination-spec/` — requieren aprobación del usuario.
