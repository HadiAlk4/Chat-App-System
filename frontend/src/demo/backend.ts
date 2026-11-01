// Runs the project's real Express routes and socket handlers in the browser.
// tsconfig.demo.json points `mongodb`, `express`, `bcrypt`, `multer`, ... at ./shims.
// @ts-ignore - plain JS from the backend folder
import { connectDB } from '../../../backend/db.js';
// @ts-ignore
import { createApp } from '../../../backend/app.js';
// @ts-ignore
import { initChatSockets } from '../../../backend/sockets.js';
import { fakeServer } from './fake-io';
import { getDemoDb } from './mini-db';
import { MiniApp } from './mini-express';
import { seedDemoData } from './seed';
import { clearUploads } from './uploads';

const app: MiniApp = createApp(fakeServer);
initChatSockets(fakeServer);

export const backendReady: Promise<void> = (async () => {
  await connectDB();
  if (getDemoDb().isEmpty()) await seedDemoData(getDemoDb());
})();

export async function handle(request: Parameters<MiniApp['handle']>[0]) {
  await backendReady;
  return app.handle(request);
}

export async function resetDemo() {
  getDemoDb().reset();
  clearUploads();
  await seedDemoData(getDemoDb());
}
