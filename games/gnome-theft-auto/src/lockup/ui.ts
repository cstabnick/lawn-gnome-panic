// The garage sheet (the Lock-Up, Hangar Two, the Mossbank Boathouse): the slots of one storage kind, and per vehicle
// Deliver (phone, with tabs to switch garage) or Take out / Scrap (at the garage).
// DOM only; every action goes through deps. Gamepad: D-pad / left stick moves a focus ring, A presses, B closes,
// LB / RB switch garage tab.
import { firstPad } from '@lawn/gamepad';
import { KEYS, isTyping } from '../keys';
import type { LockupStore, StorageKind, StoredVehicle } from './types';

export type LockupUiMode = 'phone' | 'site';

export interface LockupUiDeps {
  store: Pick<LockupStore, 'list' | 'capacity'>;
  /** True while that vehicle is out in the world (delivered or taken out this session). */
  isOut(uid: string): boolean;
  /** The Sling-Lift fee for that kind, and the seconds left on its cooldown (0 = ready). */
  fee(kind: StorageKind): number;
  cooldownLeft(): number;
  scrapValue(rec: StoredVehicle): number;
  /** Phone mode: call the Sling-Lift for uid. Returns an error sentence, or null when it is on its way (the sheet closes). */
  deliver(uid: string): string | null;
  /** Site mode: roll uid out beside the garage. Error or null (the sheet closes). */
  takeOut(uid: string): string | null;
  /** Site mode: scrap uid for scrapValue Acorns. Error or null (the list re-renders). */
  scrap(uid: string): string | null;
  /** Sheet opened (true) or closed (false): the game holds its controls meanwhile. */
  onOpenChange?(open: boolean): void;
  /** Phone mode: the garages to show as tabs, in order (the owned ones). Absent, or fewer than 2: no tab strip. */
  tabs?(): readonly { kind: StorageKind; label: string }[];
  /** Where a stored vehicle of `kind` waits, for the row text ("the Lock-Up", "Hangar Two"). Default 'the Lock-Up'. */
  placeName?(kind: StorageKind): string;
}

export interface LockupUi {
  open(kind: StorageKind, mode: LockupUiMode, title: string): void;
  close(): void;
  isOpen(): boolean;
  /** Re-render if open (cooldown ticking, a vehicle written off). */
  refresh(): void;
}

const SCRAP_CONFIRM_MS = 3000;

const CSS = `
#gta-lockup{position:fixed;inset:0;pointer-events:none;z-index:36;font-family:system-ui,-apple-system,sans-serif;color:#f4f6f8;}
#gta-lockup button{font:inherit;color:inherit;cursor:pointer;touch-action:manipulation;}
#gta-lockup .gta-lockup-backdrop{
  position:fixed;inset:0;display:none;align-items:center;justify-content:center;
  background:rgba(0,0,0,0.68);pointer-events:auto;box-sizing:border-box;
  padding:calc(env(safe-area-inset-top,0px) + 12px) calc(env(safe-area-inset-right,0px) + 12px)
          calc(env(safe-area-inset-bottom,0px) + 12px) calc(env(safe-area-inset-left,0px) + 12px);
}
#gta-lockup .gta-lockup-backdrop.open{display:flex;}
#gta-lockup .gta-lockup-modal{
  width:min(100%,520px);max-height:85vh;overflow-y:auto;-webkit-overflow-scrolling:touch;
  touch-action:pan-y;background:#181c20;border:2px solid rgba(255,255,255,0.22);
  border-radius:14px;padding:14px;box-sizing:border-box;box-shadow:0 12px 32px rgba(0,0,0,0.65);
  display:flex;flex-direction:column;gap:10px;
}
#gta-lockup .gta-lockup-head{display:flex;align-items:center;justify-content:space-between;gap:8px;}
#gta-lockup .gta-lockup-title{font-size:18px;font-weight:800;color:#ffd23f;margin:0;}
#gta-lockup .gta-lockup-sub{font-size:12px;opacity:0.78;margin-top:2px;}
#gta-lockup .gta-lockup-close{
  min-width:44px;min-height:44px;border-radius:10px;border:1px solid rgba(255,255,255,0.25);
  background:rgba(255,255,255,0.08);font-size:18px;font-weight:700;padding:0;flex:none;
}
#gta-lockup .gta-lockup-row{
  display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px;padding:10px 12px;border-radius:10px;
  background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.18);box-sizing:border-box;
}
#gta-lockup .gta-lockup-row.empty{background:rgba(255,255,255,0.03);border-style:dashed;opacity:0.7;}
#gta-lockup .gta-lockup-info{flex:1 1 160px;min-width:0;}
#gta-lockup .gta-lockup-name{font-size:15px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
#gta-lockup .gta-lockup-meta{font-size:12px;opacity:0.8;margin-top:2px;}
#gta-lockup .gta-lockup-hp{height:6px;border-radius:3px;background:rgba(255,255,255,0.14);margin-top:6px;overflow:hidden;}
#gta-lockup .gta-lockup-hp > span{display:block;height:100%;background:#7bd67b;}
#gta-lockup .gta-lockup-actions{display:flex;flex-wrap:wrap;gap:8px;}
#gta-lockup .gta-lockup-btn{
  min-width:44px;min-height:44px;padding:0 14px;border-radius:10px;border:2px solid #ffd23f;
  background:rgba(255,210,63,0.16);color:#ffd23f;font-size:14px;font-weight:800;
}
#gta-lockup .gta-lockup-btn.cool{opacity:0.55;}
#gta-lockup .gta-lockup-btn.danger{border-color:rgba(255,120,90,0.8);background:rgba(255,90,60,0.14);color:#ffb3a0;}
#gta-lockup .gta-lockup-btn.armed{background:#ff5a3c;color:#181c20;border-color:#ff5a3c;}
#gta-lockup .gta-lockup-msg{font-size:13px;color:#ffb3a0;min-height:18px;}
#gta-lockup .gta-lockup-tabs{display:flex;gap:8px;flex-wrap:wrap;}
#gta-lockup .gta-lockup-tab{min-width:44px;min-height:44px;padding:0 14px;border-radius:10px;border:2px solid rgba(255,255,255,0.25);background:rgba(255,255,255,0.06);color:#f4f6f8;font-size:14px;font-weight:800;}
#gta-lockup .gta-lockup-tab.on{border-color:#ffd23f;background:rgba(255,210,63,0.2);color:#ffd23f;}
`;

export function createLockupUi(ui: HTMLElement, deps: LockupUiDeps): LockupUi {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'gta-lockup';

  const backdrop = document.createElement('div');
  backdrop.className = 'gta-lockup-backdrop';

  const modal = document.createElement('div');
  modal.className = 'gta-lockup-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Lock-Up');

  backdrop.appendChild(modal);
  root.appendChild(backdrop);
  ui.appendChild(root);

  let isOpen = false;
  let kind: StorageKind = 'ground';
  let mode: LockupUiMode = 'phone';
  let title = 'Lock-Up';
  let message = '';
  let focus = 0;
  let polling = false;
  let padPrev: boolean[] = [];
  /** The uid whose Scrap is armed ("Really scrap?"), and when that arming expires. */
  let armed: { uid: string; until: number } | null = null;
  let armTimer: number | undefined;

  // Touches and clicks on the sheet must not start the stick, camera drag or pointer lock underneath.
  root.addEventListener('pointerdown', (e) => e.stopPropagation());
  modal.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  function focusables(): HTMLButtonElement[] {
    return Array.from(modal.querySelectorAll<HTMLButtonElement>('button'));
  }

  function showFocus(): void {
    const list = focusables();
    const on = firstPad() ? list[focus] : undefined;
    list.forEach((b) => {
      b.style.outline = b === on ? '3px solid #7cf0ff' : '';
    });
  }

  function showMessage(text: string): void {
    message = text;
    const el = modal.querySelector<HTMLElement>('.gta-lockup-msg');
    if (el) el.textContent = text;
  }

  function button(label: string, cls: string, onClick: () => void): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `gta-lockup-btn ${cls}`.trim();
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  }

  function makeRow(uid: string | null, rec: StoredVehicle | null): HTMLElement {
    const row = document.createElement('div');
    row.className = 'gta-lockup-row';
    const info = document.createElement('div');
    info.className = 'gta-lockup-info';
    row.appendChild(info);

    if (!rec || uid === null) {
      row.classList.add('empty');
      const t = document.createElement('div');
      t.className = 'gta-lockup-name';
      t.textContent = 'Empty slot';
      info.appendChild(t);
      return row;
    }

    const name = document.createElement('div');
    name.className = 'gta-lockup-name';
    name.textContent = rec.name;
    info.appendChild(name);

    const pct = Math.round(rec.hp * 100);
    const out = deps.isOut(rec.uid);
    const meta = document.createElement('div');
    meta.className = 'gta-lockup-meta';
    const place = deps.placeName?.(kind) ?? 'the Lock-Up';
    meta.textContent = `${pct}% · ${out ? 'Out' : `In ${place}`}`;
    info.appendChild(meta);

    const hp = document.createElement('div');
    hp.className = 'gta-lockup-hp';
    hp.setAttribute('aria-hidden', 'true');
    const fill = document.createElement('span');
    fill.style.width = `${pct}%`;
    hp.appendChild(fill);
    info.appendChild(hp);

    const actions = document.createElement('div');
    actions.className = 'gta-lockup-actions';
    row.appendChild(actions);

    if (mode === 'phone') {
      const cooling = deps.cooldownLeft() > 0;
      const b = button(out ? 'Fetch it' : 'Deliver', cooling ? 'cool' : '', () => {
        const left = deps.cooldownLeft();
        if (left > 0) {
          showMessage(`Sling-Lift ready in ${Math.ceil(left)} s.`);
          return;
        }
        const err = deps.deliver(rec.uid);
        if (err) showMessage(err);
        else close();
      });
      actions.appendChild(b);
    } else {
      if (!out) {
        actions.appendChild(button('Take out', '', () => {
          const err = deps.takeOut(rec.uid);
          if (err) showMessage(err);
          else close();
        }));
      }
      const isArmed = armed !== null && armed.uid === rec.uid && Date.now() < armed.until;
      const scrapLabel = isArmed ? 'Really scrap?' : `Scrap (+${deps.scrapValue(rec)})`;
      actions.appendChild(button(scrapLabel, `danger${isArmed ? ' armed' : ''}`, () => {
        const now = Date.now();
        if (armed && armed.uid === rec.uid && now < armed.until) {
          armed = null;
          const err = deps.scrap(rec.uid);
          if (err) showMessage(err);
          render();
          return;
        }
        armed = { uid: rec.uid, until: now + SCRAP_CONFIRM_MS };
        message = '';
        render();
        window.clearTimeout(armTimer);
        armTimer = window.setTimeout(() => {
          if (isOpen) render();
        }, SCRAP_CONFIRM_MS + 50);
      }));
    }
    return row;
  }

  function selectTab(k: StorageKind): void {
    kind = k;
    message = '';
    armed = null;
    focus = 0;
    render();
  }

  function tabStrip(garages: readonly { kind: StorageKind; label: string }[]): HTMLElement {
    const strip = document.createElement('div');
    strip.className = 'gta-lockup-tabs';
    strip.setAttribute('role', 'tablist');
    for (const t of garages) {
      const on = t.kind === kind;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `gta-lockup-tab${on ? ' on' : ''}`;
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.textContent = t.label;
      b.addEventListener('click', () => selectTab(t.kind));
      strip.appendChild(b);
    }
    return strip;
  }

  function render(): void {
    if (!isOpen) return;
    modal.replaceChildren();

    const head = document.createElement('div');
    head.className = 'gta-lockup-head';
    const titles = document.createElement('div');
    const h = document.createElement('h2');
    h.className = 'gta-lockup-title';
    h.textContent = title;
    titles.appendChild(h);
    const sub = document.createElement('div');
    sub.className = 'gta-lockup-sub';
    if (mode === 'phone') {
      const left = deps.cooldownLeft();
      sub.textContent = `Sling-Lift: ${deps.fee(kind)} Acorns a drop` + (left > 0 ? ` · ready in ${Math.ceil(left)} s` : '');
    } else if (kind === 'air') {
      sub.textContent = 'Taxi an aircraft in and press T to store it.';
    } else if (kind === 'water') {
      sub.textContent = 'Bring a boat into the slip and press T to store it.';
    } else {
      sub.textContent = 'Drive a vehicle in and press T to store it.';
    }
    titles.appendChild(sub);
    head.appendChild(titles);

    const close_ = document.createElement('button');
    close_.type = 'button';
    close_.className = 'gta-lockup-close';
    close_.setAttribute('aria-label', 'Close');
    close_.textContent = '✕';
    close_.addEventListener('click', () => close());
    head.appendChild(close_);
    modal.appendChild(head);

    const garages = mode === 'phone' ? (deps.tabs?.() ?? []) : [];
    if (garages.length >= 2) modal.appendChild(tabStrip(garages));

    const list = deps.store.list(kind);
    const cap = deps.store.capacity(kind);
    for (let i = 0; i < cap; i++) {
      const rec = list[i] ?? null;
      modal.appendChild(makeRow(rec ? rec.uid : null, rec));
    }

    const msg = document.createElement('div');
    msg.className = 'gta-lockup-msg';
    msg.setAttribute('role', 'status');
    msg.textContent = message;
    modal.appendChild(msg);

    const count = focusables().length;
    focus = count > 0 ? Math.min(focus, count - 1) : 0;
    showFocus();
  }

  function pollPad(): void {
    if (!isOpen) {
      polling = false;
      return;
    }
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
      const count = focusables().length;
      if (count > 0) {
        if (up && !wasUp) { focus = (focus + count - 1) % count; showFocus(); }
        if (dn && !wasDn) { focus = (focus + 1) % count; showFocus(); }
      }
      const pressedB = down[1] && !padPrev[1];
      const pressedA = down[0] && !padPrev[0];
      const pressedLB = down[4] && !padPrev[4];
      const pressedRB = down[5] && !padPrev[5];
      const garages = mode === 'phone' ? (deps.tabs?.() ?? []) : [];
      padPrev = down;
      if (pressedB) { close(); return; }
      if (garages.length >= 2 && (pressedLB || pressedRB)) {
        const n = garages.length;
        const cur = Math.max(0, garages.findIndex((t) => t.kind === kind));
        const next = pressedRB ? (cur + 1) % n : (cur + n - 1) % n;
        selectTab(garages[next].kind);
        requestAnimationFrame(pollPad);
        return;
      }
      if (pressedA) focusables()[focus]?.click();
    }
    requestAnimationFrame(pollPad);
  }

  function onKey(e: KeyboardEvent): void {
    if (!isOpen) return;
    if (e.code !== KEYS.close || isTyping(e)) return;
    e.stopImmediatePropagation();
    close();
  }

  function open_(k: StorageKind, m: LockupUiMode, t: string): void {
    kind = k;
    mode = m;
    title = t;
    message = '';
    armed = null;
    focus = 0;
    isOpen = true;
    backdrop.classList.add('open');
    if (document.pointerLockElement) document.exitPointerLock();
    document.body.dataset.options = 'open';
    // Buttons already held when it opened (the press that opened it) must not count as new presses.
    const p = firstPad();
    padPrev = p ? p.buttons.map((b) => b.pressed) : [];
    render();
    deps.onOpenChange?.(true);
    if (!polling) {
      polling = true;
      requestAnimationFrame(pollPad);
    }
  }

  function close(): void {
    if (!isOpen) return;
    isOpen = false;
    armed = null;
    window.clearTimeout(armTimer);
    backdrop.classList.remove('open');
    modal.replaceChildren();
    document.body.dataset.options = '';
    deps.onOpenChange?.(false);
  }

  window.addEventListener('keydown', onKey);

  return {
    open: open_,
    close,
    isOpen: () => isOpen,
    refresh: () => render(),
  };
}
