import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { GroupRequest } from '../models/group-request';
import { JoinRequest } from '../models/join-request';
import { RoomRequest } from '../models/room-request';
import { AccountDeletionRequest } from '../models/account-deletion-request';
import { GroupBanRequest } from '../models/group-ban-request';
import { GroupDeletionRequest } from '../models/group-deletion-request';

const SOCKET_URL = 'http://localhost:3000';

interface GroupRequestResolved {
  requestId: string;
  status: 'approved' | 'rejected';
}

interface JoinRequestResolved {
  requestId: string;
  status: 'approved' | 'rejected';
  groupName: string;
  username: string;
}

interface RoomRequestResolved {
  requestId: string;
  status: 'approved' | 'rejected';
  groupName: string;
  roomName: string;
}

interface AccountDeletionRequestResolved {
  requestId: string;
  status: 'approved' | 'rejected';
  username?: string;
  email?: string;
}

interface GroupBanRequestResolved {
  requestId: string;
  status: 'approved' | 'rejected';
  groupName: string;
  destination: 'group-admin' | 'super-admin';
}

interface GroupDeletionRequestResolved {
  requestId: string;
  status: 'approved' | 'rejected';
  groupName: string;
}

interface RoomsUpdated {
  groupName: string;
  rooms: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private readonly socket: Socket | null =
    typeof window !== 'undefined' ? io(SOCKET_URL) : null;

  onGroupRequestCreated(): Observable<GroupRequest> {
    return this.listen<GroupRequest>('group-request-created');
  }

  onGroupRequestResolved(): Observable<GroupRequestResolved> {
    return this.listen<GroupRequestResolved>('group-request-resolved');
  }

  onJoinRequestCreated(): Observable<JoinRequest> {
    return this.listen<JoinRequest>('join-request-created');
  }

  onJoinRequestResolved(): Observable<JoinRequestResolved> {
    return this.listen<JoinRequestResolved>('join-request-resolved');
  }

  onRoomRequestCreated(): Observable<RoomRequest> {
    return this.listen<RoomRequest>('room-request-created');
  }

  onRoomRequestResolved(): Observable<RoomRequestResolved> {
    return this.listen<RoomRequestResolved>('room-request-resolved');
  }

  onAccountDeletionRequestCreated(): Observable<AccountDeletionRequest> {
    return this.listen<AccountDeletionRequest>('account-deletion-request-created');
  }

  onAccountDeletionRequestResolved(): Observable<AccountDeletionRequestResolved> {
    return this.listen<AccountDeletionRequestResolved>('account-deletion-request-resolved');
  }

  onGroupBanRequestCreated(): Observable<GroupBanRequest> {
    return this.listen<GroupBanRequest>('group-ban-request-created');
  }

  onGroupBanRequestResolved(): Observable<GroupBanRequestResolved> {
    return this.listen<GroupBanRequestResolved>('group-ban-request-resolved');
  }

  onGroupDeletionRequestCreated(): Observable<GroupDeletionRequest> {
    return this.listen<GroupDeletionRequest>('group-deletion-request-created');
  }

  onGroupDeletionRequestResolved(): Observable<GroupDeletionRequestResolved> {
    return this.listen<GroupDeletionRequestResolved>('group-deletion-request-resolved');
  }

  onRoomsUpdated(): Observable<RoomsUpdated> {
    return this.listen<RoomsUpdated>('rooms-updated');
  }

  private listen<T>(eventName: string): Observable<T> {
    return new Observable<T>(subscriber => {
      if (!this.socket) {
        subscriber.complete();
        return;
      }

      const handler = (value: T) => subscriber.next(value);
      this.socket.on(eventName, handler);

      return () => this.socket?.off(eventName, handler);
    });
  }
}
