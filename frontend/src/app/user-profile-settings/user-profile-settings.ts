import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth';
import { UploadService } from '../services/upload';

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

  constructor(
    private authService: AuthService,
    private uploadService: UploadService
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
        alert('File exceeds 2MB limit.');
        target.value = '';
        this.selectedFile = null;
        return;
      }
      this.selectedFile = file;
    }
  }

  uploadDoodle(): void {
    if (!this.selectedFile) {
      alert('Please select an image file first.');
      return;
    }

    this.uploadService.uploadAvatar(this.selectedFile, this.userProfile.username).subscribe({
      next: (res) => {
        if (res.ok) {
          this.userProfile.profilePictureUrl = res.profilePictureUrl;

          const currentUser = this.authService.getUser();
          if (currentUser) {
            currentUser.profilePictureUrl = res.profilePictureUrl;
            this.authService.setUser(currentUser);
          }

          alert('Doodle updated successfully!');
          this.selectedFile = null;
        } else {
          alert(res.message || 'Upload failed');
        }
      },
      error: () => alert('Failed to connect to backend upload endpoint.'),
    });
  }
}
