// Opens one of the arcade's games in a full-screen frame over the town, with a bar on top to come back.
// The town keeps running underneath (my gnome stays where it was, shown as busy to everyone else).
import type { GameLink } from './config';

/**
 * The URL of a game. On a dev server (import.meta.env.DEV) it is http://<this hostname>:<link.port>/, on the built
 * site ../<link.game>/. Appends link.query, and passes on this page's own ?mp= and ?platform= parameters.
 */
export function gameUrl(link: GameLink): string {
  const env = (import.meta as unknown as { env?: { DEV?: boolean } }).env;
  const base = env?.DEV
    ? `${location.protocol}//${location.hostname}:${link.port}/`
    : `../${link.game}/`;

  const parts: string[] = [];
  if (link.query) parts.push(link.query);
  try {
    const own = new URLSearchParams(location.search);
    for (const key of ['mp', 'platform']) {
      const value = own.get(key);
      if (value !== null) parts.push(`${key}=${encodeURIComponent(value)}`);
    }
  } catch {
    // ignore: the parameters are optional
  }
  return parts.length ? `${base}?${parts.join('&')}` : base;
}

export interface Overlay {
  readonly isOpen: boolean;
  /** Opens the game; backLabel names where the back button returns to ("Back to the Gnomecino"). */
  open(link: GameLink, backLabel: string): void;
  close(): void;
  /** Called after the overlay closes (by the button or close()). */
  onClose(fn: () => void): void;
}

export function createOverlay(ui: HTMLElement): Overlay {
  const root = document.createElement('div');
  root.style.cssText = 'position:fixed; inset:0; z-index:50; pointer-events:auto; display:none; background:#000; '
    + 'flex-direction:column;';

  const bar = document.createElement('div');
  bar.style.cssText = 'box-sizing:content-box; height:48px; flex:0 0 auto; display:flex; align-items:center; gap:8px; '
    + 'padding:0 8px; padding-top:env(safe-area-inset-top); background:#1d1a16; color:#fff; font-family:system-ui, sans-serif;';

  const back = document.createElement('button');
  back.type = 'button';
  back.style.cssText = 'min-width:44px; min-height:44px; padding:0 12px; border:0; border-radius:8px; '
    + 'background:#3a342c; color:#fff; font-size:15px; cursor:pointer; white-space:nowrap;';

  const title = document.createElement('div');
  title.style.cssText = 'flex:1; min-width:0; text-align:center; font-size:16px; font-weight:600; overflow:hidden; '
    + 'text-overflow:ellipsis; white-space:nowrap;';

  // Spacer on the right so the title stays centred.
  const spacer = document.createElement('div');
  spacer.style.cssText = 'min-width:0; width:0;';

  bar.append(back, title, spacer);

  const frame = document.createElement('iframe');
  frame.setAttribute('allow', 'autoplay; fullscreen; pointer-lock; gamepad');
  frame.style.cssText = 'border:0; width:100%; flex:1; min-height:0;';

  root.append(bar, frame);
  ui.appendChild(root);

  let open = false;
  const listeners: (() => void)[] = [];

  const hide = (): void => {
    if (!open) return;
    frame.src = 'about:blank';
    root.style.display = 'none';
    open = false;
    for (const fn of listeners) {
      try {
        fn();
      } catch (e) {
        console.warn('Overlay close listener failed.', e);
      }
    }
  };

  back.addEventListener('click', hide);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) hide();
  });

  return {
    get isOpen() {
      return open;
    },
    open(link, backLabel) {
      back.textContent = `← ${backLabel}`;
      title.textContent = link.title;
      frame.title = link.title;
      frame.src = gameUrl(link);
      root.style.display = 'flex';
      open = true;
      frame.focus();
    },
    close: hide,
    onClose(fn) {
      listeners.push(fn);
    },
  };
}
