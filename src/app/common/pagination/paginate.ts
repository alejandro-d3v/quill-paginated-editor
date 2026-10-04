import type { BlockId, MeasuredBlock } from './block';
import type { PageGeometry } from './page-geometry';

/**
 * Motor de paginación puro (discovery §4, spec 04 REQ-03).
 *
 * `LayoutDocument` es el modelo de layout derivado (constitution §3.6):
 * identidad + altura medida por bloque — suficiente para que la vista
 * calcule offsets y para que el PDF (spec 09) resuelva contenido por `id`.
 */
export interface LayoutBlock {
  readonly id: BlockId;
  readonly heightPx: number;
}

export interface LayoutPage {
  readonly index: number;
  readonly blocks: readonly LayoutBlock[];
}

export interface LayoutDocument {
  readonly pages: readonly LayoutPage[];
}

/**
 * Distribución greedy determinista (constitution §7.2/§7.4, RULE-005).
 * Bloques atómicos en esta spec (`splittable: false`; el splitting de
 * constitution §7.3 es de la spec 05):
 * - un bloque que cabe en el alto restante se coloca en la página actual;
 *   uno que no cabe abre página siguiente;
 * - un bloque que no cabe ni siquiera en una página vacía
 *   (`heightPx > contentHeightPx`, o geometría degenerada
 *   `contentHeightPx ≤ 0`) se coloca SOLO en su propia página y desborda:
 *   jamás se descarta ni se recorta (RULE-011);
 * - sin bloques de entrada → exactamente una página vacía;
 * - consume únicamente `heightPx` y geometría — nunca longitud de texto
 *   (RULE-010) — y no toca Angular, DOM ni el Delta (RULE-006/012).
 */
export const paginate = (
  measuredBlocks: readonly MeasuredBlock[],
  geometry: PageGeometry
): LayoutDocument => {
  const pages: LayoutPage[] = [];
  let currentBlocks: LayoutBlock[] = [];
  let remainingPx = geometry.contentHeightPx;

  const closePage = (): void => {
    pages.push({ index: pages.length, blocks: currentBlocks });
    currentBlocks = [];
    remainingPx = geometry.contentHeightPx;
  };

  for (const block of measuredBlocks) {
    if (currentBlocks.length > 0 && block.heightPx > remainingPx) {
      closePage();
    }
    currentBlocks.push({ id: block.id, heightPx: block.heightPx });
    if (block.heightPx <= remainingPx) {
      remainingPx -= block.heightPx;
    } else {
      // No cabe ni en una página vacía: bloque solo en su página (desborda).
      closePage();
    }
  }

  // Cierra la última página — o crea la única página vacía del documento.
  if (currentBlocks.length > 0 || pages.length === 0) {
    closePage();
  }

  return { pages };
};
