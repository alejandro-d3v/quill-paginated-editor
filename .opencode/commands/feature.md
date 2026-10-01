---
description: Planifica una nueva funcionalidad antes de tocar código
agent: plan
---

Funcionalidad solicitada: $ARGUMENTS

Si la descripción está vacía, pregunta al usuario qué quiere construir antes de continuar.
No escribas ni modifiques ningún archivo hasta que el usuario apruebe el plan.

Contexto obligatorio (léelo antes de planificar):
- @AGENTS.md — reglas del repo. Presta atención especial a §1 (principios no negociables),
  §6 (workflow), §7 (TypeScript), §8 (Angular v21), §11 (Quill), §15 (comandos reales).
- @MEMORY.md — estado actual, decisiones y pendientes.

Entrega un plan con esta estructura:

1. **Análisis del requisito** — interpretación en una o dos frases. Si algo es ambiguo, dilo aquí.

2. **Enfoque técnico** — estrategia elegida y por qué encaja con §1 y §4 de AGENTS.md.
   Si hay una alternativa razonable, nómbrala y explica el trade-off (no la implementes).

3. **Archivos afectados** — tabla `archivo | cambio esperado | motivo`. Incluye solo lo necesario;
   marca explícitamente lo que NO vas a tocar.

4. **Casos límite y dudas para el usuario** — lista priorizada de decisiones que el usuario debe
   tomar antes de empezar. Si no hay dudas, dilo.

5. **Validación prevista** — comandos exactos de §15 que se ejecutarán al terminar y qué se espera
   de cada uno (lint, build, tests si aplican). Menciona el presupuesto de bundle si el cambio
   afecta tamaño.

6. **Impacto en la memoria** —
   - `MEMORY.md`: qué secciones cambiarán al terminar (estado, decisiones, aprendizajes, próximos pasos).
   - `AGENTS.md`: solo si el cambio introduce una **regla permanente nueva**, propón el texto exacto
     y la sección donde iría. No lo edites sin aprobación explícita.

Restricciones:
- No propongas introducir dependencias, SSR, estado global, Tailwind ni tocar config
  (`eslint.config.mjs`, `tsconfig*.json`, `angular.json`, `package.json`) sin justificarlo y pedir aprobación.
- No propongas `standalone: true`, `@Input()`/`@Output()`, `*ngIf`/`*ngFor` ni instanciar Quill fuera
  del ciclo de vista: son errores de ESLint en este repo.
- Formato de respuesta: sigue §5 de AGENTS.md (abreviado si el cambio es trivial).

Termina con la frase exacta: "Esperando aprobación para implementar."