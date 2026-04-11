import { Notice } from 'obsidian';
import type ViteSamplePlugin from '../main';

export function registerProtocolHandlerExample(plugin: ViteSamplePlugin): void {
  plugin.registerObsidianProtocolHandler('vite-sample', (params) => {
    new Notice(`Protocol handler received: ${JSON.stringify(params)}`);
  });
}
