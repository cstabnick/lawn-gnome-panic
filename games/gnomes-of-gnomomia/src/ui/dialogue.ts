// NPC conversation box: a greeting, then numbered options that can start quests, open the shop or heal.
import { checkCondition, startQuest } from '../quests';
import { openShop } from './shop';
import { getEntity } from '../entities';
import { player } from '../player';
import { bus, say } from '../events';
import { state, maxHp } from '../state';
import { NPCS, TUNING, UI, type DialogueAction, type DialogueOption } from '../config';

const HEAL_COST = 5;

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

  bus.on('talk', ({ npcId, entityId }) => {
    const def = NPCS[npcId];
    if (!def) return;
    // The first greeting whose condition holds (or that has none) opens the talk.
    const greeting = def.greetings.find((g) => !g.when || checkCondition(g.when));
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

/** Renders one dialogue node: the NPC's name, its line, then the options that pass their condition. */
function showNode(key: string): void {
  if (!box || openNpc === null) return;
  const def = NPCS[openNpc];
  const node = def.nodes[key];
  if (!node) {
    close();
    return;
  }
  shownOptions = node.options.filter((o) => checkCondition(o.when));

  box.replaceChildren();

  const header = document.createElement('div');
  header.textContent = def.name;
  Object.assign(header.style, { color: UI.gold, fontSize: '16px', fontWeight: 'bold', marginBottom: '6px' });
  box.appendChild(header);

  const text = document.createElement('div');
  text.textContent = node.text;
  Object.assign(text.style, { color: UI.text, marginBottom: '8px' });
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

/** Runs an option's action, then shows its next node or closes. */
function pick(opt: DialogueOption): void {
  if (openNpc === null) return;
  const npcId = openNpc;
  if (opt.action) runAction(opt.action, npcId);
  // An action such as opening the shop may already have closed the box.
  if (openNpc === null) return;
  if (opt.next) showNode(opt.next);
  else close();
}

function runAction(a: DialogueAction, npcId: string): void {
  switch (a.type) {
    case 'startQuest':
      startQuest(a.quest);
      break;
    case 'openShop':
      close();
      openShop(npcId);
      break;
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
      break;
    }
    case 'close':
      close();
      break;
  }
}
