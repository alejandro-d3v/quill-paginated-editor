---
description: Audita una spec contra el contexto cerrado (constitution, discovery, AGENTS) y propone ajustes.
usage: /spec-review <spec-id>   (ej: /spec-review 01-document-model)
---

# Spec Review

Auditas la spec indicada contra el contexto arquitectónico del proyecto.
**No implementas código. No reescribes la spec sin aprobación previa.**
Solo reportas concordancias, conflictos y ajustes propuestos.

**Spec a auditar:** `$ARGUMENTS`

Si `$ARGUMENTS` está vacío o no existe bajo `specs/`, detente y pide
una spec válida.

---

## Lectura obligatoria

Antes de emitir cualquier juicio, lee:

1. `docs/constitution.md` completo (los 20 RULE y los 5 principios).
2. `docs/discovery.md` completo (las 5 decisiones cerradas).
3. `AGENTS.md` §1, §6, §7, §12, §16, §18.
4. `MEMORY.md`.
5. `specs/$ARGUMENTS/spec.md`, `plan.md`, `tasks.md`.
6. Las specs **predecesoras** ya completadas (según el orden del roadmap
   en `docs/discovery.md` §11).
7. Las specs **sucesoras** si tocan el mismo dominio (para detectar
   responsabilidades mal ubicadas).

---

## Qué auditar

Para cada REQ de `spec.md`:

- ¿Es consistente con `constitution.md`? Cita el RULE que lo respalda o
  el que violaría.
- ¿Contradice alguna decisión de `docs/discovery.md` §3–§7?
- ¿Asume una spec previa que aún no está implementada?
- ¿Incluye trabajo que pertenece a otra spec?

Para `plan.md`:

- ¿El "how" es técnicamente viable dado el estado del código?
- ¿Propone dependencias nuevas? ¿Están justificadas (RULE-017)?
- ¿Contradice el seam de medición (`paginate` puro + `MeasurementService`)?

Para `tasks.md`:

- ¿Cada tarea es concreta y verificable?
- ¿El orden respeta dependencias?
- ¿Hay tareas redundantes o que mezclan specs?
- ¿Falta alguna tarea para cubrir un acceptance criterion?

Para los acceptance criteria:

- ¿Son verificables?
- ¿Están cubiertos por tareas?
- ¿Hay criterios genéricos ("results are deterministic") sin fixtures
  que los hagan comprobables?

---

## Clasificación de hallazgos

Usa esta severidad:

- **BLOCKER** — la spec no puede implementarse sin resolverlo (contradice
  la constitución, depende de algo inexistente, asume una decisión no
  tomada).
- **HIGH** — requiere ajuste antes de implementar (REQ ambiguo, criterio
  inverificable, responsabilidad mal ubicada).
- **MEDIUM** — mejora sustancial pero no bloquea (tareas más concretas,
  criterios más medibles).
- **LOW / INFO** — cosmético o de estilo.

---

## Formato del reporte

```
# Spec Review — <spec-id>

## Veredicto
READY / READY WITH CHANGES / NOT READY

## Concordancias verificadas
- REQ-XX ↔ constitution RULE-XXX ✓
- ...

## Hallazgos

### BLOCKER
- <descripción> · archivo · sección · cambio propuesto

### HIGH
- ...

### MEDIUM
- ...

### LOW / INFO
- ...

## Ajustes propuestos a spec.md / plan.md / tasks.md
- <cambio concreto, archivo, sección>

## Dependencias con specs predecesoras
- <qué se asume y si está disponible>

## Riesgos si se implementa tal cual
- <lista breve>

## Recomendación
- <aplicar ajustes y luego /feature; o reescribir la spec; o parar>
```

---

## Reglas críticas

- **No reescribas la spec sin que el usuario apruebe el reporte.**
- **No implementes código.**
- **No marques tareas como completas.**
- Si la spec es una plantilla vacía (todos los REQ son ecos del scope),
  dilo explícitamente y clasifícalo como BLOCKER de redacción: la spec
  necesita ser redactada con contenido real **antes** de auditar.
- Si la spec contradice `docs/discovery.md`, cita la sección exacta del
  conflicto.
- No inventes requisitos que no estén en la spec o en la constitución.
- Si algo es ambiguo, repórtalo como ambigüedad, no lo resuelvas por tu
  cuenta.

---

## Al terminar

**DETENTE.** Espera aprobación del usuario antes de aplicar cualquier
ajuste. El usuario decide si:
1. Aplica los ajustes (entonces se reabre esta sesión).
2. Reescribe la spec desde cero.
3. Acepta los riesgos y lanza `/feature <id>`.