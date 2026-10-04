import type { Delta, Op } from 'quill';

import type { Block, BlockKind } from './block';

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
 * - los embeds a nivel de BLOQUE (spec 07: `pageBreak`) auto-terminan su
 *   línea — en el Delta de Quill NO llevan `\n` propio (así los segmenta
 *   `Scroll#deltaToRenderBlocks`): cortan la línea en construcción y
 *   forman un bloque propio, alineado 1:1 con su hijo block-level del DOM;
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
    } else if (isBlockEmbedOp(op)) {
      // Embed a nivel de bloque: auto-termina su línea (sin `\n` propio).
      // Corta la línea en construcción y forma un bloque propio — espejo
      // de `Scroll#deltaToRenderBlocks`, alineado 1:1 con el DOM.
      if (lineOps.length > 0) {
        closeLine();
      }
      lineOps.push({ ...op });
      closeLine();
    } else if (insert !== undefined) {
      // Embed inline: se acumula en la línea actual (Quill lo renderiza inline).
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

/**
 * Clasificación pura por tipo (spec 06, REQ-01). Los atributos de bloque
 * son excluyentes por línea en Quill — el orden de KIND_BY_ATTRIBUTE es
 * únicamente defensivo para entrada malformada, no una búsqueda de
 * combinaciones reales. `align`/`indent` y los formatos inline NO
 * cambian el tipo.
 */
const KIND_BY_ATTRIBUTE: readonly (readonly [string, BlockKind])[] = [
  ['list', 'list'],
  ['header', 'heading'],
  ['blockquote', 'blockquote'],
  ['code-block', 'code-block'],
];

const SPLITTABLE_KINDS: ReadonlySet<BlockKind> = new Set<BlockKind>([
  'paragraph',
  'list',
  'blockquote',
  'code-block',
]);

/** El op terminador del bloque (el último op con `insert` terminado en `\n`). */
const terminatorOp = (block: Block): Op | null => {
  for (let i = block.ops.length - 1; i >= 0; i--) {
    const op = block.ops[i];
    const insert: Op['insert'] = op.insert;
    if (typeof insert === 'string' && insert.endsWith('\n')) {
      return op;
    }
  }
  return null;
};

/**
 * Embed a nivel de bloque (spec 07, REQ-03): `{ pageBreak: true }`. En el
 * Delta de Quill estos embeds auto-terminan su línea — sin `\n` propio —
 * así que son la única clase de bloque sin op terminador. La detección es
 * por clave: `pageBreak` es el único block embed que esta app registra; un
 * block embed desconocido (p. ej. pegado) desalinearía el conteo y falla
 * rápido en `MeasurementService` — nunca coloca contenido en silencio.
 */
const isBlockEmbedOp = (op: Op): boolean => {
  const insert: Op['insert'] = op.insert;
  return typeof insert === 'object' && 'pageBreak' in insert;
};

/**
 * Clasificador puro por tipo (spec 06, REQ-01; spec 07, REQ-03). El embed
 * `{ pageBreak: true }` manda primero (el marcador auto-termina su línea:
 * sin esta detección, la rama defensiva lo tiparía `'paragraph'`); el
 * resto se deriva del op terminador. Sin op terminador (entrada malformada)
 * se tipa `'paragraph'`; la rama defensiva de `isSplittableBlock` mantiene
 * esos bloques indivisibles.
 */
export const blockKind = (block: Block): BlockKind => {
  if (block.ops.some(isBlockEmbedOp)) {
    return 'page-break';
  }
  const terminator = terminatorOp(block);
  if (terminator === null) {
    return 'paragraph';
  }
  const attributes = terminator.attributes;
  if (attributes === undefined) {
    return 'paragraph';
  }
  for (const [attribute, kind] of KIND_BY_ATTRIBUTE) {
    if (attribute in attributes) {
      return kind;
    }
  }
  return 'paragraph';
};

/**
 * Matriz de divisibilidad (spec 06, REQ-02; reemplaza el predicado
 * minimal de 05 — RULE-019 aditivo): paragraph, list, blockquote y
 * code-block son divisibles (constitution §6, soporte progresivo);
 * heading y page-break indivisibles (spec 07, REQ-03: el marcador se
 * cortaría del contenido que delimita). CONSERVA la rama defensiva de
 * 05: sin op terminador (entrada malformada) → `false`, con
 * independencia de la matriz — así los updates declarados por 06 siguen
 * siendo exactamente 3. Los formatos inline y los embeds inline NO
 * impiden el corte. Un bloque divisible de una sola unidad no se divide
 * (el motor lo trata atómicamente).
 */
export const isSplittableBlock = (block: Block): boolean => {
  if (terminatorOp(block) === null) {
    return false;
  }
  return SPLITTABLE_KINDS.has(blockKind(block));
};
