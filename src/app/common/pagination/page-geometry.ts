import type { DocumentSettings, PageSettings, PageSize } from '../document/document-settings';

import { mmToPx } from './unit-converter';

/** Dimensiones físicas de una página, en mm. */
export interface PageDimensionsMm {
  readonly widthMm: number;
  readonly heightMm: number;
}

/**
 * Única fuente de dimensiones de página (constitution §10: evitar
 * definiciones duplicadas). Valores portrait: ISO 216 (A4) y tamaños US
 * Letter/Legal (8.5 × 11 in y 8.5 × 14 in).
 */
export const PAGE_DIMENSIONS_MM: Readonly<Record<PageSize, PageDimensionsMm>> = {
  A4: { widthMm: 210, heightMm: 297 },
  LETTER: { widthMm: 215.9, heightMm: 279.4 },
  LEGAL: { widthMm: 215.9, heightMm: 355.6 },
};

/** Dimensiones según tamaño y orientación; landscape intercambia width/height. */
export const pageDimensionsMm = (settings: PageSettings): PageDimensionsMm => {
  const portrait = PAGE_DIMENSIONS_MM[settings.size];
  return settings.orientation === 'landscape'
    ? { widthMm: portrait.heightMm, heightMm: portrait.widthMm }
    : portrait;
};

/**
 * Geometría completa de una página en px CSS. Insumo del seam de paginación
 * (`paginate(measuredBlocks, geometry)` — discovery §4) y de la vista (03).
 */
export interface PageGeometry {
  readonly pageWidthPx: number;
  readonly pageHeightPx: number;
  readonly marginTopPx: number;
  readonly marginRightPx: number;
  readonly marginBottomPx: number;
  readonly marginLeftPx: number;
  readonly headerHeightPx: number;
  readonly footerHeightPx: number;
  readonly contentXPx: number;
  readonly contentYPx: number;
  readonly contentWidthPx: number;
  readonly contentHeightPx: number;
}

/**
 * Geometría de la página según constitution §7.1, aplicada sobre los valores
 * ya convertidos a px. Asume settings estructuralmente válidos (spec 01);
 * para geometrías degeneradas devuelve áreas ≤ 0 — validar con
 * `isValidPageGeometry`. Sin redondeo (RULE-005): el redondeo de render es
 * de la vista (spec 03).
 */
export const computePageGeometry = (settings: DocumentSettings): PageGeometry => {
  const { page, margins, header, footer } = settings;
  const dimensions = pageDimensionsMm(page);

  const pageWidthPx = mmToPx(dimensions.widthMm);
  const pageHeightPx = mmToPx(dimensions.heightMm);
  const marginTopPx = mmToPx(margins.top);
  const marginRightPx = mmToPx(margins.right);
  const marginBottomPx = mmToPx(margins.bottom);
  const marginLeftPx = mmToPx(margins.left);
  const headerHeightPx = header.enabled ? mmToPx(header.height) : 0;
  const footerHeightPx = footer.enabled ? mmToPx(footer.height) : 0;

  return {
    pageWidthPx,
    pageHeightPx,
    marginTopPx,
    marginRightPx,
    marginBottomPx,
    marginLeftPx,
    headerHeightPx,
    footerHeightPx,
    contentXPx: marginLeftPx,
    contentYPx: marginTopPx + headerHeightPx,
    contentWidthPx: pageWidthPx - marginLeftPx - marginRightPx,
    contentHeightPx: pageHeightPx - marginTopPx - marginBottomPx - headerHeightPx - footerHeightPx,
  };
};

/**
 * Sanidad geométrica (REQ-04): cierra la pieza que `01-document-model` REQ-02
 * diferió a esta spec. Complementa al validador estructural de 01; no lo
 * reemplaza (RULE-019).
 *
 * El veredicto deriva del resultado de `computePageGeometry` (única ruta
 * aritmética): rechaza márgenes que exceden la página y áreas ≤ 0 en
 * cualquier eje. Las sumas de márgenes/bandas vs. dimensiones son la
 * justificación, no una fórmula paralela.
 */
export const isValidPageGeometry = (settings: DocumentSettings): boolean => {
  const geometry = computePageGeometry(settings);
  return geometry.contentWidthPx > 0 && geometry.contentHeightPx > 0;
};
