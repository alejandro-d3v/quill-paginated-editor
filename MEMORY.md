# MEMORY.md — quill-paginated-editor

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte. Las reglas permanentes viven en `AGENTS.md`, no aquí.

## Estado actual

- Scaffold funcional: shell raíz (`App`) + ruta lazy `home` + componente `Editor` placeholder.
- Quill 2.x instalado y `quill.snow.css` registrado globalmente, pero **ningún componente lo usa todavía**.
- Sin paginación, sin medición DOM, sin PDF: solo estructura y convenciones.
- Sin backend ni `provideHttpClient`. Sin estado persistido.
- Spec conocida obsoleta: `app.spec.ts` afirma un `<h1>` que `app.html` ya no renderiza (no romper, no "arreglar" salvo que se toque `App`).

## Decisiones (y por qué)

- **Zoneless + signals**: Angular 21 por defecto; sin `zone.js`. La propagación de cambios depende de signals.
- **Delta como fuente de verdad, DOM solo para medición**: la paginación se deriva, nunca muta el Delta (#1 AGENTS.md).
- **Sin NgRx / Tailwind / SSR / env files**: MVP experimental, dependencias mínimas (README).
- **Componentes sin sufijo `Component`, archivos kebab-case sin sufijo de tipo**: estilo Angular v20+ adoptado por el scaffold.
- **`common/components/editor` como wrapper aislado**: la app consumirá Delta/eventos por `input()`/`output()` + signals; Quill nunca se filtra al resto de la app.

## Aprendizajes y errores a evitar

- No escribir `standalone: true` (redundante desde v20). Los placeholders `Home`/`Editor` aún lo tienen: quitarlo solo al editar esos archivos, no en masa.
- No usar `@Input()`/`@Output()`/`@HostBinding`/`@HostListener` ni `*ngIf`/`*ngFor`: son errores de ESLint en este repo.
- No instanciar Quill en constructor ni en inicializadores de campo — solo tras la vista (`afterNextRender` o view-child con signal).
- No importar `@common/...`: el alias no existe en `tsconfig.json` aunque ESLint lo reserve.
- No tocar `eslint.config.mjs` para "hacer pasar" código débil.

## Próximos pasos

- Sustituir el placeholder de `Editor` por un wrapper real de Quill (instancia en ciclo de vista, expone Delta por signals).
- Definir `DocumentSettings` (tamaño, orientación, márgenes) y el servicio de layout/paginación como paso previo a medir.
- Crear specs para lógica pura (geometría, transformaciones de Delta) antes que para UI.

## Pendientes / dudas abiertas

- ¿Headers/footers y numeración de página se modelan como parte del Delta o como capa de layout independiente?
- ¿PDF en cliente (pdf-lib / print-to-PDF) o servidor? — sin decisión; afecta separación editor/PDF (#1.6).