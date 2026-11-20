// ?drive=sim only: a small tune picker. A pill button (or T) opens a list of tunes; picking one retunes the mower live.
import { firstPad } from '@lawn/gamepad';
import { TUNES, getTune, type Tune } from './simdrive';

export function createSimMenu(ui: HTMLElement, onPick: (t: Tune) => void): void {
  const root = document.createElement('div');
  root.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top) + 8px);left:50%;transform:translateX(-50%);z-index:30;display:flex;flex-direction:column;align-items:center;gap:6px;font:600 14px system-ui,sans-serif;color:#fff;pointer-events:none;';
  const pill = document.createElement('button');
  pill.type = 'button';
  pill.style.cssText = 'min-height:44px;padding:0 16px;border-radius:22px;border:2px solid rgba(255,255,255,0.7);background:rgba(20,20,20,0.6);color:#fff;font:inherit;pointer-events:auto;touch-action:manipulation;';
  const panel = document.createElement('div');
  panel.style.cssText = 'display:none;flex-direction:column;gap:6px;padding:8px;border-radius:12px;background:rgba(20,20,20,0.82);max-width:min(92vw,340px);pointer-events:auto;';
  const hint = document.createElement('div');
  hint.style.cssText = 'font-weight:400;font-size:12px;opacity:.8;padding:2px 4px;';
  hint.textContent = 'Handbrake: Space, A on a pad, or the Handbrake button on touch.';
  panel.appendChild(hint);
  root.append(pill, panel);
  ui.appendChild(root);

  const buttons = new Map<string, HTMLButtonElement>();
  const label = (): void => { pill.textContent = `Tune: ${getTune().name} (T)`; };
  const mark = (): void => buttons.forEach((b, id) => { b.style.borderColor = id === getTune().id ? '#ffd23f' : 'rgba(255,255,255,0.3)'; });

  for (const t of TUNES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.style.cssText = 'min-height:48px;padding:6px 12px;text-align:left;border-radius:8px;border:2px solid rgba(255,255,255,0.3);background:rgba(255,255,255,0.08);color:#fff;font:inherit;touch-action:manipulation;';
    b.innerHTML = `<div>${t.name}</div><div style="font-weight:400;font-size:12px;opacity:.8">${t.blurb}</div>`;
    b.addEventListener('click', () => { onPick(t); label(); mark(); setOpen(false); });
    buttons.set(t.id, b);
    panel.insertBefore(b, hint);
  }

  // Gamepad: while open the menu owns the pad (input.ts reads body[data-sim-menu]); D-pad or stick picks, A selects, B / Start close.
  const ids = TUNES.map((t) => t.id);
  let focus = 0;
  let isOpen = false;
  let padPrev: boolean[] = [];
  const showFocus = (): void => buttons.forEach((b, id) => { b.style.outline = id === ids[focus] ? '3px solid #7cf0ff' : 'none'; });
  function pollPad(): void {
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
      if (up && !wasUp) { focus = (focus + ids.length - 1) % ids.length; showFocus(); }
      if (dn && !wasDn) { focus = (focus + 1) % ids.length; showFocus(); }
      if (down[0] && !padPrev[0]) { buttons.get(ids[focus])?.click(); return; }
      if ((down[1] && !padPrev[1]) || (down[9] && !padPrev[9])) { setOpen(false); return; }
      padPrev = down;
    }
    requestAnimationFrame(pollPad);
  }
  function setOpen(open: boolean): void {
    isOpen = open;
    panel.style.display = open ? 'flex' : 'none';
    document.body.dataset.simMenu = open ? 'open' : '';
    if (open) {
      if (document.pointerLockElement) document.exitPointerLock();
      focus = Math.max(0, ids.indexOf(getTune().id));
      showFocus();
      // Buttons already held when it opened (the Start press itself) must not count as new presses.
      const p = firstPad();
      padPrev = p ? p.buttons.map((b) => b.pressed) : [];
      requestAnimationFrame(pollPad);
    }
  }
  const toggle = (): void => setOpen(!isOpen);
  window.addEventListener('gta:tune-menu', toggle);
  // Keep touches and clicks on the menu from starting the stick, camera drag or pointer lock underneath.
  root.addEventListener('pointerdown', (e) => e.stopPropagation());
  pill.addEventListener('click', toggle);
  window.addEventListener('keydown', (e) => { if (e.code === 'KeyT' && !e.repeat) toggle(); });
  label();
  mark();
}
