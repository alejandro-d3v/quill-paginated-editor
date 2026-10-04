import { Injectable } from '@angular/core';

import type { Block, MeasuredBlock } from './block';
import { blockKind, isSplittableBlock } from './extract-blocks';

/**
 * Capa browser-only del seam de medición (discovery §4; specs 04 y 05).
 *
 * Mide los bloques ya renderizados por Quill dentro del contenedor del
 * editor (A1 — la paginación lee el DOM renderizado; jamás lo
 * reestructura, RULE-015). Los ids del resultado fluyen de `blocks`
 * (canónicos de `extractBlocks`), no del DOM; un desalineo de conteo es
 * un bug de segmentación y falla rápido con un `Error` descriptivo — un
 * desalineo silencioso colocaría contenido en páginas erróneas, que es
 * peor (RULE-011). Los módulos puros de paginación no importan este
 * servicio (RULE-006).
 *
 * Desde la spec 05: para bloques divisibles (`isSplittableBlock`) produce
 * `lineHeightsPx` (geometría de líneas renderizadas, RULE-010 — jamás
 * conteo de caracteres) y `minFragmentHeightPx` = primera línea. Con el
 * fallback (`lineHeightsPx = [heightPx]`), `minFragmentHeightPx =
 * heightPx` y el bloque se degrada a atómico — seguro: nunca pierde
 * contenido.
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
      const splittable = isSplittableBlock(block);
      const lineHeightsPx = this.measureUnits(block, children[index], heightPx);
      const measured: MeasuredBlock = splittable
        ? {
            id: block.id,
            heightPx,
            splittable,
            lineHeightsPx,
            minFragmentHeightPx: lineHeightsPx[0],
          }
        : { id: block.id, heightPx, splittable, lineHeightsPx };
      return measured;
    });
  }

  /**
   * Unidades de corte por tipo (spec 06, REQ-03): bloques `list` miden
   * flujos de `<li>` (corte SOLO en fronteras de ítem — la medición no
   * emite unidades más finas); los divisibles de texto (paragraph,
   * blockquote, code-block) miden líneas renderizadas (camino de 05);
   * indivisibles (heading, entrada malformada) → `[]`.
   */
  private measureUnits(block: Block, element: HTMLElement, heightPx: number): readonly number[] {
    if (!isSplittableBlock(block)) {
      return [];
    }
    return blockKind(block) === 'list'
      ? this.measureListUnits(element, heightPx)
      : this.measureLines(element, heightPx);
  }

  /**
   * Flujos de los `<li>` del elemento `<ol>/<ul>` (spec 06, REQ-03):
   * `li[i+1].top − li[i].top` entre ítems contiguos; la última unidad
   * completa hasta `heightPx` (regla de cierre — absorbe el espaciado
   * residual del elemento, incluido el padding del `<ol>`; no repartir
   * el padding a mano). Un solo ítem (o ninguno) → `[heightPx]`:
   * de facto atómico. Los ítems anidados miden con su contenido dentro
   * del `<li>` padre.
   */
  private measureListUnits(element: HTMLElement, heightPx: number): readonly number[] {
    const items = Array.from(element.children) as HTMLElement[];
    if (items.length <= 1) {
      return [heightPx];
    }
    const tops = items.map((item) => item.getBoundingClientRect().top);
    const units: number[] = [];
    for (let i = 0; i + 1 < tops.length; i++) {
      units.push(tops[i + 1] - tops[i]);
    }
    units.push(heightPx - units.reduce((sum, unit) => sum + unit, 0));
    return units;
  }

  /**
   * Alturas de las líneas renderizadas del elemento (spec 05, REQ-03).
   * Técnica: `Range` sobre el contenido + `getClientRects()`, agrupando
   * rects por `top` (una línea por grupo). Regla de cierre (REQ-01): la
   * línea i mide `top_{i+1} − top_i` y la última completa hasta
   * `heightPx` — `sum === heightPx` exacto. Si la agrupación no es
   * perfecta (imágenes inline: varios rects por línea), la suma sigue
   * siendo exacta y el desvío queda contenido dentro del bloque.
   * Fallback determinista (sin rects o sin soporte de Range, p. ej. jsdom):
   * `[heightPx]` — una línea; de facto atómico.
   */
  private measureLines(element: HTMLElement, heightPx: number): readonly number[] {
    const rects = this.lineRects(element);
    if (rects.length === 0) {
      return [heightPx];
    }
    const tops = [...new Set(rects.map((rect) => rect.top))].sort((a, b) => a - b);
    if (tops.length <= 1) {
      return [heightPx];
    }
    const lines: number[] = [];
    for (let i = 0; i + 1 < tops.length; i++) {
      lines.push(tops[i + 1] - tops[i]);
    }
    lines.push(heightPx - lines.reduce((sum, line) => sum + line, 0));
    return lines;
  }

  /** Rects del contenido del elemento; `[]` si el entorno no soporta Range. */
  private lineRects(element: HTMLElement): readonly DOMRect[] {
    try {
      const range = document.createRange();
      range.selectNodeContents(element);
      return Array.from(range.getClientRects());
    } catch {
      return [];
    }
  }

  /**
   * Imágenes listas para medir (spec 06, REQ-04): `true` cuando todos los
   * `<img>` del contenedor tienen `complete === true` (una imagen con
   * error también deja `complete` en `true` — una URL rota no cuelga el
   * flujo). Sin imágenes → `true`.
   */
  imagesReady(editorContainer: HTMLElement): boolean {
    const images = editorContainer.querySelectorAll<HTMLImageElement>('img');
    return Array.from(images).every((image) => image.complete);
  }
}
