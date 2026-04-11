import { type App, Modal } from 'obsidian';

export class ViteSampleModal extends Modal {
  private readonly message: string;

  constructor(app: App, message: string) {
    super(app);
    this.message = message;
    // Scope-registered bindings fire only while the modal is open, so they
    // cannot collide with a user's global hotkey configuration.
    this.scope.register(['Mod'], 'Enter', () => {
      this.close();
    });
  }

  onOpen(): void {
    const { contentEl, titleEl } = this;
    titleEl.setText('Sample message');

    const body = contentEl.createDiv({ cls: 'vite-sample-modal__body' });
    body.createEl('p', { text: this.message });
    body.createEl('p', { text: 'Press escape or click outside to close.' });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
