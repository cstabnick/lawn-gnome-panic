// Player-to-player trade window and incoming/outgoing request banners.
// Appends its own container to #ui; never touches #ui itself.
import { UI, type ItemDef, type Rarity } from '../config';
import { ITEMS } from '../content';
import { bus } from '../events';
import { itemIcon } from '../itemArt';
import {
  acceptTradeRequest, availableTradeCount, canAcceptCurrentTrade, cancelOutgoingRequest, cancelTrade,
  declineTradeRequest, getTradeState, offerItem, onTradeChange, setOfferGold, toggleAcceptTrade,
  type TradeSession,
} from '../net/trade';
import { state } from '../state';
import { TOUCH } from './layout';

const RARITY_COLOR: Record<Rarity, string> = {
  plain: '#ffffff',
  sprouted: '#7bd96b',
  blooming: '#6fb7ff',
  heirloom: '#c58cff',
  kilnfired: '#ff9e3d',
};

let container: HTMLDivElement | null = null;
let banner: HTMLDivElement | null = null;
let win: HTMLDivElement | null = null;
let titleEl: HTMLDivElement | null = null;
let myOfferStatusEl: HTMLSpanElement | null = null;
let peerOfferTitleEl: HTMLSpanElement | null = null;
let peerOfferStatusEl: HTMLSpanElement | null = null;
let myOfferGrid: HTMLDivElement | null = null;
let peerOfferGrid: HTMLDivElement | null = null;
let myGoldInput: HTMLInputElement | null = null;
let peerGoldEl: HTMLDivElement | null = null;
let packGrid: HTMLDivElement | null = null;
let packGoldEl: HTMLSpanElement | null = null;
let statusEl: HTMLDivElement | null = null;
let acceptBtn: HTMLButtonElement | null = null;

function cssColor(c: number): string {
  return `#${c.toString(16).padStart(6, '0')}`;
}

function make<K extends keyof HTMLElementTagNameMap>(
  parent: HTMLElement,
  tag: K,
  css: Partial<CSSStyleDeclaration>,
  text = '',
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  Object.assign(el.style, css);
  if (text) el.textContent = text;
  parent.appendChild(el);
  return el;
}

function buttonCss(accent: string = UI.borderLight): Partial<CSSStyleDeclaration> {
  return {
    fontFamily: UI.font,
    fontSize: TOUCH ? '14px' : '12px',
    fontWeight: 'bold',
    padding: TOUCH ? '7px 14px' : '4px 12px',
    cursor: 'pointer',
    background: UI.panelBgDark,
    color: UI.text,
    border: `1px solid ${accent}`,
    touchAction: 'manipulation',
  };
}

function itemGrid(parent: HTMLElement, minHeight = '64px'): HTMLDivElement {
  return make(parent, 'div', {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))',
    gap: '5px',
    minHeight,
    padding: '5px',
    background: 'rgba(20, 16, 12, 0.55)',
    border: `1px solid ${UI.border}`,
    alignContent: 'start',
  });
}

function itemCell(
  item: ItemDef,
  count: number,
  onClick?: (e: MouseEvent) => void,
  onContext?: (e: MouseEvent) => void,
  hint?: string,
): HTMLDivElement {
  const el = document.createElement('div');
  Object.assign(el.style, {
    background: UI.panelBgDark,
    border: `1px solid ${UI.borderLight}`,
    padding: '5px 4px',
    textAlign: 'center',
    cursor: onClick ? 'pointer' : 'default',
    fontSize: '11px',
    color: UI.text,
    userSelect: 'none',
  });
  if (hint) el.title = hint;
  const iconEl = itemIcon(item, 28);
  iconEl.style.margin = '0 auto';
  const nameEl = document.createElement('div');
  nameEl.textContent = count > 1 ? `${count} × ${item.name}` : item.name;
  nameEl.style.color = RARITY_COLOR[item.rarity ?? 'plain'];
  nameEl.style.overflowWrap = 'anywhere';
  el.append(iconEl, nameEl);
  if (onClick) {
    el.addEventListener('mouseenter', () => (el.style.borderColor = UI.gold));
    el.addEventListener('mouseleave', () => (el.style.borderColor = UI.borderLight));
    el.addEventListener('click', onClick);
  }
  if (onContext) {
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      onContext(e);
    });
  }
  return el;
}

export function createTradeUi(root: HTMLElement): void {
  container = make(root, 'div', {
    position: 'absolute',
    inset: '0',
    pointerEvents: 'none',
    fontFamily: UI.font,
    zIndex: '12',
  });
  container.id = 'trade-ui';

  // Top-center banner for incoming / outgoing trade requests.
  banner = make(container, 'div', {
    position: 'absolute',
    left: '50%',
    top: '62px',
    transform: 'translateX(-50%)',
    display: 'none',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: '92vw',
    padding: '8px 12px',
    background: UI.panelBg,
    border: `2px solid ${UI.gold}`,
    color: UI.text,
    fontSize: '13px',
    pointerEvents: 'auto',
    boxSizing: 'border-box',
  });
  banner.id = 'trade-banner';

  // Main trade modal window.
  win = make(container, 'div', {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'min(580px, 95vw)',
    maxHeight: '88vh',
    overflowY: 'auto',
    boxSizing: 'border-box',
    padding: '12px',
    background: UI.panelBg,
    border: `2px solid ${UI.border}`,
    color: UI.text,
    fontSize: '13px',
    pointerEvents: 'auto',
    display: 'none',
  });
  win.id = 'trade-window';

  // Header
  const top = make(win, 'div', {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  });
  titleEl = make(top, 'div', { color: UI.gold, fontSize: '16px', fontWeight: 'bold' });
  const closeBtn = make(top, 'div', { color: UI.textDim, cursor: 'pointer', padding: '0 4px', fontSize: '16px' }, '✕');
  closeBtn.addEventListener('mouseenter', () => (closeBtn.style.color = UI.textWhite));
  closeBtn.addEventListener('mouseleave', () => (closeBtn.style.color = UI.textDim));
  closeBtn.addEventListener('click', () => cancelTrade());

  // Two-column offers area
  const cols = make(win, 'div', {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '10px',
  });

  // Left: Your Offer
  const myCol = make(cols, 'div', { display: 'flex', flexDirection: 'column', gap: '6px' });
  const myHead = make(myCol, 'div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center' });
  make(myHead, 'span', { fontWeight: 'bold', color: UI.textWhite }, 'Your Offer');
  myOfferStatusEl = make(myHead, 'span', { fontSize: '11px', fontWeight: 'bold' });
  myOfferGrid = itemGrid(myCol);

  const myGoldRow = make(myCol, 'div', { display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' });
  make(myGoldRow, 'span', { color: UI.gold, fontSize: '12px', fontWeight: 'bold' }, 'Gold:');
  myGoldInput = make(myGoldRow, 'input', {
    width: '74px',
    padding: '3px 5px',
    fontFamily: UI.font,
    fontSize: TOUCH ? '15px' : '12px',
    background: UI.panelBgDark,
    color: UI.gold,
    border: `1px solid ${UI.borderLight}`,
    outline: 'none',
  });
  myGoldInput.type = 'number';
  myGoldInput.min = '0';
  myGoldInput.step = '1';
  myGoldInput.value = '0';
  myGoldInput.addEventListener('keydown', (e) => e.stopPropagation());
  myGoldInput.addEventListener('input', () => {
    const val = parseInt(myGoldInput!.value, 10);
    setOfferGold(Number.isNaN(val) ? 0 : val);
  });
  for (const [label, delta] of [['+10', 10], ['+100', 100]] as const) {
    const b = make(myGoldRow, 'button', {
      fontFamily: UI.font, fontSize: '11px', padding: '2px 6px', cursor: 'pointer',
      background: UI.panelBgDark, color: UI.gold, border: `1px solid ${UI.borderLight}`,
    }, label);
    b.type = 'button';
    b.onclick = () => {
      const s = getTradeState().session;
      if (s) setOfferGold(s.myGold + delta);
    };
  }
  const clearGoldBtn = make(myGoldRow, 'button', {
    fontFamily: UI.font, fontSize: '11px', padding: '2px 6px', cursor: 'pointer',
    background: UI.panelBgDark, color: UI.textDim, border: `1px solid ${UI.borderLight}`,
  }, '0');
  clearGoldBtn.type = 'button';
  clearGoldBtn.onclick = () => setOfferGold(0);

  // Right: Peer's Offer
  const peerCol = make(cols, 'div', { display: 'flex', flexDirection: 'column', gap: '6px' });
  const peerHead = make(peerCol, 'div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center' });
  peerOfferTitleEl = make(peerHead, 'span', { fontWeight: 'bold' });
  peerOfferStatusEl = make(peerHead, 'span', { fontSize: '11px', fontWeight: 'bold' });
  peerOfferGrid = itemGrid(peerCol);
  peerGoldEl = make(peerCol, 'div', { color: UI.gold, fontSize: '12px', fontWeight: 'bold', padding: '3px 0' }, 'Gold: 0 gp');

  // Your Pack
  const packHead = make(win, 'div', {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '10px',
    marginBottom: '4px',
  });
  make(packHead, 'span', { color: UI.textDim, fontWeight: 'bold', fontSize: '12px' }, 'Your Pack (click to offer, Shift/right-click for all)');
  packGoldEl = make(packHead, 'span', { color: UI.gold, fontSize: '12px', fontWeight: 'bold' });
  packGrid = itemGrid(win, '54px');

  // Footer
  const footer = make(win, 'div', {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '10px',
    paddingTop: '8px',
    borderTop: `1px solid ${UI.borderLight}`,
  });
  statusEl = make(footer, 'div', { fontSize: '12px', color: UI.textDim, flex: '1 1 180px' });
  const actions = make(footer, 'div', { display: 'flex', gap: '8px' });
  acceptBtn = make(actions, 'button', buttonCss(UI.good), 'Accept Trade');
  acceptBtn.type = 'button';
  acceptBtn.onclick = () => toggleAcceptTrade();
  const cancelBtn = make(actions, 'button', buttonCss(UI.bad), 'Cancel');
  cancelBtn.type = 'button';
  cancelBtn.onclick = () => cancelTrade();

  onTradeChange(render);
  bus.on('changed', () => {
    if (getTradeState().session) render();
  });
  render();
}

function renderBanner(): void {
  if (!banner) return;
  const { incoming, outgoing, session } = getTradeState();
  banner.replaceChildren();
  if (session || (!incoming && !outgoing)) {
    banner.style.display = 'none';
    return;
  }
  banner.style.display = 'flex';
  if (incoming) {
    const msg = make(banner, 'span', {});
    make(msg, 'span', { color: cssColor(incoming.peerColor), fontWeight: 'bold' }, incoming.peerName);
    msg.append(' wants to trade with you.');
    const acc = make(banner, 'button', { ...buttonCss(UI.good), color: UI.good }, 'Accept');
    acc.type = 'button';
    acc.onclick = () => acceptTradeRequest();
    const dec = make(banner, 'button', { ...buttonCss(UI.bad), color: UI.textDim }, 'Decline');
    dec.type = 'button';
    dec.onclick = () => declineTradeRequest();
  } else if (outgoing) {
    make(banner, 'span', {}, `Waiting for ${outgoing.peerName} to accept trade...`);
    const cancel = make(banner, 'button', buttonCss(UI.borderLight), 'Cancel');
    cancel.type = 'button';
    cancel.onclick = () => cancelOutgoingRequest();
  }
}

function renderWindow(s: TradeSession): void {
  if (
    !win || !titleEl || !myOfferStatusEl || !peerOfferTitleEl || !peerOfferStatusEl ||
    !myOfferGrid || !peerOfferGrid || !myGoldInput || !peerGoldEl || !packGrid || !packGoldEl || !statusEl || !acceptBtn
  ) return;

  win.style.display = 'block';
  titleEl.textContent = `Trading with ${s.peerName}`;
  peerOfferTitleEl.textContent = `${s.peerName}'s Offer`;
  peerOfferTitleEl.style.color = cssColor(s.peerColor);

  myOfferStatusEl.textContent = s.myReady ? '✓ Ready' : 'Editing';
  myOfferStatusEl.style.color = s.myReady ? UI.good : UI.textDim;
  peerOfferStatusEl.textContent = s.peerReady ? '✓ Ready' : 'Waiting';
  peerOfferStatusEl.style.color = s.peerReady ? UI.good : UI.textDim;

  // Your offered items
  myOfferGrid.replaceChildren();
  if (s.myItems.size === 0) {
    make(myOfferGrid, 'div', { color: UI.textDim, fontSize: '11px', gridColumn: '1 / -1', padding: '12px 4px', textAlign: 'center' }, 'No items offered');
  } else {
    for (const [id, count] of s.myItems) {
      const def = ITEMS[id];
      if (!def) continue;
      myOfferGrid.appendChild(
        itemCell(
          def,
          count,
          (e) => offerItem(id, e.shiftKey ? -count : -1),
          () => offerItem(id, -count),
          'Click to remove 1 (Shift/right-click to remove all)',
        ),
      );
    }
  }

  // Peer's offered items
  peerOfferGrid.replaceChildren();
  if (s.peerItems.size === 0) {
    make(peerOfferGrid, 'div', { color: UI.textDim, fontSize: '11px', gridColumn: '1 / -1', padding: '12px 4px', textAlign: 'center' }, 'No items offered');
  } else {
    for (const [id, count] of s.peerItems) {
      const def = ITEMS[id];
      if (!def) continue;
      peerOfferGrid.appendChild(itemCell(def, count));
    }
  }

  // Sync gold input without clobbering while user is actively typing the same value.
  if (document.activeElement !== myGoldInput || Number(myGoldInput.value) !== s.myGold) {
    myGoldInput.value = String(s.myGold);
  }
  myGoldInput.max = String(state.gold);
  peerGoldEl.textContent = `Gold: ${s.peerGold} gp`;
  packGoldEl.textContent = `Your gold: ${state.gold} gp`;

  // Your pack (grouped by item id for clean offering)
  packGrid.replaceChildren();
  const seen = new Set<string>();
  let anyPack = false;
  for (const slot of state.inventory) {
    if (!slot || seen.has(slot.item)) continue;
    seen.add(slot.item);
    const def = ITEMS[slot.item];
    if (!def || def.questItem) continue;
    const avail = availableTradeCount(slot.item);
    if (avail <= 0) continue;
    anyPack = true;
    packGrid.appendChild(
      itemCell(
        def,
        avail,
        (e) => offerItem(slot.item, e.shiftKey ? avail : 1),
        () => offerItem(slot.item, avail),
        'Click to offer 1 (Shift/right-click to offer all)',
      ),
    );
  }
  if (!anyPack) {
    make(packGrid, 'div', { color: UI.textDim, fontSize: '11px', gridColumn: '1 / -1', padding: '10px 4px', textAlign: 'center' }, 'No tradeable items remaining in pack');
  }

  // Footer status & Accept button
  const check = canAcceptCurrentTrade();
  if (!check.ok) {
    statusEl.textContent = check.reason ?? 'Cannot accept trade.';
    statusEl.style.color = UI.bad;
  } else if (s.committing) {
    statusEl.textContent = 'Completing trade...';
    statusEl.style.color = UI.good;
  } else if (s.myReady && !s.peerReady) {
    statusEl.textContent = `Waiting for ${s.peerName} to accept...`;
    statusEl.style.color = UI.gold;
  } else if (!s.myReady && s.peerReady) {
    statusEl.textContent = `${s.peerName} accepted. Click Accept Trade to finish.`;
    statusEl.style.color = UI.good;
  } else {
    statusEl.textContent = 'Both players must accept. Changing an offer resets readiness.';
    statusEl.style.color = UI.textDim;
  }

  acceptBtn.textContent = s.myReady ? 'Unaccept' : 'Accept Trade';
  acceptBtn.disabled = !s.myReady && !check.ok;
  acceptBtn.style.opacity = acceptBtn.disabled ? '0.5' : '1';
  acceptBtn.style.color = s.myReady ? UI.gold : UI.good;
}

function render(): void {
  renderBanner();
  const { session } = getTradeState();
  if (!session) {
    if (win) win.style.display = 'none';
    return;
  }
  renderWindow(session);
}
