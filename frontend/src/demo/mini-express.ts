/** Just enough of Express for the backend's route files: app.get/post/patch/put/delete/use with :params. */

type Handler = (req: any, res: any, next: () => void) => unknown;
interface Route { method: string; pattern: RegExp | null; keys: string[]; handlers: Handler[] }

export interface DemoRequest {
  method: string;
  path: string;
  query: Record<string, string>;
  body: any;
  formData?: FormData;
}
export interface DemoResponse { status: number; body: any }

function compile(path: string | RegExp): { pattern: RegExp; keys: string[] } {
  if (path instanceof RegExp) return { pattern: path, keys: [] };
  const keys: string[] = [];
  const source = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\/:(\w+)/g, (_m, key) => {
    keys.push(key);
    return '/([^/]+)';
  });
  return { pattern: new RegExp(`^${source}/?$`), keys };
}

export class MiniApp {
  private readonly routes: Route[] = [];

  private add(method: string, path: string | RegExp | null, handlers: Handler[]) {
    if (path === null) { this.routes.push({ method, pattern: null, keys: [], handlers }); return; }
    const { pattern, keys } = compile(path);
    this.routes.push({ method, pattern, keys, handlers });
  }

  use(first: any, ...rest: Handler[]) {
    if (typeof first === 'function') this.add('USE', null, [first, ...rest]);
    else this.add('USE', new RegExp(`^${first}`), rest);
  }
  get(path: string | RegExp, ...h: Handler[]) { this.add('GET', path, h); }
  post(path: string | RegExp, ...h: Handler[]) { this.add('POST', path, h); }
  patch(path: string | RegExp, ...h: Handler[]) { this.add('PATCH', path, h); }
  put(path: string | RegExp, ...h: Handler[]) { this.add('PUT', path, h); }
  delete(path: string | RegExp, ...h: Handler[]) { this.add('DELETE', path, h); }

  async handle(request: DemoRequest): Promise<DemoResponse> {
    return new Promise<DemoResponse>((resolve) => {
      let statusCode = 200;
      const res = {
        status(code: number) { statusCode = code; return res; },
        send(body: any) { resolve({ status: statusCode, body: body === undefined ? null : JSON.parse(JSON.stringify(body)) }); return res; },
        json(body: any) { return res.send(body); },
        sendFile() { resolve({ status: 404, body: null }); return res; },
      };

      const stack: { handler: Handler; params: Record<string, string> }[] = [];
      for (const route of this.routes) {
        if (route.method !== 'USE' && route.method !== request.method) continue;
        let params: Record<string, string> = {};
        if (route.pattern) {
          const m = route.pattern.exec(request.path);
          if (!m) continue;
          params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
        }
        for (const handler of route.handlers) stack.push({ handler, params });
      }

      const req: any = { ...request, params: {}, headers: {} };
      let i = 0;
      const next = async () => {
        const layer = stack[i++];
        if (!layer) { resolve({ status: 404, body: { ok: false, message: `Cannot ${request.method} ${request.path}` } }); return; }
        req.params = layer.params;
        try { await layer.handler(req, res, next); }
        catch (err: any) { resolve({ status: 500, body: { ok: false, message: err?.message ?? 'Server error' } }); }
      };
      next();
    });
  }
}
