import { __resetObsidianMocks, App } from 'obsidian';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computeTickIntervalMs, TickExample, tickCallback } from '../../src/examples/tick';
import ViteSamplePlugin from '../../src/main';
import { DEFAULT_SETTINGS } from '../../src/settings';

function makePlugin(): ViteSamplePlugin {
  return new ViteSamplePlugin(new App() as never, { id: 'vite-sample-plugin' } as never);
}

describe('computeTickIntervalMs', () => {
  it('multiplies minutes by 60 * 1000 when above the one-minute floor', () => {
    expect(computeTickIntervalMs(1)).toBe(60_000);
    expect(computeTickIntervalMs(5)).toBe(300_000);
    expect(computeTickIntervalMs(30)).toBe(1_800_000);
  });

  it('clamps values below one minute up to the floor', () => {
    expect(computeTickIntervalMs(0)).toBe(60_000);
    expect(computeTickIntervalMs(-5)).toBe(60_000);
  });
});

describe('tickCallback', () => {
  it('logs the plugin tick line via console.debug', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    try {
      tickCallback();
      expect(spy).toHaveBeenCalledWith('[vite-sample-plugin] tick');
    } finally {
      spy.mockRestore();
    }
  });
});

describe('TickExample', () => {
  let plugin: ViteSamplePlugin;
  let tick: TickExample;

  beforeEach(() => {
    __resetObsidianMocks();
    vi.useFakeTimers();
    plugin = makePlugin();
    plugin.settings = { ...DEFAULT_SETTINGS };
    tick = new TickExample(plugin);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('start schedules setInterval with the computed tick interval', () => {
    const spy = vi.spyOn(window, 'setInterval');
    tick.start();
    expect(spy).toHaveBeenCalledWith(
      tickCallback,
      computeTickIntervalMs(DEFAULT_SETTINGS.tickIntervalMinutes),
    );
    expect(tick.intervalHandle).not.toBeNull();
    expect(plugin.registerInterval).toHaveBeenCalledWith(tick.intervalHandle);
  });

  it('stop clears the native interval and resets the handle when running', () => {
    const clearSpy = vi.spyOn(window, 'clearInterval');
    tick.start();
    const handle = tick.intervalHandle;
    tick.stop();
    expect(clearSpy).toHaveBeenCalledWith(handle);
    expect(tick.intervalHandle).toBeNull();
  });

  it('stop is a no-op when the interval is already stopped', () => {
    const clearSpy = vi.spyOn(window, 'clearInterval');
    tick.stop();
    expect(clearSpy).not.toHaveBeenCalled();
    expect(tick.intervalHandle).toBeNull();
  });

  it('restart stops the running interval and starts a new one', () => {
    tick.start();
    const first = tick.intervalHandle;
    tick.restart();
    const second = tick.intervalHandle;
    expect(second).not.toBeNull();
    expect(second).not.toBe(first);
  });
});
