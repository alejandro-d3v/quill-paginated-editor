# Manual Page Breaks — Tasks

## Preparation

- [x] Leer `docs/constitution.md` Principle VIII, RULE-011/012/013,
      §6 (escalón 9: custom Blots), §7.2, §13 (manual page break +
      page-break preservation).
- [x] Leer `docs/discovery.md` §3 (orden de extensión: Blots antes de
      forks), §4 (flag `manualBreakAfter` reservado para 07), §7, §11.
- [x] Leer `spec.md` y `plan.md` de esta spec.
- [x] Leer en `AGENTS.md` las secciones "Repository Structure",
      "Development Workflow", "Spec-Driven Development", "Angular Rules
      (v21)", "Quill Integration", "UI, Accessibility, and Security",
      "Validation Commands" y "Final Checklist" (por nombre; la
      numeración cambia).
- [x] Leer `MEMORY.md` (estado post-06) y la skill
      `.agents/skills/quill-wrapper/SKILL.md` (guardarraíles: jamás la
      instancia fuera del wrapper; Blots = mecanismo soportado).
- [x] Confirmar dependencias de 04–06: `blockKind`/`SPLITTABLE_KINDS`
      (06), `MeasuredBlock` (04), motor `paginate` (04) con las firmas
      del seam (commit `428def3`).
- [x] Confirmar línea base verde (`npm run lint`, `npm test`,
      `npm run build`): 111/111 en `5c1c728`.

## Implementation (REQ-01..REQ-04)

- [x] Crear `src/app/common/editor/page-break-blot.ts`: Blot `pageBreak`
      extendiendo BlockEmbed (`Quill.import('blots/block/embed')`), con
      `blotName 'pageBreak'`, `tagName 'div'`, `className 'page-break'`,
      `role="separator"` y `aria-label="Salto de página"` en el
      elemento; en el Delta `{ insert: { pageBreak: true } }`
      (semántico, Principle VIII/RULE-013). Base tipada como
      `Parchment.BlotConstructor` (los typings de `Quill.import` son
      `unknown`); `static value()` explícito; registro idempotente vía
      `Quill.register(PageBreakBlot, true)` (sin warn de re-definición).
- [x] Registrar el blot en `initializeEditor` del wrapper y añadir el
      botón de toolbar: grupo `['page-break']` en el container (objeto
      `{ container, handlers }`), handler que inserta el embed en el
      cursor (`insertEmbed(index, 'pageBreak', true)`) y deja el cursor
      tras el marcador (`setSelection(index + 1)`);
      `aria-label="Insertar salto de página"` en el botón (vía
      `inject<ElementRef<HTMLElement>>(ElementRef)` — Quill inserta el
      toolbar como hermano del contenedor, fuera de `#editor`).
- [x] Extender `src/app/common/pagination/block.ts`: `BlockKind` gana
      `'page-break'`; `MeasuredBlock` gana
      `readonly manualBreakAfter?: boolean` (opcional — fixtures de
      04–06 compilan sin editar; el motor usa `=== true`).
- [x] Extender `src/app/common/pagination/extract-blocks.ts`:
      `blockKind` devuelve `'page-break'` cuando algún op del bloque es
      el embed con clave `pageBreak` (con precedencia — el marcador
      auto-termina su línea y no tiene terminador; image inline sigue
      `'paragraph'`); `'page-break'` fuera de `SPLITTABLE_KINDS`
      (atómico). HALLAZGO de integración (browser): los block embeds
      auto-terminan su línea en el Delta de Quill — sin `\n` propio
      (confirmado en `Scroll#deltaToRenderBlocks`). El extractor ahora
      corta la línea en construcción y emite el marcador como bloque
      propio, alineado 1:1 con su hijo block-level del DOM. Sin este
      cambio el pipeline real fallaba con desalineo 3 hijos vs 2
      bloques.
- [x] Extender `src/app/common/pagination/measurement.ts`: para bloques
      `page-break`, emitir `manualBreakAfter: true` junto con la altura
      de flujo normal (medición de 04 sin cambios); resto de kinds sin
      la bandera.
- [x] Extender `src/app/common/pagination/paginate.ts` (cambio
      declarado): en el camino atómico, cerrar página tras colocar un
      bloque con `manualBreakAfter === true` aunque quede espacio;
      guarda anti-doble-cierre: si el bloque desborda, la página que
      lo porta ya se cerró por desborde y el cierre manual no se
      aplica dos veces; salto final sin página vacía extra (guarda de
      04); saltos consecutivos y salto desbordante cubiertos.
- [x] Añadir estilos mínimos en `src/styles.scss`: marcador
      `.page-break` visible (línea discontinua azul + etiqueta) y
      distinguible del indicador punteado gris del overlay; glifo del
      botón `.ql-page-break::after`.

## Tests (REQ-05)

- [x] Crear `src/app/common/editor/page-break-blot.spec.ts` con Quill
      REAL en jsdom (patrón `home.spec`): registrar el blot, crear
      editor, `insertEmbed` → `getContents` contiene
      `{ insert: { pageBreak: true } }`; `setContents` con ese op
      renderiza `div.page-break` con `role="separator"` y
      `aria-label`; eliminación nativa vía `deleteText`.
- [x] Extender `extract-blocks.spec.ts`: segmentación del marcador
      (entre párrafos, tras línea parcial, seguido de `\n`,
      consecutivos) → bloque propio; `blockKind` → `'page-break'`
      indivisible; regresión de 06: párrafo con image inline sigue
      `'paragraph'` (detección específica de la clave `pageBreak`).
- [x] Extender `measurement.spec.ts`: bloque page-break con DOM fixture
      del marcador → `manualBreakAfter: true`, `splittable: false`,
      `lineHeightsPx: []`, altura de flujo normal; bloques normales sin
      la bandera.
- [x] Extender `paginate.spec.ts` con los 4 fixtures de frontera:
      cierre forzado con 60px de sobrante → 2 páginas; salto como
      último bloque sin página vacía final; saltos consecutivos (una
      página por marcador); salto desbordante solo en su página con
      cierre manual allí, sin página vacía intercalada (aserciones
      explícitas). Además: invariant RULE-011 con marcadores
      intercalados y el marcador añadido al fixture de reconstrucción.
- [x] Extender `editor.spec.ts` (mock declarado: gana `register`,
      `import` (clase base stub para `'blots/block/embed'` — el Blot la
      extiende en el scope del módulo), `Parchment.Scope` stub (enum
      leído al definirse la clase) e `insertEmbed`/`getSelection`/
      `setSelection` en la instancia, con grabación de llamadas al
      constructor): la config del constructor incluye el grupo
      `['page-break']` en el container del toolbar y el handler; invocar
      el handler llama `insertEmbed` con `'pageBreak'` en la posición
      del cursor y deja el cursor tras el marcador; registro del blot
      con overwrite; los tests existentes de 01–03 siguen pasando.
- [x] Verificar por diff que la suite 04–06 NO cambia expectativas
      (solo adiciones y stubs/mocks declarados; las deiciones son
      líneas internas del mock y docs) y que los fixtures previos
      compilan sin editar.
- [x] Ejecutar `npm test` → 131/131.

## Integration

- [x] Confirmar pureza (RULE-006): `blockKind`/`extractBlocks`/
      `paginate` sin Angular/DOM (solo tipos de `'quill'`); el Blot y
      `Quill.register` viven en el lado editor (`common/editor/`).
- [x] Confirmar que el core de Quill no se toca (RULE-001/002): solo
      BlockEmbed + register (mecanismo soportado, discovery §3).
- [x] Confirmar que el embed ES contenido del Delta (RULE-003/011): sin
      pérdida en paginación (invariant de reconstrucción con el
      fixture de salto) y round-trip en verde (blot spec con Quill
      real).
- [x] Confirmar vista intacta (A1/RULE-015): `git diff` no toca
      `home/` ni `common/components/` — el indicador existente dibuja la
      frontera; config intacta; sin deps (package.json sin cambios).
- [x] Verificación manual en navegador (Edge headless + CDP sobre
      `http-server` del build): botón presente con
      `aria-label="Insertar salto de página"`; marcador con
      `role="separator"` + `aria-label`; con dos párrafos cortos + un
      salto la frontera cae EN el marcador (línea a 75px vs fondo del
      marcador a 78px; Δ≈3px) — la frontera solo existe por el cierre
      manual (sin él, 1 página y 0 líneas); segundo salto → 3 páginas,
      2 fronteras (104 vs 109, Δ≈5px); cero errores de consola.
      HALLAZGOS para 10: (a) la frontera dibujada queda ~3–5px por
      encima del fondo visual del marcador (margen del bloque:
      calibración de offsets, junto al offset de toolbar ya
      conocido); (b) los fixtures de Delta con `'\n'` tras el embed
      eran del modelo equivocado — corregido a bloque propio.

## Review

- [x] `npm run lint` → PASS.
- [x] `npm test` → PASS (131/131).
- [x] `npm run build` → PASS (solo el warning preexistente de
      `quill-delta` CommonJS).
- [x] `npx prettier --write/--check` sobre los archivos tocados (no
      repo-wide: `format:check` repo-wide ya falla por archivos
      preexistentes fuera de scope) → PASS.
- [x] `tasks.md` refleja el estado real.
- [x] `MEMORY.md` actualizado (≤ 50 líneas) con las decisiones del
      salto manual.
- [x] Sincronizar `AGENTS.md` (secciones por nombre): el overview gana
      saltos manuales semánticos (blot + bandera + cierre declarado +
      bloque propio sin terminador).
- [x] Reportar archivos modificados, comandos ejecutados y resultado.
- [x] NO iniciar `08-header-footer`.
