# Document Model

## Status

Active implementation specification.

## Authority

This specification is subordinate to `docs/constitution.md`.
The constitution is authoritative if there is a conflict.

## Purpose

Establecer el modelo canónico del documento (tipos + defaults + validación)
y el contrato de exposición del Delta desde el wrapper de Quill, para que
las specs 02–04 tengan una base de tipos y un flujo Delta→app estables.

Esta spec NO implementa paginación, geometría, ni medición. Solo fija el
vocabulario del dominio y conecta el editor con la aplicación.

## Scope

- Definir los tipos del modelo de documento según `constitution.md` §3:
  `DocumentModel`, `DocumentSettings`, `PageSettings`, `PageMargins`,
  `HeaderSettings`, `FooterSettings`.
- Proveer valores por defecto válidos y una función de validación de
  settings.
- Migrar el wrapper de Quill de `src/app/common/components/editor/` a
  `src/app/common/editor/` (decisión de `docs/discovery.md` §5).
- Hacer que el wrapper **exponga el Delta** al exterior mediante la API
  moderna de Angular (`output()`), emitido en cada `text-change`.
- Corregir la limpieza falsa en `ngOnDestroy` del wrapper
  (`this.quill = undefined as unknown as Quill`) por una desconexión real
  de listeners.
- Actualizar los imports afectados por la migración (`home.ts` y su spec).
- Añadir tests unitarios puros para defaults y validación, y un test del
  wrapper que verifique que `deltaChange` emite.

## Architectural constraints

Heredados de la constitución. Se preservan explícitamente:

- Delta es el modelo canónico (RULE-003); el DOM no lo es (RULE-004).
- La paginación es estado derivado; no se implementa aquí (RULE-012).
- No se modifica el core de Quill (RULE-001/002).
- No se introduce `any` (RULE-018).
- TypeScript estricto; tipos explícitos para estructuras de Quill.
- Unidades de `PageMargins` en milímetros (RULE-009), consistente con
  `constitution.md` §3.4.

## Requirements

### REQ-01 — Tipos del modelo de documento

Bajo `src/app/common/document/` MUST existir:

- `DocumentModel` — compuesto por `content: Delta` y `settings: DocumentSettings`.
- `DocumentSettings` — compuesto por `page`, `margins`, `header`, `footer`.
- `PageSettings` — `{ size: 'A4' | 'LETTER' | 'LEGAL'; orientation: 'portrait' | 'landscape' }`.
- `PageMargins` — `{ top, right, bottom, left: number; unit: 'mm' }`.
- `HeaderSettings` / `FooterSettings` — `{ enabled: boolean; height: number; content?: Delta }`.

Los tipos MUST coincidir con `constitution.md` §3 y ser inmutables por
defecto (`readonly` donde aplique).

El tipo `Delta` MUST importarse desde `quill` (`import type { Delta } from 'quill'` — Quill 2.0.3 
lo re-exporta desde su core y coincide con el tipo de retorno de `getContents()`), nunca declarado localmente. 
Importar directamente de `quill-delta` exigiría declararlo en `package.json` (hoy es transitivo) y queda 
fuera de esta spec.

### REQ-02 — Defaults y validación

MUST existir un objeto de defaults `DEFAULT_DOCUMENT_SETTINGS` válido:

- `page`: A4, portrait.
- `margins`: valores razonables en mm (p. ej. 25 mm en los cuatro lados).
- `header` / `footer`: `enabled: false`, `height: 10` (mm) cada uno.

MUST existir una función `isValidDocumentSettings(settings): boolean` (o
equivalente con discriminante de error) que rechace:

- tamaños de página fuera del union literal,
- orientaciones fuera del union literal,
- márgenes negativos o no finitos,
- alturas de header/footer negativas.

La validación es **estructural** (literales, signos, finitud). La sanidad geométrica 
(márgenes que exceden las dimensiones de página, área útil ≤ 0) pertenece a `02-page-geometry` 
y MUST NOT implementarse aquí.

### REQ-03 — Migración del wrapper

El contenido de `src/app/common/components/editor/` MUST moverse a
`src/app/common/editor/` según `docs/discovery.md` §5.

- Los cuatro archivos (`editor.ts`, `editor.html`, `editor.scss`,
  `editor.spec.ts`) MUST moverse juntos.
- Los imports afectados (`home/pages/home/home.ts` y su spec si aplica)
  MUST actualizarse.
- El nombre de la clase `EditorComponent` MUST mantenerse (no renombrar
  a `Editor` en esta spec; ver `AGENTS.md` §3 actualizado).
- El selector `app-editor` MUST mantenerse.

### REQ-04 — Exposición del Delta

`EditorComponent` MUST exponer el Delta actual mediante la API moderna de
Angular:

- Un `output<Delta>()` llamado `deltaChange` que emita el contenido
  completo (`getContents()`) en cada `text-change`.
- La suscripción a `text-change` MUST registrarse después de instanciar
  Quill (en el ciclo de vida correcto).
- El `output` MUST declararse como `readonly`.

No se expone ningún otro estado (selection, cursor, etc.) en esta spec.

Nota: la emisión en cada `text-change` es intencional en esta spec. El scheduling/debounce pertenece 
a `04`/`10`; no introducir RxJS ni dependencias adicionales aquí.

### REQ-05 — Limpieza correcta

`ngOnDestroy` MUST desconectar la suscripción a `text-change` antes de
soltar la referencia al editor. La asignación falsa
`this.quill = undefined as unknown as Quill` MUST eliminarse.

No es requisito en esta spec destruir la instancia completa de Quill ni
desmontar el DOM; el foco es no dejar listeners colgando.

### REQ-06 — Tests

- Unit puros: `DEFAULT_DOCUMENT_SETTINGS` cumple la validación; la
  validación rechaza cada caso inválido de REQ-02.
- Verificación de compilación (no test unitario): el código nuevo compila 
  bajo `strict` sin `any`; se confirma vía `npm run lint` y `npm run build`.
- Componente: `EditorComponent` emite `deltaChange` tras un cambio de
  contenido en Quill. Se permite stubear Quill para evitar depender del
  DOM real en jsdom (patrón sugerido por la skill `quill-wrapper`).

### REQ-07 — NO avanzar a specs posteriores

Esta spec MUST NOT:

- Implementar geometría de página, conversión mm↔px, o cálculos de área.
- Implementar paginación o medición.
- Refactorizar el wrapper más allá de REQ-03/04/05 (no añadir `OnPush`,
  no quitar `standalone: true`, no añadir ARIA, no cambiar `::ng-deep`).
  Esos cambios pertenecen a `03-visual-pages`.

## Acceptance criteria

- Existen los tipos de REQ-01 en `src/app/common/document/`.
- Existe `DEFAULT_DOCUMENT_SETTINGS` válido y la validación de REQ-02.
- El wrapper vive en `src/app/common/editor/` y sus imports están
  actualizados (REQ-03).
- `EditorComponent` expone `deltaChange: output<Delta>()` (REQ-04).
- `ngOnDestroy` no contiene la asignación falsa (REQ-05).
- Tests de REQ-06 pasan.
- `npm run lint`, `npm test` y `npm run build` pasan.
- No se introdujo código de paginación, geometría o medición.
- No se tocó `eslint.config.mjs`, `tsconfig*.json`, `angular.json` ni
  `package.json`.
- Delta canónico intacto; no se pierde contenido; no se modifica core de
  Quill.

## Out of scope

- `UnitConverter` y geometría física (spec 02).
- Servicios de paginación, medición y layout (specs 02, 04).
- Refactor de convenciones del wrapper (spec 03).
- Blots custom (spec 07).
- Cualquier cosa relacionada con PDF (spec 09).
- Introducción de dependencias nuevas.
- Renombrar `EditorComponent` a `Editor`.