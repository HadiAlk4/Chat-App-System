import { Injectable } from '@angular/core';
import {  Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService 
{
    constructor(private router: Router) {}

    setUser(user: any): void
    {
        if(typeof window !== 'undefined')
        {
            sessionStorage.setItem('currentUser', JSON.stringify(user));
        }
    }

    // sessionStorage is per tab, so logging in elsewhere can't swap this tab's user
    getUser(): any
    {
        if(typeof window === 'undefined') return null;
        const data = sessionStorage.getItem('currentUser');
        return data ? JSON.parse(data) : null;
    }

    removeUser(): void
    {
        if(typeof window !== 'undefined')
        {
            sessionStorage.removeItem('currentUser');
            localStorage.removeItem('currentUser');
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('username');
            sessionStorage.removeItem('role');
        }
    }

    isLoggedIn(): boolean
    {
        const user = this.getUser();
        return user !== null && user !== undefined;
    }

    logout(): void
    {
        this.removeUser();
        this.router.navigate(['/login']);
    }
}
