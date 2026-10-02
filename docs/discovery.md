# Discovery — quill-paginated-editor

**Spec:** `specs/00-discovery` · **Fase constitucional:** §15, Phase 0
**Fecha:** 2026-10-02 · **Estado:** Completa (línea base verde; cinco decisiones cerradas)

Reporte de descubrimiento del repositorio antes de iniciar la implementación spec-driven
(specs 01–11). Producido según `specs/00-discovery/spec.md` (REQ-01..REQ-07) y el checklist
de inspección de `docs/constitution.md` §14. Los comandos de línea base se ejecutaron
realmente el 2026-10-02; resultados exactos en §9.

---

## 1. Estado actual del repositorio

### 1.1 Versiones instaladas

| Paquete                                                                | Declarado | Instalado | Notas                                                                                                              |
| ---------------------------------------------------------------------- | --------- | --------- | ------------------------------------------------------------------------------------------------------------------ |
| `@angular/*` (core, common, compiler, forms, platform-browser, router) | ^21.2.0   | 21.2.25   | Standalone + signals. **Zoneless:** no existe `zone.js` instalado.                                                 |
| `@angular/cli` / `@angular/build`                                      | ^21.2.24  | 21.2.24   | Builder `@angular/build:application` (esbuild).                                                                    |
| `quill`                                                                | ^2.0.3    | **2.0.3** | Snow CSS registrado globalmente en `angular.json`.                                                                 |
| `typescript`                                                           | ~5.9.2    | 5.9.3     | `strict` + opciones estrictas del compilador Angular.                                                              |
| `rxjs`                                                                 | ~7.8      | 7.8       | Apenas usado.                                                                                                      |
| `vitest`                                                               | ^4.0.8    | 4.1.11    | Con `jsdom` ^28; globals (`describe`/`it`/`expect`) vía `tsconfig.spec.json`.                                      |
| `eslint`                                                               | ^10.11.0  | 10.x      | + angular-eslint 22.5 (`strictTypeChecked`/`stylisticTypeChecked`), simple-import-sort 14, eslint-config-prettier. |
| `prettier`                                                             | ^3.9.9    | 3.9       | 100 columnas, comillas simples, LF.                                                                                |
| `npm` (`packageManager`)                                               | 10.9.3    | —         | Gestor requerido; no introducir otros.                                                                             |

### 1.2 Estructura de `src/`

```
src/
├── index.html / main.ts / styles.scss (vacío)
└── app/
    ├── app.ts|html|scss|spec.ts   # App (app-root): solo <router-outlet />; signal title sin uso
    ├── app.config.ts               # provideBrowserGlobalErrorListeners + provideRouter
    ├── app.routes.ts               # loadChildren → home; '**' → ''
    ├── common/components/editor/   # EditorComponent — wrapper de Quill (única integración)
    └── home/                       # home.routes.ts (HOME_ROUTES) + pages/home/ (usa <app-editor />)
```

No existe: modelo de documento, geometría, paginación, medición, PDF, Blots ni módulos
custom, servicios de ningún tipo. Rutas lazy correctas (`loadChildren`/`loadComponent`).
Sin backend ni `provideHttpClient`; sin environment files.

### 1.3 Estado del wrapper de Quill (`common/components/editor/editor.ts`)

- Clase `EditorComponent` (selector `app-editor`); `standalone: true` explícito
  (redundante en v21), `imports: []` vacío, sin `OnPush`.
- `@ViewChild('editor', { static: true })` (no signal query) e instancia de Quill creada en
  `ngAfterViewInit` con `{ theme: 'snow', placeholder: 'Escribe aquí...', toolbar: [...] }` —
  ciclo de vida correcto (contenido solo tras la vista).
- El toolbar habilita: headers 1–3, bold/italic/underline/strike, color/background,
  listas ordered/bullet, align, **blockquote**, **code-block**, link, **image**, clean.
  → El Delta real ya puede contener hoy todos estos tipos de bloque (relevante para 04, §7).
- `ngOnDestroy` con limpieza falsa: `this.quill = undefined as unknown as Quill`
  (no desconecta listeners; double-cast contrario al espíritu de RULE-018).
- **No expone Delta:** sin suscripción `text-change`, sin `output()` ni signal. El
  contenido no sale del componente. Es el punto de integración de 01 (riesgo #1, §10).
- Sin ARIA en el contenedor del editor (`role="textbox"`, `aria-label`, `aria-multiline`).
- `editor.scss` sobreescribe `.ql-*` con `::ng-deep` (Snow CSS ya es global; anti-patrón).

**Deuda conocida del wrapper** (se toca en 01 solo lo estrictamente necesario — RULE-019):
`standalone: true`, `imports: []`, sin OnPush, `@ViewChild`, cleanup falsa, sin ARIA,
`::ng-deep`, y sufijo `Component` en el nombre de la clase (AGENTS.md §3 dice sin sufijo;
el usuario decidió mantener `EditorComponent` y corregir el spec — ratificar en 01, §10).

### 1.4 Otra deuda conocida

- Alias `@common` reservado en `eslint.config.mjs` (grupo de import-sort) pero **sin
  `paths` en `tsconfig.json`** → no resuelve; usar imports relativos.
- `temp/pagination-spec/SKILL.md` vive fuera de `.agents/skills/` y de `skills-lock.json`.
- Referencias cruzadas rotas en skills/commands tras el renumbering de `AGENTS.md` (§8).
- ESLint excluye `**/*.spec.ts` del linting (calidad de specs bajo responsabilidad manual).

## 2. Arquitectura objetivo

Según constitución §4, P-II y P-III:

```
Quill (editor continuo — decisión A1, §3)
   │  text-change
   ▼
Delta ◄── modelo canónico (RULE-003); el DOM nunca es fuente de verdad (RULE-004)
   │
   ▼
Document Model (01: DocumentModel + DocumentSettings)
   │
   ▼
Pagination Engine (02: geometría · 04: paginate() · 05: cortes)  → estado derivado (RULE-012)
   │
   ▼
LayoutDocument
   ├──► Overlay de páginas (vista Angular, 03)   ──┐ misma geometría,
   └──► PDF Renderer (09, sin Quill vivo — RULE-007) ──┘ consistencia (P-IV, §12)
```

- La paginación se recalcula desde Delta + settings; nunca se reescribe Delta para
  representar páginas (RULE-012).
- El motor debe ser testeable sin Angular y sin DOM (RULE-006) → seam de §4.

## 3. Decisión REQ-01 — Modelo de edición paginada

**Decisión: A1 — editor continuo + overlay visual de páginas.**

| Opción | Descripción                                                                                                          | Estado                   |
| ------ | -------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| A1     | Editor Quill continuo; un overlay dibuja marcos de página e indicadores de corte posicionados según `LayoutDocument` | **Elegida (MVP)**        |
| A2     | Split del DOM de Quill en contenedores por página                                                                    | Rechazada por defecto    |
| A3     | Editor oculto + páginas renderizadas desde Delta                                                                     | Evolución futura, no MVP |

**Qué es A1:** el usuario edita en una única superficie continua de Quill. El motor calcula
dónde caen los límites de página (`LayoutDocument`); la vista (03) dibuja sobre esa
superficie un overlay con marcos de página (dimensiones, márgenes y áreas reservadas de
header/footer desde 02) e indicadores de salto en los offsets calculados. El DOM del editor
**jamás se reestructura**.

**Justificación frente a la constitución:**

- **RULE-003 (Delta canónico):** el overlay solo lee `LayoutDocument`; el contenido nunca
  se reescribe para paginar.
- **RULE-004 (DOM no canónico):** los cortes son datos derivados, recalculados por cambio de
  contenido o settings; el DOM del editor no es la fuente de verdad del layout.
- **RULE-012 (paginación no destructiva):** los límites viven como metadatos en
  `LayoutDocument`, no como ediciones del Delta.
- **RULE-015 (evitar reconstrucción de DOM):** no se mueven, clonan ni particionan nodos del
  editor; solo se posicionan decoraciones de overlay. Argumento principal contra A2.
- **RULE-020 (preservar comportamiento del editor):** selección, cursor, undo/redo,
  clipboard e IME quedan intactos porque el editor es un Quill normal. A2 rompería el stack
  de undo, la selección multi-página y el cursor al fragmentar el DOM vivo (además de
  acercarse a internals de Quill, P-I/RULE-001); la justificación que exigiría §19 no existe.

**Consecuencia para 05:** bajo A1, "splitting" no divide físicamente el contenido en el
editor: calcula **descriptores de corte** (en qué línea/altura cae el límite dentro de un
bloque divisible). La división física solo materializa en renderizadores derivados
(PDF en 09; A3 si evoluciona).

**Consecuencias por spec:**

- **03:** contenedor de páginas + overlay (marcos, áreas reservadas, indicadores) consumiendo
  geometría de 02. No toca el DOM de Quill.
- **04:** motor headless: `extractBlocks(Delta)` + `MeasurementService` (mide la superficie
  continua o un contenedor de medición) + `paginate()` → `LayoutDocument`; la vista posiciona
  el overlay desde `LayoutDocument`.
- **05:** cortes a nivel de línea dentro de bloques divisibles → descriptores en
  `LayoutDocument`; el Delta subyacente permanece continuo.

**A3 como evolución, no MVP:** A3 es exactamente el renderizador que 09-PDF necesita
(contenido desde Delta, sin Quill vivo, RULE-007); sus piezas se construirán de todos modos.
Como superficie de edición se evalúa después del MVP: duplica el renderizado y degrada la
experiencia de edición hoy.

## 4. Decisión REQ-02 — Seam de medición

**Contrato del motor (función pura):**

```ts
paginate(measuredBlocks: readonly MeasuredBlock[], geometry: PageGeometry): LayoutDocument
```

Determinista, sin DOM, sin estado de Angular, no destructiva con su entrada
(RULE-005, RULE-006 y §6 de la constitución).

**`MeasuredBlock` — contrato conceptual mínimo:**

```ts
interface MeasuredBlock {
  /** Identidad estable: correlaciona el bloque con su origen en el Delta. */
  id: BlockId;
  /** Altura renderizada en px CSS, ya medida por la capa de browser. */
  heightPx: number;
  /** Si el bloque puede continuar en la página siguiente. */
  splittable: boolean;
  /** Altura mínima de un fragmento al dividir (huérfanas/viudas). Diferido a 05. */
  minFragmentHeightPx?: number;
}
```

Extensiones previstas sin definir hoy: bandera de salto manual (07), tipo de bloque para
reglas específicas (06). El contrato evoluciona en el plan de cada spec.

**`MeasurementService` (Angular, browser-only):**

- Entrada: bloques extraídos del Delta (`extractBlocks`, pura) + settings.
- Responsabilidad: producir `MeasuredBlock[]` — ubica los bloques en una superficie medible
  (el propio editor continuo bajo A1, o un contenedor de medición oculto), **agrupa las
  lecturas** (`getBoundingClientRect` en una sola pasada, sin intercalar escrituras → sin
  layout thrashing), soporta medición asíncrona (imágenes, 06) y cachea solo cuando sea
  seguro (10).
- NO toma decisiones de paginación: mide y devuelve números.

**Por qué esta separación (RULE-006 + jsdom):** jsdom no tiene motor de layout:
`getBoundingClientRect` devuelve 0. Si el motor midiera DOM directamente, sus tests serían
ciegos bajo `npm test`. Consumiendo alturas ya medidas, los tests alimentan números
sintéticos y verifican determinismo, invariante de contenido y cortes sin navegador. El
motor queda además reutilizable por el PDF (misma entrada, RULE-007).

**Flujo completo:**

```
Quill (editor continuo, A1)
   │ text-change
   ▼
Delta (canónico — RULE-003)
   │ extractBlocks()             [pura — 04]
   ▼
Blocks ──► MeasurementService    [Angular, browser-only — 04]
   │        MeasuredBlock[]
   ▼
paginate(measuredBlocks, geometry)   [pura — 04, RULE-006]
   │
   ▼
LayoutDocument (derivado — RULE-012)
   ├──► Overlay de páginas (03)
   └──► PDF Renderer (09 — RULE-007)
```

## 5. Decisión REQ-03 — Estructura de carpetas

**Propuesta** (coherente con los boundaries de constitución §4 — editor / document /
pagination / pdf / ui — y con el estado actual del repositorio):

```
src/app/
├── app.ts|html|scss|spec            # shell raíz (no cambia)
├── app.config.ts / app.routes.ts     # providers y rutas (no cambian)
├── common/
│   ├── document/                     # NUEVA (01): DocumentModel, DocumentSettings, defaults + tests
│   ├── pagination/                   # NUEVA (02): unit-converter, page-geometry + tests
│   │                                 #   (04): extractBlocks, paginate, LayoutDocument, invariants
│   │                                 #   (05): split descriptors
│   ├── pdf/                          # NUEVA (09): renderer (no se crea antes)
│   ├── editor/                       # NUEVA (01, por migración): wrapper de Quill
│   └── components/                   # UI compartida (03): contenedor de páginas, marco de página, overlay
└── home/                             # feature UI (no se mueve)
```

- **Carpetas nuevas:** `common/document/` (01), `common/pagination/` (02),
  `common/pdf/` (09), `common/editor/` (01, por migración).
- **Código existente que migra:** `common/components/editor/editor.{ts,html,scss,spec.ts}`
  → `common/editor/` en la spec **01**. Razón: el wrapper es infraestructura del dominio
  editor (boundary de constitución §4), no un componente UI compartido; hoy solo un import
  externo lo referencia (`home/pages/home/home.ts`) más su spec colocado, así que el cambio
  es mecánico. Alternativa considerada (dejarlo donde está) rechazada: hacerlo después
  encarece el churn de imports a medida que crece el árbol.
- **Qué NO se mueve:** `app/`, `home/`, `app.config.ts`, `app.routes.ts`, `styles.scss`,
  `index.html`, `public/`. Config (`angular.json`, `tsconfig*.json`, `eslint.config.mjs`,
  `package.json`) intacta salvo aprobación explícita.
- El boundary `ui/` de constitución §4 se mapea a: `home/` (feature consumidora) +
  `common/components/` (overlay de páginas, 03).
- Nota: la skill `angular-scaffold` referencia `common/components/<name>/` y
  `common/services/<name>.ts`; quedará desactualizada con esta estructura — listada en §8,
  no corregida en esta spec.

## 6. Decisión REQ-04 — Estrategia PDF

**La decisión tecnológica final se toma en `09-pdf`** (tarea de planificación con
justificación documentada, RULE-017). Esta spec fija los criterios y excluye caminos inválidos.

**Criterios de selección para 09:**

1. Cliente-first: sin servidor (no existe backend; RULE-007 exige independencia del editor).
2. Render desde `LayoutDocument` + `DocumentSettings`; **jamás** desde snapshot del DOM
   (P-IV; prohíbe el camino html2canvas).
3. Licencia permisiva (MIT/Apache-2.0).
4. Presupuesto: carga lazy en la acción de exportar (dynamic import), nunca en el bundle
   inicial (warn 500 kB).
5. Fidelidad: tamaños, orientación, márgenes, numeración, texto e imágenes soportadas.
6. Mantenimiento activo y compatibilidad con el build (CommonJS tolerable vía
   `allowedCommonJsDependencies` justificado).

**Candidatos considerados:**

| Candidato                             | Notas                                                                                                                                                                            |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pdf-lib`                             | Bajo nivel, control total desde `LayoutDocument`, puro JS sin DOM → encaja con RULE-007. Costo: wrapping de texto manual.                                                        |
| `jsPDF`                               | APIs de texto comparables; el camino html2canvas (snapshot de DOM) queda **rechazado** (P-IV/RULE-007).                                                                          |
| `pdfmake`                             | Declarativo y cómodo; más pesado; fuentes embebidas aumentan bundle; evaluar carga lazy.                                                                                         |
| `window.print()` + CSS `@media print` | Cero dependencias, pero el navegador pagina por su cuenta (no consume `LayoutDocument`) → rompe la consistencia P-IV/§12; solo como export manual interino, no contrato del MVP. |
| Servidor                              | Descartado: no hay backend en el alcance del repositorio.                                                                                                                        |

**Por qué puede diferirse sin bloquear 01–08:** 09 consume exclusivamente `LayoutDocument` +
`DocumentSettings`, contrato estabilizado por 01/02/04. Ninguna spec 01–08 depende de la
tecnología de PDF; la decisión no cambia su trabajo.

## 7. Decisión REQ-05 — Estrategia de tablas

- **Verificado:** `quill@2.0.3` core **no incluye tablas**; el toolbar actual no las ofrece;
  no hay módulo de tablas instalado. Soportar tablas exige módulo externo o custom Blots
  costosos (decisión sujeta a RULE-017).
- **Decisión:** las tablas **NO entran en `06-complex-blocks`**. 06 cubre: clasificación de
  bloques, imágenes, listas (ordered/bullet), blockquotes y code blocks (todos ya
  producibles por el toolbar actual) + reglas de medición y splitting específicas.
- **Regla por defecto del motor para bloques desconocidos/no soportados:** **indivisible** —
  pasa entero a la página siguiente; si su altura excede la página, se renderiza desbordando
  en su propia página. Nunca se pierde ni descarta contenido (RULE-011). Es parte de las
  invariants del motor desde 04.
- **Reevaluación:** spec futura `06b-tables` o descope documentado en el roadmap.
  Prerrequisitos: decisión módulo externo vs custom Blots (RULE-017) y motor maduro
  (05/06 completos). Si se persigue, 06b debe preceder a 09 para que el PDF reclame
  consistencia sobre lo soportado.

## 8. Referencias cruzadas rotas (REQ-06)

Producto del renumbering de `AGENTS.md` (commit `fd35e32`). Numeración vigente: §8
TypeScript, §9 Angular, §12 Quill, §13 UI/Seguridad, §15 Infra/Testing, §16 Comandos,
§18 Checklist. **Solo listar; no se corrigen en esta spec.**

| Archivo                                    | Referencias desfasadas                                                                                                                                                                                                                                        |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.agents/skills/quill-wrapper/SKILL.md`    | "§11" (Quill → §12) en description y guardarraíles; "(§12 Security)" (→ §13); "(§1.3)" (la lista de extensión APIs→Blots vive en §12); "(§12)" en accesibilidad (→ §13); "§15" comandos (→ §16). Correctas: "§1.2", "§1.4".                                   |
| `.agents/skills/preflight-audit/SKILL.md`  | Description: "§7" (TS → §8), "§8" (Angular → §9), "§11" (Quill → §12), "§17" (checklist → §18), "§15" (comandos → §16). Body: "§15" (→ §16), "§17" (→ §18), "§13" presupuestos (→ §14), "§13" spec obsoleta (→ §15), "§7" TS (→ §8), "§17" checklist (→ §18). |
| `.agents/skills/angular-scaffold/SKILL.md` | "§8" (Angular rules → §9) en description y "(§8)" DI (→ §9); "§15" validación (→ §16). Correcta: "§3" estructura.                                                                                                                                             |
| `.agents/skills/memory-sync/SKILL.md`      | "AGENTS.md §5 (Memoria)": las reglas de sesión viven en el encabezado de `AGENTS.md` ("Session start/end") y §18; §5 es Agent Behavior.                                                                                                                       |
| `.opencode/commands/feature.md`            | "§7 (TypeScript)" (→ §8), "§8 (Angular v21)" (→ §9), "§11 (Quill)" (→ §12), "§15 (comandos reales)" (→ §16). Correctas: §1, §6, "§1 y §4", "§5" (Response format).                                                                                            |
| `temp/pagination-spec/SKILL.md`            | "§13 (Vitest + jsdom)" (Testing → §15). Además vive fuera de `.agents/skills/` y de `skills-lock.json` (ubicación inconsistente: mover o eliminar, pendiente de decisión).                                                                                    |

Nota: la skill `systematic-debugging` fue eliminada del árbol de trabajo (contenía
`condition-based-waiting-example.ts`, causa del error de lint de la línea base previa);
queda fuera de este listado.

## 9. Línea base (REQ-07)

Comandos ejecutados realmente el **2026-10-02** (hora local 20:23–20:24), sobre el árbol de
trabajo que incluye los arreglos previos del usuario aún sin commitear:

| Comando         | Resultado | Detalle                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`  | **PASS**  | 0 errores, 0 warnings.                                                                                                                                                                                                                                                                                                                                                                   |
| `npm test`      | **PASS**  | 3 archivos, 3 tests (`App`, `Home`, `Editor`).                                                                                                                                                                                                                                                                                                                                           |
| `npm run build` | **PASS**  | Initial 220.80 kB raw / 57.81 kB transfer (presupuesto warn 500 kB / error 1 MB — margen amplio). Lazy: `home` 206.35 kB (contiene Quill), `home-routes` 136 B. **Warning:** `quill-delta` (usado por `quill/core.js`) no es ESM → posible bailout de optimización; mitigación futura `allowedCommonJsDependencies` con justificación (cambio de config: requiere aprobación explícita). |

Arreglos previos de la línea base (hechos por el usuario antes de esta spec; verificados
al producir este reporte):

- `editor.spec.ts`: import corregido (`Editor` → `EditorComponent`) — antes el error TS2305
  bloqueaba la compilación de toda la suite.
- `app.spec.ts`: eliminada la aserción stale sobre un `<h1>` inexistente.
- `home.html`: `<app-editor></app-editor>` → `<app-editor />` (warning de self-closing).
- Skill `systematic-debugging` eliminada: su `condition-based-waiting-example.ts` (fuera de
  todo tsconfig project) causaba el error de `eslint .`.

Esta spec no requirió ningún arreglo adicional: **cero cambios de código de producción**
por `00-discovery` (criterio de aceptación).

## 10. Riesgos y decisiones diferidas

**Riesgos para 01–04:**

1. **Exposición de Delta (bloqueante para 03/04):** el wrapper no emite nada; 01 debe añadir
   el contrato (Delta por `output()`/signal en `text-change` — skill `quill-wrapper`).
2. **Deuda del wrapper vs. RULE-019:** `standalone: true`, `imports: []`, sin OnPush,
   `@ViewChild`, cleanup falsa, sin ARIA, `::ng-deep`, sufijo `Component`. En 01 se toca
   solo lo estrictamente necesario para exponer Delta; el resto se ataca cuando su spec lo
   requiera (03: ARIA/OnPush al integrar el overlay).
3. **Nombre de la clase:** `EditorComponent` vs AGENTS.md §3 ("sin sufijo"). El usuario
   mantuvo el nombre y corregió el spec; ratificar en el plan de 01 (mantener + actualizar
   AGENTS.md §3, o renombrar durante el refactor de 01). No renombrar en masa por defecto.
4. **Bucle de reactividad zoneless:** medir → signals → CD → medir. El pipeline de 04 debe
   ejecutarse con guardas (scheduler / un paso por frame); 10 optimiza después.
5. **Layout thrashing:** `MeasurementService` debe agrupar lecturas antes de escribir
   (diseño de 04, §4 de este reporte).
6. **Invalidación:** 04 debe definir qué se recalcula por cambio para que 10 no sea un
   retrofit del motor.
7. **Contenido fuera de scope MVP:** el toolbar ya produce listas/imágenes/blockquotes/
   code-blocks → la regla por defecto indivisible (§7) es obligatoria desde el primer día de 04.
8. **Medición asíncrona (imágenes, 06) y cacheo (10)** sobre el mismo seam: diseñar el
   contrato para que ambos quepan sin reescribirlo.

**Decisiones diferidas:**

| Decisión                                                                      | Dónde se cierra                      |
| ----------------------------------------------------------------------------- | ------------------------------------ |
| Tecnología PDF                                                                | 09 (criterios en §6)                 |
| Tablas (06b o descope)                                                        | Tras 06; antes de 09 si se persiguen |
| Virtualización de páginas para docs grandes (100–500 págs.)                   | 10 (o descope documentado)           |
| Widows/orphans (`minFragmentHeightPx`)                                        | 05                                   |
| Render del contenido de header/footer (tokens estáticos vs Delta)             | 08                                   |
| Corrección de referencias cruzadas (§8) y ubicación de `temp/pagination-spec` | Aprobación del usuario               |

## 11. Orden de implementación confirmado

```
00-discovery ──► 01-document-model ──► 02-page-geometry ──► 03-visual-pages
      ──► 04-pagination-mvp ──► 05-content-splitting ──► 06-complex-blocks (SIN tablas)
      ──► 07-manual-page-breaks ──► 08-header-footer ──► [06b-tables, si se persigue]
      ──► 09-pdf ──► 10-performance ──► 11-testing
```

- El orden **00 → 01 → … → 11 queda confirmado** (coincide con constitución §15, Phase 0–10).
- **06 excluye tablas** (§7); si se persiguen, `06b-tables` se inserta antes de 09 para que
  el PDF reclame consistencia sobre lo soportado, o se descarta con decisión documentada.
- **11 se reinterpreta como "infraestructura de testing + auditoría de cobertura"**, no
  "dónde se escriben los tests": los tests viven con cada feature (RULE-016); 04 crea la
  invariants suite compartida; 11 consolida harness de rendimiento, fixtures y auditoría.
- **10** después de 09 (constitución Phase 10), con harness de benchmarks; los seams que 10
  necesita (invalidación, medición agrupada, contrato puro) quedan definidos en 04 (§4).
- Una spec a la vez (AGENTS.md §7.2): al completar 00, parar y reportar; no iniciar 01
  automáticamente.
