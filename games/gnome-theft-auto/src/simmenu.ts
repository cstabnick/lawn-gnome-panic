// ?drive=sim only: a small tune picker. A pill button (or T) opens a list of tunes; picking one retunes the mower live.
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
  hint.textContent = 'Handbrake: Space, or the Handbrake button on touch.';
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

  function setOpen(open: boolean): void {
    panel.style.display = open ? 'flex' : 'none';
    if (open && document.pointerLockElement) document.exitPointerLock();
  }
  const toggle = (): void => setOpen(panel.style.display === 'none');
  // Keep touches and clicks on the menu from starting the stick, camera drag or pointer lock underneath.
  root.addEventListener('pointerdown', (e) => e.stopPropagation());
  pill.addEventListener('click', toggle);
  window.addEventListener('keydown', (e) => { if (e.code === 'KeyT' && !e.repeat) toggle(); });
  label();
  mark();
}
