import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Canvas del documento (spec 03, REQ-02): superficie neutra que contrasta
 * con el papel del marco y centra la columna de páginas. Presentacional —
 * la orquestación vive en `home` (constitution §9).
 */
@Component({
  selector: 'app-pages-container',
  templateUrl: './pages-container.html',
  styleUrl: './pages-container.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PagesContainer {}
