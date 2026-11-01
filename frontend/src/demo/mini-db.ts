import { ObjectId } from './shims/mongodb';

/**
 * A tiny in-memory MongoDB covering exactly what the backend uses:
 * find/findOne/insertOne/updateOne/updateMany/deleteOne/deleteMany/countDocuments,
 * sort/toArray, and the operators $set $setOnInsert $addToSet $pull $in $or $gte $lte (+ a few extras).
 * State is saved to localStorage so it survives reloads and is shared between tabs.
 */

type Doc = Record<string, any>;
const STORAGE_KEY = 'fabulari-demo-db-v2';

// ---------- value helpers ----------

function clone<T>(value: T): T {
  if (value instanceof ObjectId) return new ObjectId(value) as any;
  if (value instanceof Date) return new Date(value.getTime()) as any;
  if (Array.isArray(value)) return value.map(clone) as any;
  if (value && typeof value === 'object') {
    const out: Doc = {};
    for (const [k, v] of Object.entries(value)) out[k] = clone(v);
    return out as T;
  }
  return value;
}

function comparable(value: any): any {
  if (value instanceof ObjectId) return value.toHexString();
  if (value instanceof Date) return value.getTime();
  return value;
}

function equal(a: any, b: any): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => equal(v, b[i]));
  }
  if (a && b && typeof a === 'object' && typeof b === 'object' &&
      !(a instanceof ObjectId) && !(b instanceof ObjectId) && !(a instanceof Date) && !(b instanceof Date)) {
    const ka = Object.keys(a), kb = Object.keys(b);
    return ka.length === kb.length && ka.every((k) => equal(a[k], b[k]));
  }
  return comparable(a) === comparable(b);
}

function getPath(doc: Doc, path: string): any {
  return path.split('.').reduce((v, key) => (v == null ? undefined : v[key]), doc);
}

function setPath(doc: Doc, path: string, value: any) {
  const keys = path.split('.');
  let cur = doc;
  for (const key of keys.slice(0, -1)) cur = cur[key] ??= {};
  cur[keys[keys.length - 1]] = value;
}

const isOperatorObject = (v: any) =>
  v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof ObjectId) && !(v instanceof Date) &&
  Object.keys(v).length > 0 && Object.keys(v).every((k) => k.startsWith('$'));

// ---------- query matching ----------

function matchValue(actual: any, cond: any): boolean {
  if (isOperatorObject(cond)) {
    return Object.entries(cond).every(([op, arg]: [string, any]) => {
      const values = Array.isArray(actual) ? actual : [actual];
      switch (op) {
        case '$in': return (arg as any[]).some((a) => values.some((v) => equal(v, a)));
        case '$nin': return !(arg as any[]).some((a) => values.some((v) => equal(v, a)));
        case '$ne': return !values.some((v) => equal(v, arg));
        case '$eq': return values.some((v) => equal(v, arg));
        case '$gte': return values.some((v) => v != null && comparable(v) >= comparable(arg));
        case '$gt': return values.some((v) => v != null && comparable(v) > comparable(arg));
        case '$lte': return values.some((v) => v != null && comparable(v) <= comparable(arg));
        case '$lt': return values.some((v) => v != null && comparable(v) < comparable(arg));
        case '$exists': return (actual !== undefined) === Boolean(arg);
        default: throw new Error(`Demo DB: unsupported query operator ${op}`);
      }
    });
  }
  if (Array.isArray(actual) && !Array.isArray(cond)) return actual.some((v) => equal(v, cond));
  return equal(actual ?? null, cond ?? null) || (actual === undefined && cond === null);
}

function matches(doc: Doc, filter: Doc = {}): boolean {
  return Object.entries(filter).every(([key, cond]) => {
    if (key === '$or') return (cond as Doc[]).some((f) => matches(doc, f));
    if (key === '$and') return (cond as Doc[]).every((f) => matches(doc, f));
    return matchValue(getPath(doc, key), cond);
  });
}

// ---------- updates ----------

function applyUpdate(doc: Doc, update: Doc, inserting: boolean) {
  for (const [op, fields] of Object.entries(update)) {
    for (const [path, arg] of Object.entries(fields as Doc)) {
      const current = getPath(doc, path);
      switch (op) {
        case '$set': setPath(doc, path, clone(arg)); break;
        case '$setOnInsert': if (inserting) setPath(doc, path, clone(arg)); break;
        case '$unset': {
          const keys = path.split('.');
          const parent = keys.length > 1 ? getPath(doc, keys.slice(0, -1).join('.')) : doc;
          if (parent) delete parent[keys[keys.length - 1]];
          break;
        }
        case '$inc': setPath(doc, path, (current ?? 0) + arg); break;
        case '$push': {
          const list = Array.isArray(current) ? current : [];
          const items = arg?.$each ?? [arg];
          setPath(doc, path, [...list, ...items.map(clone)]);
          break;
        }
        case '$addToSet': {
          const list = Array.isArray(current) ? [...current] : [];
          for (const item of arg?.$each ?? [arg]) if (!list.some((v) => equal(v, item))) list.push(clone(item));
          setPath(doc, path, list);
          break;
        }
        case '$pull': {
          if (!Array.isArray(current)) break;
          setPath(doc, path, current.filter((v) => !matchValue(v, arg)));
          break;
        }
        default: throw new Error(`Demo DB: unsupported update operator ${op}`);
      }
    }
  }
}

// ---------- persistence ----------

function serialize(value: any): any {
  if (value instanceof ObjectId) return { $oid: value.toHexString() };
  if (value instanceof Date) return { $date: value.toISOString() };
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === 'object') {
    const out: Doc = {};
    for (const [k, v] of Object.entries(value)) if (v !== undefined) out[k] = serialize(v);
    return out;
  }
  return value;
}

function revive(value: any): any {
  if (Array.isArray(value)) return value.map(revive);
  if (value && typeof value === 'object') {
    if (typeof value.$oid === 'string') return new ObjectId(value.$oid);
    if (typeof value.$date === 'string') return new Date(value.$date);
    const out: Doc = {};
    for (const [k, v] of Object.entries(value)) out[k] = revive(v);
    return out;
  }
  return value;
}

// ---------- collections ----------

class Cursor {
  private sortSpec: Doc | null = null;
  private limitN = 0;
  constructor(private readonly docs: Doc[]) {}
  sort(spec: Doc) { this.sortSpec = spec; return this; }
  limit(n: number) { this.limitN = n; return this; }
  async toArray() {
    let out = this.docs.map(clone);
    if (this.sortSpec) {
      const entries = Object.entries(this.sortSpec);
      out.sort((a, b) => {
        for (const [key, dir] of entries) {
          const va = comparable(getPath(a, key)), vb = comparable(getPath(b, key));
          if (va < vb) return -dir; if (va > vb) return dir;
        }
        return 0;
      });
    }
    if (this.limitN) out = out.slice(0, this.limitN);
    return out;
  }
}

class Collection {
  constructor(private readonly store: MiniDb, private readonly name: string) {}
  private get docs(): Doc[] { return this.store.data[this.name] ??= []; }

  find(filter: Doc = {}) { return new Cursor(this.docs.filter((d) => matches(d, filter))); }
  async findOne(filter: Doc = {}) { const d = this.docs.find((x) => matches(x, filter)); return d ? clone(d) : null; }
  async countDocuments(filter: Doc = {}) { return this.docs.filter((d) => matches(d, filter)).length; }

  async insertOne(doc: Doc) {
    doc['_id'] ??= new ObjectId(); // the real driver also adds _id to the object passed in
    this.docs.push(clone(doc));
    this.store.save();
    return { acknowledged: true, insertedId: doc['_id'] };
  }

  async insertMany(docs: Doc[]) {
    const insertedIds = [];
    for (const d of docs) insertedIds.push((await this.insertOne(d)).insertedId);
    return { acknowledged: true, insertedIds };
  }

  private async update(filter: Doc, update: Doc, many: boolean, options: { upsert?: boolean } = {}) {
    const targets = this.docs.filter((d) => matches(d, filter));
    const hit = many ? targets : targets.slice(0, 1);
    for (const d of hit) applyUpdate(d, update, false);
    let upsertedId = null;
    if (hit.length === 0 && options.upsert) {
      const doc: Doc = {};
      for (const [k, v] of Object.entries(filter)) if (!k.startsWith('$') && !isOperatorObject(v)) setPath(doc, k, clone(v));
      applyUpdate(doc, update, true);
      upsertedId = (await this.insertOne(doc)).insertedId;
    }
    this.store.save();
    return { acknowledged: true, matchedCount: hit.length, modifiedCount: hit.length, upsertedCount: upsertedId ? 1 : 0, upsertedId };
  }
  updateOne(filter: Doc, update: Doc, options?: { upsert?: boolean }) { return this.update(filter, update, false, options); }
  updateMany(filter: Doc, update: Doc, options?: { upsert?: boolean }) { return this.update(filter, update, true, options); }

  private async remove(filter: Doc, many: boolean) {
    const before = this.docs.length;
    if (many) {
      this.store.data[this.name] = this.docs.filter((d) => !matches(d, filter));
    } else {
      const index = this.docs.findIndex((d) => matches(d, filter));
      if (index >= 0) this.docs.splice(index, 1);
    }
    this.store.save();
    return { acknowledged: true, deletedCount: before - this.docs.length };
  }
  deleteOne(filter: Doc) { return this.remove(filter, false); }
  deleteMany(filter: Doc) { return this.remove(filter, true); }
}

export class MiniDb {
  data: Record<string, Doc[]> = {};
  private readonly collections = new Map<string, Collection>();

  constructor() {
    this.load();
    // Another tab changed the data: pick it up so both tabs see the same world.
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => { if (e.key === STORAGE_KEY) this.load(); });
    }
  }

  collection(name: string) {
    if (!this.collections.has(name)) this.collections.set(name, new Collection(this, name));
    return this.collections.get(name)!;
  }

  async command(_cmd: Doc) { return { ok: 1 }; }

  isEmpty() { return Object.values(this.data).every((docs) => docs.length === 0); }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.data = raw ? revive(JSON.parse(raw)) : {};
    } catch { this.data = {}; }
  }

  save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(serialize(this.data))); } catch { /* storage full or blocked: keep working in memory */ }
  }

  reset() {
    this.data = {};
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }
}

let instance: MiniDb | null = null;
export function getDemoDb() { return (instance ??= new MiniDb()); }
