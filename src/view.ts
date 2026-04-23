import { ItemView, type WorkspaceLeaf } from 'obsidian';
import type ViteSamplePlugin from './main';

export const VITE_SAMPLE_VIEW_TYPE = 'vite-sample-view';

export class ViteSampleView extends ItemView {
  private readonly plugin: ViteSamplePlugin;
  private clickCount = 0;

  constructor(leaf: WorkspaceLeaf, plugin: ViteSamplePlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  override getViewType(): string {
    return VITE_SAMPLE_VIEW_TYPE;
  }

  override getDisplayText(): string {
    return 'Vite sample';
  }

  override getIcon(): string {
    return 'sparkles';
  }

  override onOpen(): Promise<void> {
    this.render();
    return Promise.resolve();
  }

  override onClose(): Promise<void> {
    this.contentEl.empty();
    return Promise.resolve();
  }

  render(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('vite-sample-view');

    contentEl.createEl('h2', {
      text: this.plugin.settings.greeting,
      cls: 'vite-sample-view__title',
    });

    const list = contentEl.createDiv({ cls: 'vite-sample-view__list' });
    list.createEl('p', { text: 'This view is opened on first user enable.' });
    list.createEl('p', { text: 'Edit the greeting in the plugin settings to see it update.' });

    const counterEl = contentEl.createEl('p', {
      cls: 'tw:mt-4 tw:font-semibold tw:text-text-muted',
      text: `Clicks: ${this.clickCount}`,
    });

    const button = contentEl.createEl('button', {
      cls: ['mod-cta', 'tw:mt-2', 'tw:self-start'],
      text: 'Increment',
    });
    button.addEventListener('click', () => {
      this.clickCount += 1;
      counterEl.setText(`Clicks: ${this.clickCount}`);
    });
  }
}
