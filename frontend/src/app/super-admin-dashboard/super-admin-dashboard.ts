import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-super-admin-dashboard',
  styleUrl: './super-admin-dashboard.css',
  templateUrl: './super-admin-dashboard.html',
})
export class SuperAdminDashboard 
{
  userName: string = 'Super_mAllen'

  groupCreationRequests = 
  [
    {
    groupCreationRequestName: 'sm ts idk name 1',
    groupCreationRequestByUser: ' sm user',
    groupCreationRequestByUserRole: ' sm role',
    groupCreationRequestMinAge: '18',
    groupCreationRequestTheme: 'sm blue',
    groupCreationRequestDescription: '111 groupCreationRequestDescription groupCreationRequestDescriptiongroupCreationRequestDescriptiongroupCreationRequestDescription'
    },
    {
    groupCreationRequestName: 'sm ts idk name 3 ',
    groupCreationRequestByUser: ' sm user',
    groupCreationRequestByUserRole: ' sm role',
    groupCreationRequestMinAge: '18',
    groupCreationRequestTheme: 'sm blue',
    groupCreationRequestDescription: '100000 groupCreationRequestDescription groupCreationRequestDescriptiongroupCreationRequestDescriptiongroupCreationRequestDescription'
    },
    {
    groupCreationRequestName: 'sm ts idk name 2',
    groupCreationRequestByUser: ' sm user',
    groupCreationRequestByUserRole: ' sm role',
    groupCreationRequestMinAge: '18',
    groupCreationRequestTheme: 'sm blue',
    groupCreationRequestDescription: '1111 groupCreationRequestDescription groupCreationRequestDescriptiongroupCreationRequestDescriptiongroupCreationRequestDescription'
    },
  ]

  groupDeletionRequests = 
  [
    {
    groupDeletionRequestName: 'sm ts idk name gg',
    groupDeletionRequestByUser: ' sm user',
    groupDeletionRequestByUserRole: 'sm role'

    },
    {
    groupDeletionRequestName: 'sm ts idk name hhh',
    groupDeletionRequestByUser: ' sm user',
    groupDeletionRequestByUserRole: 'sm role'

    },
    {
    groupDeletionRequestName: 'sm ts idk nameeeee',
    groupDeletionRequestByUser: ' sm user',
    groupDeletionRequestByUserRole: 'sm role'
    },
  ]

  userBanRequest = 
  [
    {
      userBanRequestUsername: 'sm banned name',
      userBanRequestEmail: 'ban@ban.ban',
      userBanRequestRole: 'sm banned role',
      userBanRequestByUser: 'sm  name',
      userBanRequestByUserRole: 'sm  role',
    },
  ]


  permaBannedEmails: string[] = 
  [
    'ban@ban.ban', 'ban@ban.ban', 'ban@ban.ban'
  ]


  rejectGroupCreationRequest(index: number): void
  {
    this.groupCreationRequests.splice(index, 1);
    //const reason = prompt(`Enter Reason for Rejecting: `);
  }

  acceptGroupCreationRequest(index: number): void
  {
    //this.groupCreationRequests.splice(index, 1);
  }

  acceptGroupDeletionRequest(index: number): void
  {
    this.groupDeletionRequests.splice(index, 1);
  }

  acceptUserBanRequest(index: number): void
  {
    this.userBanRequest.splice(index, 1);
  }
}
