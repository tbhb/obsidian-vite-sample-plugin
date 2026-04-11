import { type Editor, MarkdownView, Notice } from 'obsidian';
import type ViteSamplePlugin from '../main';
import { ViteSampleModal } from '../modal';
import { VITE_SAMPLE_VIEW_TYPE } from '../view';

export function registerCommandExamples(plugin: ViteSamplePlugin): void {
  plugin.addCommand({
    id: 'show-greeting-notice',
    name: 'Show greeting notice',
    callback: () => {
      new Notice(plugin.settings.greeting);
    },
  });

  plugin.addCommand({
    id: 'open-sample-modal',
    name: 'Open sample modal',
    callback: () => {
      new ViteSampleModal(plugin.app, plugin.settings.greeting).open();
    },
  });

  plugin.addCommand({
    id: 'insert-greeting',
    name: 'Insert greeting at cursor',
    editorCheckCallback: (checking, editor: Editor, view) => {
      if (!(view instanceof MarkdownView)) {
        return false;
      }
      if (!checking) {
        editor.replaceSelection(plugin.settings.greeting);
      }
      return true;
    },
  });

  plugin.addCommand({
    id: 'uppercase-selection',
    name: 'Uppercase current selection',
    editorCallback: (editor: Editor) => {
      editor.replaceSelection(editor.getSelection().toUpperCase());
    },
  });

  plugin.addCommand({
    id: 'wrap-selection-in-greeting',
    name: 'Wrap selection in greeting',
    editorCheckCallback: (checking, editor: Editor, view) => {
      if (!(view instanceof MarkdownView)) {
        return false;
      }
      const selection = editor.getSelection();
      if (!selection) {
        return false;
      }
      if (!checking) {
        editor.replaceSelection(`${plugin.settings.greeting}: ${selection}`);
      }
      return true;
    },
  });

  plugin.addCommand({
    id: 'close-sample-view',
    name: 'Close sample view',
    checkCallback: (checking) => {
      const leaves = plugin.app.workspace.getLeavesOfType(VITE_SAMPLE_VIEW_TYPE);
      if (leaves.length === 0) {
        return false;
      }
      if (!checking) {
        plugin.app.workspace.detachLeavesOfType(VITE_SAMPLE_VIEW_TYPE);
      }
      return true;
    },
  });

  plugin.addCommand({
    id: 'open-sample-view',
    name: 'Open sample view',
    callback: () => {
      void plugin.activateView();
    },
  });
}
