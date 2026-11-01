// backend/db.js reads process.env; give the browser an empty one.
const g = globalThis as any;
g.process ??= { env: {} };
g.process.env ??= {};
export {};
