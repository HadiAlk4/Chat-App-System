import { Service } from '@angular/core';
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
            localStorage.setItem('currentUser', JSON.stringify(user));
        }
    }

    getUser(): any
    {
        if(typeof window === 'undefined') return null;
        const data = localStorage.getItem('currentUser');
        return data ? JSON.parse(data) : null;
    }

    removeUser(): void
    {
        if(typeof window !== 'undefined')
        {
            localStorage.removeItem('currentUser');
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
