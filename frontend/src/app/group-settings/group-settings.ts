import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth';
import { GroupService } from '../services/group';
import { SocketService } from '../services/socket';
import { DialogService } from '../services/dialog';
import { ToastService } from '../services/toast';
import { JoinRequest } from '../models/join-request';
import { RoomRequest } from '../models/room-request';
import { GroupBanRequest } from '../models/group-ban-request';

@Component({
  selector: 'app-group-settings',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './group-settings.html',
  styleUrl: './group-settings.css',
})
export class GroupSettings implements OnInit, OnDestroy {
  userRole: string = '';
  username: string = '';
  originalGroupName: string = '';
  groupName: string = '';
  groupDescription: string = '';
  groupMinAge: number = 18;
  groupThemeColor: 'light' | 'dark' = 'light';
  savedName = '';
  savedDescription = '';
  savedMinAge = 18;
  savedTheme: 'light' | 'dark' = 'light';
  confirmOpen = false;
  pendingChanges: string[] = [];
  ageWillRemoveMembers = false;

  joinRequests: (JoinRequest & { rejectReason?: string; requestedOn?: string })[] = [];
  roomRequests: RoomRequest[] = [];
  banRequests: (GroupBanRequest & { rejectReason?: string })[] = [];

  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService,
    private groupService: GroupService,
    private socketService: SocketService,
    private toast: ToastService,
    private dialog: DialogService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    
    const user = this.authService.getUser();
    if (user) {
      this.username = user.username;
      this.userRole = user.role;
    }

    
    const routeSub = this.route.queryParams.subscribe((params) => {
      if (!params['groupName']) {
        this.leaveSettings();
        return;
      }
      this.originalGroupName = params['groupName'];
      this.groupName = params['groupName'];
      this.loadGroup();
      this.loadJoinRequests();
      this.loadRoomRequests();
      this.loadBanRequests();
    });
    this.subscriptions.add(routeSub);

    this.listenToSockets();
  }

  loadGroup(): void {
    const groupKey = this.originalGroupName || this.groupName;
    if (!groupKey) return;

    this.groupService.getGroupByName(groupKey).subscribe({
      next: (res) => {
        if (!res.ok || !res.group) {
          this.leaveSettings();
          return;
        }
        if (!res.group.admins?.includes(this.username)) {
          this.leaveSettings();
          return;
        }
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
    this.savedName = this.groupName;
    this.savedDescription = this.groupDescription;
    this.savedMinAge = Number(this.groupMinAge);
    this.savedTheme = this.groupThemeColor;
    this.cdr.markForCheck();
  }

  private leaveSettings(): void {
    if (this.userRole === 'super-admin') {
      this.router.navigateByUrl('/super-admin-dashboard');
      return;
    }
    this.router.navigateByUrl('/my-memberships');
  }

  saveChanges(): void {
    const groupName = this.groupName.trim();
    const groupDescription = this.groupDescription.trim();
    if (!groupName || !groupDescription) {
      this.toast.error('Group name and description are required');
      return;
    }
    if (groupDescription.length > 250) {
      this.toast.error('Group description must be 250 characters or fewer');
      return;
    }

    const nextAge = Number(this.groupMinAge);
    const changes: string[] = [];
    if (groupName !== this.savedName) {
      changes.push(`Group name: ${this.savedName} → ${groupName}`);
    }
    if (groupDescription !== this.savedDescription) {
      changes.push(`Description: ${this.savedDescription} → ${groupDescription}`);
    }
    if (nextAge !== this.savedMinAge) {
      changes.push(`Minimum age: ${this.savedMinAge} → ${nextAge}`);
    }
    if (this.groupThemeColor !== this.savedTheme) {
      changes.push(`Theme color: ${this.themeLabel(this.savedTheme)} → ${this.themeLabel(this.groupThemeColor)}`);
    }
    if (!changes.length) {
      this.toast.info('Nothing has changed.');
      return;
    }

    this.pendingChanges = changes;
    this.ageWillRemoveMembers = nextAge > this.savedMinAge;
    this.confirmOpen = true;
    this.cdr.markForCheck();
  }

  confirmSave(): void {
    const groupName = this.groupName.trim();
    const groupDescription = this.groupDescription.trim();
    const previousName = this.originalGroupName || groupName;
    this.confirmOpen = false;

    this.groupService
      .updateGroup(previousName, {
        groupName,
        groupDescription,
        minAge: Number(this.groupMinAge),
        themeColor: this.groupThemeColor,
        username: this.username,
      })
      .subscribe({
        next: (res) => {
          if (!res.ok || !res.group) {
            this.toast.error(res.message || 'Failed to save group settings.');
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
          this.toast.success(res.message || 'Group settings saved');
        },
        error: (err) => this.toast.error(err.error?.message || 'Failed to save group settings.'),
      });
  }

  private themeLabel(theme: 'light' | 'dark'): string {
    return theme === 'dark' ? 'Dark' : 'Light';
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
          this.cdr.markForCheck();
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
          this.cdr.markForCheck();
        },
        error: (err) => console.error('Failed to load room requests:', err),
      });
  }

  loadBanRequests(): void {
    this.groupService
      .getGroupBanRequests({
        groupName: this.originalGroupName || this.groupName,
        status: 'pending',
        destination: 'group-admin',
      })
      .subscribe({
        next: (requests) => {
          this.banRequests = requests.map((req) => ({ ...req, rejectReason: '' }));
          this.cdr.markForCheck();
        },
        error: (err) => console.error('Failed to load ban requests:', err),
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

    const banCreatedSub = this.socketService.onGroupBanRequestCreated().subscribe((request) => {
      if (request.groupName !== (this.originalGroupName || this.groupName)) return;
      if (request.destination !== 'group-admin') return;
      if (this.banRequests.some((item) => item._id === request._id)) return;
      this.banRequests.unshift({ ...request, rejectReason: '' });
    });

    const banResolvedSub = this.socketService.onGroupBanRequestResolved().subscribe(({ requestId, groupName }) => {
      if (groupName !== (this.originalGroupName || this.groupName)) return;
      this.banRequests = this.banRequests.filter((req) => req._id !== requestId);
      this.loadGroup();
    });

    this.subscriptions.add(joinCreatedSub);
    this.subscriptions.add(joinResolvedSub);
    this.subscriptions.add(roomCreatedSub);
    this.subscriptions.add(roomResolvedSub);
    this.subscriptions.add(banCreatedSub);
    this.subscriptions.add(banResolvedSub);
  }

  approveRequest(index: number): void {
    const request = this.joinRequests[index];
    if (!request?._id) return;

    this.groupService.approveJoinRequest(request._id).subscribe({
      next: (res) => {
        this.toast.fromResponse(res, 'Request approved');
        if (res.ok) {
          this.loadJoinRequests();
          this.loadGroup();
        }
      },
      error: () => this.toast.error('Failed to approve request.'),
    });
  }

  rejectRequest(index: number): void {
    const request = this.joinRequests[index];
    const reason = request?.rejectReason?.trim();
    if (!request?._id || !reason) {
      this.toast.error('A rejection reason is required');
      return;
    }

    this.groupService.rejectJoinRequest(request._id, reason).subscribe({
      next: (res) => {
        this.toast.fromResponse(res, 'Request rejected');
        if (res.ok) this.loadJoinRequests();
      },
      error: () => this.toast.error('Failed to reject request.'),
    });
  }

  approveRoomRequest(index: number): void {
    const request = this.roomRequests[index];
    if (!request?._id) return;

    this.groupService.approveRoomRequest(request._id).subscribe({
      next: (res) => {
        this.toast.fromResponse(res);
        if (res.ok) {
          this.loadGroup();
          this.loadRoomRequests();
        }
      },
      error: () => this.toast.error('Failed to approve room proposal.'),
    });
  }

  rejectRoomRequest(index: number): void {
    const request = this.roomRequests[index];
    const reason = request?.rejectReason?.trim();
    if (!request?._id || !reason) {
      this.toast.error('A rejection reason is required');
      return;
    }

    this.groupService.rejectRoomRequest(request._id, reason).subscribe({
      next: (res) => {
        this.toast.fromResponse(res);
        if (res.ok) this.loadRoomRequests();
      },
      error: () => this.toast.error('Failed to reject room proposal.'),
    });
  }

  approveBanRequest(index: number): void {
    const request = this.banRequests[index];
    if (!request?._id) return;

    this.groupService.approveGroupBanRequest(request._id).subscribe({
      next: (res) => {
        this.toast.fromResponse(res, 'Ban request approved');
        if (res.ok) {
          this.loadBanRequests();
          this.loadGroup();
        }
      },
      error: (err) => this.toast.error(err.error?.message || 'Failed to approve ban request.'),
    });
  }

  rejectBanRequest(index: number): void {
    const request = this.banRequests[index];
    const reason = request?.rejectReason?.trim();
    if (!request?._id || !reason) {
      this.toast.error('A rejection reason is required');
      return;
    }

    this.groupService.rejectGroupBanRequest(request._id, reason).subscribe({
      next: (res) => {
        this.toast.fromResponse(res, 'Ban request rejected');
        if (res.ok) this.loadBanRequests();
      },
      error: (err) => this.toast.error(err.error?.message || 'Failed to reject ban request.'),
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

  async addRoom(): Promise<void> {
    const roomName = await this.dialog.prompt('Enter a name for the new room.', { title: 'Add room', confirmLabel: 'Add', placeholder: 'e.g. Book Club' });
    if (!roomName) return;

    this.groupService.addRoomDirect(this.originalGroupName || this.groupName, roomName).subscribe({
      next: (res) => {
        if (res.ok) this.rooms = res.rooms;
        else this.toast.error(res.message || 'Failed to add room.');
      },
      error: (err) => this.toast.error(err.error?.message || 'Failed to add room.'),
    });
  }

  async editRoom(index: number): Promise<void> {
    const oldName = this.rooms[index];
    const newName = await this.dialog.prompt(`Rename #${oldName} to:`, { title: 'Rename room', confirmLabel: 'Rename', initialValue: oldName });
    if (!newName || newName === oldName) return;

    this.groupService.renameRoom(this.originalGroupName || this.groupName, oldName, newName).subscribe({
      next: (res) => {
        if (res.ok) this.rooms = res.rooms;
        else this.toast.error(res.message || 'Failed to rename room.');
      },
      error: (err) => this.toast.error(err.error?.message || 'Failed to rename room.'),
    });
  }

  async deleteRoom(index: number): Promise<void> {
    const roomName = this.rooms[index];
    if (!(await this.dialog.confirm(`Are you sure you want to delete #${roomName}?`, { title: 'Delete room', confirmLabel: 'Delete' }))) return;

    this.groupService.deleteRoom(this.originalGroupName || this.groupName, roomName).subscribe({
      next: (res) => {
        if (res.ok) this.rooms = res.rooms;
        else this.toast.error(res.message || 'Failed to delete room.');
      },
      error: (err) => this.toast.error(err.error?.message || 'Failed to delete room.'),
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
          this.toast.error(res.message || 'Failed to promote member.');
        }
      },
      error: (err) => this.toast.error(err.error?.message || 'Failed to promote member.'),
    });
  }

  async banMember(index: number): Promise<void> {
    const user = this.allowedMembers[index];
    if (!user) return;

    const groupKey = this.originalGroupName || this.groupName;
    const escalateToSuperAdmin = user.role === 'group-admin';
    const confirmText = escalateToSuperAdmin
      ? `Send a Super Admin request to ban ${user.username} from this group?`
      : `Permanently ban ${user.username} from this group?`;
    if (!(await this.dialog.confirm(confirmText, { title: 'Ban member', confirmLabel: escalateToSuperAdmin ? 'Send request' : 'Ban' }))) return;

    if (escalateToSuperAdmin) {
      this.groupService.submitGroupBanRequest(groupKey, user.username, this.username).subscribe({
        next: (res) => {
          this.toast.fromResponse(res, 'Ban request submitted to Super Admin.');
        },
        error: (err) => this.toast.error(err.error?.message || 'Failed to submit ban request.'),
      });
      return;
    }

    this.groupService.banMember(groupKey, user.username).subscribe({
      next: (res) => {
        if (res.ok) {
          this.allowedMembers = this.buildAllowedMembers({
            members: res.members,
            admins: res.admins,
          });
          this.bannedMembers = (res.bannedMembers ?? []).map((username) => ({ username }));
        } else {
          this.toast.error(res.message || 'Failed to ban member.');
        }
      },
      error: (err) => this.toast.error(err.error?.message || 'Failed to ban member.'),
    });
  }

  async stepDownAsGA(): Promise<void> {
    if (!(await this.dialog.confirm('Are you sure you want to step down as Group Admin?', { title: 'Step down', confirmLabel: 'Step down' }))) return;

    const groupKey = this.originalGroupName || this.groupName;
    this.groupService.stepDownAsAdmin(groupKey, this.username).subscribe({
      next: (res) => {
        if (!res.ok) {
          this.toast.error(res.message || 'Failed to step down.');
          return;
        }
        if (res.role) {
          const user = this.authService.getUser();
          if (user) {
            const updated = { ...user, role: res.role };
            this.authService.setUser(updated);
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('user', JSON.stringify(updated));
              sessionStorage.setItem('role', res.role);
            }
          }
          this.userRole = res.role;
        }
        this.toast.success(res.message || 'You have stepped down.');
        this.router.navigate(['/my-memberships'], { queryParams: { groupName: groupKey } });
      },
      error: (err) => this.toast.error(err.error?.message || 'Failed to step down.'),
    });
  }

  async requestGroupDeletion(): Promise<void> {
    const reason = await this.dialog.prompt('Please enter a reason for the Super Admin:', { title: 'Request group deletion', confirmLabel: 'Send request', danger: true, placeholder: 'Reason...' });
    if (!reason) return;

    const groupKey = this.originalGroupName || this.groupName;
    this.groupService.submitGroupDeletionRequest(groupKey, this.username, reason).subscribe({
      next: (res) => {
        this.toast.fromResponse(res, res.ok ? 'Deletion request submitted to Super Admin.' : 'Request failed.');
      },
      error: (err) => this.toast.error(err.error?.message || 'Failed to submit group deletion request.'),
    });
  }
}