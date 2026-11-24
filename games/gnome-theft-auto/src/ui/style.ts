// One look for every on-screen game button: round 44 px (or 56 / 64 / 84 for the touch cluster), dark glass, white
// ring, bold label. Modules add the classes instead of writing their own inline button styles.
//   .gta-btn            the base: dark translucent fill, 2px white ring, white bold text, no tap highlight, pointer-events:auto
//   .gta-btn--pill      a pill with a label ('🔒 Store in Lock-Up 3'), min 44 px tall
//   .gta-btn--sm/--md/--lg/--xl   44 / 56 / 64 / 84 px round
//   .gta-btn.on / [aria-pressed="true"]   the lit state (amber ring and fill)
//   [data-glyph]::after a small glyph badge in the top-left corner, text from data-glyph, colour from --glyph-bg
// Touch layout preference (Options): 'standard' | 'minimal' | 'left-handed', mirrored on <body data-touch-layout>.

export type TouchLayout = 'standard' | 'minimal' | 'left-handed';
export const TOUCH_LAYOUTS: readonly TouchLayout[] = ['standard', 'minimal', 'left-handed'];
const LAYOUT_KEY = 'gta-touch-layout';

export const BUTTON_CSS = `
.gta-btn{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:6px;position:relative;
  width:44px;height:44px;min-width:44px;min-height:44px;padding:0;margin:0;border-radius:50%;
  border:2px solid rgba(255,255,255,.7);background:rgba(20,20,20,.55);color:#fff;
  font:700 15px system-ui,-apple-system,sans-serif;line-height:1;cursor:pointer;pointer-events:auto;
  touch-action:manipulation;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;}
.gta-btn--md{width:56px;height:56px;}
.gta-btn--lg{width:64px;height:64px;}
.gta-btn--xl{width:84px;height:84px;font-size:17px;}
.gta-btn--icon{font-size:22px;}
.gta-btn--pill{width:auto;height:auto;padding:10px 16px;border-radius:999px;white-space:nowrap;}
.gta-btn.on,.gta-btn[aria-pressed="true"]{border-color:#ffb02e;background:rgba(255,140,30,.35);}
.gta-btn:focus-visible{outline:3px solid #7cf0ff;outline-offset:2px;}
.gta-btn[data-glyph]::after{content:attr(data-glyph);position:absolute;left:-6px;top:-6px;min-width:20px;height:20px;
  padding:0 4px;box-sizing:border-box;border-radius:10px;background:var(--glyph-bg,#2a2f36);color:var(--glyph-fg,#fff);
  border:1.5px solid rgba(255,255,255,.85);font:800 11px/17px system-ui,sans-serif;text-align:center;pointer-events:none;}
body[data-input="touch"] .gta-btn[data-glyph]::after{display:none;}
`;

let styled = false;
/** Adds BUTTON_CSS to the document once. */
export function ensureButtonStyle(): void {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const s = document.createElement('style');
  s.id = 'gta-btn-style';
  s.textContent = BUTTON_CSS;
  document.head.appendChild(s);
}

export function getTouchLayout(): TouchLayout {
  try {
    const v = localStorage.getItem(LAYOUT_KEY);
    if (v && (TOUCH_LAYOUTS as readonly string[]).includes(v)) return v as TouchLayout;
  } catch {
    // Storage blocked: the default.
  }
  return 'standard';
}

/** Saves the layout, sets <body data-touch-layout> and fires 'gta:touch-layout' (input.ts and the More menu re-lay out). */
export function setTouchLayout(layout: TouchLayout): void {
  try {
    localStorage.setItem(LAYOUT_KEY, layout);
  } catch {
    // Storage blocked: it still applies for this session.
  }
  if (typeof document !== 'undefined') document.body.dataset.touchLayout = layout;
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('gta:touch-layout'));
}
