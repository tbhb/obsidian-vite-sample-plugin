/*
 * Minimal runtime stub of the `obsidian` module for Vitest.
 *
 * The real `obsidian` npm package is a types-only shim with no runtime main,
 * so importing it under Vitest throws. This stub provides just enough of the
 * public API for unit tests to import, instantiate, and drive plugin code —
 * including invoking captured callbacks (commands, ribbon, protocol, DOM
 * events, and settings onChange handlers).
 *
 * Extend this file as you need more of the API surface in your tests.
 */

import { vi } from 'vitest';

type AnyFn = (...args: unknown[]) => unknown;

// Loose command shape — real Obsidian typings are richer than our mock's
// subset, so we accept anything and let plugin code bind more specific types.
interface CapturedCommand {
  id: string;
  name: string;
  callback?: (...args: any[]) => any;
  editorCallback?: (...args: any[]) => any;
  editorCheckCallback?: (...args: any[]) => any;
  checkCallback?: (...args: any[]) => any;
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

const registries = {
  settings: [] as Setting[],
};

export function __resetObsidianMocks(): void {
  registries.settings.length = 0;
  Platform.isMobile = false;
  Platform.isDesktop = true;
}

export function __getSettings(): Setting[] {
  return [...registries.settings];
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
}

export class Plugin extends Component {
  app: App;
  manifest: Record<string, unknown>;

  // Test introspection — the plugin code registers callbacks here; tests
  // invoke them to exercise branches.
  __commands: CapturedCommand[] = [];
  __ribbonIcons: CapturedRibbonIcon[] = [];
  __protocolHandlers = new Map<string, (params: Record<string, string>) => unknown>();
  __domEvents: CapturedDomEvent[] = [];
  __viewFactories = new Map<string, (leaf: WorkspaceLeaf) => unknown>();
  __statusBarItems: HTMLElement[] = [];
  __settingTabs: PluginSettingTab[] = [];
  __intervals: number[] = [];

  constructor(app: App, manifest: Record<string, unknown> = {}) {
    super();
    this.app = app;
    this.manifest = manifest;
  }

  loadData = vi.fn(async () => null as unknown);
  saveData = vi.fn(async (_data: unknown) => undefined);

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

  registerObsidianProtocolHandler = vi.fn(
    (scheme: string, handler: (params: Record<string, string>) => unknown) => {
      this.__protocolHandlers.set(scheme, handler);
    },
  );

  registerDomEvent = vi.fn((target: EventTarget, event: string, callback: AnyFn) => {
    this.__domEvents.push({ target, event, callback: callback as (evt: Event) => unknown });
  });

  registerInterval = vi.fn((handle: number) => {
    this.__intervals.push(handle);
    return handle;
  });

  // Test helpers
  __findCommand(id: string): CapturedCommand | undefined {
    return this.__commands.find((c) => c.id === id);
  }
}

interface CapturedWorkspaceEvent {
  event: string;
  cb: (...args: any[]) => any;
}

export class App {
  workspace: {
    getLeavesOfType: (type: string) => WorkspaceLeaf[];
    getRightLeaf: (split: boolean) => WorkspaceLeaf | null;
    revealLeaf: (leaf: WorkspaceLeaf) => unknown;
    detachLeavesOfType: (type: string) => void;
    getActiveViewOfType: (type: unknown) => unknown;
    on: (event: string, cb: (...args: any[]) => any) => CapturedWorkspaceEvent;
    __eventHandlers: CapturedWorkspaceEvent[];
  };
  vault: Record<string, unknown>;
  metadataCache: Record<string, unknown>;
  fileManager: Record<string, unknown>;

  constructor() {
    const eventHandlers: CapturedWorkspaceEvent[] = [];
    this.workspace = {
      getLeavesOfType: vi.fn((_type: string) => [] as WorkspaceLeaf[]),
      getRightLeaf: vi.fn((_split: boolean) => null),
      revealLeaf: vi.fn(),
      detachLeavesOfType: vi.fn((_type: string) => undefined),
      getActiveViewOfType: vi.fn(() => null),
      on: vi.fn((event: string, cb: (...args: any[]) => any) => {
        const ref: CapturedWorkspaceEvent = { event, cb };
        eventHandlers.push(ref);
        return ref;
      }),
      __eventHandlers: eventHandlers,
    };
    this.vault = {
      getFileByPath: vi.fn(() => null),
      getFolderByPath: vi.fn(() => null),
    };
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

class TextComponent {
  value = '';
  private _onChange?: (v: string) => void | Promise<void>;
  setPlaceholder(_p: string): this {
    return this;
  }
  setValue(v: string): this {
    this.value = v;
    return this;
  }
  onChange(cb: (v: string) => void | Promise<void>): this {
    this._onChange = cb;
    return this;
  }
  async __trigger(v: string): Promise<void> {
    this.value = v;
    await this._onChange?.(v);
  }
}

class ToggleComponent {
  value = false;
  private _onChange?: (v: boolean) => void | Promise<void>;
  setValue(v: boolean): this {
    this.value = v;
    return this;
  }
  onChange(cb: (v: boolean) => void | Promise<void>): this {
    this._onChange = cb;
    return this;
  }
  async __trigger(v: boolean): Promise<void> {
    this.value = v;
    await this._onChange?.(v);
  }
}

class SliderComponent {
  value = 0;
  private _onChange?: (v: number) => void | Promise<void>;
  setLimits(_min: number, _max: number, _step: number): this {
    return this;
  }
  setValue(v: number): this {
    this.value = v;
    return this;
  }
  setDynamicTooltip(): this {
    return this;
  }
  onChange(cb: (v: number) => void | Promise<void>): this {
    this._onChange = cb;
    return this;
  }
  async __trigger(v: number): Promise<void> {
    this.value = v;
    await this._onChange?.(v);
  }
}

class ButtonComponent {
  private _onClick?: () => void;
  setButtonText(_t: string): this {
    return this;
  }
  onClick(cb: () => void): this {
    this._onClick = cb;
    return this;
  }
  __trigger(): void {
    this._onClick?.();
  }
}

type AnyComponent = TextComponent | ToggleComponent | SliderComponent | ButtonComponent;

export class Setting {
  settingEl: HTMLElement;
  components: AnyComponent[] = [];

  constructor(containerEl: HTMLElement) {
    this.settingEl = document.createElement('div');
    containerEl.appendChild(this.settingEl);
    registries.settings.push(this);
  }

  setName(_name: string): this {
    return this;
  }
  setDesc(_desc: string): this {
    return this;
  }
  setHeading(): this {
    return this;
  }
  addText(cb: (text: TextComponent) => void): this {
    const c = new TextComponent();
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
  constructor(public message: string) {}
  hide = vi.fn();
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
  getValue(): string;
  setValue(text: string): void;
}

export class WorkspaceLeaf {
  view: unknown = null;
  setViewState = vi.fn(async (_state: unknown) => undefined);
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
export { ButtonComponent, SliderComponent, TextComponent, ToggleComponent };
