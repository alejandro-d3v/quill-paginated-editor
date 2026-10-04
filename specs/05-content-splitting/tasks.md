# Content Splitting — Tasks

## Preparation

- [ ] Leer `docs/constitution.md` §3.6, §6 (soporte progresivo: long
      paragraphs), §7.2–§7.5, §10, §13; RULE-005/006/010/011/012/019/020.
- [ ] Leer `docs/discovery.md` §3 (05 = descriptores de corte; el Delta
      permanece continuo), §4 (`MeasuredBlock` completo con
      `minFragmentHeightPx`), §7, §11.
- [ ] Leer `spec.md` y `plan.md` de esta spec.
- [ ] Leer en `AGENTS.md` las secciones "Development Workflow",
      "Spec-Driven Development", "Validation Commands" y "Final
      Checklist" (por nombre; la numeración cambia).
- [ ] Leer `MEMORY.md` (estado post-04) y la skill
      `.agents/skills/quill-wrapper/SKILL.md` (la paginación lee el DOM
      renderizado; jamás lo reestructura).
- [ ] Confirmar dependencias de 04: `block.ts`, `extract-blocks.ts`,
      `paginate.ts` y `measurement.ts` existen con las firmas del seam
      (commit `ba1c137`).
- [ ] Confirmar línea base verde (`npm run lint`, `npm test`,
      `npm run build`).

## Implementation (REQ-01..REQ-04)

- [ ] Extender `src/app/common/pagination/block.ts`: añadir
      `lineHeightsPx?: readonly number[]` a `MeasuredBlock` con su
      contrato documentado (productor siempre lo emite; `[]` para
      indivisibles; `sum === heightPx` con regla de última línea;
      opcional solo para no editar fixtures de 04) y documentar
      `minFragmentHeightPx` como operativo (= primera línea en 05).
- [ ] Extender `src/app/common/pagination/paginate.ts`: añadir
      `lineRange?: { from; to }` a `LayoutBlock` (presente solo en
      fragmentos; rango semicerrado de líneas del bloque fuente).
- [ ] Añadir en `src/app/common/pagination/extract-blocks.ts` la
      función pura `isSplittableBlock(block: Block): boolean` — true si
      el op terminador no tiene atributos `header`/`list`/`blockquote`/
      `code-block`; inline formats y embeds inline no impiden el corte.
- [ ] Extender el motor en `src/app/common/pagination/paginate.ts`:
      greedy por líneas para bloques splittables con más de una línea
      (corte cuando la siguiente línea no cabe, fragmento ≥
      `minFragmentHeightPx` y ≥ 1 línea restante; continuidad
      multi-página; primer línea que no cabe → bloque entero en la
      siguiente; línea desbordante → sola sin pérdida; camino atómico
      de 04 intacto).
- [ ] Extender `src/app/common/pagination/measurement.ts`: para bloques
      splittables, medir line boxes con `Range` + `getClientRects`
      agrupados por `top`, aplicar la regla de última línea
      (`sum === heightPx`), emitir `minFragmentHeightPx` = primera línea
      y `splittable: isSplittableBlock(block)`; fallback `[heightPx]`
      sin rects; indivisibles → `[]` como en 04.

## Tests (REQ-05, REQ-06)

- [ ] Extender `extract-blocks.spec.ts`: `isSplittableBlock` — párrafo
      puro → true; párrafo con bold y con embed inline → true; `header`/
      `list`/`blockquote`/`code-block` → false.
- [ ] Extender `paginate.spec.ts`: fixture de corte simple (atómico 30 +
      párrafo `[30,30,30]` con 100 → fragmento `{0,2}` + continuación
      `{2,3}`); multi-split (`[40,40,40,40,40]` con 100 → 3 páginas
      `{0,2}`/`{2,4}`/`{4,5}`); primer línea que no cabe → bloque entero
      sin fragmento de cero líneas; `minFragmentHeightPx` respetado;
      línea desbordante (250/100) sola y el bloque continúa; sin cortes
      para indivisibles y monolínea; determinismo; entrada no mutada.
- [ ] Añadir el invariant de reconstrucción a `paginate.spec.ts`: por
      cada id, los fragmentos ordenados tilean `[0, n)` exactamente y
      sus `heightPx` suman `sum(lineHeightsPx)` — en todos los fixtures
      de corte.
- [ ] Extender `measurement.spec.ts`: stub de `document.createRange`
      con rects por línea → `lineHeightsPx` ordenados,
      `minFragmentHeightPx` = primera línea y `sum === heightPx`; Range
      sin rects → fallback `[heightPx]`; heading fixture →
      `lineHeightsPx: []` y `splittable: false`; párrafo fixture →
      `splittable: true`.
- [ ] Verificar la regresión de 04: la suite previa pasa sin cambios de
      semántica y los fixtures de 04 compilan sin editar.
- [ ] Ejecutar `npm test`.

## Integration

- [ ] Confirmar pureza (RULE-006): `isSplittableBlock` y `paginate` sin
      Angular/DOM/`Range` (grep); el `Range` vive solo en
      `measurement.ts`.
- [ ] Confirmar que `git diff` NO toca `home/`, `common/components/` ni
      `common/editor/` (A1/RULE-015: descriptores, no división física;
      la vista fluye por `heightPx`).
- [ ] Confirmar el Delta intacto: solo descriptores `lineRange`; los
      tests de no-mutación de 04 siguen pasando (RULE-012).
- [ ] Confirmar config intacta (`eslint.config.mjs`, `tsconfig*.json`,
      `angular.json`, `package.json`) y sin deps nuevas (RULE-017).
- [ ] Verificación manual en navegador (recomendada, no bloqueante):
      párrafos largos reales cortándose entre páginas con indicadores en
      las fronteras exactas; documentar hallazgos de calibración
      (viudas/huérfanas, agrupación de líneas) para la spec 10.

## Review

- [ ] `npm run lint` → PASS.
- [ ] `npm test` → PASS.
- [ ] `npm run build` → PASS.
- [ ] `npx prettier --write` sobre los archivos tocados (no repo-wide:
      `format:check` repo-wide ya falla por archivos preexistentes fuera
      de scope).
- [ ] `tasks.md` refleja el estado real.
- [ ] `MEMORY.md` actualizado (≤ 50 líneas) con las decisiones del
      corte.
- [ ] Sincronizar `AGENTS.md` (secciones por nombre): el overview de
      "Repository Overview" gana splitting activo (párrafos divisibles,
      `lineRange`, `minFragmentHeightPx` = 1 línea).
- [ ] Reportar archivos modificados, comandos ejecutados y resultado.
- [ ] NO iniciar `06-complex-blocks`.
