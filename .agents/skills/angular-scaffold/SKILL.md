---
name: angular-scaffold
description: Crea componentes, servicios y rutas en este repo siguiendo las convenciones exactas de AGENTS.md §3 (nombres, archivos kebab-case sin sufijo, sin barrel files) y §8 (signals, OnPush, sin standalone: true, sin decoradores @Input/@Output, control flow nativo). Úsala al iniciar una feature nueva, al añadir una página, o cuando el usuario pida "crea un componente/servicio/ruta".
---

# Angular Scaffold

Genera scaffolding consistente con las convenciones del repo. No inventes estructura: replica lo que ya existe en `home/` y `app/`.

## 0. Guardarraíles

- No crees archivos `index.ts` (barrel files prohibidos, §3).
- No uses `@Input()`, `@Output()`, `@HostBinding`, `@HostListener` ni `*ngIf`/`*ngFor`: son errores de ESLint (§8).
- No escribas `standalone: true` (redundante desde v20, §8).
- No uses path aliases como `@common/...`: no existen en `tsconfig.json` (§3).
- No toques `eslint.config.mjs` ni `angular.json`.

## 1. Decide qué vas a crear

| Artefacto | Carpeta | Archivos |
|---|---|---|
| Feature | `src/app/<feature>/` | `<feature>.routes.ts` + `pages/<page>/` |
| Página | `src/app/<feature>/pages/<page>/` | `<page>.ts|html|scss` |
| Componente común | `src/app/common/components/<name>/` | `<name>.ts|html|scss` |
| Servicio | `src/app/common/services/<name>.ts` | solo `.ts` (sin carpeta) |

Si dudas entre feature y común, pregunta al usuario.

## 2. Reglas de nombres (§3)

- Clase: `Home`, `Editor`, `Pagination` — **sin sufijo `Component`/`Service`**.
- Archivos: kebab-case sin sufijo de tipo — `home.ts`, `home.html`, `home.scss`, `home.spec.ts`.
- Selector: `app-<kebab-case>` para componentes, `app<camelCase>` para directivas.
- Rutas: `<FEATURE>_ROUTES` en `<feature>.routes.ts`; lazy vía `loadChildren` (features) y `loadComponent` (páginas).

## 3. Plantilla de componente nuevo

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-<name>',
  templateUrl: './<name>.html',
  styleUrl: './<name>.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class <Name> {}
```

Sin `standalone: true`. Sin `imports` vacíos. Estado expuesto al template como `protected readonly`.

## 4. Plantilla de servicio nuevo

```typescript
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class <Name> {}
```

Usa `inject()` para DI, nunca constructor injection (§8).

## 5. Plantilla de ruta de feature

```typescript
import { Routes } from '@angular/router';

export const <FEATURE>_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/<page>/<page>').then((m) => m.<Page>),
  },
];
```

Registra la feature en `app.routes.ts` con `loadChildren` como sibling de `home`.

## 6. Validación

Ejecuta `npm run lint` y `npm run build` al terminar (§15). No declares "listo" sin que ambos pasen o sin reportar honestamente que no corrieron.

## Reporte

Indica: archivos creados, ruta registrada (si aplica), y resultado de lint + build.