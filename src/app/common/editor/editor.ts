import { AfterViewInit, Component, ElementRef, OnDestroy, output,ViewChild } from '@angular/core';

import Quill, { type Delta } from 'quill';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [],
  templateUrl: './editor.html',
  styleUrl: './editor.scss',
})
export class EditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('editor', { static: true })
  private editorElement!: ElementRef<HTMLDivElement>;
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
    const quill = new Quill(this.editorElement.nativeElement, {
      theme: 'snow',
      placeholder: 'Escribe aquí...',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ align: [] }],
          ['blockquote', 'code-block'],
          ['link', 'image'],
          ['clean'],
        ],
      },
    });
    this.quill = quill;
    quill.on('text-change', this.handleTextChange);
  }
}
