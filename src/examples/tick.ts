import type ViteSamplePlugin from '../main';

export class TickExample {
  private handle: number | null = null;

  constructor(private readonly plugin: ViteSamplePlugin) {}

  get intervalHandle(): number | null {
    return this.handle;
  }

  start(): void {
    const minutes = Math.max(1, this.plugin.settings.tickIntervalMinutes);
    this.handle = window.setInterval(
      () => {
        console.debug('[obsidian-vite-sample-plugin] tick');
      },
      minutes * 60 * 1000,
    );
    this.plugin.registerInterval(this.handle);
  }

  stop(): void {
    if (this.handle !== null) {
      window.clearInterval(this.handle);
      this.handle = null;
    }
  }

  restart(): void {
    this.stop();
    this.start();
  }
}
