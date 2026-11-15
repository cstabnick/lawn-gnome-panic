// The tabbed side panel (RuneScape style): inventory, equipment, stats, quests and spellbook.
import { bus, say } from '../events';
import { state, maxHp, maxMp, equippedArmor, equippedWeapon } from '../state';
import { ATTRIBUTES, EQUIP_SLOTS, INVENTORY_SIZE, ITEMS, QUESTS, SKILLS, SPELLS, TUNING, UI, type EquipSlot } from '../config';
import { castSpell } from '../combat';
import { skillXpToNext, attributeMod } from '../rules';
import { countItem, dropFromSlot, equipFromSlot, unequip, useFromSlot } from '../inventory';
import { showContextMenu, type MenuOption } from './hud';

type TabId = 'inventory' | 'equipment' | 'stats' | 'quests' | 'spells';

const TABS: { id: TabId; icon: string; name: string; key: string }[] = [
  { id: 'inventory', icon: '🎒', name: 'Inventory', key: 'i' },
  { id: 'equipment', icon: '🛡️', name: 'Equipment', key: 'e' },
  { id: 'stats', icon: '📊', name: 'Stats', key: 'c' },
  { id: 'quests', icon: '📜', name: 'Quests', key: 'j' },
  { id: 'spells', icon: '🔮', name: 'Spells', key: 'b' },
];

const EQUIP_LABEL: Record<EquipSlot, string> = { head: 'Head', body: 'Body', weapon: 'Weapon', shield: 'Shield' };

let panel: HTMLElement;
let content: HTMLElement;
let tabButtons: HTMLButtonElement[] = [];
let activeTab: TabId = 'inventory';
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

export function createPanels(root: HTMLElement): void {
  panel = make('div', {
    position: 'absolute', right: '8px', bottom: '8px', boxSizing: 'border-box',
    display: 'flex', flexDirection: 'column', background: UI.panelBg,
    border: `2px solid ${UI.border}`, pointerEvents: 'auto', fontFamily: UI.font,
    fontSize: '13px', color: UI.text,
  });
  panel.id = 'panels';

  // Tab bar: five square buttons.
  const bar = make('div', { display: 'flex', flex: '0 0 auto', borderBottom: `2px solid ${UI.border}` });
  for (const t of TABS) {
    const btn = document.createElement('button');
    btn.textContent = t.icon;
    btn.title = t.name;
    Object.assign(btn.style, {
      flex: '1', height: '32px', padding: '0', border: 'none', borderRight: `1px solid ${UI.border}`,
      color: UI.text, fontSize: '16px', cursor: 'pointer',
    });
    btn.onclick = () => setTab(t.id);
    tabButtons.push(btn);
    bar.append(btn);
  }

  // Scrolling content area below the tabs.
  content = make('div', { flex: '1 1 auto', minHeight: '0', overflowY: 'auto', padding: '6px', boxSizing: 'border-box' });

  panel.append(bar, content);
  root.append(panel);

  applySize();
  window.addEventListener('resize', applySize);

  // Hotkeys, ignored while typing in a field.
  window.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tab = TABS.find((x) => x.key === e.key.toLowerCase());
    if (tab) setTab(tab.id);
  });

  // Redraw on game changes, and every 500 ms for hp, mp and spell availability.
  bus.on('changed', () => render());
  bus.on('quest-updated', () => render());
  bus.on('skill-up', () => render());
  bus.on('level-up', () => render());
  bus.on('item-added', () => render());
  setInterval(() => render(), 500);

  updateTabStyles();
  render();
}

/** Narrow screens get a smaller panel that clears the chat log. */
function applySize(): void {
  const narrow = window.innerWidth < 700;
  panel.style.width = narrow ? '200px' : '250px';
  panel.style.height = narrow ? '300px' : '360px';
  panel.style.bottom = narrow ? '110px' : '8px';
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
  }
  const key = activeTab + '|' + wrap.innerHTML;
  if (key === lastKey) return;
  lastKey = key;
  const top = content.scrollTop;
  content.replaceChildren(wrap);
  content.scrollTop = top;
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
  cell.append(make('span', { fontSize: '24px', lineHeight: '1' }, def.icon));
  if (s.count > 1) {
    cell.append(make('span', { position: 'absolute', top: '1px', left: '2px', fontSize: '10px', lineHeight: '1', color: UI.gold }, String(s.count)));
  }
  cell.title = s.count > 1 ? `${def.name} x${s.count}` : def.name;
  cell.onclick = () => useFromSlot(i);
  cell.oncontextmenu = (e) => {
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY, slotMenu(i));
  };
  return cell;
}

/** Right-click menu for inventory slot i. */
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
  opts.push({ label: `Drop ${def.name}`, onSelect: () => dropFromSlot(i) });
  opts.push({ label: `Examine ${def.name}`, onSelect: () => say(def.examine, UI.textWhite) });
  return opts;
}

// ---------------------------------------------------------------- equipment

function buildEquipment(): HTMLElement {
  const wrap = make('div');
  for (const slot of EQUIP_SLOTS) {
    const id = state.equipment[slot];
    const row = make('div', {
      display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 4px',
      borderBottom: `1px solid ${UI.border}`, cursor: id ? 'pointer' : 'default',
    });
    row.append(make('span', { width: '56px', color: UI.textDim }, EQUIP_LABEL[slot]));
    if (id) {
      const def = ITEMS[id];
      row.append(make('span', { fontSize: '18px', lineHeight: '1' }, def.icon), make('span', {}, def.name));
      row.title = 'Click to take off';
      row.onclick = () => unequip(slot);
    } else {
      row.append(make('span', { color: UI.textDim }, 'empty'));
    }
    wrap.append(row);
  }

  const weapon = equippedWeapon();
  const dice = weapon?.damage ?? [1, 2];
  const skill = weapon?.skill ?? 'blunt';
  const skillLabel = SKILLS.find((s) => s.id === skill)?.name ?? skill;
  wrap.append(
    make('div', { marginTop: '8px' }, `Armor rating: ${equippedArmor()}`),
    make('div', {}, `Damage: ${dice[0]}d${dice[1]} (${skillLabel})`),
  );
  return wrap;
}

// ---------------------------------------------------------------- stats

function buildStats(): HTMLElement {
  const wrap = make('div');
  wrap.append(
    make('div', {}, `Level ${state.level}`),
    make('div', {}, `Skill-ups to next level: ${state.skillUps}/${TUNING.skillUpsPerLevel}`),
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

  wrap.append(make('div', { marginTop: '8px', color: UI.gold, fontWeight: 'bold' }, 'Skills'));
  for (const s of SKILLS) {
    const sk = state.skills[s.id];
    const need = skillXpToNext(sk.level);
    const pct = need > 0 ? Math.min(100, (sk.xp / need) * 100) : 0;
    const row = make('div', { marginBottom: '4px' });
    row.title = s.about;
    const line = make('div', { display: 'flex' });
    line.append(make('span', { flex: '1' }, s.name), make('span', {}, String(sk.level)));
    const bar = make('div', { height: '4px', background: UI.border, marginTop: '2px' });
    bar.append(make('div', { height: '100%', width: `${pct}%`, background: UI.good }));
    row.append(line, bar);
    wrap.append(row);
  }
  return wrap;
}

// ---------------------------------------------------------------- quests

function buildQuests(): HTMLElement {
  const wrap = make('div');
  for (const q of Object.values(QUESTS)) {
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
    wrap.append(row);
  }
  return wrap;
}

// ---------------------------------------------------------------- spells

function buildSpells(): HTMLElement {
  const wrap = make('div');
  for (const sp of Object.values(SPELLS)) {
    const row = make('div', {
      display: 'flex', alignItems: 'flex-start', gap: '6px', padding: '5px 4px', cursor: 'pointer',
      borderBottom: `1px solid ${UI.border}`, opacity: state.mp < sp.cost ? '0.5' : '1',
    });
    row.title = sp.about;
    row.append(make('span', { fontSize: '18px', lineHeight: '1' }, sp.icon));
    const text = make('div', { flex: '1' });
    text.append(
      make('div', {}, `${sp.name} [${sp.key}]`),
      make('div', { color: UI.mana, fontSize: '11px' }, `${sp.cost} MP`),
      make('div', { color: UI.textDim, fontSize: '11px' }, sp.about),
    );
    row.append(text);
    row.onclick = () => castSpell(sp.id);
    wrap.append(row);
  }
  return wrap;
}
