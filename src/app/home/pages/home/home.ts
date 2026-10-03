import { Component } from '@angular/core';

import { EditorComponent } from '../../../common/editor/editor';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [EditorComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}
