// The account page (/me/): sign in with Keycloak, rename the gnome, sign out, delete the account.
// Plain DOM. Server and user text only ever goes in through textContent, never innerHTML.
import {
  accountsEnabled,
  completeSignIn,
  hasStoredSession,
  signIn,
  signOut,
  userClient,
  ConnectError,
  Code,
} from '@lawn/platform';
import { ConnectGnomeStore, createGnomeStore, GnomeStoreError } from '@lawn/gnome';
import { checkName, NAME_MAX } from '@lawn/mp';

type PageState = 'unavailable' | 'loading' | 'signed-out' | 'signed-in' | 'error';

const ui = document.getElementById('ui')!;
const root = document.createElement('main');
root.id = 'me';
root.dataset.state = 'loading';
ui.appendChild(root);

// ------------------------------------------------------------------ DOM helpers

interface Opts {
  text?: string;
  cls?: string;
  attrs?: Record<string, string>;
  onClick?: () => void | Promise<void>;
}

function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  o: Opts = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (o.text !== undefined) e.textContent = o.text;
  if (o.cls) e.className = o.cls;
  if (o.attrs) for (const [k, v] of Object.entries(o.attrs)) e.setAttribute(k, v);
  if (o.onClick) {
    const handler = o.onClick;
    e.addEventListener('click', () => void handler());
  }
  e.append(...children);
  return e;
}

function button(text: string, onClick: () => void | Promise<void>, cls = ''): HTMLButtonElement {
  return h('button', { text, cls, attrs: { type: 'button' }, onClick });
}

function link(text: string, href: string): HTMLAnchorElement {
  return h('a', { text, cls: 'link', attrs: { href } });
}

/** Replaces the page content, keeping the header (back link and title). */
function show(state: PageState, body: Node[]): void {
  root.dataset.state = state;
  root.replaceChildren(
    h('a', { text: '← Arcade', cls: 'back', attrs: { href: '../' } }),
    h('h1', { text: 'Your Gnome' }),
    ...body,
  );
}

function isUnauthenticated(e: unknown): boolean {
  return e instanceof ConnectError && e.code === Code.Unauthenticated;
}

// ------------------------------------------------------------------ states

function renderUnavailable(): void {
  show('unavailable', [
    h('section', { cls: 'card' },
      h('p', { text: "Accounts aren't set up on this copy of the arcade. Your gnome still lives in this browser." }),
      link('Edit your look in the Gnome Creator', '../gnome-creator/'),
    ),
  ]);
}

function renderError(): void {
  show('error', [
    h('section', { cls: 'card' },
      h('p', { text: "Couldn't reach the gnome server.", attrs: { role: 'alert' } }),
      button('Retry', () => start(), 'btn-primary'),
    ),
  ]);
}

async function renderSignedOut(signInFailed: boolean): Promise<void> {
  // Before sign-in this is the local store, so the name shown is the one this browser has.
  let localName = '';
  try {
    localName = (await createGnomeStore().getMe()).displayName;
  } catch {
    // The name is only a hint; the page works without it.
  }

  const card = h('section', { cls: 'card' });
  card.append(h('p', { text: 'Playing never needs an account. Sign in to keep your gnome on every device.' }));
  if (localName) card.append(h('p', { cls: 'muted', text: `This browser's gnome: ${localName}` }));
  if (signInFailed) card.append(h('p', { cls: 'notice', text: "Sign-in didn't finish. Try again.", attrs: { role: 'alert' } }));

  const signInBtn = button('Sign in with Google', async () => {
    signInBtn.disabled = true;
    try {
      await signIn();
    } catch {
      await renderSignedOut(true);
    }
  }, 'btn-primary btn-block');
  card.append(signInBtn, link('Edit your look in the Gnome Creator', '../gnome-creator/'));

  show('signed-out', [card]);
}

async function renderSignedIn(): Promise<void> {
  // First sign-in uploads the local gnome to the account; this is the step that does it.
  const store = createGnomeStore();
  await store.getMe();
  const uploaded = store instanceof ConnectGnomeStore && store.uploadedLocal;
  const res = await userClient().getMe({});
  const gnome = res.gnome;
  if (!gnome) throw new Error('The account has no gnome.');

  let shownName = gnome.displayName;
  const nameEl = h('p', { cls: 'name', text: shownName });
  const handle = gnome.handle;

  const profile = h('section', { cls: 'card' },
    nameEl,
    h('p', { cls: 'muted', text: `@${handle}` }),
    h('p', { cls: 'muted', text: 'Signed in' }),
  );
  if (uploaded) {
    profile.append(h('p', { cls: 'notice', text: 'Your gnome from this browser is now saved to your account.' }));
  }

  // Rename form.
  const msg = h('p', { cls: 'msg', attrs: { role: 'status', 'aria-live': 'polite' } });
  const input = h('input', { attrs: { id: 'name', type: 'text', maxlength: String(NAME_MAX), autocomplete: 'nickname' } });
  input.value = shownName;
  const saveBtn = h('button', { text: 'Save', cls: 'btn-primary', attrs: { type: 'submit' } });
  const form = h('form', { attrs: { novalidate: '' } },
    h('label', { text: 'Gnome name', attrs: { for: 'name' } }),
    input,
    saveBtn,
    msg,
  );
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const check = checkName(input.value);
    if (!check.ok) {
      msg.className = 'msg error';
      msg.textContent = check.reason;
      return;
    }
    saveBtn.disabled = true;
    msg.className = 'msg';
    msg.textContent = 'Saving…';
    try {
      const updated = await createGnomeStore().updateGnome({ displayName: check.name });
      shownName = updated.displayName;
      nameEl.textContent = shownName;
      msg.className = 'msg ok';
      msg.textContent = 'Saved.';
    } catch (e) {
      msg.className = 'msg error';
      msg.textContent = e instanceof GnomeStoreError ? e.message : "Couldn't save. Try again.";
    } finally {
      saveBtn.disabled = false;
    }
  });

  const rename = h('section', { cls: 'card' },
    h('p', { text: 'Rename your gnome' }),
    form,
    link('Edit your look in the Gnome Creator', '../gnome-creator/'),
  );

  const signOutBtn = button('Sign out', () => signOut(), 'btn-block');

  // Delete account: the button stays disabled until the handle is typed exactly.
  const delMsg = h('p', { cls: 'msg error', attrs: { role: 'status', 'aria-live': 'polite' } });
  const confirmInput = h('input', {
    attrs: { id: 'confirm', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: handle },
  });
  const delBtn = button('Delete my account', async () => {
    delBtn.disabled = true;
    delMsg.textContent = '';
    try {
      await userClient().deleteAccount({ confirmHandle: handle });
      delMsg.className = 'msg ok';
      delMsg.textContent = 'Deleted.';
      await signOut();
    } catch {
      delMsg.className = 'msg error';
      delMsg.textContent = "Couldn't delete the account. Try again.";
      delBtn.disabled = confirmInput.value !== handle;
    }
  }, 'danger btn-block');
  delBtn.disabled = true;
  confirmInput.addEventListener('input', () => {
    delBtn.disabled = !handle || confirmInput.value !== handle;
  });

  const danger = h('details', { cls: 'card' },
    h('summary', { text: 'Delete account' }),
    h('p', { text: 'Your gnome and account are deleted after 7 days. Signing in before then cancels it.' }),
    h('label', { text: 'Type your handle to confirm', attrs: { for: 'confirm' } }),
    confirmInput,
    delBtn,
    delMsg,
  );

  show('signed-in', [profile, rename, h('section', { cls: 'card' }, signOutBtn), danger]);
}

/** Signed-in view; a session the server rejects falls back to the signed-out view. */
async function showSignedIn(): Promise<void> {
  try {
    await renderSignedIn();
  } catch (e) {
    if (isUnauthenticated(e)) await renderSignedOut(false);
    else renderError();
  }
}

// ------------------------------------------------------------------ startup

async function start(): Promise<void> {
  if (!accountsEnabled()) {
    renderUnavailable();
    return;
  }
  show('loading', [h('p', { cls: 'muted', text: 'Loading…' })]);
  try {
    const urlHadState = new URLSearchParams(location.search).has('state');
    const done = await completeSignIn();
    if (hasStoredSession()) await showSignedIn();
    else await renderSignedOut(urlHadState && !done);
  } catch {
    renderError();
  }
}

void start();
