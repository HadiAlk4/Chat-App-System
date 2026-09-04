import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../services/auth';

@Component({
  selector: 'app-my-memberships',
  imports: [RouterLink, FormsModule],
  templateUrl: './my-memberships.html',
  styleUrl: './my-memberships.css',
})
export class MyMemberships 
{

  currentUserRole: string = '';
  currentUsername: string = '';
  constructor(private authService: AuthService) {}

joinedGroups = [
    {
      name: 'Sci-Fi Writers',
      description: 'A place for aspiring sci-fi authors to share snippets, world-build, and critique each other\'s work.',
      role: 'group-admin',
      themeColor: '#e0f7fa', 
      isSoleAdmin: true      // Because they are the sole admin, they cannot leave
    },
    {
      name: 'Digital Artists Collab',
      description: 'Share your digital drawings, ask for feedback, and collaborate on big canvas projects together.',
      role: 'member',
      themeColor: '#f1f8e9', 
      isSoleAdmin: false
    },
    {
      name: 'Sci-Fi Writers',
      description: 'A place for aspiring sci-fi authors to share snippets, world-build, and critique each other\'s work.',
      role: 'group-admin',
      themeColor: '#e0f7fa', 
      isSoleAdmin: false      // Because they are the sole admin, they cannot leave
    },
    {
      name: 'Sci-Fi Writers',
      description: 'A place for aspiring sci-fi authors to share snippets, world-build, and critique each other\'s work.',
      role: 'group-admin',
      themeColor: '#e0f7fa', 
      isSoleAdmin: true      // Because they are the sole admin, they cannot leave
    },
    {
      name: 'Digital Artists Collab',
      description: 'Share your digital drawings, ask for feedback, and collaborate on big canvas projects together.',
      role: 'member',
      themeColor: '#f1f8e9', 
      isSoleAdmin: false
    },
    {
      name: 'Sci-Fi Writers',
      description: 'A place for aspiring sci-fi authors to share snippets, world-build, and critique each other\'s work.',
      role: 'group-admin',
      themeColor: '#e0f7fa', 
      isSoleAdmin: false      // Because they are the sole admin, they cannot leave
    },{
      name: 'Sci-Fi Writers',
      description: 'A place for aspiring sci-fi authors to share snippets, world-build, and critique each other\'s work.',
      role: 'group-admin',
      themeColor: '#e0f7fa', 
      isSoleAdmin: true      // Because they are the sole admin, they cannot leave
    },
    {
      name: 'Digital Artists Collab',
      description: 'Share your digital drawings, ask for feedback, and collaborate on big canvas projects together.',
      role: 'member',
      themeColor: '#f1f8e9', 
      isSoleAdmin: false
    },
    {
      name: 'Sci-Fi Writers',
      description: 'A place for aspiring sci-fi authors to share snippets, world-build, and critique each other\'s work.',
      role: 'group-admin',
      themeColor: '#e0f7fa', 
      isSoleAdmin: false      // Because they are the sole admin, they cannot leave
    },

  ];


  displayedGroups: any[] = [];
    searchQuery: string = '';
    roleFilter: string = 'All Roles';

    roleOptions = 
    [
        { label: 'All Roles', value: 'All Roles' },
        { label: 'Admin Only', value: 'group-admin' },
        { label: 'Member Only', value: 'member' }
    ];

    ngOnInit(): void
    {
        const user = this.authService.getUser();
        if(user)
        {
          this.currentUserRole = user.role;
          this.currentUsername = user.username;
        }
        this.displayedGroups = [...this.joinedGroups];
    }

    onLogout(): void
    {
      this.authService.logout();
    }

    applyFilters() {
        const lowerCaseQuery = this.searchQuery.toLowerCase().trim();

        this.displayedGroups = this.joinedGroups.filter(group => 
          {
            const matchesName = group.name.toLowerCase().includes(lowerCaseQuery);
            let matchesRole = true;
            if (this.roleFilter !== 'All Roles') {
                matchesRole = group.role === this.roleFilter;
            }
            return matchesName && matchesRole;
        });
    }
}
