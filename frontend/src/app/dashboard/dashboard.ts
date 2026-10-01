import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth';
import { GroupService } from '../services/group';
import { PendingRequestsService } from '../services/pending-requests';
import { SocketService } from '../services/socket';
import { ToastService } from '../services/toast';
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
  readonly displayedGroups = signal<Group[]>([]);
  searchQuery: string = '';

  newGroup: Group = {
    groupName: '',
    groupDescription: '',
    minAge: 18,
    themeColor: 'light'
  };

  private readonly pendingRequests = inject(PendingRequestsService);
  readonly pendingCount = this.pendingRequests.pendingCount;

  constructor(
    private authService: AuthService,
    private groupService: GroupService,
    private toast: ToastService,
    private socketService: SocketService,
    private destroyRef: DestroyRef
  ) {}


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
    this.pendingRequests.track(this.username, this.destroyRef);
    this.socketService
      .onGroupRequestResolved()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadGroups());
  }

  loadGroups(): void
  {
    this.groupService.getGroups().subscribe({
      next: (groups) => {
        this.availableGroups = this.userRole === 'super-admin'
          ? groups
          : groups.filter(group => !this.isInGroup(group));
        this.applySearch();
      },
      error: (error) => {
        console.error('Error loading groups:', error);
      }
    });
  }

  private isInGroup(group: Group): boolean {
    return Boolean(group.members?.includes(this.username) || group.admins?.includes(this.username));
  }

  proposeGroup(): void {
    if (!this.newGroup.groupName.trim()) {
      this.toast.error('Group name is required.');
      return;
    }

    this.groupService
      .submitProposal(this.newGroup, this.username, this.email)
      .subscribe({
        next: response => {
          this.toast.fromResponse(response);

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
          this.toast.error('Cannot connect to backend server.');
        }
      });
  }

  applySearch(): void {
    const query = this.searchQuery.trim().toLowerCase();
  
    if (!query) {
      this.displayedGroups.set([...this.availableGroups]);
      return;
    }
  
    this.displayedGroups.set(this.availableGroups.filter(group =>
      group.groupName.toLowerCase().includes(query)
    ));
  }

  requestToJoin(group: Group): void {
    this.groupService.submitJoinRequest(group.groupName, this.username).subscribe({
      next: response => this.toast.fromResponse(response),
      error: (err) => this.toast.error(err.error?.message || 'Cannot connect to backend server.')
    });
  }
  
  onLogout(): void
  {
    this.authService.logout();
  } 


}
