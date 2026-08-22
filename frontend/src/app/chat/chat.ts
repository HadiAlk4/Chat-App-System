import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [RouterLink, FormsModule],
  selector: 'app-chat',
  styleUrl: './chat.css',
  templateUrl: './chat.html',
})

export class Chat 
{
  currGroupName = 'FSD Larps';
  currentRoom = 'Wednesday Lab';
  currentUser = 'hadialk04';

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
  }

  sendContent()
  {
    if(!this.newMessageContent) return;

    const newMessage = 
    {
      id: Date.now(),
      timeStamp: Date.now().toString(),
      content: this.newMessageContent,
      senderUserName: this.currentUser,
    }

    this.roomMessages[this.currentRoom].push(newMessage);
    this.activeMessage.push(newMessage);
    this.newMessageContent = '';
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
}
