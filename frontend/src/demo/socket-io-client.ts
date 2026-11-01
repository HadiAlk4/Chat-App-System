// Replaces the `socket.io-client` package in the demo build (see tsconfig.demo.json).
import { ClientSocket, fakeServer } from './fake-io';

export type Socket = ClientSocket;
export function io(_url?: string, _opts?: unknown): Socket {
  return fakeServer.connect();
}
export default io;
