// E24: the end-of-shift card (pay lines, stars, level bar, one OK button). DOM only, appended to #ui, phone-sized.
export interface ShiftCardView {
  icon: string;
  title: string;
  quote: string | null;
  /** 0 = no stars row. */
  stars: number;
  lines: string[];
  total: number;
  level: string;
  /** 0..1 progress into the level. */
  xpFrac: number;
  onClose?(): void;
}

const STYLE_ID = 'gta-shift-card-css';
const CSS = `
#gta-shift-card{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom) + 16px);transform:translateX(-50%);z-index:46;width:min(360px,calc(100vw - 24px));box-sizing:border-box;display:flex;flex-direction:column;gap:6px;padding:14px;background:#1b1f24;border:2px solid rgba(255,255,255,.28);border-radius:18px;color:#fff;font-family:system-ui,sans-serif;pointer-events:auto;box-shadow:0 8px 24px rgba(0,0,0,.45);}
#gta-shift-card .sc-title{font-weight:800;font-size:16px;}
#gta-shift-card .sc-quote{font-style:italic;font-size:13px;color:rgba(255,255,255,.8);}
#gta-shift-card .sc-stars{font-size:22px;letter-spacing:2px;color:#ffd23f;}
#gta-shift-card .sc-line{font-size:13px;color:rgba(255,255,255,.85);}
#gta-shift-card .sc-total{font-size:18px;font-weight:800;}
#gta-shift-card .sc-lv{font-size:12px;color:rgba(255,255,255,.75);}
#gta-shift-card .sc-bar{height:6px;border-radius:3px;background:rgba(255,255,255,.15);overflow:hidden;}
#gta-shift-card .sc-barf{height:100%;background:#7cf0ff;}
#gta-shift-card button{min-height:44px;border-radius:12px;border:1px solid rgba(255,255,255,.3);background:#2a323a;color:#fff;font:700 15px system-ui,sans-serif;cursor:pointer;touch-action:manipulation;}
`;

let open: HTMLElement | null = null;

/** Show the card (replaces one already up). Closes on OK, Enter or Escape. */
export function showShiftCard(ui: HTMLElement, v: ShiftCardView): void {
  if (typeof document === 'undefined') return;
  if (!document.getElementById(STYLE_ID)) {
    const st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  closeShiftCard();
  const el = document.createElement('div');
  el.id = 'gta-shift-card';
  el.setAttribute('role', 'dialog');
  const add = (cls: string, text: string): HTMLElement => {
    const d = document.createElement('div');
    d.className = cls;
    d.textContent = text;
    el.appendChild(d);
    return d;
  };
  add('sc-title', `${v.icon} ${v.title}`);
  if (v.quote) add('sc-quote', `"${v.quote}"`);
  if (v.stars > 0) add('sc-stars', '★'.repeat(v.stars) + '☆'.repeat(5 - v.stars));
  for (const l of v.lines) add('sc-line', l);
  add('sc-total', `Paid ${v.total} 🌰`);
  add('sc-lv', v.level);
  const bar = add('sc-bar', '');
  const fill = document.createElement('div');
  fill.className = 'sc-barf';
  fill.style.width = `${Math.round(Math.max(0, Math.min(1, v.xpFrac)) * 100)}%`;
  bar.appendChild(fill);
  const ok = document.createElement('button');
  ok.type = 'button';
  ok.textContent = 'OK';
  el.appendChild(ok);
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
  const done = (): void => {
    window.removeEventListener('keydown', onKey);
    if (open === el) open = null;
    el.remove();
    v.onClose?.();
  };
  const onKey = (e: KeyboardEvent): void => {
    if (e.code === 'Enter' || e.code === 'Escape') done();
  };
  ok.addEventListener('click', done);
  window.addEventListener('keydown', onKey);
  ui.appendChild(el);
  open = el;
}

export function closeShiftCard(): void {
  open?.querySelector('button')?.click();
}

export function shiftCardOpen(): boolean { return open !== null; }
