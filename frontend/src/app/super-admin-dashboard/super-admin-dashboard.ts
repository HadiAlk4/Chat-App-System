import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth';
import { GroupService } from '../services/group';
import { GroupRequest } from '../models/group-request';

@Component({
  imports: [RouterLink],
  selector: 'app-super-admin-dashboard',
  styleUrl: './super-admin-dashboard.css',
  templateUrl: './super-admin-dashboard.html',
})
export class SuperAdminDashboard 
{
  userName: string = 'Super_mAllen'
  userRole: string = 'super-admin';

  constructor(
    private authService: AuthService,
    private groupService: GroupService
  ) {}

  ngOnInit(): void
  {
    const user = this.authService.getUser();
    if(user)
    {
      this.userName = user.username;
    }
    this.loadGroupRequests();
  }

  onLogout(): void
  {
    this.authService.logout();
  }

  groupCreationRequests = signal<GroupRequest[]>([]);

  loadGroupRequests(): void
  {
    this.groupService.getPendingRequests().subscribe({
      next: requests => {
        this.groupCreationRequests.set(requests);
      },
      error: error => {
        console.error('Failed to load group requests:', error);
      }
    });
  }

  groupDeletionRequests = 
  [
    {
    groupDeletionRequestName: 'sm ts idk name gg',
    groupDeletionRequestByUser: ' sm user',
    groupDeletionRequestByUserRole: 'sm role'

    },
    {
    groupDeletionRequestName: 'sm ts idk name hhh',
    groupDeletionRequestByUser: ' sm user',
    groupDeletionRequestByUserRole: 'sm role'

    },
    {
    groupDeletionRequestName: 'sm ts idk nameeeee',
    groupDeletionRequestByUser: ' sm user',
    groupDeletionRequestByUserRole: 'sm role'
    },
  ]

  userBanRequest = 
  [
    {
      userBanRequestUsername: 'sm banned name',
      userBanRequestEmail: 'ban@ban.ban',
      userBanRequestRole: 'sm banned role',
      userBanRequestByUser: 'sm  name',
      userBanRequestByUserRole: 'sm  role',
    },
  ]


  permaBannedEmails: string[] = 
  [
    'ban@ban.ban', 'ban@ban.ban', 'ban@ban.ban'
  ]


  rejectGroupCreationRequest(request: GroupRequest): void
  {
    if (!request._id) {
      return;
    }

    const reason = prompt('Enter a rejection reason:')?.trim();
    if (!reason) {
      return;
    }

    this.groupService.rejectRequest(request._id, reason).subscribe({
      next: response => {
        alert(response.message);
        if (response.ok) {
          this.loadGroupRequests();
        }
      },
      error: () => {
        alert('Failed to reject group request.');
      }
    });
  }

  acceptGroupCreationRequest(request: GroupRequest): void
  {
    if (!request._id) {
      return;
    }

    this.groupService.approveRequest(request._id).subscribe({
      next: response => {
        alert(response.message);
        if (response.ok) {
          this.loadGroupRequests();
        }
      },
      error: () => {
        alert('Failed to approve group request.');
      }
    });
  }

  acceptGroupDeletionRequest(index: number): void
  {
    this.groupDeletionRequests.splice(index, 1);
  }

  acceptUserBanRequest(index: number): void
  {
    this.userBanRequest.splice(index, 1);
  }
}
