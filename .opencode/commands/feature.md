---
description: Ejecuta el ciclo spec-driven completo para una spec del roadmap.
usage: /feature <spec-id>   (ej: /feature 01-document-model)
---

# Spec-Driven Feature Execution

Vas a implementar **una única spec** del roadmap de este repositorio,
siguiendo el contrato operativo definido en `AGENTS.md` §7 y los
principios de `docs/constitution.md`.

**Spec a implementar:** `$ARGUMENTS`

Si `$ARGUMENTS` está vacío o no coincide con una carpeta bajo `specs/`,
detente inmediatamente y pide al usuario que indique una spec válida
(ej: `00-discovery`, `01-document-model`, `02-page-geometry`, ...).

---

## Regla de oro

**Una spec. Un ciclo. Detente al terminar.**

No implementes la spec siguiente.
No implementes funcionalidad de specs futuras "porque se necesitará".
No refactorices código no relacionado con esta spec.
No marques tareas completas sin validación real.
No inventes requisitos que no estén en la spec o en la constitución.

Si algo bloquea la implementación, **detente y reporta**. No improvises.

---

## Contexto permanente del proyecto

Antes de empezar, ten presente (sin necesidad de releerlo cada vez si ya
lo tienes en contexto):

- **Modelo de edición paginada:** A1 — editor continuo + overlay visual
  de páginas. El DOM de Quill **nunca se reestructura** (ver
  `docs/discovery.md` §3).
- **Seam de medición:** `paginate(measuredBlocks, geometry)` es puro y
  testeable sin DOM; `MeasurementService` es Angular/browser-only y solo
  mide (ver `docs/discovery.md` §4).
- **Estructura de carpetas:** `src/app/common/{document,pagination,pdf,editor}`
  (ver `docs/discovery.md` §5).
- **PDF:** tecnología diferida a `09`. No añadir dependencias PDF antes.
- **Tablas:** fuera de `06`. Regla por defecto para bloques desconocidos:
  **indivisible, nunca se pierde contenido** (ver `docs/discovery.md` §7).

---

## Lectura obligatoria (en este orden)

Antes de tocar nada, lee completamente:

1. `docs/constitution.md` — principios y reglas (RULE-001..RULE-020).
2. `specs/$ARGUMENTS/spec.md` — qué debe lograrse (REQ-XX, criterios).
3. `specs/$ARGUMENTS/plan.md` — cómo se descompone.
4. `specs/$ARGUMENTS/tasks.md` — checklist de ejecución.
5. `AGENTS.md` §6 (Development Workflow), §7 (Spec-Driven Development),
   §12 (Quill Integration), §16 (Validation Commands), §18 (Final Checklist).
6. `docs/discovery.md` (contexto de decisiones arquitectónicas).
7. `MEMORY.md` (estado actual del proyecto).
8. Skills relevantes en `.agents/skills/`:
   - `quill-wrapper` si la spec toca el editor o Blots.
   - `systematic-debugging` si aparece un bug no trivial.
   - `preflight-audit` antes de validar.
   - `angular-scaffold` si se crean componentes/servicios nuevos.
   - `memory-sync` al terminar.
9. Código existente relevante en `src/`.

Si `specs/$ARGUMENTS/` no existe o le falta alguno de los tres archivos,
detente y reporta.

---

## Pre-implementación: auditoría de la spec

Antes de escribir código, verifica (AGENTS.md §7.5):

- ¿Los REQ son internamente consistentes?
- ¿Los acceptance criteria son verificables?
- ¿Las dependencias con specs anteriores están satisfechas?
- ¿El código existente provee la base esperada?
- ¿Hay ambigüedad que cambie materialmente la arquitectura?

Si encuentras un problema **menor**, resuélvelo con el criterio de
`AGENTS.md` §17 (orden de prioridad de decisión) y documenta la decisión.

Si el problema **cambia la arquitectura** o contradice la constitución,
**detente y reporta antes de implementar**. No improvises.

Reporta brevemente esta auditoría como parte del output.

---

## Flujo de ejecución

### 1. Requirement Analysis

Resume en 3–6 líneas qué pide la spec y qué queda fuera de scope.
Confirma que entiendes los REQ y los criterios de aceptación.

### 2. Technical Approach

Explica la estrategia técnica elegida. Si hay más de una opción razonable,
menciona cuál descartaste y por qué (breve).

### 3. Implementation Plan

Lista los archivos que esperas crear/modificar y el orden. Sé concreto.
Si el plan cambia durante la implementación, actualízalo en el reporte final.

### 4. Implementación de tareas

Ejecuta las tareas de `tasks.md` **en el orden definido**, salvo que
descubras una dependencia que obligue a reordenar (documenta el cambio).

Para cada tarea:

- Confirma sus prerequisitos.
- Implementa el cambio mínimo coherente.
- No marques la tarea como completa hasta validarla.
- Si una tarea revela que otra spec anterior está incompleta, **detente y
  reporta** (no implementes la spec anterior silenciosamente).

### 5. Validación

Ejecuta los comandos reales de `AGENTS.md` §16:

- `npm run lint` — obligatorio.
- `npm run build` — obligatorio.
- `npm test` — obligatorio si la spec toca lógica testeable, introduce
  lógica pura, o si `tasks.md` lo exige.
- `npm run format:check` — solo si hubo cambios sensibles a formato.

**Nunca afirmes que un comando se ejecutó si no lo hiciste.** Si no puedes
ejecutarlo, dilo explícitamente.

### 6. Auditoría contra la spec

Antes de cerrar, revisa:

- ¿Cada REQ de `spec.md` está implementado?
- ¿Cada acceptance criterion es verificable y se cumple?
- ¿Quedó algo del scope sin cubrir?
- ¿Se introdujo algo fuera de scope (RULE de AGENTS.md §7.7)?
- ¿Los invariantes de la constitución siguen intactos?
  - Delta canónico no mutado.
  - Sin pérdida de contenido.
  - Paginación determinista.
  - Sin modificación del core de Quill.
  - Paginación y PDF separados.

Si algo falla, **no marques la spec como completa**.

### 7. Actualización de `tasks.md`

Marca **solo** las tareas realmente completadas y verificadas.

- No marques tareas por "haber escrito el código".
- No marques tareas si la validación falló.
- Si una tarea quedó incompleta, déjala desmarcada y explica por qué.
- Si una tarea estaba mal formulada, corrígela mínimamente y reporta el
  cambio.

### 8. Actualización de `MEMORY.md`

Solo si el estado del proyecto cambió:

- Actualiza el estado (spec completada, próximos pasos).
- Añade decisiones importantes con su porqué.
- Añade errores a evitar descubiertos durante la implementación.
- Mantén ≤ 50 líneas.
- No guardes secretos ni datos sensibles.

Si no hubo cambios de estado relevantes, indícalo y no toques el archivo.

### 9. Reporte final

Usa este formato (adaptado de `AGENTS.md` §5):

```
## Spec: <spec-id>

### Requirement Analysis
<breve>

### Technical Approach
<breve>

### Archivos modificados / creados
- <path> — <qué cambió>

### Tareas completadas
- [x] <tarea 1>
- [x] <tarea 2>
- [ ] <tarea no completada> — motivo

### Validación ejecutada
- `npm run lint` → PASS / FAIL
- `npm run build` → PASS / FAIL (incluir warnings relevantes)
- `npm test` → PASS / FAIL (N tests)
- `npm run format:check` → PASS / FAIL / no ejecutado (si aplica)

### Invariantes verificados
- Delta canónico intacto: ✓ / ✗
- Sin pérdida de contenido: ✓ / ✗
- Sin modificar core de Quill: ✓ / ✗
- Paginación / PDF separados: ✓ / ✗

### Riesgos y decisiones
<lista breve>

### Estado de la spec
- COMPLETA / PARCIAL / BLOQUEADA
- <razón si no es COMPLETA>

### Próximo paso sugerido
- <NO iniciar la siguiente spec automáticamente>
- <qué debería revisar el humano antes de continuar>
```

---

## Al terminar

**DETENTE.** No inicies la spec siguiente.

Aunque la spec esté completa y la validación verde, el humano es el
checkpoint entre specs (AGENTS.md §7.2). Tu trabajo termina cuando
reportas.

Si el humano quiere continuar, te lo pedirá explícitamente con otro
`/feature <next-spec-id>`.

---

## Recordatorio de reglas críticas (referencia rápida)

De `docs/constitution.md`:

- **RULE-001/002:** no modificar ni forkear Quill.
- **RULE-003/004:** Delta canónico; DOM no es fuente de verdad.
- **RULE-005:** paginación determinista.
- **RULE-006:** paginación testeable sin Angular ni DOM.
- **RULE-007:** PDF no depende de Quill vivo.
- **RULE-009:** unidades físicas explícitas.
- **RULE-010:** nunca paginar por conteo de caracteres.
- **RULE-011:** nunca perder contenido.
- **RULE-012:** no mutar Delta para representar páginas.
- **RULE-016:** toda feature nueva lleva tests.
- **RULE-017:** toda dependencia requiere justificación.
- **RULE-018:** sin `any` sin justificación.
- **RULE-019/020:** no reescribir código funcional sin causa; preservar
  comportamiento existente.

De `AGENTS.md`:

- §6: Understand → Analyze → Plan → Implement → Validate.
- §7.2: una spec a la vez.
- §7.5: auditoría pre-implementación.
- §7.7: aislamiento de specs futuras.
- §7.9: marcar tasks solo tras validar.
- §7.10: criterios de spec completa.
- §17: jerarquía de decisión en conflictos.
- §18: checklist final.