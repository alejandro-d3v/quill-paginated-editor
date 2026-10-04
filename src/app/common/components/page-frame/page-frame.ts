import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { PageGeometry } from '../../pagination/page-geometry';

/**
 * Marco de página (spec 03, REQ-01): consume la geometría pura de la spec 02
 * y la pinta con style bindings en px (sin redondeo). Orden del flujo:
 * banda de header → contenido proyectado → banda de footer (consistente con
 * `contentYPx` de 02, constitution §7.1). Bandas reservadas vacías — el
 * contenido de header/footer es de la spec 08.
 */
@Component({
  selector: 'app-page-frame',
  templateUrl: './page-frame.html',
  styleUrl: './page-frame.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageFrame {
  readonly geometry = input.required<PageGeometry>();
}
