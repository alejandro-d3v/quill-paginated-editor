# Page Geometry

## Status

Active implementation specification.

## Authority

This specification is subordinate to `docs/constitution.md`.
The constitution is authoritative if there is a conflict.

## Purpose

Definir la geometría física de las páginas como funciones puras: conversión
centralizada mm↔px, dimensiones de A4/Letter/Legal en portrait y landscape, y
cálculo del área de contenido según la fórmula de constitution §7.1.

Esta spec NO mide contenido (spec 04), NO pagina (specs 04/05) y NO
renderiza páginas (spec 03). Solo produce, a partir de `DocumentSettings`
(spec 01), los números deterministas que 03 (vista) y 04 (motor) consumirán.

## Scope

- Conversión centralizada de unidades mm↔px (abstracción `UnitConverter`
  conceptual de Principle VI).
- Tabla única de dimensiones físicas de A4, Letter y Legal, con
  portrait/landscape.
- `PageGeometry` en px CSS: página, márgenes, bandas de header/footer y área
  de contenido (fórmula de constitution §7.1).
- Sanidad geométrica de settings — asignada a esta spec por
  `01-document-model` REQ-02: márgenes que exceden la página, área útil ≤ 0.
- Tests puros que cubren el catálogo "Page Geometry" de constitution §13.

## Architectural constraints

Heredados de la constitución. Se preservan explícitamente:

- Unidades físicas explícitas y conversión centralizada en una única
  abstracción (Principle VI, RULE-009).
- Determinismo: mismas settings producen la misma geometría (RULE-005).
- Testable sin Angular ni DOM: funciones puras, sin inyección de
  dependencias (RULE-006); el motor de 04 y la vista de 03 la consumen por
  import directo.
- Sin `any` (RULE-018); TypeScript estricto.
- Sin dependencias nuevas (RULE-017): solo se importan los tipos de
  `common/document/` (spec 01).
- No se reescribe el validador estructural de 01 (RULE-019): la sanidad
  geométrica es una función nueva y separada.
- La geometría es un insumo del seam de medición/paginación
  (`paginate(measuredBlocks, geometry)`, discovery §4); esta spec no
  implementa ningún cálculo de paginación (RULE-012 por extensión).

## Requirements

### REQ-01 — Conversión de unidades centralizada

Bajo `src/app/common/pagination/unit-converter.ts` MUST existir:

- Constantes exportadas: `MM_PER_INCH = 25.4` y `CSS_PX_PER_INCH = 96`.
- `mmToPx(mm: number): number` — `mm * CSS_PX_PER_INCH / MM_PER_INCH`.
- `pxToMm(px: number): number` — la inversa exacta.

Estándar (definición, no decisión de proyecto): el px CSS se define como
1/96 de pulgada (CSS Values and Units Module) y la pulgada internacional es
exactamente 25.4 mm. Esta definición fija hace la conversión determinista
(RULE-005) y verificable contra valores físicos conocidos. Funciones puras y
totales: sin redondeo, sin excepciones, sin estado. El redondeo para render
pertenece a la vista (spec 03).

### REQ-02 — Dimensiones físicas de página

Bajo `src/app/common/pagination/page-geometry.ts` MUST existir:

- `PAGE_DIMENSIONS_MM` como única fuente de dimensiones (valores portrait,
  en mm):
  - A4: `210 × 297` (ISO 216)
  - LETTER: `215.9 × 279.4` (8.5 × 11 in, tamaño US)
  - LEGAL: `215.9 × 355.6` (8.5 × 14 in, tamaño US)
- Interfaz `PageDimensionsMm` — `{ readonly widthMm: number; readonly heightMm: number }`.
- `pageDimensionsMm(settings: PageSettings): PageDimensionsMm` — con
  `orientation: 'landscape'`, width y height se intercambian respecto a
  portrait.

Verificable contra ISO 216 (A4) y los tamaños US Letter/Legal (ANSI/ASME).

### REQ-03 — `PageGeometry` y cálculo del área de contenido

En `page-geometry.ts`, `computePageGeometry(settings: DocumentSettings): PageGeometry`
MUST calcular, todo en px CSS a partir de REQ-01/REQ-02:

- `pageWidthPx`, `pageHeightPx` — dimensiones de REQ-02 convertidas.
- `marginTopPx`, `marginRightPx`, `marginBottomPx`, `marginLeftPx`.
- `headerHeightPx`, `footerHeightPx` — la altura configurada convertida si
  `enabled`; `0` si no.
- Origen del área de contenido (necesario para el overlay de 03,
  constitution §8): `contentXPx = marginLeftPx`,
  `contentYPx = marginTopPx + headerHeightPx`.
- Área disponible según constitution §7.1, aplicada sobre los valores ya
  convertidos a px:
  - `contentHeightPx = pageHeightPx − marginTopPx − marginBottomPx − headerHeightPx − footerHeightPx`
  - `contentWidthPx = pageWidthPx − marginLeftPx − marginRightPx`

Sin redondeo. La función asume settings estructuralmente válidos (spec 01);
para geometrías degeneradas devuelve valores ≤ 0 — la puerta de entrada es
REQ-04. El ancho disponible no está en la fórmula literal de §7.1 (que solo
define la altura); se define aquí por analogía exacta con la misma.

### REQ-04 — Sanidad geométrica

En `page-geometry.ts`, `isValidPageGeometry(settings: DocumentSettings): boolean`
MUST devolver `false` cuando:

- `marginLeft + marginRight ≥ pageWidth` (en las unidades de los settings), o
- `marginTop + marginBottom + headerHeight + footerHeight ≥ pageHeight`
  (las alturas de bandas cuentan solo si `enabled`), o
- el área de contenido resultante es ≤ 0 en cualquier eje.

Debe devolver `true` para `DEFAULT_DOCUMENT_SETTINGS`. Es la pieza que
`01-document-model` REQ-02 diferió explícitamente a esta spec. No reemplaza
al validador estructural de 01: lo complementa.

### REQ-05 — Tests del catálogo §13 (Page Geometry)

Colocados junto al código, puros (vitest globals, sin TestBed), según
constitution §13:

- `unit-converter.spec.ts`:
  - `mmToPx(25.4) ≈ 96` y `pxToMm(96) ≈ 25.4` (`toBeCloseTo`, precisión ≥ 6),
  - valores físicos conocidos: `mmToPx(215.9) ≈ 816`,
    `mmToPx(279.4) ≈ 1056` (Letter = 8.5 × 11 in),
  - roundtrip `pxToMm(mmToPx(x)) ≈ x`,
  - `mmToPx(0) === 0`.
- `page-geometry.spec.ts`:
  - dimensiones exactas de los 3 tamaños en portrait y landscape
    (`toBe` sobre los mm de la tabla),
  - §7.1 con header/footer deshabilitados (aportan 0) y habilitados,
  - origen del área de contenido (`marginLeft`; `marginTop + headerHeight`),
  - márgenes cero → el área de contenido es la página completa menos bandas,
  - `isValidPageGeometry`: defaults → `true`; márgenes que exceden la
    página → `false`; área ≤ 0 → `false`.

Los valores esperados se calculan de forma independiente (física conocida,
aritmética mm por separado), no re-ejecutando la función bajo test.

### REQ-06 — NO avanzar a specs posteriores

Esta spec MUST NOT:

- Medir contenido ni crear `MeasurementService` (spec 04).
- Implementar `paginate`, `LayoutDocument` o splitting (specs 04/05).
- Renderizar páginas, overlay, componentes o estilos de página (spec 03).
- Crear UI de configuración de settings.
- Modificar `common/document/` ni el wrapper del editor (spec 01) salvo
  importar tipos.
- Introducir dependencias o tocar `package.json`.

## Acceptance criteria

- Existen `unit-converter.ts` y `page-geometry.ts` bajo
  `src/app/common/pagination/` con las firmas de REQ-01..REQ-04.
- `unit-converter.spec.ts` y `page-geometry.spec.ts` pasan y cubren el
  catálogo "Page Geometry" completo de constitution §13: A4, Letter, Legal,
  portrait, landscape, márgenes y unit conversion.
- Las conversiones se verifican contra valores físicos conocidos
  (25.4 mm ↔ 96 px; Letter = 816 × 1056 px) con tolerancia < 1e-6.
- `computePageGeometry` implementa §7.1 exactamente; las bandas de
  header/footer deshabilitadas aportan 0.
- `isValidPageGeometry(DEFAULT_DOCUMENT_SETTINGS)` es `true`, y rechaza
  márgenes que exceden la página y áreas ≤ 0 — verificado por tests.
- `npm run lint`, `npm test` y `npm run build` pasan.
- No se introdujo medición, paginación, render, UI ni dependencias.
- No se tocó `common/document/`, `eslint.config.mjs`, `tsconfig*.json`,
  `angular.json` ni `package.json`.
- Determinismo verificable por re-ejecución de la suite: mismas entradas →
  mismos resultados (aritmética IEEE-754, sin redondeos dependientes del
  entorno).

## Out of scope

- Medición de contenido y `MeasurementService` (spec 04).
- Motor de paginación, `paginate`, `LayoutDocument` (spec 04).
- Vista de páginas: overlay, ARIA, estilos y redondeo de render (spec 03).
- Contenido de header/footer y numeración de páginas (spec 08).
- Modificar el validador estructural de 01 (RULE-019).
- Cualquier cosa relacionada con PDF (spec 09).
- Introducción de dependencias nuevas.
- Trabajo no relacionado con la geometría; optimización prematura
  (constitution §11: medir antes de optimizar).
