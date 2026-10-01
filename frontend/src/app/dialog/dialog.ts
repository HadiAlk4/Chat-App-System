import { Component, ElementRef, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogService } from '../services/dialog';

@Component({
  selector: 'app-dialog',
  imports: [FormsModule],
  templateUrl: './dialog.html',
  styleUrl: './dialog.css',
  host: { '(document:keydown.escape)': 'dialog.cancel()' },
})
export class Dialog {
  protected readonly dialog = inject(DialogService);
  private readonly host = inject(ElementRef<HTMLElement>);

  constructor() {
    effect(() => {
      if (!this.dialog.current()) return;
      setTimeout(() => {
        const target = this.host.nativeElement.querySelector('input.input-block, .dialog-confirm');
        (target as HTMLElement | null)?.focus();
      });
    });
  }
}
