import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth';

const BACKEND_URL = 'http://localhost:3000';

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
  errorMessage: string = '';

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) {}

  loginfunc(): void {
    if (!this.emailInput || !this.passwordInput) {
      this.errorMessage = 'Please enter both email and password.';
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
          this.errorMessage = res.message || 'Invalid email or password.';
        }
      },
      error: () => {
        this.errorMessage = 'Cannot connect to backend server on port 3000.';
      }
    });
  }
}