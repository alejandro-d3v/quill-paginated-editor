---
name: quill-wrapper
description: Implementa o modifica la integración con Quill 2.x siguiendo AGENTS.md §11 (instanciar solo tras la vista, wrapper aislado, Delta como modelo, DOM solo para medición). Úsala cuando trabajes en common/components/editor, cuando el usuario pida "integrar Quill", o cuando necesites exponer contenido del editor al resto de la app.
---

# Quill Wrapper

Quill es una librería de DOM. Todo el acceso debe ocurrir tras la vista y quedar encapsulado en el wrapper. El resto de la app consume Delta y eventos por `input()`/`output()` y signals (§11).

## 0. Guardarraíles

- **Nunca** instancies Quill en el constructor ni en inicializadores de campo (§11).
- **Nunca** modifiques ni forkees el core de Quill. Extiende por: APIs → módulos → Blots → servicios/CSS (§1.3).
- **Nunca** pagines por conteo de caracteres: la paginación lee geometría renderizada (§1.4).
- **Nunca** reescribas el Delta para paginar (§1.2).
- Trata el contenido del editor como input no confiable (§12 Security).

## 1. Ciclo de vida correcto

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  input,
  output,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';
import Quill from 'quill';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.html',
  styleUrl: './editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Editor {
  readonly initialDelta = input<unknown>();
  readonly deltaChange = output<unknown>();

  private readonly hostRef = viewChild.required<ElementRef<HTMLElement>>('host');
  private quill: Quill | null = null;

  constructor() {
    afterNextRender(() => {
      const el = this.hostRef().nativeElement;
      this.quill = new Quill(el, { theme: 'snow', modules: { toolbar: true } });
      this.quill.on('text-change', () => {
        this.deltaChange.emit(this.quill!.getContents());
      });
    });
  }
}
```

- `viewChild.required` con signal, no `@ViewChild`.
- `afterNextRender` garantiza que el DOM existe.
- El Delta se emite por `output()`, nunca se muta.

## 2. Contrato con el resto de la app

- **Entrada**: Delta inicial (o vacío) por `input()`.
- **Salida**: Delta en cada cambio por `output()`.
- **Nunca** expongas la instancia de `Quill` fuera del componente.
- La paginación **lee** el DOM renderizado; no pasa por el wrapper.

## 3. Accesibilidad (§12)

- El contenedor de Quill necesita semántica de editor: `role="textbox"`, `aria-label`, `aria-multiline`.
- No rompas la navegación por teclado que Quill ya provee.
- Verifica con AXE tras la integración.

## 4. Validación

`npm run lint` + `npm run build`. Si el wrapper crece, añade un spec con TestBed y `await fixture.whenStable()`.

## Reporte

Indica: dónde se instancia Quill, qué expone el wrapper, qué NO expone, y resultado de lint + build.