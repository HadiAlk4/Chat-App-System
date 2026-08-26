import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-signup',
  imports: [RouterLink, FormsModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup 
{
  usernameInput: string = '';
  emailInput: string = '';
  passwordInput: string = '';
  dobInput: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  calculateAge(dob: string): number {
    if (!dob) return 18;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  registerUser(): void {
    if (!this.usernameInput || !this.emailInput || !this.passwordInput) {
      alert('Please fill in all required fields.');
      return;
    }

    const payload = {
      username: this.usernameInput,
      email: this.emailInput,
      password: this.passwordInput,
      birthdate: this.dobInput,
      age: this.calculateAge(this.dobInput),
    };

    this.http.post<any>('http://localhost:3000/api/signup', payload).subscribe({
      next: (res) => {
        if (res.ok) {
          alert('Signup successful! Please log in.');
          this.router.navigateByUrl('/login');
        } else {
          alert(res.message || 'Signup failed.');
        }
      },
      error: () => {
        alert('Cannot connect to backend server on port 3000.');
      },
    });
  }
}