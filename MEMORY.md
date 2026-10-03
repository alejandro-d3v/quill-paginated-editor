# MEMORY.md — quill-paginated-editor

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte. Las reglas permanentes viven en `AGENTS.md`, no aquí.

## Estado actual

- **02-page-geometry COMPLETA** (2026-10-03): `common/pagination/` con `unit-converter` (mm↔px) y `page-geometry` (dimensiones, §7.1, sanidad geométrica). Funciones puras, sin Angular/DOM (RULE-006).
- Suite verde: 31 tests / 6 archivos (18 de geometría). Lint 0/0; build 221.4 kB initial (sin cambios: la app aún no consume la geometría — lo harán 03/04).
- `AGENTS.md` sincronizado (§1 estado, §3 árbol) tras añadir `common/pagination/`.
- Warning de build preexistente: `quill-delta` CommonJS (mitigación futura `allowedCommonJsDependencies`, requiere aprobación).
- Pendiente de 03: overlay visual; de 04: medición + motor.

## Decisiones (00-discovery en `docs/discovery.md`; 01–02 aquí)

- **02 — estándar CSS fijo**: px CSS = 1/96 in; 1 in = 25.4 mm → conversión determinista (RULE-005). El redondeo de render es de 03.
- **02 — validador geométrico de una sola ruta**: `isValidPageGeometry` deriva de `computePageGeometry` (`contentWidthPx > 0 && contentHeightPx > 0`); las sumas de §7.1 son justificación, no fórmula paralela. Complementa al estructural de 01 (pipeline: structural → geométrico).
- **02 — tests con física independiente**: `toPx` local en el spec (96/25.4 inline, sin importar `mmToPx`) y dimensiones ISO/US hardcodeadas — evita tautología y el trap de ulps (`toBeCloseTo ≥ 6` para todo px).
- **01** — `import type { Delta } from 'quill'`; validador estructural sobre `unknown`; wrapper en `common/editor/` con `deltaChange: output<Delta>()`.

## Aprendizajes y errores a evitar

- En tests de lógica matemática: escribir la fórmula esperada inline en el spec (verificación independiente), nunca importar la función bajo test.
- Restar-en-mm-convertir ≠ convertir-ya-restar en float: siempre `toBeCloseTo` (≥6) para px; `toBe` solo con literales idénticos (mm de la tabla).
- `simple-import-sort` ordena especificadores nombrados: correr `npm run lint:fix` tras crear archivos.
- Alias `@common` sigue sin resolver: imports relativos.
- Skills aún citan rutas/numeración desfasadas: corregir solo con aprobación (discovery §8).

## Próximos pasos

- **Redactar `03-visual-pages`** (siguiente spec; hoy es plantilla → necesita `/spec-write` antes de `/feature`). Consume: `deltaChange` (01) + `computePageGeometry` (02); hace el overlay A1 y el refactor de convenciones del wrapper (OnPush, ARIA, `::ng-deep`).

## Pendientes / dudas abiertas

- PDF (09) · tablas 06b · virtualización (10) · widows/orphans (05) · render de header/footer: tokens vs Delta (08).
- Corregir referencias cruzadas de skills y ubicar/eliminar `temp/pagination-spec/` — requieren aprobación del usuario.
