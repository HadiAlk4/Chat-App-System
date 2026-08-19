import { Routes } from '@angular/router';
import { Login } from './login/login'
import { Signup } from './signup/signup'
import { Dashboard } from './dashboard/dashboard'
import { MyMemberships } from './my-memberships/my-memberships'

export const routes: Routes = [
    { path: 'login', component: Login},
    { path: 'signup', component: Signup},
    { path: '', component: Login },
    { path: 'dashboard', component: Dashboard},
    { path: 'my-memberships', component: MyMemberships},


];
