import { getDemoDb } from '../mini-db';

let counter = Math.floor(Math.random() * 0xffffff);

/** Minimal ObjectId: 24-char hex string, serialises to a plain string like the real driver does over HTTP. */
export class ObjectId {
  private readonly hex: string;
  constructor(id?: string | ObjectId) {
    if (id instanceof ObjectId) this.hex = id.toHexString();
    else if (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) this.hex = id.toLowerCase();
    else if (id === undefined) {
      const time = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
      const rand = Math.floor(Math.random() * 0xffffffffff).toString(16).padStart(10, '0');
      counter = (counter + 1) % 0xffffff;
      this.hex = time + rand + counter.toString(16).padStart(6, '0');
    } else throw new Error('input must be a 24 character hex string');
  }
  toHexString() { return this.hex; }
  toString() { return this.hex; }
  toJSON() { return this.hex; }
  equals(other: unknown) { return String(other) === this.hex; }
}

export class MongoClient {
  constructor(_url?: string) {}
  async connect() { return this; }
  db(_name?: string) { return getDemoDb(); }
  async close() {}
}
