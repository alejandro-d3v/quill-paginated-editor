---
name: pagination-spec
description: Escribe specs de lógica pura (geometría, matemática de paginación, transformaciones de Delta) antes de implementar, siguiendo AGENTS.md §13 (Vitest + jsdom) y §1.2 (paginación derivada). Úsala cuando empieces el motor de paginación, cuando el usuario pida "testea esto", o cuando vayas a tocar cálculos de layout.
---

# Pagination Spec

La paginación es matemática y geometría. La forma más barata de validarla es un spec puro, sin DOM, antes de escribir la implementación (§13). No crees esta skill hasta que empieces el motor de paginación.

## 0. Guardarraíles

- No pagines por conteo de caracteres: el spec debe trabajar con dimensiones (§1.4).
- No muta el Delta en el spec: la paginación lo lee, no lo reescribe (§1.2).
- Usa Vitest globals (`describe`/`it`/`expect`), no imports de `vitest` (§13).
- El spec va colocado junto al código: `src/app/common/services/<name>.spec.ts`.

## 1. Qué testear

| Área | Ejemplos |
|---|---|
| Geometría | Alto de bloque, márgenes, área útil de página |
| Paginación | Cuántos bloques caben, dónde corta, sin pérdida de contenido |
| Delta | Transformaciones puras: filtrar, agrupar, no mutar el original |

## 2. Plantilla de spec

```typescript
import { describe, expect, it } from 'vitest';
import { paginate } from './pagination';

describe('paginate', () => {
  it('no pierde contenido al dividir en páginas', () => {
    const blocks = [{ height: 100 }, { height: 200 }];
    const pages = paginate(blocks, { height: 150 });
    const total = pages.flat().reduce((sum, b) => sum + b.height, 0);
    expect(total).toBe(300);
  });
});
```

- Sin TestBed si la lógica es pura.
- Un `it` por propiedad verificable.
- Casos límite: vacío, un bloque que excede la página, márgenes cero.

## 3. Validación

`npm test`. Si el spec pasa pero la implementación no, el spec es la fuente de verdad: arregla la implementación, no el spec.

## Reporte

Indica: archivo de spec creado, propiedades cubiertas, casos límite incluidos, y resultado de `npm test`.