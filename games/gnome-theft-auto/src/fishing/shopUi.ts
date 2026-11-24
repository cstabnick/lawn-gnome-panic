// Fishing: The Bent Pin's sheet (DOM): Shop tab (rods, bait, sell catch cards, the derby) and Journal tab (every species,
// a silhouette until landed). Phone-friendly. Opened at Wenna's counter (atCounter true) or anywhere from the fishing
// HUD's journal button (atCounter false: buying and selling are greyed out).
import { prefabIconElement } from '@lawn/prefabs';
import { KEYS } from '../keys';
import { ensureGlyphStyle, fillHintHtml } from '../ui/glyphs';
import { currentGlyphSet } from '../ui/inputSource';
import type { Sfx } from '../types';
import type { FishStore } from './fishSave';
import { BAITS, DEFAULT_BAIT, RODS } from './tackle';
import { FISH_SPECIES, catchValue, fishById } from './species';
import { FISH, SHOP } from './types';

export type ShopTab = 'shop' | 'journal';

export interface ShopUiDeps {
  store: FishStore;
  acorns(): number;
  spend(n: number, reason: string): boolean;
  earn(n: number, reason: string): void;
  /** After selling cards: count sold and Acorns paid (already earned through earn()). */
  onSold(count: number, acorns: number): void;
  /** After buying a rod or bait: its name. */
  onBought(name: string): void;
  /** Start the derby (pays the fee itself). False when one is running or the fee was not paid. */
  startDerby(): boolean;
  /** "Derby: 2:31 left, 84 / 150 cm" while one runs, else null. */
  derbyText(): string | null;
  play(sfx: Sfx): void;
}

export interface ShopUi {
  /** Open on a tab. atCounter false: the Shop tab's buttons are disabled with a note to visit the shop. */
  open(tab: ShopTab, atCounter: boolean): void;
  close(): void;
  isOpen(): boolean;
  /** Re-render if open (after a catch). */
  refresh(): void;
}

const ROOT_ID = 'gta-fish-shop';
const STYLE_ID = 'gta-fish-style';

/** Wenna's plain lines: about clips, cards and letting fish go. Never about harm. */
const KEEPER_LINES = [
  'Clip it, measure it, card it, and back it goes. Nobody is the loser here.',
  'Bring me your cards. Every centimetre counts, and so does the bait.',
  'The bent pin has no point, so the fish holds on and nobody gets poked. Back to the canal with you.',
];

const CSS = `
#gta-fish-shop{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:60;box-sizing:border-box;width:min(560px,calc(100vw - 32px));max-height:calc(100vh - 32px - env(safe-area-inset-top) - env(safe-area-inset-bottom));overflow:auto;-webkit-overflow-scrolling:touch;padding:14px;background:#173a40;color:#f4ecd0;border:2px solid #2f6a70;border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,0.55);font:14px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif;pointer-events:auto;}
#gta-fish-shop *{box-sizing:border-box;}
#gta-fish-shop .gf-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;}
#gta-fish-shop .gf-title{margin:0;font-size:20px;color:#f2c94c;}
#gta-fish-shop .gf-keeper{font-size:12px;opacity:0.85;margin-top:2px;}
#gta-fish-shop .gf-btn{min-width:44px;min-height:44px;padding:8px 12px;border-radius:8px;border:1px solid #f2c94c;background:#0f2a2e;color:#f4ecd0;font:inherit;font-weight:600;cursor:pointer;touch-action:manipulation;}
#gta-fish-shop .gf-btn:disabled{opacity:0.45;cursor:not-allowed;}
#gta-fish-shop .gf-close{padding:0;font-size:18px;}
#gta-fish-shop .gf-tabs{display:flex;gap:8px;margin:12px 0 4px;}
#gta-fish-shop .gf-tab{flex:1;}
#gta-fish-shop .gf-tab.active{background:#f2c94c;color:#1b2a2c;border-color:#ffe08a;}
#gta-fish-shop .gf-label{font-size:12px;text-transform:uppercase;letter-spacing:0.06em;opacity:0.8;margin:12px 0 4px;}
#gta-fish-shop .gf-note{font-size:13px;color:#f2d88a;margin:8px 0;}
#gta-fish-shop .gf-row{display:flex;align-items:center;gap:10px;min-height:44px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.08);}
#gta-fish-shop .gf-info{flex:1;min-width:0;}
#gta-fish-shop .gf-name{font-weight:700;}
#gta-fish-shop .gf-blurb{font-style:italic;opacity:0.9;font-size:13px;}
#gta-fish-shop .gf-meta{font-size:12px;color:#f2d88a;}
#gta-fish-shop .gf-actions{display:flex;flex-direction:column;align-items:flex-end;gap:4px;}
#gta-fish-shop .gf-tag{font-size:12px;opacity:0.85;}
#gta-fish-shop .gf-sell{width:100%;margin-top:8px;background:#f2c94c;color:#1b2a2c;}
#gta-fish-shop .gf-derby{font-weight:600;color:#f2c94c;margin:6px 0;}
#gta-fish-shop .gf-enter{width:100%;margin-top:8px;background:#f2c94c;color:#1b2a2c;}
#gta-fish-shop .gf-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:6px;}
@media (min-width:520px){#gta-fish-shop .gf-grid{grid-template-columns:repeat(3,minmax(0,1fr));}}
#gta-fish-shop .gf-card{background:rgba(0,0,0,0.22);border-radius:8px;padding:8px;min-width:0;}
#gta-fish-shop .gf-card .gf-name{overflow-wrap:anywhere;}
#gta-fish-shop .gf-rarity{font-size:12px;color:#f2d88a;}
#gta-fish-shop .gf-waters{font-size:12px;opacity:0.85;}
#gta-fish-shop .gf-sil{filter:brightness(0) opacity(0.45);}
#gta-fish-shop .gf-foot{margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:#f4ecd0;opacity:0.7;text-align:center;overflow:hidden;text-overflow:ellipsis;}
`;

function injectStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function cap(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function button(label: string, cls: string, enabled: boolean, onClick: () => void): HTMLButtonElement {
  const b = el('button', `gf-btn ${cls}`, label);
  b.type = 'button';
  b.disabled = !enabled;
  b.addEventListener('click', () => {
    if (b.disabled) return;
    onClick();
  });
  return b;
}

export function createShopUi(ui: HTMLElement, deps: ShopUiDeps): ShopUi {
  injectStyle();
  ensureGlyphStyle();
  let opened = false;
  let tab: ShopTab = 'shop';
  let atCounter = false;
  let keeperLine = KEEPER_LINES[0];

  const root = el('div', 'gf-sheet');
  root.id = ROOT_ID;
  root.style.display = 'none';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', SHOP.name);

  const head = el('div', 'gf-head');
  const titleWrap = el('div');
  const title = el('h2', 'gf-title', SHOP.name);
  const keeper = el('div', 'gf-keeper');
  titleWrap.append(title, keeper);
  const closeBtn = el('button', 'gf-btn gf-close', '✕');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close The Bent Pin');
  head.append(titleWrap, closeBtn);

  const tabsEl = el('div', 'gf-tabs');
  const tabBtns: { id: ShopTab; btn: HTMLButtonElement }[] = [];
  for (const [id, label] of [['shop', 'Shop'], ['journal', 'Journal']] as const) {
    const btn = el('button', 'gf-btn gf-tab', label);
    btn.type = 'button';
    btn.addEventListener('click', () => {
      tab = id;
      render();
    });
    tabBtns.push({ id, btn });
    tabsEl.appendChild(btn);
  }

  const body = el('div', 'gf-body');
  const foot = el('div', 'gf-foot');
  root.append(head, tabsEl, body, foot);
  ui.appendChild(root);

  // The sheet is modal for input: pointer and touch must not reach the game behind it.
  root.addEventListener('pointerdown', (e) => e.stopPropagation());
  root.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });

  function renderShop(): void {
    const store = deps.store;
    const d = store.data();
    const acorns = deps.acorns();
    if (!atCounter) body.appendChild(el('div', 'gf-note', 'Buy and sell at The Bent Pin, on the canal by Old Brick wharf.'));

    // Rods
    body.appendChild(el('div', 'gf-label', 'Rods'));
    for (const rod of RODS) {
      const row = el('div', 'gf-row');
      row.appendChild(prefabIconElement(rod.prefab, '🎣', 32));
      const info = el('div', 'gf-info');
      info.append(
        el('div', 'gf-name', rod.name),
        el('div', 'gf-blurb', rod.blurb),
        el('div', 'gf-meta', `Casts up to ${rod.castRange} m`),
      );
      row.appendChild(info);
      const actions = el('div', 'gf-actions');
      const using = d.rod === rod.id;
      if (store.ownsRod(rod.id)) {
        if (using) {
          actions.appendChild(button('Using', '', false, () => {}));
        } else {
          actions.appendChild(el('span', 'gf-tag', 'Owned'));
          actions.appendChild(button('Use', '', true, () => {
            store.selectRod(rod.id);
            render();
          }));
        }
      } else {
        actions.appendChild(button(`Buy (${rod.price} 🌰)`, '', atCounter && acorns >= rod.price, () => {
          const ok = store.buyRod(rod.id, (n) => deps.spend(n, rod.name));
          if (ok) {
            deps.play('shutter');
            deps.onBought(rod.name);
          }
          render();
        }));
      }
      row.appendChild(actions);
      body.appendChild(row);
    }

    // Bait
    body.appendChild(el('div', 'gf-label', 'Bait'));
    for (const b of BAITS) {
      const row = el('div', 'gf-row');
      row.appendChild(prefabIconElement(b.prefab, b.emoji, 32));
      const info = el('div', 'gf-info');
      info.append(el('div', 'gf-name', b.name), el('div', 'gf-blurb', b.blurb));
      const count = store.baitCount(b.id);
      const isDough = b.id === DEFAULT_BAIT;
      if (isDough) {
        info.appendChild(el('div', 'gf-meta', 'Free with every rod'));
      } else if (b.consumed) {
        info.appendChild(el('div', 'gf-meta', `You have ${count}`));
      } else {
        info.appendChild(el('div', 'gf-meta', count > 0 ? 'Owned' : 'Not bought yet'));
      }
      row.appendChild(info);

      const actions = el('div', 'gf-actions');
      if (!isDough) {
        const owned = !b.consumed && count > 0;
        actions.appendChild(button(`Buy ${b.pack} for ${b.price} 🌰`, '', atCounter && !owned && acorns >= b.price, () => {
          const ok = store.buyBait(b.id, (n) => deps.spend(n, b.name));
          if (ok) {
            deps.play('shutter');
            deps.onBought(b.name);
          }
          render();
        }));
      }
      if (d.bait === b.id && count > 0) {
        actions.appendChild(button('Using', '', false, () => {}));
      } else {
        actions.appendChild(button('Use', '', count > 0, () => {
          store.selectBait(b.id);
          render();
        }));
      }
      row.appendChild(actions);
      body.appendChild(row);
    }

    // Catch cards
    body.appendChild(el('div', 'gf-label', 'Catch cards'));
    let worth = 0;
    for (const c of d.cards) {
      const sp = fishById(c.id);
      if (sp) worth += catchValue(sp, c.size);
    }
    body.appendChild(el('div', 'gf-note', `${d.cards.length} cards (cap ${FISH.cardCap}), worth ${worth} Acorns`));
    const sell = button(`Sell all for ${worth} Acorns`, 'gf-sell', atCounter && d.cards.length > 0, () => {
      const r = store.sellCards();
      deps.earn(r.acorns, SHOP.name);
      deps.onSold(r.count, r.acorns);
      render();
    });
    body.appendChild(sell);

    // Derby
    body.appendChild(el('div', 'gf-label', 'Derby'));
    const live = deps.derbyText();
    if (live) {
      body.appendChild(el('div', 'gf-derby', live));
    } else {
      body.appendChild(el('div', 'gf-blurb',
        `The Bent Pin Derby: land ${FISH.derbyTarget} cm of fish in 3 minutes. Entry ${FISH.derbyFee} Acorns, prize ${FISH.derbyPrize} Acorns.`));
    }
    if (d.derbyBest > 0) body.appendChild(el('div', 'gf-meta', `Best: ${d.derbyBest} cm`));
    const enter = button(`Enter (${FISH.derbyFee} 🌰)`, 'gf-enter', atCounter && live === null && acorns >= FISH.derbyFee, () => {
      if (deps.startDerby()) close();
      else render();
    });
    body.appendChild(enter);
  }

  function renderJournal(): void {
    const d = deps.store.data();
    body.appendChild(el('div', 'gf-label', `${deps.store.speciesCaught()} of ${FISH_SPECIES.length} species`));
    body.appendChild(el('div', 'gf-note', `Landed: ${d.caught}`));
    const grid = el('div', 'gf-grid');
    for (const sp of FISH_SPECIES) {
      const entry = d.journal[sp.id];
      const caught = entry !== undefined && entry.caught > 0;
      const card = el('div', 'gf-card');
      const icon = prefabIconElement(sp.prefab, '🐟', 40);
      if (!caught) icon.classList.add('gf-sil');
      card.appendChild(icon);
      card.appendChild(el('div', 'gf-name', caught ? sp.name : '???'));
      card.appendChild(el('div', 'gf-rarity', cap(sp.rarity)));
      const hideWaters = !caught && sp.rarity === 'mythic';
      card.appendChild(el('div', 'gf-waters', hideWaters ? '???' : sp.waters.map(cap).join(', ')));
      if (caught && entry) {
        card.appendChild(el('div', 'gf-blurb', sp.blurb));
        card.appendChild(el('div', 'gf-meta',
          `Landed x${entry.caught} · best ${entry.best} cm · first ${entry.first}`));
      }
      grid.appendChild(card);
    }
    body.appendChild(grid);
  }

  function render(): void {
    for (const t of tabBtns) {
      const on = t.id === tab;
      t.btn.classList.toggle('active', on);
      t.btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    keeper.textContent = `${SHOP.keeper}: ${keeperLine}`;
    body.innerHTML = '';
    if (tab === 'shop') renderShop();
    else renderJournal();
  }

  function onKeydown(e: KeyboardEvent): void {
    if (e.code === KEYS.close && opened) close();
  }

  function refreshFoot(): void {
    foot.style.display = currentGlyphSet() === 'touch' ? 'none' : '';
    foot.innerHTML = fillHintHtml('{close} Close');
  }

  function open(t: ShopTab, at: boolean): void {
    tab = t;
    atCounter = at;
    keeperLine = KEEPER_LINES[Math.floor(Math.random() * KEEPER_LINES.length)];
    if (!opened) {
      opened = true;
      window.addEventListener('keydown', onKeydown);
    }
    root.style.display = '';
    if (document.pointerLockElement) document.exitPointerLock();
    refreshFoot();
    render();
  }

  function close(): void {
    if (!opened) return;
    opened = false;
    window.removeEventListener('keydown', onKeydown);
    root.style.display = 'none';
    body.innerHTML = '';
  }

  closeBtn.addEventListener('click', () => close());

  return {
    open,
    close,
    isOpen: () => opened,
    refresh() {
      if (opened) render();
    },
  };
}
