import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, merge, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { GroupService } from './group';
import { SocketService } from './socket';

export interface TrackedRequest {
  _id?: string;
  status: 'pending' | 'approved' | 'rejected';
}

type Resolved = { requestId: string; status: 'approved' | 'rejected' };

@Injectable({
  providedIn: 'root'
})
export class PendingRequestsService {
  private readonly groupService = inject(GroupService);
  private readonly socketService = inject(SocketService);

  readonly requests = signal<TrackedRequest[]>([]);
  readonly pendingCount = computed(() => this.requests().filter((r) => r.status === 'pending').length);

  // Loads every request the user has sent, then keeps the list in sync with socket events
  track(username: string, destroyRef: DestroyRef): void {
    if (!username) return;

    forkJoin([
      this.groupService.getJoinRequests({ username }),
      this.groupService.getGroupRequests({ creatorUserName: username }),
      this.groupService.getRoomRequests({ username }),
      this.groupService.getGroupBanRequests({ requestedBy: username }),
      this.groupService.getGroupDeletionRequests({ requestedBy: username }),
    ]).subscribe({
      next: (lists) => this.requests.set(lists.flat()),
      error: (err) => console.error('Failed to load pending requests:', err),
    });

    const s = this.socketService;
    const created: Observable<TrackedRequest>[] = [
      s.onJoinRequestCreated().pipe(filter((r) => r.username === username)),
      s.onGroupRequestCreated().pipe(filter((r) => r.creatorUserName === username)),
      s.onRoomRequestCreated().pipe(filter((r) => r.username === username)),
      s.onGroupBanRequestCreated().pipe(filter((r) => r.requestedBy === username)),
      s.onGroupDeletionRequestCreated().pipe(filter((r) => r.requestedBy === username)),
    ];
    const resolved: Observable<Resolved>[] = [
      s.onJoinRequestResolved(),
      s.onGroupRequestResolved(),
      s.onRoomRequestResolved(),
      s.onGroupBanRequestResolved(),
      s.onGroupDeletionRequestResolved(),
    ];

    merge(...created)
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((request) => this.add(request));

    merge(...resolved)
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(({ requestId, status }) => this.resolve(requestId, status));
  }

  add(request: TrackedRequest): void {
    this.requests.update((list) =>
      list.some((r) => r._id && r._id === request._id) ? list : [request, ...list]
    );
  }

  resolve(requestId: string, status: 'approved' | 'rejected'): void {
    this.requests.update((list) =>
      list.map((r) => (String(r._id) === String(requestId) ? { ...r, status } : r))
    );
  }
}
