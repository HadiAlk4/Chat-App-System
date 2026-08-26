import { Routes } from '@angular/router';
import { Login } from './login/login'
import { Signup } from './signup/signup'
import { Dashboard } from './dashboard/dashboard'
import { MyMemberships } from './my-memberships/my-memberships'
import { GroupSettings } from './group-settings/group-settings';
import { RequestHistory } from './request-history/request-history';
import { Chat } from './chat/chat';
import { SuperAdminDashboard } from './super-admin-dashboard/super-admin-dashboard';
import { SuperAdminAuditLog } from './super-admin-audit-log/super-admin-audit-log';
import { UserProfileSettings } from './user-profile-settings/user-profile-settings';

export const routes: Routes = 
[
    { path: 'login', component: Login},
    { path: 'signup', component: Signup},
    { path: '', component: Login },
    { path: 'dashboard', component: Dashboard},
    { path: 'my-memberships', component: MyMemberships},
    { path: 'group-settings', component: GroupSettings},
    { path: 'request-history', component: RequestHistory},
    { path: 'chat', component: Chat},
    { path: 'super-admin-dashboard', component: SuperAdminDashboard},
    { path: 'super-admin-audit-log', component: SuperAdminAuditLog},
    {path: 'user-profile-settings', component: UserProfileSettings},
];
