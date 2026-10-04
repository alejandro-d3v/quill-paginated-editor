import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { DocumentSettings } from '../../document/document-settings';
import { DEFAULT_DOCUMENT_SETTINGS } from '../../document/document-settings';
import { computePageGeometry } from '../../pagination/page-geometry';
import { PageFrame } from './page-frame';

/** Física conocida, no la implementación (spec 03, REQ-05). */
const toPx = (mm: number): number => (mm * 96) / 25.4;

describe('PageFrame', () => {
  let fixture: ComponentFixture<PageFrame>;

  const element = (selector: string): HTMLElement => {
    const native: HTMLElement = fixture.nativeElement;
    const found = native.querySelector<HTMLElement>(selector);
    if (found === null) {
      throw new Error(`No se encontró ${selector} en la plantilla`);
    }
    return found;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageFrame],
    }).compileComponents();

    fixture = TestBed.createComponent(PageFrame);
    fixture.componentRef.setInput('geometry', computePageGeometry(DEFAULT_DOCUMENT_SETTINGS));
    await fixture.whenStable();
  });

  it('renderiza el marco con las dimensiones y márgenes de la geometría', () => {
    const page = element('.page');
    expect(parseFloat(page.style.width)).toBeCloseTo(toPx(210), 6);
    expect(parseFloat(page.style.minHeight)).toBeCloseTo(toPx(297), 6);
    expect(parseFloat(page.style.paddingTop)).toBeCloseTo(toPx(25), 6);
    expect(parseFloat(page.style.paddingLeft)).toBeCloseTo(toPx(25), 6);
  });

  it('el área de contenido tiene el ancho de la geometría', () => {
    const content = element('.content-area');
    expect(parseFloat(content.style.width)).toBeCloseTo(toPx(160), 6);
  });

  it('sin bandas con los defaults (header/footer deshabilitados → alturas 0)', () => {
    expect(fixture.nativeElement.querySelector('.header-band')).toBeNull();
    expect(fixture.nativeElement.querySelector('.footer-band')).toBeNull();
  });

  it('renderiza las bandas con sus alturas cuando están habilitadas', async () => {
    const settings: DocumentSettings = {
      ...DEFAULT_DOCUMENT_SETTINGS,
      header: { enabled: true, height: 12 },
      footer: { enabled: true, height: 8 },
    };
    fixture.componentRef.setInput('geometry', computePageGeometry(settings));
    await fixture.whenStable();

    expect(parseFloat(element('.header-band').style.height)).toBeCloseTo(toPx(12), 6);
    expect(parseFloat(element('.footer-band').style.height)).toBeCloseTo(toPx(8), 6);
  });
});
