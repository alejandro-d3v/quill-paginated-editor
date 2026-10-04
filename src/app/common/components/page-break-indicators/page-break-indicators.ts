import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { PageGeometry } from '../../pagination/page-geometry';
import type { LayoutDocument } from '../../pagination/paginate';

/**
 * Indicadores de salto del overlay A1 (discovery §3, spec 04 REQ-05):
 * una línea decorativa (`aria-hidden`) por cada frontera interna de
 * página (`pages.length − 1`), en el offset acumulado de alturas de
 * bloques de las páginas previas, desde el origen del área de contenido.
 * El DOM del editor nunca se reestructura (RULE-015) — solo se dibuja
 * encima; `pointer-events: none` para no interferir la edición.
 */
@Component({
  selector: 'app-page-break-indicators',
  templateUrl: './page-break-indicators.html',
  styleUrl: './page-break-indicators.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageBreakIndicators {
  readonly layout = input<LayoutDocument | null>(null);
  readonly geometry = input.required<PageGeometry>();

  protected readonly boundaries = computed<readonly number[]>(() => {
    const layout = this.layout();
    if (layout === null) {
      return [];
    }
    const offsets: number[] = [];
    let cumulative = 0;
    const pages = layout.pages;
    for (let i = 0; i + 1 < pages.length; i++) {
      for (const block of pages[i].blocks) {
        cumulative += block.heightPx;
      }
      offsets.push(cumulative);
    }
    return offsets;
  });
}
