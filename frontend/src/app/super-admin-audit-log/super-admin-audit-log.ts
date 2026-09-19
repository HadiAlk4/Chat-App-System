import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth';
import { AuditService } from '../services/audit';
import { AuditLog } from '../models/audit-log';

@Component({
  imports: [RouterLink, FormsModule, DatePipe],
  selector: 'app-super-admin-audit-log',
  styleUrl: './super-admin-audit-log.css',
  templateUrl: './super-admin-audit-log.html',
})
export class SuperAdminAuditLog implements OnInit {
  userName = 'Super_mAllen';
  displayedAuditLog: AuditLog[] = [];

  startDate = '';
  endDate = '';
  selectedAction = 'All Actions';

  actionTypes: string[] = [
    'All Actions',
    'Accepted Global User Ban',
    'Rejected Global User Ban',
    'Accepted Group Creation',
    'Rejected Group Creation',
    'Accepted Group Deletion',
    'Rejected Group Deletion',
  ];

  constructor(
    private authService: AuthService,
    private auditService: AuditService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) {
      this.userName = user.username;
    }
    this.loadLogs();
  }

  onLogout(): void {
    this.authService.logout();
  }

  applyFilters(): void {
    this.loadLogs();
  }

  private loadLogs(): void {
    this.auditService
      .getLogs({
        action: this.selectedAction,
        startDate: this.startDate || undefined,
        endDate: this.endDate || undefined,
      })
      .subscribe({
        next: (logs) => {
          this.displayedAuditLog = logs;
        },
        error: (err) => {
          console.error('Failed to load audit logs:', err);
          this.displayedAuditLog = [];
        },
      });
  }
}
