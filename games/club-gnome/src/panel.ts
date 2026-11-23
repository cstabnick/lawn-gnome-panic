// The one modal card every Club Gnome panel uses (shops, the cashier, the guide, the furniture window). One panel at a
// time: opening another closes the first. Phone-first: fits a 360 px wide screen with safe-area insets, 44 px buttons,
// Escape or the ✕ or a tap on the backdrop closes it.
import type { NpcDef } from './config';

/** What a panel module gets from main.ts. */
export interface PanelCtx {
  /** The page's #ui (append your own container; never restyle #ui). */
  ui: HTMLElement;
  /** A grey line in the chat log. */
  system(text: string): void;
  /** A speech bubble over an NPC (by NpcDef id), e.g. the shopkeeper thanking you. */
  npcSay(npcId: NpcDef['id'], text: string): void;
  /** My look was saved (dressing room, salon): main.ts rebuilds my gnome and tells the others. */
  onLookSaved(): void;
  /** Hides the town (HUD, rendering, music) while something full screen is open over it; false shows it again. */
  setTownHidden(hidden: boolean): void;
}

export interface PanelOptions {
  /** Heading, e.g. "Gnome Market". */
  title: string;
  /** A short line under the heading (the shopkeeper's greeting). */
  subtitle?: string;
  /** Called once when the panel closes, however it closes. */
  onClose?: () => void;
}

export interface Panel {
  /** Put your content in here. It scrolls when taller than the screen. */
  readonly body: HTMLElement;
  close(): void;
}

const STYLE_ID = 'cg-panel-style';
const CSS = `
.cgp-root{position:fixed;inset:0;z-index:50;pointer-events:auto;display:flex;align-items:center;justify-content:center;box-sizing:border-box;padding:calc(env(safe-area-inset-top) + 12px) calc(env(safe-area-inset-right) + 12px) calc(env(safe-area-inset-bottom) + 12px) calc(env(safe-area-inset-left) + 12px);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;}
.cgp-back{position:absolute;inset:0;background:rgba(0,0,0,0.45);}
.cgp-card{position:relative;box-sizing:border-box;width:100%;max-width:520px;max-height:100%;display:flex;flex-direction:column;border-radius:16px;background:#fff4dc;color:#2b2118;box-shadow:0 8px 24px rgba(0,0,0,0.35);overflow:hidden;}
.cgp-head{display:flex;align-items:flex-start;gap:8px;padding:14px 14px 8px 16px;}
.cgp-titles{flex:1;min-width:0;}
.cgp-title{margin:0;font-size:20px;line-height:1.2;}
.cgp-sub{margin:4px 0 0;font-size:14px;line-height:1.35;color:#5a4632;}
.cgp-x{flex:none;min-width:44px;min-height:44px;border:0;border-radius:12px;background:rgba(43,33,24,0.1);color:#2b2118;font-size:20px;cursor:pointer;}
.cgp-body{padding:4px 16px 16px;overflow-y:auto;-webkit-overflow-scrolling:touch;}
.cgp-btn{min-height:44px;min-width:44px;padding:0 14px;border:0;border-radius:10px;background:#2f7d4a;color:#fff;font:inherit;font-size:15px;font-weight:600;cursor:pointer;}
.cgp-btn:disabled{background:#b9ad98;color:#fff;cursor:not-allowed;}
.cgp-btn.alt{background:transparent;color:#2b2118;border:2px solid #7a5a36;}
`;

function injectStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = CSS;
  document.head.appendChild(s);
}

let current: Panel | null = null;

/** True while a panel is open (main.ts ignores walking keys and the action key then). */
export function isPanelOpen(): boolean {
  return current !== null;
}

/** Closes the open panel, if any. */
export function closePanel(): void {
  current?.close();
}

/**
 * Opens a panel inside ui. Buttons inside it can use the classes `cgp-btn` (green, 44 px) and `cgp-btn alt`
 * (outlined).
 */
export function openPanel(ui: HTMLElement, opts: PanelOptions): Panel {
  injectStyle();
  current?.close();

  const root = document.createElement('div');
  root.className = 'cgp-root';
  // The town listens for pointerdown on its canvas; keep panel taps away from it and from the page.
  root.addEventListener('pointerdown', (e) => e.stopPropagation());
  const back = document.createElement('div');
  back.className = 'cgp-back';
  const card = document.createElement('div');
  card.className = 'cgp-card';
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  const head = document.createElement('div');
  head.className = 'cgp-head';
  const titles = document.createElement('div');
  titles.className = 'cgp-titles';
  const h = document.createElement('h2');
  h.className = 'cgp-title';
  h.textContent = opts.title;
  titles.appendChild(h);
  if (opts.subtitle) {
    const sub = document.createElement('p');
    sub.className = 'cgp-sub';
    sub.textContent = opts.subtitle;
    titles.appendChild(sub);
  }
  const x = document.createElement('button');
  x.type = 'button';
  x.className = 'cgp-x';
  x.textContent = '✕';
  x.setAttribute('aria-label', 'Close');
  head.append(titles, x);
  const body = document.createElement('div');
  body.className = 'cgp-body';
  card.append(head, body);
  root.append(back, card);
  ui.appendChild(root);

  let closed = false;
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.preventDefault();
      panel.close();
    }
  };
  const panel: Panel = {
    body,
    close() {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', onKey, true);
      root.remove();
      if (current === panel) current = null;
      opts.onClose?.();
    },
  };
  back.addEventListener('click', () => panel.close());
  x.addEventListener('click', () => panel.close());
  document.addEventListener('keydown', onKey, true);
  current = panel;
  x.focus();
  return panel;
}
