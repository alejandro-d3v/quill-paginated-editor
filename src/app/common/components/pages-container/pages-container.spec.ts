import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { PagesContainer } from './pages-container';

@Component({
  imports: [PagesContainer],
  template: '<app-pages-container><div class="proyeccion"></div></app-pages-container>',
})
class TestHost {}

describe('PagesContainer', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();
  });

  it('should create', async () => {
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('proyecta el contenido dentro del canvas', async () => {
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();

    const native: HTMLElement = fixture.nativeElement;
    const canvas = native.querySelector<HTMLElement>('.pages-canvas');
    const projected = native.querySelector<HTMLElement>('.proyeccion');
    expect(canvas).not.toBeNull();
    expect(projected).not.toBeNull();
    if (canvas !== null && projected !== null) {
      expect(canvas.contains(projected)).toBe(true);
    }
  });
});
