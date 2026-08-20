import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-request-history',
  imports: [RouterLink, FormsModule],
  templateUrl: './request-history.html',
  styleUrl: './request-history.css',
})
export class RequestHistory 
{
  userRole: string = 'user';
  userName: string = 'hadialk04';

  availableGroups: string[] = 
  [
    'FSD Larp',
    'Tough Mudder Bullying Chat Room',
    'Sci-Fi Larpers'
  ];

  pendingJoinRequestGroups =
  [
    {
      requestDate: '20/08/26',
      requestedGroupName: 'FSD Larp',
    },
    {
      requestDate: '19/08/26',
      requestedGroupName: 'Tough Mudder Bullying Chat Room',
    },
  ];

  rejectedRequestGroups =
  [
    {
      rejectedRequestDate: '20/08/26',
      rejectedRquestGroupName: 'FSD Larp',
      rejectedRquestGroupNameReason: '****************'
    },
    {
      rejectedRequestDate: '19/08/26',
      rejectedRquestGroupName: 'Tough Mudder Bullying Chat Room',
      rejectedRquestGroupNameReason: '************'
    },
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

  cancelJoinRequest(index: number): void
  {
    this.pendingJoinRequestGroups.splice(index, 1);
  }

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
