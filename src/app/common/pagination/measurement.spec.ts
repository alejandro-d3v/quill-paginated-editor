import type { Block } from './block';
import { MeasurementService } from './measurement';

const blocks = (count: number): Block[] =>
  Array.from({ length: count }, (_, id) => ({ id, ops: [] }));

const containerWithEditor = (childCount: number): HTMLElement => {
  const container = document.createElement('div');
  const editor = document.createElement('div');
  editor.className = 'ql-editor';
  for (let i = 0; i < childCount; i++) {
    editor.appendChild(document.createElement('p'));
  }
  container.appendChild(editor);
  return container;
};

/** Stub de rect (jsdom no mide): solo lo que el servicio lee. */
const rect = (top: number, height: number): DOMRect => ({ top, height }) as unknown as DOMRect;

describe('MeasurementService.measure', () => {
  it('blocks vacío sin .ql-editor → [] (Quill aún no inicializó)', () => {
    const service = new MeasurementService();
    expect(service.measure([], document.createElement('div'))).toEqual([]);
  });

  it('blocks no vacío sin .ql-editor → Error (estado imposible de alinear)', () => {
    const service = new MeasurementService();
    expect(() => service.measure(blocks(1), document.createElement('div'))).toThrow(/\.ql-editor/);
  });

  it('desalineo de conteo (hijos ≠ bloques) → Error descriptivo (fail-fast)', () => {
    const service = new MeasurementService();
    expect(() => service.measure(blocks(2), containerWithEditor(1))).toThrow(/desalineo/);
  });

  it('mide alturas de flujo por diferencia de offsets; ids desde blocks', () => {
    const service = new MeasurementService();
    const container = containerWithEditor(2);
    const children = Array.from(container.querySelectorAll<HTMLElement>('.ql-editor > p'));
    children[0]!.getBoundingClientRect = () => rect(10, 25);
    children[1]!.getBoundingClientRect = () => rect(40, 20);

    const result = service.measure(blocks(2), container);

    expect(result).toEqual([
      { id: 0, heightPx: 30, splittable: false }, // 40 − 10: flujo con espaciado
      { id: 1, heightPx: 20, splittable: false }, // último: rect + margin (0 en jsdom)
    ]);
  });

  it('un solo hijo: su rect como altura (margen del último incluido)', () => {
    const service = new MeasurementService();
    const container = containerWithEditor(1);
    const child = container.querySelector<HTMLElement>('.ql-editor > p');
    child!.getBoundingClientRect = () => rect(0, 42);

    const result = service.measure(blocks(1), container);

    expect(result).toEqual([{ id: 0, heightPx: 42, splittable: false }]);
  });
});
