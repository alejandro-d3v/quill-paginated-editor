import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Home } from './home';

/** Física conocida, no la implementación (spec 03, REQ-05). */
const toPx = (mm: number): number => (mm * 96) / 25.4;

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('compone canvas → marco → editor anidados', () => {
    const native: HTMLElement = fixture.nativeElement;
    const container = native.querySelector<HTMLElement>('app-pages-container');
    const frame = native.querySelector<HTMLElement>('app-page-frame');
    const editor = native.querySelector<HTMLElement>('app-editor');
    expect(container).not.toBeNull();
    expect(frame).not.toBeNull();
    expect(editor).not.toBeNull();
    if (container !== null && frame !== null && editor !== null) {
      expect(container.contains(frame)).toBe(true);
      expect(frame.contains(editor)).toBe(true);
    }
  });

  it('el marco recibe la geometría de los defaults', () => {
    const native: HTMLElement = fixture.nativeElement;
    const page = native.querySelector<HTMLElement>('.page');
    expect(page).not.toBeNull();
    if (page !== null) {
      expect(parseFloat(page.style.width)).toBeCloseTo(toPx(210), 6);
    }
  });

  it('renderiza los indicadores de salto dentro del marco (spec 04)', () => {
    const native: HTMLElement = fixture.nativeElement;
    const frame = native.querySelector<HTMLElement>('app-page-frame');
    if (frame === null) {
      throw new Error('no se encontró app-page-frame');
    }
    expect(frame.querySelector('app-page-break-indicators')).not.toBeNull();
  });
});
