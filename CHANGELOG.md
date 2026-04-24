# Changelog

## [0.4.1](https://github.com/tbhb/obsidian-vite-sample-plugin/compare/0.4.0...0.4.1) (2026-04-24)


### Bug Fixes

* **ci:** auto-detect GitHub prerelease flag from semver qualifier ([#19](https://github.com/tbhb/obsidian-vite-sample-plugin/issues/19)) ([0525480](https://github.com/tbhb/obsidian-vite-sample-plugin/commit/0525480e38e27e9bdd0fb54bbd34610b59863786))
* **ci:** scope manifest.json release-managed check to the version field ([#22](https://github.com/tbhb/obsidian-vite-sample-plugin/issues/22)) ([9c232a1](https://github.com/tbhb/obsidian-vite-sample-plugin/commit/9c232a1e1cc62095374adf5e399ac8af60d1fd86))

## [0.4.0](https://github.com/tbhb/obsidian-vite-sample-plugin/compare/0.4.0-beta.2...0.4.0) (2026-04-24)


### Miscellaneous Chores

* **release:** promote 0.4.0-beta.2 to stable 0.4.0 ([d3ccc3d](https://github.com/tbhb/obsidian-vite-sample-plugin/commit/d3ccc3d5bc59e374c6e8749c3acc2eb33c54cf44))

## [0.4.0-beta.2](https://github.com/tbhb/obsidian-vite-sample-plugin/compare/0.3.0-beta.2...0.4.0-beta.2) (2026-04-24)


### Features

* add Danger.js for diff-shape and PR-metadata gates ([#16](https://github.com/tbhb/obsidian-vite-sample-plugin/issues/16)) ([c366568](https://github.com/tbhb/obsidian-vite-sample-plugin/commit/c36656889474eb3766b92983610d97ce7e192259))
* add property testing tier with fast-check ([#12](https://github.com/tbhb/obsidian-vite-sample-plugin/issues/12)) ([08a34e5](https://github.com/tbhb/obsidian-vite-sample-plugin/commit/08a34e57fca2ada7ae1aa496760eb5981ebdc2ab))
* add Stryker mutation testing ([#14](https://github.com/tbhb/obsidian-vite-sample-plugin/issues/14)) ([fd83d5c](https://github.com/tbhb/obsidian-vite-sample-plugin/commit/fd83d5c314065c882078f65c2274b3a8069bb347))
* cover src/examples with mutation testing ([#15](https://github.com/tbhb/obsidian-vite-sample-plugin/issues/15)) ([02965fd](https://github.com/tbhb/obsidian-vite-sample-plugin/commit/02965fd7d73dd0d891acb725242a88db210fe479))


### Bug Fixes

* **ci:** only require lockfile update when deps actually change ([#17](https://github.com/tbhb/obsidian-vite-sample-plugin/issues/17)) ([bdc767d](https://github.com/tbhb/obsidian-vite-sample-plugin/commit/bdc767d94c3892ce1d23fd9f7bb686403b14400a))

## [0.3.0-beta.2](https://github.com/tbhb/obsidian-vite-sample-plugin/compare/0.2.1-beta.2...0.3.0-beta.2) (2026-04-24)


### Features

* add integration test tier with vault fixture ([#9](https://github.com/tbhb/obsidian-vite-sample-plugin/issues/9)) ([8558145](https://github.com/tbhb/obsidian-vite-sample-plugin/commit/85581458e4988b339ad3e30b01aef9ac0a900cfb))
* add integration tests for plugin settings and view rendering ([#10](https://github.com/tbhb/obsidian-vite-sample-plugin/issues/10)) ([3cc842b](https://github.com/tbhb/obsidian-vite-sample-plugin/commit/3cc842ba170df0877fd1c726849ad4ee07bfc5ec))

## [0.2.1-beta.2](https://github.com/tbhb/obsidian-vite-sample-plugin/compare/0.2.1-beta.1...0.2.1-beta.2) (2026-04-23)


### Miscellaneous Chores

* validate prerelease config auto-flags GitHub release ([bfc01f1](https://github.com/tbhb/obsidian-vite-sample-plugin/commit/bfc01f13914b17a8913512fbcc9cde2378029d49))

## [0.2.1-beta.1](https://github.com/tbhb/obsidian-vite-sample-plugin/compare/0.2.0...0.2.1-beta.1) (2026-04-23)


### Miscellaneous Chores

* validate App token release pipeline ([130e50e](https://github.com/tbhb/obsidian-vite-sample-plugin/commit/130e50ee12dc3223f5be5eff31fdce8766fb528e))

## [0.2.0](https://github.com/tbhb/obsidian-vite-sample-plugin/compare/0.1.1...0.2.0) (2026-04-11)


### Features

* demonstrate custom Bases views ([e1d698a](https://github.com/tbhb/obsidian-vite-sample-plugin/commit/e1d698a4f29f07301beda65a50bad46c59602be4))
* demonstrate every Setting component type ([68c8ad7](https://github.com/tbhb/obsidian-vite-sample-plugin/commit/68c8ad744a5a01dd56619b3f6253e68d81da298d))
* demonstrate file-menu and editor-menu context menus ([34d55c8](https://github.com/tbhb/obsidian-vite-sample-plugin/commit/34d55c860e261eb94218c9727851e795a990d9b6))
* demonstrate grouped and separate status bar items ([34e412f](https://github.com/tbhb/obsidian-vite-sample-plugin/commit/34e412f50dbb6fc4caaf88d42c8c499123c8acfc))
* demonstrate remaining command types and Scope hotkey API ([249c33b](https://github.com/tbhb/obsidian-vite-sample-plugin/commit/249c33b0d5eb533b528ea3a3917b778d7a964f2b))

## [0.1.1](https://github.com/tbhb/obsidian-vite-sample-plugin/compare/0.1.0...0.1.1) (2026-04-11)


### Bug Fixes

* **ci:** exclude CHANGELOG.md from rumdl and vale, opt into Node 24 runtime ([ea5cc25](https://github.com/tbhb/obsidian-vite-sample-plugin/commit/ea5cc250134589f2cda25852f1d2320387aff832))

## 0.1.0 (2026-04-11)


### Features

* scaffold obsidian plugin with vite 8, tailwind 4, and vitest ([f1bca54](https://github.com/tbhb/obsidian-vite-sample-plugin/commit/f1bca54e455ef6423d16dd0dfa29f856b3df8292))
