# Manual Page Breaks — Tasks

## Preparation

- [ ] Leer `docs/constitution.md` Principle VIII, RULE-011/012/013,
      §6 (escalón 9: custom Blots), §7.2, §13 (manual page break +
      page-break preservation).
- [ ] Leer `docs/discovery.md` §3 (orden de extensión: Blots antes de
      forks), §4 (flag `manualBreakAfter` reservado para 07), §7, §11.
- [ ] Leer `spec.md` y `plan.md` de esta spec.
- [ ] Leer en `AGENTS.md` las secciones "Repository Structure",
      "Development Workflow", "Spec-Driven Development", "Angular Rules
      (v21)", "Quill Integration", "UI, Accessibility, and Security",
      "Validation Commands" y "Final Checklist" (por nombre; la
      numeración cambia).
- [ ] Leer `MEMORY.md` (estado post-06) y la skill
      `.agents/skills/quill-wrapper/SKILL.md` (guardarraíles: jamás la
      instancia fuera del wrapper; Blots = mecanismo soportado).
- [ ] Confirmar dependencias de 04–06: `blockKind`/`SPLITTABLE_KINDS`
      (06), `MeasuredBlock` (04), motor `paginate` (04) con las firmas
      del seam (commit `428def3`).
- [ ] Confirmar línea base verde (`npm run lint`, `npm test`,
      `npm run build`).

## Implementation (REQ-01..REQ-04)

- [ ] Crear `src/app/common/editor/page-break-blot.ts`: Blot `pageBreak`
      extendiendo BlockEmbed (`Quill.import('blots/block/embed')`), con
      `blotName 'pageBreak'`, `tagName 'div'`, `className 'page-break'`,
      `role="separator"` y `aria-label="Salto de página"` en el
      elemento; en el Delta `{ insert: { pageBreak: true } }`
      (semántico, Principle VIII/RULE-013).
- [ ] Registrar el blot en `initializeEditor` del wrapper
      (`Quill.register(PageBreakBlot)` antes de crear la instancia) y
      añadir el botón de toolbar: entrada `'page-break'` en el
      container, handler que inserta el embed en el cursor
      (`insertEmbed(index, 'pageBreak', true)`) y deja el cursor tras
      el marcador; `aria-label="Insertar salto de página"` en el botón.
- [ ] Extender `src/app/common/pagination/block.ts`: `BlockKind` gana
      `'page-break'`; `MeasuredBlock` gana
      `readonly manualBreakAfter?: boolean` (opcional — fixtures de
      04–06 compilan sin editar; el motor usa `?? false`).
- [ ] Extender `src/app/common/pagination/extract-blocks.ts`:
      `blockKind` devuelve `'page-break'` cuando algún op del bloque es
      un embed con clave `pageBreak` (precedencia sobre los atributos
      del terminador; image inline sigue `'paragraph'`);
      `'page-break'` fuera de `SPLITTABLE_KINDS` (atómico).
- [ ] Extender `src/app/common/pagination/measurement.ts`: para bloques
      `page-break`, emitir `manualBreakAfter: true` junto con la altura
      de flujo normal (medición de 04 sin cambios); resto de kinds sin
      la bandera.
- [ ] Extender `src/app/common/pagination/paginate.ts` (cambio
      declarado): en el camino atómico, cerrar página tras colocar un
      bloque con `manualBreakAfter === true` aunque quede espacio;
      salto final sin página vacía extra (guarda de 04); saltos
      consecutivos y salto desbordante cubiertos por los casos
      documentados.
- [ ] Añadir estilos mínimos en `src/styles.scss`: marcador
      `.page-break` visible y distinguible del indicador punteado del
      overlay; icono del botón `.ql-page-break`.

## Tests (REQ-05)

- [ ] Crear `src/app/common/editor/page-break-blot.spec.ts` con Quill
      REAL en jsdom (patrón `home.spec`): registrar el blot, crear
      editor, `insertEmbed` → `getContents` contiene
      `{ insert: { pageBreak: true } }`; `setContents` con ese op
      renderiza `div.page-break` con `role="separator"` y
      `aria-label`.
- [ ] Extender `extract-blocks.spec.ts`: ops
      `[{ insert: { pageBreak: true } }, { insert: '\n' }]` → un bloque
      `'page-break'` indivisible; regresión de 06: párrafo con image
      inline sigue `'paragraph'` (la detección es específica de la
      clave `pageBreak`).
- [ ] Extender `measurement.spec.ts`: bloque page-break con DOM fixture
      del marcador → `manualBreakAfter: true`, `splittable: false`,
      `lineHeightsPx: []`, altura de flujo normal.
- [ ] Extender `paginate.spec.ts` con los 4 fixtures de frontera:
      `[atómico 30, salto (manualBreakAfter, height 10), atómico 40]`
      con `contentHeightPx 100` → 2 páginas (cierre forzado con 60px de
      sobrante); salto como último bloque sin página vacía final;
      saltos consecutivos; salto que no cabe → solo en la página
      siguiente con cierre manual allí, sin página vacía intercalada
      (aserción explícita).
- [ ] Extender `editor.spec.ts` (mock declarado: gana
      `register: vi.fn()`, `import: vi.fn()` (devolviendo una clase
      base stub para `'blots/block/embed'` — el Blot la extiende en el
      scope del módulo) e `insertEmbed: vi.fn()`): la config del
      constructor incluye `'page-break'` en el container del toolbar;
      invocar el handler llama `insertEmbed` con `'pageBreak'` en la
      posición del cursor; los tests existentes de 01–03 siguen
      pasando.
- [ ] Verificar por diff que la suite 04–06 NO cambia expectativas
      (solo mocks/stubs declarados) y que los fixtures previos compilan
      sin editar.
- [ ] Ejecutar `npm test`.

## Integration

- [ ] Confirmar pureza (RULE-006): `blockKind`/`extractBlocks`/
      `paginate` sin Angular/DOM; el Blot y `Quill.register` viven en
      el lado editor (`common/editor/`).
- [ ] Confirmar que el core de Quill no se toca (RULE-001/002): solo
      BlockEmbed + register (mecanismo soportado, discovery §3).
- [ ] Confirmar que el embed ES contenido del Delta (RULE-003/011): sin
      pérdida en paginación (invariant de reconstrucción con los
      fixtures de salto) y round-trip en verde.
- [ ] Confirmar vista intacta (A1/RULE-015): `git diff` no toca
      `home/` ni `common/components/` — el indicador existente dibuja
      la frontera; config intacta; sin deps.
- [ ] Verificación manual en navegador (recomendada, no bloqueante):
      insertar un salto → la frontera cae en el marcador; insertar
      varios; eliminar con Backspace; AXE sobre el botón y el
      marcador. Documentar hallazgos para 10.

## Review

- [ ] `npm run lint` → PASS.
- [ ] `npm test` → PASS.
- [ ] `npm run build` → PASS.
- [ ] `npx prettier --write` sobre los archivos tocados (no repo-wide:
      `format:check` repo-wide ya falla por archivos preexistentes fuera
      de scope).
- [ ] `tasks.md` refleja el estado real.
- [ ] `MEMORY.md` actualizado (≤ 50 líneas) con las decisiones del
      salto manual.
- [ ] Sincronizar `AGENTS.md` (secciones por nombre): el overview gana
      saltos manuales semánticos (blot + bandera + cierre declarado).
- [ ] Reportar archivos modificados, comandos ejecutados y resultado.
- [ ] NO iniciar `08-header-footer`.
