# Document Model — Tasks

## Preparation

- [ ] Leer `docs/constitution.md` §3, §5 (RULE-001..RULE-020).
- [ ] Leer `docs/discovery.md` §4, §5, §10.
- [ ] Leer `spec.md` y `plan.md` de esta spec.
- [ ] Leer `AGENTS.md` §6, §7, §12, §16.
- [ ] Leer `MEMORY.md`.
- [ ] Leer la skill `.agents/skills/quill-wrapper/SKILL.md`.
- [ ] Confirmar línea base verde (`lint`, `test`, `build`) antes de
      empezar.
- [ ] Localizar todas las referencias a `common/components/editor` en el
      repositorio.

## Modelo de documento (REQ-01, REQ-02)

- [ ] Confirmar el import correcto de `Delta` para Quill 2.0.3 y
      documentar la elección en `MEMORY.md`.
- [ ] Crear `src/app/common/document/document-settings.ts` con:
      - `PageSettings`, `PageMargins`, `HeaderSettings`, `FooterSettings`,
        `DocumentSettings`.
      - `DEFAULT_DOCUMENT_SETTINGS` (A4, portrait, márgenes razonables,
        header/footer deshabilitados).
      - `isValidDocumentSettings()`.
- [ ] Crear `src/app/common/document/document-model.ts` con
      `DocumentModel`.
- [ ] Crear `src/app/common/document/document-settings.spec.ts` con:
      - test: defaults pasan la validación,
      - test: size inválido rechazado,
      - test: orientation inválida rechazada,
      - test: margen negativo rechazado,
      - test: altura de header/footer negativa rechazada.

## Migración del wrapper (REQ-03)

- [ ] Mover `src/app/common/components/editor/editor.ts` →
      `src/app/common/editor/editor.ts`.
- [ ] Mover `editor.html`, `editor.scss`, `editor.spec.ts` con el mismo
      cambio.
- [ ] Eliminar el directorio `src/app/common/components/editor/` si queda
      vacío.
- [ ] Actualizar imports en `src/app/home/pages/home/home.ts`.
- [ ] Verificar que no queden referencias rotas
      (`grep -r "common/components/editor" src/` sin resultados).
- [ ] Mantener el nombre de clase `EditorComponent` y selector
      `app-editor` (no renombrar).

## Exposición del Delta (REQ-04)

- [ ] Añadir a `EditorComponent`:
      `readonly deltaChange = output<Delta>();`
- [ ] Tras instanciar Quill, suscribirse a `text-change` y emitir
      `this.quill.getContents()` por `deltaChange`.
- [ ] Verificar que el `output` es `readonly` y usa la API moderna
      (`output()`, no `@Output()`).

## Limpieza (REQ-05)

- [ ] Eliminar de `ngOnDestroy` la línea
      `this.quill = undefined as unknown as Quill`.
- [ ] Desconectar la suscripción a `text-change` antes de soltar Quill.

## Tests (REQ-06)

- [ ] Añadir test en `editor.spec.ts`: `deltaChange` emite al menos una
      vez tras un cambio de contenido. Usar stub/mock de Quill si jsdom
      no puede instanciarlo limpiamente.
- [ ] Confirmar que todos los specs compilan bajo `strict` y sin `any`.
- [ ] Ejecutar `npm test`.

Nota: los tests negativos de REQ-02 requieren casts deliberados (`'A9' as never`, `as unknown as DocumentSettings`). Nunca `any` (RULE-018 aplica aunque ESLint excluya `*.spec.ts`).

## Integration

- [ ] Confirmar que el Delta no se muta en ningún punto (RULE-003).
- [ ] Confirmar que no se modifica el core de Quill (RULE-001).
- [ ] Confirmar que `home` sigue renderizando el editor sin regresiones.
- [ ] Confirmar que no se introdujo paginación, geometría ni medición
      (REQ-07).

## Review

- [ ] `npm run lint` → PASS.
- [ ] `npm test` → PASS.
- [ ] `npm run build` → PASS.
- [ ] `tasks.md` refleja el estado real.
- [ ] `MEMORY.md` actualizado (≤ 50 líneas).
- [ ] No se tocó `eslint.config.mjs`, `tsconfig*.json`, `angular.json`,
      `package.json`.
- [ ] Reportar archivos modificados, comandos ejecutados y resultado.
- [ ] NO iniciar `02-page-geometry`.
- [ ] Formatear los archivos creados/movidos con `npx prettier --write` sobre 
      las rutas afectadas (no ejecutar `format:check` repo-wide: ya falla por 
      archivos preexistentes fuera de scope).