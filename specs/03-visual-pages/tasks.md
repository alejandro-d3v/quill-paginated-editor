# Visual Pages — Tasks

## Preparation

- [ ] Leer `docs/constitution.md` §8 (Visual Editor), §9 (Angular), §11,
      §13, §16 y Principle X; RULE-015, RULE-017, RULE-018, RULE-020.
- [ ] Leer `docs/discovery.md` §3 (A1), §5 (`common/components/` para 03),
      §10 (riesgos #2/#4) y §11 (orden del roadmap).
- [ ] Leer `spec.md` y `plan.md` de esta spec.
- [ ] Leer en `AGENTS.md` las secciones "Repository Structure",
      "Development Workflow", "Spec-Driven Development", "Angular Rules (v21)",
      "UI, Accessibility, and Security", "Quill Integration",
      "Validation Commands" y "Final Checklist" (por nombre; la numeración
      cambia).
- [ ] Leer la skill `.agents/skills/quill-wrapper/SKILL.md` (patrón ARIA y
      wrapper moderno).
- [ ] Confirmar dependencias: `src/app/common/pagination/page-geometry.ts`
      exporta `PageGeometry`/`computePageGeometry` (02) y
      `src/app/common/document/document-settings.ts` exporta
      `DEFAULT_DOCUMENT_SETTINGS` (01).
- [ ] Confirmar línea base verde (`npm run lint`, `npm test`,
      `npm run build`).

## Implementation (REQ-01..REQ-04)

- [ ] Crear `src/app/common/components/page-frame/page-frame.{ts,html,scss}`:
      `PageFrame`, selector `app-page-frame`, `OnPush`, plantilla externa,
      `input.required<PageGeometry>`; style bindings px (width del marco,
      min-height, padding de márgenes, ancho del área de contenido);
      bandas header/footer condicionales (`@if` por altura > 0) y
      `<ng-content />` en el área de contenido.
- [ ] Crear `src/app/common/components/pages-container/pages-container.{ts,html,scss}`:
      `PagesContainer`, selector `app-pages-container`, `OnPush`,
      presentacional (canvas neutro que centra la columna de páginas),
      `<ng-content />`.
- [ ] Integrar en `src/app/home/pages/home/home.{ts,html}`: `settings`
      signal + `geometry` computed; plantilla canvas → marco → editor;
      `OnPush` y sin `standalone: true` (solo porque el archivo ya se
      edita — RULE-019).
- [ ] Refactor del wrapper (`src/app/common/editor/editor.{ts,html,scss}`),
      preservando comportamiento (RULE-020): sin `standalone: true` ni
      `imports: []`; añadir `OnPush`; sustituir `@ViewChild` por
      `viewChild.required<ElementRef<HTMLDivElement>>('editor')` (ciclo en
      `ngAfterViewInit`, cambio mínimo); ARIA en `#editor`
      (`role="textbox"`, `aria-label="Editor de documento"`,
      `aria-multiline="true"`); mover los overrides `.ql-*` de
      `editor.scss` a `src/styles.scss` (byte-idénticos) y eliminar
      `::ng-deep`; preservar clase `EditorComponent`, selector `app-editor`,
      theme/toolbar/placeholder, `deltaChange` + wiring y cleanup.

## Tests (REQ-05)

- [ ] Crear `page-frame.spec.ts`: style bindings del marco con
      `computePageGeometry(DEFAULT_DOCUMENT_SETTINGS)`; bandas ausentes con
      los defaults y presentes con alturas correctas con settings que las
      habilitan; padding de márgenes y ancho del área de contenido.
- [ ] Crear `pages-container.spec.ts`: creación y proyección de contenido.
- [ ] Extender `home.spec.ts`: `app-pages-container` > `app-page-frame` >
      `app-editor` anidados; el marco recibe la geometría (style width
      esperado). Quill real sigue ejerciéndose aquí sin mock.
- [ ] Extender `editor.spec.ts`: contenedor con `role="textbox"`,
      `aria-label`, `aria-multiline`; tests existentes de `deltaChange` y
      cleanup sin cambios de semántica.
- [ ] Ejecutar `npm test`.

## Integration

- [ ] Confirmar que ningún componente reestructura el DOM del editor
      (A1/RULE-015): la composición solo envuelve.
- [ ] Confirmar que `PageFrame`/`PagesContainer` no importan Quill ni
      servicios de paginación (solo `PageGeometry` de 02).
- [ ] Confirmar presupuesto de estilos por componente (< 4 kB warn,
      `angular.json`).
- [ ] Confirmar que no se tocó `common/document/` ni `common/pagination/`
      (salvo imports de tipos), ni config (`eslint.config.mjs`,
      `tsconfig*.json`, `angular.json`, `package.json`).
- [ ] Verificación manual en navegador (recomendada, no bloqueante):
      apariencia de página y auditoría AXE; documentar hallazgos para
      specs futuras (08), sin improvisar cambios aquí.

## Review

- [ ] `npm run lint` → PASS.
- [ ] `npm test` → PASS.
- [ ] `npm run build` → PASS.
- [ ] `npx prettier --write` sobre los archivos tocados (no repo-wide:
      `format:check` repo-wide ya falla por archivos preexistentes fuera
      de scope).
- [ ] `tasks.md` refleja el estado real.
- [ ] `MEMORY.md` actualizado (≤ 50 líneas).
- [ ] Reportar archivos modificados, comandos ejecutados y resultado.
- [ ] NO iniciar `04-pagination-mvp`.
