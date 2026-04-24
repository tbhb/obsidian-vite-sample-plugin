import { __resetObsidianMocks, App } from 'obsidian';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { registerDomEventExamples } from '../../src/examples/dom-events';
import ViteSamplePlugin from '../../src/main';

function makePlugin(): ViteSamplePlugin {
  return new ViteSamplePlugin(new App() as never, { id: 'vite-sample-plugin' } as never);
}

describe('registerDomEventExamples', () => {
  let originalVisibility: PropertyDescriptor | undefined;

  beforeEach(() => {
    __resetObsidianMocks();
    originalVisibility = Object.getOwnPropertyDescriptor(document, 'visibilityState');
  });

  afterEach(() => {
    if (originalVisibility) {
      Object.defineProperty(document, 'visibilityState', originalVisibility);
    }
  });

  it('registers a visibilitychange listener on the document', () => {
    const plugin = makePlugin();
    registerDomEventExamples(plugin);
    expect(plugin.__domEvents).toHaveLength(1);
    const [entry] = plugin.__domEvents;
    expect(entry?.target).toBe(document);
    expect(entry?.event).toBe('visibilitychange');
  });

  it('refreshes open views when the document becomes visible', () => {
    const plugin = makePlugin();
    const refresh = vi.spyOn(plugin, 'refreshOpenViews').mockImplementation(() => {});
    registerDomEventExamples(plugin);
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
    plugin.__domEvents[0]?.callback(new Event('visibilitychange'));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the document is hidden', () => {
    const plugin = makePlugin();
    const refresh = vi.spyOn(plugin, 'refreshOpenViews').mockImplementation(() => {});
    registerDomEventExamples(plugin);
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    });
    plugin.__domEvents[0]?.callback(new Event('visibilitychange'));
    expect(refresh).not.toHaveBeenCalled();
  });
});
