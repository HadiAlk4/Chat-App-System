import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth';

@Component({
  imports: [RouterLink, FormsModule],
  selector: 'app-chat',
  styleUrl: './chat.css',
  templateUrl: './chat.html',
})

export class Chat 
{

  @ViewChild('scroll') private messageScrollContainer!: ElementRef;
  currGroupName = 'FSD Larps';
  currentRoom = 'Wednesday Lab';
  currentUser = 'hadialk04';
  currentUserRole = 'user';
  constructor(private authService: AuthService) {}

  ngOnInit(): void
  {
    const user = this.authService.getUser();
    if(user)
    {
      this.currentUser = user.username;
    }
  }



  rooms: string[] = 
  [
    'Wednesday Lab',
    'Firday Lab',
    'Main',
  ];

  groupMembers = 
  [
    { userName: 'hadialk04', isAdmin: true},
    { userName: 'ChronicDuke', isAdmin: false},
    { userName: 'alpaMale', isAdmin: false},
    { userName: 'BigAl_', isAdmin: true},
    { userName: 'togaChan', isAdmin: false},
  ];

  onlineGroupMembers = 
  [
    { userName: 'hadialk04', isAdmin: true},
    { userName: 'ChronicDuke', isAdmin: false},
    { userName: 'alpaMale', isAdmin: false},
  ];


  roomMessages: {[roomName: string]: any []} = {
  'Wednesday Lab': 
  [
    {
      id: 1,
      senderUserName: 'alpaMale',
      timeStamp: '10:48 AM',
      content: 'sent a reel',
    },
    {
      id: 2,
      senderUserName: 'alpaMale',
      timeStamp: '10:48 AM',
      content: 'sent a reel',
    },
    {
      id: 3,
      senderUserName: 'alpaMale',
      timeStamp: '10:48 AM',
      content: 'sent a reel. sent a reelsent a reelsent a reelsent a reelsent a reelsent a reelsent a reelsent a reelsent a reelsent a reelsent a reel sent a reelsent a reelsent a reelsent a reelsent a reelsent a reelsent a reelsent a reelsent a reel',
    },
    {
      id: 4,
      senderUserName: 'hadialk04',
      timeStamp: '10:48 AM',
      content: 'sent a reel',
    },

    
  ],

  'Main': [
    {
      id: 4,
      senderUserName: 'ChronicDuke',
      timeStamp: '10:48 AM',
      content: 'sent a reel',
    },
  ],  
  
    'Firday Lab': [
    {
      id: 5,
      senderUserName: 'ChronicDuke',
      timeStamp: '10:48 AM',
      content: 'sent a reel',
    },
  ],   

  };

  displayNotification = true;
  notificationMessage = 'bigAL joined'; // maybe have a fixed + joind and before it {username} for phase two
  newMessageContent = '';

  get activeMessage()
  {
    return this.roomMessages[this.currentRoom];
  }


  switchRooms(room: string)
  {
    this.currentRoom = room;
    this.scrollToBottom();
  }

  sendContent()
  {
    if(!this.newMessageContent) return;

    const newMessage = 
    {
      id: Date.now(),
      timeStamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: this.newMessageContent,
      senderUserName: this.currentUser,
    }

    this.activeMessage.push(newMessage);
    this.newMessageContent = '';
    this.scrollToBottom();
  }

  deleteContent(messageId: number)
  {
    const index = this.activeMessage.findIndex(m => m.id === messageId);
    if (index !== -1) {
      this.activeMessage.splice(index, 1);
    }  
  }

  dismissToast()
  {
    this.displayNotification = false;
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.messageScrollContainer) {
        this.messageScrollContainer.nativeElement.scrollTop = 
          this.messageScrollContainer.nativeElement.scrollHeight;
      }
    }, 0);
  }

// Add this property to your class
  isDarkMode: boolean = false;

  // Update the toggle function
  toggleDarkMode(event: Event): void {
    this.isDarkMode = (event.target as HTMLInputElement).checked;
  }
}
