import type ViteSamplePlugin from '../main';

const TICK_FLOOR_MINUTES = 1;
const MS_PER_MINUTE = 60 * 1000;
const TICK_LOG_LINE = '[vite-sample-plugin] tick';

// Pull the arithmetic out of the class so the minute-to-millisecond
// conversion and the sub-minute floor each have a direct unit test.
export function computeTickIntervalMs(minutes: number): number {
  return Math.max(TICK_FLOOR_MINUTES, minutes) * MS_PER_MINUTE;
}

// The tick payload lives as a module-level function so tests can invoke it
// directly, rather than waiting for the interval to fire.
export function tickCallback(): void {
  console.debug(TICK_LOG_LINE);
}

export class TickExample {
  private handle: number | null = null;

  constructor(private readonly plugin: ViteSamplePlugin) {}

  get intervalHandle(): number | null {
    return this.handle;
  }

  start(): void {
    const ms = computeTickIntervalMs(this.plugin.settings.tickIntervalMinutes);
    this.handle = window.setInterval(tickCallback, ms);
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
