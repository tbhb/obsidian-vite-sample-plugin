import {
	__getSettings,
	__resetObsidianMocks,
	App,
	Platform,
	type SliderComponent,
	type TextComponent,
	type ToggleComponent,
} from 'obsidian';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ViteSamplePlugin from '../src/main';
import { DEFAULT_SETTINGS, mergeSettings, ViteSampleSettingTab } from '../src/settings';

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

	it('creates one setting each for greeting, status bar toggle, and tick interval', () => {
		tab.display();
		const settings = __getSettings();
		expect(settings).toHaveLength(3);
	});

	it('clearing then re-rendering empties the container before rebuilding', () => {
		tab.display();
		const afterFirst = tab.containerEl.childElementCount;
		tab.display();
		expect(tab.containerEl.childElementCount).toBe(afterFirst);
	});

	it('greeting text onChange updates settings and persists', async () => {
		tab.display();
		const settings = __getSettings();
		const textComponent = settings[0]?.components[0] as TextComponent;
		await textComponent.__trigger('new greeting');
		expect(plugin.settings.greeting).toBe('new greeting');
		expect(plugin.saveData).toHaveBeenCalled();
	});

	it('status bar toggle onChange persists and refreshes the status bar', async () => {
		tab.display();
		const settings = __getSettings();
		const toggleComponent = settings[1]?.components[0] as ToggleComponent;
		const refreshSpy = vi.spyOn(plugin, 'refreshStatusBar');
		await toggleComponent.__trigger(false);
		expect(plugin.settings.enableStatusBar).toBe(false);
		expect(plugin.saveData).toHaveBeenCalled();
		expect(refreshSpy).toHaveBeenCalled();
	});

	it('tick interval slider onChange persists and restarts the tick', async () => {
		tab.display();
		const settings = __getSettings();
		const sliderComponent = settings[2]?.components[0] as SliderComponent;
		const restartSpy = vi.spyOn(plugin, 'restartTick').mockImplementation(() => {});
		await sliderComponent.__trigger(10);
		expect(plugin.settings.tickIntervalMinutes).toBe(10);
		expect(plugin.saveData).toHaveBeenCalled();
		expect(restartSpy).toHaveBeenCalled();
	});
});
