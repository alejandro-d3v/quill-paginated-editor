import type { Delta } from 'quill';

/**
 * Vocabulario de settings del documento (constitution §3.2–§3.5).
 * Todas las dimensiones físicas están en milímetros (RULE-009, §3.4).
 */

export type PageSize = 'A4' | 'LETTER' | 'LEGAL';
export type PageOrientation = 'portrait' | 'landscape';

export interface PageSettings {
  readonly size: PageSize;
  readonly orientation: PageOrientation;
}

export interface PageMargins {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
  readonly unit: 'mm';
}

/** Banda de header; `height` en mm. `content` lo renderiza la capa de layout (spec 08). */
export interface HeaderSettings {
  readonly enabled: boolean;
  readonly height: number;
  readonly content?: Delta;
}

/** Banda de footer; `height` en mm. `content` lo renderiza la capa de layout (spec 08). */
export interface FooterSettings {
  readonly enabled: boolean;
  readonly height: number;
  readonly content?: Delta;
}

export interface DocumentSettings {
  readonly page: PageSettings;
  readonly margins: PageMargins;
  readonly header: HeaderSettings;
  readonly footer: FooterSettings;
}

/**
 * Defaults válidos (REQ-02): A4 portrait, márgenes de 25 mm,
 * header/footer deshabilitados con altura de 10 mm.
 */
export const DEFAULT_DOCUMENT_SETTINGS: DocumentSettings = {
  page: { size: 'A4', orientation: 'portrait' },
  margins: { top: 25, right: 25, bottom: 25, left: 25, unit: 'mm' },
  header: { enabled: false, height: 10 },
  footer: { enabled: false, height: 10 },
};

const PAGE_SIZES: ReadonlySet<string> = new Set(['A4', 'LETTER', 'LEGAL']);
const PAGE_ORIENTATIONS: ReadonlySet<string> = new Set(['portrait', 'landscape']);

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNonNegativeFinite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

/**
 * Validación estructural de `DocumentSettings` (REQ-02): literales, signos y
 * finitud. Acepta `unknown` porque los valores inválidos solo existen fuera
 * del sistema de tipos (datos deserializados, futura UI de configuración).
 *
 * La sanidad geométrica (márgenes vs. dimensiones de página, área útil ≤ 0)
 * pertenece a `02-page-geometry` y NO se valida aquí.
 */
export const isValidDocumentSettings = (settings: unknown): boolean => {
  if (!isObject(settings)) {
    return false;
  }

  const { page, margins, header, footer } = settings;
  if (!isObject(page) || !isObject(margins) || !isObject(header) || !isObject(footer)) {
    return false;
  }

  const { size, orientation } = page;
  if (typeof size !== 'string' || !PAGE_SIZES.has(size)) {
    return false;
  }
  if (typeof orientation !== 'string' || !PAGE_ORIENTATIONS.has(orientation)) {
    return false;
  }

  const { top, right, bottom, left, unit } = margins;
  if (
    !isNonNegativeFinite(top) ||
    !isNonNegativeFinite(right) ||
    !isNonNegativeFinite(bottom) ||
    !isNonNegativeFinite(left) ||
    unit !== 'mm'
  ) {
    return false;
  }

  const { enabled: headerEnabled, height: headerHeight } = header;
  const { enabled: footerEnabled, height: footerHeight } = footer;
  if (
    typeof headerEnabled !== 'boolean' ||
    !isNonNegativeFinite(headerHeight) ||
    typeof footerEnabled !== 'boolean' ||
    !isNonNegativeFinite(footerHeight)
  ) {
    return false;
  }

  return true;
};
