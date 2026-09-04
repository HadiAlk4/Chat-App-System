import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth';
import { GroupService } from '../services/group';
import { Group } from '../models/group';


@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit
{

  userRole: string = '';
  username: string = '';


  email: string = '';

  availableGroups: Group[] = [];
  displayedGroups: Group[] = [];
  searchQuery: string = '';

  newGroup: Group = {
    groupName: '',
    groupDescription: '',
    minAge: 18,
    themeColor: 'light'
  };

  constructor(private authService: AuthService, private groupService: GroupService) {}


  ngOnInit(): void
  {
    const user = this.authService.getUser();
    if(user)
    {
      this.userRole = user.role;
      this.username = user.username;
      this.email = user.email;
    } 
    this.loadGroups();
  }

  loadGroups(): void
  {
    this.groupService.getGroups().subscribe({
      next: (groups) => {
        this.availableGroups = groups;
        this.applySearch();
      },
      error: (error) => {
        console.error('Error loading groups:', error);
      }
    });
  }

  proposeGroup(): void {
    if (!this.newGroup.groupName.trim()) {
      alert('Group name is required.');
      return;
    }

    this.groupService
      .submitProposal(this.newGroup, this.username, this.email)
      .subscribe({
        next: response => {
          alert(response.message);

          if (response.ok) {
            this.newGroup = {
              groupName: '',
              groupDescription: '',
              minAge: 18,
              themeColor: 'light'
            };
          }
        },
        error: () => {
          alert('Cannot connect to backend server.');
        }
      });
  }

  applySearch(): void {
    const query = this.searchQuery.trim().toLowerCase();
  
    if (!query) {
      this.displayedGroups = [...this.availableGroups];
      return;
    }
  
    this.displayedGroups = this.availableGroups.filter(group =>
      group.groupName.toLowerCase().includes(query)
    );
  }
  onLogout(): void
  {
    this.authService.logout();
  } 
}
