import Quill from 'quill';

import { PageBreakBlot } from './page-break-blot';

// Registro a nivel de módulo (spec 07, REQ-01): equivalente al registro del
// wrapper con Quill real; `overwrite: true` lo mantiene idempotente.
Quill.register(PageBreakBlot, true);

/** Ops de embed (insert de objeto); el resto son texto. */
const embedOps = (ops: readonly { readonly insert?: unknown }[]): readonly unknown[] =>
  ops.filter((op) => typeof op.insert === 'object');

describe('PageBreakBlot (spec 07, REQ-01/REQ-05)', () => {
  const createEditor = (): { container: HTMLElement; quill: Quill } => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    return { container, quill: new Quill(container) };
  };

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('persistencia: insertEmbed produce { insert: { pageBreak: true } } en getContents', () => {
    const { quill } = createEditor();
    quill.insertEmbed(0, 'pageBreak', true);
    const ops = embedOps(quill.getContents().ops);
    expect(ops).toHaveLength(1);
    expect(ops[0]).toEqual({ insert: { pageBreak: true } });
  });

  it('representación: setContents renderiza el marcador con role y aria-label', () => {
    const { container, quill } = createEditor();
    quill.setContents([{ insert: { pageBreak: true } }, { insert: '\n' }]);
    const marker = container.querySelector<HTMLElement>('.page-break');
    expect(marker).not.toBeNull();
    expect(marker?.getAttribute('role')).toBe('separator');
    expect(marker?.getAttribute('aria-label')).toBe('Salto de página');
  });

  it('eliminación nativa: deleteText retira el marcador del DOM y del Delta', () => {
    const { container, quill } = createEditor();
    quill.setContents([{ insert: { pageBreak: true } }, { insert: '\n' }]);
    quill.deleteText(0, 1);
    expect(container.querySelector('.page-break')).toBeNull();
    expect(embedOps(quill.getContents().ops)).toHaveLength(0);
  });
});
