/**
 * Conversión centralizada de unidades físicas (constitution Principle VI, RULE-009).
 *
 * Estándar (definición, no decisión de proyecto): el px CSS se define como
 * 1/96 de pulgada (CSS Values and Units Module) y la pulgada internacional es
 * exactamente 25.4 mm. Esta definición fija hace la conversión determinista
 * (RULE-005) y verificable contra valores físicos conocidos.
 *
 * Funciones puras y totales: sin redondeo, sin excepciones, sin estado.
 * El redondeo para render pertenece a la vista (spec 03).
 */
export const MM_PER_INCH = 25.4;
export const CSS_PX_PER_INCH = 96;

export const mmToPx = (mm: number): number => (mm * CSS_PX_PER_INCH) / MM_PER_INCH;

export const pxToMm = (px: number): number => (px * MM_PER_INCH) / CSS_PX_PER_INCH;
