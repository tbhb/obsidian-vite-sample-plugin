# AGENTS.md

Guidance for AI coding agents working in this repository. The scaffold targets the current [Obsidian][obsidian] plugin API and builds with [Vite 8][vite] ([Rolldown][rolldown]), [Tailwind CSS 4][tailwind], [Vitest 4][vitest], [Testing Library][testing-library], [Biome 2][biome], [dependency-cruiser][depcruise], [jscpd][jscpd], [Knip 6][knip], [TypeScript][typescript], and [pnpm][pnpm].

[obsidian]: https://obsidian.md/
[vite]: https://vite.dev/
[rolldown]: https://rolldown.rs/
[tailwind]: https://tailwindcss.com/
[vitest]: https://vitest.dev/
[testing-library]: https://testing-library.com/
[biome]: https://biomejs.dev/
[depcruise]: https://github.com/sverweij/dependency-cruiser
[jscpd]: https://github.com/kucherenko/jscpd
[knip]: https://knip.dev/
[typescript]: https://www.typescriptlang.org/
[pnpm]: https://pnpm.io/

## Quickstart

Run these commands on a fresh clone:

```bash
pnpm install          # install dependencies + init husky hooks
pnpm typecheck        # tsc --noEmit on src + test configs
pnpm test             # vitest, 100% coverage gate
pnpm build            # typecheck + vite build
```

The pre-push hook runs the full gate automatically, so a clean push mirrors CI:

```bash
pnpm lint:all && pnpm typecheck && pnpm build && pnpm test:coverage
```

The pre-commit hook runs `nano-staged`. Never bypass either hook with `--no-verify`.

## Repository layout

```text
src/
├── main.ts                 # plugin entry, imports styles.css
├── settings.ts             # settings tab + mergeSettings helper
├── view.ts                 # custom ItemView
├── modal.ts                # modal
└── styles.css              # Tailwind entry + @layer components
test/
├── __mocks__/obsidian.ts   # runtime stub; the obsidian package ships types only
├── setup.ts                # jsdom polyfills + jest-dom matchers
└── *.test.ts               # one test file per source module
.github/
├── workflows/ci.yml        # Lint, Build, Test, Documentation jobs
├── workflows/release.yml   # release-please + build + attest + upload
├── release-please-config.json
├── release-please-manifest.json
└── dependabot.yml
manifest.json               # Obsidian plugin manifest
versions.json               # plugin version -> minAppVersion map
```

Config lives at the repo root: `biome.json`, `eslint.config.mts`, `.dependency-cruiser.cjs`, `.jscpd.json`, `knip.json`, `cspell.json` + `cspell-words.txt`, `.rumdl.toml`, `.vale.ini` + `.vale/`, `.yamllint.yaml` + `.yamllintignore`, `commitlint.config.js`, `vite.config.ts`, `vitest.config.ts`, and `tsconfig.json`.

## Commands reference

```bash
pnpm dev              # vite build --watch
pnpm build            # tsc --noEmit + vite build
pnpm test             # vitest run
pnpm test:watch       # vitest in watch mode
pnpm test:coverage    # vitest run --coverage, enforces 100% thresholds
pnpm typecheck        # tsc --noEmit across src + test
pnpm format           # biome format --write
pnpm format:markdown  # rumdl fmt .
pnpm lint             # biome lint + eslint
pnpm lint:deps        # dependency-cruiser on src + test
pnpm lint:jscpd       # jscpd copy-paste detector on src + test
pnpm lint:knip        # knip, unused files, exports, deps
pnpm lint:markdown    # rumdl check
pnpm lint:prose       # vale
pnpm lint:spelling    # cspell
pnpm lint:yaml        # yamllint --strict
pnpm lint:actions     # actionlint
pnpm lint:all         # every lint above, one command
pnpm depcruise:graph  # mermaid module graph -> dependency-graph.mmd
pnpm vale:sync        # download vale style packages
```

## Code style

- Two-space indentation for everything, enforced by Biome. Single quotes, semicolons, trailing commas, 100-char line width. See `biome.json`.
- `eslint-plugin-obsidianmd` handles Obsidian submission rules: sentence-case UI strings, no `innerHTML`, no `TFile` casts, no `mod-cta` misuse. The plugin runs on both `src/**/*.ts` and `test/**/*.ts`. The `hardcoded-config-path` rule stays off for tests because it substring-matches `.obsidian` and fires on docs URLs.
- `typescript-eslint` contributes type-aware rules that Biome doesn't cover: the `no-unsafe-*` cluster, `strict-boolean-expressions`, `ban-ts-comment`, `no-unnecessary-type-assertion`, `no-confusing-void-expression`, `restrict-plus-operands`, `restrict-template-expressions`, and `require-await`. Biome owns `no-floating-promises`, `no-misused-promises`, `use-await-thenable`, `no-explicit-any`, `no-non-null-assertion`, and `no-ts-ignore`, so ESLint doesn't duplicate them.
- `eslint-plugin-sonarjs` contributes `sonarjs/cognitive-complexity` at the default threshold of 15. Prefer extracting helper functions over raising the threshold.
- [dependency-cruiser][depcruise] guards the module graph via `.dependency-cruiser.cjs`. It forbids runtime circular dependencies, orphan modules, unresolvable imports, dev-dependency imports from `src/`, duplicate dependency-type declarations, and `src/` depending on `test/`. Cycles composed only of `import type` edges pass, since those edges vanish after tsc emits. The rule exempts `obsidian` from the dev-dep check because the Obsidian host supplies it at runtime. The `not-to-test` rule exempts `test/__mocks__/obsidian.ts` because the tsconfig aliases `obsidian` to it for type-checking. No runtime edge materializes.
- [Knip][knip] catches unused files, exports, and dependencies via `knip.json`. The Vite and Vitest plugins auto-discover entries from `vite.config.ts` and `vitest.config.ts`, so the config only declares the project glob plus a couple of escape hatches. `tailwindcss` sits in `ignoreDependencies` because `src/styles.css` imports it via `@import`, which knip doesn't scan. External binaries called from npm scripts sit in `ignoreBinaries` so knip skips them; the list covers `actionlint`, `rumdl`, `vale`, and `yamllint`.
- [jscpd][jscpd] detects copy-paste duplication across `src/` and `test/` via `.jscpd.json`. The config sets `threshold: 0` so any clone fails the lint, honors `.gitignore`, and uses the default `mode: mild` with `minTokens: 50` and `minLines: 5`. Prefer extracting a shared helper or fixture over silencing a clone. The on-demand `html` reporter writes to `./report/`, which `.gitignore` excludes.
- Strict TypeScript with ES2022 target. Flags beyond `strict`: `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`, `noImplicitOverride`, `exactOptionalPropertyTypes`, `allowUnreachableCode: false`, `allowUnusedLabels: false`, and `verbatimModuleSyntax`. Consequences for code. Index-signature keys need bracket access, as in `dataset['cardSize']`. Every override needs the `override` modifier. Type-only imports need `import type`. One tsconfig covers both `src/` and `test/`. It aliases `obsidian` to `test/__mocks__/obsidian.ts` so tests can reach mock-only helpers such as `__trigger`, and so `src/` and tests type-check against one surface. The mock mirrors the real Obsidian API for types used by `src/`.
- Avoid default exports except the plugin entry at `src/main.ts`.
- Use CSS classes, never inline styles. Tailwind utilities require the `tw:` prefix per v4 variant syntax. Hand-written classes live under `@layer components` in `src/styles.css`.

## Testing

- [Vitest 4][vitest] with `jsdom`.
- Coverage thresholds sit at 100% for statements, branches, functions, and lines. Don't lower the thresholds or add `/* v8 ignore */` comments without a clear rationale.
- The `obsidian` npm package ships types only. Tests resolve `obsidian` to `test/__mocks__/obsidian.ts` via the alias in `vitest.config.ts`.
- Tests attach `view.contentEl` and `modal.contentEl` to `document.body` in `beforeEach` so jest-dom's in-document matchers work. That mirrors Obsidian's runtime behavior.
- Settings-tab tests bypass Testing Library because the mocked `Setting` API doesn't render real form controls. They drive captured `onChange` callbacks directly via the mock's `__trigger()` helpers.

## Documentation linting

Every markdown, YAML, and workflow file ships through a gate before landing:

- `rumdl` for markdown structure
- `vale` for prose style. Enforces sentence case, active voice, contractions, short parentheticals, and concrete word choice
- `cspell` for spelling, backed by `cspell-words.txt`
- `yamllint` for YAML
- `actionlint` for GitHub Actions workflows

Add new technical terms to `cspell-words.txt`. Avoid em-dashes entirely, use commas or periods. Vale flags long parentheticals over 25 characters, so break them into separate sentences. Write each paragraph on a single line without hard wrapping. Use reference-style links with definitions at the bottom of their containing paragraph or section.

## Git workflow

- [Conventional commits][conventional-commits] via commitlint. Header under 100 characters. Body and footer under 120 characters per line.
- husky hooks, installed automatically by `pnpm install`:
  - `pre-commit` runs `nano-staged` across the staged files
  - `commit-msg` runs commitlint
  - `pre-push` runs the full gate: `lint:all`, `typecheck`, `build`, `test:coverage`, mirroring CI
- Never use `--no-verify`. Fix the underlying failure.
- Work on a feature branch, open a PR, and merge via squash.

[conventional-commits]: https://www.conventionalcommits.org/

## Release process

- [release-please][release-please] and [BRAT][brat] handle releases on a single-branch prerelease flow. Configs live under `.github/`.
- Push conventional commits to `main`. release-please opens a release PR that bumps `package.json` and `manifest.json`, appends to `versions.json`, and updates `CHANGELOG.md`. Merging creates a bare-semver tag like `1.2.0`, with no `v` prefix per Obsidian's convention, and a GitHub release. A follow-up job builds, attests via [SLSA provenance][slsa], then uploads the assets.
- Cut a beta by adding a `Release-As: 1.2.0-beta.1` footer to a qualifying commit. The package config sets `"prerelease": true`, so release-please flags the GitHub release as prerelease whenever the version carries a prerelease qualifier. Stable versions stay unflagged. BRAT testers get the beta automatically. Community-catalog users stay on the latest stable.
- Only `feat:`, `fix:`, and commits with breaking changes trigger a release PR. `chore:`, `docs:`, `refactor:`, `style:`, `test:`, `ci:`, and `build:` commits land without opening one unless they carry a `Release-As:` footer.
- release-please runs under a GitHub App token minted from the `tbhb-releases` App. The workflow reads `RELEASE_BOT_APP_ID` as a repo variable and `RELEASE_BOT_PRIVATE_KEY` as a repo secret. An App-issued token lets the release PR push trigger CI, and it bypasses the first-time-contributor approval gate.
- Don't hand-edit `manifest.json` `version`, `package.json` `version`, `versions.json`, or `CHANGELOG.md`. Don't create tags manually. release-please owns those files.

[release-please]: https://github.com/googleapis/release-please-action
[brat]: https://tfthacker.com/brat-developers
[slsa]: https://slsa.dev/

## Obsidian gotchas

- `minAppVersion` stays at 1.7.2 so the plugin can call `onUserEnable` and `onExternalSettingsChange`.
- Open custom views from `onUserEnable`, never from `onload`.
- Register listeners and intervals via `this.registerDomEvent()` and `this.registerInterval()` so they unload with the plugin.
- Gate desktop-only features behind `Platform.isMobile` checks.
- Use `createEl`, `createDiv`, and `createSpan` helpers. Never set `innerHTML`.
- The plugin id `obsidian-vite-sample-plugin` must match the folder name under `.obsidian/plugins/` for local development.

## Rules at a glance

- Run the full gate before pushing.
- Add new technical terms to `cspell-words.txt`.
- Write reference-style markdown links with definitions at the bottom of the paragraph.
- Avoid em-dashes, passive voice, and italicized copulas in prose.
- Keep paragraphs on one line. No hard wrap.
- Don't force-push to `main`. Don't force-push release-please PR branches either. Those force-pushes orphan the `autorelease: tagged` label that release-please relies on to track the last released commit.
- Don't bypass hooks.
- Don't hand-edit release-managed files.

## Further reading

- `README.md` for the user-facing overview
- `DEVELOPMENT.md` for the human developer guide
- `CHANGELOG.md` for release history
