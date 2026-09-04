import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms'; 

import { AuthService } from '../services/auth';

@Component({
  imports: [RouterLink, FormsModule],
  selector: 'app-user-profile-settings',
  styleUrl: './user-profile-settings.css',
  templateUrl: './user-profile-settings.html',
})
export class UserProfileSettings 
{
  constructor(private authService: AuthService) {}

  ngOnInit(): void
  {
    const user = this.authService.getUser();
    if(user)
    {
      this.userProfile.username = user.username;
      this.userProfile.email = user.email;
      this.userProfile.dob = user.dob;
      this.userProfile.role = user.role;
      this.userProfile.isDarkMode = user.isDarkMode;
      this.userProfile.profilePictureUrl = user.profilePictureUrl;
      }
    }

    userProfile = {
        username: '',
        email: '',
        dob: '', 
        role: '',
        isDarkMode: false,
        profilePictureUrl: '/pfp.png' 
    };

    currentPasswordInput: string = '';
    newPasswordInput: string = '';
    confirmPasswordInput: string = '';
}