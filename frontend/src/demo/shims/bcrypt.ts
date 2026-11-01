// The demo stores passwords with a trivial reversible prefix; nothing here is secret.
const PREFIX = 'demo$';
async function hash(password: string, _rounds?: number) { return PREFIX + password; }
async function compare(password: string, hashed: string) { return hashed === PREFIX + password; }
export default { hash, compare };
export { hash, compare };
