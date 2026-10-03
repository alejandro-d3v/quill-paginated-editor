# Page Geometry — Plan

## Objective

Producir la capa de geometría física pura — conversión mm↔px, dimensiones de
página y área de contenido según constitution §7.1 — que consumirán la vista
(03) y el motor (04), sin tocar Angular, DOM ni `common/document/`.

## Deliverable

- `src/app/common/pagination/unit-converter.ts` — `MM_PER_INCH`,
  `CSS_PX_PER_INCH`, `mmToPx`, `pxToMm`.
- `src/app/common/pagination/unit-converter.spec.ts`
- `src/app/common/pagination/page-geometry.ts` — `PAGE_DIMENSIONS_MM`,
  `PageDimensionsMm`, `pageDimensionsMm`, `PageGeometry`,
  `computePageGeometry`, `isValidPageGeometry`.
- `src/app/common/pagination/page-geometry.spec.ts`

Sin modificar nada de `src/` fuera de `common/pagination/` (los únicos
imports externos son los tipos de `common/document/document-settings.ts`,
creado en la spec 01 — verificado: existe).

## Approach

1. Leer constitution §3.3–§3.4, §7.1, §13 (catálogo Page Geometry) y
   Principle VI; discovery §4 (seam) y §5 (carpetas).
2. Confirmar la dependencia de 01: `common/document/document-settings.ts`
   exporta `DocumentSettings`, `PageSettings`, `PageMargins`,
   `HeaderSettings`, `FooterSettings`, `DEFAULT_DOCUMENT_SETTINGS`.
3. Crear `unit-converter.ts` con las constantes del estándar CSS
   (96 px/in, 25.4 mm/in) y las dos funciones puras.
4. Crear `unit-converter.spec.ts` con valores físicos conocidos
   (independientes de la implementación) y roundtrip.
5. Crear `page-geometry.ts`: tabla única de dimensiones, swap de landscape,
   `PageGeometry`, `computePageGeometry` (§7.1 en px) e
   `isValidPageGeometry`.
6. Crear `page-geometry.spec.ts`: 3 tamaños × 2 orientaciones, §7.1 con y sin
   bandas habilitadas, origen del área, márgenes cero, casos degenerados.
7. Ejecutar `npm test`; después `npm run lint` y `npm run build`.
8. `npx prettier --write` sobre los archivos creados (no repo-wide).
9. Actualizar `tasks.md` y `MEMORY.md`; reportar.

## Design constraints

- Funciones puras, sin `@Injectable`, sin DOM y sin imports de Angular en
  `common/pagination/` (RULE-006): el motor de 04 consumirá esta geometría
  sin DI, como dato.
- Sin redondeo y sin excepciones: la geometría es total y determinista
  (RULE-005); los casos degenerados se validan aparte
  (`isValidPageGeometry`), no lanzando.
- Única fuente de dimensiones: `PAGE_DIMENSIONS_MM` (constitution §10,
  "avoid duplicated domain definitions").
- Sin dependencias nuevas (RULE-017); sin `any` (RULE-018).
- No modificar `common/document/` ni el wrapper del editor (RULE-019).

## Risks

- **Exactitud float:** las conversiones producen no-enteros (210 mm →
  793.70078…px). Mitigación: valores esperados calculados de forma
  independiente y `toBeCloseTo` con precisión ≥ 6; el orden de operaciones
  de §7.1 queda fijado en REQ-03 (resta sobre px ya convertidos) para que
  los tests no dependan de la implementación.
- **Confusión px CSS vs device px:** el estándar fijo 96 px/in elimina el
  factor dispositivo (RULE-005). El zoom/escala visual es asunto de la
  vista (03), no de la geometría; documentar en el código.
- **Tentación de medir o paginar aquí:** prohibido por REQ-06; el seam
  (discovery §4) mantiene `paginate(measuredBlocks, geometry)` puro con la
  geometría como dato de entrada.
- **Duplicar dimensiones o conversiones en otras capas:** todo pasa por
  `unit-converter` y `PAGE_DIMENSIONS_MM`; el diff review lo verifica.

## Verification

`02-page-geometry` está completa cuando:

- REQ-01..REQ-05 implementados y REQ-06 respetado.
- El catálogo Page Geometry de constitution §13 está cubierto por tests
  puros que pasan.
- `npm run lint`, `npm test` y `npm run build` pasan.
- `tasks.md` refleja el estado real y `MEMORY.md` queda actualizado
  (≤ 50 líneas) con las decisiones: estándar 96 px/in como definición CSS,
  validador geométrico separado del estructural de 01.
