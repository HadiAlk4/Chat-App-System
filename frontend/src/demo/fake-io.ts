import { resolveUploads } from './uploads';

/**
 * In-browser replacement for Socket.io. The server half is handed to backend/sockets.js and the routes;
 * the client half replaces `socket.io-client` in the Angular services. Events are also relayed to other
 * open tabs through a BroadcastChannel, so two tabs logged in as different users can chat live.
 */

type Listener = (...args: any[]) => void;
const ALL = '*';

class Emitter {
  protected listeners = new Map<string, Set<Listener>>();
  on(event: string, fn: Listener) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
    return this;
  }
  off(event?: string, fn?: Listener) {
    if (!event) this.listeners.clear();
    else if (!fn) this.listeners.delete(event);
    else this.listeners.get(event)?.delete(fn);
    return this;
  }
  protected fire(event: string, ...args: any[]) {
    for (const fn of [...(this.listeners.get(event) ?? [])]) fn(...args);
  }
}

let nextId = 0;
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('fabulari-demo-socket') : null;

/** What the backend sees as "socket" in io.on('connection', socket => ...). */
class ServerSocket extends Emitter {
  readonly id = `demo-${Date.now().toString(36)}-${nextId++}`;
  readonly rooms = new Set<string>();
  data: Record<string, any> = {};
  constructor(private readonly server: FakeServer, readonly client: ClientSocket) { super(); }
  join(room: string) { this.rooms.add(room); }
  leave(room: string) { this.rooms.delete(room); }
  /** Emit to everyone in a room except this socket. */
  to(room: string) { return { emit: (event: string, data?: any) => this.server.broadcast(room, event, data, this) }; }
  /** Server -> this client. */
  emit(event: string, data?: any) { this.client.receive(event, data); return true; }
  receiveFromClient(event: string, args: any[]) { queueMicrotask(() => this.fire(event, ...args)); }
}

/** What the Angular app gets from io(). */
export class ClientSocket extends Emitter {
  connected = true;
  server!: ServerSocket;
  get id() { return this.server.id; }
  emit(event: string, ...args: any[]) { this.server.receiveFromClient(event, args); return this; }
  receive(event: string, data: any) {
    const payload = JSON.parse(JSON.stringify(data ?? null));
    queueMicrotask(() => this.fire(event, resolveUploads(payload)));
  }
  disconnect() { this.connected = false; this.server.receiveFromClient('disconnect', []); return this; }
  connect() { this.connected = true; return this; }
}

export class FakeServer extends Emitter {
  private readonly sockets = new Set<ServerSocket>();
  // Presence ("In this room") is tracked per tab by backend/sockets.js; merge the lists across tabs.
  private readonly tabId = Math.random().toString(36).slice(2);
  private readonly localPresence = new Map<string, string[]>();
  private readonly remotePresence = new Map<string, Map<string, string[]>>();

  constructor() {
    super();
    channel?.addEventListener('message', (e: MessageEvent) => {
      const { room, event, data, from, reply } = e.data;
      if (event === 'room-users') {
        if (!this.remotePresence.has(room)) this.remotePresence.set(room, new Map());
        this.remotePresence.get(room)!.set(from, data.users);
        // A tab just changed presence in this room: tell it who is here from this tab.
        if (!reply && this.localPresence.get(room)?.length) this.post(room, event, { ...data, users: this.localPresence.get(room) }, true);
      }
      this.deliver(room, event, data, null);
    });
    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', () => {
        for (const room of this.localPresence.keys()) this.post(room, 'room-users', { users: [] }, true);
      });
    }
  }

  private post(room: string, event: string, data: any, reply = false) {
    try { channel?.postMessage({ room, event, data: JSON.parse(JSON.stringify(data ?? null)), from: this.tabId, reply }); } catch { /* ignore */ }
  }

  private withMergedPresence(room: string, data: any) {
    const users = new Set<string>(this.localPresence.get(room) ?? []);
    for (const list of this.remotePresence.get(room)?.values() ?? []) list.forEach((u) => users.add(u));
    return { ...data, users: [...users] };
  }

  connect(): ClientSocket {
    const client = new ClientSocket();
    const socket = new ServerSocket(this, client);
    client.server = socket;
    this.sockets.add(socket);
    socket.on('disconnect', () => this.sockets.delete(socket));
    queueMicrotask(() => { this.fire('connection', socket); client.receive('connect', null); });
    return client;
  }

  private deliver(room: string, event: string, data: any, except: ServerSocket | null) {
    if (event === 'room-users') data = this.withMergedPresence(room, data);
    for (const s of this.sockets) {
      if (s === except) continue;
      if (room === ALL || s.rooms.has(room)) s.emit(event, data);
    }
  }

  broadcast(room: string, event: string, data: any, except: ServerSocket | null) {
    if (event === 'room-users') this.localPresence.set(room, data?.users ?? []);
    this.deliver(room, event, data, except);
    this.post(room, event, data);
    return true;
  }

  // The parts of the Socket.io server API the backend calls.
  emit(event: string, data?: any) { return this.broadcast(ALL, event, data, null); }
  to(room: string) { return { emit: (event: string, data?: any) => this.broadcast(room, event, data, null) }; }
}

export const fakeServer = new FakeServer();
