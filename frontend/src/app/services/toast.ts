import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'danger' | 'secondary';

export interface Toast {
  id: number;
  type: ToastType;
  text: string;
  leaving: boolean;
}

// Matches the slide-out animation length in toasts.css
const LEAVE_MS = 250;

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private nextId = 0;

  success(text: string): void {
    this.show('success', text);
  }

  error(text: string): void {
    this.show('danger', text, 5000);
  }

  info(text: string): void {
    this.show('secondary', text);
  }

  fromResponse(res: { ok: boolean; message?: string }, fallback = ''): void {
    const text = res.message || fallback;
    if (!text) return;
    if (res.ok) this.success(text);
    else this.error(text);
  }

  show(type: ToastType, text: string, durationMs = 3500): void {
    const id = ++this.nextId;
    this.toasts.update((list) => [...list, { id, type, text, leaving: false }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }

  dismiss(id: number): void {
    const toast = this.toasts().find((t) => t.id === id);
    if (!toast || toast.leaving) return;

    this.toasts.update((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => this.toasts.update((list) => list.filter((t) => t.id !== id)), LEAVE_MS);
  }
}
