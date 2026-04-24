import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { __resetObsidianMocks, App, createFilesystemVault } from 'obsidian';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ViteSamplePlugin from '../../src/main';
import { DEFAULT_SETTINGS } from '../../src/settings';
import { copyFixtureToTmp, type VaultFixture } from './fixture';

const PLUGIN_ID = 'vite-sample-plugin';
const DATA_JSON = `.obsidian/plugins/${PLUGIN_ID}/data.json`;

function buildPlugin(vaultPath: string): ViteSamplePlugin {
  const app = new App();
  app.vault = createFilesystemVault(vaultPath);
  return new ViteSamplePlugin(app as never, { id: PLUGIN_ID } as never);
}

describe('settings against a vault fixture', () => {
  let fixture: VaultFixture;
  let plugin: ViteSamplePlugin;

  beforeEach(async () => {
    __resetObsidianMocks();
    fixture = copyFixtureToTmp();
    plugin = buildPlugin(fixture.path);
    await plugin.onload();
  });

  afterEach(() => {
    plugin.onunload();
    fixture.cleanup();
  });

  it('reads fixture data.json into plugin.settings on load', () => {
    expect(plugin.settings.greeting).toBe('Hello from the fixture vault');
    expect(plugin.settings.theme).toBe('dark');
    expect(plugin.settings.tickIntervalMinutes).toBe(10);
    // Fields absent from the fixture still merge with defaults.
    expect(plugin.settings.dateFormat).toBe(DEFAULT_SETTINGS.dateFormat);
  });

  it('persists saveSettings to disk and a fresh plugin reads the changes', async () => {
    plugin.settings.greeting = 'Updated greeting';
    plugin.settings.tickIntervalMinutes = 15;
    await plugin.saveSettings();

    const onDisk = JSON.parse(readFileSync(join(fixture.path, DATA_JSON), 'utf8')) as {
      greeting: string;
      tickIntervalMinutes: number;
    };
    expect(onDisk.greeting).toBe('Updated greeting');
    expect(onDisk.tickIntervalMinutes).toBe(15);

    const reloaded = buildPlugin(fixture.path);
    await reloaded.onload();
    try {
      expect(reloaded.settings.greeting).toBe('Updated greeting');
      expect(reloaded.settings.tickIntervalMinutes).toBe(15);
    } finally {
      reloaded.onunload();
    }
  });

  it('picks up external edits via onExternalSettingsChange', async () => {
    const next = { ...plugin.settings, greeting: 'Edited by another window', theme: 'light' };
    writeFileSync(join(fixture.path, DATA_JSON), JSON.stringify(next, null, 2), 'utf8');

    await plugin.onExternalSettingsChange();

    expect(plugin.settings.greeting).toBe('Edited by another window');
    expect(plugin.settings.theme).toBe('light');
  });
});
