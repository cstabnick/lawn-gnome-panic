// The town panel: where the gnome is and how it feels, a trip button, today's schedule, and the neighbours with a friendship
// bar and a "say hello" suggestion. Everything the gnome does on this panel is a suggestion (see brain.ts).
import { JOBS, TOWN_CLOSE_HOUR, TOWN_OPEN_HOUR } from './config';
import { PEOPLE, spotAt, type PersonId } from './people';
import { friendLevel, friendshipOf, isCrashed, isWorkDay, minuteOfDay } from './sim';
import { townSpotLabel } from './town';
import type { App, Where } from './types';

export interface TownPanel {
  el: HTMLElement;
  refresh(): void;
}

export interface TownActions {
  suggestChat(id: PersonId): void;
  suggestTrip(to: Where): void;
}

const CSS = `
#snigms-ui .snu-town-row{display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid rgba(255,255,255,.1);}
#snigms-ui .snu-town-name{font-weight:700;}
#snigms-ui .snu-town-where{font-size:12px;opacity:.85;}
#snigms-ui .snu-town-info{flex:1;min-width:0;}
#snigms-ui .snu-town-bar{height:6px;background:rgba(255,255,255,.15);border-radius:3px;overflow:hidden;margin-top:3px;}
#snigms-ui .snu-town-fill{height:100%;width:0;background:#e8a0c4;}
#snigms-ui .snu-town-btn{min-height:44px;min-width:44px;padding:6px 10px;border-radius:8px;border:0;background:#3b5a34;color:#f4f1e6;font:inherit;cursor:pointer;}
#snigms-ui .snu-town-btn:disabled{opacity:.45;cursor:default;}
#snigms-ui .snu-town-sched{font-size:13px;margin:4px 0 2px;}
`;

let styled = false;
function injectStyle(): void {
  if (styled) return;
  styled = true;
  const s = document.createElement('style');
  s.id = 'snigms-town-style';
  s.textContent = CSS;
  document.head.append(s);
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text?: string): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

export function createTownPanel(app: App, actions: TownActions): TownPanel {
  injectStyle();
  const box = el('div', 'snu-box snu-panel snu-hidden');
  const head = el('div', 'snu-phead');
  head.append(el('span', '', 'Town and neighbours'));
  const statusEl = el('div', 'snu-small');
  const moodEl = el('div', 'snu-small');
  const tripBtn = el('button', 'snu-town-btn');
  tripBtn.type = 'button';
  const schedEl = el('div', 'snu-town-sched');
  const list = el('div', '');
  const rows = PEOPLE.map((p) => {
    const info = el('div', 'snu-town-info');
    const name = el('div', 'snu-town-name', p.name);
    const where = el('div', 'snu-town-where');
    const bar = el('div', 'snu-town-bar');
    const fill = el('div', 'snu-town-fill');
    bar.append(fill);
    info.append(name, where, bar);
    const hello = el('button', 'snu-town-btn', 'Say hello');
    hello.type = 'button';
    hello.addEventListener('click', () => actions.suggestChat(p.id));
    const row = el('div', 'snu-town-row');
    row.append(info, hello);
    list.append(row);
    return { id: p.id, name: p.name, where, fill, hello, row, role: p.role };
  });
  tripBtn.addEventListener('click', () => actions.suggestTrip(app.h.gnome.where === 'home' ? 'town' : 'home'));
  box.append(head, statusEl, moodEl, tripBtn, el('div', 'snu-small', "Today's plans"), schedEl, list);

  function refresh(): void {
    const g = app.h.gnome;
    const m = minuteOfDay(app.h.clock);
    const onRoad = g.trip !== null;
    statusEl.textContent = onRoad
      ? g.trip?.to === 'town' ? 'On the road to town.' : 'On the road home.'
      : g.where === 'town' ? 'You are in town.' : 'You are at home.';
    const mood = isCrashed(g) ? 'Having a moment. Not listening.' : g.temper < 35 ? 'Stewing. Might ignore you.' : 'Calm.';
    moodEl.textContent = `Mood: ${mood}`;
    tripBtn.textContent = g.where === 'home' ? 'Ask to go to town' : 'Ask to head home';
    tripBtn.disabled = onRoad;

    const lines: string[] = [];
    if (g.job) {
      const job = JOBS[g.job];
      lines.push(isWorkDay(app.h) ? `Work: ${job.name}, ${pad2(job.startHour)}:00` : `${job.name} is off today`);
    } else {
      lines.push('No job');
    }
    lines.push(`Evening out: ${pad2(TOWN_OPEN_HOUR)}:00 to ${pad2(TOWN_CLOSE_HOUR)}:00 (once a day)`);
    schedEl.textContent = lines.join(' · ');

    for (const r of rows) {
      const spot = spotAt(PEOPLE.find((p) => p.id === r.id)!, m);
      const n = friendshipOf(g, r.id);
      r.where.textContent = `${friendLevel(n)} · ${r.role} · ${g.where === 'town' ? townSpotLabel(spot) : 'in town'}`;
      r.fill.style.width = `${n}%`;
      r.hello.disabled = g.where !== 'town' || onRoad;
    }
  }

  return { el: box, refresh };
}
