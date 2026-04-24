/*
 * Minimal runtime stub of the `obsidian` module for Vitest.
 *
 * The real `obsidian` npm package is a types-only shim with no runtime main,
 * so importing it under Vitest throws. This stub provides just enough of the
 * public API for unit tests to import, instantiate, and drive plugin code,
 * including invoking captured callbacks (commands, ribbon, protocol, DOM
 * events, and settings onChange handlers).
 *
 * Extend this file as you need more of the API surface in your tests.
 */

import { readFileSync, statSync } from 'node:fs';
import { access, mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { vi } from 'vitest';

type AnyFn = (...args: unknown[]) => unknown;

interface CapturedCommand {
  id: string;
  name: string;
  callback?: () => unknown;
  editorCallback?: (editor: Editor, ctx: MarkdownView) => unknown;
  editorCheckCallback?: (checking: boolean, editor: Editor, ctx: MarkdownView) => boolean | void;
  checkCallback?: (checking: boolean) => boolean | void;
}

interface CapturedRibbonIcon {
  icon: string;
  title: string;
  callback: (evt: MouseEvent) => unknown;
}

interface CapturedDomEvent {
  target: EventTarget;
  event: string;
  callback: (evt: Event) => unknown;
}

interface CapturedBasesView {
  name: string;
  icon: string;
  factory: (controller: QueryController, containerEl: HTMLElement) => unknown;
  options?: (config?: BasesViewConfig) => BasesAllOptions[];
}

const registries = {
  settings: [] as Setting[],
  notices: [] as Notice[],
};

export function __resetObsidianMocks(): void {
  registries.settings.length = 0;
  registries.notices.length = 0;
  Platform.isMobile = false;
  Platform.isDesktop = true;
}

export function __getSettings(): Setting[] {
  return [...registries.settings];
}

export function __getNotices(): Notice[] {
  return [...registries.notices];
}

export class Component {
  load = vi.fn();
  unload = vi.fn();
  addChild = vi.fn();
  removeChild = vi.fn();
  register = vi.fn();
  registerEvent = vi.fn();
  registerDomEvent = vi.fn();
  registerInterval = vi.fn();

  onload(): Promise<void> | void {
    // Subclass override point.
  }

  onunload(): void {
    // Subclass override point.
  }
}

export class Plugin extends Component {
  app: App;
  manifest: Record<string, unknown>;

  // Test introspection. Plugin code registers callbacks here, and tests
  // invoke them to exercise branches.
  __commands: CapturedCommand[] = [];
  __ribbonIcons: CapturedRibbonIcon[] = [];
  __protocolHandlers = new Map<string, (params: Record<string, string>) => unknown>();
  __domEvents: CapturedDomEvent[] = [];
  __viewFactories = new Map<string, (leaf: WorkspaceLeaf) => unknown>();
  __statusBarItems: HTMLElement[] = [];
  __settingTabs: PluginSettingTab[] = [];
  __intervals: number[] = [];
  __basesViews = new Map<string, CapturedBasesView>();

  constructor(app: App, manifest: Record<string, unknown> = {}) {
    super();
    this.app = app;
    this.manifest = manifest;
  }

  // When the Vault has a `DataAdapter` (as set by `createFilesystemVault`),
  // load/save routes through `.obsidian/plugins/{manifest.id}/data.json` on
  // disk so integration tests can round-trip settings. Without an adapter,
  // the stubs keep their original `null`/no-op behavior so unit tests that
  // don't wire an adapter stay unaffected.
  loadData = vi.fn(async () => {
    const adapter = this.app.vault.adapter;
    const id = this.manifest['id'];
    if (!adapter || typeof id !== 'string' || id === '') return null as unknown;
    const path = `.obsidian/plugins/${id}/data.json`;
    if (!(await adapter.exists(path))) return null as unknown;
    return JSON.parse(await adapter.read(path)) as unknown;
  });
  saveData = vi.fn(async (data: unknown) => {
    const adapter = this.app.vault.adapter;
    const id = this.manifest['id'];
    if (!adapter || typeof id !== 'string' || id === '') return;
    const dir = `.obsidian/plugins/${id}`;
    await adapter.mkdir(dir);
    await adapter.write(`${dir}/data.json`, JSON.stringify(data, null, 2));
  });

  addRibbonIcon = vi.fn((icon: string, title: string, callback: (evt: MouseEvent) => unknown) => {
    this.__ribbonIcons.push({ icon, title, callback });
    return document.createElement('div');
  });

  addStatusBarItem = vi.fn(() => {
    const el = document.createElement('div');
    this.__statusBarItems.push(el);
    return el;
  });

  addCommand = vi.fn((cmd: CapturedCommand) => {
    this.__commands.push(cmd);
    return cmd;
  });

  addSettingTab = vi.fn((tab: PluginSettingTab) => {
    this.__settingTabs.push(tab);
  });

  registerView = vi.fn((type: string, factory: (leaf: WorkspaceLeaf) => unknown) => {
    this.__viewFactories.set(type, factory);
  });

  registerBasesView = vi.fn((id: string, registration: CapturedBasesView) => {
    this.__basesViews.set(id, registration);
    return true;
  });

  registerObsidianProtocolHandler = vi.fn(
    (scheme: string, handler: (params: Record<string, string>) => unknown) => {
      this.__protocolHandlers.set(scheme, handler);
    },
  );

  override registerDomEvent = vi.fn((target: EventTarget, event: string, callback: AnyFn) => {
    this.__domEvents.push({ target, event, callback: callback as (evt: Event) => unknown });
  });

  override registerInterval = vi.fn((handle: number) => {
    this.__intervals.push(handle);
    return handle;
  });

  onUserEnable(): void {
    // Subclass override point.
  }

  onExternalSettingsChange?(): unknown;

  // Test helpers
  __findCommand(id: string): CapturedCommand | undefined {
    return this.__commands.find((c) => c.id === id);
  }
}

interface CapturedWorkspaceEvent {
  event: string;
  cb: (...args: unknown[]) => unknown;
}

type WorkspaceEventRef = CapturedWorkspaceEvent;

interface WorkspaceOn {
  (
    event: 'file-menu',
    cb: (menu: Menu, file: TAbstractFile, source: string) => unknown,
  ): WorkspaceEventRef;
  (
    event: 'editor-menu',
    cb: (menu: Menu, editor: Editor, info: MarkdownView) => unknown,
  ): WorkspaceEventRef;
  (event: string, cb: (...args: unknown[]) => unknown): WorkspaceEventRef;
}

export interface DataAdapter {
  read(path: string): Promise<string>;
  write(path: string, data: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  remove(path: string): Promise<void>;
  mkdir(path: string): Promise<void>;
}

export class Vault {
  adapter?: DataAdapter;
  getFileByPath = vi.fn((_path: string) => null as TFile | null);
  getFolderByPath = vi.fn((_path: string) => null as TFolder | null);
  getAbstractFileByPath = vi.fn((_path: string) => null as TAbstractFile | null);
  // `async` keeps the return type aligned with Obsidian's real Promise-
  // returning signature. No body to await.
  // eslint-disable-next-line @typescript-eslint/require-await
  read = vi.fn(async (_file: TFile) => '');
}

class FilesystemDataAdapter implements DataAdapter {
  constructor(private readonly rootPath: string) {}

  async read(path: string): Promise<string> {
    return await readFile(join(this.rootPath, path), 'utf8');
  }

  async write(path: string, data: string): Promise<void> {
    const absolute = join(this.rootPath, path);
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, data, 'utf8');
  }

  async exists(path: string): Promise<boolean> {
    try {
      await access(join(this.rootPath, path));
      return true;
    } catch {
      return false;
    }
  }

  async remove(path: string): Promise<void> {
    await unlink(join(this.rootPath, path));
  }

  async mkdir(path: string): Promise<void> {
    await mkdir(join(this.rootPath, path), { recursive: true });
  }
}

// Factory for integration tests. Returns a Vault whose lookup, read, and
// `DataAdapter` methods hit a real directory on disk so plugin code can
// drive against a vault fixture copied to a tmpdir.
export function createFilesystemVault(rootPath: string): Vault {
  const vault = new Vault();
  vault.adapter = new FilesystemDataAdapter(rootPath);

  const statAt = (relPath: string) => {
    try {
      return statSync(join(rootPath, relPath));
    } catch {
      return null;
    }
  };

  vault.getFileByPath = vi.fn((path: string) => {
    const stats = statAt(path);
    return stats?.isFile() === true ? makeTFile(path) : null;
  });

  vault.getFolderByPath = vi.fn((path: string) => {
    const stats = statAt(path);
    return stats?.isDirectory() === true ? makeTFolder(path) : null;
  });

  vault.getAbstractFileByPath = vi.fn((path: string) => {
    const stats = statAt(path);
    if (stats?.isFile() === true) return makeTFile(path);
    if (stats?.isDirectory() === true) return makeTFolder(path);
    return null;
  });

  vault.read = vi.fn(
    // eslint-disable-next-line @typescript-eslint/require-await
    async (file: TFile) => readFileSync(join(rootPath, file.path), 'utf8'),
  );

  return vault;
}

function makeTFile(path: string): TFile {
  const file = new TFile();
  file.path = path;
  const lastSlash = path.lastIndexOf('/');
  const name = lastSlash >= 0 ? path.slice(lastSlash + 1) : path;
  file.name = name;
  const dot = name.lastIndexOf('.');
  if (dot > 0) {
    file.basename = name.slice(0, dot);
    file.extension = name.slice(dot + 1);
  } else {
    file.basename = name;
    file.extension = '';
  }
  return file;
}

function makeTFolder(path: string): TFolder {
  const folder = new TFolder();
  folder.path = path;
  const lastSlash = path.lastIndexOf('/');
  folder.name = lastSlash >= 0 ? path.slice(lastSlash + 1) : path;
  return folder;
}

export class App {
  workspace: {
    getLeavesOfType: (type: string) => WorkspaceLeaf[];
    getRightLeaf: (split: boolean) => WorkspaceLeaf | null;
    revealLeaf: (leaf: WorkspaceLeaf) => Promise<void>;
    detachLeavesOfType: (type: string) => void;
    getActiveViewOfType: (type: unknown) => unknown;
    on: WorkspaceOn;
    openLinkText: (linktext: string, sourcePath: string, newLeaf?: unknown) => Promise<void>;
    trigger: (name: string, ...args: unknown[]) => void;
    __eventHandlers: CapturedWorkspaceEvent[];
  };
  vault: Vault;
  metadataCache: Record<string, unknown>;
  fileManager: Record<string, unknown>;

  constructor() {
    const eventHandlers: CapturedWorkspaceEvent[] = [];
    this.workspace = {
      getLeavesOfType: vi.fn((_type: string) => [] as WorkspaceLeaf[]),
      getRightLeaf: vi.fn((_split: boolean) => null),
      // `async` keeps the return type aligned with Obsidian's real Promise-
      // returning signature. No body to await.
      // eslint-disable-next-line @typescript-eslint/require-await
      revealLeaf: vi.fn(async (_leaf: WorkspaceLeaf) => undefined),
      detachLeavesOfType: vi.fn((_type: string) => undefined),
      getActiveViewOfType: vi.fn(() => null),
      on: vi.fn((event: string, cb: (...args: unknown[]) => unknown) => {
        const ref: CapturedWorkspaceEvent = { event, cb };
        eventHandlers.push(ref);
        return ref;
      }) as unknown as WorkspaceOn,
      openLinkText: vi.fn(async (_linktext: string, _sourcePath: string, _newLeaf?: unknown) => {
        // no-op stub. Tests assert against the spy directly.
      }),
      trigger: vi.fn((_name: string, ..._args: unknown[]) => undefined),
      __eventHandlers: eventHandlers,
    };
    this.vault = new Vault();
    this.metadataCache = {};
    this.fileManager = {};
  }
}

export class PluginSettingTab {
  app: App;
  containerEl: HTMLElement;

  constructor(app: App, _plugin: Plugin) {
    this.app = app;
    this.containerEl = document.createElement('div');
  }

  display(): void {}
  hide(): void {}
}

// Mirrors Obsidian's real `ValueComponent<T>` base class. A single
// shared `setValue`/`onChange`/`__trigger` surface keeps the per-component
// stubs to just the API that actually differs between widgets.
class ValueComponent<T> {
  value: T;
  protected _onChange?: (v: T) => void | Promise<void>;

  constructor(initial: T) {
    this.value = initial;
  }

  setValue(v: T): this {
    this.value = v;
    return this;
  }

  onChange(cb: (v: T) => void | Promise<void>): this {
    this._onChange = cb;
    return this;
  }

  async __trigger(v: T): Promise<void> {
    this.value = v;
    await this._onChange?.(v);
  }
}

class ClickComponent {
  protected _onClick?: () => void | Promise<void>;

  onClick(cb: () => void | Promise<void>): this {
    this._onClick = cb;
    return this;
  }

  async __trigger(): Promise<void> {
    await this._onClick?.();
  }
}

class TextComponent extends ValueComponent<string> {
  constructor() {
    super('');
  }
  setPlaceholder(_p: string): this {
    return this;
  }
}

class ToggleComponent extends ValueComponent<boolean> {
  constructor() {
    super(false);
  }
}

class SliderComponent extends ValueComponent<number> {
  constructor() {
    super(0);
  }
  setLimits(_min: number, _max: number, _step: number): this {
    return this;
  }
  setDynamicTooltip(): this {
    return this;
  }
}

class ButtonComponent extends ClickComponent {
  setButtonText(_t: string): this {
    return this;
  }
  setWarning(): this {
    return this;
  }
  setCta(): this {
    return this;
  }
  setTooltip(_t: string): this {
    return this;
  }
  setIcon(_i: string): this {
    return this;
  }
}

class ExtraButtonComponent extends ClickComponent {
  icon = '';
  setIcon(icon: string): this {
    this.icon = icon;
    return this;
  }
  setTooltip(_t: string): this {
    return this;
  }
  setDisabled(_d: boolean): this {
    return this;
  }
}

class TextAreaComponent extends ValueComponent<string> {
  constructor() {
    super('');
  }
  setPlaceholder(_p: string): this {
    return this;
  }
}

class SearchComponent extends ValueComponent<string> {
  constructor() {
    super('');
  }
  setPlaceholder(_p: string): this {
    return this;
  }
}

class DropdownComponent extends ValueComponent<string> {
  options: Record<string, string> = {};
  constructor() {
    super('');
  }
  addOption(key: string, label: string): this {
    this.options[key] = label;
    return this;
  }
  addOptions(opts: Record<string, string>): this {
    Object.assign(this.options, opts);
    return this;
  }
}

class ColorComponent extends ValueComponent<string> {
  constructor() {
    super('');
  }
  setValueRgb(_rgb: { r: number; g: number; b: number }): this {
    return this;
  }
}

class MomentFormatComponent extends ValueComponent<string> {
  sampleEl: HTMLElement | null = null;
  defaultFormat = '';
  constructor() {
    super('');
  }
  setPlaceholder(_p: string): this {
    return this;
  }
  setDefaultFormat(format: string): this {
    this.defaultFormat = format;
    return this;
  }
  setSampleEl(el: HTMLElement): this {
    this.sampleEl = el;
    return this;
  }
}

class ProgressBarComponent {
  value = 0;
  setValue(v: number): this {
    this.value = v;
    return this;
  }
}

type AnyComponent =
  | TextComponent
  | TextAreaComponent
  | SearchComponent
  | DropdownComponent
  | ToggleComponent
  | SliderComponent
  | ButtonComponent
  | ExtraButtonComponent
  | ColorComponent
  | MomentFormatComponent
  | ProgressBarComponent;

export class Setting {
  name = '';
  desc = '';
  heading = false;
  settingEl: HTMLElement;
  components: AnyComponent[] = [];

  constructor(containerEl: HTMLElement) {
    this.settingEl = document.createElement('div');
    containerEl.appendChild(this.settingEl);
    registries.settings.push(this);
  }

  setName(name: string): this {
    this.name = name;
    return this;
  }
  setDesc(desc: string): this {
    this.desc = desc;
    return this;
  }
  setHeading(): this {
    this.heading = true;
    return this;
  }
  setTooltip(_tooltip: string): this {
    return this;
  }
  setClass(_cls: string): this {
    return this;
  }
  setDisabled(_disabled: boolean): this {
    return this;
  }
  addText(cb: (text: TextComponent) => void): this {
    const c = new TextComponent();
    this.components.push(c);
    cb(c);
    return this;
  }
  addTextArea(cb: (area: TextAreaComponent) => void): this {
    const c = new TextAreaComponent();
    this.components.push(c);
    cb(c);
    return this;
  }
  addSearch(cb: (search: SearchComponent) => void): this {
    const c = new SearchComponent();
    this.components.push(c);
    cb(c);
    return this;
  }
  addDropdown(cb: (dropdown: DropdownComponent) => void): this {
    const c = new DropdownComponent();
    this.components.push(c);
    cb(c);
    return this;
  }
  addToggle(cb: (toggle: ToggleComponent) => void): this {
    const c = new ToggleComponent();
    this.components.push(c);
    cb(c);
    return this;
  }
  addSlider(cb: (slider: SliderComponent) => void): this {
    const c = new SliderComponent();
    this.components.push(c);
    cb(c);
    return this;
  }
  addButton(cb: (button: ButtonComponent) => void): this {
    const c = new ButtonComponent();
    this.components.push(c);
    cb(c);
    return this;
  }
  addExtraButton(cb: (button: ExtraButtonComponent) => void): this {
    const c = new ExtraButtonComponent();
    this.components.push(c);
    cb(c);
    return this;
  }
  addColorPicker(cb: (picker: ColorComponent) => void): this {
    const c = new ColorComponent();
    this.components.push(c);
    cb(c);
    return this;
  }
  addMomentFormat(cb: (moment: MomentFormatComponent) => void): this {
    const c = new MomentFormatComponent();
    this.components.push(c);
    cb(c);
    return this;
  }
  addProgressBar(cb: (bar: ProgressBarComponent) => void): this {
    const c = new ProgressBarComponent();
    this.components.push(c);
    cb(c);
    return this;
  }
}

export class Scope {
  __bindings: { modifiers: string[]; key: string; fn: (...args: unknown[]) => unknown }[] = [];
  register = vi.fn((modifiers: string[], key: string, fn: (...args: unknown[]) => unknown) => {
    const binding = { modifiers, key, fn };
    this.__bindings.push(binding);
    return binding;
  });
}

export class Modal {
  app: App;
  contentEl: HTMLElement;
  titleEl: HTMLElement;
  scope: Scope;

  constructor(app: App) {
    this.app = app;
    this.contentEl = document.createElement('div');
    this.titleEl = document.createElement('div');
    this.scope = new Scope();
  }
  open = vi.fn();
  close = vi.fn();
  onOpen(): void {}
  onClose(): void {}
}

export class Notice {
  hide = vi.fn();
  constructor(public message: string) {
    registries.notices.push(this);
  }
}

export class ItemView extends Component {
  leaf: WorkspaceLeaf;
  contentEl: HTMLElement;

  constructor(leaf: WorkspaceLeaf) {
    super();
    this.leaf = leaf;
    this.contentEl = document.createElement('div');
  }

  getViewType(): string {
    return '';
  }
  getDisplayText(): string {
    return '';
  }
  getIcon(): string {
    return '';
  }
  async onOpen(): Promise<void> {}
  async onClose(): Promise<void> {}
}

export class MarkdownView {
  file: TFile | null = null;
}

export class TAbstractFile {
  path = '';
  name = '';
}
export class TFile extends TAbstractFile {
  basename = '';
  extension = '';
}
export class TFolder extends TAbstractFile {
  children: TAbstractFile[] = [];
}

export class MenuItem {
  title = '';
  icon = '';
  private _onClick?: (evt?: unknown) => unknown;
  setTitle(title: string): this {
    this.title = title;
    return this;
  }
  setIcon(icon: string): this {
    this.icon = icon;
    return this;
  }
  onClick(cb: (evt?: unknown) => unknown): this {
    this._onClick = cb;
    return this;
  }
  __trigger(evt?: unknown): unknown {
    return this._onClick?.(evt);
  }
}

type MenuEntry = MenuItem | { separator: true };

export class Menu {
  items: MenuEntry[] = [];
  showAtMouseEvent = vi.fn();
  showAtPosition = vi.fn();
  addItem(cb: (item: MenuItem) => unknown): this {
    const item = new MenuItem();
    cb(item);
    this.items.push(item);
    return this;
  }
  addSeparator(): this {
    this.items.push({ separator: true });
    return this;
  }
  __getMenuItems(): MenuItem[] {
    return this.items.filter((entry): entry is MenuItem => entry instanceof MenuItem);
  }
}

export interface Editor {
  replaceSelection(text: string): void;
  getSelection(): string;
}

export class WorkspaceLeaf {
  view: unknown = null;
  // `async` keeps the return type aligned with Obsidian's real Promise-
  // returning signature. No body to await.
  // eslint-disable-next-line @typescript-eslint/require-await
  setViewState = vi.fn(async (_state: unknown) => undefined);
}

export class QueryController extends Component {}

// Type-shape stubs so src code importing these symbols still compiles. The
// root `tsconfig.json` aliases `obsidian` to this file.
export type BasesAllOptions = {
  type: string;
  key: string;
  displayName: string;
  default?: unknown;
  options?: Record<string, string>;
};

export interface BasesViewConfig {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  getOrder(): BasesPropertyId[];
  getDisplayName(propertyId: BasesPropertyId): string;
}

export type BasesPropertyId = string;

export interface BasesEntry {
  file: { path: string; basename: string };
  getValue(propertyId: BasesPropertyId): { toString(): string } | null;
}

export interface BasesEntryGroup {
  key?: { toString(): string };
  hasKey(): boolean;
  entries: BasesEntry[];
}

export interface BasesQueryResult {
  data: BasesEntry[];
  groupedData: BasesEntryGroup[];
}

export interface HoverParent {
  hoverPopover: HoverPopover | null;
}

export class HoverPopover {}

// Mirror the real Obsidian API surface. The real `Keymap` ships as a class
// with static helpers, so this stub has to match.
// biome-ignore lint/complexity/noStaticOnlyClass: mirrors upstream API
export class Keymap {
  static isModEvent = vi.fn((_evt?: unknown) => false as unknown as boolean);
}

export function parsePropertyId(propertyId: string): { type: string; name: string } {
  const idx = propertyId.indexOf('.');
  if (idx < 0) {
    return { type: '', name: propertyId };
  }
  return { type: propertyId.slice(0, idx), name: propertyId.slice(idx + 1) };
}

// Real BasesView is abstract and constructed by Obsidian's runtime. The mock
// just records the controller and exposes config/data/app slots that tests
// populate before driving onDataUpdated.
export class BasesView extends Component {
  app: App | null = null;
  config: BasesViewConfig = {
    get: () => undefined,
    set: () => undefined,
    getOrder: () => [],
    getDisplayName: (id) => id,
  };
  data: BasesQueryResult = { data: [], groupedData: [] };
  allProperties: string[] = [];
  controller: unknown;

  constructor(controller: unknown) {
    super();
    this.controller = controller;
  }
}

export const Platform = {
  isDesktop: true,
  isMobile: false,
  isIosApp: false,
  isAndroidApp: false,
  isMacOS: true,
  isWin: false,
  isLinux: false,
};

// Expose the captured component types so tests can narrow safely.
export {
  ButtonComponent,
  ColorComponent,
  DropdownComponent,
  ExtraButtonComponent,
  MomentFormatComponent,
  ProgressBarComponent,
  SearchComponent,
  SliderComponent,
  TextAreaComponent,
  TextComponent,
  ToggleComponent,
};
