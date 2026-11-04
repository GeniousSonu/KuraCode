import { renderLibrary } from '../shared/library';

void renderLibrary(document.getElementById('app') as HTMLElement, {
  title: 'KuraCode — Snippets',
  clipboardSave: true,
});
