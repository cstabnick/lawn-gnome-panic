// Small DOM helpers every trainer section uses, so the tabs look and behave alike. Styles live in TRAINER_CSS (the panel
// injects it once). Every control is at least 44 px tall (touch) and is a real <button>/<select>/<input>, so the panel's
// gamepad focus (D-pad moves, A clicks) reaches it. Text fields swallow key presses so typing never drives the gnome.

export const TRAINER_CSS = `
#gta-trainer{position:fixed;z-index:60;inset:auto;right:calc(env(safe-area-inset-right) + 8px);top:calc(env(safe-area-inset-top) + 8px);bottom:calc(env(safe-area-inset-bottom) + 8px);width:min(calc(100vw - 16px - env(safe-area-inset-left) - env(safe-area-inset-right)),460px);display:none;flex-direction:column;border-radius:12px;background:rgba(16,18,22,.94);color:#fff;font:600 14px system-ui,sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.55);pointer-events:auto;box-sizing:border-box;overflow:hidden;}
#gta-trainer.open{display:flex;}
#gta-trainer button,#gta-trainer select,#gta-trainer input,#gta-trainer textarea{font:inherit;color:#fff;touch-action:manipulation;}
#gta-trainer .gta-tr-h{margin:10px 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#ffd23f;}
#gta-trainer .gta-tr-note{font-weight:400;font-size:12px;opacity:.8;line-height:1.35;margin:2px 0 4px;}
#gta-trainer .gta-tr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:6px;}
#gta-trainer .gta-tr-row{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:4px 0;}
#gta-trainer .gta-tr-row > label{flex:1 1 110px;font-weight:600;}
#gta-trainer .gta-tr-btn{min-height:44px;min-width:44px;padding:6px 10px;text-align:left;border-radius:8px;border:2px solid rgba(255,255,255,.28);background:rgba(255,255,255,.08);cursor:pointer;}
#gta-trainer .gta-tr-btn small{display:block;font-weight:400;font-size:11px;opacity:.75;margin-top:1px;}
#gta-trainer .gta-tr-btn.on{border-color:#ffd23f;}
#gta-trainer .gta-tr-btn.armed{border-color:#ff5c5c;}
#gta-trainer .gta-tr-btn:focus-visible,#gta-trainer select:focus-visible,#gta-trainer input:focus-visible,#gta-trainer textarea:focus-visible{outline:3px solid #7cf0ff;outline-offset:1px;}
#gta-trainer .gta-tr-select,#gta-trainer .gta-tr-input{min-height:44px;padding:6px 8px;border-radius:8px;border:1px solid rgba(255,255,255,.35);background:rgba(0,0,0,.45);box-sizing:border-box;}
#gta-trainer .gta-tr-input{flex:1 1 90px;min-width:0;}
#gta-trainer textarea.gta-tr-input{width:100%;font:12px monospace;resize:vertical;}
#gta-trainer .gta-tr-status{min-height:18px;font-size:12px;color:#ffd23f;margin:4px 0;}
#gta-trainer .gta-tr-status.err{color:#ff7a7a;}
`;

/** Section heading (yellow caps). */
export function heading(text: string): HTMLHeadingElement {
  const h = document.createElement('h3');
  h.className = 'gta-tr-h';
  h.textContent = text;
  return h;
}

/** A small grey explanatory line. */
export function note(text: string): HTMLDivElement {
  const d = document.createElement('div');
  d.className = 'gta-tr-note';
  d.textContent = text;
  return d;
}

/** A wrapping grid for buttons. */
export function grid(...children: HTMLElement[]): HTMLDivElement {
  const d = document.createElement('div');
  d.className = 'gta-tr-grid';
  d.append(...children);
  return d;
}

/** A row: optional label text, then controls side by side. */
export function row(label: string | null, ...controls: HTMLElement[]): HTMLDivElement {
  const d = document.createElement('div');
  d.className = 'gta-tr-row';
  if (label !== null) {
    const l = document.createElement('label');
    l.textContent = label;
    d.append(l);
  }
  d.append(...controls);
  return d;
}

/** A 44 px button. `sub` is a small second line. */
export function button(label: string, onClick: () => void, sub?: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'gta-tr-btn';
  setButtonText(b, label, sub);
  b.addEventListener('click', () => onClick());
  return b;
}

/** Replace a button's label (and small line). */
export function setButtonText(b: HTMLButtonElement, label: string, sub?: string): void {
  b.textContent = label;
  if (sub) {
    const s = document.createElement('small');
    s.textContent = sub;
    b.append(s);
  }
}

/** A button that needs a second tap within 5 s (wipes, resets). */
export function confirmButton(label: string, onConfirm: () => void, sub?: string): HTMLButtonElement {
  let armed = false;
  let timer: number | undefined;
  const b = button(label, () => {
    if (!armed) {
      armed = true;
      b.classList.add('armed');
      setButtonText(b, 'Tap again to confirm', label);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => { armed = false; b.classList.remove('armed'); setButtonText(b, label, sub); }, 5000);
      return;
    }
    armed = false;
    window.clearTimeout(timer);
    b.classList.remove('armed');
    setButtonText(b, label, sub);
    onConfirm();
  }, sub);
  return b;
}

/** A 44 px <select>. */
export function select(options: readonly { value: string; label: string }[], value?: string): HTMLSelectElement {
  const s = document.createElement('select');
  s.className = 'gta-tr-select';
  for (const o of options) {
    const el = document.createElement('option');
    el.value = o.value;
    el.textContent = o.label;
    s.append(el);
  }
  if (value !== undefined) s.value = value;
  return s;
}

/** A text or number <input> (or a <textarea> when rows > 1) that keeps key presses to itself. */
export function input(opts: { type?: 'text' | 'number'; value?: string; placeholder?: string; rows?: number } = {}): HTMLInputElement | HTMLTextAreaElement {
  const el = opts.rows && opts.rows > 1 ? document.createElement('textarea') : document.createElement('input');
  if (el instanceof HTMLTextAreaElement) el.rows = opts.rows ?? 4;
  else el.type = opts.type ?? 'text';
  el.className = 'gta-tr-input';
  if (opts.value !== undefined) el.value = opts.value;
  if (opts.placeholder) el.placeholder = opts.placeholder;
  el.addEventListener('keydown', (e) => e.stopPropagation());
  el.addEventListener('keyup', (e) => e.stopPropagation());
  return el;
}

/** A status line: set(text) or set(text, true) for an error. */
export function status(): { el: HTMLDivElement; set(text: string, error?: boolean): void } {
  const el = document.createElement('div');
  el.className = 'gta-tr-status';
  el.setAttribute('role', 'status');
  return {
    el,
    set(text: string, error = false) {
      el.textContent = text;
      el.classList.toggle('err', error);
    },
  };
}

/** Reload the page shortly (after a save edit the systems read the save again on load). */
export function reloadSoon(ms = 400): void {
  window.setTimeout(() => location.reload(), ms);
}
