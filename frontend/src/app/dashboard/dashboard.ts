import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth';
import { HttpClient } from '@angular/common/http';

const API_URL = 'http://localhost:3000/api';

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


  availableGroups: any[] = [];
  displayedGroups: any[] = [];
  searchQuery: string = '';

  newGroupName: string = '';
  newGroupDescription: string = '';
  newGroupTheme: string = 'light';
  newGroupMinAge: number = 18;

  constructor(private authService: AuthService, private http: HttpClient) {}


  ngOnInit(): void
  {
    const user = this.authService.getUser();
    if(user)
    {
      this.userRole = user.role;
      this.username = user.username;
    } 
    this.fetchGroups();
  }

  fetchGroups(): void
  {
    this.http.get<any[]>(`${API_URL}/groups`).subscribe(
      (groups) => {
        this.availableGroups = groups.map((group) => ({
          ...group,
          name: group.groupName ?? group.name,
          description: group.groupDescription ?? group.description,
        }));
        this.displayedGroups = [...this.availableGroups];
      },
      (error) => {
        console.error('Error fetching groups:', error);
      }
    );
  }

  proposeGroup(): void
  {
    if (!this.newGroupName.trim()) {
      alert('Group name is required.');
      return;
    }

    const payload = {
      groupName: this.newGroupName,
      groupDescription: this.newGroupDescription,
      themeColor: this.newGroupTheme,
      minAge: this.newGroupMinAge,
      creatorUserName: this.username,
    };

    this.http.post<any>(`${API_URL}/groups`, payload).subscribe({
      next: (res) => {
        if (res.ok) {
          alert('Group created successfully!');
          this.fetchGroups();
          // Reset form fields
          this.newGroupName = '';
          this.newGroupDescription = '';
          this.newGroupTheme = 'light';
          this.newGroupMinAge = 18;
        } else {
          alert(res.message || 'Error creating group');
        }
      },
      error: () => alert('Failed to connect to backend.')
    });
  }

  applySearch() 
  {
    if (!this.searchQuery.trim()) 
    {
      this.displayedGroups = [...this.availableGroups];
      return;
    }
    const lowerCaseQuery = this.searchQuery.trim().toLowerCase();
    this.displayedGroups = this.availableGroups.filter(group => 
      (group.name ?? '').toLowerCase().includes(lowerCaseQuery)
    );
  }
  onLogout(): void
  {
    this.authService.logout();
  } 
}
