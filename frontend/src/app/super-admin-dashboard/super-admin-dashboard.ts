import { Component, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth';
import { GroupService } from '../services/group';
import { AccountService } from '../services/account';
import { SocketService } from '../services/socket';
import { GroupRequest } from '../models/group-request';
import { AccountDeletionRequest } from '../models/account-deletion-request';
import { GroupBanRequest } from '../models/group-ban-request';
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
    this.loadGroupBanRequests();
    this.loadBannedEmails();
    this.listenForGroupRequestEvents();
    this.listenForAccountDeletionEvents();
    this.listenForGroupBanRequestEvents();
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

  userBanRequests = signal<GroupBanRequest[]>([]);

  accountDeletionRequests = signal<AccountDeletionRequest[]>([]);
  bannedEmails = signal<BannedEmail[]>([]);

  loadAccountDeletionRequests(): void
  {
    this.accountService.getPendingDeletionRequests().subscribe({
      next: requests => this.accountDeletionRequests.set(requests),
      error: error => console.error('Failed to load account deletion requests:', error),
    });
  }

  loadGroupBanRequests(): void
  {
    this.groupService.getGroupBanRequests({ status: 'pending', destination: 'super-admin' }).subscribe({
      next: requests => this.userBanRequests.set(requests),
      error: error => console.error('Failed to load group ban requests:', error),
    });
  }

  listenForGroupBanRequestEvents(): void
  {
    this.socketService.onGroupBanRequestCreated()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(request => {
        if (request.destination !== 'super-admin') {
          return;
        }
        this.userBanRequests.update(requests =>
          requests.some(item => item._id === request._id)
            ? requests
            : [request, ...requests]
        );
      });

    this.socketService.onGroupBanRequestResolved()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ requestId, destination }) => {
        if (destination && destination !== 'super-admin') {
          return;
        }
        this.userBanRequests.update(requests =>
          requests.filter(request => request._id !== requestId)
        );
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

  acceptUserBanRequest(request: GroupBanRequest): void
  {
    if (!request._id) {
      return;
    }

    this.groupService.approveGroupBanRequest(request._id).subscribe({
      next: response => {
        alert(response.message);
        if (response.ok) {
          this.loadGroupBanRequests();
        }
      },
      error: (err) => {
        alert(err?.error?.message || 'Failed to approve ban request.');
      }
    });
  }

  rejectUserBanRequest(request: GroupBanRequest): void
  {
    if (!request._id) {
      return;
    }

    const reason = prompt('Enter a rejection reason:')?.trim();
    if (!reason) {
      return;
    }

    this.groupService.rejectGroupBanRequest(request._id, reason).subscribe({
      next: response => {
        alert(response.message);
        if (response.ok) {
          this.loadGroupBanRequests();
        }
      },
      error: (err) => {
        alert(err?.error?.message || 'Failed to reject ban request.');
      }
    });
  }
}
