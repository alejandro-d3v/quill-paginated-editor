import type { Delta, Op } from 'quill';

import type { Block } from './block';

/**
 * Extracción pura de bloques (discovery §4, spec 04 REQ-02).
 *
 * Entrada: el Delta de un documento (`getContents()` — solo ops insert; los
 * deltas de cambio con retain/delete no son entrada válida). Segmentación
 * alineada 1:1 con el DOM que Quill renderiza (un hijo block-level de
 * `.ql-editor` por bloque):
 * - una línea por `\n`; un op con varias líneas produce un bloque por línea;
 * - los embeds inline (p. ej. image) se acumulan en el bloque de su línea
 *   — así los renderiza Quill, dentro del mismo hijo; un embed en línea
 *   propia forma un bloque con las ops de esa línea (embed + `\n`);
 * - los runs de listas consecutivas del mismo tipo se fusionan en UN bloque
 *   (contenido no soportado en 04 → indivisible, discovery §7);
 * - `id` = ordinal en orden de documento.
 *
 * No muta el Delta de entrada (RULE-003) ni toca Angular/DOM (RULE-006).
 */
export const extractBlocks = (delta: Delta): readonly Block[] => {
  const blocks: Block[] = [];

  let currentOps: readonly Op[] | null = null; // ops del bloque en construcción
  let currentList: string | undefined; // tipo de lista del bloque en construcción
  let lineOps: Op[] = []; // ops acumulados de la línea en construcción
  let lineList: string | undefined; // tipo de lista de la línea en construcción

  const closeLine = (): void => {
    if (currentOps !== null && lineList !== undefined && currentList === lineList) {
      currentOps = [...currentOps, ...lineOps];
    } else {
      if (currentOps !== null) {
        blocks.push({ id: blocks.length, ops: currentOps });
      }
      currentOps = lineOps;
      currentList = lineList;
    }
    lineOps = [];
    lineList = undefined;
  };

  const pushFragment = (fragment: Op): void => {
    // Fusiona fragmentos contiguos de un mismo op para mantener ops naturales
    // por línea (p. ej. "a" + "\n" → "a\n"). Los atributos se comparan por
    // referencia: fragmentos del mismo op comparten el objeto original.
    const last = lineOps.at(-1);
    if (
      last !== undefined &&
      typeof last.insert === 'string' &&
      typeof fragment.insert === 'string' &&
      last.attributes === fragment.attributes
    ) {
      lineOps[lineOps.length - 1] = { ...last, insert: last.insert + fragment.insert };
    } else {
      lineOps.push(fragment);
    }
  };

  // Recibe el bloque como parámetro: TS no rastrea mutaciones en closures
  // y estrecha falsamente `currentOps` a null tras el loop.
  const flushBlock = (ops: readonly Op[] | null): void => {
    if (ops !== null) {
      blocks.push({ id: blocks.length, ops });
    }
  };

  for (const op of delta.ops) {
    const insert: Op['insert'] = op.insert;
    if (typeof insert === 'string') {
      const segments = insert.split('\n');
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        if (i === segments.length - 1) {
          // Último segmento: sin `\n` final → línea parcial (o segmento vacío).
          if (segment.length > 0) {
            pushFragment({ ...op, insert: segment });
          }
        } else {
          // El segmento cierra con `\n`: completa la línea.
          if (segment.length > 0) {
            pushFragment({ ...op, insert: segment });
          }
          pushFragment({ ...op, insert: '\n' });
          const rawList: unknown = op.attributes?.['list'];
          lineList = typeof rawList === 'string' ? rawList : undefined;
          closeLine();
        }
      }
    } else if (insert !== undefined) {
      // Embed: se acumula en la línea actual (Quill lo renderiza inline).
      pushFragment({ ...op });
    }
  }

  // Defensivo: los documentos de Quill terminan en `\n`; si la entrada no
  // lo hace, la línea pendiente forma un bloque final sin terminador.
  if (lineOps.length > 0) {
    closeLine();
  }
  flushBlock(currentOps);

  return blocks;
};

/** Atributos block-level que convierten un bloque en no-párrafo (spec 05, REQ-02). */
const BLOCK_LEVEL_ATTRIBUTES: ReadonlySet<string> = new Set([
  'header',
  'list',
  'blockquote',
  'code-block',
]);

/**
 * Splittabilidad pura (spec 05, REQ-02): `true` si y solo si el op
 * terminador del bloque (el último op con `insert` terminado en `\n`) NO
 * tiene atributos block-level entre `header`, `list`, `blockquote`,
 * `code-block`. Los formatos inline y los embeds inline NO impiden el
 * corte — pertenecen a su línea. En esta spec solo los párrafos son
 * divisibles; la clasificación completa es de la spec 06 (RULE-019:
 * aditivo). Un párrafo de una sola línea es splittable por tipo; el
 * motor jamás lo divide.
 */
export const isSplittableBlock = (block: Block): boolean => {
  for (let i = block.ops.length - 1; i >= 0; i--) {
    const op = block.ops[i];
    const insert: Op['insert'] = op.insert;
    if (typeof insert === 'string' && insert.endsWith('\n')) {
      const attributes = op.attributes;
      if (attributes === undefined) {
        return true;
      }
      return Object.keys(attributes).every((key) => !BLOCK_LEVEL_ATTRIBUTES.has(key));
    }
  }
  // Sin terminador de línea (defensivo, entrada malformada): indivisible.
  return false;
};
