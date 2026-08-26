import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms'; 

@Component({
  imports: [RouterLink, FormsModule],
  selector: 'app-user-profile-settings',
  styleUrl: './user-profile-settings.css',
  templateUrl: './user-profile-settings.html',
})
export class UserProfileSettings 
{
    userProfile = {
        username: 'hadialk04',
        email: 'hadialk04@fabulari.com',
        dob: '2004-10-12', 
        role: 'User',
        isDarkMode: false,
        profilePictureUrl: '/pfp.png' 
    };

    currentPasswordInput: string = '';
    newPasswordInput: string = '';
    confirmPasswordInput: string = '';
}