import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-super-admin-audit-log',
  styleUrl: './super-admin-audit-log.css',
  templateUrl: './super-admin-audit-log.html',
})
export class SuperAdminAuditLog 
{
    userName: string = 'Super_mAllen'

    auditLogBook = 
    [
      {
        timeStamp: "2026-07-30 08:30:12",
        actionPerformed: "Accepted Global User Ban",
        target: "Tough Mudder@mud.tuff",
      },
      {
        timeStamp: "2026-07-30 08:30:12",
        actionPerformed: "Rejected Global User Ban",
        target: "Tough Mudder",
      },
      {
        timeStamp: "2026-07-30 08:30:12",
        actionPerformed: "Accepted Group Creation",
        target: "Wednesday Lab",
      },
      {
        timeStamp: "2026-07-30 08:30:12",
        actionPerformed: "Rejected Group Creation",
        target: "Wednesday Lab",
      },
      {
        timeStamp: "2026-07-30 08:30:12",
        actionPerformed: "Accepted Group Deletion",
        target: "Wednesday Lab",
      },
      {
        timeStamp: "2026-07-30 08:30:12",
        actionPerformed: "Rejected Group Deletion",
        target: "Wednesday Lab",
      },
    ]
}
