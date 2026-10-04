import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { PageGeometry } from '../../pagination/page-geometry';
import type { LayoutDocument } from '../../pagination/paginate';
import { PageBreakIndicators } from './page-break-indicators';

const geometry = (contentWidthPx: number): PageGeometry =>
  ({ contentWidthPx }) as unknown as PageGeometry;

const layout = (pageHeights: readonly number[][]): LayoutDocument => ({
  pages: pageHeights.map((heights, index) => ({
    index,
    blocks: heights.map((heightPx, blockIndex) => ({
      id: blockIndex,
      heightPx,
    })),
  })),
});

describe('PageBreakIndicators', () => {
  let fixture: ComponentFixture<PageBreakIndicators>;

  const lines = (): readonly HTMLElement[] => {
    const native: HTMLElement = fixture.nativeElement;
    return Array.from(native.querySelectorAll<HTMLElement>('.break'));
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageBreakIndicators],
    }).compileComponents();

    fixture = TestBed.createComponent(PageBreakIndicators);
    fixture.componentRef.setInput('geometry', geometry(160));
    fixture.componentRef.setInput('layout', null);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('con layout null no dibuja líneas', () => {
    expect(lines().length).toBe(0);
  });

  it('con una sola página no dibuja líneas (sin frontera interna)', () => {
    fixture.componentRef.setInput('layout', layout([[50, 50]]));
    void fixture.whenStable();
    expect(lines().length).toBe(0);
  });

  it('3 páginas → 2 líneas en los offsets acumulados esperados', async () => {
    // Página 1: 50+50=100 · página 2: 100 · página 3: 30 → cortes en 100 y 200
    fixture.componentRef.setInput('layout', layout([[50, 50], [100], [30]]));
    await fixture.whenStable();

    const rendered = lines();
    expect(rendered.length).toBe(2);
    expect(parseFloat(rendered[0]!.style.top)).toBe(100);
    expect(parseFloat(rendered[1]!.style.top)).toBe(200);
    expect(parseFloat(rendered[0]!.style.width)).toBe(160); // contentWidthPx de la geometría
  });
});
