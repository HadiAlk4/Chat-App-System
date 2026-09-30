import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth';
import { GroupService } from '../services/group';
import { SocketService } from '../services/socket';
import { JoinRequest } from '../models/join-request';
import { RoomRequest } from '../models/room-request';
import { Group } from '../models/group';
import { GroupBanRequest } from '../models/group-ban-request';
import { GroupRequest } from '../models/group-request';
import { GroupDeletionRequest } from '../models/group-deletion-request';

@Component({
  selector: 'app-request-history',
  imports: [DatePipe, RouterLink, FormsModule],
  templateUrl: './request-history.html',
  styleUrl: './request-history.css',
})
export class RequestHistory implements OnInit, OnDestroy {
  userRole: string = 'user';
  userName: string = '';

  pendingJoinRequests: JoinRequest[] = [];
  rejectedJoinRequests: JoinRequest[] = [];

  pendingGroupRequests: GroupRequest[] = [];
  rejectedGroupRequests: GroupRequest[] = [];

  pendingDeletionRequests: GroupDeletionRequest[] = [];
  rejectedDeletionRequests: GroupDeletionRequest[] = [];

  roomRequests: RoomRequest[] = [];
  pendingRoomRequests: RoomRequest[] = [];
  rejectedRoomRequests: RoomRequest[] = [];

  userJoinedGroups: Group[] = [];
  selectedGroupForRoom: string = '';
  newRoomNameInput: string = '';

  banRequests: GroupBanRequest[] = [];
  pendingBanRequests: GroupBanRequest[] = [];
  rejectedBanRequests: GroupBanRequest[] = [];
  selectedGroupForBan: string = '';
  banTargetUsername: string = '';

  private subs = new Subscription();

  constructor(
    private authService: AuthService,
    private groupService: GroupService,
    private socketService: SocketService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) {
      this.userName = user.username;
      this.userRole = user.role;
    }

    if (!this.userName) return;

    this.loadHistory();
    this.loadUserGroups();
    this.listenToSockets();
  }

  loadHistory(): void {
    this.groupService.getJoinRequests({ username: this.userName }).subscribe({
      next: (requests) => {
        this.pendingJoinRequests = requests.filter((r) => r.status === 'pending');
        this.rejectedJoinRequests = requests.filter((r) => r.status === 'rejected');
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load join requests:', err),
    });

    this.groupService.getGroupRequests({ creatorUserName: this.userName }).subscribe({
      next: (requests) => {
        this.pendingGroupRequests = requests.filter((r) => r.status === 'pending');
        this.rejectedGroupRequests = requests.filter((r) => r.status === 'rejected');
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load group proposals:', err),
    });

    this.groupService.getGroupDeletionRequests({ requestedBy: this.userName }).subscribe({
      next: (requests) => {
        this.pendingDeletionRequests = requests.filter((r) => r.status === 'pending');
        this.rejectedDeletionRequests = requests.filter((r) => r.status === 'rejected');
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load group deletion requests:', err),
    });

    this.groupService.getRoomRequests({ username: this.userName }).subscribe({
      next: (requests) => {
        this.roomRequests = requests;
        this.pendingRoomRequests = requests.filter((r) => r.status === 'pending');
        this.rejectedRoomRequests = requests.filter((r) => r.status === 'rejected');
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load room requests:', err),
    });

    this.groupService.getGroupBanRequests({ requestedBy: this.userName }).subscribe({
      next: (requests) => {
        this.banRequests = requests;
        this.pendingBanRequests = requests.filter((r) => r.status === 'pending');
        this.rejectedBanRequests = requests.filter((r) => r.status === 'rejected');
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load ban requests:', err),
    });
  }

  loadUserGroups(): void {
    this.groupService.getGroups().subscribe({
      next: (groups) => {
        this.userJoinedGroups = groups.filter(
          (g) => g.members?.includes(this.userName) || g.admins?.includes(this.userName)
        );
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load user groups:', err),
    });
  }

  get banCandidates(): string[] {
    const group = this.userJoinedGroups.find((g) => g.groupName === this.selectedGroupForBan);
    if (!group) return [];
    const admins = group.admins ?? [];
    return (group.members ?? []).filter((m) => !admins.includes(m) && m !== this.userName);
  }

  onBanGroupChange(): void {
    this.banTargetUsername = '';
  }

  submitBanRequest(): void {
    const targetUsername = this.banTargetUsername.trim();
    if (!this.selectedGroupForBan || !targetUsername) {
      alert('Please select a group and enter a username to ban.');
      return;
    }

    this.groupService
      .submitGroupBanRequest(this.selectedGroupForBan, targetUsername, this.userName)
      .subscribe({
        next: (res) => {
          alert(res.message);
          if (res.ok) {
            this.banTargetUsername = '';
            this.loadHistory();
          }
        },
        error: (err) => alert(err.error?.message || 'Failed to submit ban request.'),
      });
  }

  submitRoomProposal(): void {
    if (!this.selectedGroupForRoom || !this.newRoomNameInput.trim()) {
      alert('Please select a group and enter a room name.');
      return;
    }

    this.groupService
      .submitRoomRequest(this.selectedGroupForRoom, this.newRoomNameInput.trim(), this.userName)
      .subscribe({
        next: (res) => {
          alert(res.message);
          if (res.ok) {
            this.newRoomNameInput = '';
            this.loadHistory();
          }
        },
        error: (err) => alert(err.error?.message || 'Failed to submit room proposal.'),
      });
  }

  listenToSockets(): void {
    const refresh = () => this.loadHistory();

    this.subs.add(this.socketService.onJoinRequestCreated().subscribe(refresh));
    this.subs.add(
      this.socketService.onJoinRequestResolved().subscribe(() => {
        this.loadHistory();
        this.loadUserGroups();
      })
    );
    this.subs.add(this.socketService.onGroupRequestCreated().subscribe(refresh));
    this.subs.add(
      this.socketService.onGroupRequestResolved().subscribe(() => {
        this.loadHistory();
        this.loadUserGroups();
      })
    );
    this.subs.add(this.socketService.onRoomRequestCreated().subscribe(refresh));
    this.subs.add(this.socketService.onRoomRequestResolved().subscribe(refresh));
    this.subs.add(this.socketService.onGroupBanRequestCreated().subscribe(refresh));
    this.subs.add(this.socketService.onGroupBanRequestResolved().subscribe(refresh));
    this.subs.add(this.socketService.onGroupDeletionRequestCreated().subscribe(refresh));
    this.subs.add(
      this.socketService.onGroupDeletionRequestResolved().subscribe(() => {
        this.loadHistory();
        this.loadUserGroups();
      })
    );
  }

  statusBadge(status: string): string {
    if (status === 'approved') return 'success';
    if (status === 'rejected') return 'danger';
    return 'secondary';
  }

  onLogout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
