// Title menu and online waiting panel. STUB: issue 2E fills it in. Keep the exported signatures.
import { BOARD } from '../config';
import type { NetStatus } from '../net';

export interface MenuHandlers {
  onSolo(rounds: number): void;
  onQuickMatch(name: string): void;
  onRoom(code: string, name: string): void;
  onLeave(): void;
}
export interface Menu {
  show(mode: 'title' | 'waiting' | 'hidden'): void;
  setStatus(s: NetStatus): void;
  setOnlineAvailable(ok: boolean): void;
}

export function createMenu(parent: HTMLElement, h: MenuHandlers): Menu {
  const root = document.createElement('div');
  root.id = 'gp-menu';
  root.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none';
  const solo = document.createElement('button');
  solo.id = 'gp-solo';
  solo.textContent = 'PLAY VS CPUs';
  solo.style.cssText = 'pointer-events:auto;font:700 24px system-ui;padding:16px 28px';
  solo.onclick = () => h.onSolo(BOARD.defaultRounds);
  root.appendChild(solo);
  parent.appendChild(root);
  return {
    show(mode) { root.style.display = mode === 'title' ? 'flex' : 'none'; },
    setStatus() {},
    setOnlineAvailable() {},
  };
}
