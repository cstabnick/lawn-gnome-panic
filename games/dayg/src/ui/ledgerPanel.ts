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

import { LORE_NOTES, getDiscoveredNotes } from '../sim/loreNotes';
import { getVisitedLandmarks, WORLD_LANDMARKS } from '../scene/worldLandmarks';
import { COLLECTIBLES, COLLECTIBLE_MILESTONES, loadCollectibles, turnInCollectibles, type CollectibleRarity } from '../sim/collectibles';
import {
  BRANCH_STORIES,
  NAMED_SURVIVORS,
  acceptStory,
  advanceStory,
  completeStory,
  dispositionTier,
  getStoryStage,
  loadStoryState,
  outcomeSummary,
  saveStoryState,
} from '../sim/survivorStories';
import { LOCAL_PLAYER } from '../sim/world';

const LEDGER_ROWS = 50;
const TABS: readonly { id: LedgerTab; label: string }[] = [
  { id: 'people', label: 'People' },
  { id: 'stories', label: 'Stories' },
  { id: 'lore', label: 'Lore' },
  { id: 'collectibles', label: 'Collectibles' },
  { id: 'factions', label: 'Factions' },
  { id: 'quests', label: 'Quests' },
  { id: 'skills', label: 'Skills' },
];
const BUTTON_CSS = 'min-height:44px;min-width:44px;padding:8px 12px;border-radius:8px;border:1px solid var(--dg-border);' +
  'background:var(--dg-surface-2);color:var(--dg-text);font:14px var(--dg-font);cursor:pointer;touch-action:manipulation;';

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
  root.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;box-sizing:border-box;z-index:55;background:var(--dg-bg);backdrop-filter:blur(6px);pointer-events:auto;' +
    'color:var(--dg-text);font:14px var(--dg-font);overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;touch-action:pan-y;' +
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
    const stories = loadStoryState();
    wrap.append(el('div', 'font:bold 14px var(--dg-font);margin:6px 0 4px;color:var(--dg-accent)', 'Persistent Survivors'));
    for (const s of NAMED_SURVIVORS) {
      const rec = stories.survivors[s.id];
      const tier = dispositionTier(rec.disposition);
      const tierCol = tier === 'Confidant' ? '#e8c35a' : tier === 'Ally' ? 'var(--dg-ok)' : tier === 'Rival' ? 'var(--dg-danger)' : tier === 'Wary' ? '#e09f5a' : 'var(--dg-muted)';
      const card = el('div', 'padding:8px 10px;margin:4px 0;border-radius:8px;background:var(--dg-surface-2);border:1px solid var(--dg-border)');
      const statusCol = rec.status === 'shattered' ? 'var(--dg-danger)' : rec.status === 'recruited' ? 'var(--dg-accent)' : 'var(--dg-ok)';
      card.append(el('div', 'font:bold 14px var(--dg-font)', `${s.name} · ${s.role}`));
      card.append(el('div', 'font:12px var(--dg-font);color:var(--dg-muted);margin:2px 0', s.blurb));
      const meta = el('div', 'font:12px var(--dg-font)');
      meta.innerHTML = `<span style="color:${statusCol};font-weight:700;text-transform:uppercase">${rec.status}</span> · <span style="color:${tierCol};font-weight:700">${tier}</span> (${rec.disposition}) · Last known: ${regionName(rec.lastRegion)}`;
      card.append(meta);
      wrap.append(card);
    }

    wrap.append(el('div', 'font:bold 14px var(--dg-font);margin:12px 0 4px;color:var(--dg-accent)', 'Region Acquaintances'));
    const rows = knownBy(w, host.me)
      .sort((a, b) => Math.abs(b.trust) - Math.abs(a.trust) || a.npc - b.npc)
      .slice(0, LEDGER_ROWS);
    if (rows.length === 0) { wrap.append(el('div', 'opacity:0.7', 'No region acquaintances yet.')); return wrap; }
    for (const r of rows) {
      const npc = w.npcs.find((n) => n.id === r.npc);
      if (!npc) continue;
      const entry = entryOf(w, npc.id, `p:${host.me}`);
      const card = el('div', 'padding:8px;margin:4px 0;border-radius:8px;background:var(--dg-surface-2)');
      card.append(el('div', 'font:bold 14px var(--dg-font)', npc.name));
      const bar = el('div', 'position:relative;height:10px;border-radius:5px;background:#333;margin:6px 0;overflow:hidden');
      const pct = Math.abs(r.trust) * 50;
      const fill = el('div', `position:absolute;top:0;bottom:0;width:${pct}%;` +
        `${r.trust >= 0 ? 'left:50%' : 'right:50%'};background:${r.trust >= 0 ? '#7fa35a' : '#c0623a'}`);
      bar.append(fill, el('div', 'position:absolute;left:50%;top:0;bottom:0;width:1px;background:#888'));
      card.append(bar);
      const debt = entry?.debt ?? 0;
      const grudge = entry?.grudge ?? null;
      card.append(el('div', 'font:13px var(--dg-font);opacity:0.85',
        `Trust ${Math.round(r.trust * 100)}  ·  Debt ${debt}  ·  Grudge ${grudge ?? 'none'}  ·  ${regionName(npc.region)}`));
      wrap.append(card);
    }
    return wrap;
  }

  function storiesBody(w: WorldState): HTMLElement {
    const wrap = el('div');
    const st = loadStoryState();
    const outcomes = outcomeSummary(st);
    const outBox = el('div', 'padding:10px;margin:6px 0 10px;border-radius:8px;background:var(--dg-surface-2);border:1px solid var(--dg-border)');
    outBox.append(el('div', 'font:bold 13px var(--dg-font);color:var(--dg-accent);margin-bottom:4px', `World Outcomes (${outcomes.length}/4 rival pairs resolved)`));
    if (outcomes.length === 0) outBox.append(el('div', 'font:12px var(--dg-font);opacity:0.75', 'Each pair is mutually exclusive. Advancing a story through Stage 3/3 locks out its rival.'));
    for (const o of outcomes) outBox.append(el('div', 'font:12px var(--dg-font);margin:2px 0', `• ${o}`));
    wrap.append(outBox);

    const pairs: [typeof BRANCH_STORIES[number], typeof BRANCH_STORIES[number]][] = [];
    for (let i = 0; i < BRANCH_STORIES.length; i += 2) {
      if (BRANCH_STORIES[i + 1]) pairs.push([BRANCH_STORIES[i], BRANCH_STORIES[i + 1]]);
    }

    pairs.forEach(([left, right], pairIdx) => {
      wrap.append(el('div', 'font:bold 12px var(--dg-font);color:var(--dg-accent);margin:10px 0 4px', `Rival Pair ${pairIdx + 1}`));
      const grid = el('div', 'display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:8px;margin-bottom:6px');
      for (const def of [left, right]) {
        const status = st.stories[def.id];
        const stage = getStoryStage(st, def.id);
        const surv = NAMED_SURVIVORS.find((x) => x.id === def.survivorId);
        const card = el('div', `padding:10px;border-radius:8px;background:var(--dg-surface-2);border:1px solid ${status === 'completed' ? 'var(--dg-ok)' : status === 'locked' ? 'var(--dg-danger)' : 'var(--dg-border)'};opacity:${status === 'locked' ? 0.58 : 1}`);
        card.append(el('div', 'font:bold 15px var(--dg-font)', `${def.title} (${surv?.name ?? def.survivorId})`));
        card.append(el('div', 'font:12px var(--dg-font);color:var(--dg-accent);margin-top:2px', `Stage ${stage}/3 · ${status.toUpperCase()}`));
        card.append(el('div', 'font:12px var(--dg-font);color:var(--dg-muted);margin:4px 0', def.summary));
        if (status === 'active' && stage > 0) {
          card.append(el('div', 'font:12px var(--dg-font);padding:6px;border-radius:6px;background:rgba(232,195,90,0.08);margin:4px 0',
            `Stage ${stage}: ${def.stages[stage - 1]}`));
        }
        const row = el('div', 'display:flex;align-items:center;gap:8px;margin-top:6px;flex-wrap:wrap');
        if (status === 'locked') {
          row.append(el('span', 'font:bold 12px var(--dg-font);color:var(--dg-danger)', 'LOCKED OUT'));
        } else if (status === 'completed') {
          row.append(el('span', 'font:bold 12px var(--dg-font);color:var(--dg-ok)', `COMPLETED (+${def.rewardAcorns} acorns)`));
        } else {
          if (status === 'available') {
            row.append(button('Accept (Stage 1/3)', () => { acceptStory(st, def.id); saveStoryState(st); render(); }));
          } else {
            row.append(button(stage < 3 ? `Advance (${stage}/3 → ${stage + 1}/3)` : `Finish Stage 3 (+${def.rewardAcorns})`, () => {
              const res = advanceStory(st, def.id);
              if (res.ok) {
                saveStoryState(st);
                if (res.completed) {
                  const rec = w.players[LOCAL_PLAYER];
                  if (rec) rec.acorns += res.rewardAcorns;
                  bus.emit('hint', { text: `${def.title} complete! +${res.rewardAcorns} acorns` });
                }
                render();
              }
            }));
          }
          row.append(button(`Complete Now (+${def.rewardAcorns})`, () => {
            const res = completeStory(st, def.id);
            if (res.ok) {
              saveStoryState(st);
              const rec = w.players[LOCAL_PLAYER];
              if (rec) rec.acorns += res.rewardAcorns;
              bus.emit('hint', { text: `${def.title} complete! +${res.rewardAcorns} acorns` });
              render();
            }
          }));
        }
        card.append(row);
        grid.append(card);
      }
      wrap.append(grid);
    });
    return wrap;
  }

  function loreBody(): HTMLElement {
    const wrap = el('div');
    const found = new Set(getDiscoveredNotes());
    const pct = LORE_NOTES.length > 0 ? Math.round((found.size / LORE_NOTES.length) * 100) : 0;
    const preFound = LORE_NOTES.filter((n) => n.era === 'pre-breakout' && found.has(n.id)).length;
    const postFound = LORE_NOTES.filter((n) => n.era === 'post-breakout' && found.has(n.id)).length;

    const visitedLm = getVisitedLandmarks().length;
    const progBox = el('div', 'padding:10px;margin:6px 0 8px;border-radius:8px;background:var(--dg-surface-2);border:1px solid var(--dg-border)');
    progBox.append(el('div', 'font:bold 14px var(--dg-font);color:var(--dg-accent)',
      `Lore Progress: ${found.size}/${LORE_NOTES.length} (${pct}%) · Pre-Breakout ${preFound} · Post-Breakout ${postFound}`));
    progBox.append(el('div', 'font:12px var(--dg-font);color:var(--dg-muted);margin-top:2px',
      `Landmarks Discovered: ${visitedLm}/${WORLD_LANDMARKS.length}`));
    const bar = el('div', 'height:8px;border-radius:4px;background:#2a3324;margin-top:6px;overflow:hidden');
    bar.append(el('div', `height:100%;width:${pct}%;background:var(--dg-accent)`));
    progBox.append(bar);
    wrap.append(progBox);

    for (const note of LORE_NOTES) {
      const has = found.has(note.id);
      const card = el('div', `padding:10px;margin:6px 0;border-radius:8px;background:var(--dg-surface-2);border:1px solid var(--dg-border);opacity:${has ? 1 : 0.6}`);
      card.append(el('div', 'font:bold 14px var(--dg-font)', `${has ? note.title : '??? (Undiscovered)'} · ${note.era === 'pre-breakout' ? 'Pre-Breakout' : 'Post-Breakout'}`));
      if (has) {
        card.append(el('div', 'font:11px var(--dg-font);color:var(--dg-accent);margin-top:2px', `Signed: ${note.author} · ${regionName(note.region)}`));
      }
      card.append(el('div', 'font:13px var(--dg-font);color:var(--dg-muted);margin-top:4px', has ? note.body : `Explore ${regionName(note.region)} to find this note.`));
      if (has && note.clue) {
        card.append(el('div', 'font:12px var(--dg-font);color:var(--dg-accent);margin-top:4px', `🧭 Clue: ${note.clue}`));
      }
      wrap.append(card);
    }
    return wrap;
  }

  function rarityColor(r: CollectibleRarity): string {
    switch (r) {
      case 'Common': return '#9eb098';
      case 'Uncommon': return '#6ec077';
      case 'Rare': return '#64a8e8';
      case 'Relic': return '#e8c35a';
    }
  }

  function collectiblesBody(w: WorldState): HTMLElement {
    const wrap = el('div');
    const save = loadCollectibles();
    const found = new Set(save.found);
    const head = el('div', 'display:flex;align-items:center;justify-content:space-between;gap:8px;margin:6px 0 8px;flex-wrap:wrap');
    head.append(el('div', 'font:bold 14px var(--dg-font);color:var(--dg-accent)', `Mossgrave Curiosities (${found.size}/${COLLECTIBLES.length})`));
    head.append(button('Turn In Collectibles', () => {
      const res = turnInCollectibles();
      if (res.acorns > 0) {
        const rec = w.players[LOCAL_PLAYER];
        if (rec) rec.acorns += res.acorns;
        bus.emit('hint', { text: `Turned in collectibles: +${res.acorns} acorns (${res.unlocked.join(', ')})` });
        render();
      } else {
        bus.emit('hint', { text: 'Find more collectibles to reach the next milestone (3 / 6 / 9 / 12 / 16).' });
      }
    }));
    wrap.append(head);

    const perkBox = el('div', 'padding:8px 10px;margin-bottom:8px;border-radius:8px;background:var(--dg-surface-2);border:1px solid var(--dg-border)');
    perkBox.append(el('div', 'font:bold 12px var(--dg-font);color:var(--dg-accent);margin-bottom:4px', 'Curio Rack Perk Checklist'));
    for (const m of COLLECTIBLE_MILESTONES) {
      const claimed = save.claimedMilestones.includes(m.count);
      const ready = found.size >= m.count && !claimed;
      const line = el('div', `font:12px var(--dg-font);color:${claimed ? 'var(--dg-ok)' : ready ? 'var(--dg-accent)' : 'var(--dg-muted)'}`,
        `${claimed ? '[CLAIMED]' : ready ? '[READY]' : '[ ]'} ${m.count}/${COLLECTIBLES.length}: ${m.title}`);
      perkBox.append(line);
    }
    wrap.append(perkBox);

    for (const c of COLLECTIBLES) {
      const has = found.has(c.id);
      const card = el('div', `padding:8px 10px;margin:4px 0;border-radius:8px;background:var(--dg-surface-2);border:1px solid var(--dg-border);opacity:${has ? 1 : 0.65}`);
      const titleRow = el('div', 'display:flex;align-items:center;justify-content:space-between;gap:8px');
      titleRow.append(el('span', 'font:bold 14px var(--dg-font)', `${has ? '★ ' : '☆ '}${c.name}`));
      titleRow.append(el('span', `font:bold 11px var(--dg-font);color:${rarityColor(c.rarity)}`, c.rarity.toUpperCase()));
      card.append(titleRow);
      card.append(el('div', 'font:12px var(--dg-font);color:var(--dg-muted)', has ? c.blurb : `Rumoured near ${regionName(c.region)}`));
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
      : tab === 'stories' ? storiesBody(w)
        : tab === 'lore' ? loreBody()
          : tab === 'collectibles' ? collectiblesBody(w)
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
