import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { ChatMessage } from '../models/message';

const API_URL = 'http://localhost:3000/api';
const SOCKET_URL = 'http://localhost:3000';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket: Socket | null =
    typeof window !== 'undefined' ? io(SOCKET_URL) : null;

  constructor(private http: HttpClient) {}

  getRoomMessages(groupName: string, roomName: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(
      `${API_URL}/messages/${encodeURIComponent(groupName)}/${encodeURIComponent(roomName)}`
    );
  }

  deleteMessage(id: string): Observable<{ ok: boolean; message: string }> {
    return this.http.delete<{ ok: boolean; message: string }>(`${API_URL}/messages/${id}`);
  }

  joinRoom(groupName: string, roomName: string, username: string): void {
    this.socket?.emit('join-room', { groupName, roomName, username });
  }

  leaveRoom(groupName: string, roomName: string, username: string): void {
    this.socket?.emit('leave-room', { groupName, roomName, username });
  }

  sendMessage(msg: Partial<ChatMessage>): void {
    this.socket?.emit('send-message', msg);
  }

  onNewMessage(): Observable<ChatMessage> {
    return new Observable<ChatMessage>((observer) => {
      this.socket?.on('new-message', (msg: ChatMessage) => observer.next(msg));
      return () => this.socket?.off('new-message');
    });
  }

  onUserJoined(): Observable<{ username: string; roomName: string }> {
    return new Observable((observer) => {
      this.socket?.on('user-joined', (data) => observer.next(data));
      return () => this.socket?.off('user-joined');
    });
  }

  onUserLeft(): Observable<{ username: string; roomName: string }> {
    return new Observable((observer) => {
      this.socket?.on('user-left', (data) => observer.next(data));
      return () => this.socket?.off('user-left');
    });
  }
}
