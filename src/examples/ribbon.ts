import type ViteSamplePlugin from '../main';

export function registerRibbonExample(plugin: ViteSamplePlugin): void {
  plugin.addRibbonIcon('sparkles', 'Open vite sample view', () => {
    void plugin.activateView();
  });
}
