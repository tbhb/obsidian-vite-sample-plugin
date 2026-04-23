import {
  type BasesAllOptions,
  type BasesEntry,
  type BasesEntryGroup,
  type BasesPropertyId,
  BasesView,
  type BasesViewConfig,
  type HoverParent,
  type HoverPopover,
  Keymap,
  parsePropertyId,
  type QueryController,
} from 'obsidian';
import type ViteSamplePlugin from '../main';

export const VITE_SAMPLE_LIST_BASES_VIEW_TYPE = 'vite-sample-bases-list';
export const VITE_SAMPLE_CARDS_BASES_VIEW_TYPE = 'vite-sample-bases-cards';

export function registerBasesViewExamples(plugin: ViteSamplePlugin): void {
  // Obsidian 1.10 added Bases views. Feature-detect so the plugin still
  // loads on older vaults that match the manifest's minAppVersion.
  if (typeof plugin.registerBasesView !== 'function') {
    return;
  }

  plugin.registerBasesView(VITE_SAMPLE_LIST_BASES_VIEW_TYPE, {
    name: 'Vite sample list',
    icon: 'list',
    factory: (controller, containerEl) =>
      new ViteSampleListBasesView(controller, containerEl, plugin),
    options: (): BasesAllOptions[] => [
      {
        type: 'text',
        key: 'separator',
        displayName: 'Property separator',
        default: ' · ',
      },
      {
        type: 'toggle',
        key: 'showGroupHeadings',
        displayName: 'Show group headings',
        default: true,
      },
    ],
  });

  plugin.registerBasesView(VITE_SAMPLE_CARDS_BASES_VIEW_TYPE, {
    name: 'Vite sample cards',
    icon: 'layout-grid',
    factory: (controller, containerEl) => new ViteSampleCardsBasesView(controller, containerEl),
    options: (): BasesAllOptions[] => [
      {
        type: 'dropdown',
        key: 'cardSize',
        displayName: 'Card size',
        default: 'medium',
        options: {
          small: 'Small',
          medium: 'Medium',
          large: 'Large',
        },
      },
      {
        type: 'toggle',
        key: 'showLabels',
        displayName: 'Show property labels',
        default: true,
      },
    ],
  });
}

class ViteSampleListBasesView extends BasesView implements HoverParent {
  readonly type = VITE_SAMPLE_LIST_BASES_VIEW_TYPE;
  hoverPopover: HoverPopover | null = null;

  private readonly plugin: ViteSamplePlugin;
  private readonly rootEl: HTMLElement;

  constructor(controller: QueryController, parentEl: HTMLElement, plugin: ViteSamplePlugin) {
    super(controller);
    this.plugin = plugin;
    this.rootEl = parentEl.createDiv({ cls: 'vite-sample-bases-list' });
  }

  onDataUpdated(): void {
    const config: BasesViewConfig = this.config;
    const rawSeparator = config.get('separator');
    const separator = typeof rawSeparator === 'string' && rawSeparator ? rawSeparator : ' · ';
    const showGroupHeadings = config.get('showGroupHeadings') !== false;
    const order = config.getOrder();

    this.rootEl.empty();

    for (const group of this.data.groupedData) {
      this.renderGroup(group, { separator, showGroupHeadings, order });
    }
  }

  private renderGroup(
    group: BasesEntryGroup,
    opts: { separator: string; showGroupHeadings: boolean; order: BasesPropertyId[] },
  ): void {
    const groupEl = this.rootEl.createDiv({ cls: 'vite-sample-bases-list__group' });

    if (opts.showGroupHeadings && group.hasKey() && group.key) {
      groupEl.createEl('h4', {
        cls: 'vite-sample-bases-list__group-heading',
        text: group.key.toString(),
      });
    }

    const listEl = groupEl.createEl('ul', { cls: 'vite-sample-bases-list__items' });

    for (const entry of group.entries) {
      this.renderEntry(listEl, entry, opts.order, opts.separator);
    }
  }

  private renderEntry(
    listEl: HTMLElement,
    entry: BasesEntry,
    order: BasesPropertyId[],
    separator: string,
  ): void {
    const itemEl = listEl.createEl('li', { cls: 'vite-sample-bases-list__item' });
    let firstProp = true;

    for (const propertyId of order) {
      const value = entry.getValue(propertyId);
      const text = value ? value.toString() : '';
      if (!text) {
        continue;
      }

      if (!firstProp) {
        itemEl.createSpan({
          cls: 'vite-sample-bases-list__separator',
          text: separator,
        });
      }
      firstProp = false;

      const { type, name } = parsePropertyId(propertyId);
      if (type === 'file' && name === 'name') {
        this.renderFileLink(itemEl, entry.file.path, text);
      } else {
        itemEl.createSpan({
          cls: 'vite-sample-bases-list__value',
          text,
        });
      }
    }
  }

  private renderFileLink(parent: HTMLElement, path: string, text: string): void {
    const { app } = this.plugin;
    const linkEl = parent.createEl('a', {
      cls: 'vite-sample-bases-list__link internal-link',
      text,
    });

    linkEl.addEventListener('click', (evt) => {
      if (evt.button !== 0 && evt.button !== 1) {
        return;
      }
      evt.preventDefault();
      void app.workspace.openLinkText(path, '', Keymap.isModEvent(evt));
    });

    linkEl.addEventListener('mouseover', (evt) => {
      app.workspace.trigger('hover-link', {
        event: evt,
        source: 'vite-sample-bases',
        hoverParent: this,
        targetEl: linkEl,
        linktext: path,
      });
    });
  }
}

class ViteSampleCardsBasesView extends BasesView {
  readonly type = VITE_SAMPLE_CARDS_BASES_VIEW_TYPE;

  private readonly rootEl: HTMLElement;

  constructor(controller: QueryController, parentEl: HTMLElement) {
    super(controller);
    this.rootEl = parentEl.createDiv({ cls: 'vite-sample-bases-cards' });
  }

  onDataUpdated(): void {
    const config: BasesViewConfig = this.config;
    const rawSize = config.get('cardSize');
    const cardSize = typeof rawSize === 'string' ? rawSize : 'medium';
    const showLabels = config.get('showLabels') !== false;
    const order = config.getOrder();

    this.rootEl.empty();
    this.rootEl.dataset['cardSize'] = cardSize;

    for (const group of this.data.groupedData) {
      const gridEl = this.rootEl.createDiv({ cls: 'vite-sample-bases-cards__grid' });
      for (const entry of group.entries) {
        this.renderCard(gridEl, entry, config, order, showLabels);
      }
    }
  }

  private renderCard(
    gridEl: HTMLElement,
    entry: BasesEntry,
    config: BasesViewConfig,
    order: BasesPropertyId[],
    showLabels: boolean,
  ): void {
    const cardEl = gridEl.createDiv({ cls: 'vite-sample-bases-card' });
    cardEl.createEl('h4', {
      cls: 'vite-sample-bases-card__title',
      text: entry.file.basename,
    });

    const dl = cardEl.createEl('dl', { cls: 'vite-sample-bases-card__properties' });
    for (const propertyId of order) {
      const value = entry.getValue(propertyId);
      const text = value ? value.toString() : '';
      if (!text) {
        continue;
      }

      if (showLabels) {
        dl.createEl('dt', {
          cls: 'vite-sample-bases-card__label',
          text: config.getDisplayName(propertyId),
        });
      }
      dl.createEl('dd', {
        cls: 'vite-sample-bases-card__value',
        text,
      });
    }
  }
}
