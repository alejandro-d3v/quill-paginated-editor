import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import { PageFrame } from '../../../common/components/page-frame/page-frame';
import { PagesContainer } from '../../../common/components/pages-container/pages-container';
import { DEFAULT_DOCUMENT_SETTINGS } from '../../../common/document/document-settings';
import { EditorComponent } from '../../../common/editor/editor';
import { computePageGeometry } from '../../../common/pagination/page-geometry';

@Component({
  selector: 'app-home',
  imports: [EditorComponent, PageFrame, PagesContainer],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  protected readonly settings = signal(DEFAULT_DOCUMENT_SETTINGS);
  protected readonly geometry = computed(() => computePageGeometry(this.settings()));
}
