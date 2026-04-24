import { __resetObsidianMocks, App } from 'obsidian';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerRibbonExample } from '../../src/examples/ribbon';
import ViteSamplePlugin from '../../src/main';

function makePlugin(): ViteSamplePlugin {
  return new ViteSamplePlugin(new App() as never, { id: 'obsidian-vite-sample-plugin' } as never);
}

describe('registerRibbonExample', () => {
  beforeEach(() => {
    __resetObsidianMocks();
  });

  it('registers a single ribbon icon with the sparkles icon and sentence-case title', () => {
    const plugin = makePlugin();
    registerRibbonExample(plugin);
    expect(plugin.__ribbonIcons).toHaveLength(1);
    const [ribbon] = plugin.__ribbonIcons;
    expect(ribbon?.icon).toBe('sparkles');
    expect(ribbon?.title).toBe('Open vite sample view');
  });

  it('ribbon callback activates the view', () => {
    const plugin = makePlugin();
    const activateSpy = vi.spyOn(plugin, 'activateView').mockResolvedValue();
    registerRibbonExample(plugin);
    plugin.__ribbonIcons[0]?.callback(new MouseEvent('click'));
    expect(activateSpy).toHaveBeenCalled();
  });
});
