import {
  __resetObsidianMocks,
  App,
  MarkdownView,
  Menu,
  Platform,
  TFile,
  TFolder,
  WorkspaceLeaf,
} from 'obsidian';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ViteSamplePlugin from '../src/main';
import { DEFAULT_SETTINGS } from '../src/settings';
import { VITE_SAMPLE_VIEW_TYPE, ViteSampleView } from '../src/view';

function makePlugin(): ViteSamplePlugin {
  return new ViteSamplePlugin(new App() as never, { id: 'obsidian-vite-sample-plugin' } as never);
}

beforeEach(() => {
  __resetObsidianMocks();
});

describe('ViteSamplePlugin.loadSettings', () => {
  it('falls back to defaults when loadData returns null', async () => {
    const plugin = makePlugin();
    plugin.loadData = vi.fn(async () => null);
    await plugin.loadSettings();
    expect(plugin.settings).toEqual(DEFAULT_SETTINGS);
  });

  it('merges stored partial settings over defaults', async () => {
    const plugin = makePlugin();
    plugin.loadData = vi.fn(async () => ({ greeting: 'stored greeting' }));
    await plugin.loadSettings();
    expect(plugin.settings.greeting).toBe('stored greeting');
    expect(plugin.settings.enableStatusBar).toBe(DEFAULT_SETTINGS.enableStatusBar);
    expect(plugin.settings.tickIntervalMinutes).toBe(DEFAULT_SETTINGS.tickIntervalMinutes);
  });
});

describe('ViteSamplePlugin.saveSettings', () => {
  it('persists the current settings via saveData and refreshes UI', async () => {
    const plugin = makePlugin();
    plugin.settings = { ...DEFAULT_SETTINGS, greeting: 'new' };
    const saveData = vi.fn();
    plugin.saveData = saveData;
    await plugin.saveSettings();
    expect(saveData).toHaveBeenCalledWith(plugin.settings);
  });
});

describe('ViteSamplePlugin.refreshStatusBar', () => {
  it('adds and updates status bar items when enabled on desktop', () => {
    const plugin = makePlugin();
    plugin.settings = { ...DEFAULT_SETTINGS, enableStatusBar: true };
    Platform.isMobile = false;

    plugin.refreshStatusBar();
    plugin.refreshStatusBar(); // second call hits the "already-mounted" branch

    // One call per item: the grouped greeting item, plus the separate fruits item.
    expect(plugin.addStatusBarItem).toHaveBeenCalledTimes(2);
    expect(plugin.statusBar.items).toHaveLength(2);
    expect(plugin.statusBar.items[0]?.textContent).toContain(DEFAULT_SETTINGS.greeting);
    expect(plugin.statusBar.items[1]?.textContent).toBe('🍎🍌');
  });

  it('removes the status bar items when toggled off', () => {
    const plugin = makePlugin();
    plugin.settings = { ...DEFAULT_SETTINGS, enableStatusBar: true };
    plugin.refreshStatusBar();
    expect(plugin.statusBar.items).toHaveLength(2);

    plugin.settings.enableStatusBar = false;
    plugin.refreshStatusBar();
    expect(plugin.statusBar.items).toHaveLength(0);
  });

  it('is a no-op when toggled off and already absent', () => {
    const plugin = makePlugin();
    plugin.settings = { ...DEFAULT_SETTINGS, enableStatusBar: false };
    plugin.refreshStatusBar();
    expect(plugin.statusBar.items).toHaveLength(0);
  });

  it('does nothing on mobile', () => {
    const plugin = makePlugin();
    Platform.isMobile = true;
    plugin.settings = { ...DEFAULT_SETTINGS, enableStatusBar: true };
    plugin.refreshStatusBar();
    expect(plugin.addStatusBarItem).not.toHaveBeenCalled();
  });
});

describe('ViteSamplePlugin.onload', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('registers view, ribbon, commands, status bar, setting tab, protocol, dom event, and interval', async () => {
    vi.useFakeTimers();
    const plugin = makePlugin();
    await plugin.onload();

    expect(plugin.__viewFactories.has(VITE_SAMPLE_VIEW_TYPE)).toBe(true);
    expect(plugin.__ribbonIcons).toHaveLength(1);
    expect(plugin.__commands.map((c) => c.id)).toEqual([
      'show-greeting-notice',
      'open-sample-modal',
      'insert-greeting',
      'uppercase-selection',
      'wrap-selection-in-greeting',
      'close-sample-view',
      'open-sample-view',
    ]);
    expect(plugin.__settingTabs).toHaveLength(1);
    expect(plugin.__protocolHandlers.has('vite-sample')).toBe(true);
    expect(plugin.__domEvents).toHaveLength(1);
    expect(plugin.__statusBarItems).toHaveLength(2);
    expect(plugin.registerInterval).toHaveBeenCalled();

    // Advance the timer past one tick to cover the interval callback body.
    vi.advanceTimersByTime(DEFAULT_SETTINGS.tickIntervalMinutes * 60 * 1000 + 1);

    plugin.onunload();
  });

  it('skips the status bar on mobile even when enabled', async () => {
    Platform.isMobile = true;
    const plugin = makePlugin();
    await plugin.onload();
    expect(plugin.__statusBarItems).toHaveLength(0);
    plugin.onunload();
  });

  it('constructs the custom view through the registered factory', async () => {
    const plugin = makePlugin();
    await plugin.onload();
    const factory = plugin.__viewFactories.get(VITE_SAMPLE_VIEW_TYPE);
    expect(factory).toBeDefined();
    const leaf = new WorkspaceLeaf();
    const view = factory?.(leaf);
    expect(view).toBeInstanceOf(ViteSampleView);
    plugin.onunload();
  });
});

describe('ViteSamplePlugin registered callbacks', () => {
  let plugin: ViteSamplePlugin;

  beforeEach(async () => {
    plugin = makePlugin();
    await plugin.onload();
  });

  afterEach(() => {
    plugin.onunload();
  });

  it('ribbon icon click opens the view', () => {
    const spy = vi.spyOn(plugin.app.workspace, 'getLeavesOfType').mockReturnValue([]);
    const ribbon = plugin.__ribbonIcons[0];
    expect(ribbon).toBeDefined();
    ribbon?.callback(new MouseEvent('click'));
    expect(spy).toHaveBeenCalledWith(VITE_SAMPLE_VIEW_TYPE);
  });

  it('show-greeting-notice command runs without throwing', () => {
    const cmd = plugin.__findCommand('show-greeting-notice');
    expect(() => cmd?.callback?.()).not.toThrow();
  });

  it('open-sample-modal command opens a modal', () => {
    const cmd = plugin.__findCommand('open-sample-modal');
    expect(() => cmd?.callback?.()).not.toThrow();
  });

  it('open-sample-view command activates the view', () => {
    const cmd = plugin.__findCommand('open-sample-view');
    expect(() => cmd?.callback?.()).not.toThrow();
  });

  it('insert-greeting editorCheckCallback branches on view type and checking flag', () => {
    const cmd = plugin.__findCommand('insert-greeting');
    const editor = { replaceSelection: vi.fn() };
    const markdownView = new MarkdownView();

    // Not a MarkdownView → false
    expect(cmd?.editorCheckCallback?.(true, editor, {})).toBe(false);

    // MarkdownView, checking=true → true, no replace
    expect(cmd?.editorCheckCallback?.(true, editor, markdownView)).toBe(true);
    expect(editor.replaceSelection).not.toHaveBeenCalled();

    // MarkdownView, checking=false → true, replace executed
    expect(cmd?.editorCheckCallback?.(false, editor, markdownView)).toBe(true);
    expect(editor.replaceSelection).toHaveBeenCalledWith(DEFAULT_SETTINGS.greeting);
  });

  it('uppercase-selection editorCallback replaces selection with uppercase text', () => {
    const cmd = plugin.__findCommand('uppercase-selection');
    const editor = {
      getSelection: vi.fn(() => 'hello world'),
      replaceSelection: vi.fn(),
    };
    cmd?.editorCallback?.(editor, new MarkdownView());
    expect(editor.replaceSelection).toHaveBeenCalledWith('HELLO WORLD');
  });

  it('wrap-selection-in-greeting editorCheckCallback covers view, selection, and run branches', () => {
    const cmd = plugin.__findCommand('wrap-selection-in-greeting');
    const editor = {
      getSelection: vi.fn(() => 'world'),
      replaceSelection: vi.fn(),
    };
    const markdownView = new MarkdownView();

    // Not a MarkdownView → false
    expect(cmd?.editorCheckCallback?.(true, editor, {})).toBe(false);

    // MarkdownView with empty selection → false
    editor.getSelection.mockReturnValueOnce('');
    expect(cmd?.editorCheckCallback?.(true, editor, markdownView)).toBe(false);

    // MarkdownView with selection, checking=true → true, no replace
    expect(cmd?.editorCheckCallback?.(true, editor, markdownView)).toBe(true);
    expect(editor.replaceSelection).not.toHaveBeenCalled();

    // MarkdownView with selection, checking=false → true, replace executed
    expect(cmd?.editorCheckCallback?.(false, editor, markdownView)).toBe(true);
    expect(editor.replaceSelection).toHaveBeenCalledWith(`${DEFAULT_SETTINGS.greeting}: world`);
  });

  it('close-sample-view checkCallback disables when no leaves and detaches when present', () => {
    const cmd = plugin.__findCommand('close-sample-view');
    const getLeavesSpy = vi.spyOn(plugin.app.workspace, 'getLeavesOfType');
    const detachSpy = vi.spyOn(plugin.app.workspace, 'detachLeavesOfType');

    // No leaves → false
    getLeavesSpy.mockReturnValueOnce([]);
    expect(cmd?.checkCallback?.(true)).toBe(false);
    expect(detachSpy).not.toHaveBeenCalled();

    // Leaves present, checking=true → true, detach not called
    getLeavesSpy.mockReturnValueOnce([new WorkspaceLeaf()]);
    expect(cmd?.checkCallback?.(true)).toBe(true);
    expect(detachSpy).not.toHaveBeenCalled();

    // Leaves present, checking=false → true, detach called
    getLeavesSpy.mockReturnValueOnce([new WorkspaceLeaf()]);
    expect(cmd?.checkCallback?.(false)).toBe(true);
    expect(detachSpy).toHaveBeenCalledWith(VITE_SAMPLE_VIEW_TYPE);
  });

  it('protocol handler runs without throwing', () => {
    const handler = plugin.__protocolHandlers.get('vite-sample');
    expect(() => handler?.({ action: 'open' })).not.toThrow();
  });

  it('visibilitychange listener refreshes open views when visible', () => {
    const leaf = new WorkspaceLeaf();
    const view = new ViteSampleView(leaf, plugin);
    leaf.view = view;
    const renderSpy = vi.spyOn(view, 'render');
    vi.spyOn(plugin.app.workspace, 'getLeavesOfType').mockReturnValue([leaf]);

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
    plugin.__domEvents[0]?.callback(new Event('visibilitychange'));
    expect(renderSpy).toHaveBeenCalled();
  });

  function getWorkspaceHandler(event: string): (...args: unknown[]) => unknown {
    const handlers = plugin.app.workspace.__eventHandlers;
    const ref = handlers.find((h) => h.event === event);
    if (!ref) {
      throw new Error(`no handler registered for ${event}`);
    }
    return ref.cb;
  }

  it('file-menu handler ignores non-file entries like folders', () => {
    const handler = getWorkspaceHandler('file-menu');
    const menu = new Menu();
    handler(menu, new TFolder(), 'source');
    expect(menu.items).toHaveLength(0);
  });

  it('file-menu handler adds a separator and a print-path item for TFile', () => {
    const handler = getWorkspaceHandler('file-menu');
    const menu = new Menu();
    const file = new TFile();
    file.path = 'notes/hello.md';

    handler(menu, file, 'source');

    expect(menu.items).toHaveLength(2);
    const [item] = menu.__getMenuItems();
    expect(item?.title).toBe('Print file path');
    expect(item?.icon).toBe('document');
    expect(() => item?.__trigger()).not.toThrow();
  });

  it('editor-menu handler ignores non-MarkdownView views', () => {
    const handler = getWorkspaceHandler('editor-menu');
    const menu = new Menu();
    const editor = { getSelection: vi.fn(() => ''), replaceSelection: vi.fn() };
    handler(menu, editor, {});
    expect(menu.items).toHaveLength(0);
    expect(editor.getSelection).not.toHaveBeenCalled();
  });

  it('editor-menu handler adds only the insert item when there is no selection', () => {
    const handler = getWorkspaceHandler('editor-menu');
    const menu = new Menu();
    const editor = { getSelection: vi.fn(() => ''), replaceSelection: vi.fn() };

    handler(menu, editor, new MarkdownView());

    const items = menu.__getMenuItems();
    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe('Insert greeting');
    items[0]?.__trigger();
    expect(editor.replaceSelection).toHaveBeenCalledWith(DEFAULT_SETTINGS.greeting);
  });

  it('editor-menu handler adds both items when there is a selection', () => {
    const handler = getWorkspaceHandler('editor-menu');
    const menu = new Menu();
    const editor = { getSelection: vi.fn(() => 'hello'), replaceSelection: vi.fn() };

    handler(menu, editor, new MarkdownView());

    const items = menu.__getMenuItems();
    expect(items).toHaveLength(2);
    expect(items[1]?.title).toBe('Uppercase selection');

    items[0]?.__trigger();
    expect(editor.replaceSelection).toHaveBeenLastCalledWith(DEFAULT_SETTINGS.greeting);

    items[1]?.__trigger();
    expect(editor.replaceSelection).toHaveBeenLastCalledWith('HELLO');
  });

  it('visibilitychange listener does nothing when hidden', () => {
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    });
    const spy = vi.spyOn(plugin.app.workspace, 'getLeavesOfType');
    plugin.__domEvents[0]?.callback(new Event('visibilitychange'));
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('ViteSamplePlugin.onExternalSettingsChange', () => {
  it('reloads settings and refreshes UI', async () => {
    const plugin = makePlugin();
    plugin.loadData = vi.fn(async () => ({ greeting: 'external' }));
    await plugin.onExternalSettingsChange();
    expect(plugin.settings.greeting).toBe('external');
  });
});

describe('ViteSamplePlugin.onUserEnable', () => {
  it('activates the view', () => {
    const plugin = makePlugin();
    const spy = vi.spyOn(plugin.app.workspace, 'getLeavesOfType').mockReturnValue([]);
    plugin.onUserEnable();
    expect(spy).toHaveBeenCalledWith(VITE_SAMPLE_VIEW_TYPE);
  });
});

describe('ViteSamplePlugin.restartTick / stopTick', () => {
  afterEach(() => vi.useRealTimers());

  it('restartTick stops and restarts the interval', () => {
    vi.useFakeTimers();
    const plugin = makePlugin();
    plugin.settings = { ...DEFAULT_SETTINGS };
    plugin.restartTick();
    const first = plugin.tick.intervalHandle;
    expect(first).not.toBeNull();

    plugin.restartTick();
    const second = plugin.tick.intervalHandle;
    expect(second).not.toBeNull();
    expect(second).not.toBe(first);

    plugin.onunload();
  });

  it('onunload handles an already-stopped tick (tickHandle === null)', () => {
    const plugin = makePlugin();
    expect(plugin.tick.intervalHandle).toBeNull();
    expect(() => plugin.onunload()).not.toThrow();
  });
});

describe('ViteSamplePlugin activateView paths', () => {
  it('reveals an existing leaf when one is already open', async () => {
    const plugin = makePlugin();
    const existing = new WorkspaceLeaf();
    vi.spyOn(plugin.app.workspace, 'getLeavesOfType').mockReturnValue([existing]);
    const reveal = vi.spyOn(plugin.app.workspace, 'revealLeaf');
    plugin.onUserEnable();
    await new Promise((r) => setTimeout(r, 0));
    expect(reveal).toHaveBeenCalledWith(existing);
  });

  it('creates a new right-leaf when none exists', async () => {
    const plugin = makePlugin();
    const leaf = new WorkspaceLeaf();
    vi.spyOn(plugin.app.workspace, 'getLeavesOfType').mockReturnValue([]);
    vi.spyOn(plugin.app.workspace, 'getRightLeaf').mockReturnValue(leaf);
    const reveal = vi.spyOn(plugin.app.workspace, 'revealLeaf');

    plugin.onUserEnable();
    await new Promise((r) => setTimeout(r, 0));
    expect(leaf.setViewState).toHaveBeenCalledWith({
      type: VITE_SAMPLE_VIEW_TYPE,
      active: true,
    });
    expect(reveal).toHaveBeenCalledWith(leaf);
  });

  it('bails out when getRightLeaf returns null', async () => {
    const plugin = makePlugin();
    vi.spyOn(plugin.app.workspace, 'getLeavesOfType').mockReturnValue([]);
    vi.spyOn(plugin.app.workspace, 'getRightLeaf').mockReturnValue(null);
    const reveal = vi.spyOn(plugin.app.workspace, 'revealLeaf');

    plugin.onUserEnable();
    await new Promise((r) => setTimeout(r, 0));
    expect(reveal).not.toHaveBeenCalled();
  });
});

describe('ViteSamplePlugin refreshOpenViews via saveSettings', () => {
  it('re-renders only ViteSampleView leaves and skips foreign views', async () => {
    const plugin = makePlugin();
    plugin.settings = { ...DEFAULT_SETTINGS };

    const matchingLeaf = new WorkspaceLeaf();
    const matchingView = new ViteSampleView(matchingLeaf, plugin);
    matchingLeaf.view = matchingView;
    const renderSpy = vi.spyOn(matchingView, 'render');

    const foreignLeaf = new WorkspaceLeaf();
    foreignLeaf.view = { render: vi.fn() };

    vi.spyOn(plugin.app.workspace, 'getLeavesOfType').mockReturnValue([matchingLeaf, foreignLeaf]);

    await plugin.saveSettings();
    expect(renderSpy).toHaveBeenCalled();
  });
});
