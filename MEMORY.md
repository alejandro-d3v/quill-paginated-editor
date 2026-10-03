# MEMORY.md — quill-paginated-editor

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte. Las reglas permanentes viven en `AGENTS.md`, no aquí.

## Estado actual

- **01-document-model COMPLETA** (2026-10-03): tipos + defaults + validación en `common/document/`; wrapper migrado a `common/editor/` (git mv, 4 renames) con `deltaChange: output<Delta>()` en cada `text-change` y `ngOnDestroy` real (desconecta listener, suelta referencia).
- Suite verde: 13 tests / 4 archivos (7 document-settings, 4 editor con stub de Quill, 1 home con Quill real, 1 app). Lint 0/0, build 221.4 kB initial.
- `AGENTS.md` sincronizado tras la migración (§1 estado, §3 árbol, §4 path del wrapper).
- Warning de build preexistente: `quill-delta` CommonJS (mitigación futura `allowedCommonJsDependencies`, requiere aprobación).
- Sin geometría, paginación, medición ni PDF: eso es 02+.

## Decisiones (00-discovery en `docs/discovery.md` §3–§7; 01 aquí)

- **01 — `import type { Delta } from 'quill'`** (no `quill-delta`): quill 2.0.3 re-exporta el tipo desde su core y coincide con `getContents()`; `quill-delta` es dependencia transitiva (importarlo exigiría tocar `package.json`).
- **01 — `isValidDocumentSettings(settings: unknown): boolean`**: los valores inválidos solo existen fuera del sistema de tipos (futuras UI/deserialización); con param `unknown` los tests negativos no necesitan casts ni `any`. Validación estructural only; la geométrica pertenece a 02.
- **01 — Defaults**: A4 portrait, márgenes 25 mm, header/footer `enabled: false` con `height: 10` mm (REQ-02 de la spec).
- **01 — Stub de Quill en `editor.spec.ts`** (`vi.hoisted` + `vi.mock('quill')`): jsdom no cubre las APIs de selección; el Quill real queda cubierto por `home.spec.ts`.

## Aprendizajes y errores a evitar

- `simple-import-sort` también ordena especificadores nombrados: correr `npm run lint:fix` tras crear archivos; lint falla si no.
- `vi.hoisted` + `vi.mock` funciona en el unit-test builder (@angular/build + vitest 4) sin tocar la implementación.
- Alias `@common` sigue sin resolver: imports relativos.
- Skills aún citan `common/components/editor` y numeración desfasada de AGENTS.md: corregir solo con aprobación (listado en discovery §8).

## Próximos pasos

- Implementar **02-page-geometry** (siguiente spec; una a la vez): UnitConverter (mm↔px @96dpi) + PageGeometry; extender la validación con sanidad geométrica (márgenes vs. dimensiones de página).

## Pendientes / dudas abiertas

- PDF (09) · tablas 06b · virtualización de páginas (10) · widows/orphans (05) · render de header/footer: tokens vs Delta (08).
- Corregir referencias cruzadas de skills y ubicar/eliminar `temp/pagination-spec/` — requieren aprobación del usuario.
