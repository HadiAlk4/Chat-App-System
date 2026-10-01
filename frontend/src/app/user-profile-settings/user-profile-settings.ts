import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth';
import { UploadService } from '../services/upload';
import { AccountService } from '../services/account';
import { FormMessage, isValidPassword, PASSWORD_RULE_MESSAGE } from '../validators';

const BACKEND_URL = 'http://localhost:3000';

@Component({
  imports: [RouterLink, FormsModule],
  selector: 'app-user-profile-settings',
  styleUrl: './user-profile-settings.css',
  templateUrl: './user-profile-settings.html',
})
export class UserProfileSettings implements OnInit {
  selectedFile: File | null = null;

  userProfile = {
    username: '',
    email: '',
    dob: '',
    role: '',
    isDarkMode: false,
    profilePictureUrl: '/pfp.png',
  };

  currentPasswordInput = '';
  newPasswordInput = '';
  confirmPasswordInput = '';
  originalUsername = '';
  deleteConfirmOpen = false;

  identityMessage = signal<FormMessage>(null);
  doodleMessage = signal<FormMessage>(null);
  passwordMessage = signal<FormMessage>(null);

  constructor(
    private authService: AuthService,
    private uploadService: UploadService,
    private accountService: AccountService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) {
      this.userProfile.username = user.username;
      this.userProfile.email = user.email;
      this.userProfile.dob = user.dob;
      this.userProfile.role = user.role;
      this.userProfile.isDarkMode = user.isDarkMode;
      this.userProfile.profilePictureUrl = user.profilePictureUrl || '/pfp.png';
      this.originalUsername = user.username;
    }
  }

  get doodleSrc(): string {
    const url = this.userProfile.profilePictureUrl || '/pfp.png';
    if (url.startsWith('/uploads/')) {
      return `${BACKEND_URL}${url}`;
    }
    return url;
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        this.doodleMessage.set({ type: 'danger', text: 'Profile doodle must be 2MB or smaller.' });
        target.value = '';
        this.selectedFile = null;
        return;
      }
      this.doodleMessage.set(null);
      this.selectedFile = file;
    }
  }

  uploadDoodle(): void {
    if (!this.selectedFile) {
      this.doodleMessage.set({ type: 'danger', text: 'Please select an image file first.' });
      return;
    }

    this.uploadService.uploadAvatar(this.selectedFile, this.originalUsername || this.userProfile.username).subscribe({
      next: (res) => {
        if (res.ok) {
          this.userProfile.profilePictureUrl = res.profilePictureUrl;

          const currentUser = this.authService.getUser();
          if (currentUser) {
            currentUser.profilePictureUrl = res.profilePictureUrl;
            this.authService.setUser(currentUser);
          }

          this.doodleMessage.set({ type: 'success', text: 'Doodle updated successfully!' });
          this.selectedFile = null;
        } else {
          this.doodleMessage.set({ type: 'danger', text: res.message || 'Upload failed.' });
        }
      },
      error: () => this.doodleMessage.set({ type: 'danger', text: 'Failed to connect to backend upload endpoint.' }),
    });
  }

  get isSuperAdmin(): boolean {
    return this.userProfile.role === 'super-admin';
  }

  // Opens the confirm dialog; the request is only sent from confirmAccountDeletion()
  requestAccountDeletion(): void {
    if (this.isSuperAdmin) {
      this.identityMessage.set({ type: 'danger', text: 'Super Admin cannot request account deletion.' });
      return;
    }

    if (!this.userProfile.username) {
      this.identityMessage.set({ type: 'danger', text: 'You must be logged in to request account deletion.' });
      return;
    }

    this.deleteConfirmOpen = true;
  }

  confirmAccountDeletion(): void {
    this.deleteConfirmOpen = false;
    this.accountService.requestAccountDeletion(this.originalUsername || this.userProfile.username).subscribe({
      next: (res) => {
        this.identityMessage.set({
          type: res.ok ? 'success' : 'danger',
          text: res.message || (res.ok ? 'Account deletion request submitted.' : 'Request failed.'),
        });
      },
      error: (err) => {
        this.identityMessage.set({
          type: 'danger',
          text: err?.error?.message || 'Failed to submit account deletion request.',
        });
      },
    });
  }

  saveUsername(): void {
    const nextUsername = this.userProfile.username.trim();
    if (!this.userProfile.email || !nextUsername) {
      this.identityMessage.set({ type: 'danger', text: 'Username is required.' });
      return;
    }

    this.accountService.updateUsername(this.userProfile.email, nextUsername).subscribe({
      next: (res) => {
        this.identityMessage.set({
          type: res.ok ? 'success' : 'danger',
          text: res.message || (res.ok ? 'Username updated' : 'Failed to update username'),
        });
        if (res.ok && res.user) {
          this.syncSession(res.user);
        }
      },
      error: (err) => this.identityMessage.set({ type: 'danger', text: err?.error?.message || 'Failed to update username.' }),
    });
  }

  onDarkModeChange(isDarkMode: boolean): void {
    this.userProfile.isDarkMode = isDarkMode;
    if (!this.userProfile.email) return;

    this.accountService.updateTheme(this.userProfile.email, isDarkMode).subscribe({
      next: (res) => {
        if (res.ok && res.user) {
          this.syncSession(res.user);
        } else {
          this.identityMessage.set({ type: 'danger', text: res.message || 'Failed to update chat theme.' });
        }
      },
      error: (err) => this.identityMessage.set({ type: 'danger', text: err?.error?.message || 'Failed to update chat theme.' }),
    });
  }

  savePassword(): void {
    this.passwordMessage.set(null);

    if (!this.currentPasswordInput || !this.newPasswordInput || !this.confirmPasswordInput) {
      this.passwordMessage.set({ type: 'danger', text: 'Please fill in all password fields.' });
      return;
    }

    if (!isValidPassword(this.newPasswordInput)) {
      this.passwordMessage.set({ type: 'danger', text: PASSWORD_RULE_MESSAGE });
      return;
    }

    if (this.newPasswordInput !== this.confirmPasswordInput) {
      this.passwordMessage.set({ type: 'danger', text: 'New password and confirmation do not match.' });
      return;
    }

    this.accountService
      .updatePassword(this.userProfile.email, this.currentPasswordInput, this.newPasswordInput)
      .subscribe({
        next: (res) => {
          this.passwordMessage.set({
            type: res.ok ? 'success' : 'danger',
            text: res.message || (res.ok ? 'Password updated' : 'Failed to update password'),
          });
          if (res.ok) {
            this.currentPasswordInput = '';
            this.newPasswordInput = '';
            this.confirmPasswordInput = '';
          }
        },
        error: (err) => this.passwordMessage.set({ type: 'danger', text: err?.error?.message || 'Failed to update password.' }),
      });
  }

  private syncSession(user: any): void {
    this.authService.setUser(user);
    this.userProfile.username = user.username;
    this.userProfile.isDarkMode = user.isDarkMode;
    this.userProfile.profilePictureUrl = user.profilePictureUrl || this.userProfile.profilePictureUrl;
    this.originalUsername = user.username;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('username', user.username);
      sessionStorage.setItem('user', JSON.stringify(user));
      if (user.role) sessionStorage.setItem('role', user.role);
    }
  }
}
