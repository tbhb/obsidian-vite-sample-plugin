import { type App, PluginSettingTab, Setting } from 'obsidian';
import type ViteSamplePlugin from './main';

export interface ViteSamplePluginSettings {
	greeting: string;
	enableStatusBar: boolean;
	tickIntervalMinutes: number;
}

export const DEFAULT_SETTINGS: ViteSamplePluginSettings = {
	greeting: 'Hello from obsidian-vite-sample-plugin',
	enableStatusBar: true,
	tickIntervalMinutes: 5,
};

export function mergeSettings(
	stored: Partial<ViteSamplePluginSettings> | null | undefined,
): ViteSamplePluginSettings {
	return Object.assign({}, DEFAULT_SETTINGS, stored ?? {});
}

export class ViteSampleSettingTab extends PluginSettingTab {
	private readonly plugin: ViteSamplePlugin;

	constructor(app: App, plugin: ViteSamplePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Greeting')
			.setDesc('Shown in notices and in the custom view.')
			.addText((text) =>
				text
					.setPlaceholder('Enter a greeting')
					.setValue(this.plugin.settings.greeting)
					.onChange(async (value) => {
						this.plugin.settings.greeting = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Show status bar item')
			.setDesc('Desktop only. Displays the current greeting in the status bar.')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.enableStatusBar).onChange(async (value) => {
					this.plugin.settings.enableStatusBar = value;
					await this.plugin.saveSettings();
					this.plugin.refreshStatusBar();
				}),
			);

		new Setting(containerEl)
			.setName('Tick interval')
			.setDesc('How often (in minutes) the background tick fires.')
			.addSlider((slider) =>
				slider
					.setLimits(1, 30, 1)
					.setValue(this.plugin.settings.tickIntervalMinutes)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.tickIntervalMinutes = value;
						await this.plugin.saveSettings();
						this.plugin.restartTick();
					}),
			);
	}
}
