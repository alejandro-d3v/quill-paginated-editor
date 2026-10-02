# Project Discovery — Plan

## Objective

Producir `docs/discovery.md` con el estado real del repositorio y las
cinco decisiones arquitectónicas que desbloquean la implementación de
`01`–`04`, sin tocar código de producción más allá de lo que la línea
base exija.

## Deliverable

Un único archivo: `docs/discovery.md`.

Opcionalmente, si la línea base no está verde: cambios mínimos en los
archivos que impidan `lint`/`test`/`build` (reportados explícitamente).

## Approach

1. Verificar la línea base (`lint`, `test`, `build`) y registrar el
   resultado exacto. No corregir nada hasta tener el diagnóstico.
2. Si hay que corregir algo, corregir **solo lo mínimo** y volver a
   verificar.
3. Inspeccionar el repositorio siguiendo `constitution.md` §14:
   - versión Angular y Quill (`package.json`),
   - integración de Quill (`common/components/editor/`),
   - manejo de Delta (hoy: ninguno),
   - modelos de documento (hoy: ninguno),
   - PDF (hoy: ninguno),
   - Blots/módulos custom (hoy: ninguno),
   - estilos (Quill Snow global + `editor.scss`),
   - tests existentes (`app.spec.ts`, `editor.spec.ts`, `home.spec.ts`),
   - abstracciones reutilizables,
   - archivos que no deben tocarse.
4. Producir `docs/discovery.md` con la estructura de abajo.
5. Actualizar `MEMORY.md` (estado + decisiones abiertas).
6. Reportar.

## Structure of `docs/discovery.md`

```
# Discovery — quill-paginated-editor

## 1. Estado actual del repositorio
   - Versiones (Angular, Quill, TS, ESLint, Vitest).
   - Estructura actual de src/app/.
   - Estado del wrapper de Quill (editor.ts).
   - Estado de tests, lint y build (comandos ejecutados + resultado).
   - Deuda conocida (referencias cruzadas rotas, spec stale, etc.).

## 2. Arquitectura objetivo
   - Diagrama Quill → Delta → Document Model → Pagination → {View, PDF}.
   - Aclaración de que Delta es canónico y paginación es derivada.

## 3. Decisión REQ-01 — Modelo de edición paginada
   - Opciones A1/A2/A3.
   - Decisión: A1 (editor continuo + overlay visual).
   - Justificación vs. RULE-003/004/012/015/020.
   - Consecuencia para 03/04/05.
   - A3 como evolución futura, no MVP.

## 4. Decisión REQ-02 — Seam de medición
   - Contrato: paginate(measuredBlocks, geometry): LayoutDocument.
   - Interfaz conceptual de MeasuredBlock.
   - Responsabilidad de MeasurementService (Angular, browser).
   - Por qué esto hace testeable el motor en jsdom.
   - Diagrama de flujo: Quill → Delta → extractBlocks → MeasurementService
     → MeasuredBlock[] → paginate() → LayoutDocument → {View, PDF}.

## 5. Decisión REQ-03 — Estructura de carpetas
   - Propuesta: src/app/common/{document,pagination,pdf,editor}.
   - Migración de editor: en 01 se mueve de common/components/editor a
     common/editor (o se deja y se documenta por qué no mover).
   - Qué NO se mueve ahora.

## 6. Decisión REQ-04 — Estrategia PDF
   - Diferida a 09.
   - Criterios de selección.
   - Candidatos y notas.
   - Por qué puede diferirse.

## 7. Decisión REQ-05 — Estrategia de tablas
   - Quill 2 core no incluye tablas.
   - 06 NO incluye tablas.
   - Regla por defecto para bloques desconocidos: indivisible, no se pierde.
   - Reevaluación futura.

## 8. Referencias cruzadas rotas (REQ-06)
   - Lista de archivos y secciones desactualizadas.
   - No se corrigen en esta spec.

## 9. Línea base (REQ-07)
   - Comando, resultado, warnings.
   - Si hubo que corregir algo, qué y por qué.

## 10. Riesgos y decisiones diferidas
   - Riesgos arquitectónicos pendientes para 01–04.
   - Decisiones diferidas (PDF, tablas, virtualización, widows/orphans).

## 11. Orden de implementación confirmado
   - 00 → 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11.
   - Con la nota de que 06 excluye tablas y 11 se reinterpreta como
     "infraestructura + auditoría", no "los tests".
```

## Design constraints

- No se introduce código de producción en esta spec.
- No se elige todavía librería PDF ni se añade dependencia.
- No se refactoriza `editor.ts` salvo lo mínimo para que la línea base
  esté verde.
- No se corrigen referencias cruzadas de skills; solo se listan.

## Risks

- Que la línea base no esté verde y la spec derive en trabajo de
  arreglo. Mitigación: el usuario ya la dejó verde; si vuelve a romperse,
  parar y reportar.
- Que el reporte derive en diseño detallado. Mitigación: el reporte
  documenta decisiones, no implementaciones.
- Que la decisión A1 se cuestione más adelante. Mitigación: documentar
  explícitamente por qué A2/A3 quedan fuera de MVP.

## Verification

`00-discovery` está completa cuando:

- existe `docs/discovery.md` con las 11 secciones,
- las cinco decisiones están cerradas y justificadas,
- la línea base está verde y registrada,
- `MEMORY.md` está actualizado,
- no se ha tocado código de producción innecesariamente.