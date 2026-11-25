// The Ledger phone app (E08): Acorns, Kiln-Debt and every loan beside it (pay a loan down), the properties owned and
// the ones for sale (buy on a loan through ownership.ts). E10 / E16 only register PropertyDefs; they show up here.
// DOM only; every action goes through deps. Copies the sheet structure of lockup/ui.ts.
import { KEYS } from './keys';
import { ECON_ACH } from './econAchievements';
import { listProperties } from './ownership';
import type { Economy } from './economy';
import type { Ownership } from './ownership';
import type { Phone } from './phone/phone';
import type { Sfx } from './types';

export interface LedgerDeps {
  /** The shared #ui element. */
  ui: HTMLElement;
  hud: { toast(text: string, ms?: number): void; banner(text: string, ms?: number): void };
  phone: Phone;
  economy: Pick<Economy, 'state' | 'payLoan' | 'totalOwed'>;
  ownership: Ownership;
  play(sfx: Sfx): void;
  achievements: { unlock(id: string): unknown };
  blocked(): string | null;
  /** Sheet opened (true) or closed (false): the game holds its controls meanwhile. */
  onOpenChange?(open: boolean): void;
}

export interface Ledger {
  isOpen(): boolean;
}

const CSS = `
#gta-ledger{position:fixed;inset:0;pointer-events:none;z-index:36;font-family:system-ui,-apple-system,sans-serif;color:#f4f6f8;}
#gta-ledger button{font:inherit;color:inherit;cursor:pointer;touch-action:manipulation;}
#gta-ledger .gta-ledger-backdrop{
  position:fixed;inset:0;display:none;align-items:flex-end;justify-content:center;
  background:rgba(0,0,0,0.68);pointer-events:auto;box-sizing:border-box;
  padding:calc(env(safe-area-inset-top,0px) + 12px) calc(env(safe-area-inset-right,0px) + 12px)
          calc(env(safe-area-inset-bottom,0px) + 12px) calc(env(safe-area-inset-left,0px) + 12px);
}
#gta-ledger .gta-ledger-backdrop.open{display:flex;}
#gta-ledger .gta-ledger-modal{
  width:min(100%,560px);max-height:85vh;overflow-y:auto;-webkit-overflow-scrolling:touch;
  touch-action:pan-y;background:#181c20;border:2px solid rgba(255,255,255,0.22);
  border-radius:14px;padding:14px;box-sizing:border-box;box-shadow:0 12px 32px rgba(0,0,0,0.65);
  display:flex;flex-direction:column;gap:10px;
}
#gta-ledger .gta-ledger-head{display:flex;align-items:center;justify-content:space-between;gap:8px;}
#gta-ledger .gta-ledger-title{font-size:18px;font-weight:800;color:#ffd23f;margin:0;}
#gta-ledger .gta-ledger-sub{font-size:12px;opacity:0.78;margin-top:2px;}
#gta-ledger .gta-ledger-close{
  min-width:44px;min-height:44px;border-radius:10px;border:1px solid rgba(255,255,255,0.25);
  background:rgba(255,255,255,0.08);font-size:18px;font-weight:700;padding:0;flex:none;
}
#gta-ledger .gta-ledger-section{font-size:13px;font-weight:800;color:#ffd23f;text-transform:uppercase;margin-top:4px;}
#gta-ledger .gta-ledger-row{
  display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px;padding:10px 12px;border-radius:10px;
  background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.18);box-sizing:border-box;
}
#gta-ledger .gta-ledger-info{flex:1 1 160px;min-width:0;}
#gta-ledger .gta-ledger-name{font-size:15px;font-weight:800;}
#gta-ledger .gta-ledger-meta{font-size:12px;opacity:0.8;margin-top:2px;}
#gta-ledger .gta-ledger-paid{color:#7bd67b;font-weight:800;}
#gta-ledger .gta-ledger-badge{
  font-size:12px;font-weight:800;color:#7bd67b;border:1px solid rgba(123,214,123,0.6);
  border-radius:8px;padding:6px 10px;min-height:44px;box-sizing:border-box;display:flex;align-items:center;
}
#gta-ledger .gta-ledger-actions{display:flex;flex-wrap:wrap;gap:8px;}
#gta-ledger .gta-ledger-btn{
  min-width:44px;min-height:44px;padding:0 14px;border-radius:10px;border:2px solid #ffd23f;
  background:rgba(255,210,63,0.16);color:#ffd23f;font-size:14px;font-weight:800;
}
#gta-ledger .gta-ledger-msg{font-size:13px;color:#ffb3a0;min-height:18px;}
#gta-ledger .gta-ledger-total{font-size:14px;font-weight:800;text-align:right;}
#gta-ledger .gta-ledger-empty{font-size:13px;opacity:0.7;}
`;

export function createLedger(deps: LedgerDeps): Ledger {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'gta-ledger';

  const backdrop = document.createElement('div');
  backdrop.className = 'gta-ledger-backdrop';

  const modal = document.createElement('div');
  modal.className = 'gta-ledger-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Ledger');

  backdrop.appendChild(modal);
  root.appendChild(backdrop);
  deps.ui.appendChild(root);

  let isOpen = false;
  let message = '';

  // Touches and clicks on the sheet must not start the stick, camera drag or pointer lock underneath.
  modal.addEventListener('pointerdown', (e) => e.stopPropagation());
  modal.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  function button(label: string, cls: string, onClick: () => void): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `gta-ledger-btn ${cls}`.trim();
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  }

  function text(tag: string, cls: string, value: string): HTMLElement {
    const el = document.createElement(tag);
    el.className = cls;
    el.textContent = value;
    return el;
  }

  function payLoanAction(id: string, name: string, amount: number | 'all', remaining: number): void {
    const want = amount === 'all' ? remaining : amount;
    const paid = deps.economy.payLoan(id, want);
    if (paid <= 0) {
      message = 'Not enough Acorns.';
      render();
      return;
    }
    message = '';
    deps.play('door');
    deps.hud.toast(`Paid ${paid} Acorns off the ${name}.`);
    const stillOpen = deps.economy.state().loans.some((l) => l.id === id);
    if (!stillOpen) deps.hud.banner(`${name} paid off.`);
    render();
  }

  function buyAction(id: string, name: string): void {
    const r = deps.ownership.buyProperty(id);
    if (!r.ok) {
      message = r.error;
      render();
      return;
    }
    message = '';
    deps.hud.banner(`${name} is yours`);
    deps.play('door');
    deps.achievements.unlock(ECON_ACH.property);
    render();
  }

  function sectionTitle(label: string): HTMLElement {
    return text('div', 'gta-ledger-section', label);
  }

  function render(): void {
    if (!isOpen) return;
    modal.replaceChildren();
    const s = deps.economy.state();

    const head = document.createElement('div');
    head.className = 'gta-ledger-head';
    const titles = document.createElement('div');
    titles.appendChild(text('h2', 'gta-ledger-title', 'Ledger'));
    titles.appendChild(text('div', 'gta-ledger-sub', `${s.acorns} 🌰 in the wallet`));
    head.appendChild(titles);
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'gta-ledger-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => close());
    head.appendChild(closeBtn);
    modal.appendChild(head);

    // Owed
    modal.appendChild(sectionTitle('Owed'));
    const debtRow = document.createElement('div');
    debtRow.className = 'gta-ledger-row';
    const debtInfo = document.createElement('div');
    debtInfo.className = 'gta-ledger-info';
    debtInfo.appendChild(text('div', 'gta-ledger-name', 'Clay-Mart Kiln-Debt'));
    if (s.debtPaidOff || s.debtRemaining <= 0) {
      debtInfo.appendChild(text('div', 'gta-ledger-meta gta-ledger-paid', 'Paid off'));
    } else {
      debtInfo.appendChild(text('div', 'gta-ledger-meta', `${s.debtRemaining} 🌰`));
    }
    debtRow.appendChild(debtInfo);
    modal.appendChild(debtRow);

    for (const loan of s.loans) {
      const row = document.createElement('div');
      row.className = 'gta-ledger-row';
      const info = document.createElement('div');
      info.className = 'gta-ledger-info';
      info.appendChild(text('div', 'gta-ledger-name', loan.name));
      info.appendChild(text('div', 'gta-ledger-meta', `${loan.remaining} of ${loan.principal} 🌰`));
      row.appendChild(info);
      const actions = document.createElement('div');
      actions.className = 'gta-ledger-actions';
      actions.appendChild(button('Pay 50', '', () => payLoanAction(loan.id, loan.name, 50, loan.remaining)));
      actions.appendChild(button('Pay all', '', () => payLoanAction(loan.id, loan.name, 'all', loan.remaining)));
      row.appendChild(actions);
      modal.appendChild(row);
    }

    modal.appendChild(text('div', 'gta-ledger-total', `Total owed ${deps.economy.totalOwed()} 🌰`));

    // Property
    modal.appendChild(sectionTitle('Property'));
    const defs = listProperties();
    if (defs.length === 0) {
      modal.appendChild(text('div', 'gta-ledger-empty', 'Nothing for sale yet.'));
    }
    for (const def of defs) {
      const row = document.createElement('div');
      row.className = 'gta-ledger-row';
      const info = document.createElement('div');
      info.className = 'gta-ledger-info';
      info.appendChild(text('div', 'gta-ledger-name', def.name));
      if (def.blurb) info.appendChild(text('div', 'gta-ledger-meta', def.blurb));
      info.appendChild(text('div', 'gta-ledger-meta', `price ${def.price} · ${def.down} down · rest on a loan`));
      row.appendChild(info);
      if (deps.ownership.ownsProperty(def.id)) {
        row.appendChild(text('div', 'gta-ledger-badge', 'Yours'));
      } else if (def.buyHint) {
        row.appendChild(text('div', 'gta-ledger-meta', def.buyHint));
      } else {
        const actions = document.createElement('div');
        actions.className = 'gta-ledger-actions';
        actions.appendChild(button('Buy', '', () => buyAction(def.id, def.name)));
        row.appendChild(actions);
      }
      modal.appendChild(row);
    }

    const msg = text('div', 'gta-ledger-msg', message);
    msg.setAttribute('role', 'status');
    modal.appendChild(msg);
  }

  function open(): void {
    message = '';
    isOpen = true;
    backdrop.classList.add('open');
    if (document.pointerLockElement) document.exitPointerLock();
    document.body.dataset.options = 'open';
    render();
    deps.onOpenChange?.(true);
  }

  function close(): void {
    if (!isOpen) return;
    isOpen = false;
    backdrop.classList.remove('open');
    modal.replaceChildren();
    document.body.dataset.options = '';
    deps.onOpenChange?.(false);
  }

  window.addEventListener('keydown', (e) => {
    if (!isOpen) return;
    if (e.code !== KEYS.close) return;
    e.stopImmediatePropagation();
    close();
  });

  deps.phone.addApp({
    id: 'ledger',
    label: 'Ledger',
    icon: '📒',
    detail: () => {
      const s = deps.economy.state();
      return `${s.acorns} 🌰 · owe ${deps.economy.totalOwed()}`;
    },
    run() {
      const blocked = deps.blocked();
      if (blocked) deps.hud.toast(blocked);
      else open();
    },
  });

  return { isOpen: () => isOpen };
}
