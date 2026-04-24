import { fc, test } from '@fast-check/vitest';
import { describe, expect } from 'vitest';
import { DEFAULT_SETTINGS, mergeSettings, type ViteSamplePluginSettings } from '../../src/settings';

// Arbitrary for a stored-settings blob. Every key is optional
// (`requiredKeys: []`), matching what Obsidian hands back from
// `loadData()` when a prior version wrote a subset of fields.
const storedSettings = fc.record(
  {
    greeting: fc.string(),
    greetingNotes: fc.string(),
    filter: fc.string(),
    theme: fc.constantFrom('auto', 'light', 'dark'),
    accentColor: fc.string(),
    dateFormat: fc.string(),
    enableStatusBar: fc.boolean(),
    tickIntervalMinutes: fc.integer(),
  },
  { requiredKeys: [] },
);

const defaultKeys = Object.keys(DEFAULT_SETTINGS) as (keyof ViteSamplePluginSettings)[];

describe('mergeSettings (property)', () => {
  test.prop([storedSettings])('fills every default key', (stored) => {
    const merged = mergeSettings(stored);
    for (const key of defaultKeys) {
      expect(merged).toHaveProperty(key);
    }
  });

  test.prop([storedSettings])('keeps every explicitly stored value', (stored) => {
    const merged = mergeSettings(stored);
    for (const key of Object.keys(stored) as (keyof ViteSamplePluginSettings)[]) {
      expect(merged[key]).toStrictEqual(stored[key]);
    }
  });

  test.prop([storedSettings])('falls back to defaults for absent keys', (stored) => {
    const merged = mergeSettings(stored);
    for (const key of defaultKeys) {
      if (!(key in stored)) {
        expect(merged[key]).toStrictEqual(DEFAULT_SETTINGS[key]);
      }
    }
  });

  test.prop([storedSettings])('is idempotent', (stored) => {
    const once = mergeSettings(stored);
    const twice = mergeSettings(once);
    expect(twice).toStrictEqual(once);
  });

  test.prop([storedSettings])('does not mutate the input', (stored) => {
    const snapshot = structuredClone(stored);
    mergeSettings(stored);
    // toEqual, not toStrictEqual: fc.record generates null-prototype
    // objects whose structuredClone copy has Object.prototype. Prototype
    // identity isn't what this property checks. Own enumerable values are.
    expect(stored).toEqual(snapshot);
  });

  test.prop([storedSettings])('does not mutate DEFAULT_SETTINGS', (stored) => {
    const snapshot = structuredClone(DEFAULT_SETTINGS);
    mergeSettings(stored);
    expect(DEFAULT_SETTINGS).toEqual(snapshot);
  });

  test.prop([fc.constantFrom(null, undefined, {})])(
    'returns defaults for null, undefined, or empty input',
    (stored) => {
      expect(mergeSettings(stored)).toStrictEqual(DEFAULT_SETTINGS);
    },
  );
});
