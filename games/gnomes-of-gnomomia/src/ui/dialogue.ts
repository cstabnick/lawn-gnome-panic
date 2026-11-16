// NPC conversation box: a greeting, then numbered options that can start quests, open the shop, heal,
// set flags, teach or reset talents, travel, and give or take items.
import { checkCondition, startQuest } from '../quests';
import { openShop } from './shop';
import { getEntity } from '../entities';
import { player } from '../player';
import { bus, say } from '../events';
import { state, maxHp, setFlag } from '../state';
import { addItem, countItem, removeItem } from '../inventory';
import { chooseClass, respec } from '../talents';
import { loadZone } from '../zones';
import { TUNING, UI, type DialogueAction, type DialogueNode, type DialogueOption } from '../config';
import { CLASSES } from '../data/classes';
import { ITEMS, NPCS, TOPICS, npcGreetings } from '../content';
import { chatLogHeight, compact, fromBottom, hotbarHeight, onLayout } from './layout';

const HEAL_COST = 5;
/** Built-in node that lists a trainer's class abilities. No pack node uses this key. */
const TRAIN_KEY = '~train';

let box: HTMLDivElement | null = null;
/** The NPC being talked to, or null when the box is closed. */
let openNpc: string | null = null;
let openEntity = 0;
/** Options currently shown, in the order they are numbered. */
let shownOptions: DialogueOption[] = [];

/** Builds the hidden dialogue box and listens for talk events. */
export function createDialogue(root: HTMLElement): void {
  box = document.createElement('div');
  Object.assign(box.style, {
    position: 'absolute',
    left: '50%',
    bottom: '170px',
    transform: 'translateX(-50%)',
    width: 'min(560px, 94vw)',
    boxSizing: 'border-box',
    padding: '12px',
    background: UI.panelBg,
    border: `2px solid ${UI.border}`,
    color: UI.text,
    fontFamily: UI.font,
    pointerEvents: 'auto',
    display: 'none',
  });
  root.appendChild(box);
  // Compact screens: sit just above the chat log and scroll rather than run off the top.
  const talkBox = box;
  onLayout(() => {
    const small = compact();
    const above = hotbarHeight() + chatLogHeight() + 12;
    talkBox.style.bottom = small ? fromBottom(above) : '170px';
    talkBox.style.maxHeight = small ? `calc(100vh - ${above + 70}px)` : '';
    talkBox.style.overflowY = small ? 'auto' : '';
    talkBox.style.padding = small ? '8px 10px' : '12px';
  });

  bus.on('talk', ({ npcId, entityId }) => {
    const def = NPCS[npcId];
    if (!def) return;
    // The first greeting whose condition holds (or that has none) opens the talk.
    const greeting = npcGreetings(npcId).find((g) => !g.when || checkCondition(g.when));
    if (!greeting) return;
    openNpc = npcId;
    openEntity = entityId;
    showNode(greeting.node);
  });

  // Number keys 1-9 pick the matching option while the box is open.
  window.addEventListener('keydown', (e) => {
    if (openNpc === null) return;
    const n = Number.parseInt(e.key, 10);
    if (Number.isNaN(n) || n < 1 || n > 9 || n > shownOptions.length) return;
    e.preventDefault();
    pick(shownOptions[n - 1]);
  });

  // Walking away from the NPC closes the box.
  window.setInterval(() => {
    if (openNpc === null) return;
    const ent = getEntity(openEntity);
    if (!ent) {
      close();
      return;
    }
    const d = Math.hypot(ent.position.x - player.position.x, ent.position.z - player.position.z);
    if (d > TUNING.talkRange + 3) close();
  }, 250);
}

export function isDialogueOpen(): boolean {
  return openNpc !== null;
}

export function closeDialogue(): void {
  close();
}

function close(): void {
  openNpc = null;
  shownOptions = [];
  if (!box) return;
  box.style.display = 'none';
  box.replaceChildren();
}

/** The key of the NPC's hub node (where pack topics appear), else its first greeting's node. */
function hubKey(npcId: string): string {
  const nodes = NPCS[npcId].nodes;
  const hub = Object.keys(nodes).find((k) => nodes[k].hub);
  return hub ?? npcGreetings(npcId)[0]?.node ?? '';
}

/** The read-only node that lists a trainer's class abilities and their levels. */
function trainNode(npcId: string): DialogueNode {
  const trainer = NPCS[npcId].trainer;
  const cls = trainer ? CLASSES[trainer] : undefined;
  const lines = cls && cls.abilities.length
    ? cls.abilities.map((a) => `${a.name} (level ${a.level}): ${a.about}`)
    : ['I have no techniques to teach you.'];
  return {
    text: [`Techniques of the ${cls?.name ?? 'trade'}:`, ...lines].join('\n'),
    options: [{ text: 'Back.', next: hubKey(npcId) }],
  };
}

/** The trainer options, shown only to a player of the trainer's class. */
function trainerOptions(npcId: string): DialogueOption[] {
  const def = NPCS[npcId];
  if (!def.trainer || state.classId !== def.trainer) return [];
  return [
    { text: 'Train me.', next: TRAIN_KEY },
    { text: 'Reset my talents.', action: { type: 'respec' } },
  ];
}

/** The options a node shows: its own that pass their condition, plus pack topics on hub nodes. */
function nodeOptions(npcId: string, node: DialogueNode): DialogueOption[] {
  const visible = node.options.filter((o) => checkCondition(o.when));
  if (!node.hub) return visible;
  const extra = [...(TOPICS[npcId] ?? []), ...trainerOptions(npcId)].filter((o) => checkCondition(o.when));
  // Inserted before the node's last option (usually the way out).
  const at = Math.max(0, visible.length - 1);
  return [...visible.slice(0, at), ...extra, ...visible.slice(at)];
}

/** Renders one dialogue node: the NPC's name, its line, then the options that pass their condition. */
function showNode(key: string): void {
  if (!box || openNpc === null) return;
  const def = NPCS[openNpc];
  const node = key === TRAIN_KEY ? trainNode(openNpc) : def.nodes[key];
  if (!node) {
    close();
    return;
  }
  shownOptions = nodeOptions(openNpc, node);

  box.replaceChildren();

  const header = document.createElement('div');
  header.textContent = def.name;
  Object.assign(header.style, { color: UI.gold, fontSize: '16px', fontWeight: 'bold', marginBottom: '6px' });
  box.appendChild(header);

  const text = document.createElement('div');
  text.textContent = node.text;
  Object.assign(text.style, { color: UI.text, marginBottom: '8px', whiteSpace: 'pre-line' });
  box.appendChild(text);

  shownOptions.forEach((opt, i) => {
    const row = document.createElement('div');
    row.textContent = `${i + 1}. ${opt.text}`;
    Object.assign(row.style, { color: UI.text, padding: '3px 0', cursor: 'pointer' });
    row.addEventListener('mouseenter', () => (row.style.color = UI.textWhite));
    row.addEventListener('mouseleave', () => (row.style.color = UI.text));
    row.addEventListener('click', () => pick(opt));
    box!.appendChild(row);
  });

  box.style.display = 'block';
}

/** Runs an option's action, then shows its next node or closes. A failed action keeps the node open. */
function pick(opt: DialogueOption): void {
  if (openNpc === null) return;
  const npcId = openNpc;
  if (opt.action && !runAction(opt.action, npcId)) return;
  // An action such as opening the shop or travelling may already have closed the box.
  if (openNpc === null) return;
  if (opt.next) showNode(opt.next);
  else close();
}

function itemName(id: string): string {
  return ITEMS[id]?.name ?? id;
}

/** Returns false when the action could not be done, so the dialogue stays on the current node. */
function runAction(a: DialogueAction, npcId: string): boolean {
  switch (a.type) {
    case 'startQuest':
      startQuest(a.quest);
      return true;
    case 'openShop':
      close();
      openShop(npcId);
      return true;
    case 'heal': {
      const name = NPCS[npcId].name;
      if (state.gold >= HEAL_COST) {
        const before = state.hp;
        state.gold -= HEAL_COST;
        state.hp = maxHp();
        say(`${name} patches you up for ${HEAL_COST} gold.`, UI.good);
        bus.emit('heal', { amount: state.hp - before });
        bus.emit('changed', {});
      } else {
        say(`You need ${HEAL_COST} gold for that.`, UI.bad);
      }
      return true;
    }
    case 'close':
      close();
      return true;
    case 'setFlag':
      setFlag(a.flag, a.value);
      return true;
    case 'chooseClass':
      chooseClass(a.classId);
      return true;
    case 'respec':
      respec();
      return true;
    case 'travel':
      close();
      loadZone(a.zone, a.x, a.z);
      return true;
    case 'giveItem': {
      if (!addItem(a.item, a.count)) return false;
      say(`You receive ${itemName(a.item)}${a.count > 1 ? ` x${a.count}` : ''}.`, UI.good);
      return true;
    }
    case 'takeItem': {
      const have = countItem(a.item);
      if (have < a.count) {
        say(`You still need ${a.count - have} more ${itemName(a.item)}.`, UI.bad);
        return false;
      }
      removeItem(a.item, a.count);
      return true;
    }
    case 'giveGold': {
      state.gold += a.amount;
      say(`You receive ${a.amount} gold.`, UI.gold);
      bus.emit('changed', {});
      return true;
    }
    case 'takeGold': {
      if (state.gold < a.amount) {
        say(`You need ${a.amount} gold.`, UI.bad);
        return false;
      }
      state.gold -= a.amount;
      say(`You pay ${a.amount} gold.`, UI.gold);
      bus.emit('changed', {});
      return true;
    }
  }
}
