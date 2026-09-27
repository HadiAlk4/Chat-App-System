import { ChangeDetectorRef, Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth';
import { AccountService } from '../services/account';
import { GroupService } from '../services/group';
import { ChatService } from '../services/chat';
import { SocketService } from '../services/socket';
import { UploadService } from '../services/upload';
import { ChatMessage } from '../models/message';

const BACKEND_URL = 'http://localhost:3000';

@Component({
  imports: [RouterLink, FormsModule, DatePipe],
  selector: 'app-chat',
  styleUrl: './chat.css',
  templateUrl: './chat.html',
})
export class Chat implements OnInit, OnDestroy {
  @ViewChild('scroll') private messageScrollContainer!: ElementRef;
  @ViewChild('chatFileInput') private chatFileInput!: ElementRef<HTMLInputElement>;

  currGroupName = '';
  currentRoom = '';
  currentUser = '';
  currentUserRole = 'user';

  rooms: string[] = [];
  groupMembers: { userName: string; isAdmin: boolean }[] = [];
  onlineRoomMembers: string[] = [];
  messages: ChatMessage[] = [];
  newMessageContent = '';
  selectedChatFile: File | null = null;

  systemNotification = '';
  displayNotification = false;
  isDarkMode = false;
  groupThemeColor = '';

  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService,
    private accountService: AccountService,
    private groupService: GroupService,
    private chatService: ChatService,
    private socketService: SocketService,
    private uploadService: UploadService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) {
      this.currentUser = user.username;
      this.currentUserRole = user.role;
    }

    const routeSub = this.route.queryParams.subscribe((params) => {
      if (params['groupName']) {
        this.currGroupName = params['groupName'];
        this.loadGroupAndRooms();
      }
    });
    this.subscriptions.add(routeSub);

    this.listenToSocketEvents();
  }

  loadGroupAndRooms(): void {
    this.groupService.getGroupByName(this.currGroupName).subscribe({
      next: (res) => {
        if (res.ok && res.group) {
          const g = res.group;
          this.groupThemeColor = g.themeColor;
          this.applyChatTheme();
          this.rooms = g.rooms || ['Main Room'];

          const admins = new Set(g.admins || []);
          const allMembers = Array.from(new Set([...(g.members || []), ...(g.admins || [])]));
          this.groupMembers = allMembers.map((u) => ({
            userName: u,
            isAdmin: admins.has(u),
          }));

          // Default to first room
          if (this.rooms.length > 0) {
            this.switchRooms(this.rooms[0]);
          }
          this.cdr.markForCheck();
        }
      },
      error: (err) => console.error('Failed to load group for chat:', err)
    });
  }

  switchRooms(room: string): void {
    if (this.currentRoom && this.currGroupName) {
      this.chatService.leaveRoom(this.currGroupName, this.currentRoom, this.currentUser);
    }

    this.currentRoom = room;
    this.onlineRoomMembers = [];
    this.chatService.joinRoom(this.currGroupName, this.currentRoom, this.currentUser);

    // Fetch room history from MongoDB
    this.chatService.getRoomMessages(this.currGroupName, this.currentRoom, this.currentUser).subscribe({
      next: (msgs) => {
        this.messages = msgs;
        this.cdr.markForCheck();
        this.scrollToBottom();
      },
      error: (err) => {
        if (err.status === 403) {
          this.messages = [];
          return;
        }
        console.error('Failed to load room messages:', err);
      }
    });
  }

  listenToSocketEvents(): void {
    const msgSub = this.chatService.onNewMessage().subscribe((msg) => {
      if (msg.groupName === this.currGroupName && msg.roomName === this.currentRoom) {
        this.messages.push(msg);
        this.cdr.markForCheck();
        this.scrollToBottom();
      }
    });

    const joinSub = this.chatService.onUserJoined().subscribe((data) => {
      if (data.roomName === this.currentRoom && data.username !== this.currentUser) {
        this.showToast(`${data.username} joined the room`);
      }
    });

    const leftSub = this.chatService.onUserLeft().subscribe((data) => {
      if (data.roomName === this.currentRoom && data.username !== this.currentUser) {
        this.showToast(`${data.username} left the room`);
      }
    });

    const deletedSub = this.chatService.onMessageDeleted().subscribe(({ messageId }) => {
      this.messages = this.messages.filter((m) => String(m._id) !== String(messageId));
      this.cdr.markForCheck();
    });

    const roomUsersSub = this.chatService.onRoomUsers().subscribe((data) => {
      if (data.roomName === this.currentRoom) {
        this.onlineRoomMembers = data.users || [];
        this.cdr.markForCheck();
      }
    });

    const accountDeletedSub = this.socketService.onAccountDeletionRequestResolved().subscribe(({ status, username }) => {
      if (status === 'approved' && username) {
        this.messages = this.messages.filter((m) => m.senderUserName !== username);
        this.cdr.markForCheck();
      }
    });

    const joinResolvedSub = this.socketService.onJoinRequestResolved().subscribe(({ username, groupName, status }) => {
      const outcome = status === 'approved' ? 'approved' : 'denied';
      if (username === this.currentUser) {
        this.showToast(`Your request to join ${groupName} was ${outcome}`);
        return;
      }
      if (groupName === this.currGroupName) {
        this.showToast(
          status === 'approved'
            ? `${username} was approved to join`
            : `${username} was denied`
        );
      }
    });

    this.subscriptions.add(msgSub);
    this.subscriptions.add(joinSub);
    this.subscriptions.add(leftSub);
    this.subscriptions.add(deletedSub);
    this.subscriptions.add(roomUsersSub);
    this.subscriptions.add(joinResolvedSub);
    this.subscriptions.add(accountDeletedSub);
  }

  onChatFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert('File exceeds 2MB limit.');
        target.value = '';
        this.selectedChatFile = null;
        return;
      }
      this.selectedChatFile = file;
    }
  }

  attachmentSrc(url?: string | null): string {
    if (!url) return '';
    if (url.startsWith('/uploads/')) {
      return `${BACKEND_URL}${url}`;
    }
    return url;
  }

  sendContent(): void {
    const content = this.newMessageContent.trim();
    if (!content && !this.selectedChatFile) return;

    if (this.selectedChatFile) {
      this.uploadService.uploadChatImage(this.selectedChatFile).subscribe({
        next: (res) => {
          if (res.ok) {
            this.dispatchMessage(content, res.fileUrl);
          }
        },
        error: () => alert('Failed to upload image attachment.'),
      });
    } else {
      this.dispatchMessage(content);
    }
  }

  private dispatchMessage(content: string, imageUrl?: string): void {
    if (/(https?:\/\/|www\.)/i.test(content)) {
      alert('External links are not allowed');
      return;
    }

    this.chatService.sendMessage({
      groupName: this.currGroupName,
      roomName: this.currentRoom,
      senderUserName: this.currentUser,
      content,
      imageUrl,
    });

    this.newMessageContent = '';
    this.selectedChatFile = null;
    if (this.chatFileInput) {
      this.chatFileInput.nativeElement.value = '';
    }
  }

  deleteContent(msgId?: string): void {
    if (!msgId) return;
    if (confirm('Delete this message?')) {
      this.chatService.emitDeleteMessage(this.currGroupName, this.currentRoom, msgId);
    }
  }

  showToast(text: string): void {
    this.systemNotification = text;
    this.displayNotification = true;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.displayNotification = false;
      this.cdr.markForCheck();
    }, 4000);
  }

  dismissToast(): void {
    this.displayNotification = false;
  }

  applyChatTheme(): void {
    const user = this.authService.getUser();
    if (user?.usePersonalTheme === true) {
      this.isDarkMode = user.isDarkMode;
      return;
    }
    this.isDarkMode = this.groupThemeColor === 'dark';
  }

  toggleDarkMode(event: Event): void {
    this.isDarkMode = (event.target as HTMLInputElement).checked;
    const email = this.authService.getUser()?.email;
    if (!email) return;

    this.accountService.updateTheme(email, this.isDarkMode).subscribe({
      next: (res) => {
        if (res.ok && res.user) {
          this.authService.setUser(res.user);
        }
      },
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messageScrollContainer) {
        this.messageScrollContainer.nativeElement.scrollTop =
          this.messageScrollContainer.nativeElement.scrollHeight;
      }
    }, 50);
  }

  ngOnDestroy(): void {
    if (this.currGroupName && this.currentRoom) {
      this.chatService.leaveRoom(this.currGroupName, this.currentRoom, this.currentUser);
    }
    this.subscriptions.unsubscribe();
  }
}
