import { __resetObsidianMocks, App, createFilesystemVault, WorkspaceLeaf } from 'obsidian';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ViteSamplePlugin from '../../src/main';
import { ViteSampleView } from '../../src/view';
import { copyFixtureToTmp, type VaultFixture } from './fixture';

describe('view rendered against fixture-loaded plugin', () => {
  let fixture: VaultFixture;
  let plugin: ViteSamplePlugin;
  let view: ViteSampleView;

  beforeEach(async () => {
    __resetObsidianMocks();
    fixture = copyFixtureToTmp();
    const app = new App();
    app.vault = createFilesystemVault(fixture.path);
    plugin = new ViteSamplePlugin(app as never, { id: 'obsidian-vite-sample-plugin' } as never);
    await plugin.onload();

    view = new ViteSampleView(new WorkspaceLeaf(), plugin);
    document.body.appendChild(view.contentEl);
    await view.onOpen();
  });

  afterEach(() => {
    view.contentEl.remove();
    plugin.onunload();
    fixture.cleanup();
  });

  it('renders the fixture-configured greeting as the view title', () => {
    const heading = view.contentEl.querySelector<HTMLElement>('h2.vite-sample-view__title');
    expect(heading?.textContent).toBe('Hello from the fixture vault');
  });

  it('re-renders with the updated greeting after plugin.settings changes', async () => {
    plugin.settings.greeting = 'Updated greeting';
    await plugin.saveSettings();
    view.render();

    const heading = view.contentEl.querySelector<HTMLElement>('h2.vite-sample-view__title');
    expect(heading?.textContent).toBe('Updated greeting');
  });
});
