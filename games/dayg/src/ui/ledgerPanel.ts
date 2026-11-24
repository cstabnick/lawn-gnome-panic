// The journal: people (the trust ledger), factions, quests, skills (roadmap 8.2). Opened by the Journal button and the J key.
import { getItem } from '../items/defs';
import { DOM_MORE } from '../config';
import type { Bus } from '../game/bus';
import type { LedgerPanel, LedgerTab, QuestRunner, SimHost, SkillSystem } from '../game/types';
import type { Faction, Quest, QuestGoal, RegionId, WorldState } from '../sim/types';
import { HAVEN_NAME, REGIONS } from '../sim/regions';
import { membersOf, powerOf, rankOf } from '../sim/factions';
import { knownBy, standingOf, entryOf } from '../sim/social';
import { questTitle } from '../sim/quests';

const LEDGER_ROWS = 50;
const TABS: readonly { id: LedgerTab; label: string }[] = [
  { id: 'people', label: 'People' }, { id: 'factions', label: 'Factions' },
  { id: 'quests', label: 'Quests' }, { id: 'skills', label: 'Skills' },
];
const BUTTON_CSS = 'min-height:44px;min-width:44px;padding:8px 12px;border-radius:8px;border:1px solid #56614a;' +
  'background:#2d3a25;color:#eee;font:14px system-ui,sans-serif;cursor:pointer;touch-action:manipulation;';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, css = '', text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (css) node.style.cssText = css;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(text: string, onClick: () => void, extra = ''): HTMLButtonElement {
  const b = el('button', BUTTON_CSS + extra, text);
  b.type = 'button';
  b.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
  return b;
}

function regionName(id: RegionId | null): string {
  if (!id) return 'somewhere';
  return REGIONS.find((r) => r.id === id)?.name ?? id;
}

function notorietyWord(n: number): string {
  if (n >= 0.6) return 'famous';
  if (n >= 0.3) return 'known';
  if (n >= 0.1) return 'heard of';
  return 'unknown';
}

function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

function npcName(w: WorldState, id: number): string {
  return w.npcs.find((n) => n.id === id)?.name ?? 'someone';
}

/** What the player has to do, from the goal. */
function questTodo(w: WorldState, q: Quest): string {
  const g: QuestGoal = q.goal;
  switch (g.kind) {
    case 'deliver': return `Bring ${g.count} ${g.resource} to ${regionName(g.to)}`;
    case 'clear': return `Destroy ${Math.max(0, g.count - q.progress)} more Hatless in ${regionName(g.region)}`;
    case 'find': return `Find ${npcName(w, g.npc)} in ${regionName(g.region)}`;
    case 'escort': return `Escort ${npcName(w, g.npc)} from ${regionName(g.from)} to ${regionName(g.to)}`;
    case 'visit': return g.item ? `Take ${getItem(g.item).name} to ${regionName(g.region)}` : `Go to ${regionName(g.region)}`;
    case 'target': return `Deal with ${npcName(w, g.npc)}`;
    case 'steer': return `Make noise to lead the herd away from ${regionName(g.away)}`;
    case 'teach': return `Teach ${g.skill} to level ${g.level}`;
    case 'storylet': return `Follow the lead in ${regionName(g.region)}`;
  }
}

/** Progress as "x of n" where the goal has a count, else null. */
function questProgress(q: Quest): string | null {
  const g = q.goal;
  if (g.kind === 'deliver' || g.kind === 'clear') return `${q.progress} of ${g.count}`;
  if (g.kind === 'teach') return `${q.progress} of ${g.hours} h`;
  return null;
}

function daysLeft(w: WorldState, q: Quest): number {
  return Math.max(0, Math.ceil((q.deadline - w.tick) / w.tuning.clock.ticksPerDay));
}

export function createLedgerPanel(ui: HTMLElement, deps: { host: SimHost; quests: QuestRunner; skills: SkillSystem; bus: Bus }): LedgerPanel {
  const { host, quests, bus } = deps;
  let tab: LedgerTab = 'people';

  const root = el('div');
  root.id = DOM_MORE.ledger;
  root.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;box-sizing:border-box;z-index:55;background:rgba(18,22,16,0.96);pointer-events:auto;' +
    'color:#eee;font:14px system-ui,sans-serif;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;touch-action:pan-y;' +
    'padding:calc(12px + env(safe-area-inset-top)) calc(12px + env(safe-area-inset-right)) calc(12px + env(safe-area-inset-bottom)) ' +
    'calc(12px + env(safe-area-inset-left));';
  root.addEventListener('mousedown', (e) => e.stopPropagation());
  root.hidden = true;
  ui.appendChild(root);

  // Online sits at right 60 px, so this stays within 52 px of width.
  const journalBtn = button('Journal', () => toggle(), 'position:absolute;top:calc(72px + env(safe-area-inset-top));' +
    'right:calc(8px + env(safe-area-inset-right));z-index:40;padding:0 4px;font-size:12px;box-sizing:border-box;pointer-events:auto;');
  journalBtn.id = 'dayg-ledger-btn';
  journalBtn.title = 'Journal (J)';
  ui.appendChild(journalBtn);

  function isOpen(): boolean { return !root.hidden; }

  function close(): void { root.hidden = true; }

  function open(t?: LedgerTab): void {
    if (t) tab = t;
    root.hidden = false;
    render();
  }

  function toggle(): void {
    if (isOpen()) close(); else open();
  }

  function header(): HTMLElement {
    const row = el('div', 'display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px');
    row.append(el('div', 'font:bold 18px system-ui,sans-serif', 'Journal'));
    row.append(button('Close', close));
    return row;
  }

  function topLine(w: WorldState): HTMLElement {
    const me = w.players[host.me];
    const line = el('div', 'margin:6px 0 10px;padding:8px;border-radius:8px;background:#222b1e;font:14px system-ui,sans-serif');
    const faction = me?.faction !== null && me?.faction !== undefined ? w.factions[me.faction] : undefined;
    const rank = faction && me ? rankOf(w, faction.id, host.me) : null;
    const who = faction ? `${faction.name}${rank ? `, ${cap(rank)}` : ''}` : 'no faction';
    line.textContent = `${me?.acorns ?? 0} acorns  ·  Notoriety: ${notorietyWord(me?.notoriety ?? 0)}  ·  ${who}`;
    return line;
  }

  function tabs(): HTMLElement {
    const row = el('div', 'display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px');
    for (const t of TABS) {
      const b = button(t.label, () => { tab = t.id; render(); },
        t.id === tab ? 'background:#56614a;border-color:#e8c35a;' : '');
      b.setAttribute('aria-pressed', String(t.id === tab));
      row.append(b);
    }
    return row;
  }

  function peopleBody(w: WorldState): HTMLElement {
    const wrap = el('div');
    const rows = knownBy(w, host.me)
      .sort((a, b) => Math.abs(b.trust) - Math.abs(a.trust) || a.npc - b.npc)
      .slice(0, LEDGER_ROWS);
    if (rows.length === 0) { wrap.append(el('div', 'opacity:0.7', 'Nobody knows you yet.')); return wrap; }
    for (const r of rows) {
      const npc = w.npcs.find((n) => n.id === r.npc);
      if (!npc) continue;
      const entry = entryOf(w, npc.id, `p:${host.me}`);
      const card = el('div', 'padding:8px;margin:4px 0;border-radius:8px;background:#222b1e');
      card.append(el('div', 'font:bold 14px system-ui,sans-serif', npc.name));
      const bar = el('div', 'position:relative;height:10px;border-radius:5px;background:#333;margin:6px 0;overflow:hidden');
      const pct = Math.abs(r.trust) * 50;
      const fill = el('div', `position:absolute;top:0;bottom:0;width:${pct}%;` +
        `${r.trust >= 0 ? 'left:50%' : 'right:50%'};background:${r.trust >= 0 ? '#7fa35a' : '#c0623a'}`);
      bar.append(fill, el('div', 'position:absolute;left:50%;top:0;bottom:0;width:1px;background:#888'));
      card.append(bar);
      const debt = entry?.debt ?? 0;
      const grudge = entry?.grudge ?? null;
      card.append(el('div', 'font:13px system-ui,sans-serif;opacity:0.85',
        `Trust ${Math.round(r.trust * 100)}  ·  Debt ${debt}  ·  Grudge ${grudge ?? 'none'}  ·  ${regionName(npc.region)}`));
      wrap.append(card);
    }
    return wrap;
  }

  function factionCard(w: WorldState, f: Faction, place: number): HTMLElement {
    const me = w.players[host.me];
    const mine = me?.faction === f.id;
    const card = el('div', 'padding:8px;margin:4px 0;border-radius:8px;background:#222b1e;display:flex;gap:10px;align-items:flex-start');
    const swatch = el('div', `width:22px;height:22px;flex:0 0 22px;border-radius:4px;border:1px solid #000;` +
      `background:#${f.hat.toString(16).padStart(6, '0')}`);
    const text = el('div', 'flex:1;min-width:0');
    text.append(el('div', 'font:bold 14px system-ui,sans-serif', `${place}. ${f.name}`));
    const rank = rankOf(w, f.id, host.me);
    const havens = f.havens.map((h) => HAVEN_NAME[h]).join(', ') || 'none';
    text.append(el('div', 'font:13px system-ui,sans-serif;opacity:0.85',
      `Members ${membersOf(w, f).length}  ·  Havens ${havens}`));
    text.append(el('div', 'font:13px system-ui,sans-serif;opacity:0.85',
      `Standing ${Math.round(standingOf(w, f.id, host.me))}  ·  Rank ${mine && rank ? cap(rank) : 'none'}`));
    card.append(swatch, text);
    if (mine) {
      card.append(button('Leave', () => {
        host.apply({ kind: 'leave-faction' });
        render();
      }));
    } else if (!me?.faction && me) {
      card.append(button('Join', () => {
        const r = host.apply({ kind: 'join-faction', faction: f.id });
        if (r?.ok) bus.emit('joined-faction', { faction: f.id });
        render();
      }));
    }
    return card;
  }

  function factionsBody(w: WorldState): HTMLElement {
    const wrap = el('div');
    const alive = w.factions.filter((f) => f.diedTick === null)
      .sort((a, b) => powerOf(w, b) - powerOf(w, a) || a.id - b.id);
    if (alive.length === 0) { wrap.append(el('div', 'opacity:0.7', 'No factions are left.')); return wrap; }
    alive.forEach((f, i) => wrap.append(factionCard(w, f, i + 1)));
    return wrap;
  }

  function questCard(w: WorldState, q: Quest, showTrack: boolean): HTMLElement {
    const card = el('div', 'padding:8px;margin:4px 0;border-radius:8px;background:#222b1e');
    card.append(el('div', 'font:bold 14px system-ui,sans-serif', questTitle(w, q)));
    card.append(el('div', 'margin:4px 0', questTodo(w, q)));
    const prog = questProgress(q);
    const meta = [prog ? `Progress ${prog}` : null, q.state === 'taken' ? `${daysLeft(w, q)} world-days left` : null]
      .filter((x): x is string => x !== null).join('  ·  ');
    if (meta) card.append(el('div', 'font:13px system-ui,sans-serif;opacity:0.85', meta));
    if (showTrack) {
      const row = el('div', 'display:flex;gap:6px;margin-top:6px;flex-wrap:wrap');
      const tracked = quests.tracked()?.id === q.id;
      row.append(button(tracked ? 'Tracking' : 'Track', () => { quests.track(q.id); render(); }));
      row.append(button('Abandon', () => {
        host.apply({ kind: 'abandon-quest', quest: q.id });
        render();
      }));
      card.append(row);
    }
    return card;
  }

  function questsBody(w: WorldState): HTMLElement {
    const wrap = el('div');
    wrap.append(el('div', 'font:bold 14px system-ui,sans-serif;margin:4px 0', 'Active'));
    const active = quests.active();
    if (active.length === 0) wrap.append(el('div', 'opacity:0.7', 'No quests taken.'));
    for (const q of active) wrap.append(questCard(w, q, true));
    wrap.append(el('div', 'font:bold 14px system-ui,sans-serif;margin:12px 0 4px', 'Finished'));
    const past = w.quests
      .filter((q) => q.takenBy === host.me && (q.state === 'done' || q.state === 'failed'))
      .sort((a, b) => (b.doneTick ?? b.takenTick ?? 0) - (a.doneTick ?? a.takenTick ?? 0))
      .slice(0, 8);
    if (past.length === 0) wrap.append(el('div', 'opacity:0.7', 'Nothing finished yet.'));
    for (const q of past) {
      const card = el('div', 'padding:6px 8px;margin:4px 0;border-radius:8px;background:#1b2216;opacity:0.9');
      card.append(el('div', '', `${questTitle(w, q)}  (${q.state === 'done' ? 'done' : 'failed'})`));
      wrap.append(card);
    }
    return wrap;
  }

  function skillsBody(): HTMLElement {
    return el('div', 'opacity:0.8', 'Skills show here.');
  }

  function render(): void {
    if (!isOpen()) return;
    const w = host.world;
    root.replaceChildren();
    root.append(header(), topLine(w), tabs());
    const body = tab === 'people' ? peopleBody(w)
      : tab === 'factions' ? factionsBody(w)
        : tab === 'quests' ? questsBody(w)
          : skillsBody();
    root.append(body);
  }

  // Refresh while open.
  const refreshOn = ['sim-tick', 'talked', 'quest-taken', 'quest-done', 'quest-failed', 'joined-faction', 'rank-changed'] as const;
  for (const k of refreshOn) bus.on(k, () => { if (isOpen()) render(); });
  host.onAction((env) => { if (env.player === host.me && isOpen()) render(); });

  // Keys: J toggles, Esc closes. Ignored while typing in a field.
  window.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.key === 'j' || e.key === 'J') { toggle(); e.preventDefault(); }
    else if (e.key === 'Escape' && isOpen()) close();
  });

  return { root, open, close, toggle, isOpen };
}
