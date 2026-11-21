// DOM UI for Gnomecino Pull-Tabs: 3 themed tickets (Trollin' Gnomes, Goblinomicon, Turfton Heat) with tactile pull-back tabs.
import { PULLTAB_THEMES, getPullTabSpec } from './catalog';
import { ticketFinished } from './engine';
import type { PullTabState, PullTabThemeId } from './types';

export interface PullTabsHudApi {
  selectTheme(id: PullTabThemeId): void;
  buy(): void;
  pull(index: 0 | 1 | 2): void;
  pullAll(): void;
  rebuy(): void;
  backToBlackjack(): void;
  goToSlots(): void;
}

export interface PullTabsHud {
  update(visible: boolean, st: PullTabState, chips: number): void;
}

const CSS = `
#pulltabs-hud { position: fixed; inset: 0; pointer-events: none; font-family: system-ui, sans-serif; color: #f4ead8; z-index: 6;
  display: flex; flex-direction: column; align-items: center; justify-content: space-between;
  padding: calc(10px + env(safe-area-inset-top)) calc(10px + env(safe-area-inset-right)) calc(14px + env(safe-area-inset-bottom)) calc(10px + env(safe-area-inset-left)); }
#pulltabs-hud .pt-top { pointer-events: auto; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; justify-content: center;
  background: rgba(18, 12, 8, 0.9); border: 1px solid #5b4530; padding: 6px 10px; border-radius: 10px; max-width: 100%; }
#pulltabs-hud .pt-chips { font: 800 15px system-ui, sans-serif; color: #7ddc6a; padding: 0 6px; }
#pulltabs-hud .pt-btn-sm { min-height: 36px; padding: 0 11px; font: 700 13px system-ui, sans-serif; border-radius: 8px;
  border: 1px solid #5b4530; background: #3a2c1e; color: #f4ead8; cursor: pointer; }
#pulltabs-hud .pt-btn-sm:hover:not(:disabled) { background: #4d3b29; }
#pulltabs-hud .pt-btn-sm.active { background: #c9a24a; color: #1b1209; border-color: #ffd54f; }
#pulltabs-hud .pt-btn-sm:disabled { opacity: 0.45; cursor: default; }
#pulltabs-hud .pt-card { pointer-events: auto; width: min(410px, 94vw); border-radius: 16px; border: 4px solid #d62828;
  background: #233b54; box-shadow: 0 14px 36px #000b; padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; }
#pulltabs-hud .pt-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
#pulltabs-hud .pt-name { font: 900 20px/1.1 system-ui, sans-serif; letter-spacing: 0.5px; text-shadow: 0 2px 0 #0008; }
#pulltabs-hud .pt-sub { font: 600 12px system-ui, sans-serif; opacity: 0.85; margin-top: 2px; }
#pulltabs-hud .pt-cost { font: 900 15px system-ui, sans-serif; background: #0006; padding: 5px 10px; border-radius: 8px; white-space: nowrap; }
#pulltabs-hud .pt-pay { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; background: #0005; border-radius: 10px; padding: 6px; }
#pulltabs-hud .pt-paycell { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 2px; font-size: 11px; }
#pulltabs-hud .pt-payglyph { font-size: 19px; line-height: 1.1; }
#pulltabs-hud .pt-payamt { font: 800 12px system-ui, sans-serif; color: #ffd54f; }
#pulltabs-hud .pt-tabs { display: flex; flex-direction: column; gap: 8px; }
#pulltabs-hud .pt-tab { position: relative; min-height: 54px; border-radius: 10px; border: 2px dashed #ffffff66;
  background: #f6eedb; color: #1b1209; display: flex; align-items: center; justify-content: space-between; padding: 6px 12px;
  cursor: pointer; transition: transform 0.1s ease; overflow: hidden; }
#pulltabs-hud .pt-tab.covered { background: #d62828; color: #fff; justify-content: center; font: 900 15px system-ui, sans-serif;
  letter-spacing: 1px; border-style: dashed; border-color: #fff9; }
#pulltabs-hud .pt-tab.covered:hover { transform: scale(1.015); filter: brightness(1.08); }
#pulltabs-hud .pt-tab.win { background: #fff3bf; border: 2px solid #ffd54f; box-shadow: 0 0 14px #ffd54f66; }
#pulltabs-hud .pt-tab.dim { opacity: 0.55; cursor: default; }
#pulltabs-hud .pt-syms { display: flex; gap: 14px; font-size: 26px; align-items: center; }
#pulltabs-hud .pt-winbadge { font: 900 14px system-ui, sans-serif; color: #9a1c2c; }
#pulltabs-hud .pt-ctl { pointer-events: auto; display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; align-items: center;
  background: rgba(18, 12, 8, 0.9); border: 1px solid #5b4530; padding: 8px 12px; border-radius: 12px; }
#pulltabs-hud .pt-btn { min-height: 46px; padding: 0 18px; font: 800 16px system-ui, sans-serif; border-radius: 10px;
  border: 0; cursor: pointer; }
#pulltabs-hud .pt-btn.buy { background: #7ddc6a; color: #12200e; }
#pulltabs-hud .pt-btn.pullall { background: #ffd54f; color: #1b1209; }
#pulltabs-hud .pt-btn:disabled { opacity: 0.4; cursor: default; }
#pulltabs-hud .pt-result { font: 800 14px system-ui, sans-serif; color: #ffd54f; text-align: center; min-height: 18px; }
@media (max-width: 480px) {
  #pulltabs-hud .pt-card { padding: 10px; gap: 8px; }
  #pulltabs-hud .pt-name { font-size: 18px; }
  #pulltabs-hud .pt-tab { min-height: 48px; }
  #pulltabs-hud .pt-syms { font-size: 22px; gap: 10px; }
}
`;

export function createPullTabsHud(ui: HTMLElement, api: PullTabsHudApi): PullTabsHud {
  if (!document.getElementById('pulltabs-hud-style')) {
    const style = document.createElement('style');
    style.id = 'pulltabs-hud-style';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  const root = document.createElement('div');
  root.id = 'pulltabs-hud';
  root.style.display = 'none';
  ui.appendChild(root);

  // Top bar
  const top = document.createElement('div');
  top.className = 'pt-top';
  root.appendChild(top);

  const bjBtn = document.createElement('button');
  bjBtn.type = 'button';
  bjBtn.className = 'pt-btn-sm';
  bjBtn.textContent = '🪑 Blackjack';
  bjBtn.addEventListener('click', () => api.backToBlackjack());

  const slotsBtn = document.createElement('button');
  slotsBtn.type = 'button';
  slotsBtn.className = 'pt-btn-sm';
  slotsBtn.textContent = '🎰 Slots';
  slotsBtn.addEventListener('click', () => api.goToSlots());

  const chipsEl = document.createElement('span');
  chipsEl.className = 'pt-chips';

  const rebuyBtn = document.createElement('button');
  rebuyBtn.type = 'button';
  rebuyBtn.className = 'pt-btn-sm';
  rebuyBtn.textContent = '+100 🪙';
  rebuyBtn.addEventListener('click', () => api.rebuy());

  top.append(bjBtn, slotsBtn, chipsEl, rebuyBtn);

  const themeBtns = new Map<PullTabThemeId, HTMLButtonElement>();
  for (const t of PULLTAB_THEMES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pt-btn-sm';
    b.textContent = `${t.name} · ${t.cost}`;
    b.addEventListener('click', () => api.selectTheme(t.id));
    top.appendChild(b);
    themeBtns.set(t.id, b);
  }

  // Ticket card
  const card = document.createElement('div');
  card.className = 'pt-card';
  root.appendChild(card);

  const head = document.createElement('div');
  head.className = 'pt-head';
  const titleWrap = document.createElement('div');
  const nameEl = document.createElement('div');
  nameEl.className = 'pt-name';
  const subEl = document.createElement('div');
  subEl.className = 'pt-sub';
  titleWrap.append(nameEl, subEl);
  const costEl = document.createElement('div');
  costEl.className = 'pt-cost';
  head.append(titleWrap, costEl);

  const payGrid = document.createElement('div');
  payGrid.className = 'pt-pay';

  const tabsWrap = document.createElement('div');
  tabsWrap.className = 'pt-tabs';
  const tabEls: HTMLButtonElement[] = [];
  for (const idx of [0, 1, 2] as const) {
    const t = document.createElement('button');
    t.type = 'button';
    t.className = 'pt-tab covered';
    t.addEventListener('click', () => api.pull(idx));
    tabsWrap.appendChild(t);
    tabEls.push(t);
  }

  const resultEl = document.createElement('div');
  resultEl.className = 'pt-result';

  card.append(head, payGrid, tabsWrap, resultEl);

  // Bottom controls
  const ctl = document.createElement('div');
  ctl.className = 'pt-ctl';
  root.appendChild(ctl);

  const buyBtn = document.createElement('button');
  buyBtn.type = 'button';
  buyBtn.className = 'pt-btn buy';
  buyBtn.addEventListener('click', () => api.buy());

  const pullAllBtn = document.createElement('button');
  pullAllBtn.type = 'button';
  pullAllBtn.className = 'pt-btn pullall';
  pullAllBtn.textContent = '🎟️ Pull All Tabs';
  pullAllBtn.addEventListener('click', () => api.pullAll());

  ctl.append(buyBtn, pullAllBtn);

  let renderedTheme: PullTabThemeId | null = null;

  return {
    update(visible, st, chips) {
      root.style.display = visible ? 'flex' : 'none';
      if (!visible) return;

      const spec = getPullTabSpec(st.themeId);
      const finished = ticketFinished(st);

      chipsEl.textContent = `🪙 ${chips}`;
      rebuyBtn.style.display = chips < spec.cost ? '' : 'none';

      for (const [id, b] of themeBtns) {
        b.classList.toggle('active', id === st.themeId);
        b.disabled = !finished && id !== st.themeId;
      }

      if (renderedTheme !== st.themeId) {
        renderedTheme = st.themeId;
        card.style.background = spec.cardBg;
        card.style.borderColor = spec.border;
        nameEl.style.color = spec.accent;
        nameEl.textContent = spec.name;
        subEl.textContent = spec.subtitle;
        costEl.textContent = `🪙 ${spec.cost}`;

        payGrid.innerHTML = '';
        for (const p of spec.payouts) {
          const sym = spec.symbols.find((s) => s.id === p.symbolId);
          const cell = document.createElement('div');
          cell.className = 'pt-paycell';
          cell.innerHTML = `<span class="pt-payglyph">${sym?.glyph ?? '?'}</span><span class="pt-payamt">🪙${p.payout}</span>`;
          payGrid.appendChild(cell);
        }
      }

      for (let i = 0; i < 3; i++) {
        const btn = tabEls[i]!;
        const row = st.rows?.[i];
        if (!row) {
          btn.className = 'pt-tab covered dim';
          btn.style.background = spec.tabBg;
          btn.textContent = `TAB ${i + 1} · BUY A TICKET`;
          btn.disabled = true;
        } else if (!row.pulled) {
          btn.className = 'pt-tab covered';
          btn.style.background = spec.tabBg;
          btn.textContent = `PEEL TAB ${i + 1}`;
          btn.disabled = false;
        } else {
          btn.className = row.win > 0 ? 'pt-tab win' : 'pt-tab';
          btn.style.background = '';
          btn.disabled = true;
          const glyphs = row.symbols
            .map((id) => spec.symbols.find((s) => s.id === id)?.glyph ?? '?')
            .map((g) => `<span>${g}</span>`)
            .join('');
          const badge = row.win > 0 ? `<span class="pt-winbadge">+🪙${row.win} ${row.winLabel}</span>` : '<span style="opacity:0.55;font-weight:700;font-size:12px">NO MATCH</span>';
          btn.innerHTML = `<span class="pt-syms">${glyphs}</span>${badge}`;
        }
      }

      if (!st.rows) {
        resultEl.textContent = `Ticket ready · Tap Buy Ticket for 🪙 ${spec.cost}`;
      } else if (!finished) {
        resultEl.textContent = `Ticket #${st.ticketId} · Peel each tab!`;
      } else if (st.totalWin > 0) {
        resultEl.textContent = `Ticket #${st.ticketId} · WON 🪙 ${st.totalWin}!`;
      } else {
        resultEl.textContent = `Ticket #${st.ticketId} · Better luck next slip!`;
      }

      buyBtn.textContent = `🎟️ Buy Ticket (🪙 ${spec.cost})`;
      buyBtn.disabled = !finished || chips < spec.cost;
      pullAllBtn.disabled = !st.rows || finished;
    },
  };
}
