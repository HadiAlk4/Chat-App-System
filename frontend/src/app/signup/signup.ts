import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth';
import { UploadService } from '../services/upload';
import { isValidEmail, isValidPassword, PASSWORD_RULE_MESSAGE } from '../validators';

@Component({
  selector: 'app-signup',
  imports: [RouterLink, FormsModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})

// adminPass123 - userPass123 - Password123
export class Signup implements OnInit
{
  usernameInput: string = '';
  emailInput: string = '';
  passwordInput: string = '';
  dobInput: string = '';
  isFirstUser = signal(false);
  selectedFile: File | null = null;
  selectedFileName = signal('');
  errorMessage = signal('');

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private uploadService: UploadService
  ) {}

  ngOnInit(): void {
    // Skip during prerender so the result is not baked into the static page
    if (typeof window === 'undefined') return;

    this.http.get<{ ok: boolean; firstUser: boolean }>('http://localhost:3000/api/signup/first-user').subscribe({
      next: (res) => this.isFirstUser.set(res.ok && res.firstUser),
      error: () => this.isFirstUser.set(false),
    });
  }

  calculateAge(dob: string): number {
    if (!dob) return -1;
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return -1;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      this.errorMessage.set('Profile doodle must be 2MB or smaller.');
      target.value = '';
      this.selectedFile = null;
      this.selectedFileName.set('');
      return;
    }

    this.errorMessage.set('');
    this.selectedFile = file;
    this.selectedFileName.set(file.name);
  }

  registerUser(): void {
    this.errorMessage.set('');

    if (!this.usernameInput.trim() || !this.emailInput || !this.passwordInput || !this.dobInput) {
      this.errorMessage.set('Please fill in all required fields.');
      return;
    }

    if (!isValidEmail(this.emailInput)) {
      this.errorMessage.set('Please enter a valid email address.');
      return;
    }

    if (!isValidPassword(this.passwordInput)) {
      this.errorMessage.set(PASSWORD_RULE_MESSAGE);
      return;
    }

    const calculatedAge = this.calculateAge(this.dobInput);
    if (calculatedAge < 0) 
    {
      this.errorMessage.set('Please enter a valid Date of Birth (cannot be in the future).');
      return;
    }

    const payload = {
      username: this.usernameInput,
      email: this.emailInput,
      password: this.passwordInput,
      dob: this.dobInput,
      age: calculatedAge,
    };

    this.http.post<any>('http://localhost:3000/api/signup', payload).subscribe({
      next: (res) => 
        {
        if (res.ok) 
          {
          if (this.selectedFile) {
            this.uploadDoodleThenFinish(res.user, this.selectedFile);
          } else {
            this.finishSignup(res.user);
          }
        } else {
          this.errorMessage.set(res.message || 'Signup failed.');
        }
      },
      error: () => {
        this.errorMessage.set('Cannot connect to backend server on port 3000.');
      },
    });
  }

  // The account already exists at this point, so a failed upload keeps the default doodle
  private uploadDoodleThenFinish(user: any, file: File): void {
    this.uploadService.uploadAvatar(file, user.username).subscribe({
      next: (res) => {
        if (res.ok) {
          user.profilePictureUrl = res.profilePictureUrl;
          this.finishSignup(user);
        } else {
          this.finishSignupAfterUploadError(user);
        }
      },
      error: () => this.finishSignupAfterUploadError(user),
    });
  }

  // Leave the message on screen briefly before moving on, since the account was still created
  private finishSignupAfterUploadError(user: any): void {
    this.errorMessage.set('Account created, but the profile doodle upload failed. You can add one later in Account Settings.');
    setTimeout(() => this.finishSignup(user), 2500);
  }

  private finishSignup(user: any): void {
    this.authService.setUser(user);
    // store the user data in the session storage so that each page will have access to the user data
    sessionStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('username', user.username);
    sessionStorage.setItem('role', user.role);

    if (user.role === 'super-admin') 
    {
      this.router.navigateByUrl('/super-admin-dashboard');
    } else 
    {
      this.router.navigateByUrl('/dashboard');
    }
  }
}