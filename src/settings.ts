import { type App, PluginSettingTab, Setting } from 'obsidian';
import type ViteSamplePlugin from './main';

export type ThemePreference = 'auto' | 'light' | 'dark';

export interface ViteSamplePluginSettings {
  greeting: string;
  greetingNotes: string;
  filter: string;
  theme: ThemePreference;
  accentColor: string;
  dateFormat: string;
  enableStatusBar: boolean;
  tickIntervalMinutes: number;
}

export const DEFAULT_SETTINGS: ViteSamplePluginSettings = {
  greeting: 'Hello from obsidian-vite-sample-plugin',
  greetingNotes: '',
  filter: '',
  theme: 'auto',
  accentColor: '#7c3aed',
  dateFormat: 'YYYY-MM-DD',
  enableStatusBar: true,
  tickIntervalMinutes: 5,
};

const TICK_MIN_MINUTES = 1;
const TICK_MAX_MINUTES = 30;

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

  override display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // Mutation testing disabled for UI copy in this block. See AGENTS.md,
    // "Mutation testing" section, for the policy.
    // Stryker disable StringLiteral,ObjectLiteral
    // Raw HTML elements live alongside Setting rows. Use createEl so the
    // plugin stays compliant with Obsidian's no-innerHTML rule.
    const intro = containerEl.createEl('p', {
      cls: 'tw:text-text-muted',
      text: 'Every setting component type documented in the Obsidian API is wired up below. ',
    });
    intro.createEl('a', {
      text: 'Read the settings docs',
      // Link to the external docs site, not a vault config path. The
      // hardcoded-config-path lint rule matches on the substring.
      // eslint-disable-next-line obsidianmd/hardcoded-config-path
      attr: { href: 'https://docs.obsidian.md/Plugins/User+interface/Settings' },
    });

    new Setting(containerEl).setName('Text inputs').setHeading();

    new Setting(containerEl)
      .setName('Greeting')
      .setDesc('Text input. Shown in notices and in the custom view.')
      .addText((text) =>
        text
          .setPlaceholder('Enter a greeting')
          .setValue(this.plugin.settings.greeting)
          .onChange(async (value) => {
            this.plugin.settings.greeting = value;
            await this.plugin.saveSettings();
          }),
      )
      .addExtraButton((extra) =>
        extra
          .setIcon('rotate-ccw')
          .setTooltip('Reset greeting to default')
          .onClick(async () => {
            this.plugin.settings.greeting = DEFAULT_SETTINGS.greeting;
            await this.plugin.saveSettings();
            this.display();
          }),
      );

    new Setting(containerEl)
      .setName('Greeting notes')
      .setDesc('Text area. Longer notes that sit alongside the greeting.')
      .addTextArea((area) =>
        area
          .setPlaceholder('Optional notes')
          .setValue(this.plugin.settings.greetingNotes)
          .onChange(async (value) => {
            this.plugin.settings.greetingNotes = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Filter')
      .setDesc('Search input. Styled as a text field with a search icon.')
      .addSearch((search) =>
        search
          .setPlaceholder('Filter greetings')
          .setValue(this.plugin.settings.filter)
          .onChange(async (value) => {
            this.plugin.settings.filter = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl).setName('Appearance').setHeading();

    new Setting(containerEl)
      .setName('Theme preference')
      .setDesc('Dropdown with static options.')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('auto', 'Match Obsidian')
          .addOption('light', 'Light')
          .addOption('dark', 'Dark')
          .setValue(this.plugin.settings.theme)
          .onChange(async (value) => {
            this.plugin.settings.theme = value as ThemePreference;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Accent color')
      .setDesc('Color picker. Stores a hex value.')
      .addColorPicker((picker) =>
        picker.setValue(this.plugin.settings.accentColor).onChange(async (value) => {
          this.plugin.settings.accentColor = value;
          await this.plugin.saveSettings();
        }),
      );

    const dateFormatSetting = new Setting(containerEl)
      .setName('Date format')
      .setDesc('Moment format string. The sample below updates as you type.');
    const dateSample = dateFormatSetting.settingEl.createEl('small', {
      cls: 'tw:ml-2 tw:text-text-faint',
    });
    dateFormatSetting.addMomentFormat((moment) =>
      moment
        // Format strings are literal Moment tokens, not UI copy.
        // eslint-disable-next-line obsidianmd/ui/sentence-case
        .setPlaceholder('YYYY-MM-DD')
        .setDefaultFormat('YYYY-MM-DD')
        .setSampleEl(dateSample)
        .setValue(this.plugin.settings.dateFormat)
        .onChange(async (value) => {
          this.plugin.settings.dateFormat = value;
          await this.plugin.saveSettings();
        }),
    );

    new Setting(containerEl).setName('Status bar').setHeading();

    new Setting(containerEl)
      .setName('Show status bar item')
      .setDesc('Toggle. Desktop only. Displays the current greeting in the status bar.')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enableStatusBar).onChange(async (value) => {
          this.plugin.settings.enableStatusBar = value;
          await this.plugin.saveSettings();
          this.plugin.refreshStatusBar();
        }),
      );

    new Setting(containerEl).setName('Background tick').setHeading();

    new Setting(containerEl)
      .setName('Tick interval')
      .setDesc('Slider. How often (in minutes) the background tick fires.')
      .addSlider((slider) =>
        slider
          .setLimits(TICK_MIN_MINUTES, TICK_MAX_MINUTES, 1)
          .setValue(this.plugin.settings.tickIntervalMinutes)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.tickIntervalMinutes = value;
            await this.plugin.saveSettings();
            this.plugin.restartTick();
          }),
      );

    new Setting(containerEl)
      .setName('Tick load')
      .setDesc('Progress bar. Renders the tick interval as a percentage of the allowed range.')
      .addProgressBar((bar) => {
        const span = TICK_MAX_MINUTES - TICK_MIN_MINUTES;
        const pct = ((this.plugin.settings.tickIntervalMinutes - TICK_MIN_MINUTES) / span) * 100;
        bar.setValue(pct);
      });

    new Setting(containerEl).setName('Danger zone').setHeading();

    new Setting(containerEl)
      .setName('Reset to defaults')
      .setDesc('Button. Clears every field on this tab.')
      .addButton((button) =>
        button
          .setButtonText('Reset')
          .setWarning()
          .onClick(async () => {
            this.plugin.settings = { ...DEFAULT_SETTINGS };
            await this.plugin.saveSettings();
            this.display();
          }),
      );
    // Stryker restore StringLiteral,ObjectLiteral
  }
}
