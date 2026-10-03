---
description: Redacta una spec plantilla con contenido real (spec.md, plan.md, tasks.md). No implementa código.
usage: /spec-write <spec-id>   (ej: /spec-write 02-page-geometry)
---

# Spec Write

Redactas los tres archivos de una spec que hoy es plantilla vacía, para
convertirla en una especificación ejecutable. **No implementas código.
No tocas `src/`. Solo escribes los tres archivos de la spec.**

**Spec a redactar:** `$ARGUMENTS`

Si `$ARGUMENTS` está vacío o no existe bajo `specs/`, detente y pide
una spec válida.

---

## Detección de plantilla

Antes de escribir nada, verifica si la spec es plantilla:

- `spec.md`: los REQ son ecos del scope ("The implementation MUST address:
  <bullet>.").
- `plan.md`: genérico, sin archivos ni decisiones concretas.
- `tasks.md`: tareas idénticas a las de otras specs, sin especificidad.

Si la spec **no es plantilla** (ya tiene contenido real, como
`01-document-model`), detente y reporta:

> "specs/$ARGUMENTS ya tiene contenido real. No aplica `/spec-write`;
> usa `/spec-review $ARGUMENTS`."

Si es plantilla, continúa.

---

## Lectura obligatoria (en este orden)

1. `docs/constitution.md` completo (los 20 RULE, los 5 principios, §3
   modelo de dominio, §4 arquitectura, §6 contrato del motor, §7
   comportamiento de paginación, §11 performance, §13 testing).
2. `docs/discovery.md` completo (las 5 decisiones cerradas, estructura
   de carpetas, seam de medición, riesgos).
3. `AGENTS.md` §1, §3, §6, §7, §9, §12, §16, §18.
4. `MEMORY.md`.
5. `specs/00-discovery/{spec,plan,tasks}.md` y
   `specs/01-document-model/{spec,plan,tasks}.md` como **referencia de
   formato** (son las dos specs ya redactadas con contenido real).
6. Todas las specs predecesoras ya redactadas (según el orden del
   roadmap en `docs/discovery.md` §11).
7. La plantilla actual de `specs/$ARGUMENTS/` (para conservar
   estructura y out-of-scope heredado).
8. Las skills relevantes de `.agents/skills/` para el dominio de esta
   spec (ej. `quill-wrapper` si toca el editor, `angular-scaffold` si
   crea componentes/servicios).

---

## Qué redactar

### `spec.md`

Estructura (coherente con `01-document-model`):

- **Status**: Active implementation specification.
- **Authority**: subordinada a `docs/constitution.md`.
- **Purpose**: 2–4 líneas. Qué logra esta spec y qué NO.
- **Scope**: bullets concretos de qué entra.
- **Architectural constraints**: heredados de la constitución (no
  reinventar). Citar RULEs específicos.
- **Requirements**: REQ-01..REQ-NN. Cada uno:
  - concreto y verificable,
  - accionable por un implementador sin inventar,
  - con paths/firmas/estructuras cuando aplique,
  - con referencia al RULE o sección de `discovery.md` que lo respalda.
- **Acceptance criteria**: verificables. Nada de "results are
  deterministic" sin fixtures. Si algo se verifica por compilación,
  decirlo (no inflarlo como test unitario).
- **Out of scope**: explícito, ligado a specs posteriores.

### `plan.md`

- **Objective**: 1–2 líneas.
- **Deliverable**: lista de archivos que se van a crear/modificar.
- **Approach**: pasos concretos (5–12).
- **Design constraints**: lo que NO se puede hacer (hereda de la spec
  y de la constitución).
- **Risks**: 2–6 riesgos reales, con mitigación.
- **Verification**: condición de cierre de la spec.

### `tasks.md`

- **Preparation**: lecturas y verificaciones previas.
- **Implementation**: tareas concretas por REQ, en orden de dependencia.
- **Tests**: tareas de testing específicas por REQ, no genéricas.
- **Integration**: verificación de invariantes constitucionales.
- **Review**: validación final, actualización de docs, reporte.

---

## Reglas de redacción

1. **No inventar requisitos** que no estén en la constitución, en
   `discovery.md`, o en el scope explícito de la spec.
2. **No copiar los REQ-echo** de la plantilla. Reescribirlos con
   contenido.
3. **No copiar bloques de constraints genéricos** presentes en las 12
   plantillas. Citar RULEs específicos.
4. **No asumir decisiones no cerradas**. Si algo no está decidido y
   bloquea la redacción, marcar `DECISIÓN REQUERIDA` en el REQ y
   detenerse a reportar; no resolver por cuenta propia.
5. **No incluir trabajo de otras specs** (future-spec isolation,
   AGENTS.md §7.7).
6. **Idioma consistente**: español para prosa, inglés para términos
   técnicos (patrón de `00` y `01`).
7. **Referencias a `AGENTS.md`**: por nombre de sección, no por número
   (la numeración cambia; los nombres no).
8. **Citar evidencia verificable** cuando se afirma algo (por ejemplo,
   "verificado en `package.json`: `quill ^2.0.3`").

---

## Formato del reporte

```
# Spec Write — <spec-id>

## Estado inicial
Plantilla vacía / parcial / ya redactada (si ya, detente aquí).

## Contexto leído
- constitution §...
- discovery §...
- predecesoras: <lista>

## Redacción

### spec.md
- REQ-01..REQ-NN: <resumen de cada uno en una línea>
- Acceptance criteria: <cuántos, cómo se verifican>
- Out of scope: <resumen>

### plan.md
- Deliverable: <archivos>
- Approach: <N pasos>
- Risks: <N>

### tasks.md
- Preparación: <N tareas>
- Implementación: <N tareas>
- Tests: <N tareas>
- Integración: <N tareas>
- Review: <N tareas>

## Decisiones requeridas
<lista, si hay. Si no hay, decirlo.>

## Ambigüedades detectadas
<lista, si hay.>

## Recomendación
- READY FOR REVIEW → lanzar /spec-review <id>
- REQUIRES USER INPUT → <qué necesita el humano>
```

---

## Al terminar

**DETENTE.** No lances `/spec-review` automáticamente. Reporta y espera
al humano.

No implementes código. No toques `src/`. No marques tareas de
`tasks.md` como completadas (todas deben quedar `[ ]`).

Si detectaste decisiones requeridas, no las resuelvas: lístalas para
que el humano las cierre antes de `/spec-review`.

---

## Recordatorio de reglas críticas (constitución)

- **RULE-001/002:** no modificar ni forkear Quill.
- **RULE-003/004:** Delta canónico; DOM no es fuente de verdad.
- **RULE-006:** paginación testeable sin Angular ni DOM.
- **RULE-007:** PDF no depende de Quill vivo.
- **RULE-009:** unidades físicas explícitas.
- **RULE-010:** nunca paginar por conteo de caracteres.
- **RULE-011:** nunca perder contenido.
- **RULE-016:** toda feature nueva lleva tests.
- **RULE-017:** toda dependencia requiere justificación.
- **RULE-018:** sin `any` sin justificación.
- **RULE-019/020:** no reescribir sin causa; preservar comportamiento.