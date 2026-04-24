import {
  __getSettings,
  __resetObsidianMocks,
  App,
  type ButtonComponent,
  type ColorComponent,
  type DropdownComponent,
  type ExtraButtonComponent,
  type MomentFormatComponent,
  Platform,
  type ProgressBarComponent,
  type SearchComponent,
  type Setting,
  type SliderComponent,
  type TextAreaComponent,
  type TextComponent,
  type ToggleComponent,
} from 'obsidian';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ViteSamplePlugin from '../../src/main';
import { DEFAULT_SETTINGS, mergeSettings, ViteSampleSettingTab } from '../../src/settings';

describe('DEFAULT_SETTINGS', () => {
  it('matches the shipped defaults exactly', () => {
    expect(DEFAULT_SETTINGS).toEqual({
      greeting: 'Hello from vite-sample-plugin',
      greetingNotes: '',
      filter: '',
      theme: 'auto',
      accentColor: '#7c3aed',
      dateFormat: 'YYYY-MM-DD',
      enableStatusBar: true,
      tickIntervalMinutes: 5,
    });
  });
});

describe('mergeSettings', () => {
  it('returns defaults when stored data is null', () => {
    expect(mergeSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it('returns defaults when stored data is undefined', () => {
    expect(mergeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
  });

  it('overrides only the provided fields', () => {
    const merged = mergeSettings({ greeting: 'custom' });
    expect(merged.greeting).toBe('custom');
    expect(merged.enableStatusBar).toBe(DEFAULT_SETTINGS.enableStatusBar);
    expect(merged.tickIntervalMinutes).toBe(DEFAULT_SETTINGS.tickIntervalMinutes);
  });

  it('does not mutate DEFAULT_SETTINGS', () => {
    const before = { ...DEFAULT_SETTINGS };
    mergeSettings({ greeting: 'mutated' });
    expect(DEFAULT_SETTINGS).toEqual(before);
  });

  it('handles an empty object', () => {
    expect(mergeSettings({})).toEqual(DEFAULT_SETTINGS);
  });
});

describe('ViteSampleSettingTab.display', () => {
  let plugin: ViteSamplePlugin;
  let tab: ViteSampleSettingTab;

  beforeEach(() => {
    __resetObsidianMocks();
    Platform.isMobile = false;
    plugin = new ViteSamplePlugin(new App() as never, {} as never);
    plugin.settings = { ...DEFAULT_SETTINGS };
    plugin.saveData = vi.fn();
    tab = new ViteSampleSettingTab(plugin.app, plugin);
  });

  function findSetting(name: string): Setting {
    const match = __getSettings().find((s) => s.name === name);
    if (!match) {
      throw new Error(`no Setting row named ${name}`);
    }
    return match;
  }

  it('renders five section headings and an intro paragraph with a docs link', () => {
    tab.display();
    const headings = __getSettings().filter((s) => s.heading);
    expect(headings.map((h) => h.name)).toEqual([
      'Text inputs',
      'Appearance',
      'Status bar',
      'Background tick',
      'Danger zone',
    ]);
    const link = tab.containerEl.querySelector('a');
    expect(link?.getAttribute('href')).toBe(
      'https://docs.obsidian.md/Plugins/User+interface/Settings',
    );
  });

  it('clearing then re-rendering empties the container before rebuilding', () => {
    tab.display();
    const afterFirst = tab.containerEl.childElementCount;
    tab.display();
    expect(tab.containerEl.childElementCount).toBe(afterFirst);
  });

  it('greeting text onChange updates settings and persists', async () => {
    tab.display();
    const text = findSetting('Greeting').components[0] as TextComponent;
    await text.__trigger('new greeting');
    expect(plugin.settings.greeting).toBe('new greeting');
    expect(plugin.saveData).toHaveBeenCalled();
  });

  it('greeting extra-button resets the greeting and re-renders the tab', async () => {
    tab.display();
    plugin.settings.greeting = 'changed';
    const extra = findSetting('Greeting').components[1] as ExtraButtonComponent;
    expect(extra.icon).toBe('rotate-ccw');
    const displaySpy = vi.spyOn(tab, 'display');
    await extra.__trigger();
    expect(plugin.settings.greeting).toBe(DEFAULT_SETTINGS.greeting);
    expect(plugin.saveData).toHaveBeenCalled();
    expect(displaySpy).toHaveBeenCalled();
  });

  it('greeting notes textarea onChange persists', async () => {
    tab.display();
    const area = findSetting('Greeting notes').components[0] as TextAreaComponent;
    await area.__trigger('some notes');
    expect(plugin.settings.greetingNotes).toBe('some notes');
    expect(plugin.saveData).toHaveBeenCalled();
  });

  it('filter search onChange persists', async () => {
    tab.display();
    const search = findSetting('Filter').components[0] as SearchComponent;
    await search.__trigger('query');
    expect(plugin.settings.filter).toBe('query');
    expect(plugin.saveData).toHaveBeenCalled();
  });

  it('theme dropdown registers every option and onChange persists the selection', async () => {
    tab.display();
    const dropdown = findSetting('Theme preference').components[0] as DropdownComponent;
    expect(dropdown.options).toEqual({
      auto: 'Match Obsidian',
      light: 'Light',
      dark: 'Dark',
    });
    await dropdown.__trigger('dark');
    expect(plugin.settings.theme).toBe('dark');
    expect(plugin.saveData).toHaveBeenCalled();
  });

  it('accent color picker onChange persists', async () => {
    tab.display();
    const picker = findSetting('Accent color').components[0] as ColorComponent;
    await picker.__trigger('#123456');
    expect(plugin.settings.accentColor).toBe('#123456');
    expect(plugin.saveData).toHaveBeenCalled();
  });

  it('date format moment component wires up a sample element and onChange persists', async () => {
    tab.display();
    const setting = findSetting('Date format');
    const moment = setting.components[0] as MomentFormatComponent;
    expect(moment.sampleEl).not.toBeNull();
    expect(setting.settingEl.querySelector('small')).toBe(moment.sampleEl);
    expect(moment.defaultFormat).toBe('YYYY-MM-DD');
    await moment.__trigger('DD/MM/YYYY');
    expect(plugin.settings.dateFormat).toBe('DD/MM/YYYY');
    expect(plugin.saveData).toHaveBeenCalled();
  });

  it('status bar toggle onChange persists and refreshes the status bar', async () => {
    tab.display();
    const toggle = findSetting('Show status bar item').components[0] as ToggleComponent;
    const refreshSpy = vi.spyOn(plugin, 'refreshStatusBar');
    await toggle.__trigger(false);
    expect(plugin.settings.enableStatusBar).toBe(false);
    expect(plugin.saveData).toHaveBeenCalled();
    expect(refreshSpy).toHaveBeenCalled();
  });

  it('tick interval slider onChange persists and restarts the tick', async () => {
    tab.display();
    const slider = findSetting('Tick interval').components[0] as SliderComponent;
    const restartSpy = vi.spyOn(plugin, 'restartTick').mockImplementation(() => {});
    await slider.__trigger(10);
    expect(plugin.settings.tickIntervalMinutes).toBe(10);
    expect(plugin.saveData).toHaveBeenCalled();
    expect(restartSpy).toHaveBeenCalled();
  });

  it('tick load progress bar reflects the slider as a percentage of its range', () => {
    plugin.settings.tickIntervalMinutes = 16;
    tab.display();
    const bar = findSetting('Tick load').components[0] as ProgressBarComponent;
    // (16 - 1) / (30 - 1) * 100 ≈ 51.72
    expect(bar.value).toBeCloseTo(51.72, 1);
  });

  it('reset button restores defaults, saves, and re-renders', async () => {
    tab.display();
    plugin.settings = {
      ...DEFAULT_SETTINGS,
      greeting: 'changed',
      theme: 'dark',
      accentColor: '#000000',
    };
    const button = findSetting('Reset to defaults').components[0] as ButtonComponent;
    const displaySpy = vi.spyOn(tab, 'display');
    await button.__trigger();
    expect(plugin.settings).toEqual(DEFAULT_SETTINGS);
    expect(plugin.saveData).toHaveBeenCalled();
    expect(displaySpy).toHaveBeenCalled();
  });
});
