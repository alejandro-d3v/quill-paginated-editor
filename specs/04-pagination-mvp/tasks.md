# Pagination MVP — Tasks

## Preparation

- [ ] Leer `docs/constitution.md` §3.6 (Layout Model), §6 (contrato del
      motor), §7 (overflow/indivisible), §11, §13 (catálogo Pagination e
      invariants), §15 Phase 4; RULE-003/004/005/006/010/011/012/015.
- [ ] Leer `docs/discovery.md` §3 (A1), §4 (seam: contrato completo de
      `MeasuredBlock`/`MeasurementService`), §7 (regla indivisible),
      §10 (riesgos #4/#5/#7), §11 (orden).
- [ ] Leer `spec.md` y `plan.md` de esta spec.
- [ ] Leer en `AGENTS.md` las secciones "Development Workflow",
      "Spec-Driven Development", "Angular Rules (v21)", "Quill
      Integration", "UI, Accessibility, and Security", "Validation
      Commands" y "Final Checklist" (por nombre; la numeración cambia).
- [ ] Leer `MEMORY.md` (estado post-03) y la skill
      `.agents/skills/quill-wrapper/SKILL.md` (guardarraíles de
      exposición; la paginación lee el DOM renderizado sin tocar el
      wrapper).
- [ ] Confirmar dependencias: `common/document/` (`Delta` via quill,
      `DEFAULT_DOCUMENT_SETTINGS`), `common/pagination/page-geometry.ts`
      (`PageGeometry`/`computePageGeometry`), `common/editor/`
      (`deltaChange`), `common/components/` (marco/canvas) — todos
      implementados (specs 01–03).
- [ ] Confirmar línea base verde (`npm run lint`, `npm test`,
      `npm run build`).

## Implementation (REQ-01..REQ-05)

- [ ] Crear `src/app/common/pagination/block.ts`: `BlockId`, `Block`,
      `MeasuredBlock` (readonly; `splittable` documentado como siempre
      `false` en 04, habilitado en 05).
- [ ] Crear `src/app/common/pagination/extract-blocks.ts`:
      `extractBlocks(delta)` puro — un bloque por elemento block-level,
      multi-línea → un bloque por línea, embeds inline acumulados en el
      bloque de su línea (embed en línea propia → un bloque con embed +
      `\n`), runs de listas del mismo tipo fusionados en un bloque, ids
      ordinales, sin mutar el Delta.
- [ ] Crear `src/app/common/pagination/paginate.ts`:
      `LayoutBlock`/`LayoutPage`/`LayoutDocument` + `paginate` greedy:
      cabe → misma página; no cabe → siguiente; bloque ≥
      `contentHeightPx` → solo en su propia página (desborda, jamás se
      pierde); vacío → una página vacía; degenerado (`≤ 0`) → cada bloque
      solo; determinista, sin Angular/DOM, consume solo alturas.
- [ ] Crear `src/app/common/pagination/measurement.ts`:
      `MeasurementService` con
      `measure(blocks, editorContainer): readonly MeasuredBlock[]` — ids
      desde `blocks` (canónicos de `extractBlocks`), localiza
      `.ql-editor` (sin editor y blocks vacío → `[]`; desalineo de
      conteo → `Error` descriptivo, fail-fast), mide el hijo i-ésimo
      para el bloque i-ésimo en una sola pasada, `heightPx` = alto de
      flujo (diferencia de offsets; último: rect + margin inferior),
      `splittable: false`.
- [ ] Exponer la superficie de medición en el wrapper:
      `editorElement` (`viewChild.required`) pasa de privado a readonly
      público en `src/app/common/editor/editor.ts` — solo el elemento
      contenedor, nunca la instancia de Quill.
- [ ] Crear `src/app/common/components/page-break-indicators/page-break-indicators.{ts,html,scss}`:
      `PageBreakIndicators`, selector `app-page-break-indicators`,
      `OnPush`, inputs `layout` y `geometry`; una línea decorativa
      (`aria-hidden`) por frontera interna de página en el offset
      acumulado; sin líneas con layout null o de una página; añadir
      `position: relative` a `.content-area` en `page-frame.scss`.
- [ ] Cablear `src/app/home/pages/home/home.{ts,html}`: `content` signal
      desde `(deltaChange)`, `layout` con el resultado de
      `extractBlocks(content)` → `measure(blocks, editorElement())` →
      `paginate(measured, geometry())`; recomputación coalescida (N
      eventos → 1 recomputación con el último estado), lecturas DOM no
      reactivas, el pipeline nunca escribe `content`/`settings`;
      indicadores dentro del marco en el template.

## Tests (REQ-06)

- [ ] Crear `paginate.spec.ts` (puro, sin TestBed): sin pérdida (ids
      concatenados == entrada, orden preservado) con fixtures normales,
      desbordantes y degenerados; determinismo (dos llamadas deep-equal);
      sin overflow → una página; overflow greedy verificable
      (`contentHeightPx 100`, bloques `[30,30,30,30]` → 2 páginas 3+1);
      bloque que no cabe ni en una página vacía → solo; vacío → una
      página vacía; entrada no mutada.
- [ ] Crear `extract-blocks.spec.ts` (puro): Delta vacío → `[]`; un
      párrafo; multi-línea → un bloque por línea; heading con atributos;
      run de listas de un tipo → un bloque; `ordered` vs `bullet`
      consecutivos → bloques distintos; embed en su propia línea → un
      bloque (embed + `\n`); embed inline entre texto → un solo bloque;
      Delta de entrada intacto (deep-equal).
- [ ] Crear `measurement.spec.ts`: `blocks` vacío sin `.ql-editor` →
      `[]`; desalineo de conteo → `Error`; hijos con alturas de flujo
      stubbeadas → un `MeasuredBlock` por bloque con ids y alturas
      esperados.
- [ ] Crear `page-break-indicators.spec.ts`: layout de 3 páginas con
      alturas conocidas → 2 líneas en los offsets acumulados esperados;
      layout null o de una página → sin líneas.
- [ ] Extender `home.spec.ts`: el template renderiza
      `app-page-break-indicators` dentro del marco.
- [ ] Ejecutar `npm test`.

## Integration

- [ ] Confirmar que `block.ts`, `extract-blocks.ts` y `paginate.ts` no
      importan Angular ni DOM (RULE-006) — solo `measurement.ts` es
      Angular, y nada del dominio puro lo importa.
- [ ] Confirmar que la instancia de Quill no se filtra (grep de tipos de
      Quill fuera del wrapper) y que el DOM del editor solo se lee
      (A1/RULE-015 — inspección de diff).
- [ ] Confirmar por grep: `position: relative` presente en
      `.content-area` de `page-frame.scss`.
- [ ] Confirmar la guarda de bucle: el pipeline no escribe
      `content`/`settings`; recomputación coalescida (inspección de
      diff + suite termina sin timeouts).
- [ ] Confirmar que el toolbar actual (listas/imágenes/blockquotes/
      code-blocks) fluye por la regla indivisible del motor — cubierto
      por los fixtures de "bloque ≥ página" y sin pérdida.
- [ ] Confirmar que no se tocó `common/document/`, `common/pagination/`
      (02), el wrapper ni config más allá de lo que exige REQ-05
      (`eslint.config.mjs`, `tsconfig*.json`, `angular.json`,
      `package.json` intactos).
- [ ] Verificación manual en navegador (recomendada, no bloqueante):
      pipeline end-to-end con texto real (varias páginas), indicadores
      visibles en los cortes, y auditoría AXE; jsdom no puede cubrir el
      flujo medido. Documentar hallazgos para specs futuras.

## Review

- [ ] `npm run lint` → PASS.
- [ ] `npm test` → PASS.
- [ ] `npm run build` → PASS.
- [ ] `npx prettier --write` sobre los archivos tocados (no repo-wide:
      `format:check` repo-wide ya falla por archivos preexistentes fuera
      de scope).
- [ ] `tasks.md` refleja el estado real.
- [ ] `MEMORY.md` actualizado (≤ 50 líneas) con las decisiones del seam.
- [ ] Sincronizar `AGENTS.md` (secciones por nombre): el overview de
      "Repository Overview" gana el motor de paginación y los
      indicadores; "Repository Structure" gana los archivos nuevos.
- [ ] Reportar archivos modificados, comandos ejecutados y resultado.
- [ ] NO iniciar `05-content-splitting`.
