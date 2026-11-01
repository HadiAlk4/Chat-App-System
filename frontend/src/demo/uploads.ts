/**
 * Uploaded images live in the browser (localStorage) instead of backend/uploads/.
 * The backend still hands out "/uploads/<file>" URLs; resolveUploads() swaps them for the stored image
 * on the way to the UI, so components render them unchanged.
 */
const STORAGE_KEY = 'fabulari-demo-uploads-v1';
let store: Record<string, string> = load();

function load(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => { if (e.key === STORAGE_KEY) store = load(); });
}

/** Shrinks big photos so a handful of uploads fit in localStorage. */
async function toDataUrl(file: Blob): Promise<string> {
  const original = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  if (file.type === 'image/gif') return original;
  try {
    const img = new Image();
    img.src = original;
    await img.decode();
    const scale = Math.min(1, 640 / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85);
  } catch { return original; }
}

export async function saveUpload(filename: string, file: Blob) {
  store[filename] = await toDataUrl(file);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch { /* full: keep it for this tab only */ }
}

/** Deep-copies a payload, replacing backend-relative asset URLs with ones that work on a static host. */
export function resolveUploads<T>(value: T): T {
  if (typeof value === 'string') {
    if (value.startsWith('/uploads/')) return (store[value.slice('/uploads/'.length)] ?? value) as any;
    if (value === '/pfp.png') return 'pfp.png' as any;
    return value;
  }
  if (Array.isArray(value)) return value.map(resolveUploads) as any;
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = resolveUploads(v);
    return out as T;
  }
  return value;
}

export function clearUploads() {
  store = {};
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
