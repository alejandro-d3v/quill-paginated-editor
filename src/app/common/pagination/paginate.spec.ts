import type { MeasuredBlock } from './block';
import type { PageGeometry } from './page-geometry';
import { paginate, type LayoutDocument } from './paginate';

/** Fixture: bloques medidos (atómicos) a partir de alturas. */
const measured = (heights: readonly number[]): MeasuredBlock[] =>
  heights.map((heightPx, id) => ({ id, heightPx, splittable: false }));

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
