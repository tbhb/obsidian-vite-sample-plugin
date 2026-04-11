import { __resetObsidianMocks, App, type BasesView, type QueryController } from 'obsidian';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  registerBasesViewExamples,
  VITE_SAMPLE_CARDS_BASES_VIEW_TYPE,
  VITE_SAMPLE_LIST_BASES_VIEW_TYPE,
} from '../src/examples/bases-views';
import ViteSamplePlugin from '../src/main';

// Lightweight shapes that mirror the parts of the Bases API we touch. Kept
// local so the tests stay decoupled from Obsidian's real type graph.
interface ValueLike {
  toString(): string;
}

interface FakeEntry {
  file: { path: string; basename: string; name: string };
  getValue: (id: string) => ValueLike | null;
}

interface FakeGroup {
  key: ValueLike | undefined;
  hasKey: () => boolean;
  entries: FakeEntry[];
}

function makePlugin(): ViteSamplePlugin {
  return new ViteSamplePlugin(new App() as never, { id: 'obsidian-vite-sample-plugin' } as never);
}

function val(text: string): ValueLike {
  return { toString: () => text };
}

function fakeConfig(overrides: Record<string, unknown>, order: string[]) {
  return {
    get: (key: string) => overrides[key],
    set: vi.fn(),
    getOrder: () => order,
    getDisplayName: (id: string) => id.replace(/^[^.]+\./, ''),
  };
}

function attach<V extends BasesView>(view: V, plugin: ViteSamplePlugin): V {
  // The real BasesView has `app` populated by Obsidian. Our mock leaves it
  // blank so tests point it at the plugin's App instance.
  (view as unknown as { app: App }).app = plugin.app as unknown as App;
  return view;
}

function getListView(plugin: ViteSamplePlugin, containerEl: HTMLElement) {
  registerBasesViewExamples(plugin);
  const reg = plugin.__basesViews.get(VITE_SAMPLE_LIST_BASES_VIEW_TYPE);
  if (!reg) throw new Error('list view not registered');
  const view = reg.factory({} as QueryController, containerEl) as BasesView;
  return attach(view, plugin);
}

function getCardsView(plugin: ViteSamplePlugin, containerEl: HTMLElement) {
  registerBasesViewExamples(plugin);
  const reg = plugin.__basesViews.get(VITE_SAMPLE_CARDS_BASES_VIEW_TYPE);
  if (!reg) throw new Error('cards view not registered');
  return reg.factory({} as QueryController, containerEl) as BasesView;
}

beforeEach(() => {
  __resetObsidianMocks();
});

describe('registerBasesViewExamples', () => {
  it('is a no-op when registerBasesView is unavailable', () => {
    const plugin = makePlugin();
    (plugin as unknown as { registerBasesView: unknown }).registerBasesView = undefined;
    expect(() => registerBasesViewExamples(plugin)).not.toThrow();
    expect(plugin.__basesViews.size).toBe(0);
  });

  it('registers the list and cards views and exposes their options', () => {
    const plugin = makePlugin();
    registerBasesViewExamples(plugin);

    expect(plugin.__basesViews.size).toBe(2);
    const list = plugin.__basesViews.get(VITE_SAMPLE_LIST_BASES_VIEW_TYPE);
    const cards = plugin.__basesViews.get(VITE_SAMPLE_CARDS_BASES_VIEW_TYPE);
    expect(list?.name).toBe('Vite sample list');
    expect(list?.icon).toBe('list');
    expect(cards?.name).toBe('Vite sample cards');
    expect(cards?.icon).toBe('layout-grid');

    const listOptKeys = list?.options?.()?.map((o) => o.key);
    const cardsOptKeys = cards?.options?.()?.map((o) => o.key);
    expect(listOptKeys).toEqual(['separator', 'showGroupHeadings']);
    expect(cardsOptKeys).toEqual(['cardSize', 'showLabels']);
  });
});

describe('ViteSampleListBasesView.onDataUpdated', () => {
  function run(
    plugin: ViteSamplePlugin,
    config: Record<string, unknown>,
    order: string[],
    groups: FakeGroup[],
  ): HTMLElement {
    const containerEl = document.createElement('div');
    document.body.appendChild(containerEl);
    const view = getListView(plugin, containerEl) as BasesView & { onDataUpdated: () => void };
    view.config = fakeConfig(config, order);
    view.data = { groupedData: groups };
    view.onDataUpdated();
    return containerEl;
  }

  it('renders separator, group heading, and file link with defaults', () => {
    const plugin = makePlugin();
    const entry: FakeEntry = {
      file: { path: 'notes/apple.md', basename: 'apple', name: 'apple' },
      getValue: (id) =>
        id === 'file.name' ? val('apple') : id === 'note.tags' ? val('red') : null,
    };
    const containerEl = run(
      plugin,
      {},
      ['file.name', 'note.tags'],
      [{ key: val('Fruits'), hasKey: () => true, entries: [entry] }],
    );

    expect(containerEl.querySelector('.vite-sample-bases-list__group-heading')?.textContent).toBe(
      'Fruits',
    );
    expect(containerEl.querySelectorAll('.vite-sample-bases-list__item')).toHaveLength(1);
    expect(containerEl.querySelector('.vite-sample-bases-list__link')?.textContent).toBe('apple');
    expect(containerEl.querySelector('.vite-sample-bases-list__separator')?.textContent).toBe(
      ' · ',
    );
    expect(containerEl.querySelector('.vite-sample-bases-list__value')?.textContent).toBe('red');
  });

  it('falls back to the default separator when config returns empty', () => {
    const plugin = makePlugin();
    const entry: FakeEntry = {
      file: { path: 'x.md', basename: 'x', name: 'x' },
      getValue: (id) => (id === 'note.a' ? val('alpha') : id === 'note.b' ? val('beta') : null),
    };
    const containerEl = run(
      plugin,
      { separator: '' },
      ['note.a', 'note.b'],
      [{ key: undefined, hasKey: () => false, entries: [entry] }],
    );

    expect(containerEl.querySelector('.vite-sample-bases-list__separator')?.textContent).toBe(
      ' · ',
    );
  });

  it('hides group headings when showGroupHeadings is false', () => {
    const plugin = makePlugin();
    const entry: FakeEntry = {
      file: { path: 'x.md', basename: 'x', name: 'x' },
      getValue: (id) => (id === 'note.tags' ? val('alpha') : null),
    };
    const containerEl = run(
      plugin,
      { showGroupHeadings: false, separator: ' / ' },
      ['note.tags'],
      [{ key: val('Fruits'), hasKey: () => true, entries: [entry] }],
    );

    expect(containerEl.querySelector('.vite-sample-bases-list__group-heading')).toBeNull();
    expect(containerEl.querySelector('.vite-sample-bases-list__value')?.textContent).toBe('alpha');
  });

  it('omits the heading when the group has no key', () => {
    const plugin = makePlugin();
    const entry: FakeEntry = {
      file: { path: 'x.md', basename: 'x', name: 'x' },
      getValue: (id) => (id === 'note.tags' ? val('alpha') : null),
    };
    const containerEl = run(
      plugin,
      {},
      ['note.tags'],
      [{ key: undefined, hasKey: () => false, entries: [entry] }],
    );

    expect(containerEl.querySelector('.vite-sample-bases-list__group-heading')).toBeNull();
  });

  it('skips properties with null or empty values', () => {
    const plugin = makePlugin();
    const entry: FakeEntry = {
      file: { path: 'x.md', basename: 'x', name: 'x' },
      getValue: (id) => {
        if (id === 'note.blank') return val('');
        if (id === 'note.missing') return null;
        if (id === 'note.tags') return val('alpha');
        return null;
      },
    };
    const containerEl = run(
      plugin,
      {},
      ['note.blank', 'note.missing', 'note.tags'],
      [{ key: undefined, hasKey: () => false, entries: [entry] }],
    );

    const values = containerEl.querySelectorAll('.vite-sample-bases-list__value');
    expect(values).toHaveLength(1);
    expect(values[0]?.textContent).toBe('alpha');
    expect(containerEl.querySelectorAll('.vite-sample-bases-list__separator')).toHaveLength(0);
  });

  it('opens the file on primary click and ignores right-click', async () => {
    const plugin = makePlugin();
    const openSpy = vi.spyOn(plugin.app.workspace, 'openLinkText');
    const triggerSpy = vi.spyOn(plugin.app.workspace, 'trigger');

    const entry: FakeEntry = {
      file: { path: 'notes/apple.md', basename: 'apple', name: 'apple' },
      getValue: (id) => (id === 'file.name' ? val('apple') : null),
    };
    const containerEl = run(
      plugin,
      {},
      ['file.name'],
      [{ key: undefined, hasKey: () => false, entries: [entry] }],
    );
    const link = containerEl.querySelector<HTMLAnchorElement>('.vite-sample-bases-list__link');
    expect(link).not.toBeNull();

    link?.dispatchEvent(new MouseEvent('click', { button: 0, bubbles: true, cancelable: true }));
    expect(openSpy).toHaveBeenCalledWith('notes/apple.md', '', false);

    openSpy.mockClear();
    link?.dispatchEvent(new MouseEvent('click', { button: 1, bubbles: true, cancelable: true }));
    expect(openSpy).toHaveBeenCalledWith('notes/apple.md', '', false);

    openSpy.mockClear();
    link?.dispatchEvent(new MouseEvent('click', { button: 2, bubbles: true, cancelable: true }));
    expect(openSpy).not.toHaveBeenCalled();

    link?.dispatchEvent(new MouseEvent('mouseover'));
    expect(triggerSpy).toHaveBeenCalledWith(
      'hover-link',
      expect.objectContaining({
        linktext: 'notes/apple.md',
        source: 'vite-sample-bases',
        targetEl: link,
      }),
    );
  });
});

describe('ViteSampleCardsBasesView.onDataUpdated', () => {
  function run(
    plugin: ViteSamplePlugin,
    config: Record<string, unknown>,
    order: string[],
    groups: FakeGroup[],
  ): HTMLElement {
    const containerEl = document.createElement('div');
    document.body.appendChild(containerEl);
    const view = getCardsView(plugin, containerEl) as BasesView & { onDataUpdated: () => void };
    view.config = fakeConfig(config, order);
    view.data = { groupedData: groups };
    view.onDataUpdated();
    return containerEl;
  }

  it('renders cards with default size and labels on', () => {
    const plugin = makePlugin();
    const entry: FakeEntry = {
      file: { path: 'a.md', basename: 'Apple', name: 'Apple' },
      getValue: (id) => (id === 'note.author' ? val('Alice') : null),
    };
    const containerEl = run(
      plugin,
      {},
      ['note.author'],
      [{ key: undefined, hasKey: () => false, entries: [entry] }],
    );

    const root = containerEl.querySelector<HTMLElement>('.vite-sample-bases-cards');
    expect(root?.dataset.cardSize).toBe('medium');
    expect(containerEl.querySelector('.vite-sample-bases-card__title')?.textContent).toBe('Apple');
    expect(containerEl.querySelector('.vite-sample-bases-card__label')?.textContent).toBe('author');
    expect(containerEl.querySelector('.vite-sample-bases-card__value')?.textContent).toBe('Alice');
  });

  it('honors explicit card size, hides labels, and skips empty values', () => {
    const plugin = makePlugin();
    const entry: FakeEntry = {
      file: { path: 'a.md', basename: 'Apple', name: 'Apple' },
      getValue: (id) => {
        if (id === 'note.author') return val('Alice');
        if (id === 'note.missing') return null;
        if (id === 'note.blank') return val('');
        return null;
      },
    };
    const containerEl = run(
      plugin,
      { cardSize: 'large', showLabels: false },
      ['note.author', 'note.missing', 'note.blank'],
      [{ key: undefined, hasKey: () => false, entries: [entry] }],
    );

    const root = containerEl.querySelector<HTMLElement>('.vite-sample-bases-cards');
    expect(root?.dataset.cardSize).toBe('large');
    expect(containerEl.querySelectorAll('.vite-sample-bases-card__label')).toHaveLength(0);
    const values = containerEl.querySelectorAll('.vite-sample-bases-card__value');
    expect(values).toHaveLength(1);
    expect(values[0]?.textContent).toBe('Alice');
  });
});
