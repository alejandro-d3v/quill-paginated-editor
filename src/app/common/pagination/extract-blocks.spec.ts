import type { Delta, Op } from 'quill';

import { extractBlocks } from './extract-blocks';

/** Fixture: Delta de documento a partir de ops literales. */
const doc = (ops: readonly Op[]): Delta => ({ ops: [...ops] }) as unknown as Delta;

/** Copia estructural de ops para verificar que la entrada no se muta. */
const snapshot = (ops: readonly Op[]): Op[] => JSON.parse(JSON.stringify(ops)) as Op[];

describe('extractBlocks', () => {
  it('Delta vacío → sin bloques', () => {
    expect(extractBlocks(doc([]))).toEqual([]);
  });

  it('un párrafo → un bloque con sus ops', () => {
    const blocks = extractBlocks(doc([{ insert: 'hola\n' }]));
    expect(blocks.length).toBe(1);
    expect(blocks[0]!.id).toBe(0);
    expect(blocks[0]!.ops).toEqual([{ insert: 'hola\n' }]);
  });

  it('párrafo vacío (`\\n`) → un bloque', () => {
    const blocks = extractBlocks(doc([{ insert: '\n' }]));
    expect(blocks.length).toBe(1);
    expect(blocks[0]!.ops).toEqual([{ insert: '\n' }]);
  });

  it('un op multi-línea produce un bloque por línea, con ids ordinales', () => {
    const blocks = extractBlocks(doc([{ insert: 'a\nb\n' }]));
    expect(blocks.length).toBe(2);
    expect(blocks[0]!.id).toBe(0);
    expect(blocks[0]!.ops).toEqual([{ insert: 'a\n' }]);
    expect(blocks[1]!.id).toBe(1);
    expect(blocks[1]!.ops).toEqual([{ insert: 'b\n' }]);
  });

  it('heading conserva sus atributos en las ops del bloque', () => {
    const blocks = extractBlocks(doc([{ insert: 'Título\n', attributes: { header: 1 } }]));
    expect(blocks.length).toBe(1);
    expect(blocks[0]!.ops).toEqual([{ insert: 'Título\n', attributes: { header: 1 } }]);
  });

  it('run de listas del mismo tipo → UN bloque fusionado', () => {
    const blocks = extractBlocks(
      doc([
        { insert: 'a\n', attributes: { list: 'bullet' } },
        { insert: 'b\n', attributes: { list: 'bullet' } },
      ])
    );
    expect(blocks.length).toBe(1);
    expect(blocks[0]!.ops).toEqual([
      { insert: 'a\n', attributes: { list: 'bullet' } },
      { insert: 'b\n', attributes: { list: 'bullet' } },
    ]);
  });

  it('runs consecutivos de listas de distinto tipo → bloques distintos', () => {
    const blocks = extractBlocks(
      doc([
        { insert: 'a\n', attributes: { list: 'bullet' } },
        { insert: 'b\n', attributes: { list: 'ordered' } },
      ])
    );
    expect(blocks.length).toBe(2);
    expect(blocks[0]!.ops).toEqual([{ insert: 'a\n', attributes: { list: 'bullet' } }]);
    expect(blocks[1]!.ops).toEqual([{ insert: 'b\n', attributes: { list: 'ordered' } }]);
  });

  it('texto sin lista tras una lista cierra el bloque de lista', () => {
    const blocks = extractBlocks(
      doc([{ insert: 'a\n', attributes: { list: 'bullet' } }, { insert: 'x\n' }])
    );
    expect(blocks.length).toBe(2);
    expect(blocks[0]!.id).toBe(0);
    expect(blocks[1]!.id).toBe(1);
  });

  it('embed en su propia línea → un bloque (embed + `\\n`)', () => {
    const blocks = extractBlocks(doc([{ insert: { image: 'x.png' } }, { insert: '\n' }]));
    expect(blocks.length).toBe(1);
    expect(blocks[0]!.ops).toEqual([{ insert: { image: 'x.png' } }, { insert: '\n' }]);
  });

  it('embed inline entre texto → un solo bloque (así lo renderiza Quill)', () => {
    const blocks = extractBlocks(
      doc([{ insert: 'hola ' }, { insert: { image: 'x.png' } }, { insert: ' mundo\n' }])
    );
    expect(blocks.length).toBe(1);
    expect(blocks[0]!.ops).toEqual([
      { insert: 'hola ' },
      { insert: { image: 'x.png' } },
      { insert: ' mundo\n' },
    ]);
  });

  it('no muta el Delta de entrada (RULE-003)', () => {
    const ops: Op[] = [
      { insert: 'a\n', attributes: { list: 'bullet' } },
      { insert: 'texto ' },
      { insert: { image: 'x.png' } },
      { insert: ' con imagen\n', attributes: { header: 2 } },
    ];
    const before = snapshot(ops);
    extractBlocks(doc(ops));
    expect(ops).toEqual(before);
  });
});
