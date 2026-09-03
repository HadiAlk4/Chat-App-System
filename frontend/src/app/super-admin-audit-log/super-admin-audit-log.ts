import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  imports: [RouterLink, FormsModule],
  selector: 'app-super-admin-audit-log',
  styleUrl: './super-admin-audit-log.css',
  templateUrl: './super-admin-audit-log.html',
})
export class SuperAdminAuditLog 
{
    userName: string = 'Super_mAllen'

    constructor(private authService: AuthService) {}

    onLogout(): void
    {
      this.authService.logout();
    }

    auditLogBook = 
    [
      {
        timeStamp: "2026-07-28T08:30:12",
        actionPerformed: "Accepted Global User Ban",
        target: "Tough Mudder@mud.tuff",
      },
      {
        timeStamp: "2026-07-28T08:30:12",
        actionPerformed: "Rejected Global User Ban",
        target: "Tough Mudder",
      },
      {
        timeStamp: "2026-07-28T08:30:12",
        actionPerformed: "Accepted Group Creation",
        target: "Wednesday Lab",
      },
      {
        timeStamp: "2026-07-28T08:30:12",
        actionPerformed: "Rejected Group Creation",
        target: "Wednesday Lab",
      },
      {
        timeStamp: "2026-07-28T08:30:12",
        actionPerformed: "Accepted Group Deletion",
        target: "Wednesday Lab",
      },
      {
        timeStamp: "2026-07-28T08:30:12",
        actionPerformed: "Rejected Group Deletion",
        target: "Wednesday Lab",
      },
    ]

    displayedAuditLog: any[] = [];

    startDate: string = '';
    endDate: string = '';
    selectedAction: string = 'All Actions';

    actionTypes: string[] = 
    [
      'All Actions',
      'Accepted Global User Ban',
      'Rejected Global User Ban',
      'Accepted Group Creation',
      'Rejected Group Creation',
      'Accepted Group Deletion',
      'Rejected Group Deletion'
    ];

    ngOnInit()
    {
      this.displayedAuditLog = [...this.auditLogBook];
    }

    applyFilters()
    {
      this.displayedAuditLog = this.auditLogBook.filter(log => 
      {
        let matchesAction = true;
        let matchesDate = true;

        if(this.selectedAction !== 'All Actions')
        {
          matchesAction = log.actionPerformed === this.selectedAction;
        }

        const logData = new Date(log.timeStamp);

        if(this.startDate)
        {
          const start = new Date(this.startDate);
          start.setHours(0,0,0,0);
          if(logData < start) matchesDate = false;
        }
        if(this.endDate)
        {
          const end = new Date(this.startDate);
          end.setHours(23, 59, 59, 999);
          if(logData > end) matchesDate = false;
        }
        return matchesAction && matchesDate;
      }
      );
    }
}
