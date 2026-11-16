// The tabbed side panel (RuneScape style): inventory, equipment, stats, quests, spells and talents.
import { bus, say } from '../events';
import { state, maxHp, maxMp, equippedWeapon } from '../state';
import { EQUIP_SLOTS, INVENTORY_SIZE, UI, type BookDef, type EquipSlot, type ItemDef, type QuestDef, type Rarity, type SpellDef } from '../config';
import { CLASSES } from '../data/classes';
import { BOOKS, ITEMS, QUESTS } from '../content';
import { ATTRIBUTES, SKILLS, SPELLS } from '../data/core';
import { castSpell, playerArmor, playerDefense } from '../combat';
import { armorValue, attributeMod, mitigation, skillXpToNext, weaponRange } from '../rules';
import { skillCap, xpToNext } from '../progression';
import { countItem, dropFromSlot, equipFromSlot, unequip, useFromSlot } from '../inventory';
import { showContextMenu, type MenuOption } from './hud';
import { renderTalents } from './talents';
import { examineText, itemIcon } from '../itemArt';
import { EDGE, TOUCH, chatLogHeight, compact, dock, dockButton, fromBottom, hotbarHeight, narrow, onLayout, onMenu } from './layout';

type TabId = 'inventory' | 'equipment' | 'stats' | 'quests' | 'spells' | 'talents' | 'lore';

const TABS: { id: TabId; icon: string; name: string; key: string }[] = [
  { id: 'inventory', icon: '🎒', name: 'Inventory', key: 'i' },
  { id: 'equipment', icon: '🛡️', name: 'Equipment', key: 'e' },
  { id: 'stats', icon: '📊', name: 'Stats', key: 'c' },
  { id: 'quests', icon: '📜', name: 'Quests', key: 'j' },
  { id: 'spells', icon: '🔮', name: 'Spells', key: 'b' },
  { id: 'talents', icon: '🌱', name: 'Talents', key: 't' },
  { id: 'lore', icon: '📖', name: 'Lore', key: 'l' },
];

/** Lore journal sections, in display order. */
const LORE_GROUPS: [BookDef['kind'], string][] = [
  ['book', 'Books'], ['journal', 'Journals'], ['letter', 'Letters'], ['note', 'Notes'], ['scroll', 'Scrolls'], ['plaque', 'Plaques'],
];

const EQUIP_LABEL: Record<EquipSlot, string> = {
  head: 'Head', body: 'Body', legs: 'Legs', hands: 'Hands', feet: 'Feet', weapon: 'Weapon', offhand: 'Off-hand', trinket: 'Trinket',
};

/** Gnome-shaped equipment layout: [column, row] on a 4-column grid. */
const EQUIP_GRID: Record<EquipSlot, [number, number]> = {
  head: [2, 1],
  weapon: [1, 2], body: [2, 2], hands: [3, 2], offhand: [4, 2],
  trinket: [1, 3], legs: [2, 3],
  feet: [2, 4],
};

const RARITY_COLOR: Record<Rarity, string> = {
  plain: '#ffffff', sprouted: '#7fd17f', blooming: '#6fb8ff', heirloom: '#c58bff', kilnfired: '#ff9a3c',
};
const RARITY_NAME: Record<Rarity, string> = {
  plain: 'Plain', sprouted: 'Sprouted', blooming: 'Blooming', heirloom: 'Heirloom', kilnfired: 'Kiln-fired',
};

let panel: HTMLElement;
let content: HTMLElement;
let tip: HTMLElement;
let tabButtons: HTMLButtonElement[] = [];
let activeTab: TabId = 'inventory';
/** Compact screens hide the panel behind the bag button in the dock; desktop always shows it. */
let panelOpen = false;
let bagBtn: HTMLButtonElement;
/** The last drawn markup; skip redrawing when nothing changed so clicks are not lost to a rebuild. */
let lastKey = '';

/** Small helper: an element with inline styles and optional text. */
function make(tag: string, style: Record<string, string> = {}, text?: string): HTMLElement {
  const e = document.createElement(tag);
  Object.assign(e.style, style);
  if (text !== undefined) e.textContent = text;
  return e;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** 'critDamage' -> 'Crit damage'. */
function statLabel(key: string): string {
  return cap(key.replace(/([A-Z])/g, ' $1').toLowerCase());
}

export function createPanels(root: HTMLElement): void {
  panel = make('div', {
    position: 'absolute', right: EDGE.right, bottom: EDGE.bottom, boxSizing: 'border-box',
    display: 'flex', flexDirection: 'column', background: UI.panelBg,
    border: `2px solid ${UI.border}`, pointerEvents: 'auto', fontFamily: UI.font,
    fontSize: '13px', color: UI.text,
  });
  panel.id = 'panels';

  // Item tooltip: one floating box, shared by every item cell.
  tip = make('div', {
    position: 'fixed', display: 'none', pointerEvents: 'none', zIndex: '20', maxWidth: '230px', boxSizing: 'border-box',
    background: UI.panelBgDark, border: `1px solid ${UI.borderLight}`, padding: '6px 8px',
    fontFamily: UI.font, fontSize: '12px', color: UI.text,
  });
  tip.id = 'panels-tip';

  // Tab bar: seven square buttons sharing the width evenly.
  const bar = make('div', { display: 'flex', flex: '0 0 auto', borderBottom: `2px solid ${UI.border}` });
  for (const t of TABS) {
    const btn = document.createElement('button');
    btn.textContent = t.icon;
    btn.title = t.name;
    Object.assign(btn.style, {
      flex: '1', minWidth: '0', height: '32px', padding: '0', border: 'none', borderRight: `1px solid ${UI.border}`,
      color: UI.text, fontSize: '16px', cursor: 'pointer',
    });
    btn.onclick = () => setTab(t.id);
    tabButtons.push(btn);
    bar.append(btn);
  }

  // Scrolling content area below the tabs.
  content = make('div', { flex: '1 1 auto', minHeight: '0', overflowY: 'auto', padding: '6px', boxSizing: 'border-box' });

  panel.append(bar, content);
  root.append(panel, tip);

  bagBtn = dockButton(dock(root), '🎒', 'Bag and character (I)');
  bagBtn.onclick = () => togglePanel(!panelOpen);
  // Touch screens have no hover: a long-press shows the item tooltip, and the next touch anywhere hides it.
  if (TOUCH) window.addEventListener('pointerdown', () => hideTip(), true);

  onLayout(applySize);

  // Hotkeys, ignored while typing in a field.
  window.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tab = TABS.find((x) => x.key === e.key.toLowerCase());
    if (!tab) return;
    // On a compact screen the tab key also opens the hidden panel, and pressing the open tab's key closes it.
    if (compact()) togglePanel(!(panelOpen && activeTab === tab.id));
    setTab(tab.id);
  });

  // Redraw on game changes, and every 500 ms for hp, mp and spell availability.
  bus.on('changed', () => render());
  bus.on('quest-updated', () => render());
  bus.on('skill-up', () => render());
  bus.on('level-up', () => render());
  bus.on('item-added', () => render());
  bus.on('talents-changed', () => render());
  bus.on('xp-gained', () => render());
  setInterval(() => render(), 500);

  updateTabStyles();
  render();
}

/**
 * Desktop: bottom-right, always shown. Compact: above the hotbar (and above the full-width chat log in portrait),
 * shown by the bag button, and only as tall as fits under the orbs.
 */
function applySize(): void {
  const small = compact();
  bagBtn.style.display = small ? '' : 'none';
  if (!small) {
    panel.style.display = 'flex';
    panel.style.width = '250px';
    panel.style.height = '360px';
    panel.style.bottom = EDGE.bottom;
    return;
  }
  const above = hotbarHeight() + 6 + (narrow() ? chatLogHeight() + 6 : 0);
  panel.style.display = panelOpen ? 'flex' : 'none';
  panel.style.width = '220px';
  panel.style.bottom = fromBottom(above);
  // Keep clear of the orbs and XP bar (about 96 px from the top).
  panel.style.height = `${Math.max(160, Math.min(narrow() ? 320 : 360, innerHeight - above - 8 - 100))}px`;
}

function togglePanel(open: boolean): void {
  panelOpen = open;
  bagBtn.style.borderColor = open ? UI.gold : UI.border;
  if (!open) hideTip();
  applySize();
}

function setTab(id: TabId): void {
  activeTab = id;
  lastKey = '';
  updateTabStyles();
  render();
}

function updateTabStyles(): void {
  TABS.forEach((t, i) => {
    tabButtons[i].style.background = t.id === activeTab ? UI.borderLight : UI.panelBgDark;
  });
}

function render(): void {
  const wrap = make('div');
  switch (activeTab) {
    case 'inventory': wrap.append(buildInventory()); break;
    case 'equipment': wrap.append(buildEquipment()); break;
    case 'stats': wrap.append(buildStats()); break;
    case 'quests': wrap.append(buildQuests()); break;
    case 'spells': wrap.append(buildSpells()); break;
    case 'talents': renderTalents(wrap); break;
    case 'lore': wrap.append(buildLore()); break;
  }
  const key = activeTab + '|' + wrap.innerHTML;
  if (key === lastKey) return;
  lastKey = key;
  const top = content.scrollTop;
  hideTip();
  content.replaceChildren(wrap);
  content.scrollTop = top;
}

// ---------------------------------------------------------------- item tooltips

/** Builds the tooltip body for an item: name by rarity, ilvl, damage or armor, stats, effect. */
function buildItemTip(id: string): HTMLElement[] {
  const def: ItemDef | undefined = ITEMS[id];
  if (!def) return [];
  const rarity: Rarity = def.rarity ?? 'plain';
  const lines: HTMLElement[] = [];
  lines.push(make('div', { fontWeight: 'bold', color: RARITY_COLOR[rarity] }, def.name));
  lines.push(make('div', { color: UI.textDim, fontSize: '11px' },
    def.ilvl !== undefined ? `ilvl ${def.ilvl} · ${RARITY_NAME[rarity]}` : RARITY_NAME[rarity]));
  if (def.kind === 'weapon') {
    const [lo, hi] = weaponRange(def);
    lines.push(make('div', {}, `Damage: ${lo}-${hi}${def.damageType ? ' ' + def.damageType : ''}`));
  }
  const armor = armorValue(def);
  if (armor > 0) lines.push(make('div', {}, `Armor: ${armor}`));
  for (const [k, v] of Object.entries(def.stats ?? {})) {
    if (v === undefined) continue;
    lines.push(make('div', { color: UI.good }, `${v > 0 ? '+' : ''}${v} ${statLabel(k)}`));
  }
  if (def.effect) lines.push(make('div', { color: UI.gold, fontStyle: 'italic' }, def.effect));
  if (def.questItem) lines.push(make('div', { color: UI.quest, fontSize: '11px' }, 'Quest item'));
  return lines;
}

function showItemTip(e: MouseEvent, id: string): void {
  tip.replaceChildren(...buildItemTip(id));
  tip.style.display = 'block';
  moveItemTip(e);
}

function moveItemTip(e: MouseEvent): void {
  let left = e.clientX + 14;
  let top = e.clientY + 14;
  if (left + tip.offsetWidth > window.innerWidth) left = e.clientX - tip.offsetWidth - 14;
  if (top + tip.offsetHeight > window.innerHeight) top = e.clientY - tip.offsetHeight - 14;
  tip.style.left = `${Math.max(0, left)}px`;
  tip.style.top = `${Math.max(0, top)}px`;
}

/** Touch: the item tooltip, to the left of the panel (or above it when there is no room). */
function showTipBesidePanel(id: string): void {
  tip.replaceChildren(...buildItemTip(id));
  tip.style.display = 'block';
  const r = panel.getBoundingClientRect();
  const fitsLeft = r.left - tip.offsetWidth - 6 >= 0;
  tip.style.left = `${fitsLeft ? r.left - tip.offsetWidth - 6 : Math.max(0, r.right - tip.offsetWidth)}px`;
  tip.style.top = `${fitsLeft ? r.top : Math.max(0, r.top - tip.offsetHeight - 6)}px`;
}

function hideTip(): void {
  tip.style.display = 'none';
}

/** Hooks the shared item tooltip onto a cell. */
function attachTip(el: HTMLElement, id: string): void {
  if (TOUCH) return;
  el.onmouseenter = (e) => showItemTip(e, id);
  el.onmousemove = (e) => moveItemTip(e);
  el.onmouseleave = () => hideTip();
}

// ---------------------------------------------------------------- inventory

function buildInventory(): HTMLElement {
  const wrap = make('div');
  const grid = make('div', { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 50px))' });
  for (let i = 0; i < INVENTORY_SIZE; i++) grid.append(slotCell(i));
  wrap.append(grid, make('div', { marginTop: '6px', color: UI.gold }, `🪙 ${state.gold} gold`));
  return wrap;
}

function slotCell(i: number): HTMLElement {
  const s = state.inventory[i];
  const cell = make('div', {
    position: 'relative', width: '100%', height: '44px', boxSizing: 'border-box',
    border: `1px solid ${UI.border}`, background: UI.panelBgDark,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: s ? 'pointer' : 'default',
  });
  if (!s) return cell;

  const def = ITEMS[s.item];
  cell.append(itemIcon(def, 32));
  if (s.count > 1) {
    cell.append(make('span', { position: 'absolute', top: '1px', left: '2px', fontSize: '10px', lineHeight: '1', color: UI.gold }, String(s.count)));
  }
  attachTip(cell, s.item);
  cell.onclick = () => useFromSlot(i);
  onMenu(cell, (x, y) => {
    hideTip();
    if (TOUCH) showTipBesidePanel(s.item);
    showContextMenu(x, y, slotMenu(i));
  });
  return cell;
}

/** Right-click menu for inventory slot i. Quest items get no Drop option. */
function slotMenu(i: number): MenuOption[] {
  const s = state.inventory[i];
  if (!s) return [];
  const def = ITEMS[s.item];
  const opts: MenuOption[] = [];
  if (def.kind === 'potion') {
    opts.push({ label: def.id === 'mushroom' ? `Eat ${def.name}` : `Drink ${def.name}`, onSelect: () => useFromSlot(i) });
  } else if (def.slot) {
    opts.push({ label: def.kind === 'armor' ? `Wear ${def.name}` : `Wield ${def.name}`, onSelect: () => equipFromSlot(i) });
  }
  if (!def.questItem) opts.push({ label: `Drop ${def.name}`, onSelect: () => dropFromSlot(i) });
  opts.push({ label: `Examine ${def.name}`, onSelect: () => say(examineText(def), UI.textWhite) });
  return opts;
}

// ---------------------------------------------------------------- equipment

function buildEquipment(): HTMLElement {
  const wrap = make('div');
  const grid = make('div', { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '4px' });
  for (const slot of EQUIP_SLOTS) {
    const id = state.equipment[slot];
    const [col, row] = EQUIP_GRID[slot];
    const cell = make('div', {
      gridColumn: String(col), gridRow: String(row), height: '50px', boxSizing: 'border-box', minWidth: '0',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1px', overflow: 'hidden',
      border: `1px solid ${UI.border}`, background: UI.panelBgDark, cursor: id ? 'pointer' : 'default',
    });
    if (id) {
      const def = ITEMS[id];
      cell.style.borderColor = RARITY_COLOR[def.rarity ?? 'plain'];
      cell.append(itemIcon(def, 24));
      cell.append(make('span', {
        fontSize: '9px', lineHeight: '1.1', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }, def.name));
      attachTip(cell, id);
      cell.onclick = () => {
        hideTip();
        unequip(slot);
      };
    } else {
      cell.append(make('span', { fontSize: '9px', color: UI.textDim }, EQUIP_LABEL[slot]));
    }
    grid.append(cell);
  }
  wrap.append(grid);

  const weapon = equippedWeapon();
  const [dmgMin, dmgMax] = weapon ? weaponRange(weapon) : [1, 2];
  const dmgType = weapon?.damageType;
  const skill = !weapon || dmgType === 'crush' ? 'blunt' : dmgType === 'pierce' ? 'marksmanship' : 'blade';
  const skillLabel = SKILLS.find((s) => s.id === skill)?.name ?? skill;
  wrap.append(
    make('div', { marginTop: '8px' }, `Armor rating: ${playerArmor()}`),
    make('div', {}, `Damage: ${dmgMin}-${dmgMax} (${skillLabel})`),
  );
  return wrap;
}

// ---------------------------------------------------------------- stats

function buildStats(): HTMLElement {
  const wrap = make('div');
  const className = state.classId ? CLASSES[state.classId].name : 'Classless';
  wrap.append(
    make('div', { fontWeight: 'bold' }, `${className} · Level ${state.level}`),
    make('div', {}, `XP ${state.xp} / ${xpToNext(state.level)}`),
    make('div', {}, `HP ${state.hp}/${maxHp()}`),
    make('div', {}, `MP ${state.mp}/${maxMp()}`),
  );

  wrap.append(make('div', { marginTop: '8px', color: UI.gold, fontWeight: 'bold' }, 'Attributes'));
  for (const a of ATTRIBUTES) {
    const v = state.attributes[a];
    const m = attributeMod(v);
    const row = make('div', { display: 'flex' });
    row.append(
      make('span', { flex: '1' }, cap(a)),
      make('span', { width: '36px', textAlign: 'right' }, String(v)),
      make('span', { width: '36px', textAlign: 'right', color: UI.textDim }, m > 0 ? `+${m}` : String(m)),
    );
    wrap.append(row);
  }

  const levelCap = skillCap();
  wrap.append(make('div', { marginTop: '8px', color: UI.gold, fontWeight: 'bold' }, 'Skills'));
  for (const s of SKILLS) {
    const sk = state.skills[s.id];
    const need = skillXpToNext(sk.level);
    const pct = need > 0 ? Math.min(100, (sk.xp / need) * 100) : 0;
    const row = make('div', { marginBottom: '4px' });
    row.title = s.about;
    const line = make('div', { display: 'flex' });
    line.append(make('span', { flex: '1' }, s.name), make('span', {}, `${sk.level} / ${levelCap}`));
    const bar = make('div', { height: '4px', background: UI.border, marginTop: '2px' });
    bar.append(make('div', { height: '100%', width: `${pct}%`, background: UI.good }));
    row.append(line, bar);
    wrap.append(row);
  }

  const armorPct = Math.round(mitigation(playerArmor(), state.level) * 100);
  wrap.append(
    make('div', { marginTop: '8px' }, `Defense: ${playerDefense()}`),
    make('div', {}, `Armor: ${armorPct}%`),
    make('div', { marginTop: '4px', color: state.skillPoints > 0 ? UI.gold : UI.textDim },
      `Skill points unspent: ${state.skillPoints}`),
  );
  return wrap;
}

// ---------------------------------------------------------------- quests

/** One quest in the journal: name, and the current stage text when started. */
function questRow(q: QuestDef): HTMLElement {
  const prog = state.quests[q.id];
  const row = make('div', { marginBottom: '8px' });
  if (!prog) {
    row.append(make('div', { color: UI.bad }, q.name));
  } else if (prog.done) {
    row.append(make('div', { color: UI.good }, `${q.name} ✔`));
  } else {
    row.append(make('div', { color: UI.gold }, q.name));
    const stage = q.stages[prog.stage];
    if (stage) {
      let text = stage.text;
      const obj = stage.objective;
      if (obj.type === 'kill') text += ` (${prog.count}/${obj.count})`;
      if (obj.type === 'collect') text += ` (${countItem(obj.item)}/${obj.count})`;
      row.append(make('div', { color: UI.text }, text));
    }
  }
  return row;
}

/** Groups with main chapters first, then storylines. Finished quests sit in a collapsed list. */
function buildQuests(): HTMLElement {
  const wrap = make('div');
  const groups = new Map<string, QuestDef[]>();
  for (const q of Object.values(QUESTS)) {
    const key = q.chain ?? 'Other storylines';
    const list = groups.get(key) ?? [];
    list.push(q);
    groups.set(key, list);
  }
  const isMain = (list: QuestDef[]) => list.some((q) => q.tier !== 'side');
  const ordered = [...groups.entries()].sort((a, b) => Number(isMain(b[1])) - Number(isMain(a[1])));

  for (const [chain, list] of ordered) {
    wrap.append(make('div', { marginTop: '6px', color: UI.gold, fontWeight: 'bold' }, chain));
    const open = list.filter((q) => !state.quests[q.id]?.done);
    const finished = list.filter((q) => state.quests[q.id]?.done);
    for (const q of open) wrap.append(questRow(q));
    if (finished.length > 0) {
      const details = document.createElement('details');
      details.append(make('summary', { color: UI.textDim, cursor: 'pointer', marginBottom: '6px' }, `Finished (${finished.length})`));
      for (const q of finished) details.append(questRow(q));
      wrap.append(details);
    }
  }
  return wrap;
}

// ---------------------------------------------------------------- lore

/** The lore journal: every piece read so far, grouped by kind. Clicking a row opens it again. */
function buildLore(): HTMLElement {
  const wrap = make('div');
  const total = Object.keys(BOOKS).length;
  wrap.append(make('div', { color: UI.gold, marginBottom: '4px' }, `Lore found: ${state.booksRead.length} of ${total}`));

  const read = state.booksRead.filter((id) => BOOKS[id] !== undefined);
  if (read.length === 0) {
    wrap.append(make('div', { color: UI.textDim, fontStyle: 'italic', marginTop: '6px' },
      'Nothing read yet. Bookshelves, lecterns, notes and plaques around Fescue fill this journal.'));
    return wrap;
  }

  for (const [kind, heading] of LORE_GROUPS) {
    const ids = read.filter((id) => BOOKS[id].kind === kind);
    if (ids.length === 0) continue;
    wrap.append(make('div', { marginTop: '6px', color: UI.gold, fontWeight: 'bold' }, heading));
    for (const id of ids) {
      const b = BOOKS[id];
      const row = make('div', {
        padding: '4px', cursor: 'pointer', borderBottom: `1px solid ${UI.border}`,
      });
      row.append(make('span', {}, b.title));
      if (b.author) row.append(make('span', { color: UI.textDim, fontSize: '11px' }, `  ${b.author}`));
      row.onmouseenter = () => (row.style.background = UI.borderLight);
      row.onmouseleave = () => (row.style.background = '');
      row.onclick = () => bus.emit('book-open', { book: id, first: false });
      wrap.append(row);
    }
  }
  return wrap;
}

// ---------------------------------------------------------------- spells

/** MP shown for a spell: Hedge-Mage uses its highest rank at or below the level, others count as rank 1. */
function spellMpCost(sp: SpellDef): number {
  const rank = state.classId === 'mage'
    ? sp.ranks.filter((r) => r <= state.level).reduce((a, b) => Math.max(a, b), 1)
    : 1;
  return Math.round(5 + 1.5 * rank);
}

function buildSpells(): HTMLElement {
  const wrap = make('div');
  Object.values(SPELLS).forEach((sp, index) => {
    const mp = spellMpCost(sp);
    const row = make('div', {
      display: 'flex', alignItems: 'flex-start', gap: '6px', padding: '5px 4px', cursor: 'pointer',
      borderBottom: `1px solid ${UI.border}`, opacity: state.mp < mp ? '0.5' : '1',
    });
    row.title = sp.about;
    row.append(make('span', { fontSize: '18px', lineHeight: '1' }, sp.icon));
    const text = make('div', { flex: '1' });
    text.append(
      make('div', {}, `${sp.name} [${index + 1}]`),
      make('div', { color: UI.mana, fontSize: '11px' }, `${mp} MP`),
      make('div', { color: UI.textDim, fontSize: '11px' }, sp.about),
    );
    row.append(text);
    row.onclick = () => castSpell(sp.id);
    wrap.append(row);
  });
  return wrap;
}
