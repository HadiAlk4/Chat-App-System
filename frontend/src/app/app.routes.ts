import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Signup } from './signup/signup';
import { Dashboard } from './dashboard/dashboard';
import { MyMemberships } from './my-memberships/my-memberships';
import { GroupSettings } from './group-settings/group-settings';
import { RequestHistory } from './request-history/request-history';
import { Chat } from './chat/chat';
import { SuperAdminDashboard } from './super-admin-dashboard/super-admin-dashboard';
import { SuperAdminAuditLog } from './super-admin-audit-log/super-admin-audit-log';
import { UserProfileSettings } from './user-profile-settings/user-profile-settings';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  // Public routes
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Protected routes (authenticated users)
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'my-memberships', component: MyMemberships, canActivate: [authGuard] },
  { path: 'group-settings', component: GroupSettings, canActivate: [authGuard] },
  { path: 'request-history', component: RequestHistory, canActivate: [authGuard] },
  { path: 'chat', component: Chat, canActivate: [authGuard] },
  { path: 'user-profile-settings', component: UserProfileSettings, canActivate: [authGuard] },

  // Super Admin protected routes
  {
    path: 'super-admin-dashboard',
    component: SuperAdminDashboard,
    canActivate: [authGuard],
    data: { expectedRole: 'super-admin' }
  },
  {
    path: 'super-admin-audit-log',
    component: SuperAdminAuditLog,
    canActivate: [authGuard],
    data: { expectedRole: 'super-admin' }
  },

  // Fallback route
  { path: '**', redirectTo: 'login' }
];

