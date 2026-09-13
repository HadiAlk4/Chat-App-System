import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Group } from '../models/group';
import { GroupRequest } from '../models/group-request';
import { Observable } from 'rxjs';
import { JoinRequest } from '../models/join-request';
import { RoomRequest } from '../models/room-request';

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

    getUserMemberships(username: string): Observable<Group[]> {
        return this.http.get<Group[]>(`${API_URL}/groups/user/${username}`);
    }

    leaveGroup(groupName: string, username: string): Observable<{ ok: boolean; message: string }> {
        return this.http.post<{ ok: boolean; message: string }>(
            `${API_URL}/groups/${groupName}/leave`,
            { username }
        );
    }

    getGroupByName(groupName: string): Observable<{ ok: boolean; group: Group }> {
        return this.http.get<{ ok: boolean; group: Group }>(`${API_URL}/groups/${groupName}`);
    }

    addRoomDirect(groupName: string, roomName: string): Observable<{ ok: boolean; message: string; rooms: string[] }> {
        return this.http.post<{ ok: boolean; message: string; rooms: string[] }>(
            `${API_URL}/groups/${groupName}/rooms/direct`,
            { roomName }
        );
    }

    renameRoom(groupName: string, oldName: string, newName: string): Observable<{ ok: boolean; message: string; rooms: string[] }> {
        return this.http.patch<{ ok: boolean; message: string; rooms: string[] }>(
            `${API_URL}/groups/${groupName}/rooms/rename`,
            { oldName, newName }
        );
    }

    deleteRoom(groupName: string, roomName: string): Observable<{ ok: boolean; message: string; rooms: string[] }> {
        return this.http.delete<{ ok: boolean; message: string; rooms: string[] }>(
            `${API_URL}/groups/${groupName}/rooms/${roomName}`
        );
    }

    promoteMember(groupName: string, username: string): Observable<{ ok: boolean; message: string }> {
        return this.http.patch<{ ok: boolean; message: string }>(
            `${API_URL}/groups/${groupName}/members/${username}/promote`,
            {}
        );
    }

    removeMember(groupName: string, username: string): Observable<{ ok: boolean; message: string }> {
        return this.http.post<{ ok: boolean; message: string }>(
            `${API_URL}/groups/${groupName}/members/${username}/remove`,
            {}
        );
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
        return this.http.post<{ok: boolean, message: string}>
        (`${API_URL}/join-requests`, {groupName, username});
    }

    getJoinRequests(params: { groupName?: string; username?: string; status?: string }): Observable<JoinRequest[]> {
        return this.http.get<JoinRequest[]>(`${API_URL}/join-requests`, { params });
    }

    approveJoinRequest(requestId: string): Observable<{ok: boolean, message: string}> {
        return this.http.patch<{ok: boolean, message: string}>
        (`${API_URL}/join-requests/${requestId}/approve`, {});
    }

    rejectJoinRequest(requestId: string, reason: string): Observable<{ok: boolean, message: string}> {
        return this.http.patch<{ok: boolean, message: string}>
        (`${API_URL}/join-requests/${requestId}/reject`, {reason});
    }

    submitRoomRequest(groupName: string, roomName: string, username: string): Observable<{ok: boolean, message: string}> {
        return this.http.post<{ok: boolean, message: string}>
        (`${API_URL}/room-requests`, {groupName, roomName, username});
    }

    getRoomRequests(params: { groupName?: string; username?: string; status?: string }): Observable<RoomRequest[]> {
        return this.http.get<RoomRequest[]>(`${API_URL}/room-requests`, { params });
    }

    approveRoomRequest(requestId: string): Observable<{ok: boolean, message: string}> {
        return this.http.patch<{ok: boolean, message: string}>
        (`${API_URL}/room-requests/${requestId}/approve`, {});
    }

    rejectRoomRequest(requestId: string, reason: string): Observable<{ok: boolean, message: string}> {
        return this.http.patch<{ok: boolean, message: string}>
        (`${API_URL}/room-requests/${requestId}/reject`, {reason});
    }
}
