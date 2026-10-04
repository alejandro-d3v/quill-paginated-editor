# Visual Pages — Tasks

## Preparation

- [x] Leer `docs/constitution.md` §8 (Visual Editor), §9 (Angular), §11,
      §13, §16 y Principle X; RULE-015, RULE-017, RULE-018, RULE-020.
- [x] Leer `docs/discovery.md` §3 (A1), §5 (`common/components/` para 03),
      §10 (riesgos #2/#4) y §11 (orden del roadmap).
- [x] Leer `spec.md` y `plan.md` de esta spec (versión amendada `1c9716e`).
- [x] Leer en `AGENTS.md` las secciones "Repository Structure",
      "Development Workflow", "Spec-Driven Development", "Angular Rules (v21)",
      "UI, Accessibility, and Security", "Quill Integration",
      "Validation Commands" y "Final Checklist" (por nombre; la numeración
      cambia).
- [x] Leer la skill `.agents/skills/quill-wrapper/SKILL.md` (patrón ARIA y
      wrapper moderno).
- [x] Confirmar dependencias: `src/app/common/pagination/page-geometry.ts`
      exporta `PageGeometry`/`computePageGeometry` (02) y
      `src/app/common/document/document-settings.ts` exporta
      `DEFAULT_DOCUMENT_SETTINGS` (01).
- [x] Confirmar línea base verde (`npm run lint`, `npm test`,
      `npm run build`). → PASS / PASS (31 tests) / PASS (ejecutados
      2026-10-04, antes de tocar nada).

## Implementation (REQ-01..REQ-04)

- [x] Crear `src/app/common/components/page-frame/page-frame.{ts,html,scss}`:
      `PageFrame`, selector `app-page-frame`, `OnPush`, plantilla externa,
      `input.required<PageGeometry>`; style bindings px (width del marco,
      min-height, padding de márgenes, ancho del área de contenido);
      bandas header/footer condicionales (`@if` por altura > 0) y
      `<ng-content />` en el área de contenido.
      → flujo header → contenido → footer, anclado a `contentYPx` de 02.
- [x] Crear `src/app/common/components/pages-container/pages-container.{ts,html,scss}`:
      `PagesContainer`, selector `app-pages-container`, `OnPush`,
      presentacional (canvas neutro que centra la columna de páginas),
      `<ng-content />`.
- [x] Integrar en `src/app/home/pages/home/home.{ts,html}`: `settings`
      signal + `geometry` computed; plantilla canvas → marco → editor;
      `OnPush` y sin `standalone: true` (solo porque el archivo ya se
      edita — RULE-019).
- [x] Refactor del wrapper (`src/app/common/editor/editor.{ts,html,scss}`),
      preservando comportamiento (RULE-020): sin `standalone: true` ni
      `imports: []`; añadir `OnPush`; sustituir `@ViewChild` por
      `viewChild.required<ElementRef<HTMLDivElement>>('editor')` (ciclo en
      `ngAfterViewInit`, cambio mínimo); ARIA en `#editor`
      (`role="textbox"`, `aria-label="Editor de documento"`,
      `aria-multiline="true"`); mover los overrides `.ql-*` de
      `editor.scss` a `src/styles.scss` (declaraciones byte-idénticas) y
      eliminar `::ng-deep`; preservar clase `EditorComponent`, selector
      `app-editor`, theme/toolbar/placeholder, `deltaChange` + wiring y
      cleanup.
      → los 4 tests de la spec 01 siguen pasando sin cambios de semántica.

## Tests (REQ-05)

- [x] Crear `page-frame.spec.ts`: style bindings del marco con
      `computePageGeometry(DEFAULT_DOCUMENT_SETTINGS)`; bandas ausentes con
      los defaults y presentes con alturas correctas con settings que las
      habilitan; padding de márgenes y ancho del área de contenido.
      → 4 tests. Nota: `input.required` requiere
      `fixture.componentRef.setInput(...)` antes del primer `whenStable()`.
- [x] En las aserciones de styles (page-frame y home): parsear el valor
      (`parseFloat`) y comparar con `toBeCloseTo` ≥ 6, o computar el
      esperado con la expresión idéntica `(mm * 96) / 25.4` — nunca
      comparar strings de floats de expresiones distintas.
      → aplicado en todos los asserts de styles (`toPx` local independiente).
- [x] Crear `pages-container.spec.ts`: creación y proyección de contenido.
      → 2 tests (TestHost con `<ng-content />` proyectado).
- [x] Extender `home.spec.ts`: `app-pages-container` > `app-page-frame` >
      `app-editor` anidados; el marco recibe la geometría (style width
      esperado). Quill real sigue ejerciéndose aquí sin mock.
      → +2 tests (composición anidada + geometría en el marco).
- [x] Extender `editor.spec.ts`: contenedor con `role="textbox"`,
      `aria-label`, `aria-multiline`; tests existentes de `deltaChange` y
      cleanup sin cambios de semántica.
      → +1 test ARIA; los 4 de 01 intactos.
- [x] Ejecutar `npm test`. → PASS: 40 tests / 8 archivos (9 nuevos).

## Integration

- [x] Confirmar que ningún componente reestructura el DOM del editor
      (A1/RULE-015): la composición solo envuelve.
      → diff revisado: `editor.html` solo ganó atributos ARIA; el editor se
      proyecta dentro del marco via `<ng-content />`.
- [x] Confirmar que `PageFrame`/`PagesContainer` no importan Quill ni
      servicios de paginación (solo `PageGeometry` de 02).
      → grep: 0 matches de quill/paginate/MeasurementService/LayoutDocument
      en los componentes nuevos.
- [x] Confirmar por grep (AC-5): sin `::ng-deep` en `editor.scss` y
      overrides `.ql-` presentes en `src/styles.scss`.
      → 0 matches de `::ng-deep`; 3 overrides `.ql-*` en `styles.scss`.
- [x] Confirmar presupuesto de estilos por componente (< 4 kB warn,
      `angular.json`).
      → page-frame.scss 21 líneas, pages-container.scss 9 líneas — muy por
      debajo; build PASS sin warnings de presupuesto.
- [x] Confirmar que no se tocó `common/document/` ni `common/pagination/`
      (salvo imports de tipos), ni config (`eslint.config.mjs`,
      `tsconfig*.json`, `angular.json`, `package.json`).
      → git status: solo editor×4, home×3, styles.scss y `common/components/`.
- [ ] Verificación manual en navegador (recomendada, no bloqueante):
      apariencia de página y auditoría AXE; documentar hallazgos para
      specs futuras (08), sin improvisar cambios aquí.
      → NO EJECUTADA por el agente: requiere revisión visual humana; la
      suite automatizada cubre los contratos DOM/estilos. No bloqueante
      por diseño de la spec (REQ-06/plan).

## Review

- [x] `npm run lint` → PASS (sin `lint:fix` necesario).
- [x] `npm test` → PASS (40/40).
- [x] `npm run build` → PASS (initial 231.35 kB / 61.00 kB transfer; +9.9 kB
      por el caparazón; warning preexistente `quill-delta` CommonJS).
- [x] `npx prettier --write` sobre los archivos tocados (no repo-wide:
      `format:check` repo-wide ya falla por archivos preexistentes fuera
      de scope). → ejecutado; todos "(unchanged)" tras una pasada.
- [x] `tasks.md` refleja el estado real. (esta actualización)
- [x] `MEMORY.md` actualizado (≤ 50 líneas).
- [x] Sincronizar `AGENTS.md` (secciones por nombre): en "Repository
      Overview", la deuda del wrapper queda resuelta por REQ-04 y el
      estado gana el caparazón visual; en "Repository Structure", el árbol
      gana `common/components/`.
- [x] Reportar archivos modificados, comandos ejecutados y resultado.
- [x] NO iniciar `04-pagination-mvp`.
