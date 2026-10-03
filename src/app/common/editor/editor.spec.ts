import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { Delta } from 'quill';

import { EditorComponent } from './editor';

/**
 * Stub de Quill (REQ-06): jsdom no implementa todas las APIs de selección que
 * Quill necesita. La instancia real sigue cubierta indirectamente por
 * `home.spec.ts`, que monta el editor sin mock.
 */
const quillMock = vi.hoisted(() => {
  const textChangeHandlers: Array<() => void> = [];
  const offEvents: string[] = [];
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
  };
  function Quill(): typeof instance {
    return instance;
  }
  return { Quill, instance, textChangeHandlers, offEvents };
});

vi.mock('quill', () => ({ default: quillMock.Quill }));

describe('Editor', () => {
  let component: EditorComponent;
  let fixture: ComponentFixture<EditorComponent>;

  beforeEach(async () => {
    quillMock.textChangeHandlers.length = 0;
    quillMock.offEvents.length = 0;
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
});
