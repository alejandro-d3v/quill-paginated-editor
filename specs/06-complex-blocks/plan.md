# Complex Blocks — Plan

## Objective

Clasificar los bloques por tipo y completar el soporte del motor para el
contenido complejo que el toolbar ya produce — listas divisibles por
ítem, blockquote/code-block divisibles por línea, imágenes medidas tras
cargar — con el motor `paginate` SIN cambios: la unidad de corte la fija
la medición según el tipo.

## Deliverable

Modificados:

- `src/app/common/pagination/block.ts` — `BlockKind`.
- `src/app/common/pagination/extract-blocks.ts` — `blockKind()` puro +
  `isSplittableBlock` redefinido sobre la matriz.
- `src/app/common/pagination/extract-blocks.spec.ts` — tests de
  clasificación + 3 updates declarados de 05.
- `src/app/common/pagination/measurement.ts` — unidades por tipo
  (`<li>` vs líneas de texto) + `imagesReady`.
- `src/app/common/pagination/measurement.spec.ts` — fixtures `<ol>`,
  blockquote/code-block, `imagesReady`; regresión 04/05.
- `src/app/common/pagination/paginate.spec.ts` — UN fixture end-to-end
  de lista divisible (el motor no cambia; se prueba la unidad).
- `src/app/home/pages/home/home.ts` — gate `imagesReady` + listener
  delegado en captura (`load`/`error`) que dispara la recomputación.

SIN cambios: `paginate.ts` (verificación por diff), `home.html`,
componentes de vista, wrapper.

## Approach

1. Leer constitution §6 (soporte progresivo), §7.3, §13; discovery §4
   (extensión "tipo de bloque"), §7 (tablas fuera; regla indivisible),
   §10 (riesgo #7: el toolbar ya produce contenido complejo), §11; specs
   04–05 (seam implementado); AGENTS.md por nombre de sección.
2. Confirmar dependencias: 05 implementada (`9b730c6`) — `blockKind`
   opera sobre el `Block.ops` que 04 produce; línea base verde.
3. Añadir `BlockKind` a `block.ts` y `blockKind()` a `extract-blocks.ts`
   (precedencia de atributos del terminador; `align`/`indent` no cambian
   el tipo).
4. Redefinir `isSplittableBlock` sobre la matriz; actualizar los 3 tests
   de 05 (list/blockquote/code-block → divisibles) — únicos cambios
   sancionados a la suite previa.
5. Extender `MeasurementService`: unidades `<li>` para bloques list
   (offsets entre ítems; regla de cierre de 05 intacta); líneas de texto
   para blockquote/code-block (camino de párrafo); `imagesReady`
   (`complete` de todos los `<img>` del contenedor).
6. Extender `measurement.spec`: fixture `<ol>` con `<li>` stubbeados
   (sum === heightPx, minFragment = primer ítem); blockquote/pre;
   imagesReady; regresión.
7. Añadir el fixture de lista divisible a `paginate.spec` (unidades
   `[50,20,50]` con 100 → corte en frontera de ítem + invariant de
   reconstrucción).
8. Cablear `home`: no recomputar mientras `!imagesReady`; listener en
   captura sobre el elemento del editor incrementando un signal que el
   efecto lee.
9. `npm test`, `npm run lint`, `npm run build`; `npx prettier --write`
   sobre los tocados. Verificar por diff: `paginate.ts` intacto, suite
   previa con solo los 3 updates. Actualizar `tasks.md`/`MEMORY.md`/
   `AGENTS.md`. Verificación manual en navegador: listas largas
   cortándose entre ítems, blockquote cortándose, imagen pegada con URL
   → layout aparece al cargar (hallazgos para 10).

## Design constraints

- La unidad de corte la fija la MEDICIÓN según el tipo; el motor
  consume `lineHeightsPx` genéricamente y NO cambia (RULE-019).
- Clasificación pura (RULE-006): `blockKind` sin Angular/DOM; el DOM
  (`<li>`, Range) vive solo en `measurement.ts`.
- RULE-010: unidades medidas del render (offsets de `<li>`, line boxes)
  — jamás conteo de caracteres.
- A1/RULE-012: descriptores `lineRange` (índices de `<li>` para listas);
  Delta, DOM del editor y vista sin reestructurar.
- Imágenes: medir solo geometría ya renderizada (`complete === true`);
  el error de carga también habilita (URLs rotas no cuelgan el flujo).
- Updates a la suite previa: SOLO los 3 declarados (RULE-020 con
  sanción de alcance); cualquier otro cambio es regresión.
- Sin `any` (RULE-018); sin deps (RULE-017).

## Risks

- **Listas anidadas (`indent`):** los `<li>` anidados deben contar
  dentro del flujo del `<li>` padre y el `<ol>` anidado no debe romper la
  alineación 1:1 (run fusionado = un hijo). Mitigación: fixture de
  conteo con lista anidada en `measurement.spec` si jsdom lo permite;
  verificación manual explícita en navegador; la regla indivisible
  preserva contenido ante cualquier desalineo (fail-fast de 04).
- **`<li>` con márgenes/paddings propios:** la técnica de
  diferencia-de-offsets los absorbe (regla de cierre de 05, idéntica).
- **jsdom no carga imágenes reales:** `imagesReady` se testea con DOM
  manual (`complete` true/false por atributo); el flujo con carga real
  queda en la verificación manual.
- **Los 3 updates de 05 son semántica cambiada:** revisar que no
  enmascaren regresiones — el diff de la suite previa debe mostrar
  exactamente 3 cambios de expectativa, nada más.
- **`<pre>` con scroll interno:** un code-block larguísimo podría
  renderizar con scroll en vez de crecer; verificación manual y, si
  ocurre, el bloque desborda atómicamente (indivisible fallback) sin
  perder contenido (RULE-011).

## Verification

`06-complex-blocks` está completa cuando:

- REQ-01..REQ-05 implementados y REQ-06 respetado.
- `paginate.ts` sin cambios (diff) y el fixture de lista divide en
  fronteras de ítem con el invariant de reconstrucción en verde.
- Suite completa pasa; diff de la suite previa = exactamente los 3
  updates declarados.
- `npm run lint`, `npm test` y `npm run build` pasan; config intacta.
- `tasks.md` refleja el estado y `MEMORY.md` queda actualizado con las
  decisiones (unidad-li, matriz de divisibilidad, imágenes async).
