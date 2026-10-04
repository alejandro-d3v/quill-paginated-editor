import type { Op } from 'quill';

/**
 * Vocabulario del seam de medición (discovery §4; specs 04 y 05).
 *
 * El motor de paginación consume bloques ya medidos: jamás mide ni toca
 * Angular/DOM (RULE-006). `splittable` es operativo desde la spec 05:
 * `MeasurementService` lo fija con el predicado puro `isSplittableBlock`
 * — solo los párrafos son divisibles en esta fase; la clasificación
 * completa es de la spec 06 (RULE-019).
 */
export type BlockId = number;

/**
 * Clasificación por tipo (spec 06, REQ-01; discovery §4 sanciona la
 * extensión "tipo de bloque"). Derivada de los atributos del op
 * terminador; `align`/`indent` y los formatos inline NO cambian el tipo.
 * El motor no consume tipos: la unidad de corte la fija la medición.
 * `'page-break'` (spec 07, REQ-03): marcador de salto manual — se detecta
 * por el embed `{ pageBreak: true }` del bloque, con precedencia sobre
 * los atributos del terminador.
 */
export type BlockKind =
  'paragraph' | 'heading' | 'list' | 'blockquote' | 'code-block' | 'page-break';

/** Fragmento del Delta que representa un bloque; formatos inline preservados en `ops`. */
export interface Block {
  readonly id: BlockId;
  readonly ops: readonly Op[];
}

/**
 * Bloque medido por la capa browser (`MeasurementService`).
 *
 * Contratos de la spec 05:
 * - `lineHeightsPx`: alturas de las líneas renderizadas en orden de flujo.
 *   El productor SIEMPRE lo emite — `[]` para bloques indivisibles. Es
 *   opcional en el tipo solo para que los fixtures de la spec 04 sigan
 *   compilando sin editar (RULE-019); el motor lo trata con `?? []`.
 * - `sum(lineHeightsPx) === heightPx` (regla de última línea, REQ-01):
 *   la línea i (< última) mide `top_{i+1} − top_i`; la última completa
 *   hasta `heightPx`. Mantiene los offsets acumulados de los indicadores
 *   exactos (RULE-005, A1).
 * - `minFragmentHeightPx`: altura mínima del fragmento inicial para que
 *   un corte sea válido. En 05 = altura de la primera línea (huérfana
 *   mínima: ≥ 1 línea por lado). Con el fallback de medición
 *   (`lineHeightsPx = [heightPx]`) vale `heightPx` y el bloque queda de
 *   facto atómico — degradación segura, nunca pierde contenido (REQ-03).
 *   Afinar la huérfana (≥ 2 líneas) es calibración de la medición; afinar
 *   la viuda (lado de continuación) exigirá extender el motor (spec 10).
 */
export interface MeasuredBlock {
  readonly id: BlockId;
  readonly heightPx: number;
  readonly splittable: boolean;
  readonly minFragmentHeightPx?: number;
  readonly lineHeightsPx?: readonly number[];
  /**
   * Salto de página manual (spec 07, REQ-03): `true` cuando el bloque es
   * un marcador `pageBreak`. El motor cierra la página que lo porta
   * aunque quede espacio — pero jamás produce una página vacía (REQ-04).
   * Opcional en el tipo: los fixtures de 04–06 siguen compilando sin
   * edición (RULE-019).
   */
  readonly manualBreakAfter?: boolean;
}
