import { ItemView, type WorkspaceLeaf } from 'obsidian';
import type ViteSamplePlugin from './main';
import type { ViteSamplePluginSettings } from './settings';

export const VITE_SAMPLE_VIEW_TYPE = 'vite-sample-view';

// Pulling the static content out of render() as data keeps the DOM-writing
// path small and lets unit tests assert the full copy/classes by equality.
interface ViteSampleViewModel {
  rootCls: string;
  title: { text: string; cls: string };
  list: { cls: string; items: readonly { text: string }[] };
  counter: { cls: string };
  button: { text: string; cls: readonly string[] };
}

export function buildViteSampleViewModel(settings: ViteSamplePluginSettings): ViteSampleViewModel {
  return {
    rootCls: 'vite-sample-view',
    title: { text: settings.greeting, cls: 'vite-sample-view__title' },
    list: {
      cls: 'vite-sample-view__list',
      items: [
        { text: 'This view is opened on first user enable.' },
        { text: 'Edit the greeting in the plugin settings to see it update.' },
      ],
    },
    counter: { cls: 'tw:mt-4 tw:font-semibold tw:text-text-muted' },
    button: { text: 'Increment', cls: ['mod-cta', 'tw:mt-2', 'tw:self-start'] },
  };
}

export function counterLabel(clickCount: number): string {
  return `Clicks: ${clickCount}`;
}

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
    const model = buildViteSampleViewModel(this.plugin.settings);
    contentEl.addClass(model.rootCls);

    contentEl.createEl('h2', { text: model.title.text, cls: model.title.cls });

    const list = contentEl.createDiv({ cls: model.list.cls });
    for (const item of model.list.items) {
      list.createEl('p', { text: item.text });
    }

    const counterEl = contentEl.createEl('p', {
      text: counterLabel(this.clickCount),
      cls: model.counter.cls,
    });

    const button = contentEl.createEl('button', {
      text: model.button.text,
      cls: [...model.button.cls],
    });
    button.addEventListener('click', () => {
      this.clickCount += 1;
      counterEl.setText(counterLabel(this.clickCount));
    });
  }
}
