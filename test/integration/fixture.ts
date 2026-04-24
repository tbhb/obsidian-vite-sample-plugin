/*
 * Vault fixture helper for integration tests.
 *
 * Each call copies the checked-in `test/fixtures/vault` tree into a fresh
 * tmpdir, so tests that mutate vault state never contaminate each other.
 * Call `cleanup()` in `afterEach` to remove the tmpdir.
 */

import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// Vitest runs from the project root. Resolve the fixture against cwd so
// the helper doesn't depend on `import.meta.url`, which Vitest 4's module
// evaluator doesn't surface as a `file://` URL.
const FIXTURE_ROOT = resolve(process.cwd(), 'test/fixtures/vault');

export interface VaultFixture {
  readonly path: string;
  cleanup(): void;
}

export function copyFixtureToTmp(): VaultFixture {
  const dir = mkdtempSync(join(tmpdir(), 'obsidian-vite-sample-vault-'));
  cpSync(FIXTURE_ROOT, dir, { recursive: true });
  return {
    path: dir,
    cleanup: () => {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
