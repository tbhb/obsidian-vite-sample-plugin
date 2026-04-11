import { Platform } from 'obsidian';
import type ViteSamplePlugin from '../main';

export class StatusBarExample {
  private el: HTMLElement | null = null;

  constructor(private readonly plugin: ViteSamplePlugin) {}

  get element(): HTMLElement | null {
    return this.el;
  }

  refresh(): void {
    if (Platform.isMobile) {
      return;
    }
    if (this.plugin.settings.enableStatusBar) {
      if (!this.el) {
        this.el = this.plugin.addStatusBarItem();
      }
      this.el.setText(this.plugin.settings.greeting);
    } else if (this.el) {
      this.el.remove();
      this.el = null;
    }
  }
}
