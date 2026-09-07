import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth';
import { GroupService } from '../services/group';
import { JoinRequest } from '../models/join-request';

@Component({
  selector: 'app-request-history',
  imports: [DatePipe, RouterLink, FormsModule],
  templateUrl: './request-history.html',
  styleUrl: './request-history.css',
})
export class RequestHistory implements OnInit
{
  userRole: string = 'user';
  userName: string = 'hadialk04';

  pendingJoinRequestGroups: JoinRequest[] = [];
  rejectedRequestGroups: JoinRequest[] = [];

  constructor(
    private authService: AuthService,
    private groupService: GroupService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) {
      this.userName = user.username;
      this.userRole = user.role;
    }
    this.loadHistory();
  }

  loadHistory(): void {
    this.groupService.getJoinRequests({ username: this.userName }).subscribe({
      next: requests => {
        this.pendingJoinRequestGroups = requests.filter(r => r.status === 'pending');
        this.rejectedRequestGroups = requests.filter(r => r.status === 'rejected');
      }
    });
  }

  onLogout(): void
  {
    this.authService.logout();
  }

  availableGroups: string[] = 
  [
    'FSD Larp',
    'Tough Mudder Bullying Chat Room',
    'Sci-Fi Larpers'
  ];

  proposeNewRoom =
  [
    {
    proposeNewRoomRequestDate: '20/08/26',
    proposeNewRoomGroupName: 'FSD Larp',
    proposedRoomName: 'Coe-Ideas'
    },
    {
    proposeNewRoomRequestDate: '19/08/26',
    proposeNewRoomGroupName: 'Tough Mudder Bullying Chat Room',
    proposedRoomName: 'Costume-Ideas'
    },
  ];

  selectedGroupForRoom: string = '';
  newRoomNameInput: string = '';

  submitRoomProposal(): void {
    if (this.selectedGroupForRoom && this.newRoomNameInput) {
      this.proposeNewRoom.push({
        proposeNewRoomRequestDate: new Date().toLocaleDateString('en-GB'),
        proposeNewRoomGroupName: this.selectedGroupForRoom,
        proposedRoomName: this.newRoomNameInput
      });
      alert(`Proposed #${this.newRoomNameInput} to ${this.selectedGroupForRoom}!`);
      this.newRoomNameInput = '';
    } else {
      alert('Please fill out both fields.');
    }
  }
}
