import { DEMO_ACCOUNTS, DEMO_PASSWORD } from './seed';
import { resetDemo } from './backend';

/**
 * A small floating card (plain DOM, outside Angular) that explains the demo and logs in as any
 * sample account by filling in the real login form.
 */

const CSS = `
#demo-panel { position: fixed; left: 16px; bottom: 16px; z-index: 10000; font: 14px/1.4 system-ui, sans-serif;
  color: #1f1f1f; max-width: min(320px, calc(100vw - 32px)); }
#demo-panel .demo-toggle { background: #fff3c4; color: #1f1f1f; border: 2px solid #1f1f1f; border-radius: 999px;
  padding: 6px 14px; font-weight: 600; cursor: pointer; box-shadow: 2px 2px 0 #1f1f1f; }
#demo-panel .demo-card { background: #fffdf5; border: 2px solid #1f1f1f; border-radius: 12px; padding: 12px 14px;
  box-shadow: 3px 3px 0 #1f1f1f; margin-bottom: 8px; }
#demo-panel h3 { margin: 0 0 4px; font-size: 15px; }
#demo-panel p { margin: 0 0 8px; color: #4a4a4a; font-size: 13px; }
#demo-panel ul { list-style: none; margin: 0 0 8px; padding: 0; display: grid; gap: 4px; }
#demo-panel li::before { content: none; }
#demo-panel .demo-account { width: 100%; text-align: left; background: #fff; border: 1px solid #c9c2a8; border-radius: 8px;
  padding: 6px 8px; cursor: pointer; color: inherit; font: inherit; }
#demo-panel .demo-account:hover { background: #fff3c4; }
#demo-panel .demo-account b { font-weight: 600; }
#demo-panel .demo-account span { display: block; font-size: 12px; color: #6a6a6a; }
#demo-panel .demo-actions { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 12px; }
#demo-panel .demo-link { background: none; border: none; padding: 0; color: #5a5ad6; cursor: pointer; font: inherit; text-decoration: underline; }
`;

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function waitFor<T>(find: () => T | null, timeout = 3000): Promise<T | null> {
  const end = Date.now() + timeout;
  while (Date.now() < end) { const v = find(); if (v) return v; await sleep(50); }
  return null;
}

function setInput(input: HTMLInputElement, value: string) {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

async function loginAs(email: string) {
  // Log out of this tab first, then use the real login form.
  for (const key of ['currentUser', 'user', 'username', 'role']) sessionStorage.removeItem(key);
  if (!location.hash.startsWith('#/login')) location.hash = '#/login';
  const emailInput = await waitFor(() => document.querySelector<HTMLInputElement>('#emailInput'));
  const passwordInput = document.querySelector<HTMLInputElement>('#passwordInput');
  const button = document.querySelector<HTMLButtonElement>('.torn-notepad button');
  if (!emailInput || !passwordInput || !button) return;
  setInput(emailInput, email);
  setInput(passwordInput, DEMO_PASSWORD);
  await sleep(150);
  button.click();
}

export function mountDemoPanel() {
  if (document.getElementById('demo-panel')) return;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'demo-panel';
  root.innerHTML = `
    <div class="demo-card" hidden>
      <h3>Fabulari demo</h3>
      <p>Everything runs in your browser with sample data. Pick an account to log in as (password <code>${DEMO_PASSWORD}</code>).</p>
      <ul>${DEMO_ACCOUNTS.map((a) => `
        <li><button class="demo-account" data-email="${a.email}">
          <b>${a.username}</b> · ${a.label}<span>${a.note}</span>
        </button></li>`).join('')}
      </ul>
      <p>Tip: open a second tab as another user to see live chat and requests update.</p>
      <div class="demo-actions">
        <button class="demo-link" data-action="reset">Reset demo data</button>
        <button class="demo-link" data-action="hide">Hide</button>
      </div>
    </div>
    <button class="demo-toggle" aria-expanded="false">Demo accounts</button>`;
  document.body.appendChild(root);

  const card = root.querySelector<HTMLElement>('.demo-card')!;
  const toggle = root.querySelector<HTMLButtonElement>('.demo-toggle')!;
  const setOpen = (open: boolean) => { card.hidden = !open; toggle.setAttribute('aria-expanded', String(open)); };
  // Start open on the login page so first-time visitors see how to get in.
  setOpen(location.hash === '' || location.hash.startsWith('#/login'));

  root.addEventListener('click', async (e) => {
    const target = (e.target as HTMLElement).closest('button');
    if (!target) return;
    if (target === toggle) return setOpen(card.hidden === true);
    if (target.dataset['action'] === 'hide') return setOpen(false);
    if (target.dataset['action'] === 'reset') {
      if (!confirm('Reset all demo data back to the start?')) return;
      await resetDemo();
      sessionStorage.clear();
      location.hash = '#/login';
      location.reload();
      return;
    }
    if (target.dataset['email']) { setOpen(false); await loginAs(target.dataset['email']); }
  });
}
