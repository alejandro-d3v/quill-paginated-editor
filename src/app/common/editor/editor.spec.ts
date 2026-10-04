import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { Delta } from 'quill';

import { EditorComponent } from './editor';
import { PageBreakBlot } from './page-break-blot';

/** Forma de la config del toolbar que el wrapper pasa al constructor. */
interface ToolbarConfig {
  readonly container: readonly unknown[];
  readonly handlers: { readonly [handler: string]: () => void };
}

/**
 * Stub de Quill (spec 01, REQ-06): jsdom no implementa todas las APIs de
 * selección que Quill necesita. La instancia real sigue cubierta
 * indirectamente por `home.spec.ts`, que monta el editor sin mock, y el
 * blot por `page-break-blot.spec.ts` con Quill real.
 *
 * Stubs de la spec 07 (REQ-05): `register` e `import` (clase base del
 * blot) + `Parchment` (enum Scope, que el blot lee al definirse),
 * `insertEmbed`/`getSelection`/`setSelection` en la instancia, y grabación
 * de las llamadas al constructor para inspeccionar la config del toolbar.
 */
const quillMock = vi.hoisted(() => {
  const textChangeHandlers: Array<() => void> = [];
  const offEvents: string[] = [];
  const insertEmbedCalls: Array<[number, string, unknown]> = [];
  const selectionCalls: number[] = [];
  const registerCalls: Array<[unknown, unknown]> = [];
  const constructorCalls: unknown[][] = [];
  /** Base estructural mínima: `PageBreakBlot` extiende sin DOM de Quill real. */
  class StubBlockEmbed {
    static create(): HTMLElement {
      return document.createElement('div');
    }
  }
  const instance = {
    on: (event: string, handler: () => void): void => {
      if (event === 'text-change') {
        textChangeHandlers.push(handler);
      }
    },
    off: (event: string, _handler: () => void): void => {
      offEvents.push(event);
    },
    getContents: (): { ops: Array<{ insert: string }> } => ({
      ops: [{ insert: 'contenido de prueba' }],
    }),
    getSelection: (): { index: number; length: number } => ({ index: 3, length: 0 }),
    setSelection: (index: number): void => {
      selectionCalls.push(index);
    },
    insertEmbed: (index: number, blotName: string, value: unknown): void => {
      insertEmbedCalls.push([index, blotName, value]);
    },
  };
  function Quill(...args: unknown[]): typeof instance {
    constructorCalls.push(args);
    return instance;
  }
  const QuillWithStatics = Object.assign(Quill, {
    register: (target: unknown, overwrite?: unknown): void => {
      registerCalls.push([target, overwrite]);
    },
    import: (_path: string): unknown => StubBlockEmbed,
  });
  const Parchment = { Scope: { BLOCK_BLOT: 10 } };
  return {
    Quill: QuillWithStatics,
    Parchment,
    instance,
    textChangeHandlers,
    offEvents,
    insertEmbedCalls,
    selectionCalls,
    registerCalls,
    constructorCalls,
  };
});

vi.mock('quill', () => ({ default: quillMock.Quill, Parchment: quillMock.Parchment }));

/** Opciones del último constructor registrado (elemento, opciones). */
const lastOptions = (): { modules: { toolbar: ToolbarConfig } } => {
  const args = quillMock.constructorCalls.at(-1);
  return (args?.[1] ?? {}) as { modules: { toolbar: ToolbarConfig } };
};

describe('Editor', () => {
  let component: EditorComponent;
  let fixture: ComponentFixture<EditorComponent>;

  beforeEach(async () => {
    quillMock.textChangeHandlers.length = 0;
    quillMock.offEvents.length = 0;
    quillMock.insertEmbedCalls.length = 0;
    quillMock.selectionCalls.length = 0;
    quillMock.registerCalls.length = 0;
    quillMock.constructorCalls.length = 0;
    await TestBed.configureTestingModule({
      imports: [EditorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditorComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('registra un listener de text-change al instanciar Quill', () => {
    expect(quillMock.textChangeHandlers.length).toBe(1);
  });

  it('emite deltaChange con el contenido en cada text-change', () => {
    const emitted: Delta[] = [];
    component.deltaChange.subscribe((delta) => {
      emitted.push(delta);
    });

    quillMock.textChangeHandlers[0]();

    expect(emitted.length).toBe(1);
    expect(emitted[0]).toEqual({ ops: [{ insert: 'contenido de prueba' }] });
  });

  it('desconecta el listener de text-change al destruir', () => {
    fixture.destroy();

    expect(quillMock.offEvents).toContain('text-change');
  });

  it('expone semántica ARIA de editor en el contenedor', () => {
    const native: HTMLElement = fixture.nativeElement;
    const textbox = native.querySelector<HTMLElement>('[role="textbox"]');
    expect(textbox).not.toBeNull();
    if (textbox !== null) {
      expect(textbox.getAttribute('aria-label')).toBe('Editor de documento');
      expect(textbox.getAttribute('aria-multiline')).toBe('true');
    }
  });

  it('registra el blot pageBreak con overwrite en cada inicialización (spec 07, REQ-01)', () => {
    expect(quillMock.registerCalls.at(-1)).toEqual([PageBreakBlot, true]);
  });

  it('la config del toolbar incluye el botón page-break con su handler (spec 07, REQ-02)', () => {
    const toolbar = lastOptions().modules.toolbar;
    // Grupo propio, como el botón clean: una entrada `['page-break']`.
    expect(toolbar.container).toContainEqual(['page-break']);
    expect(typeof toolbar.handlers['page-break']).toBe('function');
  });

  it('el handler inserta el embed pageBreak en el cursor y deja el cursor tras el marcador (spec 07, REQ-02)', () => {
    const toolbar = lastOptions().modules.toolbar;
    toolbar.handlers['page-break']();

    expect(quillMock.insertEmbedCalls).toEqual([[3, 'pageBreak', true]]);
    expect(quillMock.selectionCalls).toEqual([4]);
  });
});
