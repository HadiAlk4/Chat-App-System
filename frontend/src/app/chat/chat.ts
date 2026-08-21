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
    { name: 'hadialk04', isAdmin: true},
    { name: 'ChroncsOfDuke', isAdmin: false},
    { name: 'alpaMale', isAdmin: false},
    { name: 'BigAl', isAdmin: true},
  ];


  messages = [
    {
      id: '1',
      senderUserName: 'alpaMale',
      timeStamp: '10:48 AM',
      content: 'sent a reel'
    },
    {
      id: '2',
      senderUserName: 'ChroncsOfDuke',
      timeStamp: '10:48 AM',
      content: 'sent a reel'
    },
    {
      id: '3',
      senderUserName: 'hadialk04',
      timeStamp: '10:50 AM',
      content: 'sent a reel'
    },
  ];

  displayNotification = true;
  notificationMessage = 'bigAL joined'; // maybe have a fixed + joind and before it {username} for phase two
  newMessageContent = '';

  switchRooms(room: string)
  {
    this.currentRoom = room;
  }

  sendContent()
  {
    if(!this.newMessageContent) return;

    const newMessage = 
    {
      id: Date.now().toString(),
      timeStamp: Date.now().toString(),
      content: this.newMessageContent,
      senderUserName: this.currentUser,
    }

    this.messages.push(newMessage);
  }

  deleteContent(messageId: string)
  {
    this.messages = this.messages.filter(m => m.id !== messageId);
  }

  dismissToast()
  {
    this.displayNotification = false;
  }
}
