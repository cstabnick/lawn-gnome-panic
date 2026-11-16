// Buy and sell window: an NPC's wares on top, your sellable inventory below.
import { addItem, removeItem } from '../inventory';
import { allEntities } from '../entities';
import { player } from '../player';
import { bus, say } from '../events';
import { state } from '../state';
import { TUNING, UI, type ItemDef, type Rarity } from '../config';
import { itemIcon } from '../itemArt';
import { ITEMS, NPCS } from '../content';

/** Item name colours by rarity. */
const RARITY_COLOR: Record<Rarity, string> = {
  plain: '#ffffff',
  sprouted: '#7bd96b',
  blooming: '#6fb7ff',
  heirloom: '#c58cff',
  kilnfired: '#ff9e3d',
};

let win: HTMLDivElement | null = null;
let titleEl: HTMLDivElement | null = null;
let forSaleEl: HTMLDivElement | null = null;
let sellEl: HTMLDivElement | null = null;
let goldEl: HTMLDivElement | null = null;
/** The NPC whose shop is open, or null when closed. */
let currentNpc: string | null = null;

/** Builds the hidden shop window and keeps it in sync with the state. */
export function createShop(root: HTMLElement): void {
  win = document.createElement('div');
  Object.assign(win.style, {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'min(440px, 94vw)',
    boxSizing: 'border-box',
    padding: '12px',
    background: UI.panelBg,
    border: `2px solid ${UI.border}`,
    color: UI.text,
    fontFamily: UI.font,
    pointerEvents: 'auto',
    display: 'none',
  });

  // Title row with the close button.
  const top = document.createElement('div');
  Object.assign(top.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' });
  titleEl = document.createElement('div');
  Object.assign(titleEl.style, { color: UI.gold, fontSize: '16px', fontWeight: 'bold' });
  const closeBtn = document.createElement('div');
  closeBtn.textContent = '✕';
  Object.assign(closeBtn.style, { color: UI.textDim, cursor: 'pointer', padding: '0 4px', fontSize: '16px' });
  closeBtn.addEventListener('mouseenter', () => (closeBtn.style.color = UI.textWhite));
  closeBtn.addEventListener('mouseleave', () => (closeBtn.style.color = UI.textDim));
  closeBtn.addEventListener('click', () => closeShop());
  top.append(titleEl, closeBtn);
  win.appendChild(top);

  win.appendChild(sectionTitle('For sale'));
  forSaleEl = grid();
  win.appendChild(forSaleEl);

  win.appendChild(sectionTitle('Sell'));
  sellEl = grid();
  win.appendChild(sellEl);

  goldEl = document.createElement('div');
  Object.assign(goldEl.style, { marginTop: '10px', color: UI.gold, textAlign: 'right' });
  win.appendChild(goldEl);

  root.appendChild(win);

  bus.on('changed', () => {
    if (currentNpc !== null) render();
  });

  // Walking away from the shopkeeper closes the window.
  window.setInterval(() => {
    if (currentNpc === null) return;
    const npc = allEntities().find((e) => e.kind === 'npc' && e.defId === currentNpc);
    if (!npc) {
      closeShop();
      return;
    }
    const d = Math.hypot(npc.position.x - player.position.x, npc.position.z - player.position.z);
    if (d > TUNING.talkRange + 3) closeShop();
  }, 250);
}

/** Shows the shop of an NPC. */
export function openShop(npcId: string): void {
  const def = NPCS[npcId];
  if (!def || !win || !titleEl) return;
  currentNpc = npcId;
  titleEl.textContent = `${def.name}'s Shop`;
  win.style.display = 'block';
  render();
}

export function closeShop(): void {
  currentNpc = null;
  if (win) win.style.display = 'none';
}

function sectionTitle(text: string): HTMLDivElement {
  const el = document.createElement('div');
  el.textContent = text;
  Object.assign(el.style, { color: UI.textDim, margin: '6px 0 4px', fontWeight: 'bold' });
  return el;
}

function grid(): HTMLDivElement {
  const el = document.createElement('div');
  Object.assign(el.style, {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))',
    gap: '6px',
  });
  return el;
}

/** One clickable cell: icon, name, a small line of text (price or count). */
function cell(item: ItemDef, name: string, line: string, nameColor: string, onClick: () => void): HTMLDivElement {
  const el = document.createElement('div');
  Object.assign(el.style, {
    background: UI.panelBgDark,
    border: `1px solid ${UI.borderLight}`,
    padding: '6px 4px',
    textAlign: 'center',
    cursor: 'pointer',
    fontSize: '12px',
    color: UI.text,
  });
  const iconEl = itemIcon(item, 30);
  iconEl.style.margin = '0 auto';
  const nameEl = document.createElement('div');
  nameEl.textContent = name;
  nameEl.style.color = nameColor;
  const lineEl = document.createElement('div');
  lineEl.textContent = line;
  lineEl.style.color = UI.gold;
  el.append(iconEl, nameEl, lineEl);
  el.addEventListener('mouseenter', () => (el.style.color = UI.textWhite));
  el.addEventListener('mouseleave', () => (el.style.color = UI.text));
  el.addEventListener('click', onClick);
  return el;
}

/** Rebuilds both lists and the gold line from the current state. */
function render(): void {
  if (currentNpc === null || !forSaleEl || !sellEl || !goldEl) return;
  const def = NPCS[currentNpc];

  forSaleEl.replaceChildren();
  for (const id of def.shop ?? []) {
    const item = ITEMS[id];
    if (!item) continue;
    forSaleEl.appendChild(cell(item, item.name, `${item.value} gp`, RARITY_COLOR[item.rarity ?? 'plain'], () => buy(id)));
  }

  // Quest items are never offered for sale, so they get no Sell cell.
  sellEl.replaceChildren();
  for (const slot of state.inventory) {
    if (!slot) continue;
    const item = ITEMS[slot.item];
    if (!item || item.questItem) continue;
    const price = Math.max(1, Math.floor(item.value / 2));
    const label = slot.count > 1 ? `${slot.count} x ${item.name}` : item.name;
    sellEl.appendChild(cell(item, label, `${price} gp`, RARITY_COLOR[item.rarity ?? 'plain'], () => sell(slot.item)));
  }

  goldEl.textContent = `Your gold: ${state.gold} gp`;
}

function buy(id: string): void {
  const item = ITEMS[id];
  if (!item) return;
  if (item.questItem) {
    say('That is not for sale.', UI.bad);
    return;
  }
  if (state.gold < item.value) {
    say('You cannot afford that.', UI.bad);
    return;
  }
  if (!addItem(id)) {
    say('Your pack is full.', UI.bad);
    return;
  }
  state.gold -= item.value;
  say(`You buy the ${item.name}.`);
  bus.emit('changed', {});
}

function sell(id: string): void {
  const item = ITEMS[id];
  if (!item || item.questItem) return;
  if (!removeItem(id, 1)) return;
  const price = Math.max(1, Math.floor(item.value / 2));
  state.gold += price;
  say(`You sell the ${item.name}.`);
  bus.emit('changed', {});
}
