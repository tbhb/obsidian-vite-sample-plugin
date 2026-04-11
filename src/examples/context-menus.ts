import { MarkdownView, type Menu, Notice, TFile } from 'obsidian';
import type ViteSamplePlugin from '../main';

export function registerContextMenuExamples(plugin: ViteSamplePlugin): void {
  plugin.registerEvent(
    plugin.app.workspace.on('file-menu', (menu: Menu, file) => {
      if (!(file instanceof TFile)) {
        return;
      }
      menu.addSeparator();
      menu.addItem((item) => {
        item
          .setTitle('Print file path')
          .setIcon('document')
          .onClick(() => {
            new Notice(file.path);
          });
      });
    }),
  );

  plugin.registerEvent(
    plugin.app.workspace.on('editor-menu', (menu: Menu, editor, view) => {
      if (!(view instanceof MarkdownView)) {
        return;
      }
      menu.addSeparator();
      menu.addItem((item) => {
        item
          .setTitle('Insert greeting')
          .setIcon('message-square')
          .onClick(() => {
            editor.replaceSelection(plugin.settings.greeting);
          });
      });
      const selection = editor.getSelection();
      if (selection) {
        menu.addItem((item) => {
          item
            .setTitle('Uppercase selection')
            .setIcon('case-sensitive')
            .onClick(() => {
              editor.replaceSelection(selection.toUpperCase());
            });
        });
      }
    }),
  );
}
