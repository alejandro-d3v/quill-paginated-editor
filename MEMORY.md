# MEMORY.md — quill-paginated-editor

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte. Las reglas permanentes viven en `AGENTS.md`, no aquí.

## Estado actual

- **07-manual-page-breaks COMPLETA** (2026-10-04): Blot `pageBreak` (BlockEmbed, `{ insert: { pageBreak: true } }`, `role="separator"`) + botón de toolbar + `BlockKind 'page-break'` + `MeasuredBlock.manualBreakAfter` + cierre manual declarado (guarda anti-doble-cierre). Suite 131/131, lint/build verdes. **El usuario delegó y ejecuté la revisión runtime de 04–07** (Edge headless + CDP): 04 natural ✓, 05 split de párrafo largo en runtime ✓, 06 listas vía botones reales ✓ (split específico: evidencia parcial, cubierto por tests), 07 marcador + ARIA ✓, cero errores de consola. Imagen async: paste sintético rechazado por el navegador — cubierta por tests de 06; ocular humana con drag&drop opcional.
- **06-complex-blocks COMPLETA**: `blockKind` + matriz (heading y page-break indivisibles); listas cortan en fronteras de `<li>`; imágenes async (`imagesReady`).
- Aún sin: header/footer (08), PDF (09), incremental/viudas (10).
- **DECISIÓN offset del toolbar (delegada; medido, no parcheado)**: coordenadas absolutas confirman deriva de **−78px en TODAS las fronteras** dibujadas + página 1 sobrecargada ~68px. Raíz: el toolbar (66px) renderiza DENTRO del content-area de la página y `.breaks` dibuja desde el top del content-area, mientras el motor acumula desde el primer bloque de texto (78px de chrome en medio). La medición "Δ3px" de 07 era ERROR mío (comparé offsetTop en dos espacios de coordenadas). **Se resuelve con mini-spec dedicada ANTES de 08** (toolbar fuera del marco + origen del overlay = origen del flujo); 08 (bandas/`contentYPx`) la requiere como prerrequisito. Sin parche fuera de ciclo.
- **DECISIÓN tablas (delegada): DESCOPE.** El módulo table de Quill 2 es minimal; soporte real exige unidades por fila + repetición de cabecera = épica propia, no un 06b. Bloques desconocidos hoy: indivisibles + fail-fast de desalineo (RULE-011). Gatillo de revisita: demanda real de tablas.

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

- Esperar commit del usuario de 07; luego `/spec-write` de la mini-spec **"toolbar fuera del marco + origen del overlay"** (prerrequisito de 08) cuando lo pida; después 08-header-footer.
- Tablas: descope decidido (ver Estado actual). Opcional humano: drag&drop de una imagen en dev-server (hard-reload primero) para el check ocular async; AXE completo opcional.

## Pendientes / dudas abiertas

- PDF (09) · virtualización/viudas (10) · header/footer: tokens vs Delta (08).
- Corregir referencias cruzadas de skills y ubicar/eliminar `temp/pagination-spec/` — requieren aprobación del usuario.
