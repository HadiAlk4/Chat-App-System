import { Component } from '@angular/core';

@Component({
  imports: [],
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
    groupCreationRequestName: 'sm ts idk name',
    groupCreationRequestByUser: ' sm user',
    groupCreationRequestMinAge: '18',
    groupCreationRequestTheme: 'sm blue',
    },
    {
    groupCreationRequestName: 'sm ts idk name',
    groupCreationRequestByUser: ' sm user',
    groupCreationRequestMinAge: '18',
    groupCreationRequestTheme: 'sm blue',
    },
    {
    groupCreationRequestName: 'sm ts idk name',
    groupCreationRequestByUser: ' sm user',
    groupCreationRequestMinAge: '18',
    groupCreationRequestTheme: 'sm blue',
    },
  ]

  groupDeletionRequests = 
  [
    {
    groupDeletionRequestName: 'sm ts idk name',
    groupDeletionRequestByUser: ' sm user',
    },
    {
    groupDeletionRequestName: 'sm ts idk name',
    groupDeletionRequestByUser: ' sm user',
    },
    {
    groupDeletionRequestName: 'sm ts idk name',
    groupDeletionRequestByUser: ' sm user',
    },
  ]

  userBanRequest = 
  [
    {
      userBanRequestUsername: 'sm banned name',
      userBanRequestEmail: 'ban@ban.ban',
      userBanRequestRole: 'sm banned role',
      userBanRequestByUser: 'sm  name',
    },
  ]


  permamBannedEmails = 
  [
    'ban@ban.ban', 'ban@ban.ban', 'ban@ban.ban'
  ]
}
