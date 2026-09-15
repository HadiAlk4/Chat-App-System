import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth';
import { GroupService } from '../services/group';
import { ChatService } from '../services/chat';
import { ChatMessage } from '../models/message';

@Component({
  imports: [RouterLink, FormsModule, DatePipe],
  selector: 'app-chat',
  styleUrl: './chat.css',
  templateUrl: './chat.html',
})
export class Chat implements OnInit, OnDestroy {
  @ViewChild('scroll') private messageScrollContainer!: ElementRef;

  currGroupName = '';
  currentRoom = '';
  currentUser = '';
  currentUserRole = 'user';

  rooms: string[] = [];
  groupMembers: { userName: string; isAdmin: boolean }[] = [];
  messages: ChatMessage[] = [];
  newMessageContent = '';

  systemNotification = '';
  displayNotification = false;
  isDarkMode = false;

  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService,
    private groupService: GroupService,
    private chatService: ChatService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) {
      this.currentUser = user.username;
      this.currentUserRole = user.role;
      this.isDarkMode = user.isDarkMode || false;
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
    this.chatService.joinRoom(this.currGroupName, this.currentRoom, this.currentUser);

    // Fetch room history from MongoDB
    this.chatService.getRoomMessages(this.currGroupName, this.currentRoom).subscribe({
      next: (msgs) => {
        this.messages = msgs;
        this.scrollToBottom();
      },
      error: (err) => console.error('Failed to load room messages:', err)
    });
  }

  listenToSocketEvents(): void {
    const msgSub = this.chatService.onNewMessage().subscribe((msg) => {
      if (msg.groupName === this.currGroupName && msg.roomName === this.currentRoom) {
        this.messages.push(msg);
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

    this.subscriptions.add(msgSub);
    this.subscriptions.add(joinSub);
    this.subscriptions.add(leftSub);
  }

  sendContent(): void {
    if (!this.newMessageContent.trim()) return;

    this.chatService.sendMessage({
      groupName: this.currGroupName,
      roomName: this.currentRoom,
      senderUserName: this.currentUser,
      content: this.newMessageContent.trim()
    });

    this.newMessageContent = '';
  }

  deleteContent(msgId?: string): void {
    if (!msgId) return;
    if (confirm('Delete this message?')) {
      this.chatService.deleteMessage(msgId).subscribe({
        next: () => {
          this.messages = this.messages.filter((m) => m._id !== msgId);
        },
        error: () => alert('Failed to delete message.')
      });
    }
  }

  showToast(text: string): void {
    this.systemNotification = text;
    this.displayNotification = true;
    setTimeout(() => {
      this.displayNotification = false;
    }, 4000);
  }

  dismissToast(): void {
    this.displayNotification = false;
  }

  toggleDarkMode(event: Event): void {
    this.isDarkMode = (event.target as HTMLInputElement).checked;
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
