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

/** Fixture: contenedor cuyo editor tiene un `<ol>` con `<li>` stubbeados. */
const containerWithList = (itemTops: readonly number[]): HTMLElement => {
  const container = document.createElement('div');
  const editor = document.createElement('div');
  editor.className = 'ql-editor';
  const list = document.createElement('ol');
  for (const top of itemTops) {
    const item = document.createElement('li');
    item.getBoundingClientRect = () => rect(top, 25);
    list.appendChild(item);
  }
  editor.appendChild(list);
  container.appendChild(editor);
  return container;
};

/** Stub de rect para un elemento hijo con top e altura dados. */
const childRect = (top: number, height: number): DOMRect => ({ top, height }) as unknown as DOMRect;

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

  it('lista: unidades = flujos de los <li>, minFragment = primer ítem, sum === heightPx (spec 06)', () => {
    const service = new MeasurementService();
    // <ol> con 3 <li> (tops 10/40/70) seguido de un <p> (top 100):
    // flujo del bloque = 100 − 10 = 90; unidades = [30, 30] + cierre 30.
    const container = containerWithList([10, 40, 70]);
    const editor = container.querySelector<HTMLElement>('.ql-editor')!;
    const list = editor.querySelector<HTMLElement>('ol')!;
    list.getBoundingClientRect = () => childRect(10, 80);
    const following = document.createElement('p');
    following.getBoundingClientRect = () => childRect(100, 20);
    editor.appendChild(following);

    const listBlock: Block = {
      id: 0,
      ops: [
        { insert: 'a\n', attributes: { list: 'bullet' } },
        { insert: 'b\n', attributes: { list: 'bullet' } },
        { insert: 'c\n', attributes: { list: 'bullet' } },
      ],
    };
    const followingBlock: Block = { id: 1, ops: [{ insert: 'siguiente\n' }] };

    const result = service.measure([listBlock, followingBlock], container);

    expect(result[0]).toEqual({
      id: 0,
      heightPx: 90,
      splittable: true,
      lineHeightsPx: [30, 30, 30],
      minFragmentHeightPx: 30,
    });
  });

  it('lista con un solo <li> → una unidad [heightPx] (de facto atómico)', () => {
    const service = new MeasurementService();
    const container = containerWithList([10]);
    const editor = container.querySelector<HTMLElement>('.ql-editor')!;
    const list = editor.querySelector<HTMLElement>('ol')!;
    list.getBoundingClientRect = () => childRect(10, 30);

    const listBlock: Block = {
      id: 0,
      ops: [{ insert: 'único\n', attributes: { list: 'bullet' } }],
    };

    const result = service.measure([listBlock], container);

    expect(result[0]).toEqual({
      id: 0,
      heightPx: 30,
      splittable: true,
      lineHeightsPx: [30],
      minFragmentHeightPx: 30,
    });
  });

  it('blockquote: unidades = líneas de texto (camino de 05, spec 06)', () => {
    const service = new MeasurementService();
    const container = containerWithEditor(1);
    childrenOf(container)[0]!.getBoundingClientRect = () => rect(0, 42);
    vi.spyOn(document, 'createRange').mockReturnValue(
      fakeRange([
        { top: 0, height: 15 },
        { top: 15, height: 15 },
      ])
    );

    const quote: Block = {
      id: 0,
      ops: [{ insert: 'cita larga\n', attributes: { blockquote: true } }],
    };
    const result = service.measure([quote], container);

    // Líneas: 15 − 0 = 15; última completa 42 − 15 = 27.
    expect(result[0]).toEqual({
      id: 0,
      heightPx: 42,
      splittable: true,
      lineHeightsPx: [15, 27],
      minFragmentHeightPx: 15,
    });
  });

  it('code-block: unidades = líneas de texto (camino de 05, spec 06)', () => {
    const service = new MeasurementService();
    const container = containerWithEditor(1);
    childrenOf(container)[0]!.getBoundingClientRect = () => rect(0, 42);
    vi.spyOn(document, 'createRange').mockReturnValue(
      fakeRange([
        { top: 0, height: 14 },
        { top: 14, height: 14 },
      ])
    );

    const code: Block = {
      id: 0,
      ops: [{ insert: 'línea 1\nlínea 2\n', attributes: { 'code-block': true } }],
    };
    const result = service.measure([code], container);

    // Líneas: 14 − 0 = 14; última completa 42 − 14 = 28.
    expect(result[0]).toEqual({
      id: 0,
      heightPx: 42,
      splittable: true,
      lineHeightsPx: [14, 28],
      minFragmentHeightPx: 14,
    });
  });
});

describe('MeasurementService.imagesReady (spec 06, REQ-04)', () => {
  it('sin imágenes → true', () => {
    const service = new MeasurementService();
    expect(service.imagesReady(containerWithEditor(1))).toBe(true);
  });

  it('una imagen sin complete → false', () => {
    const service = new MeasurementService();
    const container = document.createElement('div');
    const image = document.createElement('img');
    Object.defineProperty(image, 'complete', { value: false });
    container.appendChild(image);
    expect(service.imagesReady(container)).toBe(false);
  });

  it('todas las imágenes con complete → true (incluye las con error)', () => {
    const service = new MeasurementService();
    const container = document.createElement('div');
    const ready = document.createElement('img');
    Object.defineProperty(ready, 'complete', { value: true });
    const errored = document.createElement('img');
    Object.defineProperty(errored, 'complete', { value: true });
    container.append(ready, errored);
    expect(service.imagesReady(container)).toBe(true);
  });
});
