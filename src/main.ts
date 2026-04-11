import { Plugin, type WorkspaceLeaf } from 'obsidian';
import { registerBasesViewExamples } from './examples/bases-views';
import { registerCommandExamples } from './examples/commands';
import { registerContextMenuExamples } from './examples/context-menus';
import { registerDomEventExamples } from './examples/dom-events';
import { registerProtocolHandlerExample } from './examples/protocol';
import { registerRibbonExample } from './examples/ribbon';
import { StatusBarExample } from './examples/status-bar';
import { TickExample } from './examples/tick';
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

  readonly statusBar = new StatusBarExample(this);
  readonly tick = new TickExample(this);

  async onload(): Promise<void> {
    await this.loadSettings();

    this.registerView(VITE_SAMPLE_VIEW_TYPE, (leaf) => new ViteSampleView(leaf, this));

    registerRibbonExample(this);
    this.statusBar.refresh();
    registerCommandExamples(this);
    registerContextMenuExamples(this);
    this.addSettingTab(new ViteSampleSettingTab(this.app, this));
    registerProtocolHandlerExample(this);
    registerDomEventExamples(this);
    registerBasesViewExamples(this);

    this.tick.start();
  }

  onunload(): void {
    this.tick.stop();
  }

  onUserEnable(): void {
    void this.activateView();
  }

  async onExternalSettingsChange(): Promise<void> {
    await this.loadSettings();
    this.statusBar.refresh();
    this.refreshOpenViews();
  }

  async loadSettings(): Promise<void> {
    const stored = (await this.loadData()) as Partial<ViteSamplePluginSettings> | null;
    this.settings = mergeSettings(stored);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.statusBar.refresh();
    this.refreshOpenViews();
  }

  // Settings tab callbacks use these thin delegates so the settings module
  // stays decoupled from the example classes.
  refreshStatusBar(): void {
    this.statusBar.refresh();
  }

  restartTick(): void {
    this.tick.restart();
  }

  refreshOpenViews(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(VITE_SAMPLE_VIEW_TYPE)) {
      const view = leaf.view;
      if (view instanceof ViteSampleView) {
        view.render();
      }
    }
  }

  async activateView(): Promise<void> {
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
