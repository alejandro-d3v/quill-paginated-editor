# Visual Pages — Plan

## Objective

Producir el caparazón visual A1 — canvas, marco de página con la geometría
de la spec 02 y editor embebido — y alinear el wrapper con las convenciones
Angular del repo, sin tocar paginación y sin reestructurar el DOM del
editor.

## Deliverable

Nuevos:

- `src/app/common/components/page-frame/page-frame.{ts,html,scss}`
- `src/app/common/components/page-frame/page-frame.spec.ts`
- `src/app/common/components/pages-container/pages-container.{ts,html,scss}`
- `src/app/common/components/pages-container/pages-container.spec.ts`

Modificados:

- `src/app/home/pages/home/home.{ts,html}` — composición + signals + OnPush
  (sin `standalone: true`, solo porque el archivo ya se edita).
- `src/app/home/pages/home/home.spec.ts` — assertions de composición.
- `src/app/common/editor/editor.{ts,html,scss}` — refactor REQ-04 (OnPush,
  `viewChild()` signal, ARIA, sin `standalone: true`/`imports: []`, sin
  `::ng-deep`).
- `src/app/common/editor/editor.spec.ts` — assertions ARIA.
- `src/styles.scss` — overrides `.ql-*` reubicados (byte-idénticos).

## Approach

1. Leer constitution §8 (Visual Editor), §9 (Angular), §11, §13, §16
   (rol UI Engineer) y Principle X; discovery §3 (A1), §5 (`common/components/`
   para 03), §10 (riesgos #2/#4); los contratos de 01–02 (`PageGeometry`,
   `deltaChange`) y AGENTS.md por nombre de sección ("Angular Rules",
   "UI, Accessibility, and Security", "Quill Integration",
   "Validation Commands").
2. Confirmar dependencias: `common/pagination/page-geometry.ts` exporta
   `PageGeometry`/`computePageGeometry` (02, verificado: implementada) y
   `common/document/` exporta `DEFAULT_DOCUMENT_SETTINGS` (01). Línea base
   verde.
3. Crear `PageFrame`: `input.required<PageGeometry>`, style bindings px,
   bandas condicionales con `@if`, `<ng-content />`, OnPush, plantilla
   externa.
4. Crear `PagesContainer`: canvas presentacional con `<ng-content />`.
5. Integrar en `home`: `settings` signal + `geometry` computed + plantilla
   de composición; OnPush y sin `standalone: true`.
6. Refactor del wrapper (REQ-04) preservando comportamiento: convenciones,
   `viewChild.required`, ARIA, `::ng-deep` → `styles.scss`.
7. Tests: `page-frame` (geometry-driven), `pages-container` (proyección),
   `home` (composición), `editor` (ARIA + tests existentes sin cambios de
   semántica).
8. `npm test`, `npm run lint`, `npm run build`; `npx prettier --write` sobre
   los archivos tocados (no repo-wide).
9. Actualizar `tasks.md` y `MEMORY.md`; reportar. Verificación manual en
   navegador (recomendada, no bloqueante): apariencia de página y auditoría
   AXE — hallazgos documentados para specs futuras, sin improvisar aquí.

## Design constraints

- El DOM del editor nunca se reestructura: el marco ENVUELVE al editor
  (A1, discovery §3; RULE-015). Ningún componente toca internals de Quill.
- px fraccionales sin redondeo en los style bindings (determinismo con 02;
  CSS los acepta). No hay redondeo en esta capa.
- Componentes tontos: la única lógica es presentation bindings; la
  geometría llega ya calculada (extensión de RULE-006).
- Zoneless: estado por signals (`input.required`, `computed`); sin
  `ngStyle`/`ngClass` — style bindings nativos (AGENTS.md "Angular Rules").
- Presupuesto de estilos por componente (warn 4 kB / error 8 kB,
  `angular.json`).
- Sin dependencias nuevas (RULE-017); sin `any` (RULE-018).
- RULE-020: el comportamiento del editor no cambia; los tests de 01 son el
  arnés de regresión.

## Risks

- **jsdom no computa layout:** los tests de dimensiones asertan style
  bindings inline (`el.style.width`), no `getBoundingClientRect`. La
  geometría esperada viene de 02 (pura, ya testeada), no se recalcula.
- **Regresión visual al mover `.ql-*`:** los overrides se reubican
  byte-idénticos a `styles.scss`; cualquier ajuste adicional está fuera de
  scope. Mitigación: verificación manual en navegador (paso 9).
- **ARIA vs atributos propios de Quill:** Quill 2 añade `contenteditable`
  al hijo `.ql-editor`; el patrón cerrado del repo (skill `quill-wrapper`
  §3) pone `role="textbox"`/`aria-label`/`aria-multiline` en el contenedor.
  Si la auditoría manual pide ajustes finos, se documentan para la spec 08;
  no se improvisan aquí.
- **Footer en modo continuo:** sin páginas reales (04), la banda de footer
  flota al final del contenido — comportamiento pre-paginación documentado
  en REQ-01; no "corregirlo" con lógica de paginación prematura (P-X).
- **Tamaño del diff:** esta spec toca editor + home + 2 componentes nuevos;
  mantener cada archivo enfocado en su REQ para que el diff sea auditable.

## Verification

`03-visual-pages` está completa cuando:

- REQ-01..REQ-05 implementados y REQ-06 respetado.
- La suite pasa: tests nuevos + los de 01/02 sin cambios de semántica.
- `npm run lint`, `npm test` y `npm run build` pasan.
- `tasks.md` refleja el estado real y `MEMORY.md` queda actualizado con las
  decisiones (bandas pre-paginación, reubicación de `.ql-*`, patrón ARIA,
  `ngAfterViewInit` conservado).
