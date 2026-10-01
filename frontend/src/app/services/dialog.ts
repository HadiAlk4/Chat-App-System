import { Injectable, signal } from '@angular/core';

export interface DialogRequest {
  kind: 'confirm' | 'prompt';
  title: string;
  message: string;
  confirmLabel: string;
  danger: boolean;
  value: string;
  placeholder: string;
}

interface DialogOptions {
  title?: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface PromptOptions extends DialogOptions {
  initialValue?: string;
  placeholder?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  readonly current = signal<DialogRequest | null>(null);
  private resolveCurrent: ((result: string | null) => void) | null = null;

  confirm(message: string, options: DialogOptions = {}): Promise<boolean> {
    return this.open({
      kind: 'confirm',
      title: options.title ?? 'Are you sure?',
      message,
      confirmLabel: options.confirmLabel ?? 'Confirm',
      danger: options.danger ?? true,
      value: '',
      placeholder: '',
    }).then((result) => result !== null);
  }

  prompt(message: string, options: PromptOptions = {}): Promise<string | null> {
    return this.open({
      kind: 'prompt',
      title: options.title ?? 'Enter a value',
      message,
      confirmLabel: options.confirmLabel ?? 'Submit',
      danger: options.danger ?? false,
      value: options.initialValue ?? '',
      placeholder: options.placeholder ?? '',
    }).then((result) => result?.trim() || null);
  }

  submit(): void {
    const request = this.current();
    if (!request) return;
    if (request.kind === 'prompt' && !request.value.trim()) return;
    this.close(request.kind === 'prompt' ? request.value : 'confirmed');
  }

  cancel(): void {
    this.close(null);
  }

  private open(request: DialogRequest): Promise<string | null> {
    this.cancel();
    return new Promise((resolve) => {
      this.resolveCurrent = resolve;
      this.current.set(request);
    });
  }

  private close(result: string | null): void {
    const resolve = this.resolveCurrent;
    this.resolveCurrent = null;
    this.current.set(null);
    resolve?.(result);
  }
}
