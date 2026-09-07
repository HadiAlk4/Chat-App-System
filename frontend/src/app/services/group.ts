import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Group } from '../models/group';
import { GroupRequest } from '../models/group-request';
import { Observable } from 'rxjs';
import { JoinRequest } from '../models/join-request';

const API_URL = 'http://localhost:3000/api';

@Injectable({
    providedIn: 'root'
})

export class GroupService // why not group
{
    constructor(private http: HttpClient) {}

    getGroups(): Observable<Group[]> {
        return this.http.get<Group[]>(`${API_URL}/groups`);
    }

    submitProposal(
        group: Group,
        creatorUserName: string,
        creatorEmail: string
    ): Observable<{ok: boolean, message: string}>
    {
        return this.http.post<{ok: boolean, message: string}>(`${API_URL}/group-requests`,
            {
                groupName: group.groupName,
                groupDescription: group.groupDescription,
                minAge: group.minAge,
                themeColor: group.themeColor,
                creatorUserName,
                creatorEmail,
            }
        );
    }

    getPendingRequests(): Observable<GroupRequest[]> {
        return this.http.get<GroupRequest[]>(`${API_URL}/group-requests?status=pending`);
    }

    approveRequest(requestId: string): Observable<{ok: boolean, message: string}> {
        return this.http.patch<{ok: boolean, message: string}>(`${API_URL}/group-requests/${requestId}/approve`, {});
    }

    rejectRequest(requestId: string, reason: string): Observable<{ok: boolean, message: string}> {
        return this.http.patch<{ok: boolean, message: string}>(`${API_URL}/group-requests/${requestId}/reject`, {reason});
    }

    submitJoinRequest(groupName: string, username: string)
    {
        return this.http.post<{ok: boolean, message: string}>(`${API_URL}/join-requests`, {groupName, username});
    }

    getJoinRequests(groupName: string): Observable<JoinRequest[]> {
        return this.http.get<JoinRequest[]>(`${API_URL}/join-requests?groupName=${groupName}`);
    }

    approveJoinRequest(requestId: string): Observable<{ok: boolean, message: string}> {
        return this.http.patch<{ok: boolean, message: string}>(`${API_URL}/join-requests/${requestId}/approve`, {});
    }

    rejectJoinRequest(requestId: string, reason: string): Observable<{ok: boolean, message: string}> {
        return this.http.patch<{ok: boolean, message: string}>(`${API_URL}/join-requests/${requestId}/reject`, {reason});
    }
}
