// DOM UI for playing slot machines: chips, bet selector, SPIN button, machine switcher, paytable, and Back to Blackjack.
import { getSlotSpec } from './catalog';
import { SLOT_PLACEMENTS } from './view';
import type { SlotState } from './types';

export interface SlotsHudApi {
  spin(): void;
  setBet(amount: number): void;
  selectMachine(machineId: string): void;
  backToBlackjack(): void;
  rebuy(): void;
  /** Free chips (no acorns), never above the Oakcount's free cap of 100. */
  freeChips(): void;
}

export interface SlotsHud {
  /** `cashier`: the out-of-chips button's text, and whether it can be pressed (enough acorns). */
  update(visible: boolean, st: SlotState, chips: number, cashier: { label: string; can: boolean; free: number }): void;
}

const CSS = `
#slots-hud { position: fixed; inset: 0; pointer-events: none; font-family: system-ui, sans-serif; color: #f4ead8; z-index: 6; }
#slots-hud .sl-top { position: absolute; left: calc(10px + env(safe-area-inset-left)); top: calc(10px + env(safe-area-inset-top));
  pointer-events: auto; display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
  background: rgba(18, 12, 8, 0.88); border: 1px solid #5b4530; padding: 6px 10px; border-radius: 10px; }
#slots-hud .sl-title { font: 800 14px system-ui, sans-serif; color: #ffd54f; }
#slots-hud .sl-chips { font: 800 15px system-ui, sans-serif; color: #7ddc6a; padding: 0 4px; }
#slots-hud .sl-btn-sm { min-height: 32px; padding: 0 11px; font: 700 13px system-ui, sans-serif; border-radius: 8px;
  border: 1px solid #5b4530; background: #3a2c1e; color: #f4ead8; cursor: pointer; }
#slots-hud .sl-btn-sm:hover:not(:disabled) { background: #4d3b29; }
#slots-hud .sl-btn-sm.active { background: #c9a24a; color: #1b1209; border-color: #ffd54f; }
#slots-hud .sl-banner { position: absolute; left: 50%; top: calc(64px + env(safe-area-inset-top)); transform: translateX(-50%);
  background: rgba(18, 12, 8, 0.92); border: 2px solid #ffd54f; border-radius: 14px; padding: 10px 20px;
  font: 900 22px system-ui, sans-serif; color: #ffd54f; text-align: center; box-shadow: 0 6px 24px #000a; }
#slots-hud .sl-banner.jackpot { background: linear-gradient(135deg, #4a1218, #2a0c0e); border-color: #ffe57f; color: #ffe57f;
  font-size: 26px; }
#slots-hud .sl-paytable { position: absolute; right: calc(10px + env(safe-area-inset-right)); top: calc(58px + env(safe-area-inset-top));
  pointer-events: auto; background: rgba(18, 12, 8, 0.92); border: 1px solid #5b4530; border-radius: 12px;
  padding: 10px 12px; min-width: 210px; font: 600 13px/1.45 system-ui, sans-serif; }
#slots-hud .sl-payrow { display: flex; justify-content: space-between; gap: 14px; border-bottom: 1px solid #ffffff14; padding: 2px 0; }
#slots-hud .sl-payrow:last-child { border-bottom: 0; }
#slots-hud .sl-paymul { color: #ffd54f; font-weight: 800; }
#slots-hud .sl-ctl { position: absolute; left: 50%; bottom: calc(14px + env(safe-area-inset-bottom)); transform: translateX(-50%);
  pointer-events: auto; display: flex; flex-direction: column; align-items: center; gap: 8px;
  background: rgba(18, 12, 8, 0.88); border: 1px solid #5b4530; padding: 10px 14px; border-radius: 14px;
  max-width: calc(100vw - 24px); }
#slots-hud .sl-row { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; align-items: center; }
#slots-hud .sl-btn { min-height: 46px; min-width: 58px; padding: 0 14px; font: 700 16px system-ui, sans-serif; border-radius: 10px;
  border: 0; background: #4a3a2a; color: #f4ead8; cursor: pointer; }
#slots-hud .sl-btn.sel { background: #c9a24a; color: #1b1209; }
#slots-hud .sl-btn.spin { background: #7ddc6a; color: #12200e; min-width: 148px; font-size: 18px; font-weight: 900; }
#slots-hud .sl-btn:disabled { opacity: 0.4; cursor: default; }
@media (max-width: 640px) {
  #slots-hud .sl-btn { min-height: 42px; min-width: 48px; padding: 0 10px; font-size: 14px; }
  #slots-hud .sl-btn.spin { min-width: 120px; font-size: 16px; }
}
`;

export function createSlotsHud(ui: HTMLElement, api: SlotsHudApi): SlotsHud {
  if (!document.getElementById('slots-hud-style')) {
    const style = document.createElement('style');
    style.id = 'slots-hud-style';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  const root = document.createElement('div');
  root.id = 'slots-hud';
  root.style.display = 'none';
  ui.appendChild(root);

  // Top bar
  const top = document.createElement('div');
  top.className = 'sl-top';
  root.appendChild(top);

  const backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.className = 'sl-btn-sm';
  backBtn.textContent = '🪑 Back to Blackjack';
  backBtn.addEventListener('click', () => api.backToBlackjack());
  top.appendChild(backBtn);

  const title = document.createElement('span');
  title.className = 'sl-title';
  top.appendChild(title);

  const chipsEl = document.createElement('span');
  chipsEl.className = 'sl-chips';
  top.appendChild(chipsEl);

  const machineBtns = new Map<string, HTMLButtonElement>();
  SLOT_PLACEMENTS.forEach((p, idx) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sl-btn-sm';
    b.textContent = `Slot ${idx + 1}`;
    b.addEventListener('click', () => api.selectMachine(p.id));
    top.appendChild(b);
    machineBtns.set(p.id, b);
  });

  let payOpen = false;
  const payBtn = document.createElement('button');
  payBtn.type = 'button';
  payBtn.className = 'sl-btn-sm';
  payBtn.textContent = 'Paytable';
  payBtn.addEventListener('click', () => {
    payOpen = !payOpen;
    payPanel.style.display = payOpen ? '' : 'none';
  });
  top.appendChild(payBtn);

  // Paytable panel
  const payPanel = document.createElement('div');
  payPanel.className = 'sl-paytable';
  payPanel.style.display = 'none';
  root.appendChild(payPanel);

  // Win banner
  const banner = document.createElement('div');
  banner.className = 'sl-banner';
  banner.style.display = 'none';
  root.appendChild(banner);

  // Bottom controls
  const ctl = document.createElement('div');
  ctl.className = 'sl-ctl';
  root.appendChild(ctl);

  const betRow = document.createElement('div');
  betRow.className = 'sl-row';
  ctl.appendChild(betRow);

  const betBtns: { amount: number; el: HTMLButtonElement }[] = [];
  for (const amt of [5, 10, 25, 50]) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sl-btn';
    b.textContent = `${amt}`;
    b.addEventListener('click', () => api.setBet(amt));
    betRow.appendChild(b);
    betBtns.push({ amount: amt, el: b });
  }

  const spinBtn = document.createElement('button');
  spinBtn.type = 'button';
  spinBtn.className = 'sl-btn spin';
  spinBtn.textContent = '🎰 SPIN';
  spinBtn.addEventListener('click', () => api.spin());
  betRow.appendChild(spinBtn);

  const rebuyBtn = document.createElement('button');
  rebuyBtn.type = 'button';
  rebuyBtn.className = 'sl-btn';
  rebuyBtn.textContent = '+100 Chips';
  rebuyBtn.style.display = 'none';
  rebuyBtn.addEventListener('click', () => api.rebuy());
  betRow.appendChild(rebuyBtn);

  const freeBtn = document.createElement('button');
  freeBtn.type = 'button';
  freeBtn.className = 'sl-btn spin';
  freeBtn.style.display = 'none';
  freeBtn.addEventListener('click', () => api.freeChips());
  betRow.insertBefore(freeBtn, rebuyBtn);

  let renderedSpecId = '';
  let isVisible = false;

  window.addEventListener('keydown', (e) => {
    if (!isVisible || e.repeat) return;
    if ((e.target as Element | null)?.closest?.('input, textarea')) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      api.spin();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      api.backToBlackjack();
    }
  });

  return {
    update(visible, st, chips, cashier) {
      isVisible = visible;
      const d = visible ? '' : 'none';
      if (root.style.display !== d) root.style.display = d;
      if (!visible) return;

      const spec = getSlotSpec(st.machineType);
      if (renderedSpecId !== spec.id) {
        renderedSpecId = spec.id;
        title.textContent = `🎰 ${spec.name}`;
        payPanel.innerHTML = spec.payouts
          .map((r) => `<div class="sl-payrow"><span>${r.label}</span><span class="sl-paymul">${r.multiplier}×</span></div>`)
          .join('');
      }

      chipsEl.textContent = `\u{1FA99} ${chips}`;
      for (const [id, b] of machineBtns) {
        b.classList.toggle('active', id === st.machineId);
      }

      const spinning = st.phase === 'spinning';
      for (const b of betBtns) {
        b.el.classList.toggle('sel', st.bet === b.amount);
        b.el.disabled = spinning || chips < b.amount;
      }

      const outOfChips = !spinning && chips < spec.minBet;
      spinBtn.style.display = outOfChips ? 'none' : '';
      rebuyBtn.style.display = outOfChips ? '' : 'none';
      freeBtn.style.display = outOfChips && cashier.free > 0 ? '' : 'none';
      freeBtn.textContent = `Free 🪙 +${cashier.free}`;
      if (outOfChips) {
        rebuyBtn.textContent = cashier.label;
        rebuyBtn.disabled = !cashier.can;
      }
      spinBtn.disabled = spinning || chips < st.bet;
      spinBtn.textContent = spinning ? 'Spinning…' : `🎰 SPIN (${st.bet})`;

      if (st.phase === 'payout' && st.lastWin > 0) {
        banner.style.display = '';
        banner.className = st.jackpot ? 'sl-banner jackpot' : 'sl-banner';
        banner.textContent = `${st.lastLabel} +${st.lastWin} \u{1FA99}`;
      } else {
        banner.style.display = 'none';
      }
    },
  };
}
