import { __getNotices, __resetObsidianMocks, App } from 'obsidian';
import { beforeEach, describe, expect, it } from 'vitest';
import { registerProtocolHandlerExample } from '../../src/examples/protocol';
import ViteSamplePlugin from '../../src/main';

function makePlugin(): ViteSamplePlugin {
  return new ViteSamplePlugin(new App() as never, { id: 'vite-sample-plugin' } as never);
}

describe('registerProtocolHandlerExample', () => {
  beforeEach(() => {
    __resetObsidianMocks();
  });

  it('registers a handler under the vite-sample scheme', () => {
    const plugin = makePlugin();
    registerProtocolHandlerExample(plugin);
    expect(plugin.__protocolHandlers.has('vite-sample')).toBe(true);
  });

  it('handler shows a Notice that includes the serialized params', () => {
    const plugin = makePlugin();
    registerProtocolHandlerExample(plugin);
    const handler = plugin.__protocolHandlers.get('vite-sample');
    handler?.({ action: 'open', id: '42' });
    const notices = __getNotices();
    expect(notices).toHaveLength(1);
    expect(notices[0]?.message).toBe('Protocol handler received: {"action":"open","id":"42"}');
  });
});
