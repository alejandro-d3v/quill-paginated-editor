import type { Delta } from 'quill';

import type { DocumentSettings } from './document-settings';

/**
 * Modelo canónico del documento (constitution §3.1). `content` es el Delta de
 * Quill — única fuente de verdad del cuerpo del documento (RULE-003);
 * `settings` es configuración de layout, nunca configuración del editor
 * (RULE-008). Inmutable por defecto (constitution §10).
 */
export interface DocumentModel {
  readonly content: Delta;
  readonly settings: DocumentSettings;
}
