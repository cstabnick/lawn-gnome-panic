// The notice board panel (quests.md, roadmap 8.3). A #dayg-board container on the shared #ui element: the board's name,
// then every open quest on it with its poster, reward and the buttons its state allows (Take, Hand in, Finish).
import { prefabIconElement } from '@lawn/prefabs';
import { DOM_MORE } from '../config';
import { getItem } from '../items/defs';
import type { Bus } from '../game/bus';
import type { BoardPanel, InventorySystem, PlayerState, SimHost } from '../game/types';
import type { ActionResult, BoardId, ItemStack, Quest, QuestGoal, Resource, WorldState } from '../sim/types';
import { questsOn, questTitle } from '../sim/quests';

const NEWCOMER_TITLE = 'Jobs for newcomers';
const FALLBACK_ICON = '📦';
const DEFAULT_BOARD: BoardId = 'board:gate-roof';

const BTN = 'min-width:44px;min-height:44px;padding:0 12px;border:1px solid var(--dg-border);border-radius:8px;background:var(--dg-surface-2);color:var(--dg-text);' +
  'font:14px var(--dg-font);cursor:pointer;touch-action:manipulation';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, css = '', text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (css) node.style.cssText = css;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** The number a quest's progress counts up to, or null for goals that are met by being somewhere. */
function progressTarget(goal: QuestGoal): number | null {
  switch (goal.kind) {
    case 'deliver':
    case 'clear': return goal.count;
    case 'teach': return goal.hours;
    case 'storylet': return goal.step;
    default: return null;
  }
}

function posterName(w: WorldState, poster: string): string {
  if (poster.startsWith('f:')) return w.factions[Number(poster.slice(2))]?.name ?? 'someone';
  if (poster.startsWith('n:')) return w.npcs[Number(poster.slice(2))]?.name ?? 'someone';
  return 'someone';
}

/** Units of one resource the player carries (hands, then pack). */
function carriedOf(inv: InventorySystem, resource: Resource): number {
  let n = 0;
  for (const s of [...inv.state.hands, ...inv.state.pack]) if (s && getItem(s.def).resource === resource) n += s.count;
  return n;
}

/** Takes n units of one resource out of the hands and pack (pack last index first, so indices stay valid). */
function removeResource(inv: InventorySystem, resource: Resource, n: number): void {
  let left = n;
  for (let i = inv.state.pack.length - 1; i >= 0 && left > 0; i--) {
    const s = inv.state.pack[i];
    if (!s || getItem(s.def).resource !== resource) continue;
    const k = Math.min(left, s.count);
    inv.take({ where: 'pack', index: i }, k);
    left -= k;
  }
  for (const h of [0, 1] as const) {
    if (left <= 0) break;
    const s = inv.state.hands[h];
    if (!s || getItem(s.def).resource !== resource) continue;
    const k = Math.min(left, s.count);
    inv.take({ where: 'hand', index: h }, k);
    left -= k;
  }
}

export function createBoardPanel(ui: HTMLElement, deps: { host: SimHost; inv: InventorySystem; bus: Bus; getPlayer: () => PlayerState }): BoardPanel {
  const { host, inv, bus } = deps;
  const root = el('div');
  root.id = DOM_MORE.board;
  root.hidden = true;
  root.style.cssText = 'position:fixed;box-sizing:border-box;left:50%;transform:translateX(-50%);' +
    'top:calc(64px + env(safe-area-inset-top));width:min(92vw,440px);' +
    'max-height:calc(100dvh - 80px - env(safe-area-inset-top) - env(safe-area-inset-bottom));overflow-y:auto;' +
    'background:var(--dg-surface);color:var(--dg-text);font:14px var(--dg-font);padding:14px 16px;border-radius:var(--dg-radius);border:1px solid var(--dg-border);box-shadow:var(--dg-shadow);' +
    'z-index:60;touch-action:pan-y;pointer-events:auto';
  root.addEventListener('mousedown', (e) => e.stopPropagation());
  ui.appendChild(root);

  let current: BoardId | null = null;
  let status = '';

  function close(): void {
    root.hidden = true;
    current = null;
  }

  function addItems(items: ItemStack[] | undefined): void {
    for (const s of items ?? []) {
      const left = inv.add({ ...s });
      if (left) bus.emit('hint', { text: 'No room in your pack.' });
    }
  }

  /** Runs a sim action: null means a guest sent it (the result comes back through onAction). */
  function settle(res: ActionResult | null, onOk: (r: ActionResult) => void): void {
    if (res === null) { status = 'Sent to the host.'; }
    else if (!res.ok) { status = res.error ?? 'That did not work.'; }
    else { status = ''; onOk(res); }
    render();
  }

  function rewardRow(q: Quest): HTMLElement {
    const row = el('div', 'display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:4px;');
    row.append(el('span', '', `${q.reward.acorns} acorns`));
    for (const s of q.reward.items) {
      const def = getItem(s.def);
      const item = el('span', 'display:inline-flex;align-items:center;gap:4px;');
      item.append(prefabIconElement(def.prefab, FALLBACK_ICON, 24), el('span', '', `${def.name}${s.count > 1 ? ` x${s.count}` : ''}`));
      row.append(item);
    }
    return row;
  }

  function questCard(w: WorldState, q: Quest): HTMLElement {
    const me = host.me;
    const rec = w.players[me];
    const card = el('div', 'border-top:1px solid #3a4a33;padding:10px 0;');
    card.append(el('div', 'font-weight:600;', questTitle(w, q)));
    card.append(el('div', 'opacity:0.85;', `Posted by ${posterName(w, q.poster)}`));
    card.append(rewardRow(q));
    const tpd = w.tuning.clock.ticksPerDay;
    const days = Math.max(0, Math.ceil((q.deadline - w.tick) / tpd));
    card.append(el('div', 'opacity:0.85;', `${days} ${days === 1 ? 'day' : 'days'} left`));

    const actions = el('div', 'display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;');
    if (q.state === 'offered' && q.takenBy === null) {
      const take = el('button', BTN, 'Take');
      take.type = 'button';
      take.addEventListener('click', () => settle(host.apply({ kind: 'take-quest', quest: q.id }), (r) => {
        addItems(r.items);
        bus.emit('quest-taken', { quest: q.id });
      }));
      actions.append(take);
    } else if (q.takenBy !== null && q.takenBy !== me) {
      const who = w.players[q.takenBy]?.name ?? 'someone';
      card.append(el('div', 'opacity:0.85;', `Taken by ${who}`));
    } else if (q.takenBy === me) {
      const goal = q.goal;
      if (goal.kind === 'deliver' && rec?.region === goal.to) {
        const carried = carriedOf(inv, goal.resource);
        const accept = Math.min(carried, goal.count - q.progress);
        if (accept > 0) {
          const hand = el('button', BTN, `Hand in ${accept} ${goal.resource}`);
          hand.type = 'button';
          hand.addEventListener('click', () => settle(host.apply({ kind: 'deliver', quest: q.id, resource: goal.resource, count: accept }), () => {
            removeResource(inv, goal.resource, accept);
            bus.emit('hint', { text: `Handed in ${accept} ${goal.resource}.` });
          }));
          actions.append(hand);
        }
      }
      const finish = el('button', BTN, 'Finish');
      finish.type = 'button';
      finish.addEventListener('click', () => settle(host.apply({ kind: 'complete-quest', quest: q.id }), (r) => {
        addItems(r.items);
        bus.emit('quest-done', { quest: q.id, template: q.template });
      }));
      actions.append(finish);
      const target = progressTarget(goal);
      if (target !== null) card.append(el('div', 'opacity:0.85;', `Progress: ${q.progress} of ${target}`));
    }
    card.append(actions);
    return card;
  }

  function render(): void {
    root.replaceChildren();
    if (current === null) return;
    const w = host.world;
    const board = w.boards.find((b) => b.id === current);
    const title = board ? (board.newcomer ? NEWCOMER_TITLE : board.name) : 'Notice board';

    const head = el('div', 'display:flex;align-items:center;gap:8px;padding-right:52px;min-height:44px;');
    head.append(el('div', 'font-size:17px;font-weight:700;flex:1;', title));
    const x = el('button', 'position:absolute;top:max(env(safe-area-inset-top), 8px);right:max(env(safe-area-inset-right), 8px);' +
      'width:44px;height:44px;border:none;border-radius:8px;background:#2d3a25;color:#eee;font:22px system-ui,sans-serif;' +
      'cursor:pointer;touch-action:manipulation', '✕');
    x.type = 'button';
    x.setAttribute('aria-label', 'Close');
    x.addEventListener('click', close);
    root.append(head, x);

    const quests = questsOn(w, current);
    if (quests.length === 0) {
      root.append(el('div', 'padding:12px 0;opacity:0.85;', 'Nothing posted today.'));
    } else {
      for (const q of quests) root.append(questCard(w, q));
    }
    if (status) root.append(el('div', 'padding-top:6px;color:#e8c77a;', status));
  }

  function open(board: BoardId): void {
    current = board;
    status = '';
    root.hidden = false;
    render();
  }

  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !root.hidden) close(); });
  host.onAction(() => { if (!root.hidden) render(); });

  // Screenshots: `?open=board` opens the Waystation board at start.
  if (new URLSearchParams(window.location.search).get('open') === 'board') open(DEFAULT_BOARD);

  return {
    root,
    open,
    close,
    isOpen: (): boolean => !root.hidden,
  };
}
