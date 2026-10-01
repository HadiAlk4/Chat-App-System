import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Dialog } from './dialog/dialog';
import { Toasts } from './toasts/toasts';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toasts, Dialog],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}
