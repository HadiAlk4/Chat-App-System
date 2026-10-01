import { Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth';

const BACKEND_URL = 'http://localhost:3000';

// Module state resets on a full page load, so the splash plays on refresh but not on in-app navigation
let splashPlayed = false;

@Component({
  selector: 'app-login',
  imports: [RouterLink, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login 
{
  emailInput: string = '';
  passwordInput: string = '';
  errorMessage = signal('');
  readonly showSplash = !splashPlayed;

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) {
    // The server keeps module state between requests, so only the browser marks the splash as played
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      splashPlayed = true;
    }
  }

  loginfunc(): void {
    if (!this.emailInput || !this.passwordInput) {
      this.errorMessage.set('Please enter both email and password.');
      return;
    }

    const payload = {
      email: this.emailInput,
      password: this.passwordInput
    };

    this.http.post<any>(`${BACKEND_URL}/api/auth`, payload).subscribe({
      next: (res) => {
        if (res.ok && res.valid) {
          this.authService.setUser(res.user);
          
          sessionStorage.setItem('user', JSON.stringify(res.user));
          sessionStorage.setItem('username', res.user.username);
          sessionStorage.setItem('role', res.user.role);

          if (res.user.role === 'super-admin') {
            this.router.navigateByUrl('/super-admin-dashboard');
          } else {
            this.router.navigateByUrl('/dashboard');
          }
        } else {
          this.errorMessage.set(res.message || 'Invalid email or password.');
        }
      },
      error: () => {
        this.errorMessage.set('Cannot connect to backend server on port 3000.');
      }
    });
  }
}