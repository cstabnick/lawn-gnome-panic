// The in-game phone. It has no button of its own: the P key and the More menu (ui/actions.ts 'phone') open a small
// menu of apps; other modules add apps with addApp.

import { firstPad } from '@lawn/gamepad';
import { KEYS, isTyping } from '../keys';
import { registerAction } from '../ui/actions';

export interface PhoneApp {
  id: string;
  label: string;
  /** Emoji shown on the app's button. */
  icon: string;
  /** One line under the label (fee, status), re-read every time the menu opens. */
  detail?(): string;
  run(): void;
}

export interface PhoneDeps {
  /** Why the phone cannot be used right now (cutscene, shop open, cracked...), or null. */
  blocked(): string | null;
  toast(text: string): void;
}

export interface Phone {
  addApp(app: PhoneApp): void;
  open(): void;
  close(): void;
  toggle(): void;
  isOpen(): boolean;
}

const BUTTON_TOP = 'calc(env(safe-area-inset-top) + max(18px,4vw) + var(--gta-map,128px) + 8px)';

const CSS = `
#gta-phone{position:fixed;right:calc(env(safe-area-inset-right) + 10px);top:calc(${BUTTON_TOP} + 52px);z-index:36;width:min(300px,calc(100vw - 24px));max-height:70vh;overflow-y:auto;box-sizing:border-box;display:none;flex-direction:column;gap:8px;padding:12px;background:#14181c;border:2px solid rgba(255,255,255,.25);border-radius:18px;color:#fff;font-family:system-ui,sans-serif;pointer-events:auto;touch-action:pan-y;}
#gta-phone .gta-phone-head{display:flex;align-items:center;justify-content:space-between;font-weight:800;font-size:16px;padding:0 2px;}
#gta-phone .gta-phone-x{width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;font-size:18px;line-height:1;padding:0;cursor:pointer;touch-action:manipulation;}
#gta-phone .gta-phone-row{display:flex;align-items:center;gap:10px;width:100%;min-height:52px;box-sizing:border-box;padding:8px 12px;border:1px solid rgba(255,255,255,.15);border-radius:12px;background:#1f252b;color:#fff;font:inherit;text-align:left;cursor:pointer;touch-action:manipulation;}
#gta-phone .gta-phone-icon{font-size:22px;line-height:1;flex:0 0 auto;}
#gta-phone .gta-phone-text{display:flex;flex-direction:column;min-width:0;}
#gta-phone .gta-phone-label{font-weight:700;font-size:15px;}
#gta-phone .gta-phone-detail{font-size:12px;color:rgba(255,255,255,.7);}
#gta-phone .gta-phone-empty{font-size:13px;color:rgba(255,255,255,.6);padding:8px 4px;}
`;

export function createPhone(ui: HTMLElement, deps: PhoneDeps): Phone {
  const apps: PhoneApp[] = [];
  let rows: HTMLButtonElement[] = [];
  let focus = 0;
  let isOpen = false;
  let padPrev: boolean[] = [];
  let pollRaf = 0;

  const style = document.createElement('style');
  style.textContent = CSS;
  ui.appendChild(style);

  const panel = document.createElement('div');
  panel.id = 'gta-phone';
  const head = document.createElement('div');
  head.className = 'gta-phone-head';
  const title = document.createElement('span');
  title.textContent = 'Phone';
  const closeX = document.createElement('button');
  closeX.className = 'gta-phone-x';
  closeX.setAttribute('aria-label', 'Close phone');
  closeX.textContent = '✕';
  closeX.addEventListener('click', () => close());
  head.append(title, closeX);
  const list = document.createElement('div');
  list.className = 'gta-phone-list';
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = '8px';
  panel.append(head, list);
  // Keep touches and clicks on the panel from starting the stick, camera drag or pointer lock underneath, and let it scroll.
  panel.addEventListener('pointerdown', (e) => e.stopPropagation());
  panel.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });
  ui.appendChild(panel);

  // The focus ring is for the pad; with a mouse or touch it only gets in the way.
  const showFocus = (): void => rows.forEach((r, i) => {
    r.style.outline = i === focus && firstPad() ? '3px solid #7cf0ff' : 'none';
  });

  function render(): void {
    list.replaceChildren();
    rows = [];
    for (const app of apps) {
      const row = document.createElement('button');
      row.className = 'gta-phone-row';
      row.dataset.appId = app.id;
      const icon = document.createElement('span');
      icon.className = 'gta-phone-icon';
      icon.textContent = app.icon;
      const text = document.createElement('span');
      text.className = 'gta-phone-text';
      const label = document.createElement('span');
      label.className = 'gta-phone-label';
      label.textContent = app.label;
      text.append(label);
      const detail = app.detail?.() ?? '';
      if (detail) {
        const d = document.createElement('span');
        d.className = 'gta-phone-detail';
        d.textContent = detail;
        text.append(d);
      }
      row.append(icon, text);
      row.addEventListener('click', () => {
        close();
        app.run();
      });
      list.appendChild(row);
      rows.push(row);
    }
    if (rows.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'gta-phone-empty';
      empty.textContent = 'No apps yet.';
      list.appendChild(empty);
    }
    if (focus >= rows.length) focus = 0;
    showFocus();
  }

  function pollPad(): void {
    pollRaf = 0;
    if (!isOpen) return;
    const p = firstPad();
    if (p) {
      const down = p.buttons.map((b) => b.pressed);
      const y = p.axes[1] ?? 0;
      const up = down[12] || y < -0.6;
      const dn = down[13] || y > 0.6;
      const wasUp = padPrev[12] || padPrev[100];
      const wasDn = padPrev[13] || padPrev[101];
      down[100] = y < -0.6;
      down[101] = y > 0.6;
      if (rows.length > 0) {
        if (up && !wasUp) { focus = (focus + rows.length - 1) % rows.length; showFocus(); }
        if (dn && !wasDn) { focus = (focus + 1) % rows.length; showFocus(); }
        if (down[0] && !padPrev[0]) rows[focus]?.click();
      }
      if (!isOpen) return;
      if ((down[1] && !padPrev[1]) || (down[8] && !padPrev[8])) { close(); return; }
      padPrev = down;
    }
    pollRaf = requestAnimationFrame(pollPad);
  }

  function open(): void {
    if (isOpen) return;
    const why = deps.blocked();
    if (why) {
      deps.toast(why);
      return;
    }
    render();
    isOpen = true;
    panel.style.display = 'flex';
    document.body.dataset.options = 'open';
    if (document.pointerLockElement) document.exitPointerLock();
    focus = 0;
    showFocus();
    // Buttons already held when it opened (the Back press itself) must not count as new presses.
    const p = firstPad();
    padPrev = p ? p.buttons.map((b) => b.pressed) : [];
    if (!pollRaf) pollRaf = requestAnimationFrame(pollPad);
  }

  function close(): void {
    if (pollRaf) cancelAnimationFrame(pollRaf);
    pollRaf = 0;
    isOpen = false;
    panel.style.display = 'none';
    document.body.dataset.options = '';
  }

  function toggle(): void {
    if (isOpen) close();
    else open();
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === KEYS.phone && !e.repeat && !isTyping(e)) {
      toggle();
      return;
    }
    if (isOpen && e.code === KEYS.close) {
      close();
      e.stopImmediatePropagation();
    }
  });
  window.addEventListener('gta:phone', toggle);
  registerAction('phone', { run: toggle });

  return {
    addApp(app: PhoneApp): void {
      const i = apps.findIndex((a) => a.id === app.id);
      if (i >= 0) apps[i] = app;
      else apps.push(app);
      if (isOpen) render();
    },
    open,
    close,
    toggle,
    isOpen: () => isOpen,
  };
}
