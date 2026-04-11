import { getByText, queryByText, within } from '@testing-library/dom';
import { App } from 'obsidian';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ViteSampleModal } from '../src/modal';

describe('ViteSampleModal', () => {
  let modal: ViteSampleModal;

  beforeEach(() => {
    modal = new ViteSampleModal(new App(), 'hello world');
    // Attach so Testing Library's in-document matchers can find the nodes.
    document.body.append(modal.titleEl, modal.contentEl);
  });

  afterEach(() => {
    modal.titleEl.remove();
    modal.contentEl.remove();
  });

  it('renders the provided message and dismissal hint on open', () => {
    modal.onOpen();

    expect(modal.titleEl).toHaveTextContent('Sample message');
    const body = within(modal.contentEl);
    expect(body.getByText('hello world')).toBeInTheDocument();
    expect(getByText(modal.contentEl, /press escape/i)).toBeInTheDocument();
  });

  it('clears content on close', () => {
    modal.onOpen();
    modal.onClose();
    expect(queryByText(modal.contentEl, 'hello world')).toBeNull();
    expect(modal.contentEl).toBeEmptyDOMElement();
  });
});
