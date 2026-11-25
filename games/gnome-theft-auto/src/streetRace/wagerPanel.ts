// E26: the bookie's panel at a meet: pick a street route and a stake, then race. Touch-sized (44 px buttons), fits a
// 390 x 844 phone. Plain DOM, appended to the game's #ui (never restyles the parent).
import type { StreetTrackId } from '../raceTrack/tracks';

export interface WagerPanelOpts {
  /** Parent element (the game's #ui). */
  parent: HTMLElement;
  /** Panel title, e.g. "Dot Wagstaff's book". */
  title: string;
  /** The bookie's greeting line. */
  line: string;
  /** Routes offered, with names and the player's best time on each (s) if any. */
  tracks: readonly { id: StreetTrackId; name: string; best: number | null }[];
  /** Stakes offered (Acorns, 0 = a friendly). */
  wagers: readonly number[];
  /** The player's Acorns now: stakes above it are disabled. */
  acorns: number;
  onPick(trackId: StreetTrackId, wager: number): void;
  onClose(): void;
}

export interface WagerPanel {
  close(): void;
}

const BTN_BASE =
  'min-height:44px;box-sizing:border-box;padding:8px 12px;margin:4px 0;border-radius:8px;border:1px solid rgba(255,255,255,0.25);' +
  'background:rgba(255,255,255,0.08);color:#fff;font:inherit;font-size:15px;cursor:pointer;touch-action:manipulation;';
const BTN_ON = 'background:#3d7a3d;border-color:#9be39b;font-weight:bold;';
const BTN_OFF_DISABLED = 'opacity:0.4;cursor:not-allowed;';

/** m:ss.s for a best time in seconds. */
function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const rest = s - m * 60;
  return `${m}:${rest.toFixed(1).padStart(4, '0')}`;
}

function el<K extends string>(tag: K, css?: string, text?: string): HTMLElement {
  const e = document.createElement(tag);
  if (css) e.style.cssText = css;
  if (text !== undefined) e.textContent = text;
  return e;
}

function button(label: string, css: string, onClick: () => void, disabled = false): HTMLButtonElement {
  const b = document.createElement('button') as HTMLButtonElement;
  b.type = 'button';
  b.textContent = label;
  b.style.cssText = BTN_BASE + css;
  b.disabled = disabled;
  b.addEventListener('click', onClick);
  return b;
}

function clear(node: HTMLElement): void {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export function openWagerPanel(o: WagerPanelOpts): WagerPanel {
  let trackId: StreetTrackId | undefined = o.tracks[0]?.id;
  let wager = o.wagers[0] ?? 0;
  let closed = false;

  const root = el(
    'div',
    'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);box-sizing:border-box;' +
      'width:max-content;max-width:min(420px, calc(100vw - 32px));' +
      'max-height:calc(100vh - 32px - env(safe-area-inset-top) - env(safe-area-inset-bottom));overflow-y:auto;' +
      'padding:16px;border-radius:12px;background:rgba(16,18,24,0.92);color:#fff;z-index:10;pointer-events:auto;' +
      'font-family:system-ui,sans-serif;',
  ) as HTMLDivElement;
  root.id = 'gta-wager-panel';

  const title = el('h3', 'margin:0 0 6px;font-size:20px;', o.title);
  const line = el('p', 'margin:0 0 12px;font-size:14px;opacity:0.85;', o.line);
  const routeList = el('div', 'display:flex;flex-direction:column;');
  const stakeRow = el('div', 'display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;');
  const stakeLabel = el('div', 'font-size:13px;opacity:0.8;margin-top:12px;', 'Stake');

  const race = button(
    'Race!',
    'width:100%;min-height:48px;margin-top:14px;font-size:17px;font-weight:bold;background:#b8860b;border-color:#ffd76a;',
    () => {
      if (trackId === undefined) return;
      const id = trackId;
      const w = wager;
      close();
      o.onPick(id, w);
    },
    trackId === undefined,
  );
  const notNow = button('Not now', 'width:100%;', () => {
    close();
    o.onClose();
  });

  function renderRoutes(): void {
    clear(routeList);
    for (const t of o.tracks) {
      const best = t.best === null ? 'no time yet' : formatTime(t.best);
      const on = t.id === trackId;
      const b = button(
        `${t.name} - ${best}`,
        `width:100%;text-align:left;${on ? BTN_ON : ''}`,
        () => {
          trackId = t.id;
          renderRoutes();
        },
      );
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      routeList.appendChild(b);
    }
  }

  function renderStakes(): void {
    clear(stakeRow);
    for (const n of o.wagers) {
      const disabled = n > o.acorns;
      const on = n === wager;
      const label = n === 0 ? 'Friendly' : `${n} Acorns`;
      const css = `flex:1 1 auto;min-width:44px;${on && !disabled ? BTN_ON : ''}${disabled ? BTN_OFF_DISABLED : ''}`;
      const b = button(
        label,
        css,
        () => {
          if (disabled) return;
          wager = n;
          renderStakes();
        },
        disabled,
      );
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      stakeRow.appendChild(b);
    }
  }

  function onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      close();
      o.onClose();
    }
  }

  function close(): void {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKey);
    root.remove();
  }

  renderRoutes();
  renderStakes();
  root.appendChild(title);
  root.appendChild(line);
  root.appendChild(routeList);
  root.appendChild(stakeLabel);
  root.appendChild(stakeRow);
  root.appendChild(race);
  root.appendChild(notNow);

  document.addEventListener('keydown', onKey);
  o.parent.appendChild(root);

  return { close };
}
