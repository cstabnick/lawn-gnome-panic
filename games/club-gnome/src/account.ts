// Accounts in the town: finish a sign-in when the page comes back from Keycloak, and gently tell guests that
// nothing is saved without an account (with a Sign in button), never forcing it.

import { accountsEnabled, hasStoredSession } from '@lawn/platform/session';
import { GAME_LINKS, STORAGE } from './config';
import { gameUrl } from './overlay';

export interface AccountState {
  /** This build can sign in (accountsEnabled()). */
  enabled: boolean;
  /** A session is stored on this origin (hasStoredSession()). */
  signedIn: boolean;
}

export function accountState(): AccountState {
  return { enabled: accountsEnabled(), signedIn: hasStoredSession() };
}

/**
 * Goes to the account page (full page, not the game frame: Keycloak cannot be framed) and comes back here after.
 * signIn = start the Google sign-in at once. The account page's own address is the one Keycloak accepts.
 */
export function goToAccount(signIn: boolean): void {
  const base = gameUrl(GAME_LINKS.me);
  const sep = base.includes('?') ? '&' : '?';
  const ret = location.origin + location.pathname + location.search;
  location.assign(`${base}${sep}${signIn ? 'signin=1&' : ''}return=${encodeURIComponent(ret)}`);
}

/** Call once at startup before loadMyGnome(): completes a sign-in redirect if the URL carries one. Never rejects. */
export async function finishSignInIfReturning(): Promise<void> {
  try {
    const p = new URLSearchParams(location.search);
    if (!(p.has('state') && (p.has('code') || p.has('error')))) return;
    // Dynamic import: the OIDC code is heavy and only needed on the way back.
    const { completeSignIn } = await import('@lawn/platform');
    await completeSignIn();
  } catch (e) {
    console.warn('Sign-in could not be finished.', e);
  }
}

function wasDismissed(): boolean {
  try {
    return sessionStorage.getItem(STORAGE.guestDismissed) === '1';
  } catch {
    return false;
  }
}

function rememberDismissed(): void {
  try {
    sessionStorage.setItem(STORAGE.guestDismissed, '1');
  } catch {
    // ignore: the card just shows again next time
  }
}

/** The one guest card on screen, if any. */
let openCard: HTMLElement | null = null;

/**
 * Shows the guest card over the town ("You're playing as a guest. Nothing is saved without an account.",
 * [Sign in] [Keep playing as a guest]) inside its own container in ui. Does nothing when accounts are not enabled or
 * someone is signed in; also nothing when it was dismissed this visit, unless force is true.
 */
export function showGuestPrompt(ui: HTMLElement, force?: boolean): void {
  const state = accountState();
  if (!state.enabled || state.signedIn) return;
  if (!force && wasDismissed()) return;
  if (openCard) return;

  const root = document.createElement('div');
  root.style.cssText = 'position:fixed; inset:0; z-index:60; pointer-events:auto; display:flex; align-items:center; '
    + 'justify-content:center; padding:16px; box-sizing:border-box; font-family:system-ui, sans-serif;';

  const backdrop = document.createElement('div');
  backdrop.style.cssText = 'position:absolute; inset:0; background:rgba(0,0,0,0.45);';

  const card = document.createElement('div');
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.setAttribute('aria-labelledby', 'gt-guest-title');
  card.style.cssText = 'position:relative; box-sizing:border-box; width:100%; max-width:340px; padding:20px; '
    + 'border-radius:16px; background:#fff4dc; color:#2b2118; box-shadow:0 8px 24px rgba(0,0,0,0.35);';

  const title = document.createElement('h2');
  title.id = 'gt-guest-title';
  title.textContent = 'Playing as a guest';
  title.style.cssText = 'margin:0 0 8px; font-size:20px;';

  const text = document.createElement('p');
  text.textContent = 'You can walk around, chat and play everything. But nothing is saved without an account: '
    + 'your gnome, achievements and progress stay only in this browser.';
  text.style.cssText = 'margin:0 0 16px; font-size:15px; line-height:1.4;';

  const status = document.createElement('p');
  status.setAttribute('aria-live', 'polite');
  status.style.cssText = 'margin:0 0 8px; font-size:14px; color:#8a2b1f; min-height:0;';

  const signInBtn = document.createElement('button');
  signInBtn.type = 'button';
  signInBtn.textContent = 'Sign in with Google';
  signInBtn.style.cssText = 'display:block; width:100%; min-height:44px; margin:0 0 8px; border:0; border-radius:10px; '
    + 'background:#2f7d4a; color:#fff; font-size:16px; font-weight:600; cursor:pointer;';

  const keepBtn = document.createElement('button');
  keepBtn.type = 'button';
  keepBtn.textContent = 'Keep playing as a guest';
  keepBtn.style.cssText = 'display:block; width:100%; min-height:44px; margin:0; border:2px solid #7a5a36; '
    + 'border-radius:10px; background:transparent; color:#2b2118; font-size:16px; cursor:pointer;';

  card.append(title, text, status, signInBtn, keepBtn);
  root.append(backdrop, card);
  ui.appendChild(root);
  openCard = root;

  const dismiss = (): void => {
    rememberDismissed();
    close();
  };
  const close = (): void => {
    document.removeEventListener('keydown', onKey, true);
    root.remove();
    if (openCard === root) openCard = null;
  };
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') dismiss();
  };

  backdrop.addEventListener('click', dismiss);
  keepBtn.addEventListener('click', dismiss);
  document.addEventListener('keydown', onKey, true);

  signInBtn.addEventListener('click', async () => {
    signInBtn.disabled = true;
    status.textContent = '';
    try {
      goToAccount(true);
    } catch {
      signInBtn.disabled = false;
      status.textContent = "Couldn't reach sign-in. Try again later.";
    }
  });

  keepBtn.focus();
}
