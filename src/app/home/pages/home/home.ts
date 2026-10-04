import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import type { Delta } from 'quill';

import { PageBreakIndicators } from '../../../common/components/page-break-indicators/page-break-indicators';
import { PageFrame } from '../../../common/components/page-frame/page-frame';
import { PagesContainer } from '../../../common/components/pages-container/pages-container';
import { DEFAULT_DOCUMENT_SETTINGS } from '../../../common/document/document-settings';
import { EditorComponent } from '../../../common/editor/editor';
import { extractBlocks } from '../../../common/pagination/extract-blocks';
import { MeasurementService } from '../../../common/pagination/measurement';
import { computePageGeometry } from '../../../common/pagination/page-geometry';
import { type LayoutDocument, paginate } from '../../../common/pagination/paginate';

@Component({
  selector: 'app-home',
  imports: [EditorComponent, PageBreakIndicators, PageFrame, PagesContainer],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  protected readonly settings = signal(DEFAULT_DOCUMENT_SETTINGS);
  protected readonly geometry = computed(() => computePageGeometry(this.settings()));
  protected readonly content = signal<Delta | null>(null);
  protected readonly layout = signal<LayoutDocument | null>(null);

  private readonly editorHost = viewChild(EditorComponent);
  private readonly measurement = inject(MeasurementService);

  /** Incrementado por el listener de carga/error de imágenes (spec 06, REQ-04). */
  private readonly imagesVersion = signal(0);
  private imagesListenerHost: HTMLElement | null = null;

  constructor() {
    // Pipeline del seam (discovery §4, specs 04–06). Recomputación
    // coalescida (constitution §11, MVP): el effect se ejecuta una vez por
    // lote de cambios con el último estado. Flujo unidireccional — el
    // pipeline jamás escribe `content` ni `settings` (guarda de bucle
    // zoneless, discovery §10 #4) — y el DOM del editor solo se lee
    // (A1, RULE-015).
    effect(() => {
      const content = this.content();
      const geometry = this.geometry();
      this.imagesVersion(); // dependencia: recomputar cuando carguen las imágenes
      if (content === null) {
        this.layout.set(null);
        return;
      }
      const host = this.editorHost();
      const container = host?.editorElement().nativeElement;
      if (container === undefined) {
        this.layout.set(null);
        return;
      }
      this.listenToImages(container);
      if (!this.measurement.imagesReady(container)) {
        return; // mantiene el último layout válido hasta que las imágenes carguen
      }
      const blocks = extractBlocks(content);
      const measured = this.measurement.measure(blocks, container);
      this.layout.set(paginate(measured, geometry));
    });
  }

  /**
   * Listener delegado en fase de captura (`load`/`error` no burbujean)
   * sobre el elemento del editor (spec 06, REQ-04). Armado en la primera
   * ejecución del pipeline con el elemento disponible; sin cleanup
   * manual — vive y muere con el elemento del editor.
   */
  private listenToImages(container: HTMLElement): void {
    if (this.imagesListenerHost === container) {
      return;
    }
    this.imagesListenerHost = container;
    const bump = (): void => {
      this.imagesVersion.update((version) => version + 1);
    };
    container.addEventListener('load', bump, true);
    container.addEventListener('error', bump, true);
  }
}
