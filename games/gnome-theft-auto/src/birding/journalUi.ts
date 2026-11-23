// Birding: the field journal and the hide counter (DOM). Two tabs: Life list (every species as a card, a black silhouette
// until seen) and, at the Reedwatch Hide only, Counter (Dunnock Pell's tip, milestone pay-out, optics shop).
// Copies the structure of hunting/lodgeUi.ts with a teal/reed palette.
import { prefabIconElement } from '@lawn/prefabs';
import { isTyping, KEYS } from '../keys';
import type { Sfx } from '../types';
import type { BirdStore } from './birdSave';
import { HIDE, MILESTONES, OPTICS, type BirdSpecies, type Rarity } from './types';

export interface JournalDeps {
  birds: readonly BirdSpecies[];
  store: BirdStore;
  acorns(): number;
  spend(amount: number, reason: string): boolean;
  earn(amount: number, reason: string): void;
  play(sfx: Sfx): void;
  /** Play a species' call (the journal's play button on heard and seen entries). */
  playCall(id: string): void;
  /** The keeper's tip: one line naming a bird likely near here now. */
  tip(): string;
  /** Milestones were claimed for `acorns` (already paid). */
  onClaim(acorns: number): void;
  /** OPTICS[index] was bought (already paid). */
  onOptics(index: number): void;
}

export interface JournalUi {
  /** 'list' = the life list; 'hide' = the keeper's counter (milestones, optics, tip): only offered when atHide. */
  open(tab: 'list' | 'hide', atHide: boolean): void;
  close(): void;
  isOpen(): boolean;
  /** Redraw after the save changed. */
  refresh(): void;
}

const ROOT_ID = 'gta-birding-journal';
const STYLE_ID = 'gta-birding-journal-style';

const RARITY_COLOR: Readonly<Record<Rarity, string>> = {
  common: '#9aa0a6',
  uncommon: '#6cc070',
  rare: '#5aa0e6',
  mythic: '#e0b040',
};

const CSS = `
#gta-birding-journal{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:60;box-sizing:border-box;width:min(640px,calc(100vw - 32px));max-height:calc(100vh - 32px - env(safe-area-inset-top) - env(safe-area-inset-bottom));overflow:auto;-webkit-overflow-scrolling:touch;padding:14px;background:#1d2e2a;color:#e8f1ee;border:2px solid #2f5a50;border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,0.55);font:14px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif;pointer-events:auto;}
#gta-birding-journal *{box-sizing:border-box;}
#gta-birding-journal .gb-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;}
#gta-birding-journal .gb-title{margin:0;font-size:20px;color:#5a9a8a;}
#gta-birding-journal .gb-sub{font-size:12px;opacity:0.85;margin-top:2px;}
#gta-birding-journal .gb-btn{min-width:44px;min-height:44px;padding:8px 12px;border-radius:8px;border:1px solid #5a9a8a;background:#142420;color:#e8f1ee;font:inherit;font-weight:600;cursor:pointer;touch-action:manipulation;}
#gta-birding-journal .gb-btn:disabled{opacity:0.45;cursor:not-allowed;}
#gta-birding-journal .gb-close{padding:0;font-size:18px;}
#gta-birding-journal .gb-tabs{display:flex;gap:8px;margin:12px 0 4px;}
#gta-birding-journal .gb-tab{flex:1;}
#gta-birding-journal .gb-tab.active{background:#5a9a8a;color:#0d1714;border-color:#8cc4b4;}
#gta-birding-journal .gb-label{font-size:12px;text-transform:uppercase;letter-spacing:0.06em;opacity:0.8;margin:12px 0 4px;}
#gta-birding-journal .gb-note{font-size:13px;color:#b9dcd0;margin:8px 0;}
#gta-birding-journal .gb-tip{margin:8px 0;padding:8px 10px;border-left:3px solid #5a9a8a;font-style:italic;}
#gta-birding-journal .gb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:8px;}
@media (max-width:359px){#gta-birding-journal .gb-grid{grid-template-columns:1fr;}}
#gta-birding-journal .gb-card{background:rgba(0,0,0,0.22);border-radius:8px;padding:8px;display:flex;flex-direction:column;gap:4px;min-width:0;}
#gta-birding-journal .gb-card-top{display:flex;align-items:center;gap:8px;min-height:44px;}
#gta-birding-journal .gb-name{font-weight:700;min-width:0;overflow-wrap:anywhere;}
#gta-birding-journal .gb-name.unseen{font-style:italic;opacity:0.9;}
#gta-birding-journal .gb-badge{font-size:11px;font-weight:700;padding:1px 6px;border-radius:999px;color:#0d1714;white-space:nowrap;}
#gta-birding-journal .gb-meta{font-size:12px;opacity:0.85;}
#gta-birding-journal .gb-blurb{margin:2px 0;font-style:italic;font-size:13px;}
#gta-birding-journal .gb-hint{font-size:13px;opacity:0.85;}
#gta-birding-journal .gb-play{min-width:44px;min-height:44px;padding:0 8px;}
#gta-birding-journal .gb-row{display:flex;align-items:center;gap:10px;min-height:44px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.08);}
#gta-birding-journal .gb-row-main{flex:1;min-width:0;}
#gta-birding-journal .gb-row-sub{font-size:12px;opacity:0.8;}
#gta-birding-journal .gb-value{white-space:nowrap;color:#f0d89a;}
#gta-birding-journal .gb-collect{width:100%;margin:10px 0;background:#5a9a8a;color:#0d1714;border-color:#8cc4b4;}
#gta-birding-journal .gb-empty{opacity:0.7;padding:10px 0;font-style:italic;}
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

function button(cls: string, text: string, label?: string): HTMLButtonElement {
  const b = el('button', `gb-btn ${cls}`, text);
  b.type = 'button';
  if (label) b.setAttribute('aria-label', label);
  return b;
}

/** 'waterfowl' -> 'Waterfowl'. */
function capitalise(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export function createJournalUi(ui: HTMLElement, deps: JournalDeps): JournalUi {
  injectStyle();
  let opened = false;
  let tab: 'list' | 'hide' = 'list';
  let atHide = false;
  const store = deps.store;
  const total = deps.birds.length;

  // Icons are rendered once per species (prefabIconElement draws a canvas) and reused on every refresh.
  const icons = new Map<string, HTMLElement>();
  function iconFor(s: BirdSpecies): HTMLElement {
    let icon = icons.get(s.id);
    if (!icon) {
      icon = prefabIconElement(s.prefab, '🐦', 48, s.tint);
      icons.set(s.id, icon);
    }
    return icon;
  }

  const root = el('div', 'gb-sheet');
  root.id = ROOT_ID;
  root.style.display = 'none';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');

  const head = el('div', 'gb-head');
  const titleWrap = el('div');
  const title = el('h2', 'gb-title', 'Field Journal');
  const sub = el('div', 'gb-sub');
  titleWrap.append(title, sub);
  const closeBtn = button('gb-close', '✕', 'Close the field journal');
  closeBtn.addEventListener('click', () => close());
  head.append(titleWrap, closeBtn);

  const tabsEl = el('div', 'gb-tabs');
  const listTabBtn = button('gb-tab', 'Life list');
  listTabBtn.addEventListener('click', () => { tab = 'list'; render(); });
  const hideTabBtn = button('gb-tab', 'Counter');
  hideTabBtn.addEventListener('click', () => { tab = 'hide'; render(); });
  tabsEl.append(listTabBtn, hideTabBtn);

  const body = el('div', 'gb-body');
  root.append(head, tabsEl, body);
  ui.appendChild(root);

  // The sheet is modal for input: pointer and touch must not reach the game behind it.
  root.addEventListener('pointerdown', (e) => e.stopPropagation());
  root.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });

  function renderList(): void {
    const seen = store.seenCount();
    body.appendChild(el('div', 'gb-label', `Life list ${seen}/${total} · Photos ${store.photoCount()}`));

    const next = MILESTONES[store.data().claimed];
    body.appendChild(el('div', 'gb-note', next
      ? `Next: ${next.label} (${next.count || total})`
      : 'All milestones reached'));

    const grid = el('div', 'gb-grid');
    const d = store.data();
    for (const s of deps.birds) {
      const isSeen = store.hasSeen(s.id);
      const isHeard = store.hasHeard(s.id);
      const card = el('div', 'gb-card');
      const top = el('div', 'gb-card-top');
      const icon = iconFor(s);
      if (isSeen || isHeard) {
        icon.style.filter = '';
        icon.style.opacity = '1';
      } else {
        icon.style.filter = 'brightness(0)';
        icon.style.opacity = '0.55';
      }
      top.appendChild(icon);

      const nameWrap = el('div', 'gb-row-main');
      if (isSeen) {
        nameWrap.appendChild(el('div', 'gb-name', s.name));
      } else if (isHeard) {
        const n = el('div', 'gb-name unseen', s.name);
        nameWrap.appendChild(n);
        nameWrap.appendChild(el('div', 'gb-row-sub', 'heard'));
      } else {
        nameWrap.appendChild(el('div', 'gb-name unseen', '???'));
      }
      top.appendChild(nameWrap);

      if (isSeen) {
        const badge = el('span', 'gb-badge', capitalise(s.rarity));
        badge.style.background = RARITY_COLOR[s.rarity];
        top.appendChild(badge);
      } else {
        const badge = el('span', 'gb-badge', '?');
        badge.style.background = RARITY_COLOR.common;
        top.appendChild(badge);
      }
      card.appendChild(top);

      if (isSeen) {
        const sighting = d.seen[s.id];
        card.appendChild(el('div', 'gb-meta', capitalise(s.group)));
        card.appendChild(el('div', 'gb-blurb', s.blurb));
        const photo = store.hasPhoto(s.id) ? ' · 📷' : '';
        card.appendChild(el('div', 'gb-meta', `First seen ${sighting.first} · seen ${sighting.count}x${photo}`));
      } else {
        card.appendChild(el('div', 'gb-hint', s.hint));
      }

      if (isSeen || isHeard) {
        const play = button('gb-play', '▶', `Play the call of ${s.name}`);
        play.addEventListener('click', () => deps.playCall(s.id));
        card.appendChild(play);
      }
      grid.appendChild(card);
    }
    body.appendChild(grid);
  }

  function renderHide(): void {
    body.appendChild(el('div', 'gb-tip', `${HIDE.keeper}: "${deps.tip()}"`));

    // Milestones
    body.appendChild(el('div', 'gb-label', 'Milestones'));
    const claimed = store.data().claimed;
    const pending = store.claimable(total);
    if (pending.length > 0) {
      const sum = pending.reduce((a, m) => a + m.acorns, 0);
      const collect = button('gb-collect', `Collect ${sum} Acorns`);
      collect.addEventListener('click', () => {
        const n = store.claim(total);
        deps.earn(n, 'Birding milestone');
        deps.onClaim(n);
        render();
      });
      body.appendChild(collect);
    }
    MILESTONES.forEach((m, i) => {
      const row = el('div', 'gb-row');
      const done = i < claimed;
      row.appendChild(el('div', 'gb-row-main', `${done ? '✓ ' : ''}${m.label}`));
      row.appendChild(el('div', 'gb-value', `${m.acorns} 🌰`));
      body.appendChild(row);
    });

    // Optics
    body.appendChild(el('div', 'gb-label', 'Optics'));
    const owned = store.optics();
    OPTICS.forEach((o, i) => {
      const row = el('div', 'gb-row');
      const main = el('div', 'gb-row-main');
      main.appendChild(el('div', 'gb-name', o.name));
      main.appendChild(el('div', 'gb-row-sub', `${o.zooms.map((z) => `${z}x`).join(' / ')} · ${o.blurb}`));
      row.appendChild(main);
      if (i <= owned) {
        const b = button('', 'Owned');
        b.disabled = true;
        row.appendChild(b);
      } else {
        const b = button('', `Buy (${o.price})`, `Buy ${o.name}`);
        b.disabled = deps.acorns() < o.price;
        b.addEventListener('click', () => {
          if (b.disabled) return;
          if (deps.spend(o.price, o.name)) {
            store.setOptics(i);
            deps.onOptics(i);
            deps.play('shutter');
            render();
          }
        });
        row.appendChild(b);
      }
      body.appendChild(row);
    });
  }

  function render(): void {
    if (!atHide && tab === 'hide') tab = 'list';
    title.textContent = tab === 'hide' ? HIDE.name : 'Field Journal';
    sub.textContent = tab === 'hide' ? `${HIDE.keeper} keeps the counter` : '';
    listTabBtn.classList.toggle('active', tab === 'list');
    listTabBtn.setAttribute('aria-pressed', tab === 'list' ? 'true' : 'false');
    hideTabBtn.classList.toggle('active', tab === 'hide');
    hideTabBtn.setAttribute('aria-pressed', tab === 'hide' ? 'true' : 'false');
    hideTabBtn.style.display = atHide ? '' : 'none';
    body.innerHTML = '';
    if (tab === 'hide') renderHide();
    else renderList();
  }

  function onKeydown(e: KeyboardEvent): void {
    if (e.code === KEYS.close && opened && !isTyping(e)) close();
  }

  function open(t: 'list' | 'hide', at: boolean): void {
    tab = t;
    atHide = at;
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

  return {
    open,
    close,
    isOpen: () => opened,
    refresh() {
      if (opened) render();
    },
  };
}
