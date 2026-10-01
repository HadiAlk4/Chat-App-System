import { Component, DestroyRef, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../services/auth';
import { DialogService } from '../services/dialog';
import { GroupService } from '../services/group';
import { SocketService } from '../services/socket';
import { ToastService } from '../services/toast';
import { Group } from '../models/group';

@Component({
  selector: 'app-my-memberships',
  imports: [RouterLink, FormsModule],
  templateUrl: './my-memberships.html',
  styleUrl: './my-memberships.css',
})
export class MyMemberships implements OnInit
{
  currentUserRole: string = '';
  currentUsername: string = '';
  joinedGroups: Group[] = [];
  readonly displayedGroups = signal<Group[]>([]);
  searchQuery: string = '';
  roleFilter: string = 'All Roles';

  roleOptions =
  [
      { label: 'All Roles', value: 'All Roles' },
      { label: 'Admin Only', value: 'group-admin' },
      { label: 'Member Only', value: 'member' }
  ];

  constructor(
    private authService: AuthService,
    private groupService: GroupService,
    private toast: ToastService,
    private dialog: DialogService,
    private socketService: SocketService,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void
  {
      const user = this.authService.getUser();
      if(user)
      {
        this.currentUserRole = user.role;
        this.currentUsername = user.username;
      }
      this.loadMemberships();
      this.socketService
        .onJoinRequestResolved()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.loadMemberships());
      this.socketService
        .onGroupRequestResolved()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.loadMemberships());
  }

  loadMemberships(): void
  {
      if (!this.currentUsername) {
        this.joinedGroups = [];
        this.displayedGroups.set([]);
        return;
      }

      this.groupService.getUserMemberships(this.currentUsername).subscribe({
        next: (groups) => {
          this.joinedGroups = groups;
          this.applyFilters();
        },
        error: (err) => {
          console.error('Failed to load memberships:', err);
          this.joinedGroups = [];
          this.displayedGroups.set([]);
        }
      });
  }

  isUserAdmin(group: Group): boolean
  {
      return group.admins?.includes(this.currentUsername) ?? false;
  }

  isSoleAdmin(group: Group): boolean
  {
      return group.admins?.length === 1 && group.admins[0] === this.currentUsername;
  }

  async leaveGroup(group: Group): Promise<void>
  {
      if (this.isSoleAdmin(group)) {
        this.toast.error('Cannot leave group as sole admin');
        return;
      }

      const confirmed = await this.dialog.confirm(
        `Are you sure you want to leave ${group.groupName}? This cannot be undone.`,
        { title: 'Leave group', confirmLabel: 'Leave' }
      );
      if (!confirmed) {
        return;
      }

      this.groupService.leaveGroup(group.groupName, this.currentUsername).subscribe({
        next: (response) => {
          this.toast.fromResponse(response);
          if (response.ok) {
            this.loadMemberships();
          }
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Failed to leave group');
        }
      });
  }

  onLogout(): void
  {
    this.authService.logout();
  }

  applyFilters() {
      const lowerCaseQuery = this.searchQuery.toLowerCase().trim();

      this.displayedGroups.set(this.joinedGroups.filter(group =>
        {
          const matchesName = group.groupName.toLowerCase().includes(lowerCaseQuery);
          let matchesRole = true;
          if (this.roleFilter !== 'All Roles') {
              const isAdmin = this.isUserAdmin(group);
              matchesRole = this.roleFilter === 'group-admin' ? isAdmin : !isAdmin;
          }
          return matchesName && matchesRole;
      }));
  }
}
