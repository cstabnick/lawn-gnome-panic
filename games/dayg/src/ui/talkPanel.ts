// The talk panel (quests.md "Talking to NPCs"). A proxy Interactable ("Talk to <name>") opens it for the nearest NPC.
// Phones in portrait get a bottom sheet (up to 60% of the height); landscape and desktop get a side panel.
import { DOM_MORE, TALK } from '../config';
import type { Bus } from '../game/bus';
import type { Interact, Interactable } from '../game/interact';
import type { InventorySystem, NpcActors, PlayerState, SimHost, StackRef } from '../game/types';
import type { AskTopic, NpcId, QuestId, Resource, TalkInput, TalkResult, TalkVerb, WorldState } from '../sim/types';
import { RESOURCES } from '../sim/types';
import { renderLines } from '../sim/phrases';
import { memoryOf, subjectOfPlayer, trustOf } from '../sim/social';
import { factionOf } from '../sim/factions';
import { questTitle } from '../sim/quests';
import { verbsFor } from '../sim/talk';
import { getItem } from '../items/defs';

export interface TalkPanel { root: HTMLElement; open(npc: NpcId): void; close(): void; isOpen(): boolean }
export interface TalkDeps { host: SimHost; npcs: NpcActors; interact: Interact; inv: InventorySystem; bus: Bus; getPlayer: () => PlayerState }

const VERB_LABEL: Record<TalkVerb, string> = {
  'greet': 'Greet', 'ask': 'Ask', 'trade': 'Trade', 'offer-help': 'Offer help', 'ask-help': 'Ask for food',
  'recruit': 'Recruit', 'join': 'Join faction', 'threaten': 'Threaten', 'rob': 'Rob', 'share-food': 'Share food', 'warn': 'Warn',
};
const TRUST_CLOSE_DIST = 2 * TALK.radius;
const STEP_MAX = 9;
const ACORN_MAX = 10;

type Mode = 'verbs' | 'ask' | 'trade';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, css = '', text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (css) node.style.cssText = css;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(text: string, onClick: () => void, disabled = false, extra = ''): HTMLButtonElement {
  const b = el('button', 'min-height:44px;min-width:44px;padding:8px 10px;border-radius:8px;border:1px solid #56614a;' +
    'background:#2d3a25;color:#eee;font:14px system-ui,sans-serif;cursor:pointer;touch-action:manipulation;text-align:left;' +
    (disabled ? 'opacity:0.45;cursor:default;' : '') + extra, text);
  b.type = 'button';
  b.disabled = disabled;
  b.addEventListener('click', (e) => { e.stopPropagation(); if (!b.disabled) onClick(); });
  return b;
}

function trustWord(t: number): string {
  if (t <= -0.5) return 'hostile';
  if (t < 0) return 'wary';
  if (t < 0.3) return 'neutral';
  if (t < 0.6) return 'friendly';
  return 'close';
}

export function createTalkPanel(ui: HTMLElement, deps: TalkDeps): TalkPanel {
  const { host, npcs, interact, inv, bus, getPlayer } = deps;
  const root = el('div');
  root.id = DOM_MORE.talk;
  root.style.cssText = 'position:fixed;box-sizing:border-box;background:var(--dg-surface);color:var(--dg-text);backdrop-filter:blur(6px);' +
    'font:14px var(--dg-font);overflow-y:auto;overflow-x:hidden;z-index:50;touch-action:pan-y;pointer-events:auto;' +
    '-webkit-overflow-scrolling:touch;border:1px solid var(--dg-border);box-shadow:var(--dg-shadow)';
  root.hidden = true;
  root.addEventListener('mousedown', (e) => e.stopPropagation());
  ui.appendChild(root);

  let npcId: NpcId | null = null;
  let mode: Mode = 'verbs';
  let log: string[] = [];
  let offer: QuestId | null = null;
  let watching = false;
  // Trade picker state
  let offerRes: Resource = 'food';
  let offerCount = 1;
  let wantRes: Resource = 'food';
  let wantCount = 1;
  let acorns = 0;
  // A press made as a guest: its result arrives through onAction.
  let pending: { npc: NpcId; verb: TalkVerb } | null = null;

  function applyLayout(): void {
    const portrait = window.innerHeight > window.innerWidth;
    const s = root.style;
    s.left = portrait ? '0' : 'auto';
    s.right = '0';
    s.top = portrait ? 'auto' : '0';
    s.bottom = '0';
    s.width = portrait ? '100%' : 'min(380px, 50vw)';
    s.height = portrait ? '60vh' : '100%';
    s.borderRadius = portrait ? '14px 14px 0 0' : '0';
    s.padding = 'max(env(safe-area-inset-top), 12px) max(env(safe-area-inset-right), 12px) ' +
      'max(env(safe-area-inset-bottom), 8px) max(env(safe-area-inset-left), 12px)';
  }
  applyLayout();
  window.addEventListener('resize', applyLayout);

  /** Inventory counted by resource (hands and pack). */
  function carriedCounts(): Partial<Record<Resource, number>> {
    const out: Partial<Record<Resource, number>> = {};
    for (const ref of takeOrder()) {
      const s = inv.get(ref);
      if (!s) continue;
      const r = getItem(s.def).resource;
      out[r] = (out[r] ?? 0) + s.count;
    }
    return out;
  }

  /** Hands, then the pack from the end, so taking from the pack never shifts an index still to visit. */
  function takeOrder(): StackRef[] {
    const refs: StackRef[] = [{ where: 'hand', index: 0 }, { where: 'hand', index: 1 }];
    for (let i = inv.state.pack.length - 1; i >= 0; i--) refs.push({ where: 'pack', index: i });
    return refs;
  }

  function removeResource(res: Resource, count: number): void {
    let left = count;
    for (const ref of takeOrder()) {
      if (left <= 0) break;
      const s = inv.get(ref);
      if (!s || getItem(s.def).resource !== res) continue;
      const n = Math.min(left, s.count);
      inv.take(ref, n);
      left -= n;
    }
  }

  function hint(text: string): void { bus.emit('hint', { text }); }

  function nearestId(): NpcId | null {
    return npcs.nearest(getPlayer().pos, TALK.radius);
  }

  const proxy: Interactable = {
    id: 'talk',
    get x(): number { const id = nearestId(); return (id === null ? null : npcs.positionOf(id))?.x ?? 0; },
    get y(): number { const id = nearestId(); return (id === null ? null : npcs.positionOf(id))?.y ?? 0; },
    get z(): number { const id = nearestId(); return (id === null ? null : npcs.positionOf(id))?.z ?? 0; },
    radius: TALK.radius,
    label(): string | null {
      const id = nearestId();
      if (id === null) return null;
      const n = host.world.npcs[id];
      return n ? `Talk to ${n.name}` : null;
    },
    act(): void {
      const id = nearestId();
      if (id !== null) open(id);
    },
  };
  interact.add(proxy);

  function npcOpen(): boolean { return npcId !== null && host.world.npcs[npcId] !== undefined; }

  function handleResult(npc: NpcId, verb: TalkVerb, r: TalkResult | undefined): void {
    const w = host.world;
    const n = w.npcs[npc];
    if (!r) return;
    const seed = w.tick + npc;
    for (const line of renderLines(r.lines, seed)) log.push(line);
    log = log.slice(-TALK.linesShown);
    for (const stack of r.give) {
      const left = inv.add(stack);
      if (left) hint('Your pack is full.');
    }
    for (const t of r.take) removeResource(t.resource, t.count);
    bus.emit('talked', { npc, verb, ok: r.ok });
    if (r.quest !== null) offer = r.quest;
    if (r.joined !== null) bus.emit('joined-faction', { faction: r.joined });
    if (r.hostile && n) {
      hint(`${n.name} backs away.`);
      close();
      return;
    }
    render();
  }

  function submit(verb: TalkVerb, extra: Partial<TalkInput> = {}): void {
    if (npcId === null) return;
    const npc = npcId;
    const input: TalkInput = { npc, player: host.me, verb, carried: carriedCounts(), ...extra };
    const res = host.apply({ kind: 'talk', input });
    if (res) handleResult(npc, verb, res.talk);
    else pending = { npc, verb };
  }

  function takeQuest(id: QuestId): void {
    const res = host.apply({ kind: 'take-quest', quest: id });
    if (!res || res.ok) {
      bus.emit('quest-taken', { quest: id });
      if (offer === id) offer = null;
    } else if (res.error) {
      hint(res.error);
    }
    render();
  }

  // Guest path: the host sequences the talk and the result comes back through onAction.
  host.onAction((env, r) => {
    if (!pending || env.player !== host.me || env.action.kind !== 'talk') return;
    const p = pending;
    pending = null;
    if (p.npc !== env.action.input.npc) return;
    handleResult(p.npc, p.verb, r.talk);
  });

  function watch(): void {
    if (!watching) return;
    if (!npcOpen() || npcId === null) { close(); return; }
    const pos = npcs.positionOf(npcId);
    const me = getPlayer().pos;
    if (!pos || Math.hypot(me.x - pos.x, me.z - pos.z) > TRUST_CLOSE_DIST) { close(); return; }
    requestAnimationFrame(watch);
  }

  function open(npc: NpcId): void {
    const n = host.world.npcs[npc];
    if (!n || !n.alive) return;
    if (npcId !== npc) { log = []; offer = null; mode = 'verbs'; }
    npcId = npc;
    root.hidden = false;
    applyLayout();
    render();
    if (!watching) { watching = true; requestAnimationFrame(watch); }
  }

  function close(): void {
    root.hidden = true;
    npcId = null;
    watching = false;
    mode = 'verbs';
    offer = null;
    root.replaceChildren();
  }

  function header(npc: NpcId): HTMLElement {
    const w: WorldState = host.world;
    const n = w.npcs[npc];
    const wrap = el('div', 'margin-bottom:8px;padding-right:52px;position:relative');
    wrap.append(el('div', 'font:bold 18px system-ui,sans-serif', n.name));
    const f = factionOf(w, n);
    const line = el('div', 'font:13px system-ui,sans-serif;opacity:0.9;margin-top:2px;display:flex;align-items:center;gap:6px');
    if (f) {
      const sw = el('span', `display:inline-block;width:12px;height:12px;border-radius:3px;background:#${f.hat.toString(16).padStart(6, '0')}`);
      line.append(sw, el('span', '', f.name));
    } else {
      line.append(el('span', '', 'No faction'));
    }
    const t = trustOf(w, npc, subjectOfPlayer(host.me));
    line.append(el('span', '', `· ${trustWord(t)}`));
    wrap.append(line);
    const x = button('✕', () => close(), false, 'position:absolute;top:0;right:0;width:48px;height:48px;min-width:48px;' +
      'min-height:48px;text-align:center;font-size:20px;padding:0');
    x.setAttribute('aria-label', 'Close talk');
    wrap.append(x);
    return wrap;
  }

  function linesBlock(): HTMLElement {
    const box = el('div', 'margin:8px 0;min-height:44px');
    if (log.length === 0) box.append(el('div', 'opacity:0.6;font-style:italic', 'Nothing said yet.'));
    for (const l of log) box.append(el('p', 'margin:4px 0', l));
    return box;
  }

  function offerBlock(): HTMLElement | null {
    if (offer === null) return null;
    const q = host.world.quests[offer];
    if (!q) return null;
    const box = el('div', 'margin:8px 0;padding:8px;border:1px solid #7fa35a;border-radius:8px;background:#22301c');
    box.append(el('div', 'margin-bottom:6px', `Job: ${questTitle(host.world, q)}`));
    box.append(button('Take it', () => takeQuest(q.id)));
    return box;
  }

  function verbsBlock(npc: NpcId): HTMLElement {
    const grid = el('div', 'display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px;margin-top:6px');
    for (const v of verbsFor(host.world, npc, host.me)) {
      const cell = el('div', 'display:flex;flex-direction:column;gap:2px');
      const onPress = (): void => {
        if (v.verb === 'ask') { mode = 'ask'; render(); return; }
        if (v.verb === 'trade') { startTrade(npc); return; }
        if (v.verb === 'share-food') { submit('share-food', { offer: { resource: 'food', count: 1 } }); return; }
        if (v.verb === 'warn') { submit('warn', { warnOf: npc }); return; }
        submit(v.verb);
      };
      cell.append(button(VERB_LABEL[v.verb], onPress, !v.ok, 'width:100%'));
      if (!v.ok && v.why) cell.append(el('div', 'font:12px system-ui,sans-serif;opacity:0.7;padding:0 2px', v.why));
      grid.append(cell);
    }
    return grid;
  }

  function topicsBlock(npc: NpcId): HTMLElement {
    const w = host.world;
    const box = el('div', 'margin-top:8px');
    box.append(el('div', 'margin-bottom:4px;font-weight:bold', 'Ask about…'));
    const grid = el('div', 'display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px');
    const ask = (topic: AskTopic): void => { submit('ask', { topic }); mode = 'verbs'; };
    const n = w.npcs[npc];
    const places = [n.region, ...(w.graph.neighbours[n.region] ?? []).map((nb) => nb.to)];
    for (const r of places) grid.append(button(`Place: ${w.graph.byId[r].name}`, () => ask({ about: 'place', region: r })));
    const known = memoryOf(w, npc).entries
      .filter((e) => e.s.startsWith('n:'))
      .map((e) => Number(e.s.slice(2)) as NpcId)
      .filter((id) => w.npcs[id]?.alive)
      .slice(0, 8);
    for (const id of known) grid.append(button(`Gnome: ${w.npcs[id].name}`, () => ask({ about: 'gnome', npc: id })));
    for (const r of RESOURCES) grid.append(button(`Price of ${r}`, () => ask({ about: 'price', resource: r })));
    grid.append(button('Herds nearby', () => ask({ about: 'herd' })));
    box.append(grid);
    box.append(button('Back', () => { mode = 'verbs'; render(); }, false, 'margin-top:8px'));
    return box;
  }

  function startTrade(npc: NpcId): void {
    const n = host.world.npcs[npc];
    const have = carriedCounts();
    offerRes = RESOURCES.find((r) => (have[r] ?? 0) > 0) ?? 'food';
    wantRes = RESOURCES.find((r) => n.carried[r] > 0) ?? 'food';
    offerCount = 1;
    wantCount = 1;
    acorns = 0;
    mode = 'trade';
    render();
  }

  function stepper(label: string, value: string, dec: () => void, inc: () => void): HTMLElement {
    const row = el('div', 'display:flex;align-items:center;gap:8px;margin:6px 0');
    row.append(el('span', 'min-width:84px', label));
    row.append(button('−', dec, false, 'min-width:44px;text-align:center'));
    row.append(el('span', 'min-width:90px;text-align:center', value));
    row.append(button('+', inc, false, 'min-width:44px;text-align:center'));
    return row;
  }

  function cycle(r: Resource): Resource {
    const i = RESOURCES.indexOf(r);
    return RESOURCES[(i + 1) % RESOURCES.length];
  }

  function tradeBlock(): HTMLElement {
    const have = carriedCounts();
    const box = el('div', 'margin-top:8px');
    box.append(el('div', 'margin-bottom:4px;font-weight:bold', 'Trade'));
    const offerBtn = button(`You give: ${offerRes} (have ${have[offerRes] ?? 0})`, () => { offerRes = cycle(offerRes); render(); }, false, 'width:100%');
    box.append(offerBtn);
    box.append(stepper('Count', String(offerCount), () => { offerCount = Math.max(1, offerCount - 1); render(); },
      () => { offerCount = Math.min(STEP_MAX, offerCount + 1); render(); }));
    box.append(button(`You want: ${wantRes}`, () => { wantRes = cycle(wantRes); render(); }, false, 'width:100%'));
    box.append(stepper('Count', String(wantCount), () => { wantCount = Math.max(1, wantCount - 1); render(); },
      () => { wantCount = Math.min(STEP_MAX, wantCount + 1); render(); }));
    box.append(stepper('Acorns', acorns > 0 ? `+${acorns} you add` : acorns < 0 ? `${acorns} you ask` : '0',
      () => { acorns = Math.max(-ACORN_MAX, acorns - 1); render(); },
      () => { acorns = Math.min(ACORN_MAX, acorns + 1); render(); }));
    const row = el('div', 'display:flex;gap:8px;margin-top:6px;flex-wrap:wrap');
    row.append(button('Offer', () => {
      submit('trade', { offer: { resource: offerRes, count: offerCount }, want: { resource: wantRes, count: wantCount }, acorns });
      mode = 'verbs';
    }));
    row.append(button('Back', () => { mode = 'verbs'; render(); }));
    box.append(row);
    return box;
  }

  function render(): void {
    if (root.hidden || npcId === null || !npcOpen()) return;
    const npc = npcId;
    const body = el('div', 'padding-bottom:8px');
    body.append(header(npc));
    body.append(linesBlock());
    const off = offerBlock();
    if (off) body.append(off);
    if (mode === 'verbs') body.append(verbsBlock(npc));
    else if (mode === 'ask') body.append(topicsBlock(npc));
    else body.append(tradeBlock());
    root.replaceChildren(body);
  }

  // Re-render on sim ticks and talk / quest events while open.
  bus.on('sim-tick', () => render());
  bus.on('talked', () => render());
  bus.on('quest-taken', () => render());
  bus.on('quest-done', () => render());
  bus.on('quest-failed', () => render());
  bus.on('joined-faction', () => render());
  bus.on('rank-changed', () => render());

  return {
    root,
    open,
    close,
    isOpen: (): boolean => !root.hidden,
  };
}
