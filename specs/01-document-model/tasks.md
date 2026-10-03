# Document Model — Tasks

## Preparation

- [x] Leer `docs/constitution.md` §3, §5 (RULE-001..RULE-020).
- [x] Leer `docs/discovery.md` §4, §5, §10.
- [x] Leer `spec.md` y `plan.md` de esta spec.
- [x] Leer `AGENTS.md` §6, §7, §12, §16.
- [x] Leer `MEMORY.md`.
- [x] Leer la skill `.agents/skills/quill-wrapper/SKILL.md`.
- [x] Confirmar línea base verde (`lint`, `test`, `build`) antes de
      empezar. → PASS / PASS (3 tests) / PASS (ejecutados 2026-10-03, antes
      de tocar nada).
- [x] Localizar todas las referencias a `common/components/editor` en el
      repositorio. → código: solo `home/pages/home/home.ts`; el resto son
      menciones en docs/specs/skills (históricas o a sincronizar).

## Modelo de documento (REQ-01, REQ-02)

- [x] Confirmar el import correcto de `Delta` para Quill 2.0.3 y
      documentar la elección en `MEMORY.md`.
      → `import type { Delta } from 'quill'` (re-export verificado en los
      typings 2.0.3; coincide con `getContents()`); `quill-delta` es
      transitivo → evitado.
- [x] Crear `src/app/common/document/document-settings.ts` con: - `PageSettings`, `PageMargins`, `HeaderSettings`, `FooterSettings`,
      `DocumentSettings`. - `DEFAULT_DOCUMENT_SETTINGS` (A4, portrait, márgenes razonables,
      header/footer deshabilitados). - `isValidDocumentSettings()`.
      → validador `(settings: unknown): boolean`, estructural only (REQ-02:
      sanidad geométrica es de 02).
- [x] Crear `src/app/common/document/document-model.ts` con
      `DocumentModel`.
- [x] Crear `src/app/common/document/document-settings.spec.ts` con: - test: defaults pasan la validación, - test: size inválido rechazado, - test: orientation inválida rechazada, - test: margen negativo rechazado, - test: altura de header/footer negativa rechazada.
      → 7 tests (se añadieron márgenes no finitos y entradas no-objeto, ambos
      dentro del reject-list de REQ-02). Sin casts: el validador acepta
      `unknown`.

## Migración del wrapper (REQ-03)

- [x] Mover `src/app/common/components/editor/editor.ts` →
      `src/app/common/editor/editor.ts`.
- [x] Mover `editor.html`, `editor.scss`, `editor.spec.ts` con el mismo
      cambio. → `git mv` del directorio (4 renames R).
- [x] Eliminar el directorio `src/app/common/components/editor/` si queda
      vacío. → eliminado también el padre `common/components/` vacío.
- [x] Actualizar imports en `src/app/home/pages/home/home.ts`.
- [x] Verificar que no queden referencias rotas
      (`grep -r "common/components/editor" src/` sin resultados).
- [x] Mantener el nombre de clase `EditorComponent` y selector
      `app-editor` (no renombrar).

## Exposición del Delta (REQ-04)

- [x] Añadir a `EditorComponent`:
      `readonly deltaChange = output<Delta>();`
- [x] Tras instanciar Quill, suscribirse a `text-change` y emitir
      `this.quill.getContents()` por `deltaChange`.
      → registrado dentro de `initializeEditor`, tras `new Quill`.
- [x] Verificar que el `output` es `readonly` y usa la API moderna
      (`output()`, no `@Output()`).

## Limpieza (REQ-05)

- [x] Eliminar de `ngOnDestroy` la línea
      `this.quill = undefined as unknown as Quill`.
- [x] Desconectar la suscripción a `text-change` antes de soltar Quill.
      → `this.quill?.off('text-change', this.handleTextChange); this.quill = null;`

## Tests (REQ-06)

- [x] Añadir test en `editor.spec.ts`: `deltaChange` emite al menos una
      vez tras un cambio de contenido. Usar stub/mock de Quill si jsdom
      no puede instanciarlo limpiamente.
      → stub vía `vi.hoisted` + `vi.mock('quill')`; 4 tests (creación,
      registro de listener, emisión, desconexión en destroy).
- [x] Confirmar que todos los specs compilan bajo `strict` y sin `any`.
      → vía compilación de `npm test` + `npm run lint` (REQ-06 lo define
      como verificación de compilación, no test unitario).
- [x] Ejecutar `npm test`. → PASS: 13 tests / 4 archivos.

## Integration

- [x] Confirmar que el Delta no se muta en ningún punto (RULE-003).
      → el handler emite `getContents()` (Delta nuevo por lectura); nada
      escribe sobre el Delta.
- [x] Confirmar que no se modifica el core de Quill (RULE-001).
- [x] Confirmar que `home` sigue renderizando el editor sin regresiones.
      → `home.spec.ts` PASS (monta el editor con Quill real).
- [x] Confirmar que no se introdujo paginación, geometría ni medición
      (REQ-07). → diff revisado: `standalone: true`, `imports: []`,
      `@ViewChild`, `::ng-deep` y ausencia de ARIA intactos.

## Review

- [x] `npm run lint` → PASS (tras `lint:fix` de orden de imports en
      `editor.ts`).
- [x] `npm test` → PASS (13/13).
- [x] `npm run build` → PASS (initial 221.41 kB / 57.92 kB transfer;
      warning preexistente `quill-delta` CommonJS).
- [x] `tasks.md` refleja el estado real. (esta actualización)
- [x] `MEMORY.md` actualizado (≤ 50 líneas).
- [x] No se tocó `eslint.config.mjs`, `tsconfig*.json`, `angular.json`,
      `package.json`.
- [x] Reportar archivos modificados, comandos ejecutados y resultado.
- [x] NO iniciar `02-page-geometry`.
- [x] Formatear los archivos creados/movidos con `npx prettier --write` sobre
      las rutas afectadas (no ejecutar `format:check` repo-wide: ya falla por
      archivos preexistentes fuera de scope).
      → ejecutado sobre los 8 archivos tocados; `--check` PASS en todos.
