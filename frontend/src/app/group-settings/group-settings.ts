import { DatePipe } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  originalGroupName: string = '';
  groupName: string = 'Sci-Fi Larpers';
  groupDescription: string = 'when ts not just intersteller and chess videos';
  groupMinAge: number = 10;
  groupThemeColor: 'light' | 'dark' = 'light';

  joinRequests: (JoinRequest & { rejectReason?: string; requestedOn?: string })[] = [];
  roomRequests: RoomRequest[] = [];

  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService,
    private groupService: GroupService,
    private socketService: SocketService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    
    const user = this.authService.getUser();
    if (user) {
      this.username = user.username;
      this.userRole = user.role;
    }

    
    const routeSub = this.route.queryParams.subscribe((params) => {
      if (params['groupName']) {
        this.originalGroupName = params['groupName'];
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
    const groupKey = this.originalGroupName || this.groupName;
    if (!groupKey) return;

    this.groupService.getGroupByName(groupKey).subscribe({
      next: (res) => {
        if (!res.ok || !res.group) return;
        this.applyGroup(res.group);
      },
      error: (err) => console.error('Failed to load group:', err),
    });
  }

  private applyGroup(group: {
    groupName: string;
    groupDescription: string;
    minAge: number;
    themeColor: 'light' | 'dark';
    rooms?: string[];
    admins?: string[];
    members?: string[];
    bannedMembers?: string[];
  }): void {
    this.originalGroupName = group.groupName;
    this.groupName = group.groupName;
    this.groupDescription = group.groupDescription;
    this.groupMinAge = group.minAge;
    this.groupThemeColor = group.themeColor === 'dark' ? 'dark' : 'light';
    this.rooms = group.rooms ?? [];
    this.allowedMembers = this.buildAllowedMembers(group);
    this.bannedMembers = (group.bannedMembers ?? []).map((username) => ({ username }));
  }

  saveChanges(): void {
    const groupName = this.groupName.trim();
    const groupDescription = this.groupDescription.trim();
    if (!groupName || !groupDescription) {
      alert('Group name and description are required');
      return;
    }
    if (groupDescription.length > 250) {
      alert('Group description must be 250 characters or fewer');
      return;
    }

    const previousName = this.originalGroupName || this.groupName;
    this.groupService
      .updateGroup(previousName, {
        groupName,
        groupDescription,
        minAge: Number(this.groupMinAge),
        themeColor: this.groupThemeColor,
      })
      .subscribe({
        next: (res) => {
          if (!res.ok || !res.group) {
            alert(res.message || 'Failed to save group settings.');
            return;
          }
          this.applyGroup(res.group);
          if (res.group.groupName !== previousName) {
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { groupName: res.group.groupName },
              queryParamsHandling: 'merge',
            });
          }
          alert(res.message || 'Group settings saved');
        },
        error: (err) => alert(err.error?.message || 'Failed to save group settings.'),
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
      .getJoinRequests({ groupName: this.originalGroupName || this.groupName, status: 'pending' })
      .subscribe({
        next: (requests) => {
          this.joinRequests = requests.map((req) => ({ ...req, rejectReason: '' }));
        },
        error: (err) => console.error('Failed to load join requests:', err),
      });
  }

  loadRoomRequests(): void {
    this.groupService
      .getRoomRequests({ groupName: this.originalGroupName || this.groupName, status: 'pending' })
      .subscribe({
        next: (requests) => {
          this.roomRequests = requests.map((req) => ({ ...req, rejectReason: '' }));
        },
        error: (err) => console.error('Failed to load room requests:', err),
      });
  }

  listenToSockets(): void {
    const joinCreatedSub = this.socketService.onJoinRequestCreated().subscribe((request) => {
      if (request.groupName !== (this.originalGroupName || this.groupName)) return;
      if (this.joinRequests.some((item) => item._id === request._id)) return;
      this.joinRequests.unshift({ ...request, rejectReason: '' });
    });

    const joinResolvedSub = this.socketService.onJoinRequestResolved().subscribe(({ requestId, groupName }) => {
      if (groupName !== (this.originalGroupName || this.groupName)) return;
      this.joinRequests = this.joinRequests.filter((req) => req._id !== requestId);
      this.loadGroup();
    });

    const roomCreatedSub = this.socketService.onRoomRequestCreated().subscribe((request) => {
      if (request.groupName !== (this.originalGroupName || this.groupName)) return;
      if (this.roomRequests.some((item) => item._id === request._id)) return;
      this.roomRequests.unshift({ ...request, rejectReason: '' });
    });

    const roomResolvedSub = this.socketService.onRoomRequestResolved().subscribe(({ requestId, groupName }) => {
      if (groupName !== (this.originalGroupName || this.groupName)) return;
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

    this.groupService.addRoomDirect(this.originalGroupName || this.groupName, roomName).subscribe({
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

    this.groupService.renameRoom(this.originalGroupName || this.groupName, oldName, newName).subscribe({
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

    this.groupService.deleteRoom(this.originalGroupName || this.groupName, roomName).subscribe({
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

    this.groupService.promoteMember(this.originalGroupName || this.groupName, member.username).subscribe({
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
    if (user.username === this.username) return;
    if (!confirm(`Permanently ban ${user.username} from this group?`)) return;

    this.groupService.banMember(this.originalGroupName || this.groupName, user.username).subscribe({
      next: (res) => {
        if (res.ok) {
          this.allowedMembers = this.buildAllowedMembers({
            members: res.members,
            admins: res.admins,
          });
          this.bannedMembers = (res.bannedMembers ?? []).map((username) => ({ username }));
        } else {
          alert(res.message || 'Failed to ban member.');
        }
      },
      error: (err) => alert(err.error?.message || 'Failed to ban member.'),
    });
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