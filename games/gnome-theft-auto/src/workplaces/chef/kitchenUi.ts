// E24 chef: the kitchen screen, ticket rail and cooking flow. DOM only.
import type { CookStep, DishId, KitchenOpts, KitchenSession, StepWidget, Ticket } from './types';
import { DISHES, SAGE_LINES, ticketStars } from './menu';
import { makeStepWidget } from './stepWidgets';
import { play2d } from '../../sound/bus';

const CSS_ID = 'gta-chef-kitchen-css';
const MAX_VISIBLE = 5;
const VERDICT_WAIT = 0.6;
const END_WAIT = 1.2;

const CSS = `
#gta-chef-kitchen{position:fixed;inset:0;z-index:38;pointer-events:auto;display:flex;flex-direction:column;
  padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
  background:repeating-linear-gradient(0deg,#f6ecd2 0 38px,#efe2c0 38px 40px),#f6ecd2;color:#4a2c1a;
  font-family:system-ui,sans-serif;user-select:none;touch-action:manipulation;box-sizing:border-box}
#gta-chef-kitchen *{box-sizing:border-box}
#gta-chef-kitchen .awning{flex:none;height:14px;background:repeating-linear-gradient(90deg,#c0392b 0 28px,#fff8ea 28px 56px);
  border-bottom:3px solid #8e2a20}
#gta-chef-kitchen .hdr{flex:none;display:flex;align-items:center;gap:10px;padding:6px 10px;flex-wrap:wrap}
#gta-chef-kitchen .ttl{font-weight:800;font-size:17px;flex:1 1 auto}
#gta-chef-kitchen .rush{background:#c0392b;color:#fff;border-radius:6px;padding:2px 8px;font-weight:800;font-size:13px}
#gta-chef-kitchen .cnt{font-weight:700;font-size:16px}
#gta-chef-kitchen button{min-height:44px;min-width:44px;border:2px solid #6b3d22;border-radius:10px;background:#fff8ea;
  color:#4a2c1a;font-weight:700;font-size:15px;padding:0 14px;cursor:pointer}
#gta-chef-kitchen .body{flex:1 1 auto;min-height:0;display:flex;flex-direction:column}
#gta-chef-kitchen .rail{flex:none;display:flex;gap:8px;padding:6px 10px;overflow-x:auto;min-height:104px;align-items:flex-start}
#gta-chef-kitchen .slip{flex:none;width:132px;min-height:92px;background:#fffdf4;border:1px solid #cdbb94;border-radius:4px 4px 8px 8px;
  padding:6px 8px;font-size:13px;box-shadow:0 2px 4px #0003;cursor:pointer;
  transition:transform .35s,opacity .35s;transform:translateY(0) rotate(0)}
#gta-chef-kitchen .slip.in{transform:translateY(-120px);opacity:0}
#gta-chef-kitchen .slip.cooking{outline:3px solid #e0a020}
#gta-chef-kitchen .slip.crumple{transform:translateY(40px) rotate(18deg) scale(.3);opacity:0}
#gta-chef-kitchen .slip.fly{transform:translateY(-160px) rotate(-6deg);opacity:0;transition-duration:.6s}
#gta-chef-kitchen .slip .from{font-weight:800;margin-bottom:2px}
#gta-chef-kitchen .slip .pat{height:6px;background:#e4d8b8;border-radius:3px;margin-top:6px;overflow:hidden}
#gta-chef-kitchen .slip .pat i{display:block;height:100%;width:100%;background:#4caf50}
#gta-chef-kitchen .slip .stars{font-size:20px;text-align:center}
#gta-chef-kitchen .main{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:10px;padding:8px;overflow:auto}
#gta-chef-kitchen .stephdr{font-weight:800;font-size:18px;text-align:center}
#gta-chef-kitchen .hint{font-size:16px;opacity:.75;text-align:center}
#gta-chef-kitchen .bell{min-height:64px;font-size:22px;background:#f2b21d;border-color:#9a6a00;padding:0 28px}
@media (orientation:landscape) and (max-height:600px){
  #gta-chef-kitchen .body{flex-direction:row}
  #gta-chef-kitchen .rail{flex-direction:column;overflow-x:hidden;overflow-y:auto;min-height:0;width:156px}
  #gta-chef-kitchen .slip.in{transform:translateX(-160px)}
}`;

type Status = 'wait' | 'shown' | 'cooking' | 'done';
interface TState {
  t: Ticket;
  status: Status;
  el: HTMLElement | null;
  bar: HTMLElement | null;
}
interface Job { dish: DishId; step: CookStep; n: number; of: number }

const pick = (a: string[]): string => a[Math.floor(Math.random() * a.length)] ?? '';

/** Open the kitchen over the game (appended to ui). */
export function openKitchen(ui: HTMLElement, opts: KitchenOpts): KitchenSession {
  if (!document.getElementById(CSS_ID)) {
    const st = document.createElement('style');
    st.id = CSS_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  const root = document.createElement('div');
  root.id = 'gta-chef-kitchen';
  root.innerHTML = `<div class="awning"></div>
    <div class="hdr"><span class="ttl"></span><span class="rush" hidden>RUSH!</span><span class="cnt"></span>
    <button class="apron" type="button">Hang up apron</button></div>
    <div class="body"><div class="rail"></div><div class="main"></div></div>`;
  const q = <T extends HTMLElement>(s: string): T => root.querySelector(s) as T;
  q('.ttl').textContent = `🍳 ${opts.title} · level ${opts.level}`;
  if (opts.rush) q('.rush').hidden = false;
  const cnt = q('.cnt');
  const rail = q('.rail');
  const main = q('.main');
  ui.appendChild(root);
  root.addEventListener('pointerdown', (e) => e.stopPropagation());

  const states: TState[] = opts.tickets.map((t) => ({ t, status: 'wait', el: null, bar: null }));
  const served: { stars: number; dishes: DishId[] }[] = [];
  let walkouts = 0;
  let clock = 0;
  let open = true;
  let over = false;
  let overT = 0;

  // Cooking state.
  let cur: TState | null = null;
  let jobs: Job[] = [];
  let jobIdx = 0;
  let scores: number[] = [];
  let widget: StepWidget | null = null;
  let widgetEl: HTMLElement | null = null;
  let verdictT = -1;
  let bellBtn: HTMLButtonElement | null = null;
  let hdrEl: HTMLElement | null = null;

  const say = (s: string): void => { if (s) opts.say(s); };
  const count = (): void => { cnt.textContent = `${served.length}/${opts.tickets.length}`; };
  count();
  say(pick(SAGE_LINES.start));
  if (opts.rush) say(pick(SAGE_LINES.rush));

  const idle = (): void => {
    main.replaceChildren();
    const h = document.createElement('div');
    h.className = 'hint';
    h.textContent = states.some((s) => s.status === 'shown') ? 'Tap a ticket to start cooking.' : 'Waiting for the next ticket…';
    main.appendChild(h);
  };
  idle();

  const dropSlip = (s: TState, cls: string, ms: number): void => {
    const el = s.el;
    s.el = null; s.bar = null;
    if (!el) return;
    el.classList.add(cls);
    setTimeout(() => el.remove(), ms);
  };

  const killWidget = (): void => {
    if (widget) { try { widget.destroy(); } catch { /* ignore */ } }
    widgetEl?.remove();
    widget = null; widgetEl = null; verdictT = -1;
  };

  const abortCook = (): void => {
    killWidget();
    cur = null; jobs = []; scores = [];
    bellBtn = null; hdrEl = null;
    idle();
  };

  const startTicket = (s: TState): void => {
    if (!open || over || cur || s.status !== 'shown') return;
    cur = s; s.status = 'cooking';
    s.el?.classList.add('cooking');
    jobs = [];
    for (const id of s.t.dishes) {
      const d = DISHES[id];
      if (!d) continue;
      d.steps.forEach((step, i) => jobs.push({ dish: id, step, n: i + 1, of: d.steps.length }));
    }
    jobIdx = 0; scores = [];
    nextJob();
  };

  const showSlip = (s: TState): void => {
    const el = document.createElement('div');
    el.className = 'slip in';
    const from = document.createElement('div');
    from.className = 'from';
    from.textContent = s.t.from;
    el.appendChild(from);
    for (const id of s.t.dishes) {
      const d = DISHES[id];
      const l = document.createElement('div');
      l.textContent = d ? `${d.emoji} ${d.name}` : id;
      el.appendChild(l);
    }
    const pat = document.createElement('div');
    pat.className = 'pat';
    const bar = document.createElement('i');
    pat.appendChild(bar);
    el.appendChild(pat);
    el.addEventListener('click', () => startTicket(s));
    rail.appendChild(el);
    s.el = el; s.bar = bar; s.status = 'shown';
    play2d('chef-ticket');
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('in')));
    if (!cur) idle();
  };

  const nextJob = (): void => {
    main.replaceChildren();
    bellBtn = null;
    if (jobIdx >= jobs.length) { showBell(); return; }
    const job = jobs[jobIdx];
    const d = DISHES[job.dish];
    hdrEl = document.createElement('div');
    hdrEl.className = 'stephdr';
    hdrEl.textContent = `${d.emoji} ${d.name} · step ${job.n}/${job.of}`;
    main.appendChild(hdrEl);
    widget = makeStepWidget(job.step);
    widgetEl = widget.el;
    main.appendChild(widgetEl);
    verdictT = -1;
  };

  const showBell = (): void => {
    killWidget();
    main.replaceChildren();
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'bell';
    b.textContent = '🔔 Ring the bell';
    b.addEventListener('click', () => ring());
    main.appendChild(b);
    bellBtn = b;
  };

  const ring = (): void => {
    if (!cur || !bellBtn || !open) return;
    const s = cur;
    play2d('chef-bell');
    const waited = Math.max(0, clock - s.t.arriveAt);
    const stars = ticketStars(scores, waited, s.t.patience);
    if (s.el) {
      s.el.classList.remove('cooking');
      const st = document.createElement('div');
      st.className = 'stars';
      st.textContent = '⭐'.repeat(stars);
      s.el.appendChild(st);
    }
    dropSlip(s, 'fly', 700);
    s.status = 'done';
    served.push({ stars, dishes: [...s.t.dishes] });
    count();
    cur = null; jobs = []; scores = []; bellBtn = null;
    opts.onServe(s.t, stars);
    if (stars >= 5) say(pick(SAGE_LINES.good));
    idle();
  };

  const walkout = (s: TState): void => {
    if (cur === s) abortCook();
    dropSlip(s, 'crumple', 500);
    s.status = 'done';
    walkouts++;
    say(pick(SAGE_LINES.walkout));
  };

  const onKey = (e: KeyboardEvent): void => {
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); finish(true); return; }
    if (e.key === 'Enter' || e.key === ' ') {
      if (bellBtn) { e.preventDefault(); ring(); }
      return;
    }
    if (e.key >= '1' && e.key <= '5') {
      const shown = states.filter((s) => s.status === 'shown' || s.status === 'cooking');
      const s = shown[Number(e.key) - 1];
      if (s) startTicket(s);
    }
  };

  function finish(quit: boolean): void {
    if (!open) return;
    open = false;
    document.removeEventListener('keydown', onKey);
    killWidget();
    root.remove();
    opts.onEnd({ served: served.slice(), walkouts, quit, rush: opts.rush });
  }

  document.addEventListener('keydown', onKey);
  q('.apron').addEventListener('click', () => finish(true));

  return {
    update(dt: number) {
      if (!open) return;
      if (over) {
        overT += dt;
        if (overT >= END_WAIT) finish(false);
        return;
      }
      clock += dt;
      // Patience drains while waiting and while cooking.
      for (const s of states) {
        if (s.status === 'done' || clock < s.t.arriveAt) continue;
        const left = 1 - (clock - s.t.arriveAt) / Math.max(0.001, s.t.patience);
        if (left <= 0) { walkout(s); continue; }
        if (s.bar) {
          s.bar.style.width = `${(left * 100).toFixed(1)}%`;
          s.bar.style.background = left > 0.5 ? '#4caf50' : left > 0.25 ? '#e0a020' : '#d33a2c';
        }
      }
      // Arrivals, up to MAX_VISIBLE slips at once.
      let visible = states.filter((s) => s.status === 'shown' || s.status === 'cooking').length;
      for (const s of states) {
        if (visible >= MAX_VISIBLE) break;
        if (s.status === 'wait' && clock >= s.t.arriveAt) { showSlip(s); visible++; }
      }
      // The live widget.
      if (widget) {
        widget.update(dt);
        if (verdictT < 0) {
          const r = widget.result();
          if (r !== null) { scores.push(r); verdictT = 0; }
        } else {
          verdictT += dt;
          if (verdictT >= VERDICT_WAIT) {
            killWidget();
            hdrEl?.remove();
            jobIdx++;
            nextJob();
          }
        }
      }
      if (states.every((s) => s.status === 'done')) {
        over = true;
        overT = states.length === 0 ? END_WAIT : 0;
        if (states.length > 0) {
          main.replaceChildren();
          const h = document.createElement('div');
          h.className = 'stephdr';
          h.textContent = 'Shift over';
          main.appendChild(h);
        }
      }
    },
    isOpen: () => open,
    close() { finish(true); },
  };
}
