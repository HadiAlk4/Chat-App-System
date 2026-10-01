import { ChangeDetectorRef, Component, ElementRef, OnInit, OnDestroy, ViewChild, computed, effect, signal } from '@angular/core';
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
import { DialogService } from '../services/dialog';
import { ToastService } from '../services/toast';
import { ChatMessage } from '../models/message';

const BACKEND_URL = 'http://localhost:3000';
const TYPING_IDLE_MS = 2000;

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
  readonly onlineRoomMembers = signal<string[]>([]);
  readonly messages = signal<ChatMessage[]>([]);
  readonly searchTerm = signal('');
  readonly typingUsers = signal<Set<string>>(new Set());

  readonly visibleMessages = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.messages();
    return this.messages().filter(
      (m) => m.content?.toLowerCase().includes(term) || m.senderUserName.toLowerCase().includes(term)
    );
  });

  readonly typingLabel = computed(() => {
    const names = [...this.typingUsers()];
    if (names.length === 0) return '';
    if (names.length === 1) return `${names[0]} is typing`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing`;
    return 'Several people are typing';
  });

  newMessageContent = '';
  selectedChatFile: File | null = null;
  isDarkMode = false;
  groupThemeColor = '';

  private subscriptions = new Subscription();
  private isTyping = false;
  private typingTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private authService: AuthService,
    private accountService: AccountService,
    private groupService: GroupService,
    private chatService: ChatService,
    private socketService: SocketService,
    private uploadService: UploadService,
    private toast: ToastService,
    private dialog: DialogService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    effect(() => {
      this.messages();
      this.scrollToBottom();
    });
  }

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
      this.stopTyping();
      this.chatService.leaveRoom(this.currGroupName, this.currentRoom, this.currentUser);
    }

    this.currentRoom = room;
    this.onlineRoomMembers.set([]);
    this.typingUsers.set(new Set());
    this.searchTerm.set('');
    this.chatService.joinRoom(this.currGroupName, this.currentRoom, this.currentUser);

    // Fetch room history from MongoDB
    this.chatService.getRoomMessages(this.currGroupName, this.currentRoom, this.currentUser).subscribe({
      next: (msgs) => this.messages.set(msgs),
      error: (err) => {
        if (err.status === 403) {
          this.messages.set([]);
          return;
        }
        console.error('Failed to load room messages:', err);
      }
    });
  }

  listenToSocketEvents(): void {
    const msgSub = this.chatService.onNewMessage().subscribe((msg) => {
      if (msg.groupName === this.currGroupName && msg.roomName === this.currentRoom) {
        this.messages.update((list) => [...list, msg]);
        this.setTyping(msg.senderUserName, false);
      }
    });

    const joinSub = this.chatService.onUserJoined().subscribe((data) => {
      if (data.roomName === this.currentRoom && data.username !== this.currentUser) {
        this.toast.info(`${data.username} joined the room`);
      }
    });

    const leftSub = this.chatService.onUserLeft().subscribe((data) => {
      if (data.roomName === this.currentRoom && data.username !== this.currentUser) {
        this.setTyping(data.username, false);
        this.toast.info(`${data.username} left the room`);
      }
    });

    const deletedSub = this.chatService.onMessageDeleted().subscribe(({ messageId }) => {
      this.messages.update((list) => list.filter((m) => String(m._id) !== String(messageId)));
    });

    const roomUsersSub = this.chatService.onRoomUsers().subscribe((data) => {
      if (data.roomName === this.currentRoom) {
        this.onlineRoomMembers.set(data.users || []);
      }
    });

    const typingSub = this.chatService.onTyping().subscribe(({ username, roomName, isTyping }) => {
      if (roomName === this.currentRoom && username !== this.currentUser) {
        this.setTyping(username, isTyping);
      }
    });

    const accountDeletedSub = this.socketService.onAccountDeletionRequestResolved().subscribe(({ status, username }) => {
      if (status === 'approved' && username) {
        this.messages.update((list) => list.filter((m) => m.senderUserName !== username));
      }
    });

    const joinResolvedSub = this.socketService.onJoinRequestResolved().subscribe(({ username, groupName, status }) => {
      const outcome = status === 'approved' ? 'approved' : 'denied';
      if (username === this.currentUser) {
        this.toast.info(`Your request to join ${groupName} was ${outcome}`);
        return;
      }
      if (groupName === this.currGroupName) {
        this.toast.info(
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
    this.subscriptions.add(typingSub);
    this.subscriptions.add(joinResolvedSub);
    this.subscriptions.add(accountDeletedSub);
  }

  onChatFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        this.toast.error('File exceeds 2MB limit.');
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
        error: () => this.toast.error('Failed to upload image attachment.'),
      });
    } else {
      this.dispatchMessage(content);
    }
  }

  private dispatchMessage(content: string, imageUrl?: string): void {
    if (/(https?:\/\/|www\.)/i.test(content)) {
      this.toast.error('External links are not allowed');
      return;
    }

    this.stopTyping();
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

  async deleteContent(msgId?: string): Promise<void> {
    if (!msgId) return;
    const confirmed = await this.dialog.confirm('Delete this message for everyone in the room?', {
      title: 'Delete message',
      confirmLabel: 'Delete',
    });
    if (confirmed) {
      this.chatService.emitDeleteMessage(this.currGroupName, this.currentRoom, msgId);
    }
  }

  onMessageInput(): void {
    if (!this.newMessageContent.trim()) {
      this.stopTyping();
      return;
    }
    if (!this.isTyping) {
      this.isTyping = true;
      this.chatService.emitTyping(this.currGroupName, this.currentRoom, this.currentUser, true);
    }
    if (this.typingTimer) clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => this.stopTyping(), TYPING_IDLE_MS);
  }

  private stopTyping(): void {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
      this.typingTimer = null;
    }
    if (!this.isTyping) return;
    this.isTyping = false;
    this.chatService.emitTyping(this.currGroupName, this.currentRoom, this.currentUser, false);
  }

  private setTyping(username: string, isTyping: boolean): void {
    this.typingUsers.update((current) => {
      if (current.has(username) === isTyping) return current;
      const next = new Set(current);
      if (isTyping) next.add(username);
      else next.delete(username);
      return next;
    });
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
      this.stopTyping();
      this.chatService.leaveRoom(this.currGroupName, this.currentRoom, this.currentUser);
    }
    this.subscriptions.unsubscribe();
  }
}
