import { type App, Modal } from 'obsidian';

export class ViteSampleModal extends Modal {
	private readonly message: string;

	constructor(app: App, message: string) {
		super(app);
		this.message = message;
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
