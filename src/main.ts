import { type Editor, MarkdownView, Notice, Platform, Plugin, type WorkspaceLeaf } from 'obsidian';
import { ViteSampleModal } from './modal';
import {
  DEFAULT_SETTINGS,
  mergeSettings,
  type ViteSamplePluginSettings,
  ViteSampleSettingTab,
} from './settings';
import './styles.css';
import { VITE_SAMPLE_VIEW_TYPE, ViteSampleView } from './view';

export default class ViteSamplePlugin extends Plugin {
  settings: ViteSamplePluginSettings = DEFAULT_SETTINGS;

  private statusBarEl: HTMLElement | null = null;
  private tickHandle: number | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.registerView(VITE_SAMPLE_VIEW_TYPE, (leaf) => new ViteSampleView(leaf, this));

    this.addRibbonIcon('sparkles', 'Open vite sample view', () => {
      void this.activateView();
    });

    if (this.settings.enableStatusBar && !Platform.isMobile) {
      this.statusBarEl = this.addStatusBarItem();
      this.statusBarEl.setText(this.settings.greeting);
    }

    this.addCommand({
      id: 'show-greeting-notice',
      name: 'Show greeting notice',
      callback: () => {
        new Notice(this.settings.greeting);
      },
    });

    this.addCommand({
      id: 'open-sample-modal',
      name: 'Open sample modal',
      callback: () => {
        new ViteSampleModal(this.app, this.settings.greeting).open();
      },
    });

    this.addCommand({
      id: 'insert-greeting',
      name: 'Insert greeting at cursor',
      editorCheckCallback: (checking, editor: Editor, view) => {
        if (!(view instanceof MarkdownView)) {
          return false;
        }
        if (!checking) {
          editor.replaceSelection(this.settings.greeting);
        }
        return true;
      },
    });

    this.addCommand({
      id: 'uppercase-selection',
      name: 'Uppercase current selection',
      editorCallback: (editor: Editor) => {
        editor.replaceSelection(editor.getSelection().toUpperCase());
      },
    });

    this.addCommand({
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
          editor.replaceSelection(`${this.settings.greeting}: ${selection}`);
        }
        return true;
      },
    });

    this.addCommand({
      id: 'close-sample-view',
      name: 'Close sample view',
      checkCallback: (checking) => {
        const leaves = this.app.workspace.getLeavesOfType(VITE_SAMPLE_VIEW_TYPE);
        if (leaves.length === 0) {
          return false;
        }
        if (!checking) {
          this.app.workspace.detachLeavesOfType(VITE_SAMPLE_VIEW_TYPE);
        }
        return true;
      },
    });

    this.addCommand({
      id: 'open-sample-view',
      name: 'Open sample view',
      callback: () => {
        void this.activateView();
      },
    });

    this.addSettingTab(new ViteSampleSettingTab(this.app, this));

    this.registerObsidianProtocolHandler('vite-sample', (params) => {
      new Notice(`Protocol handler received: ${JSON.stringify(params)}`);
    });

    this.registerDomEvent(document, 'visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.refreshOpenViews();
      }
    });

    this.startTick();
  }

  onunload(): void {
    this.stopTick();
  }

  onUserEnable(): void {
    void this.activateView();
  }

  async onExternalSettingsChange(): Promise<void> {
    await this.loadSettings();
    this.refreshStatusBar();
    this.refreshOpenViews();
  }

  async loadSettings(): Promise<void> {
    const stored = (await this.loadData()) as Partial<ViteSamplePluginSettings> | null;
    this.settings = mergeSettings(stored);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.refreshStatusBar();
    this.refreshOpenViews();
  }

  refreshStatusBar(): void {
    if (Platform.isMobile) {
      return;
    }
    if (this.settings.enableStatusBar) {
      if (!this.statusBarEl) {
        this.statusBarEl = this.addStatusBarItem();
      }
      this.statusBarEl.setText(this.settings.greeting);
    } else if (this.statusBarEl) {
      this.statusBarEl.remove();
      this.statusBarEl = null;
    }
  }

  restartTick(): void {
    this.stopTick();
    this.startTick();
  }

  private startTick(): void {
    const minutes = Math.max(1, this.settings.tickIntervalMinutes);
    this.tickHandle = window.setInterval(
      () => {
        console.debug('[obsidian-vite-sample-plugin] tick');
      },
      minutes * 60 * 1000,
    );
    this.registerInterval(this.tickHandle);
  }

  private stopTick(): void {
    if (this.tickHandle !== null) {
      window.clearInterval(this.tickHandle);
      this.tickHandle = null;
    }
  }

  private refreshOpenViews(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(VITE_SAMPLE_VIEW_TYPE)) {
      const view = leaf.view;
      if (view instanceof ViteSampleView) {
        view.render();
      }
    }
  }

  private async activateView(): Promise<void> {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(VITE_SAMPLE_VIEW_TYPE)[0];
    if (existing) {
      await workspace.revealLeaf(existing);
      return;
    }

    const leaf: WorkspaceLeaf | null = workspace.getRightLeaf(false);
    if (!leaf) {
      return;
    }
    await leaf.setViewState({ type: VITE_SAMPLE_VIEW_TYPE, active: true });
    await workspace.revealLeaf(leaf);
  }
}
