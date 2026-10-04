import type { BlockId, MeasuredBlock } from './block';
import type { PageGeometry } from './page-geometry';

/**
 * Motor de paginación puro (discovery §4; specs 04 y 05).
 *
 * `LayoutDocument` es el modelo de layout derivado (constitution §3.6):
 * identidad + altura medida por bloque — suficiente para que la vista
 * calcule offsets y para que el PDF (spec 09) resuelva contenido por
 * `id` + `lineRange`.
 */
export interface LayoutBlock {
  readonly id: BlockId;
  readonly heightPx: number;
  /**
   * Descriptor de fragmento (spec 05, REQ-01): rango semicerrado
   * `[from, to)` de índices de línea del bloque fuente. Presente SOLO en
   * fragmentos de bloques divididos; ausente = bloque completo.
   */
  readonly lineRange?: { readonly from: number; readonly to: number };
}

export interface LayoutPage {
  readonly index: number;
  readonly blocks: readonly LayoutBlock[];
}

export interface LayoutDocument {
  readonly pages: readonly LayoutPage[];
}

/**
 * Distribución greedy determinista (constitution §7.2/§7.3/§7.4/§7.5,
 * RULE-005). Bloques indivisibles (o de una línea) siguen el camino
 * atómico de la spec 04, sin cambios de comportamiento (RULE-020):
 * - un bloque que cabe en el alto restante se coloca en la página actual;
 *   uno que no cabe abre página siguiente;
 * - un bloque que no cabe ni siquiera en una página vacía
 *   (`heightPx > contentHeightPx`, o geometría degenerada
 *   `contentHeightPx ≤ 0`) se coloca SOLO en su propia página y desborda:
 *   jamás se descarta ni se recorta (RULE-011);
 * - un bloque con `manualBreakAfter` (spec 07) cierra la página que lo
 *   porta aunque quede espacio — sin producir páginas vacías: el marcador
 *   va dentro de la página que cierra y, si desborda, esa página ya se
 *   cerró por desborde (el cierre manual no se aplica dos veces).
 *
 * Párrafos divisibles (spec 05, §7.3) se cortan por líneas:
 * - las líneas llenan el alto restante en orden de flujo (RULE-010:
 *   geometría medida, jamás conteo de caracteres);
 * - cuando la siguiente línea no cabe y el fragmento colocado alcanza
 *   `minFragmentHeightPx` y queda al menos una línea restante, se emite
 *   el fragmento con su `lineRange` y el bloque CONTINÚA en la página
 *   siguiente — pudiendo cortarse de nuevo (párrafos multi-página);
 * - si la primera línea no cabe en la página actual, el bloque arranca en
 *   la siguiente sin fragmento de cero líneas (§7.4 a nivel de bloque);
 * - una línea más alta que una página completa se coloca sola en su
 *   propia página y desborda — sin pérdida (RULE-011).
 *
 * Sin bloques de entrada → exactamente una página vacía. La función no
 * toca Angular, DOM ni el Delta (RULE-006/012): los cortes son
 * descriptores `lineRange`, nunca mutación del contenido.
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

  /**
   * Camino atómico de la spec 04 — comportamiento invariante (RULE-020),
   * extendido por la spec 07 (REQ-04): si el bloque porta
   * `manualBreakAfter`, la página que lo contiene se cierra aunque quede
   * espacio. El cierre manual jamás produce una página vacía:
   * - el marcador ya está en la página al cerrar (`push` previo);
   * - si el bloque desborda, la página que lo porta ya se cerró por
   *   desborde — el cierre manual no se aplica dos veces.
   */
  const placeAtomic = (block: MeasuredBlock): void => {
    if (currentBlocks.length > 0 && block.heightPx > remainingPx) {
      closePage();
    }
    currentBlocks.push({ id: block.id, heightPx: block.heightPx });
    if (block.heightPx <= remainingPx) {
      remainingPx -= block.heightPx;
      if (block.manualBreakAfter === true) {
        // Salto manual (spec 07): cierra con el marcador dentro.
        closePage();
      }
    } else {
      // No cabe ni en una página vacía: bloque solo en su página (desborda).
      // La página que porta el marcador ya quedó cerrada por el desborde.
      closePage();
    }
  };

  const placeSplittable = (block: MeasuredBlock, lineHeights: readonly number[]): void => {
    const total = lineHeights.length;
    // Al valor de esta spec todo fragmento inicial contiene la línea 0 y por
    // tanto alcanza `minFragmentHeightPx` — el chequeo es el hook del
    // contrato de tuning (REQ-04), no una restricción activa aquí.
    const minFragmentPx = block.minFragmentHeightPx ?? 0;
    let from = 0;

    while (from < total) {
      // §7.4 a nivel de bloque: si la primera línea del fragmento no cabe en
      // la página actual (con contenido), el bloque arranca en la siguiente —
      // sin fragmento de cero líneas.
      if (currentBlocks.length > 0 && lineHeights[from] > remainingPx) {
        closePage();
      }

      // Fase de simulación: cuántas líneas caben (sin mutar `remainingPx`,
      // para poder descartar el corte si no fuera válido).
      let to = from;
      let fragmentPx = 0;
      let simulatedRemainingPx = remainingPx;
      while (to < total && lineHeights[to] <= simulatedRemainingPx) {
        simulatedRemainingPx -= lineHeights[to];
        fragmentPx += lineHeights[to];
        to++;
      }

      if (to === total) {
        // El resto completo cabe: fragmento final (o bloque entero, sin
        // descriptor).
        currentBlocks.push(
          from === 0
            ? { id: block.id, heightPx: fragmentPx }
            : { id: block.id, heightPx: fragmentPx, lineRange: { from, to } }
        );
        remainingPx = simulatedRemainingPx;
        from = total;
        continue;
      }

      if (to === from) {
        // Ni la primera línea cabe en una página vacía: línea desbordante —
        // sola en su página (desborda), sin pérdida (RULE-011).
        currentBlocks.push({
          id: block.id,
          heightPx: lineHeights[from],
          lineRange: { from, to: from + 1 },
        });
        closePage();
        from = from + 1;
        continue;
      }

      if (fragmentPx >= minFragmentPx) {
        // Corte válido: fragmento inicial aquí; el bloque continúa (§7.3).
        currentBlocks.push({ id: block.id, heightPx: fragmentPx, lineRange: { from, to } });
        closePage();
        from = to;
        continue;
      }

      // Corte no válido (inalcanzable al valor de 05 — hook de tuning):
      // el resto del bloque se trata atómicamente, como en 04.
      closePage();
      const restPx = lineHeights.slice(from).reduce((sum, line) => sum + line, 0);
      currentBlocks.push(
        from === 0
          ? { id: block.id, heightPx: restPx }
          : { id: block.id, heightPx: restPx, lineRange: { from, to: total } }
      );
      if (restPx <= remainingPx) {
        remainingPx -= restPx;
      } else {
        closePage();
      }
      from = total;
    }
  };

  for (const block of measuredBlocks) {
    const lineHeights = block.lineHeightsPx ?? [];
    if (block.splittable && lineHeights.length > 1) {
      placeSplittable(block, lineHeights);
    } else {
      placeAtomic(block);
    }
  }

  // Cierra la última página — o crea la única página vacía del documento.
  if (currentBlocks.length > 0 || pages.length === 0) {
    closePage();
  }

  return { pages };
};
