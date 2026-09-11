import { DatePipe } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth';
import { GroupService } from '../services/group';
import { SocketService } from '../services/socket';
import { JoinRequest } from '../models/join-request';
import { RoomRequest } from '../models/room-request';

@Component({
  selector: 'app-group-settings',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './group-settings.html',
  styleUrl: './group-settings.css',
})
export class GroupSettings implements OnInit, OnDestroy {
  userRole: string = 'group-admin';
  username: string = '';
  groupName: string = 'Sci-Fi Larpers';
  groupDescription: string = 'when ts not just intersteller and chess videos';
  groupMinAge: number = 10;
  groupThemeColor: string = 'Light';

  joinRequests: (JoinRequest & { rejectReason?: string; requestedOn?: string })[] = [];
  roomRequests: RoomRequest[] = [];

  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService,
    private groupService: GroupService,
    private socketService: SocketService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    
    const user = this.authService.getUser();
    if (user) {
      this.username = user.username;
      this.userRole = user.role;
    }

    
    const routeSub = this.route.queryParams.subscribe((params) => {
      if (params['groupName']) {
        this.groupName = params['groupName'];
      }
      this.loadJoinRequests();
      this.loadRoomRequests();
    });
    this.subscriptions.add(routeSub);

    this.listenToSockets();
  }

  loadJoinRequests(): void {
    this.groupService
      .getJoinRequests({ groupName: this.groupName, status: 'pending' })
      .subscribe({
        next: (requests) => {
          this.joinRequests = requests.map((req) => ({ ...req, rejectReason: '' }));
        },
        error: (err) => console.error('Failed to load join requests:', err),
      });
  }

  loadRoomRequests(): void {
    this.groupService
      .getRoomRequests({ groupName: this.groupName, status: 'pending' })
      .subscribe({
        next: (requests) => {
          this.roomRequests = requests.map((req) => ({ ...req, rejectReason: '' }));
        },
        error: (err) => console.error('Failed to load room requests:', err),
      });
  }

  listenToSockets(): void {
    const joinCreatedSub = this.socketService.onJoinRequestCreated().subscribe((request) => {
      if (request.groupName !== this.groupName) return;
      if (this.joinRequests.some((item) => item._id === request._id)) return;
      this.joinRequests.unshift({ ...request, rejectReason: '' });
    });

    const joinResolvedSub = this.socketService.onJoinRequestResolved().subscribe(({ requestId, groupName }) => {
      if (groupName !== this.groupName) return;
      this.joinRequests = this.joinRequests.filter((req) => req._id !== requestId);
    });

    const roomCreatedSub = this.socketService.onRoomRequestCreated().subscribe((request) => {
      if (request.groupName !== this.groupName) return;
      if (this.roomRequests.some((item) => item._id === request._id)) return;
      this.roomRequests.unshift({ ...request, rejectReason: '' });
    });

    const roomResolvedSub = this.socketService.onRoomRequestResolved().subscribe(({ requestId, groupName }) => {
      if (groupName !== this.groupName) return;
      this.roomRequests = this.roomRequests.filter((req) => req._id !== requestId);
    });

    this.subscriptions.add(joinCreatedSub);
    this.subscriptions.add(joinResolvedSub);
    this.subscriptions.add(roomCreatedSub);
    this.subscriptions.add(roomResolvedSub);
  }

  approveRequest(index: number): void {
    const request = this.joinRequests[index];
    if (!request?._id) return;

    this.groupService.approveJoinRequest(request._id).subscribe({
      next: (res) => {
        alert(res.message || 'Request approved');
        if (res.ok) this.loadJoinRequests();
      },
      error: () => alert('Failed to approve request.'),
    });
  }

  rejectRequest(index: number): void {
    const request = this.joinRequests[index];
    const reason = request?.rejectReason?.trim();
    if (!request?._id || !reason) {
      alert('A rejection reason is required');
      return;
    }

    this.groupService.rejectJoinRequest(request._id, reason).subscribe({
      next: (res) => {
        alert(res.message || 'Request rejected');
        if (res.ok) this.loadJoinRequests();
      },
      error: () => alert('Failed to reject request.'),
    });
  }

  approveRoomRequest(index: number): void {
    const request = this.roomRequests[index];
    if (!request?._id) return;

    this.groupService.approveRoomRequest(request._id).subscribe({
      next: (res) => {
        alert(res.message);
        if (res.ok) {
          if (!this.rooms.includes(request.roomName)) {
            this.rooms.push(request.roomName);
          }
          this.loadRoomRequests();
        }
      },
      error: () => alert('Failed to approve room proposal.'),
    });
  }

  rejectRoomRequest(index: number): void {
    const request = this.roomRequests[index];
    const reason = request?.rejectReason?.trim();
    if (!request?._id || !reason) {
      alert('A rejection reason is required');
      return;
    }

    this.groupService.rejectRoomRequest(request._id, reason).subscribe({
      next: (res) => {
        alert(res.message);
        if (res.ok) this.loadRoomRequests();
      },
      error: () => alert('Failed to reject room proposal.'),
    });
  }

  onLogout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  rooms: string[] = ['announcements', 'general-chat', 'wednesday larps'];
  allowedMembers = [
    { username: 'DaveAcs', role: 'user' },
    { username: 'Yo', role: 'user' },
  ];
  bannedMembers = [{ username: 'Tough Mudder' }, { username: 'JFofh' }];

  addRoom(): void {
    const roomName = prompt('Enter New Room Name: ');
    if (roomName) this.rooms.push(roomName);
  }

  editRoom(index: number): void {
    const newName = prompt('Edit Room Name: ', this.rooms[index]);
    if (newName) this.rooms[index] = newName;
  }

  deleteRoom(index: number): void {
    if (confirm(`Are you sure you want to delete #${this.rooms[index]}?`)) {
      this.rooms.splice(index, 1);
    }
  }

  promoteToGA(index: number): void {
    this.allowedMembers[index].role = 'group-admin';
  }

  banMember(index: number): void {
    const user = this.allowedMembers[index];
    this.bannedMembers.push({ username: user.username });
    this.allowedMembers.splice(index, 1);
  }

  unBanMember(index: number): void {
    const user = this.bannedMembers[index];
    this.allowedMembers.push({ username: user.username, role: 'user' });
    this.bannedMembers.splice(index, 1);
  }

  stepDownAsGA(): void {
    if (confirm('Are you sure you want to step down as Group Admin?')) {
      alert('You have stepped down.');
    }
  }

  requestGroupDeletion(): void {
    const reason = prompt('Please enter a reason for the Super Admin:');
    if (reason) alert('Deletion request submitted to Super Admin.');
  }
}