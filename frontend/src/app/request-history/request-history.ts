import { DatePipe } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
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

  pendingRoomRequests: RoomRequest[] = [];
  rejectedRoomRequests: RoomRequest[] = [];

  userJoinedGroups: Group[] = [];
  selectedGroupForRoom: string = '';
  newRoomNameInput: string = '';

  pendingBanRequests: GroupBanRequest[] = [];
  rejectedBanRequests: GroupBanRequest[] = [];
  selectedGroupForBan: string = '';
  banTargetUsername: string = '';

  private subs = new Subscription();

  constructor(
    private authService: AuthService,
    private groupService: GroupService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) {
      this.userName = user.username;
      this.userRole = user.role;
    }

    this.loadHistory();
    this.loadUserGroups();
    this.listenToSockets();
  }

  loadHistory(): void {
    this.groupService.getJoinRequests({ username: this.userName }).subscribe({
      next: (requests) => {
        this.pendingJoinRequests = requests.filter((r) => r.status === 'pending');
        this.rejectedJoinRequests = requests.filter((r) => r.status === 'rejected');
      },
      error: (err) => console.error('Failed to load join requests:', err),
    });

    this.groupService.getRoomRequests({ username: this.userName }).subscribe({
      next: (requests) => {
        this.pendingRoomRequests = requests.filter((r) => r.status === 'pending');
        this.rejectedRoomRequests = requests.filter((r) => r.status === 'rejected');
      },
      error: (err) => console.error('Failed to load room requests:', err),
    });

    this.groupService.getGroupBanRequests({ requestedBy: this.userName }).subscribe({
      next: (requests) => {
        this.pendingBanRequests = requests.filter((r) => r.status === 'pending');
        this.rejectedBanRequests = requests.filter((r) => r.status === 'rejected');
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
      },
      error: (err) => console.error('Failed to load user groups:', err),
    });
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
        error: () => alert('Failed to submit room proposal.'),
      });
  }

  listenToSockets(): void {
    const resolvedJoin = this.socketService.onJoinRequestResolved().subscribe(() => {
      this.loadHistory();
      this.loadUserGroups();
    });

    const resolvedRoom = this.socketService.onRoomRequestResolved().subscribe(() => {
      this.loadHistory();
    });

    const banCreated = this.socketService.onGroupBanRequestCreated().subscribe(() => {
      this.loadHistory();
    });

    const banResolved = this.socketService.onGroupBanRequestResolved().subscribe(() => {
      this.loadHistory();
    });

    this.subs.add(resolvedJoin);
    this.subs.add(resolvedRoom);
    this.subs.add(banCreated);
    this.subs.add(banResolved);
  }

  onLogout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
