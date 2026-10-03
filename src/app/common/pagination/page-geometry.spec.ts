import { type DocumentSettings, DEFAULT_DOCUMENT_SETTINGS } from '../document/document-settings';

import { computePageGeometry, isValidPageGeometry, pageDimensionsMm } from './page-geometry';

/**
 * Conversión verificada de forma independiente en este archivo (no se importa
 * `mmToPx`): 96 px/in y 25.4 mm/in son física conocida, no la implementación
 * bajo test. Las expectativas en px usan `toBeCloseTo` (precisión ≥ 6)
 * porque restar-en-mm-convertir y convertir-ya-restar difieren en ulps.
 */
const toPx = (mm: number): number => (mm * 96) / 25.4;

describe('pageDimensionsMm', () => {
  it('A4 portrait: 210 × 297 mm (ISO 216)', () => {
    expect(pageDimensionsMm({ size: 'A4', orientation: 'portrait' })).toEqual({
      widthMm: 210,
      heightMm: 297,
    });
  });

  it('LETTER portrait: 215.9 × 279.4 mm (8.5 × 11 in)', () => {
    expect(pageDimensionsMm({ size: 'LETTER', orientation: 'portrait' })).toEqual({
      widthMm: 215.9,
      heightMm: 279.4,
    });
  });

  it('LEGAL portrait: 215.9 × 355.6 mm (8.5 × 14 in)', () => {
    expect(pageDimensionsMm({ size: 'LEGAL', orientation: 'portrait' })).toEqual({
      widthMm: 215.9,
      heightMm: 355.6,
    });
  });

  it('landscape intercambia width/height', () => {
    expect(pageDimensionsMm({ size: 'A4', orientation: 'landscape' })).toEqual({
      widthMm: 297,
      heightMm: 210,
    });
    expect(pageDimensionsMm({ size: 'LEGAL', orientation: 'landscape' })).toEqual({
      widthMm: 355.6,
      heightMm: 215.9,
    });
  });
});

describe('computePageGeometry', () => {
  it('aplica §7.1 con bandas deshabilitadas (aportan 0)', () => {
    const geometry = computePageGeometry(DEFAULT_DOCUMENT_SETTINGS);

    expect(geometry.pageWidthPx).toBeCloseTo(toPx(210), 6);
    expect(geometry.pageHeightPx).toBeCloseTo(toPx(297), 6);
    expect(geometry.headerHeightPx).toBe(0);
    expect(geometry.footerHeightPx).toBe(0);
    expect(geometry.contentXPx).toBeCloseTo(toPx(25), 6);
    expect(geometry.contentYPx).toBeCloseTo(toPx(25), 6);
    // §7.1 con defaults: alto = 297 − 25 − 25 = 247 mm; ancho = 210 − 25 − 25 = 160 mm
    expect(geometry.contentHeightPx).toBeCloseTo(toPx(247), 6);
    expect(geometry.contentWidthPx).toBeCloseTo(toPx(160), 6);
  });

  it('aplica §7.1 con bandas habilitadas', () => {
    const settings: DocumentSettings = {
      ...DEFAULT_DOCUMENT_SETTINGS,
      header: { enabled: true, height: 12 },
      footer: { enabled: true, height: 8 },
    };
    const geometry = computePageGeometry(settings);

    expect(geometry.headerHeightPx).toBeCloseTo(toPx(12), 6);
    expect(geometry.footerHeightPx).toBeCloseTo(toPx(8), 6);
    // origen del área: margen superior + banda de header = 25 + 12 = 37 mm
    expect(geometry.contentYPx).toBeCloseTo(toPx(37), 6);
    // §7.1: 297 − 25 − 25 − 12 − 8 = 227 mm
    expect(geometry.contentHeightPx).toBeCloseTo(toPx(227), 6);
    expect(geometry.contentWidthPx).toBeCloseTo(toPx(160), 6);
  });

  it('con márgenes cero el área de contenido es la página completa menos bandas', () => {
    const settings: DocumentSettings = {
      ...DEFAULT_DOCUMENT_SETTINGS,
      margins: { top: 0, right: 0, bottom: 0, left: 0, unit: 'mm' },
    };
    const geometry = computePageGeometry(settings);

    expect(geometry.contentXPx).toBe(0);
    expect(geometry.contentYPx).toBe(0);
    expect(geometry.contentWidthPx).toBeCloseTo(toPx(210), 6);
    expect(geometry.contentHeightPx).toBeCloseTo(toPx(297), 6);
  });

  it('usa dimensiones intercambiadas en landscape', () => {
    const settings: DocumentSettings = {
      ...DEFAULT_DOCUMENT_SETTINGS,
      page: { size: 'A4', orientation: 'landscape' },
    };
    const geometry = computePageGeometry(settings);

    expect(geometry.pageWidthPx).toBeCloseTo(toPx(297), 6);
    expect(geometry.pageHeightPx).toBeCloseTo(toPx(210), 6);
  });
});

describe('isValidPageGeometry', () => {
  it('acepta los defaults', () => {
    expect(isValidPageGeometry(DEFAULT_DOCUMENT_SETTINGS)).toBe(true);
  });

  it('rechaza márgenes horizontales que exceden la página', () => {
    const settings: DocumentSettings = {
      ...DEFAULT_DOCUMENT_SETTINGS,
      margins: { ...DEFAULT_DOCUMENT_SETTINGS.margins, left: 150, right: 150 },
    };
    // 150 + 150 = 300 ≥ 210 (ancho A4)
    expect(isValidPageGeometry(settings)).toBe(false);
  });

  it('rechaza cuando márgenes y bandas habilitadas agotan el alto', () => {
    const settings: DocumentSettings = {
      ...DEFAULT_DOCUMENT_SETTINGS,
      margins: { ...DEFAULT_DOCUMENT_SETTINGS.margins, top: 130, bottom: 130 },
      header: { enabled: true, height: 20 },
      footer: { enabled: true, height: 20 },
    };
    // 130 + 130 + 20 + 20 = 300 ≥ 297
    expect(isValidPageGeometry(settings)).toBe(false);
  });

  it('rechaza área de contenido ≤ 0 (márgenes que suman exactamente el ancho)', () => {
    const settings: DocumentSettings = {
      ...DEFAULT_DOCUMENT_SETTINGS,
      margins: { ...DEFAULT_DOCUMENT_SETTINGS.margins, left: 105, right: 105 },
    };
    // 105 + 105 = 210 = ancho A4 → contentWidth = 0
    expect(isValidPageGeometry(settings)).toBe(false);
  });
});
