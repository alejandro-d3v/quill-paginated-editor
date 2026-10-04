import Quill, { Parchment } from 'quill';

/**
 * Blot base obtenido por ruta (los typings de Quill no re-exportan la
 * clase): `Quill.import` general está tipado como `unknown`, así que se
 * afirma el contrato estructural que Parchment define para los
 * constructores de blot — el mismo que `Quill.register` exige.
 */
const BlockEmbed = Quill.import('blots/block/embed') as Parchment.BlotConstructor;

/**
 * Salto de página manual semántico (spec 07, REQ-01).
 *
 * Block embed: ocupa su línea en el flujo del editor continuo (A1) y viaja
 * en el Delta canónico como `{ insert: { pageBreak: true } }` — Parchment
 * construye el op envolviendo `static value()` con el `blotName`, así el
 * salto sobrevive a `getContents()` y a la persistencia futura (PDF, spec
 * 09) sin modelar páginas en el contenido (RULE-012).
 *
 * La eliminación usa la vía nativa de Quill (selección + retroceso): no
 * hay código de borrado propio que mantener.
 */
export class PageBreakBlot extends BlockEmbed {
  static override blotName = 'pageBreak';
  static override tagName = 'div';
  static override className = 'page-break';
  /** Heredado de BlockEmbed en runtime; re-declarado para el tipado de registro. */
  static override scope = Parchment.Scope.BLOCK_BLOT;

  /** Elemento con semántica de separador (WCAG AA; spec 07, REQ-01). */
  static override create(_value?: unknown): HTMLElement {
    const element = super.create(_value) as HTMLElement;
    element.setAttribute('role', 'separator');
    element.setAttribute('aria-label', 'Salto de página');
    return element;
  }

  /** Valor canónico del op: siempre `true` (el salto no admite variantes). */
  static value(): boolean {
    return true;
  }
}
