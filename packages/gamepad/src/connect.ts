// A small "Steam Controller" button for games. Browsers never list the 2026 Steam Controller as a gamepad, so the
// player grants it once by clicking (WebHID needs a user gesture); later visits reopen it by themselves.
// Shown only where WebHID exists, on a non-touch device, with no ordinary pad connected, until dismissed.
import { onSteamChange, requestSteam, startSteam, steamConnected, steamError, steamSupported } from './steam';

const DISMISS_KEY = 'lawn.steamConnect.dismissed';

const read = (): string | null => { try { return localStorage.getItem(DISMISS_KEY); } catch { return null; } };
const write = (): void => { try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* private window: it just shows again next load */ } };

const nativePadPresent = (): boolean => {
  if (typeof navigator.getGamepads !== 'function') return false;
  for (const p of navigator.getGamepads()) if (p && p.connected) return true;
  return false;
};

export interface SteamConnectOptions {
  /** Sit in the flow of `parent` (for a control panel) instead of pinned to the bottom-left corner of the screen. */
  inline?: boolean;
}

/** Mounts the button into `parent` (pass the shared #ui). Returns a function that removes it. */
export function mountSteamConnect(parent: HTMLElement, opts: SteamConnectOptions = {}): () => void {
  if (!steamSupported() || matchMedia('(pointer: coarse)').matches) return () => {};
  startSteam();

  const wrap = document.createElement('div');
  wrap.dataset.steamConnect = '';
  wrap.style.cssText = (opts.inline ? '' : 'position:fixed;left:max(8px,env(safe-area-inset-left));bottom:max(8px,env(safe-area-inset-bottom));')
    + 'z-index:40;display:flex;gap:4px;font:600 13px system-ui,sans-serif;pointer-events:auto';
  const btn = document.createElement('button');
  const close = document.createElement('button');
  for (const b of [btn, close]) {
    b.type = 'button';
    b.style.cssText = 'min-height:44px;min-width:44px;padding:0 12px;border:1px solid #fff6;border-radius:10px;'
      + 'background:#000b;color:#fff;font:inherit;cursor:pointer';
  }
  btn.textContent = '🎮 Use Steam Controller';
  btn.title = 'Chrome cannot see the Steam Controller as a gamepad. Click, then pick it in the list.';
  close.textContent = '×';
  close.setAttribute('aria-label', 'Hide Steam Controller button');
  wrap.append(btn, close);

  const refresh = (): void => {
    const hide = steamConnected() || nativePadPresent() || read() !== null;
    wrap.style.display = hide ? 'none' : 'flex';
  };
  btn.addEventListener('click', () => {
    btn.textContent = '🎮 Pick it in the browser list…';
    requestSteam()
      .then((ok) => {
        btn.textContent = ok ? '🎮 Connected: press a button' : '🎮 No controller picked, try again';
        if (ok && steamError()) btn.textContent = '🎮 Could not open it: close other apps using it';
      })
      .catch((e: unknown) => {
        // A cancelled picker rejects with NotFoundError; anything else is worth showing.
        btn.textContent = e instanceof DOMException && e.name === 'NotFoundError'
          ? '🎮 No controller picked, try again' : '🎮 Could not open the controller';
      });
  });
  close.addEventListener('click', () => { write(); refresh(); });

  parent.append(wrap);
  const off = onSteamChange(refresh);
  const timer = setInterval(refresh, 1500); // a native pad only shows up after its first button press
  window.addEventListener('gamepadconnected', refresh);
  window.addEventListener('gamepaddisconnected', refresh);
  refresh();
  return () => {
    off();
    clearInterval(timer);
    window.removeEventListener('gamepadconnected', refresh);
    window.removeEventListener('gamepaddisconnected', refresh);
    wrap.remove();
  };
}
