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
      this.loadGroup();
      this.loadJoinRequests();
      this.loadRoomRequests();
    });
    this.subscriptions.add(routeSub);

    this.listenToSockets();
  }

  loadGroup(): void {
    if (!this.groupName) return;

    this.groupService.getGroupByName(this.groupName).subscribe({
      next: (res) => {
        if (!res.ok || !res.group) return;
        const group = res.group;
        this.groupName = group.groupName;
        this.groupDescription = group.groupDescription;
        this.groupMinAge = group.minAge;
        this.groupThemeColor = group.themeColor;
        this.rooms = group.rooms ?? [];
        this.allowedMembers = this.buildAllowedMembers(group);
      },
      error: (err) => console.error('Failed to load group:', err),
    });
  }

  private buildAllowedMembers(group: { admins?: string[]; members?: string[] }) {
    const admins = group.admins ?? [];
    const members = group.members ?? [];
    const usernames = [...new Set([...admins, ...members])];
    return usernames.map((username) => ({
      username,
      role: admins.includes(username) ? 'group-admin' : 'user',
    }));
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
      this.loadGroup();
    });

    const roomCreatedSub = this.socketService.onRoomRequestCreated().subscribe((request) => {
      if (request.groupName !== this.groupName) return;
      if (this.roomRequests.some((item) => item._id === request._id)) return;
      this.roomRequests.unshift({ ...request, rejectReason: '' });
    });

    const roomResolvedSub = this.socketService.onRoomRequestResolved().subscribe(({ requestId, groupName }) => {
      if (groupName !== this.groupName) return;
      this.roomRequests = this.roomRequests.filter((req) => req._id !== requestId);
      this.loadGroup();
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
        if (res.ok) {
          this.loadJoinRequests();
          this.loadGroup();
        }
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
          this.loadGroup();
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

  rooms: string[] = [];
  allowedMembers: { username: string; role: string }[] = [];
  bannedMembers: { username: string }[] = [];

  addRoom(): void {
    const roomName = prompt('Enter New Room Name: ')?.trim();
    if (!roomName) return;

    this.groupService.addRoomDirect(this.groupName, roomName).subscribe({
      next: (res) => {
        if (res.ok) this.rooms = res.rooms;
        else alert(res.message || 'Failed to add room.');
      },
      error: (err) => alert(err.error?.message || 'Failed to add room.'),
    });
  }

  editRoom(index: number): void {
    const oldName = this.rooms[index];
    const newName = prompt('Edit Room Name: ', oldName)?.trim();
    if (!newName || newName === oldName) return;

    this.groupService.renameRoom(this.groupName, oldName, newName).subscribe({
      next: (res) => {
        if (res.ok) this.rooms = res.rooms;
        else alert(res.message || 'Failed to rename room.');
      },
      error: (err) => alert(err.error?.message || 'Failed to rename room.'),
    });
  }

  deleteRoom(index: number): void {
    const roomName = this.rooms[index];
    if (!confirm(`Are you sure you want to delete #${roomName}?`)) return;

    this.groupService.deleteRoom(this.groupName, roomName).subscribe({
      next: (res) => {
        if (res.ok) this.rooms = res.rooms;
        else alert(res.message || 'Failed to delete room.');
      },
      error: (err) => alert(err.error?.message || 'Failed to delete room.'),
    });
  }

  promoteToGA(index: number): void {
    const member = this.allowedMembers[index];
    if (!member || member.role === 'group-admin') return;

    this.groupService.promoteMember(this.groupName, member.username).subscribe({
      next: (res) => {
        if (res.ok) {
          this.allowedMembers[index].role = 'group-admin';
        } else {
          alert(res.message || 'Failed to promote member.');
        }
      },
      error: (err) => alert(err.error?.message || 'Failed to promote member.'),
    });
  }

  banMember(index: number): void {
    const user = this.allowedMembers[index];
    if (!user) return;
    if (!confirm(`Remove ${user.username} from this group?`)) return;

    this.groupService.removeMember(this.groupName, user.username).subscribe({
      next: (res) => {
        if (res.ok) {
          this.allowedMembers.splice(index, 1);
        } else {
          alert(res.message || 'Failed to remove member.');
        }
      },
      error: (err) => alert(err.error?.message || 'Failed to remove member.'),
    });
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