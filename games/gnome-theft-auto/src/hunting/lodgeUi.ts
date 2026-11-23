// Tuft hunting: the lodge sheet (DOM). Two tabs: Lodge (license, game bag, sell all) and Journal (every species,
// taken or not). Opened at Hazel's counter (atLodge true) or anywhere from the hunt HUD's journal button (atLodge false:
// buying and selling are greyed out).
import { prefabIconElement } from '@lawn/prefabs';
import type { Sfx } from '../types';
import { itemInfo, type HuntStore } from './huntSave';
import { HUNT, LODGE, SPECIES } from './species';

export type LodgeTab = 'lodge' | 'journal';

export interface LodgeUiDeps {
  store: HuntStore;
  /** Acorns in the pocket now. */
  acorns(): number;
  spend(amount: number): boolean;
  earn(amount: number, reason: string): void;
  /** After a sale (the Acorns were already paid through earn). */
  onSold(items: number, acorns: number): void;
  /** After the license was bought. */
  onLicensed(): void;
  play(sfx: Sfx): void;
}

export interface LodgeUi {
  open(tab: LodgeTab, atLodge: boolean): void;
  close(): void;
  isOpen(): boolean;
  /** Re-render the open sheet (after the bag changed). */
  refresh(): void;
}

const ROOT_ID = 'gta-hunt-lodge';
const STYLE_ID = 'gta-hunt-style';

/** Hazel's plain lines: about combing and sharing, never about harm. */
const KEEPER_LINES = [
  'Comb gently, then let it wander off. Tufts grow back faster than grumbles.',
  'Bring me the bundles, not the bother.',
  'A tuft is a gift the animal was going to shed anyway. Take only what it sheds.',
];

const CSS = `
#gta-hunt-lodge{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:60;box-sizing:border-box;width:min(560px,calc(100vw - 32px));max-height:calc(100vh - 32px - env(safe-area-inset-top) - env(safe-area-inset-bottom));overflow:auto;-webkit-overflow-scrolling:touch;padding:14px;background:#3a2716;color:#f3e9d2;border:2px solid #6b4a2b;border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,0.55);font:14px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif;pointer-events:auto;}
#gta-hunt-lodge *{box-sizing:border-box;}
#gta-hunt-lodge .gh-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;}
#gta-hunt-lodge .gh-title{margin:0;font-size:20px;color:#9cc25a;}
#gta-hunt-lodge .gh-keeper{font-size:12px;opacity:0.85;margin-top:2px;}
#gta-hunt-lodge .gh-btn{min-width:44px;min-height:44px;padding:8px 12px;border-radius:8px;border:1px solid #7a9a3a;background:#2a1b0e;color:#f3e9d2;font:inherit;font-weight:600;cursor:pointer;touch-action:manipulation;}
#gta-hunt-lodge .gh-btn:disabled{opacity:0.45;cursor:not-allowed;}
#gta-hunt-lodge .gh-close{padding:0;font-size:18px;}
#gta-hunt-lodge .gh-tabs{display:flex;gap:8px;margin:12px 0 4px;}
#gta-hunt-lodge .gh-tab{flex:1;}
#gta-hunt-lodge .gh-tab.active{background:#7a9a3a;color:#1a1408;border-color:#9cc25a;}
#gta-hunt-lodge .gh-label{font-size:12px;text-transform:uppercase;letter-spacing:0.06em;opacity:0.8;margin:12px 0 4px;}
#gta-hunt-lodge .gh-note{font-size:13px;color:#e8c98a;margin:8px 0;}
#gta-hunt-lodge .gh-license{padding:8px 0;color:#9cc25a;font-weight:600;}
#gta-hunt-lodge .gh-buy{width:100%;}
#gta-hunt-lodge .gh-row{display:flex;align-items:center;gap:10px;min-height:44px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.08);}
#gta-hunt-lodge .gh-name{flex:1;min-width:0;}
#gta-hunt-lodge .gh-count{opacity:0.85;white-space:nowrap;}
#gta-hunt-lodge .gh-value{white-space:nowrap;color:#e8c98a;}
#gta-hunt-lodge .gh-empty{opacity:0.7;padding:10px 0;font-style:italic;}
#gta-hunt-lodge .gh-sell{width:100%;margin-top:12px;background:#7a9a3a;color:#1a1408;border-color:#9cc25a;}
#gta-hunt-lodge .gh-card{background:rgba(0,0,0,0.2);border-radius:8px;padding:8px 10px;margin:6px 0;}
#gta-hunt-lodge .gh-card .gh-name{font-weight:700;}
#gta-hunt-lodge .gh-unseen{opacity:0.55;}
#gta-hunt-lodge .gh-region{font-size:12px;opacity:0.75;}
#gta-hunt-lodge .gh-blurb{margin:4px 0;font-style:italic;}
#gta-hunt-lodge .gh-meta{font-size:12px;color:#e8c98a;}
#gta-hunt-lodge .gh-hint{font-size:13px;margin-top:4px;opacity:0.85;}
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

/** 'mossy-wood' -> 'Mossy Wood'. */
function regionName(id: string): string {
  return id.split('-').map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');
}

export function createLodgeUi(ui: HTMLElement, deps: LodgeUiDeps): LodgeUi {
  injectStyle();
  let opened = false;
  let tab: LodgeTab = 'lodge';
  let atLodge = false;
  let keeperLine = KEEPER_LINES[0];

  const root = el('div', 'gh-sheet');
  root.id = ROOT_ID;
  root.style.display = 'none';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', LODGE.name);

  const head = el('div', 'gh-head');
  const titleWrap = el('div');
  const title = el('h2', 'gh-title', LODGE.name);
  const keeper = el('div', 'gh-keeper');
  titleWrap.append(title, keeper);
  const closeBtn = el('button', 'gh-btn gh-close', '✕');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close the lodge');
  head.append(titleWrap, closeBtn);

  const tabsEl = el('div', 'gh-tabs');
  const tabBtns: { id: LodgeTab; btn: HTMLButtonElement }[] = [];
  for (const [id, label] of [['lodge', 'Lodge'], ['journal', 'Journal']] as const) {
    const btn = el('button', 'gh-btn gh-tab', label);
    btn.type = 'button';
    btn.addEventListener('click', () => {
      tab = id;
      render();
    });
    tabBtns.push({ id, btn });
    tabsEl.appendChild(btn);
  }

  const body = el('div', 'gh-body');
  root.append(head, tabsEl, body);
  ui.appendChild(root);

  // The sheet is modal for input: pointer and touch must not reach the game behind it.
  root.addEventListener('pointerdown', (e) => e.stopPropagation());
  root.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });

  function renderLodge(): void {
    const store = deps.store;
    if (!atLodge) body.appendChild(el('div', 'gh-note', 'Buy and sell at the lodge in Mossy Wood.'));

    // License
    if (store.licensed()) {
      body.appendChild(el('div', 'gh-license', 'Tuft License: yours'));
    } else {
      const buy = el('button', 'gh-btn gh-buy', `Buy Tuft License (${HUNT.licensePrice} Acorns)`);
      buy.type = 'button';
      buy.disabled = !atLodge || deps.acorns() < HUNT.licensePrice;
      buy.addEventListener('click', () => {
        if (buy.disabled) return;
        const ok = store.buyLicense(deps.spend);
        if (ok) {
          deps.play('shutter');
          deps.onLicensed();
        }
        render();
      });
      body.appendChild(buy);
    }

    // Bag
    body.appendChild(el('div', 'gh-label', `Game bag ${store.bagCount()}/${HUNT.bagSize}`));
    let shown = 0;
    for (const [id, count] of Object.entries(store.data().bag)) {
      if (count <= 0) continue;
      const info = itemInfo(id);
      if (!info) continue;
      const row = el('div', 'gh-row');
      const isTuft = info.kind === 'tuft';
      row.appendChild(prefabIconElement(isTuft ? 'tuft-bundle' : 'keepsake-bundle', isTuft ? '🪶' : '✨', 32, info.color));
      row.appendChild(el('div', 'gh-name', info.name));
      row.appendChild(el('div', 'gh-count', `x${count}`));
      row.appendChild(el('div', 'gh-value', `${info.price * count} 🌰`));
      body.appendChild(row);
      shown += 1;
    }
    if (shown === 0) body.appendChild(el('div', 'gh-empty', 'Your game bag is empty.'));

    // Sell
    const sell = el('button', 'gh-btn gh-sell', `Sell all for ${store.bagValue()} Acorns`);
    sell.type = 'button';
    sell.disabled = !atLodge || store.bagCount() === 0;
    sell.addEventListener('click', () => {
      if (sell.disabled) return;
      const r = store.sellAll();
      deps.earn(r.acorns, 'Tuft & Tally Lodge');
      deps.onSold(r.items, r.acorns);
      render();
    });
    body.appendChild(sell);
  }

  function renderJournal(): void {
    const d = deps.store.data();
    body.appendChild(el('div', 'gh-label', `${deps.store.speciesTaken()} of ${SPECIES.length} species`));
    for (const sp of SPECIES) {
      const entry = d.journal[sp.id];
      const card = el('div', 'gh-card');
      if (entry && entry.taken > 0) {
        card.appendChild(el('div', 'gh-name', sp.name));
        card.appendChild(el('div', 'gh-region', regionName(sp.region)));
        card.appendChild(el('div', 'gh-blurb', sp.blurb));
        card.appendChild(el('div', 'gh-meta',
          `Combed x${entry.taken}, keepsakes x${entry.keepsakes}, first ${entry.first}, best shot ${Math.round(entry.bestShot)} m`));
      } else {
        const name = sp.legendary === true ? '???' : sp.name;
        const nameEl = el('div', sp.legendary === true ? 'gh-name' : 'gh-name gh-unseen', name);
        card.appendChild(nameEl);
        card.appendChild(el('div', 'gh-region', regionName(sp.region)));
        card.appendChild(el('div', 'gh-hint', sp.hint));
      }
      body.appendChild(card);
    }
  }

  function render(): void {
    for (const t of tabBtns) {
      const on = t.id === tab;
      t.btn.classList.toggle('active', on);
      t.btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    keeper.textContent = `Hazel Mattock: ${keeperLine}`;
    body.innerHTML = '';
    if (tab === 'lodge') renderLodge();
    else renderJournal();
  }

  function onKeydown(e: KeyboardEvent): void {
    if (e.code === 'Escape' && opened) close();
  }

  function open(t: LodgeTab, at: boolean): void {
    tab = t;
    atLodge = at;
    keeperLine = KEEPER_LINES[Math.floor(Math.random() * KEEPER_LINES.length)];
    if (!opened) {
      opened = true;
      window.addEventListener('keydown', onKeydown);
    }
    root.style.display = '';
    if (document.pointerLockElement) document.exitPointerLock();
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
