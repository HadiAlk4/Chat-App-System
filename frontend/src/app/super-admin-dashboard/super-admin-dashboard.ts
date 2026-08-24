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
    groupCreationRequestName: 'sm ts idk name',
    groupCreationRequestByUser: ' sm user',
    groupCreationRequestByUserRole: ' sm role',
    groupCreationRequestMinAge: '18',
    groupCreationRequestTheme: 'sm blue',
    groupCreationRequestDescription: '111 groupCreationRequestDescription groupCreationRequestDescriptiongroupCreationRequestDescriptiongroupCreationRequestDescription'
    },
    {
    groupCreationRequestName: 'sm ts idk name',
    groupCreationRequestByUser: ' sm user',
    groupCreationRequestByUserRole: ' sm role',
    groupCreationRequestMinAge: '18',
    groupCreationRequestTheme: 'sm blue',
    groupCreationRequestDescription: '100000 groupCreationRequestDescription groupCreationRequestDescriptiongroupCreationRequestDescriptiongroupCreationRequestDescription'
    },
    {
    groupCreationRequestName: 'sm ts idk name',
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
    groupDeletionRequestName: 'sm ts idk name',
    groupDeletionRequestByUser: ' sm user',
    groupDeletionRequestByUserRole: 'sm role'

    },
    {
    groupDeletionRequestName: 'sm ts idk name',
    groupDeletionRequestByUser: ' sm user',
    groupDeletionRequestByUserRole: 'sm role'

    },
    {
    groupDeletionRequestName: 'sm ts idk name',
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


  permaBannedEmails = 
  [
    'ban@ban.ban', 'ban@ban.ban', 'ban@ban.ban'
  ]
}
