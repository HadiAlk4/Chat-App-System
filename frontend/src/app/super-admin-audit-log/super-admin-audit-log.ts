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


}
