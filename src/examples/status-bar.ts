import { Platform } from 'obsidian';
import type ViteSamplePlugin from '../main';

export class StatusBarExample {
  private greetingItem: HTMLElement | null = null;
  private fruitsItem: HTMLElement | null = null;

  constructor(private readonly plugin: ViteSamplePlugin) {}

  get items(): readonly HTMLElement[] {
    const mounted: HTMLElement[] = [];
    if (this.greetingItem) mounted.push(this.greetingItem);
    if (this.fruitsItem) mounted.push(this.fruitsItem);
    return mounted;
  }

  refresh(): void {
    // Status bar items aren't supported on Obsidian mobile.
    if (Platform.isMobile) {
      return;
    }
    if (this.plugin.settings.enableStatusBar) {
      this.mount();
    } else {
      this.unmount();
    }
  }

  private mount(): void {
    // Grouping spans inside a single item keeps them adjacent. Obsidian
    // only inserts its default gap between separate status bar items, so
    // use one item when you want tight spacing and multiple items when
    // you want the built-in separation.
    if (!this.greetingItem) {
      this.greetingItem = this.plugin.addStatusBarItem();
    }
    this.greetingItem.empty();
    this.greetingItem.createEl('span', { text: '👋 ' });
    this.greetingItem.createEl('span', { text: this.plugin.settings.greeting });

    if (!this.fruitsItem) {
      this.fruitsItem = this.plugin.addStatusBarItem();
      this.fruitsItem.createEl('span', { text: '🍎' });
      this.fruitsItem.createEl('span', { text: '🍌' });
    }
  }

  private unmount(): void {
    this.greetingItem?.remove();
    this.greetingItem = null;
    this.fruitsItem?.remove();
    this.fruitsItem = null;
  }
}
