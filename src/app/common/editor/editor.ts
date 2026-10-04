import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  output,
  viewChild,
} from '@angular/core';

import Quill, { type Delta } from 'quill';

import { PageBreakBlot } from './page-break-blot';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.html',
  styleUrl: './editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorComponent implements AfterViewInit, OnDestroy {
  /**
   * Superficie de medición (A1, spec 04 REQ-05): el contenedor del editor.
   * Expone el ELEMENTO, nunca la instancia de Quill (skill `quill-wrapper`);
   * la paginación lee el DOM renderizado dentro de él.
   */
  readonly editorElement = viewChild.required<ElementRef<HTMLDivElement>>('editor');

  /**
   * Raíz de búsqueda del botón de toolbar (spec 07, REQ-02): Quill inserta
   * el toolbar como HERMANO del contenedor del editor, no dentro de él.
   */
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private quill: Quill | null = null;
  readonly deltaChange = output<Delta>();

  ngAfterViewInit(): void {
    this.initializeEditor();
  }

  ngOnDestroy(): void {
    this.quill?.off('text-change', this.handleTextChange);
    this.quill = null;
  }

  private readonly handleTextChange = (): void => {
    const quill = this.quill;
    if (!quill) {
      return;
    }
    this.deltaChange.emit(quill.getContents());
  };

  private initializeEditor(): void {
    // Registro idempotente (spec 07, REQ-01): con overwrite Quill solo hace
    // `debug.warn` ante re-definiciones, pero `true` lo silencia ante las
    // múltiples inicializaciones del wrapper.
    Quill.register(PageBreakBlot, true);
    const quill = new Quill(this.editorElement().nativeElement, {
      theme: 'snow',
      placeholder: 'Escribe aquí...',
      modules: {
        toolbar: {
          container: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ color: [] }, { background: [] }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ align: [] }],
            ['blockquote', 'code-block'],
            ['link', 'image'],
            ['clean'],
            ['page-break'],
          ],
          handlers: {
            'page-break': () => {
              this.insertPageBreak();
            },
          },
        },
      },
    });
    this.quill = quill;
    quill.on('text-change', this.handleTextChange);
    this.labelPageBreakButton();
  }

  /**
   * Inserta el marcador en el cursor (spec 07, REQ-02) y deja el cursor
   * tras el bloque embebido. La eliminación es la nativa de Quill.
   */
  private insertPageBreak(): void {
    const quill = this.quill;
    if (quill === null) {
      return;
    }
    // `getSelection(true)` enfoca y siempre retorna un rango (typings).
    const index = quill.getSelection(true).index;
    quill.insertEmbed(index, 'pageBreak', true);
    quill.setSelection(index + 1);
  }

  /** Botón accesible (spec 07, REQ-02): la config de Quill no soporta labels. */
  private labelPageBreakButton(): void {
    const button = this.host.nativeElement.querySelector<HTMLElement>('.ql-page-break');
    button?.setAttribute('aria-label', 'Insertar salto de página');
  }
}
