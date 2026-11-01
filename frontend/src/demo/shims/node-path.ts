const join = (...parts: string[]) => parts.filter(Boolean).join('/').replace(/\/+/g, '/');
const dirname = (p: string) => p.replace(/\/[^/]*$/, '') || '/';
const extname = (p: string) => { const m = /\.[^./]*$/.exec(p); return m ? m[0] : ''; };
const path = { join, dirname, extname, resolve: join };
export default path;
export { join, dirname, extname };
