import { Component, DestroyRef, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth';
import { GroupService } from '../services/group';
import { AccountService } from '../services/account';
import { SocketService } from '../services/socket';
import { DialogService } from '../services/dialog';
import { ToastService } from '../services/toast';
import { GroupRequest } from '../models/group-request';
import { AccountDeletionRequest } from '../models/account-deletion-request';
import { GroupBanRequest } from '../models/group-ban-request';
import { GroupDeletionRequest } from '../models/group-deletion-request';
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
    private toast: ToastService,
    private dialog: DialogService,
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
    this.loadGroupDeletionRequests();
    this.loadBannedEmails();
    this.listenForGroupRequestEvents();
    this.listenForAccountDeletionEvents();
    this.listenForGroupBanRequestEvents();
    this.listenForGroupDeletionEvents();
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

  groupDeletionRequests = signal<GroupDeletionRequest[]>([]);

  userBanRequests = signal<GroupBanRequest[]>([]);

  accountDeletionRequests = signal<AccountDeletionRequest[]>([]);
  bannedEmails = signal<BannedEmail[]>([]);

  readonly pendingTotal = computed(() =>
    this.groupCreationRequests().length +
    this.groupDeletionRequests().length +
    this.userBanRequests().length +
    this.accountDeletionRequests().length
  );

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

  loadGroupDeletionRequests(): void
  {
    this.groupService.getGroupDeletionRequests({ status: 'pending' }).subscribe({
      next: requests => this.groupDeletionRequests.set(requests),
      error: error => console.error('Failed to load group deletion requests:', error),
    });
  }

  listenForGroupDeletionEvents(): void
  {
    this.socketService.onGroupDeletionRequestCreated()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(request => {
        this.groupDeletionRequests.update(requests =>
          requests.some(item => item._id === request._id)
            ? requests
            : [request, ...requests]
        );
      });

    this.socketService.onGroupDeletionRequestResolved()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ requestId }) => {
        this.groupDeletionRequests.update(requests =>
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


  async rejectGroupCreationRequest(request: GroupRequest): Promise<void>
  {
    if (!request._id) {
      return;
    }

    const reason = await this.dialog.prompt('Enter a rejection reason:', { title: 'Reject request', confirmLabel: 'Reject', danger: true, placeholder: 'Reason...' });
    if (!reason) {
      return;
    }

    this.groupService.rejectRequest(request._id, reason).subscribe({
      next: response => {
        this.toast.fromResponse(response);
        if (response.ok) {
          this.loadGroupRequests();
        }
      },
      error: () => {
        this.toast.error('Failed to reject group request.');
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
        this.toast.fromResponse(response);
        if (response.ok) {
          this.loadGroupRequests();
        }
      },
      error: () => {
        this.toast.error('Failed to approve group request.');
      }
    });
  }

  acceptGroupDeletionRequest(request: GroupDeletionRequest): void
  {
    if (!request._id) {
      return;
    }

    this.groupService.approveGroupDeletionRequest(request._id, this.userName).subscribe({
      next: response => {
        this.toast.fromResponse(response);
        if (response.ok) {
          this.loadGroupDeletionRequests();
        }
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to approve group deletion request.');
      }
    });
  }

  async rejectGroupDeletionRequest(request: GroupDeletionRequest): Promise<void>
  {
    if (!request._id) {
      return;
    }

    const reason = await this.dialog.prompt('Enter a rejection reason:', { title: 'Reject request', confirmLabel: 'Reject', danger: true, placeholder: 'Reason...' });
    if (!reason) {
      return;
    }

    this.groupService.rejectGroupDeletionRequest(request._id, reason, this.userName).subscribe({
      next: response => {
        this.toast.fromResponse(response);
        if (response.ok) {
          this.loadGroupDeletionRequests();
        }
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to reject group deletion request.');
      }
    });
  }

  acceptAccountDeletionRequest(request: AccountDeletionRequest): void
  {
    if (!request._id) {
      return;
    }

    this.accountService.approveDeletion(request._id).subscribe({
      next: response => {
        this.toast.fromResponse(response);
        if (response.ok) {
          this.loadAccountDeletionRequests();
          this.loadBannedEmails();
        }
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to approve account deletion request.');
      }
    });
  }

  async rejectAccountDeletionRequest(request: AccountDeletionRequest): Promise<void>
  {
    if (!request._id) {
      return;
    }

    const reason = await this.dialog.prompt('Enter a rejection reason:', { title: 'Reject request', confirmLabel: 'Reject', danger: true, placeholder: 'Reason...' });
    if (!reason) {
      return;
    }

    this.accountService.rejectDeletion(request._id, reason).subscribe({
      next: response => {
        this.toast.fromResponse(response);
        if (response.ok) {
          this.loadAccountDeletionRequests();
        }
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to reject account deletion request.');
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
        this.toast.fromResponse(response);
        if (response.ok) {
          this.loadGroupBanRequests();
        }
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to approve ban request.');
      }
    });
  }

  async rejectUserBanRequest(request: GroupBanRequest): Promise<void>
  {
    if (!request._id) {
      return;
    }

    const reason = await this.dialog.prompt('Enter a rejection reason:', { title: 'Reject request', confirmLabel: 'Reject', danger: true, placeholder: 'Reason...' });
    if (!reason) {
      return;
    }

    this.groupService.rejectGroupBanRequest(request._id, reason).subscribe({
      next: response => {
        this.toast.fromResponse(response);
        if (response.ok) {
          this.loadGroupBanRequests();
        }
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to reject ban request.');
      }
    });
  }
}
