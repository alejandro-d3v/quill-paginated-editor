---
name: memory-sync
description: Actualiza MEMORY.md al cerrar una sesión de trabajo, siguiendo AGENTS.md §5 (Memoria). Refresca estado actual, decisiones con su porqué, aprendizajes/pitfalls y próximos pasos, sin exceder ~50 líneas. Úsala cuando termines una tarea, cuando el usuario diga "cerramos", o cuando el estado del proyecto haya cambiado de forma relevante.
---

# Memory Sync

`MEMORY.md` es la memoria entre sesiones. Debe caber en ~50 líneas y contener solo lo que la próxima sesión necesite saber. Si algo se vuelve regla permanente, se propone mover a `AGENTS.md` (§5).

## 0. Guardarraíles

- Máximo ~50 líneas. Si te pasas, resume o elimina lo que ya no aporte.
- **Nunca** guardes secretos, tokens, claves ni datos personales.
- No dupliques reglas que ya están en `AGENTS.md`: esas se **proponen** allí, no se copian aquí.
- No actualices `MEMORY.md` si no hubo cambios relevantes: dilo y termina.

## 1. Lee el estado actual

Abre `MEMORY.md` y localiza estas secciones:

- **Estado actual** — qué funciona hoy.
- **Decisiones (y por qué)** — elecciones con su justificación.
- **Aprendizajes y errores a evitar** — pitfalls concretos.
- **Próximos pasos** — siguiente trabajo previsto.
- **Pendientes / dudas abiertas** — si existe.

## 2. Actualiza cada sección

| Sección | Qué añadir | Qué eliminar |
|---|---|---|
| Estado actual | Lo que cambió funcionalmente | Lo obsoleto |
| Decisiones | Solo decisiones **nuevas** con su porqué | Las que ya no aplican |
| Aprendizajes | Errores concretos y cómo evitarlos | Los ya interiorizados |
| Próximos pasos | Lo que sigue | Lo ya hecho |
| Pendientes | Dudas sin resolver | Las resueltas |

## 3. Propón movimientos a `AGENTS.md`

Si detectas que algo se repite sesión tras sesión y ya es una regla permanente, **no lo dejes en `MEMORY.md`**: propón el texto exacto y la sección de `AGENTS.md` donde iría. No edites `AGENTS.md` sin aprobación explícita.

## 4. Reporte

Indica: qué secciones cambiaron, qué se eliminó, qué se propuso mover a `AGENTS.md` (si aplica), y el conteo final de líneas.