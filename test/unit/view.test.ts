import { getByRole, getByText, queryByRole, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { WorkspaceLeaf } from 'obsidian';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type ViteSamplePlugin from '../../src/main';
import { DEFAULT_SETTINGS, type ViteSamplePluginSettings } from '../../src/settings';
import {
  buildViteSampleViewModel,
  counterLabel,
  VITE_SAMPLE_VIEW_TYPE,
  ViteSampleView,
} from '../../src/view';

function makeView(settings: ViteSamplePluginSettings): ViteSampleView {
  // The view only touches `plugin.settings`, so a structural stub is enough.
  const plugin = { settings } as unknown as ViteSamplePlugin;
  const view = new ViteSampleView(new WorkspaceLeaf(), plugin);
  // Testing Library matchers like `toBeInTheDocument` require attachment.
  // Obsidian attaches views at runtime too, so this mirrors reality.
  document.body.appendChild(view.contentEl);
  return view;
}

describe('buildViteSampleViewModel', () => {
  it('returns the canonical view model for a given greeting', () => {
    const settings = { ...DEFAULT_SETTINGS, greeting: 'Hi there' };
    // jscpd:ignore-start
    expect(buildViteSampleViewModel(settings)).toEqual({
      rootCls: 'vite-sample-view',
      title: { text: 'Hi there', cls: 'vite-sample-view__title' },
      list: {
        cls: 'vite-sample-view__list',
        items: [
          { text: 'This view is opened on first user enable.' },
          { text: 'Edit the greeting in the plugin settings to see it update.' },
        ],
      },
      counter: { cls: 'tw:mt-4 tw:font-semibold tw:text-text-muted' },
      button: { text: 'Increment', cls: ['mod-cta', 'tw:mt-2', 'tw:self-start'] },
    });
    // jscpd:ignore-end
  });
});

describe('counterLabel', () => {
  it('formats the click count with the Clicks: prefix', () => {
    expect(counterLabel(0)).toBe('Clicks: 0');
    expect(counterLabel(7)).toBe('Clicks: 7');
  });
});

describe('ViteSampleView', () => {
  let view: ViteSampleView;

  beforeEach(() => {
    view = makeView({ ...DEFAULT_SETTINGS });
  });

  afterEach(() => {
    view.contentEl.remove();
  });

  it('exposes the expected view type, display name, and icon', () => {
    expect(VITE_SAMPLE_VIEW_TYPE).toBe('vite-sample-view');
    expect(view.getViewType()).toBe('vite-sample-view');
    expect(view.getDisplayText()).toBe('Vite sample');
    expect(view.getIcon()).toBe('sparkles');
  });

  it('renders the greeting as a heading', () => {
    view.render();
    const heading = getByRole(view.contentEl, 'heading', {
      name: DEFAULT_SETTINGS.greeting,
    });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass('vite-sample-view__title');
  });

  it('renders the user-enable hint copy', () => {
    view.render();
    expect(getByText(view.contentEl, /opened on first user enable/i)).toBeInTheDocument();
  });

  it('applies the model classes to the list, counter, and button elements', () => {
    view.render();
    expect(view.contentEl).toHaveClass('vite-sample-view');

    const list = view.contentEl.querySelector('.vite-sample-view__list');
    expect(list).not.toBeNull();
    expect(list?.querySelectorAll('p')).toHaveLength(2);

    const counter = getByText(view.contentEl, 'Clicks: 0');
    expect(counter).toHaveClass('tw:mt-4', 'tw:font-semibold', 'tw:text-text-muted');

    const button = getByRole(view.contentEl, 'button', { name: /increment/i });
    expect(button).toHaveClass('mod-cta', 'tw:mt-2', 'tw:self-start');
  });

  it('re-renders when the greeting changes', () => {
    view.render();
    expect(view.contentEl).toHaveTextContent(DEFAULT_SETTINGS.greeting);

    const updated = makeView({ ...DEFAULT_SETTINGS, greeting: 'updated greeting' });
    try {
      updated.render();
      const scope = within(updated.contentEl);
      expect(scope.getByRole('heading', { name: 'updated greeting' })).toBeInTheDocument();
      expect(updated.contentEl).not.toHaveTextContent(DEFAULT_SETTINGS.greeting);
    } finally {
      updated.contentEl.remove();
    }
  });

  it('clears content on close', async () => {
    view.render();
    expect(getByRole(view.contentEl, 'heading')).toBeInTheDocument();
    await view.onClose();
    expect(queryByRole(view.contentEl, 'heading')).toBeNull();
  });

  it('onOpen delegates to render', async () => {
    await view.onOpen();
    expect(
      getByRole(view.contentEl, 'heading', { name: DEFAULT_SETTINGS.greeting }),
    ).toBeInTheDocument();
  });

  describe('increment button', () => {
    it('starts at zero and increments on each click', async () => {
      const user = userEvent.setup();
      view.render();
      const scope = within(view.contentEl);

      const button = scope.getByRole('button', { name: /increment/i });
      expect(scope.getByText('Clicks: 0')).toBeInTheDocument();

      await user.click(button);
      expect(scope.getByText('Clicks: 1')).toBeInTheDocument();

      await user.click(button);
      await user.click(button);
      expect(scope.getByText('Clicks: 3')).toBeInTheDocument();
    });

    it('preserves the counter value across re-renders', async () => {
      const user = userEvent.setup();
      view.render();

      await user.click(within(view.contentEl).getByRole('button', { name: /increment/i }));
      await user.click(within(view.contentEl).getByRole('button', { name: /increment/i }));

      view.render();

      expect(within(view.contentEl).getByText('Clicks: 2')).toBeInTheDocument();
    });
  });
});
