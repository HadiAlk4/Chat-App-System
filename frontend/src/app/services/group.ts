import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Group } from '../models/group';
import { GroupRequest } from '../models/group-request';
import { Observable } from 'rxjs';
import { JoinRequest } from '../models/join-request';
import { RoomRequest } from '../models/room-request';
import { GroupBanRequest } from '../models/group-ban-request';

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
        return this.http.get<{ ok: boolean; group: Group }>(`${API_URL}/groups/${encodeURIComponent(groupName)}`);
    }

    updateGroup(
        currentGroupName: string,
        payload: { groupName: string; groupDescription: string; minAge: number; themeColor: 'light' | 'dark' }
    ): Observable<{ ok: boolean; message: string; group: Group }> {
        return this.http.patch<{ ok: boolean; message: string; group: Group }>(
            `${API_URL}/groups/${encodeURIComponent(currentGroupName)}`,
            payload
        );
    }

    addRoomDirect(groupName: string, roomName: string): Observable<{ ok: boolean; message: string; rooms: string[] }> {
        return this.http.post<{ ok: boolean; message: string; rooms: string[] }>(
            `${API_URL}/groups/${encodeURIComponent(groupName)}/rooms/direct`,
            { roomName }
        );
    }

    renameRoom(groupName: string, oldName: string, newName: string): Observable<{ ok: boolean; message: string; rooms: string[] }> {
        return this.http.patch<{ ok: boolean; message: string; rooms: string[] }>(
            `${API_URL}/groups/${encodeURIComponent(groupName)}/rooms/rename`,
            { oldName, newName }
        );
    }

    deleteRoom(groupName: string, roomName: string): Observable<{ ok: boolean; message: string; rooms: string[] }> {
        return this.http.delete<{ ok: boolean; message: string; rooms: string[] }>(
            `${API_URL}/groups/${encodeURIComponent(groupName)}/rooms/${encodeURIComponent(roomName)}`
        );
    }

    promoteMember(groupName: string, username: string): Observable<{ ok: boolean; message: string }> {
        return this.http.patch<{ ok: boolean; message: string }>(
            `${API_URL}/groups/${encodeURIComponent(groupName)}/members/${encodeURIComponent(username)}/promote`,
            {}
        );
    }

    removeMember(groupName: string, username: string): Observable<{ ok: boolean; message: string }> {
        return this.http.post<{ ok: boolean; message: string }>(
            `${API_URL}/groups/${encodeURIComponent(groupName)}/members/${encodeURIComponent(username)}/remove`,
            {}
        );
    }

    banMember(groupName: string, username: string): Observable<{
        ok: boolean;
        message: string;
        members?: string[];
        admins?: string[];
        bannedMembers?: string[];
    }> {
        return this.http.post<{
            ok: boolean;
            message: string;
            members?: string[];
            admins?: string[];
            bannedMembers?: string[];
        }>(
            `${API_URL}/groups/${encodeURIComponent(groupName)}/members/${encodeURIComponent(username)}/ban`,
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

    submitGroupBanRequest(
        groupName: string,
        targetUsername: string,
        requestedBy: string
    ): Observable<{ ok: boolean; message: string; request?: GroupBanRequest }> {
        return this.http.post<{ ok: boolean; message: string; request?: GroupBanRequest }>(
            `${API_URL}/group-ban-requests`,
            { groupName, targetUsername, requestedBy }
        );
    }

    getGroupBanRequests(params: {
        groupName?: string;
        status?: string;
        destination?: string;
        requestedBy?: string;
    }): Observable<GroupBanRequest[]> {
        return this.http.get<GroupBanRequest[]>(`${API_URL}/group-ban-requests`, { params });
    }

    approveGroupBanRequest(requestId: string): Observable<{ ok: boolean; message: string }> {
        return this.http.patch<{ ok: boolean; message: string }>(
            `${API_URL}/group-ban-requests/${requestId}/approve`,
            {}
        );
    }

    rejectGroupBanRequest(requestId: string, reason: string): Observable<{ ok: boolean; message: string }> {
        return this.http.patch<{ ok: boolean; message: string }>(
            `${API_URL}/group-ban-requests/${requestId}/reject`,
            { reason }
        );
    }

    stepDownAsAdmin(groupName: string, username: string): Observable<{
        ok: boolean;
        message: string;
        role?: string;
        admins?: string[];
        members?: string[];
    }> {
        return this.http.post<{
            ok: boolean;
            message: string;
            role?: string;
            admins?: string[];
            members?: string[];
        }>(
            `${API_URL}/groups/${encodeURIComponent(groupName)}/admins/${encodeURIComponent(username)}/step-down`,
            {}
        );
    }
}
