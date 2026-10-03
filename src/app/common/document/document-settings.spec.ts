import { DEFAULT_DOCUMENT_SETTINGS, isValidDocumentSettings } from './document-settings';

describe('DEFAULT_DOCUMENT_SETTINGS', () => {
  it('pasa la validación', () => {
    expect(isValidDocumentSettings(DEFAULT_DOCUMENT_SETTINGS)).toBe(true);
  });
});

describe('isValidDocumentSettings', () => {
  it('rechaza un tamaño de página fuera del union literal', () => {
    const invalid = {
      ...DEFAULT_DOCUMENT_SETTINGS,
      page: { size: 'A9', orientation: 'portrait' },
    };
    expect(isValidDocumentSettings(invalid)).toBe(false);
  });

  it('rechaza una orientación fuera del union literal', () => {
    const invalid = {
      ...DEFAULT_DOCUMENT_SETTINGS,
      page: { size: 'A4', orientation: 'diagonal' },
    };
    expect(isValidDocumentSettings(invalid)).toBe(false);
  });

  it('rechaza márgenes negativos', () => {
    const invalid = {
      ...DEFAULT_DOCUMENT_SETTINGS,
      margins: { ...DEFAULT_DOCUMENT_SETTINGS.margins, top: -1 },
    };
    expect(isValidDocumentSettings(invalid)).toBe(false);
  });

  it('rechaza márgenes no finitos (NaN)', () => {
    const invalid = {
      ...DEFAULT_DOCUMENT_SETTINGS,
      margins: { ...DEFAULT_DOCUMENT_SETTINGS.margins, left: Number.NaN },
    };
    expect(isValidDocumentSettings(invalid)).toBe(false);
  });

  it('rechaza una altura de header negativa', () => {
    const invalid = {
      ...DEFAULT_DOCUMENT_SETTINGS,
      header: { ...DEFAULT_DOCUMENT_SETTINGS.header, height: -5 },
    };
    expect(isValidDocumentSettings(invalid)).toBe(false);
  });

  it('rechaza entradas que no son objeto', () => {
    expect(isValidDocumentSettings(null)).toBe(false);
    expect(isValidDocumentSettings('A4')).toBe(false);
    expect(isValidDocumentSettings({})).toBe(false);
  });
});
