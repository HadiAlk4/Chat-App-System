import { Component, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth';
import { GroupService } from '../services/group';
import { AccountService } from '../services/account';
import { SocketService } from '../services/socket';
import { GroupRequest } from '../models/group-request';
import { AccountDeletionRequest } from '../models/account-deletion-request';
import { BannedEmail } from '../models/banned-email';

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
    private groupService: GroupService,
    private accountService: AccountService,
    private socketService: SocketService,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void
  {
    const user = this.authService.getUser();
    if(user)
    {
      this.userName = user.username;
    }
    this.loadGroupRequests();
    this.loadAccountDeletionRequests();
    this.loadBannedEmails();
    this.listenForGroupRequestEvents();
    this.listenForAccountDeletionEvents();
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

  listenForGroupRequestEvents(): void
  {
    this.socketService.onGroupRequestCreated()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(request => {
        this.groupCreationRequests.update(requests =>
          requests.some(item => item._id === request._id)
            ? requests
            : [request, ...requests]
        );
      });

    this.socketService.onGroupRequestResolved()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ requestId }) => {
        this.groupCreationRequests.update(requests =>
          requests.filter(request => request._id !== requestId)
        );
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

  accountDeletionRequests = signal<AccountDeletionRequest[]>([]);
  bannedEmails = signal<BannedEmail[]>([]);

  loadAccountDeletionRequests(): void
  {
    this.accountService.getPendingDeletionRequests().subscribe({
      next: requests => this.accountDeletionRequests.set(requests),
      error: error => console.error('Failed to load account deletion requests:', error),
    });
  }

  loadBannedEmails(): void
  {
    this.accountService.getBannedEmails().subscribe({
      next: emails => this.bannedEmails.set(emails),
      error: error => console.error('Failed to load banned emails:', error),
    });
  }

  listenForAccountDeletionEvents(): void
  {
    this.socketService.onAccountDeletionRequestCreated()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(request => {
        this.accountDeletionRequests.update(requests =>
          requests.some(item => item._id === request._id)
            ? requests
            : [request, ...requests]
        );
      });

    this.socketService.onAccountDeletionRequestResolved()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ requestId }) => {
        this.accountDeletionRequests.update(requests =>
          requests.filter(request => request._id !== requestId)
        );
        this.loadBannedEmails();
      });
  }


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

  acceptAccountDeletionRequest(request: AccountDeletionRequest): void
  {
    if (!request._id) {
      return;
    }

    this.accountService.approveDeletion(request._id).subscribe({
      next: response => {
        alert(response.message);
        if (response.ok) {
          this.loadAccountDeletionRequests();
          this.loadBannedEmails();
        }
      },
      error: (err) => {
        alert(err?.error?.message || 'Failed to approve account deletion request.');
      }
    });
  }

  rejectAccountDeletionRequest(request: AccountDeletionRequest): void
  {
    if (!request._id) {
      return;
    }

    const reason = prompt('Enter a rejection reason:')?.trim();
    if (!reason) {
      return;
    }

    this.accountService.rejectDeletion(request._id, reason).subscribe({
      next: response => {
        alert(response.message);
        if (response.ok) {
          this.loadAccountDeletionRequests();
        }
      },
      error: (err) => {
        alert(err?.error?.message || 'Failed to reject account deletion request.');
      }
    });
  }

  acceptUserBanRequest(index: number): void
  {
    this.userBanRequest.splice(index, 1);
  }
}
