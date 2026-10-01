---
name: preflight-audit
description: Audita el cambio actual contra el contrato de este repo antes de declararlo terminado. Verifica el diff contra AGENTS.md (§1 principios, §7 TypeScript, §8 Angular, §11 Quill, §17 checklist), ejecuta los comandos reales de §15 (npm run lint, npm run build, npm test si aplica) y reporta el resultado con honestidad. Úsala cuando estés a punto de decir "listo", cuando prepares un commit, o cuando el usuario pregunte "¿esto está listo?". No modifica código: solo audita y reporta.
---

# Preflight Audit

Audita el cambio en curso contra el contrato del repositorio antes de declararlo terminado.
**No modifiques código en esta skill.** Reporta hallazgos y deja que el usuario decida.

## 0. Guardarraíles

- No ejecutes `npm run format` ni `npm run lint:fix` por iniciativa propia: pueden tocar archivos no relacionados (§17).
- Nunca afirmes que un comando corrió si no corrió. Si no puedes ejecutarlo, dilo explícitamente.
- Si el árbol de trabajo está limpio (`git status` sin cambios), dilo y termina.

## 1. Delimita el cambio

1. Ejecuta `git status` y `git diff --stat`.
2. Si el diff toca archivos fuera de la tarea declarada, márcalo como scope creep (§17, primer ítem).
3. Clasifica el cambio: TypeScript / componente-servicio Angular / integración Quill / estilos / configuración.

## 2. Ejecuta los comandos reales (§15)

En este orden, capturando salida:

1. `npm run lint` — ESLint sobre `.ts` (specs excluidas), con tipos completos.
2. `npm run build` — build de producción; además aplica presupuestos de bundle (inicial warn 500 kB / error 1 MB; estilos de componente warn 4 kB / error 8 kB).
3. `npm test` — solo si el cambio toca lógica testeada (matemática de paginación, geometría, transformaciones de Delta) o specs existentes.

No inventes comandos alternativos. Si algo falla, captura las primeras 20 líneas del error y detente.

## 3. Auditoría del checklist (§17)

Marca cada ítem como PASS / FAIL / N/A con una línea de evidencia:

- [ ] Diff mínimo y coherente; sin refactors, renames, formateo, dependencias ni config ajenos a la tarea.
- [ ] Sin cambios en `eslint.config.mjs`, `tsconfig*.json`, `angular.json` ni `package.json` salvo requerimiento explícito de la tarea.
- [ ] Sin dependencias nuevas, state library, UI kit ni SSR/env files sin justificación explícita.
- [ ] Principios §1 respetados: Delta intacto por paginación, sin pérdida de contenido, sin tocar el core de Quill, sin paginar por conteo de caracteres.
- [ ] TypeScript estricto limpio: sin `any`, sin promesas flotantes, errores manejados.
- [ ] Angular moderno: sin `standalone: true`, `OnPush` en componentes nuevos, signals, control flow nativo, rutas lazy.
- [ ] Markup accesible; contenido de usuario tratado como no confiable; sin secretos.
- [ ] `npm run lint` y `npm run build` pasan (o se reporta honestamente que no se ejecutaron).
- [ ] `MEMORY.md` actualizado si cambió estado, decisiones o pitfalls (≤50 líneas).

## 4. Anti-racionalización

No aceptes estas excusas (ni del usuario ni de ti mismo):

| Excusa | Réplica |
|---|---|
| "Es un cambio muy pequeño para correr lint/build." | Los diffs pequeños también rompen presupuestos y templates estrictos. Córrelos. |
| "Lint pasa local, build también pasará." | Build hace chequeo completo de tipos/templates + presupuestos. Son distintos. |
| "Actualizo `MEMORY.md` en la próxima sesión." | La próxima sesión arranca con memoria obsoleta. Actualízalo ahora o dilo. |
| "La spec ya fallaba antes." | Anótalo; no la "arregles" salvo que toques el template de `App` (§13). |
| "Subo el límite del presupuesto." | Los presupuestos solo se suben con justificación explícita del usuario (§13). |
| "ESLint es muy estricto, desactivo la regla." | Nunca desactives una regla para hacer pasar código débil (§7). |

## 5. Reporte

Emite exactamente esta estructura y nada más:

```
## Preflight Audit

**Alcance:** <archivos tocados, 1 línea>
**Comandos ejecutados:**
- npm run lint  → PASS | FAIL | NO EJECUTADO (motivo)
- npm run build → PASS | FAIL | NO EJECUTADO (motivo)
- npm test      → PASS | FAIL | NO EJECUTADO (motivo)

**Checklist:** X/9 PASS, Y FAIL, Z N/A
- <cada FAIL con evidencia>

**Bloqueantes:** <lista o "ninguno">
**No bloqueantes:** <lista o "ninguno">

**Veredicto:** READY | NOT READY | NEEDS USER DECISION
```

Termina con la línea de veredicto. No añadas prosa después.