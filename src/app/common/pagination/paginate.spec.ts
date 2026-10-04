import type { MeasuredBlock } from './block';
import type { PageGeometry } from './page-geometry';
import { paginate, type LayoutBlock, type LayoutDocument } from './paginate';

/** Fixture: bloques medidos (atómicos) a partir de alturas. */
const measured = (heights: readonly number[]): MeasuredBlock[] =>
  heights.map((heightPx, id) => ({ id, heightPx, splittable: false }));

/** Fixture: bloque atómico explícito (id propio). */
const atomic = (id: number, heightPx: number): MeasuredBlock => ({
  id,
  heightPx,
  splittable: false,
});

/** Fixture: bloque divisible con líneas medidas (contrato: sum === heightPx). */
const splittableBlock = (id: number, lines: readonly number[]): MeasuredBlock => ({
  id,
  heightPx: lines.reduce((sum, line) => sum + line, 0),
  splittable: true,
  lineHeightsPx: lines,
  minFragmentHeightPx: lines[0],
});

/** Fixture: geometría mínima para el motor (solo consume contentHeightPx). */
const geometry = (contentHeightPx: number): PageGeometry =>
  ({ contentHeightPx }) as unknown as PageGeometry;

/** Invariant RULE-011: ids de las páginas concatenados == ids de entrada. */
const concatenatedIds = (document: LayoutDocument): readonly number[] =>
  document.pages.flatMap((page) => page.blocks.map((block) => block.id));

describe('paginate — invariant de sin pérdida (RULE-011)', () => {
  it('preserva todos los ids en orden (fixture normal con overflow)', () => {
    const result = paginate(measured([30, 40, 50, 60, 70]), geometry(100));
    expect(concatenatedIds(result)).toEqual([0, 1, 2, 3, 4]);
  });

  it('preserva los ids cuando un bloque desborda una página completa', () => {
    const result = paginate(measured([250, 30, 40]), geometry(100));
    expect(concatenatedIds(result)).toEqual([0, 1, 2]);
  });

  it('preserva los ids con geometría degenerada (cada bloque solo)', () => {
    const result = paginate(measured([30, 40, 50]), geometry(0));
    expect(concatenatedIds(result)).toEqual([0, 1, 2]);
    expect(result.pages.every((page) => page.blocks.length === 1)).toBe(true);
  });

  it('preserva los ids con contentHeightPx negativo', () => {
    const result = paginate(measured([30, 40]), geometry(-5));
    expect(concatenatedIds(result)).toEqual([0, 1]);
  });
});

describe('paginate — determinismo (RULE-005)', () => {
  it('dos llamadas con las mismas entradas producen el mismo LayoutDocument', () => {
    const blocks = measured([30, 120, 40, 15]);
    const g = geometry(100);
    expect(paginate(blocks, g)).toEqual(paginate(blocks, g));
  });
});

describe('paginate — distribución greedy (§7.2/§7.4)', () => {
  it('sin overflow → una sola página con todos los bloques', () => {
    const result = paginate(measured([30, 40]), geometry(100));
    expect(result.pages.length).toBe(1);
    expect(result.pages[0]!.blocks.length).toBe(2);
    expect(result.pages[0]!.index).toBe(0);
  });

  it('fixture greedy verificable: [30,30,30,30] con 100px → 2 páginas (3+1)', () => {
    const result = paginate(measured([30, 30, 30, 30]), geometry(100));
    expect(result.pages.length).toBe(2);
    expect(result.pages[0]!.blocks.map((b) => b.id)).toEqual([0, 1, 2]);
    expect(result.pages[1]!.blocks.map((b) => b.id)).toEqual([3]);
    expect(result.pages[1]!.index).toBe(1);
  });

  it('bloque que no cabe ni en una página vacía → solo en su página, sin dividirse', () => {
    const result = paginate(measured([250, 30]), geometry(100));
    expect(result.pages.length).toBe(2);
    expect(result.pages[0]!.blocks).toEqual([{ id: 0, heightPx: 250 }]);
    expect(result.pages[1]!.blocks).toEqual([{ id: 1, heightPx: 30 }]);
  });

  it('encaje exacto: un bloque del tamaño de la página ocupa una página sin desbordar', () => {
    const result = paginate(measured([100, 100]), geometry(100));
    expect(result.pages.length).toBe(2);
    expect(result.pages[0]!.blocks).toEqual([{ id: 0, heightPx: 100 }]);
  });

  it('sin bloques → exactamente una página vacía', () => {
    const result = paginate(measured([]), geometry(100));
    expect(result.pages.length).toBe(1);
    expect(result.pages[0]!.blocks).toEqual([]);
    expect(result.pages[0]!.index).toBe(0);
  });
});

describe('paginate — entrada no mutada', () => {
  it('no muta measuredBlocks (deep-equal tras la llamada)', () => {
    const blocks = measured([30, 40, 250]);
    const before = JSON.parse(JSON.stringify(blocks)) as MeasuredBlock[];
    paginate(blocks, geometry(100));
    expect(blocks).toEqual(before);
  });
});

describe('paginate — corte de párrafos (§7.3, spec 05)', () => {
  it('corta cuando la siguiente línea no cabe y continúa en la página siguiente', () => {
    const result = paginate([atomic(0, 30), splittableBlock(1, [30, 30, 30])], geometry(100));
    expect(result.pages.length).toBe(2);
    expect(result.pages[0]!.blocks[0]).toEqual({ id: 0, heightPx: 30 });
    expect(result.pages[0]!.blocks[1]).toEqual({
      id: 1,
      heightPx: 60,
      lineRange: { from: 0, to: 2 },
    });
    expect(result.pages[1]!.blocks).toEqual([
      { id: 1, heightPx: 30, lineRange: { from: 2, to: 3 } },
    ]);
  });

  it('multi-split: un párrafo a través de tres páginas', () => {
    const result = paginate([splittableBlock(0, [40, 40, 40, 40, 40])], geometry(100));
    expect(result.pages.length).toBe(3);
    expect(result.pages[0]!.blocks[0]).toEqual({
      id: 0,
      heightPx: 80,
      lineRange: { from: 0, to: 2 },
    });
    expect(result.pages[1]!.blocks[0]).toEqual({
      id: 0,
      heightPx: 80,
      lineRange: { from: 2, to: 4 },
    });
    expect(result.pages[2]!.blocks[0]).toEqual({
      id: 0,
      heightPx: 40,
      lineRange: { from: 4, to: 5 },
    });
  });

  it('si la primera línea no cabe, el bloque arranca en la página siguiente sin fragmento de cero líneas', () => {
    const result = paginate([atomic(0, 60), splittableBlock(1, [50, 50])], geometry(100));
    expect(result.pages[0]!.blocks).toEqual([{ id: 0, heightPx: 60 }]);
    expect(result.pages[1]!.blocks).toEqual([{ id: 1, heightPx: 100 }]);
  });

  it('línea desbordante: sola en su página y el bloque continúa (sin pérdida)', () => {
    const result = paginate([splittableBlock(0, [250, 30])], geometry(100));
    expect(result.pages[0]!.blocks).toEqual([
      { id: 0, heightPx: 250, lineRange: { from: 0, to: 1 } },
    ]);
    expect(result.pages[1]!.blocks).toEqual([
      { id: 0, heightPx: 30, lineRange: { from: 1, to: 2 } },
    ]);
  });

  it('sin descriptor cuando el párrafo cabe completo (ausente = bloque completo)', () => {
    const result = paginate([splittableBlock(0, [30, 40])], geometry(100));
    expect(result.pages.length).toBe(1);
    expect(result.pages[0]!.blocks).toEqual([{ id: 0, heightPx: 70 }]);
  });

  it('párrafo de una línea y bloques indivisibles siguen el camino atómico', () => {
    const result = paginate([splittableBlock(0, [80]), atomic(1, 120)], geometry(100));
    expect(result.pages.length).toBe(2);
    expect(result.pages[0]!.blocks).toEqual([{ id: 0, heightPx: 80 }]);
    expect(result.pages[1]!.blocks).toEqual([{ id: 1, heightPx: 120 }]);
  });

  it('geometría degenerada: cada línea queda sola en su página, sin pérdida', () => {
    const result = paginate([splittableBlock(0, [30, 40])], geometry(0));
    expect(result.pages.length).toBe(2);
    expect(result.pages[0]!.blocks).toEqual([
      { id: 0, heightPx: 30, lineRange: { from: 0, to: 1 } },
    ]);
    expect(result.pages[1]!.blocks).toEqual([
      { id: 0, heightPx: 40, lineRange: { from: 1, to: 2 } },
    ]);
  });
});

describe('paginate — listas divisibles (spec 06, REQ-05)', () => {
  it('corte exacto en frontera de ítem (unidades = flujos de <li>; el motor no distingue tipos)', () => {
    // La medición de un bloque list produce unidades por <li> (spec 06,
    // REQ-03): el motor las consume genéricamente — esta prueba fija que
    // el corte cae SOLO entre unidades, nunca dentro.
    const result = paginate([splittableBlock(0, [50, 20, 50])], geometry(100));
    expect(result.pages.length).toBe(2);
    expect(result.pages[0]!.blocks[0]).toEqual({
      id: 0,
      heightPx: 70,
      lineRange: { from: 0, to: 2 },
    });
    expect(result.pages[1]!.blocks[0]).toEqual({
      id: 0,
      heightPx: 50,
      lineRange: { from: 2, to: 3 },
    });
  });
});

describe('paginate — invariant de reconstrucción de líneas (RULE-011, spec 05)', () => {
  const fragmentsOf = (document: LayoutDocument, id: number): readonly LayoutBlock[] =>
    document.pages.flatMap((page) => page.blocks.filter((block) => block.id === id));

  const assertFullyPreserved = (block: MeasuredBlock, document: LayoutDocument): void => {
    const fragments = fragmentsOf(document, block.id);
    expect(fragments.length).toBeGreaterThan(0);
    // Suma de alturas == altura del bloque (sin pérdida de flujo).
    const heightSum = fragments.reduce((sum, fragment) => sum + fragment.heightPx, 0);
    expect(heightSum).toBe(block.heightPx);
    // Rangos tilean [0, n) exactamente (o el bloque cabe completo).
    const totalLines = (block.lineHeightsPx ?? []).length;
    if (fragments[0]!.lineRange === undefined) {
      expect(fragments.length).toBe(1);
      return;
    }
    let cursor = 0;
    for (const fragment of fragments) {
      const range = fragment.lineRange;
      expect(range).toBeDefined();
      expect(range!.from).toBe(cursor);
      expect(range!.to).toBeGreaterThan(range!.from);
      cursor = range!.to;
    }
    expect(cursor).toBe(totalLines);
    // Huérfana mínima: el fragmento inicial alcanza minFragmentHeightPx.
    expect(fragments[0]!.heightPx).toBeGreaterThanOrEqual(block.minFragmentHeightPx ?? 0);
  };

  it('los fragmentos tilean [0, n) exactamente y suman el bloque — todos los fixtures de corte', () => {
    const fixtures: readonly MeasuredBlock[] = [
      splittableBlock(0, [40, 40, 40, 40, 40]),
      splittableBlock(1, [30, 30, 30]),
      splittableBlock(2, [250, 30]),
      splittableBlock(3, [50, 50]),
      splittableBlock(4, [30, 40]),
      splittableBlock(5, [50, 20, 50]), // lista divisible (spec 06)
    ];
    const result = paginate(fixtures, geometry(100));
    for (const block of fixtures) {
      assertFullyPreserved(block, result);
    }
  });

  it('determinismo y entrada no mutada con splitting', () => {
    const blocks: MeasuredBlock[] = [
      splittableBlock(0, [40, 40, 40, 40, 40]),
      atomic(1, 30),
      splittableBlock(2, [250, 30]),
    ];
    const g = geometry(100);
    expect(paginate(blocks, g)).toEqual(paginate(blocks, g));
    expect(blocks).toEqual(JSON.parse(JSON.stringify(blocks)) as MeasuredBlock[]);
  });
});
