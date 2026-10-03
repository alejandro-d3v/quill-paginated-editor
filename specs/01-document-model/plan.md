# Document Model — Plan

## Objective

Establecer el vocabulario del dominio del documento y conectar el wrapper
de Quill con la aplicación, sin implementar paginación ni geometría.

## Deliverable

- Tipos bajo `src/app/common/document/`:
  - `document-settings.ts` — `DocumentSettings`, `PageSettings`,
    `PageMargins`, `HeaderSettings`, `FooterSettings`,
    `DEFAULT_DOCUMENT_SETTINGS`, `isValidDocumentSettings`.
  - `document-model.ts` — `DocumentModel`.
  - `document-settings.spec.ts` — tests de defaults y validación.
- Wrapper migrado a `src/app/common/editor/`.
- `EditorComponent` con `deltaChange: output<Delta>()`.
- `editor.spec.ts` actualizado con test de emisión de `deltaChange`.
- Imports de `home/` actualizados.

## Approach

1. Leer `docs/discovery.md` §4 (seam de medición) y §5 (estructura de
   carpetas), y `constitution.md` §3 (tipos del dominio).
2. Confirmar el import correcto de `Delta` para Quill 2.0.3. Camino 
   preferido: `import type { Delta } from 'quill'` (Quill 2.0.3 re-exporta 
   `Delta` desde `core.d.ts` y coincide con `getContents()`). Importar de 
   `quill-delta` requeriría declararlo en `package.json` 
   (hoy transitivo) — fuera de scope.
3. Crear `common/document/` con los tipos y defaults.
4. Crear el spec de `document-settings` con los tests puros.
5. Mover los cuatro archivos del wrapper a `common/editor/`.
6. Añadir el `output<Delta>()` y la suscripción a `text-change` en el
   wrapper.
7. Limpiar `ngOnDestroy`.
8. Actualizar los imports en `home/`.
9. Añadir el test de emisión de `deltaChange` en `editor.spec.ts` (con
   stub de Quill si es necesario).
10. Ejecutar `npm run lint`, `npm test`, `npm run build`.

## Design constraints

- No introducir `any`.
- No introducir dependencias.
- No refactorizar el wrapper más allá de lo pedido (REQ-07).
- No tocar configuración (`eslint`, `tsconfig`, `angular.json`,
  `package.json`).
- `DEFAULT_DOCUMENT_SETTINGS` inmutable (`as const` o `Readonly<>`).
- `PageMargins.unit` fijo a `'mm'` (RULE-009).

## Risks

- **Import de Delta:** camino preferido `import type { Delta } from 'quill'`. 
  Evita declarar `quill-delta` como dependencia directa y no toca `package.json`. 
  Documentar la elección en `MEMORY.md`..
- **Test del wrapper en jsdom:** jsdom no implementa todas las APIs de
  selección que Quill necesita. La skill `quill-wrapper` sugiere stubear
  Quill en los tests del wrapper. Si no es viable sin tocar la
  implementación, documentar la limitación y verificar la emisión con un
  mock de `quill.on`.
- **Churn de imports:** el move del wrapper afecta a `home.ts`. Buscar
  todas las referencias con `grep` antes de mover.

## Verification

`01-document-model` está completa cuando:

- REQ-01..REQ-06 implementados.
- REQ-07 respetado (nada de paginación, geometría ni refactor amplio).
- `npm run lint`, `npm test` y `npm run build` pasan.
- `tasks.md` refleja el estado real.
- `MEMORY.md` actualizado con: estado de la spec, decisiones tomadas
  (import de Delta elegido, nombre de la clase mantenido).