import { MiniApp } from '../mini-express';

function express() { return new MiniApp(); }
express.json = () => (_req: unknown, _res: unknown, next: () => void) => next();
express.static = (_dir: string, _opts?: unknown) => (_req: unknown, _res: unknown, next: () => void) => next();
export default express;
