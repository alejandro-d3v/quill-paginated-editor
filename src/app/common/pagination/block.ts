import type { Op } from 'quill';

/**
 * Vocabulario del seam de medición (discovery §4, spec 04 REQ-01).
 *
 * El motor de paginación consume bloques ya medidos: jamás mide ni toca
 * Angular/DOM (RULE-006). En esta spec `splittable` es SIEMPRE `false`
 * (bloques atómicos); la spec 05 lo habilitará para párrafos divisibles
 * (constitution §7.3).
 */
export type BlockId = number;

/** Fragmento del Delta que representa un bloque; formatos inline preservados en `ops`. */
export interface Block {
  readonly id: BlockId;
  readonly ops: readonly Op[];
}

/** Bloque medido por la capa browser (`MeasurementService`). */
export interface MeasuredBlock {
  readonly id: BlockId;
  readonly heightPx: number;
  readonly splittable: boolean;
  readonly minFragmentHeightPx?: number;
}
