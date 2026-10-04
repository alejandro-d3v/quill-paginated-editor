import { Injectable } from '@angular/core';

import type { Block, MeasuredBlock } from './block';

/**
 * Capa browser-only del seam de medición (discovery §4, spec 04 REQ-04).
 *
 * Mide los bloques ya renderizados por Quill dentro del contenedor del
 * editor (A1 — la paginación lee el DOM renderizado; jamás lo
 * reestructura, RULE-015). Los ids del resultado fluyen de `blocks`
 * (canónicos de `extractBlocks`), no del DOM; un desalineo de conteo es
 * un bug de segmentación y falla rápido con un `Error` descriptivo — un
 * desalineo silencioso colocaría contenido en páginas erróneas, que es
 * peor (RULE-011). Los módulos puros de paginación no importan este
 * servicio (RULE-006).
 */
@Injectable({ providedIn: 'root' })
export class MeasurementService {
  measure(blocks: readonly Block[], editorContainer: HTMLElement): readonly MeasuredBlock[] {
    const editor = editorContainer.querySelector<HTMLElement>('.ql-editor');
    if (editor === null) {
      if (blocks.length === 0) {
        return [];
      }
      throw new Error(
        'MeasurementService.measure: hay bloques que medir pero no existe .ql-editor en el contenedor (estado imposible de alinear).'
      );
    }

    const children = Array.from(editor.children) as HTMLElement[];
    if (children.length !== blocks.length) {
      throw new Error(
        `MeasurementService.measure: desalineo de segmentación — ${String(children.length)} hijos block-level de .ql-editor vs ${String(blocks.length)} bloques extraídos.`
      );
    }
    if (blocks.length === 0) {
      return [];
    }

    // Una sola pasada de lecturas agrupadas: primero todos los rects y el
    // estilo del último bloque, sin escrituras intercaladas (sin layout
    // thrashing; discovery §4).
    const rects = children.map((child) => child.getBoundingClientRect());
    const lastIndex = children.length - 1;
    const lastMarginBottomPx = parseFloat(getComputedStyle(children[lastIndex]).marginBottom) || 0;

    // heightPx = alto de flujo: el espacio que el bloque ocupa en el flujo
    // continuo, incluyendo el espaciado adyacente (Principle V). Técnica:
    // diferencia de offsets entre bloques contiguos; el último, su rect +
    // su margin inferior.
    return blocks.map((block, index) => {
      const heightPx =
        index < lastIndex
          ? rects[index + 1].top - rects[index].top
          : rects[index].height + lastMarginBottomPx;
      return { id: block.id, heightPx, splittable: false };
    });
  }
}
