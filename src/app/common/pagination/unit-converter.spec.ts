import { CSS_PX_PER_INCH, MM_PER_INCH, mmToPx, pxToMm } from './unit-converter';

describe('constantes del estándar CSS', () => {
  it('fija la pulgada en 25.4 mm y el px CSS en 96 por pulgada', () => {
    expect(MM_PER_INCH).toBe(25.4);
    expect(CSS_PX_PER_INCH).toBe(96);
  });
});

describe('mmToPx', () => {
  it('convierte una pulgada exacta: 25.4 mm ≈ 96 px', () => {
    expect(mmToPx(25.4)).toBeCloseTo(96, 6);
  });

  it('convierte US Letter a px exactos: 215.9 mm ≈ 816 (8.5 in), 279.4 mm ≈ 1056 (11 in)', () => {
    expect(mmToPx(215.9)).toBeCloseTo(816, 6);
    expect(mmToPx(279.4)).toBeCloseTo(1056, 6);
  });

  it('es identidad en cero', () => {
    expect(mmToPx(0)).toBe(0);
  });
});

describe('pxToMm', () => {
  it('es la inversa: 96 px ≈ 25.4 mm', () => {
    expect(pxToMm(96)).toBeCloseTo(25.4, 6);
  });

  it('roundtrip pxToMm(mmToPx(x)) ≈ x', () => {
    for (const mm of [0, 1, 10.5, 25.4, 210, 297, 355.6]) {
      expect(pxToMm(mmToPx(mm))).toBeCloseTo(mm, 6);
    }
  });
});
