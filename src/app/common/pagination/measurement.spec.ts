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

/** Stub de Range con rects por línea (spec 05, REQ-06). */
const fakeRange = (rects: readonly { top: number; height: number }[]): Range => {
  const range = {
    selectNodeContents: (): void => undefined,
    getClientRects: (): readonly DOMRect[] => rects.map((r) => rect(r.top, r.height)),
  };
  return range as unknown as Range;
};

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
      { id: 0, heightPx: 30, splittable: false, lineHeightsPx: [] },
      { id: 1, heightPx: 20, splittable: false, lineHeightsPx: [] },
    ]);
  });

  it('un solo hijo: su rect como altura (margen del último incluido)', () => {
    const service = new MeasurementService();
    const container = containerWithEditor(1);
    const child = container.querySelector<HTMLElement>('.ql-editor > p');
    child!.getBoundingClientRect = () => rect(0, 42);

    const result = service.measure(blocks(1), container);

    expect(result).toEqual([{ id: 0, heightPx: 42, splittable: false, lineHeightsPx: [] }]);
  });
});

describe('MeasurementService.measure — medición de líneas (spec 05, REQ-06)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const paragraph = (id: number): Block => ({
    id,
    ops: [{ insert: 'línea uno\nlínea dos\n' }],
  });
  const heading = (id: number): Block => ({
    id,
    ops: [{ insert: 'T\n', attributes: { header: 1 } }],
  });

  const childrenOf = (container: HTMLElement): readonly HTMLElement[] =>
    Array.from(container.querySelectorAll<HTMLElement>('.ql-editor > p'));

  it('párrafo: lineHeightsPx por diferencia de tops; minFragment = primera línea; sum === heightPx', () => {
    const service = new MeasurementService();
    const container = containerWithEditor(2);
    const children = childrenOf(container);
    children[0]!.getBoundingClientRect = () => rect(10, 0); // alto irrelevante: no es el último
    children[1]!.getBoundingClientRect = () => rect(40, 20); // flujo del primero: 40 − 10 = 30
    vi.spyOn(document, 'createRange').mockReturnValue(
      fakeRange([
        { top: 10, height: 15 },
        { top: 25, height: 15 },
      ])
    );

    const result = service.measure([paragraph(0), heading(1)], container);

    // Líneas: 25 − 10 = 15; la última completa hasta el flujo: 30 − 15 = 15.
    expect(result[0]).toEqual({
      id: 0,
      heightPx: 30,
      splittable: true,
      lineHeightsPx: [15, 15],
      minFragmentHeightPx: 15,
    });
    expect(result[1]).toEqual({ id: 1, heightPx: 20, splittable: false, lineHeightsPx: [] });
  });

  it('Range sin rects → fallback [heightPx] (bloque de facto atómico)', () => {
    const service = new MeasurementService();
    const container = containerWithEditor(1);
    childrenOf(container)[0]!.getBoundingClientRect = () => rect(0, 30);
    vi.spyOn(document, 'createRange').mockReturnValue(fakeRange([]));

    const result = service.measure([paragraph(0)], container);

    expect(result[0]).toEqual({
      id: 0,
      heightPx: 30,
      splittable: true,
      lineHeightsPx: [30],
      minFragmentHeightPx: 30,
    });
  });

  it('Range que lanza (entorno sin soporte) → mismo fallback determinista', () => {
    const service = new MeasurementService();
    const container = containerWithEditor(1);
    childrenOf(container)[0]!.getBoundingClientRect = () => rect(0, 30);
    const throwingRange = {
      selectNodeContents: (): void => undefined,
      getClientRects: (): readonly DOMRect[] => {
        throw new Error('not implemented');
      },
    };
    vi.spyOn(document, 'createRange').mockReturnValue(throwingRange as unknown as Range);

    const result = service.measure([paragraph(0)], container);

    expect(result[0]).toEqual({
      id: 0,
      heightPx: 30,
      splittable: true,
      lineHeightsPx: [30],
      minFragmentHeightPx: 30,
    });
  });

  it('bloque indivisible (heading) → lineHeightsPx: [] y sin minFragment', () => {
    const service = new MeasurementService();
    const container = containerWithEditor(1);
    childrenOf(container)[0]!.getBoundingClientRect = () => rect(0, 30);

    const result = service.measure([heading(0)], container);

    expect(result[0]).toEqual({ id: 0, heightPx: 30, splittable: false, lineHeightsPx: [] });
    expect('minFragmentHeightPx' in result[0]!).toBe(false);
  });
});
