// The Kerbside Exchange phone app: Dot Pennywort's board of every non-story job (the city contracts first). Each row
// shows the title, who offers it, where, the reward and its state. Tapping an open job pins its giver as the map
// waypoint. Appended to #ui, never restyling #ui itself. Lore: docs/lore/rulings.md (R-150); roadmap
// docs/roadmaps/gta-city-lore-quests.md (issue 1-7).
import type { PhoneApp } from '../phone/phone';
import { perkForQuest } from '../perks';
import { isQuestAvailable, type Quests } from '../quests/quests';
import { CITY_QUESTS } from '../quests/cityQuests';
import type { GiverDef, QuestDef, QuestSave } from '../quests/types';
import { unlockMet, unlockRule } from '../quests/unlocks';
import { clientOf } from './cityCast';
import { placeName } from './places';

export type ExchangeState = 'active' | 'open' | 'locked' | 'done';

export interface ExchangeRow {
  questId: string;
  title: string;
  giverId: string;
  who: string;
  place: string;
  reward: number;
  state: ExchangeState;
  city: boolean;
  note: string;
}

const DEFAULT_REWARD = 250;
const STATE_ORDER: Record<ExchangeState, number> = { active: 0, open: 1, locked: 2, done: 3 };
const CITY_IDS = new Set(CITY_QUESTS.map((q) => q.id));

/** The line under a row: what a locked job waits on, the perk an open or active job gives, or 'Done'. */
function noteFor(q: QuestDef, state: ExchangeState, quests: readonly QuestDef[], saves: Record<string, QuestSave>): string {
  if (state === 'done') return 'Done';
  if (state === 'locked') {
    const rule = unlockRule(q.id);
    const blockerId = rule && !unlockMet(q.id, saves) ? rule.after : q.prereq;
    if (!blockerId) return '';
    const title = quests.find((x) => x.id === blockerId)?.title ?? blockerId;
    return `After "${title}"`;
  }
  const perk = perkForQuest(q.id);
  return perk ? `Perk: ${perk.name}` : '';
}

/** Pure. Every quest without a `chapter` (side quests, city contracts, Tessie, races), sorted for the board. */
export function exchangeRows(
  quests: readonly QuestDef[],
  givers: Record<string, GiverDef>,
  saves: Record<string, QuestSave>,
  activeId: string | null,
): ExchangeRow[] {
  const rows: ExchangeRow[] = [];
  for (const q of quests) {
    if (q.chapter !== undefined) continue;
    const giver = givers[q.giver];
    let state: ExchangeState;
    if (activeId === q.id) state = 'active';
    else if (saves[q.id]?.state === 'done') state = 'done';
    else if (isQuestAvailable(q, saves)) state = 'open';
    else state = 'locked';
    rows.push({
      questId: q.id,
      title: q.title,
      giverId: q.giver,
      who: clientOf(q.id)?.name ?? giver?.name ?? q.giver,
      place: giver ? placeName(giver.x, giver.z) : '',
      reward: q.rewardAcorns ?? DEFAULT_REWARD,
      state,
      city: CITY_IDS.has(q.id),
      note: noteFor(q, state, quests, saves),
    });
  }
  rows.sort((a, b) =>
    STATE_ORDER[a.state] - STATE_ORDER[b.state] ||
    Number(b.city) - Number(a.city) ||
    a.place.localeCompare(b.place) ||
    a.title.localeCompare(b.title));
  return rows;
}

export const CITY_FIXTURE_ACHIEVEMENT = 'gta-kerbside-fixture';

/** Pure: all CITY_QUESTS are 'done' in saves. */
export function allCityDone(saves: Record<string, QuestSave>): boolean {
  return CITY_QUESTS.every((q) => saves[q.id]?.state === 'done');
}

export interface ExchangeDeps {
  ui: HTMLElement;
  phone: { addApp(app: PhoneApp): void };
  quests: Pick<Quests, 'getJournal' | 'pinGiver'>;
  hud: { toast(text: string, ms?: number): void };
  unlock(id: string): void;
}

export interface Exchange { isOpen(): boolean; open(): void; close(): void; update(dt: number): void }

const CSS = `
#gta-exchange{position:fixed;inset:0;z-index:46;display:none;align-items:center;justify-content:center;padding:calc(env(safe-area-inset-top) + 16px) calc(env(safe-area-inset-right) + 16px) calc(env(safe-area-inset-bottom) + 16px) calc(env(safe-area-inset-left) + 16px);background:rgba(8,10,14,.76);font-family:system-ui,sans-serif;color:#fff;pointer-events:auto;box-sizing:border-box;}
#gta-exchange.open{display:flex;}
#gta-exchange .ex-card{width:min(94vw,520px);max-height:84dvh;display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:14px;background:rgba(20,22,28,.96);border:2px solid rgba(255,210,63,.65);box-shadow:0 12px 36px rgba(0,0,0,.6);box-sizing:border-box;}
#gta-exchange .ex-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;}
#gta-exchange .ex-title{font-size:18px;font-weight:800;color:#ffd23f;letter-spacing:.04em;}
#gta-exchange .ex-sub{font-size:12px;opacity:.8;margin-top:2px;}
#gta-exchange .ex-close{flex:0 0 44px;width:44px;height:44px;border-radius:10px;border:0;background:rgba(255,255,255,.1);color:#fff;font-size:20px;cursor:pointer;}
#gta-exchange .ex-body{overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding-right:2px;-webkit-overflow-scrolling:touch;}
#gta-exchange .ex-h{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#ffd23f;margin-top:6px;}
#gta-exchange .ex-row{display:flex;flex-direction:column;gap:3px;width:100%;min-height:44px;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);color:#fff;font-family:inherit;text-align:left;box-sizing:border-box;}
#gta-exchange button.ex-row{cursor:pointer;touch-action:manipulation;}
#gta-exchange .ex-row.locked{opacity:.55;}
#gta-exchange .ex-row-title{font-size:14px;font-weight:800;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
#gta-exchange .ex-tag{font-size:10px;font-weight:800;padding:1px 6px;border-radius:6px;background:rgba(255,210,63,.2);color:#ffd23f;}
#gta-exchange .ex-row-sub{font-size:12px;opacity:.85;}
#gta-exchange .ex-row-meta{display:flex;justify-content:space-between;gap:8px;font-size:12px;flex-wrap:wrap;}
#gta-exchange .ex-row-meta span:first-child{color:#9ef08a;font-weight:700;}
#gta-exchange .ex-empty,#gta-exchange .ex-done{font-size:13px;opacity:.75;padding:4px 2px;}
`;

let cssInjected = false;
function injectCss(): void {
  if (cssInjected) return;
  cssInjected = true;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
}

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function installKerbsideExchange(deps: ExchangeDeps): Exchange {
  injectCss();

  const overlay = document.createElement('div');
  overlay.id = 'gta-exchange';
  overlay.innerHTML = `
    <div class="ex-card" role="dialog" aria-label="Kerbside Exchange">
      <div class="ex-head">
        <div>
          <div class="ex-title">Kerbside Exchange</div>
          <div class="ex-sub">Dot Pennywort's board · Central Bus Stop</div>
        </div>
        <button type="button" class="ex-close" aria-label="Close the Kerbside Exchange">✕</button>
      </div>
      <div class="ex-body"></div>
    </div>
  `;
  deps.ui.append(overlay);

  const body = overlay.querySelector('.ex-body') as HTMLElement;
  const closeBtn = overlay.querySelector('.ex-close') as HTMLButtonElement;
  let open = false;
  let current: ExchangeRow[] = [];

  const rowHtml = (r: ExchangeRow, tappable: boolean): string => {
    const inner = `<span class="ex-row-title">${esc(r.title)}${r.city ? '<span class="ex-tag">City</span>' : ''}</span>`
      + `<span class="ex-row-sub">${esc(r.who)} · ${esc(r.place)}</span>`
      + `<span class="ex-row-meta"><span>${r.reward} Acorns</span><span>${esc(r.note)}</span></span>`;
    return tappable
      ? `<button type="button" class="ex-row" data-quest="${esc(r.questId)}">${inner}</button>`
      : `<div class="ex-row locked">${inner}</div>`;
  };

  function section(title: string, list: ExchangeRow[], tappable: boolean): string {
    const items = list.length ? list.map((r) => rowHtml(r, tappable)).join('') : '<div class="ex-empty">None right now.</div>';
    return `<div class="ex-h">${title}</div>${items}`;
  }

  function render(): void {
    const snap = deps.quests.getJournal();
    current = exchangeRows(snap.quests, snap.givers, snap.saves, snap.activeId);
    const of = (s: ExchangeState) => current.filter((r) => r.state === s);
    const done = of('done');
    body.innerHTML = section('Active', of('active'), true)
      + section('Open', of('open'), true)
      + section('Locked', of('locked'), false)
      + `<div class="ex-h">Done</div><div class="ex-done">${done.length} of ${current.length} jobs done</div>`;
  }

  function close(): void {
    open = false;
    overlay.classList.remove('open');
  }

  function openBoard(): void {
    render();
    open = true;
    overlay.classList.add('open');
  }

  body.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button.ex-row[data-quest]');
    if (!btn) return;
    const row = current.find((r) => r.questId === btn.dataset.quest);
    if (!row) return;
    if (row.state === 'active') {
      deps.hud.toast('That job is on: follow the orange marker.');
    } else {
      deps.quests.pinGiver(row.giverId);
      deps.hud.toast(`Pinned: ${row.who} (${row.place}). Follow the route.`);
    }
    close();
  });

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', (e) => {
    if (open && e.key === 'Escape') close();
  });

  deps.phone.addApp({
    id: 'kerbside-exchange',
    label: 'Kerbside Exchange',
    icon: '📌',
    detail: () => {
      const snap = deps.quests.getJournal();
      const n = exchangeRows(snap.quests, snap.givers, snap.saves, snap.activeId).filter((r) => r.state === 'open').length;
      return `${n} open ${n === 1 ? 'job' : 'jobs'}`;
    },
    run: openBoard,
  });

  let timer = 0;
  let sent = false;

  return {
    isOpen: () => open,
    open: openBoard,
    close,
    update(dt: number): void {
      if (sent) return;
      timer += dt;
      if (timer < 2) return;
      timer = 0;
      if (allCityDone(deps.quests.getJournal().saves)) {
        sent = true;
        deps.unlock(CITY_FIXTURE_ACHIEVEMENT);
      }
    },
  };
}
