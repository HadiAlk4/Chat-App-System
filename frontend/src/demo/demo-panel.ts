import { DEMO_ACCOUNTS, DEMO_PASSWORD } from './seed';
import { resetDemo } from './backend';

/**
 * Demo chrome, outside Angular (plain DOM):
 * - a start screen where visitors pick "User demo" or "Super Admin demo",
 * - a small "Switch demo" button to get back to it later.
 * Choosing a demo logs in through the real login form.
 */

const CHOICES = [
  {
    email: 'alex@demo.com',
    title: 'User demo',
    who: 'Log in as alex, a regular user',
    points: [
      'Browse and request to join groups',
      'Chat live in group rooms, share images',
      'Run your own group: rooms, members, join requests',
    ],
  },
  {
    email: 'sam@demo.com',
    title: 'Super Admin demo',
    who: 'Log in as sam, the platform Super Admin',
    points: [
      'Approve or reject new group proposals',
      'Handle group deletion and ban requests',
      'Review everything in the audit log',
    ],
  },
];

const CSS = `
#demo-start { position: fixed; inset: 0; z-index: 10001; overflow-y: auto; color: #2b2b2b;
  background: #fdfaf3 repeating-linear-gradient(#fdfaf3 0 39px, #c9c4b6 39px 40px); }
#demo-start[hidden] { display: none; }
#demo-start .demo-wrap { max-width: 860px; margin: 0 auto; padding: 48px 16px 32px; text-align: center; }
#demo-start h1 { font-size: clamp(2.6rem, 8vw, 4rem); margin: 0; letter-spacing: 1px; }
#demo-start .demo-sub { font-size: 1.3rem; margin: 4px 0 32px; color: #555; }
#demo-start .demo-choices { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; align-items: stretch; }
#demo-start .demo-choice { background: #fff; border: 2px solid #2b2b2b; border-radius: 14px 4px 14px 4px;
  box-shadow: 5px 5px 0 #2b2b2b; padding: 22px 22px 18px; text-align: left; display: flex; flex-direction: column; height: 100%; margin: 0; cursor: pointer; font: inherit; color: inherit;
  transition: transform .12s, box-shadow .12s; }
#demo-start .demo-choice:hover, #demo-start .demo-choice:focus-visible { transform: translate(-2px, -2px); box-shadow: 7px 7px 0 #2b2b2b; outline: none; }
#demo-start .demo-choice h2 { margin: 0 0 4px; font-size: 1.9rem; }
#demo-start .demo-choice .demo-who { margin: 0 0 12px; color: #666; }
#demo-start .demo-choice ul { flex: 1; margin: 0 0 18px; padding-left: 1.2em; }
#demo-start .demo-choice li { margin: 4px 0; }
#demo-start .demo-go { display: block; text-align: center; padding: 8px; border: 2px solid #2b2b2b; border-radius: 8px;
  font-size: 1.2rem; }
#demo-start .demo-user .demo-go { background: #fff3c4; }
#demo-start .demo-admin .demo-go { background: #d7e6f7; }
#demo-start .demo-foot { margin-top: 32px; color: #555; font-size: 1rem; }
#demo-start .demo-foot p { margin: 6px 0; }
#demo-start .demo-link { background: none; border: none; padding: 0 2px; color: #4a4ad0; cursor: pointer; font: inherit; text-decoration: underline; }
#demo-switch { position: fixed; left: 16px; bottom: 16px; z-index: 10000; background: #fff3c4; color: #2b2b2b;
  border: 2px solid #2b2b2b; border-radius: 999px; padding: 6px 14px; cursor: pointer; box-shadow: 2px 2px 0 #2b2b2b; font: inherit; }
`;

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function waitFor<T>(find: () => T | null, timeout = 4000): Promise<T | null> {
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
  await sleep(100);
  button.click();
}

const isLoggedIn = () => {
  try { return Boolean(sessionStorage.getItem('currentUser')); } catch { return false; }
};

export function mountDemoPanel() {
  if (document.getElementById('demo-start')) return;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const others = DEMO_ACCOUNTS.filter((a) => !CHOICES.some((c) => c.email === a.email));

  const start = document.createElement('div');
  start.id = 'demo-start';
  start.setAttribute('role', 'dialog');
  start.setAttribute('aria-label', 'Choose a demo');
  start.innerHTML = `
    <div class="demo-wrap">
      <h1>Fabulari</h1>
      <p class="demo-sub">grab a pen, start a chat. Pick a demo to explore.</p>
      <div class="demo-choices">
        ${CHOICES.map((c, i) => `
          <button class="demo-choice ${i === 0 ? 'demo-user' : 'demo-admin'}" data-email="${c.email}">
            <h2>${c.title}</h2>
            <p class="demo-who">${c.who}</p>
            <ul>${c.points.map((p) => `<li>${p}</li>`).join('')}</ul>
            <span class="demo-go">Start ${c.title.replace(' demo', '').toLowerCase()} demo →</span>
          </button>`).join('')}
      </div>
      <div class="demo-foot">
        <p>All data is made up and lives only in your browser.</p>
        <p>Other accounts:
          ${others.map((a) => `<button class="demo-link" data-email="${a.email}" title="${a.note}">${a.username}</button>`).join(' · ')}
          (password <code>${DEMO_PASSWORD}</code>). Open two tabs as different users to see live chat.</p>
        <p><button class="demo-link" data-action="reset">Reset demo data</button></p>
      </div>
    </div>`;
  document.body.appendChild(start);

  const switcher = document.createElement('button');
  switcher.id = 'demo-switch';
  switcher.textContent = 'Switch demo';
  document.body.appendChild(switcher);

  const show = (open: boolean) => {
    start.hidden = !open;
    switcher.hidden = open;
    if (open) start.querySelector<HTMLButtonElement>('.demo-choice')?.focus();
  };
  show(!isLoggedIn());

  switcher.addEventListener('click', () => show(true));
  start.addEventListener('click', async (e) => {
    const target = (e.target as HTMLElement).closest('button');
    if (!target) return;
    if (target.dataset['action'] === 'reset') {
      if (!confirm('Reset all demo data back to the start?')) return;
      await resetDemo();
      sessionStorage.clear();
      location.hash = '#/login';
      location.reload();
      return;
    }
    if (target.dataset['email']) {
      show(false);
      await loginAs(target.dataset['email']);
    }
  });
  // Esc closes the chooser if someone is already logged in in this tab.
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !start.hidden && isLoggedIn()) show(false); });
}
