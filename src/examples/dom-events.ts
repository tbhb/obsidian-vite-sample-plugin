import type ViteSamplePlugin from '../main';

export function registerDomEventExamples(plugin: ViteSamplePlugin): void {
  plugin.registerDomEvent(document, 'visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      plugin.refreshOpenViews();
    }
  });
}
