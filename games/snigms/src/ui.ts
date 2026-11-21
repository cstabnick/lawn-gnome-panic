// The DOM HUD: clock and speed, funds, mood and need bars, mode tabs, build and furniture panels, selected-item card, careers panel, toasts.
// One container (#snigms-ui) is appended to the root; the root itself is never restyled or hidden.
import { prefabIconElement, prewarmPrefabIcons } from '@lawn/prefabs';
import { relocateItem, sellItem, setJob } from './actions';
import { ACT_BELOW, COST, CRITICAL, FLOORS, FLOOR_COLOR, FURNITURE, FURNITURE_TABS, JOBS, JOB_IDS, NEEDS, NEED_ICON, NEED_LABEL, SELL_RATIO, TRAITS } from './config';
import { dayOfWeek, formatClock, moodOf } from './sim';
import type { App, FurnitureRoom, JobId, Mode, NeedId, Rot, Speed, Tool, WallsMode, Where } from './types';
import { detectRooms, lotValue } from './world';
import type { PersonId } from './people';
import { createTownPanel } from './ui-town';

export interface Ui {
  /** Re-read app and redraw the numbers (call a few times a second and after stateChanged). */
  refresh(): void;
  toast(msg: string): void;
  /** A neighbour or the gnome speaks: shown as a line in the toast stack. */
  say(speaker: string, line: string): void;
}

export interface UiHooks {
  newGame(): void;
  suggestChat(id: PersonId): void;
  suggestTrip(to: Where): void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DIRS = ['south', 'west', 'north', 'east']; // by Rot: 0 faces +z (south), then quarter turns clockwise
const MODE_LABEL: Record<Mode, string> = { live: 'Live', build: 'Build', furnish: 'Furnish' };
const MODES: Mode[] = ['live', 'build', 'furnish'];
const SPEED_LABEL = ['Pause', '1x', '2x', '3x'];
const WALLS_NEXT: Record<WallsMode, WallsMode> = { up: 'cut', cut: 'down', down: 'up' };
const LEVEL_CLASSES = ['snu-lv-good', 'snu-lv-warn', 'snu-lv-bad'];

const CSS = `
#snigms-ui{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;pointer-events:none;
  font:14px/1.3 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#f4f1e6;box-sizing:border-box;
  padding:max(8px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left));}
#snigms-ui .snu-box{background:rgba(24,34,22,.8);border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.35);pointer-events:auto;box-sizing:border-box;}
#snigms-ui .snu-top{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;padding:6px 8px;}
#snigms-ui .snu-name{font-weight:700;max-width:40vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
#snigms-ui .snu-clock{font-size:13px;opacity:.9;white-space:nowrap;}
#snigms-ui .snu-funds{font-weight:700;white-space:nowrap;}
#snigms-ui .snu-neg{color:#ff7b6b;}
#snigms-ui .snu-speeds{display:flex;flex-wrap:wrap;gap:4px;margin-left:auto;justify-content:flex-end;}
#snigms-ui .snu-mid{flex:1;position:relative;min-height:0;pointer-events:none;}
#snigms-ui .snu-gnome{position:absolute;top:0;left:0;width:min(250px,58vw);padding:6px 8px;font-size:13px;}
#snigms-ui .snu-ghead{display:flex;align-items:center;gap:6px;}
#snigms-ui .snu-gname{font-weight:700;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
#snigms-ui .snu-trait{opacity:.8;font-size:12px;white-space:nowrap;}
#snigms-ui .snu-collapsed .snu-gbody{display:none;}
#snigms-ui .snu-mood{display:flex;align-items:center;gap:6px;margin:6px 0 4px;}
#snigms-ui .snu-face{font-size:20px;width:26px;text-align:center;}
#snigms-ui .snu-need{display:flex;align-items:center;gap:6px;margin:4px 0;}
#snigms-ui .snu-ico{width:20px;text-align:center;}
#snigms-ui .snu-nlabel{width:62px;}
#snigms-ui .snu-val{width:26px;text-align:right;font-size:12px;opacity:.85;}
#snigms-ui .snu-bar{height:10px;flex:1;background:rgba(255,255,255,.15);border-radius:5px;overflow:hidden;}
#snigms-ui .snu-fill{height:100%;width:0;border-radius:5px;transition:width .25s;background:#7cc24a;}
#snigms-ui .snu-lv-good{background:#7cc24a;}
#snigms-ui .snu-lv-warn{background:#e8b04a;}
#snigms-ui .snu-lv-bad{background:#e0584a;}
#snigms-ui .snu-activity{margin-top:6px;font-size:13px;}
#snigms-ui .snu-jobline{font-size:13px;}
#snigms-ui .snu-toasts{position:absolute;top:0;left:50%;transform:translateX(-50%);width:max-content;max-width:92%;
  display:flex;flex-direction:column;align-items:center;gap:4px;pointer-events:none;}
#snigms-ui .snu-toast{background:rgba(24,34,22,.94);padding:8px 12px;border-radius:8px;font-size:14px;transition:opacity .4s;text-align:center;}
#snigms-ui .snu-toast.snu-out{opacity:0;}
#snigms-ui .snu-bottom{display:flex;flex-direction:column;gap:6px;}
#snigms-ui .snu-panel{padding:8px;max-height:42vh;overflow-y:auto;}
#snigms-ui .snu-phead{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;font-weight:700;}
#snigms-ui .snu-row{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px;-webkit-overflow-scrolling:touch;}
#snigms-ui .snu-small{font-size:13px;opacity:.9;}
#snigms-ui .snu-btn{min-height:44px;min-width:44px;padding:6px 10px;border:0;border-radius:8px;background:#3b5a34;color:#f4f1e6;
  font:inherit;cursor:pointer;touch-action:manipulation;flex:none;}
#snigms-ui .snu-btn.snu-active{background:#8fbf4a;color:#11200c;}
#snigms-ui .snu-btn:disabled{opacity:.45;cursor:default;}
#snigms-ui .snu-tool{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;}
#snigms-ui .snu-off{opacity:.45;}
#snigms-ui .snu-swatch{width:44px;height:44px;border-radius:8px;border:3px solid transparent;flex:none;cursor:pointer;touch-action:manipulation;}
#snigms-ui .snu-swatch.snu-active{border-color:#fff;}
#snigms-ui .snu-tabs{display:flex;gap:6px;overflow-x:auto;margin-bottom:6px;padding-bottom:2px;}
#snigms-ui .snu-cards{align-items:stretch;}
#snigms-ui .snu-card{width:96px;flex:none;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:4px;padding:6px;
  border:0;border-radius:8px;background:rgba(255,255,255,.08);color:inherit;font:inherit;cursor:pointer;touch-action:manipulation;min-height:44px;}
#snigms-ui .snu-card.snu-active{outline:2px solid #8fbf4a;}
#snigms-ui .snu-card img,#snigms-ui .snu-card canvas{width:40px;height:40px;}
#snigms-ui .snu-cardname{font-size:13px;text-align:center;line-height:1.15;}
#snigms-ui .snu-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;align-items:center;}
#snigms-ui .snu-house{font-size:13px;opacity:.9;margin-top:6px;}
#snigms-ui .snu-selected{display:flex;flex-direction:column;gap:4px;}
#snigms-ui .snu-selname{font-weight:700;}
#snigms-ui .snu-job-card{width:250px;flex:none;display:flex;flex-direction:column;gap:4px;padding:8px;border-radius:8px;background:rgba(255,255,255,.08);}
#snigms-ui .snu-job-card.snu-current{outline:2px solid #8fbf4a;}
#snigms-ui .snu-jobname{font-weight:700;}
#snigms-ui .snu-modes{display:flex;gap:6px;padding:6px;}
#snigms-ui .snu-modes .snu-btn{flex:1;}
#snigms-ui .snu-menu-wrap{position:relative;}
#snigms-ui .snu-menu{position:absolute;right:0;top:100%;margin-top:4px;padding:6px;background:rgba(24,34,22,.97);border-radius:8px;z-index:2;}
#snigms-ui .snu-hidden{display:none !important;}
@media (max-height:500px){#snigms-ui .snu-panel{max-height:50vh;}}
`;

function injectStyle(): void {
  if (document.getElementById('snigms-ui-style')) return;
  const style = document.createElement('style');
  style.id = 'snigms-ui-style';
  style.textContent = CSS;
  document.head.append(style);
}

/** Small DOM builder: props set text, title and a click handler; kids are appended in order. */
function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: { cls?: string; text?: string; title?: string; onClick?: () => void } = {},
  kids: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (props.cls) node.className = props.cls;
  if (props.text !== undefined) node.textContent = props.text;
  if (props.title) node.title = props.title;
  if (props.onClick) node.addEventListener('click', props.onClick);
  node.append(...kids);
  return node;
}

function btn(label: string, onClick: () => void, cls = '', title?: string): HTMLButtonElement {
  return el('button', { cls: `snu-btn ${cls}`.trim(), text: label, title, onClick });
}

/** Writes only when the text differs, so a 4 Hz refresh does not touch the DOM needlessly. */
function setText(node: Element, text: string): void {
  if (node.textContent !== text) node.textContent = text;
}

function setOn(node: Element, cls: string, on: boolean): void {
  node.classList.toggle(cls, on);
}

function setLevel(node: HTMLElement, level: 'good' | 'warn' | 'bad'): void {
  for (const c of LEVEL_CLASSES) setOn(node, c, c === `snu-lv-${level}`);
}

function setWidth(node: HTMLElement, pct: number): void {
  const w = `${Math.max(0, Math.min(100, Math.round(pct)))}%`;
  if (node.style.width !== w) node.style.width = w;
}

function hex(n: number): string {
  return `#${n.toString(16).padStart(6, '0')}`;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function createUi(root: HTMLElement, app: App, hooks: UiHooks): Ui {
  injectStyle();
  // Icons for every catalogue piece are rendered in idle slices so the furnish panel opens instantly.
  prewarmPrefabIcons(Object.values(FURNITURE).map((d) => d.prefab));

  let careersOpen = false;
  // ?panel=town opens the Town panel on load (demos and smoke checks).
  let townOpen = new URLSearchParams(location.search).get('panel') === 'town';
  let furnTab: FurnitureRoom = 'bedroom';
  let shownSel: number | null = null;
  let gCollapsed = window.innerWidth < 700 || window.innerHeight < 500;

  // ---- top bar ----
  const householdName = el('span', { cls: 'snu-name' });
  const clockEl = el('span', { cls: 'snu-clock' });
  const fundsEl = el('span', { cls: 'snu-funds' });
  const speedBtns = SPEED_LABEL.map((label, i) =>
    btn(label, () => {
      app.speed = i as Speed;
      refresh();
    }, 'snu-speed', `Speed ${label}`),
  );
  const menu = el('div', { cls: 'snu-menu snu-hidden' }, [
    btn('New household', () => {
      menu.classList.add('snu-hidden');
      if (window.confirm('Start a new household? This one will be deleted.')) hooks.newGame();
    }),
  ]);
  const menuWrap = el('div', { cls: 'snu-menu-wrap' }, [
    btn('Menu', () => menu.classList.toggle('snu-hidden'), '', 'Menu'),
    menu,
  ]);
  const topBar = el('div', { cls: 'snu-box snu-top' }, [
    householdName,
    clockEl,
    fundsEl,
    el('div', { cls: 'snu-speeds' }, speedBtns),
    menuWrap,
  ]);

  // ---- gnome card ----
  const gName = el('span', { cls: 'snu-gname' });
  const gTrait = el('span', { cls: 'snu-trait' });
  const collapseBtn = btn('', () => {
    gCollapsed = !gCollapsed;
    refreshCollapse();
  }, '', 'Show or hide the gnome card');
  const moodFace = el('span', { cls: 'snu-face' });
  const moodLabel = el('span', {});
  const moodFill = el('div', { cls: 'snu-fill' });
  const needRows = NEEDS.map((n: NeedId) => {
    const fill = el('div', { cls: 'snu-fill' });
    const val = el('span', { cls: 'snu-val' });
    const row = el('div', { cls: 'snu-need' }, [
      el('span', { cls: 'snu-ico', text: NEED_ICON[n] }),
      el('span', { cls: 'snu-nlabel', text: NEED_LABEL[n] }),
      el('div', { cls: 'snu-bar' }, [fill]),
      val,
    ]);
    return { n, fill, val, row };
  });
  const activityEl = el('div', { cls: 'snu-activity' });
  const jobEl = el('div', { cls: 'snu-jobline' });
  const jobProgEl = el('div', { cls: 'snu-small' });
  const gBody = el('div', { cls: 'snu-gbody' }, [
    el('div', { cls: 'snu-mood' }, [moodFace, el('div', { cls: 'snu-bar' }, [moodFill]), moodLabel]),
    ...needRows.map((r) => r.row),
    activityEl,
    jobEl,
    jobProgEl,
  ]);
  // The town toggle sits on the gnome card (not the mode bar: five mode buttons do not fit a phone).
  const townBtn = btn('🏘', () => {
    townOpen = !townOpen;
    refresh();
  }, '', 'Town and neighbours');
  const gnomeCard = el('div', { cls: 'snu-box snu-gnome' }, [
    el('div', { cls: 'snu-ghead' }, [gName, gTrait, townBtn, collapseBtn]),
    gBody,
  ]);
  const toastStack = el('div', { cls: 'snu-toasts' });
  const mid = el('div', { cls: 'snu-mid' }, [gnomeCard, toastStack]);

  // ---- careers panel (live mode) ----
  const jobEls = JOB_IDS.map((id: JobId) => {
    const job = JOBS[id];
    const prog = el('div', { cls: 'snu-small' });
    const actionBtn = btn('Take job', () => onJobButton(id), 'snu-wide');
    const card = el('div', { cls: 'snu-job-card' }, [
      el('div', { cls: 'snu-jobname', text: job.name }),
      el('div', { cls: 'snu-small', text: job.blurb }),
      el('div', {
        cls: 'snu-small',
        text: `Starts ${pad2(job.startHour)}:00 · ${job.hours} h shifts · ${job.workdays.map((d) => DAYS[d]).join(' ')}`,
      }),
      el('div', { cls: 'snu-small', text: job.levels.map((l) => `${l.title} (🌰${l.pay})`).join(' → ') }),
      prog,
      actionBtn,
    ]);
    return { id, card, prog, actionBtn };
  });
  const careersBox = el('div', { cls: 'snu-box snu-panel snu-hidden' }, [
    el('div', { cls: 'snu-phead' }, [
      el('span', { text: 'Careers' }),
      btn('Close', () => {
        careersOpen = false;
        refresh();
      }, '', 'Close careers'),
    ]),
    el('div', { cls: 'snu-row' }, jobEls.map((j) => j.card)),
  ]);

  // ---- build panel ----
  const TOOLS: { tool: Tool; label: string; cost: string }[] = [
    { tool: 'wall', label: 'Wall', cost: `🌰${COST.wall} each` },
    { tool: 'door', label: 'Door', cost: `🌰${COST.door}` },
    { tool: 'window', label: 'Window', cost: `🌰${COST.window}` },
    { tool: 'floor', label: 'Floor', cost: `🌰${COST.floor} a tile` },
    { tool: 'erase', label: 'Erase', cost: `refund ${Math.round(SELL_RATIO * 100)}%` },
  ];
  const toolBtns = TOOLS.map((t) => ({
    tool: t.tool,
    b: btn('', () => {
      app.tool = { tool: t.tool, kind: null, floor: app.tool.floor, rot: app.tool.rot };
      app.selected = null;
      refresh();
    }, 'snu-tool'),
    label: t.label,
    cost: t.cost,
  }));
  toolBtns.forEach((t) => {
    t.b.append(el('span', { text: t.label }), el('span', { cls: 'snu-small', text: t.cost }));
  });
  const floorBtns = FLOORS.map((f) =>
    el('button', {
      cls: 'snu-swatch',
      title: f,
      onClick: () => {
        app.tool = { tool: 'floor', kind: null, floor: f, rot: app.tool.rot };
        app.selected = null;
        refresh();
      },
    }),
  );
  floorBtns.forEach((b, i) => {
    b.style.background = hex(FLOOR_COLOR[FLOORS[i]]);
  });
  const floorRow = el('div', { cls: 'snu-row snu-hidden' }, floorBtns);
  const wallsBtn = btn('', () => {
    app.walls = WALLS_NEXT[app.walls];
    app.lotChanged();
    refresh();
  }, '', 'Cycle how walls are drawn');
  const buildBox = el('div', { cls: 'snu-box snu-panel snu-hidden' }, [
    el('div', { cls: 'snu-phead', text: 'Build' }),
    el('div', { cls: 'snu-row' }, [...toolBtns.map((t) => t.b), wallsBtn]),
    floorRow,
  ]);

  // ---- furnish panel ----
  const tabBtns = FURNITURE_TABS.map((t) =>
    btn(t.charAt(0).toUpperCase() + t.slice(1), () => {
      furnTab = t;
      buildCards();
      refresh();
    }, 'snu-tab'),
  );
  const cardRow = el('div', { cls: 'snu-row snu-cards' });
  let cards: { kind: string; price: number; el: HTMLButtonElement }[] = [];
  function buildCards(): void {
    cardRow.replaceChildren();
    cards = [];
    for (const def of Object.values(FURNITURE).filter((d) => d.room === furnTab)) {
      const card = el('button', {
        cls: 'snu-card',
        title: def.name,
        onClick: () => {
          app.tool = { tool: 'place', kind: def.kind, floor: app.tool.floor, rot: app.tool.rot };
          app.selected = null;
          refresh();
        },
      }, [
        prefabIconElement(def.prefab, '🪑', 40),
        el('span', { cls: 'snu-cardname', text: def.name }),
        el('span', { cls: 'snu-small', text: `🌰${def.price}` }),
      ]);
      cards.push({ kind: def.kind, price: def.price, el: card });
      cardRow.append(card);
    }
  }
  const turnBtn = btn('', () => {
    app.tool = { ...app.tool, rot: ((app.tool.rot + 1) % 4) as Rot };
    refresh();
  }, '', 'Turn the next piece');
  const eraseBtn = btn('Erase', () => {
    app.tool = { tool: 'erase', kind: null, floor: app.tool.floor, rot: app.tool.rot };
    app.selected = null;
    refresh();
  });
  const houseEl = el('div', { cls: 'snu-house' });
  const selName = el('div', { cls: 'snu-selname' });
  const selVerb = el('div', { cls: 'snu-small' });
  const selRaises = el('div', { cls: 'snu-small' });
  const selTurn = btn('Turn', () => {
    const item = app.h.lot.items.find((i) => i.id === app.selected);
    if (!item) return;
    relocateItem(app, item.id, item.tx, item.ty, ((item.rot + 1) % 4) as Rot);
    refresh();
  });
  const selSell = btn('Sell', () => {
    if (app.selected === null) return;
    sellItem(app, app.selected);
    refresh();
  });
  const selBox = el('div', { cls: 'snu-box snu-panel snu-selected snu-hidden' }, [
    selName,
    selVerb,
    selRaises,
    el('div', { cls: 'snu-actions' }, [selTurn, selSell]),
  ]);
  const furnBox = el('div', { cls: 'snu-box snu-panel snu-hidden' }, [
    el('div', { cls: 'snu-tabs' }, tabBtns),
    cardRow,
    el('div', { cls: 'snu-actions' }, [turnBtn, eraseBtn]),
    houseEl,
  ]);

  // ---- mode bar ----
  const modeBtns = MODES.map((m) => ({
    m,
    b: btn(MODE_LABEL[m], () => setMode(m), 'snu-tab'),
  }));
  const careersBtn = btn('💼 Careers', () => {
    careersOpen = !careersOpen;
    refresh();
  }, 'snu-tab');
  const townPanel = createTownPanel(app, { suggestChat: hooks.suggestChat, suggestTrip: hooks.suggestTrip });
  const modeBar = el('div', { cls: 'snu-box snu-modes' }, [...modeBtns.map((m) => m.b), careersBtn]);

  const bottom = el('div', { cls: 'snu-bottom' }, [townPanel.el, careersBox, buildBox, selBox, furnBox, modeBar]);

  const container = el('div', {});
  container.id = 'snigms-ui';
  container.append(topBar, mid, bottom);
  root.append(container);

  // ---- actions ----
  function setMode(m: Mode): void {
    // Build and furnish edit the home lot only: while the gnome is out, the town is on screen.
    if (m !== 'live' && app.h.gnome.where !== 'home') {
      toast('Build and furnish at home');
      return;
    }
    app.mode = m;
    app.tool = { tool: 'select', kind: null, floor: app.tool.floor, rot: app.tool.rot };
    app.selected = null;
    if (m !== 'live') careersOpen = false;
    refresh();
  }

  function toast(msg: string): void {
    const t = el('div', { cls: 'snu-toast', text: msg });
    toastStack.append(t);
    while (toastStack.childElementCount > 3) toastStack.firstElementChild?.remove();
    window.setTimeout(() => {
      t.classList.add('snu-out');
      window.setTimeout(() => t.remove(), 400);
    }, 3000);
  }

  function onJobButton(id: JobId): void {
    const cur = app.h.gnome.job;
    if (cur === id) {
      if (!window.confirm(`Quit ${JOBS[id].name}? Your rank there resets.`)) return;
      setJob(app.h, null);
      app.stateChanged();
      toast(`You quit as a ${JOBS[id].name}.`);
    } else {
      if (cur && !window.confirm(`Leave ${JOBS[cur].name} for ${JOBS[id].name}? Your rank there resets.`)) return;
      setJob(app.h, id);
      app.stateChanged();
      toast(`You are now a ${JOBS[id].name}.`);
    }
    refresh();
  }

  function rankText(job: JobId, level: number, shifts: number): string {
    const lvl = JOBS[job].levels[level];
    if (!lvl) return '';
    const next = JOBS[job].levels[level + 1];
    if (!next) return `${lvl.title} · top rank`;
    return `${lvl.title} · ${shifts}/${lvl.shiftsToPromote} shifts to ${next.title}`;
  }

  // ---- refresh ----
  function refreshCollapse(): void {
    setOn(gnomeCard, 'snu-collapsed', gCollapsed);
    setText(collapseBtn, gCollapsed ? '▴' : '▾');
  }

  function refreshGnome(): void {
    const g = app.h.gnome;
    setText(gName, g.name);
    setText(gTrait, TRAITS[g.trait].name);
    const mood = Math.round(moodOf(g.needs));
    setText(moodFace, mood >= 70 ? '😊' : mood >= 40 ? '😐' : '😣');
    setText(moodLabel, `${mood >= 70 ? 'Happy' : mood >= 40 ? 'Okay' : 'Unhappy'} · ${mood}`);
    setWidth(moodFill, mood);
    setLevel(moodFill, mood >= 70 ? 'good' : mood >= 40 ? 'warn' : 'bad');
    for (const r of needRows) {
      const v = Math.round(g.needs[r.n]);
      setWidth(r.fill, v);
      setLevel(r.fill, v < CRITICAL ? 'bad' : v < ACT_BELOW ? 'warn' : 'good');
      setText(r.val, String(v));
    }
    setText(activityEl, app.activity || 'Idle');
    if (g.job) {
      const lvl = JOBS[g.job].levels[g.jobLevel];
      setText(jobEl, `${JOBS[g.job].name}${lvl ? ` · ${lvl.title}` : ''}`);
      setText(jobProgEl, rankText(g.job, g.jobLevel, g.shifts));
    } else {
      setText(jobEl, 'Unemployed');
      setText(jobProgEl, '');
    }
  }

  function refreshCareers(): void {
    const g = app.h.gnome;
    for (const j of jobEls) {
      const cur = g.job === j.id;
      setOn(j.card, 'snu-current', cur);
      setText(j.prog, cur ? rankText(j.id, g.jobLevel, g.shifts) : '');
      setText(j.actionBtn, cur ? 'Quit job' : 'Take job');
    }
  }

  function refreshBuild(): void {
    for (const t of toolBtns) setOn(t.b, 'snu-active', app.tool.tool === t.tool);
    setOn(floorRow, 'snu-hidden', app.tool.tool !== 'floor');
    FLOORS.forEach((f, i) => setOn(floorBtns[i], 'snu-active', app.tool.tool === 'floor' && app.tool.floor === f));
    setText(wallsBtn, `Walls: ${app.walls}`);
  }

  function refreshSelected(): void {
    const item = app.mode === 'furnish' && app.selected !== null ? app.h.lot.items.find((i) => i.id === app.selected) : undefined;
    const def = item ? FURNITURE[item.kind] : undefined;
    const show = !!item && !!def;
    setOn(selBox, 'snu-hidden', !show);
    if (!item || !def) {
      shownSel = null;
      return;
    }
    if (shownSel !== item.id) {
      shownSel = item.id;
      setText(selName, def.name);
      setText(selVerb, def.use ? def.use.verb : 'Just decor.');
      const raises = def.use
        ? Object.entries(def.use.rates)
            .filter(([, v]) => (v ?? 0) > 0)
            .map(([k]) => NEED_LABEL[k as NeedId])
        : [];
      setText(selRaises, raises.length ? `Raises: ${raises.join(', ')}` : '');
      setText(selTurn, 'Turn');
    }
    setText(selSell, `Sell (+🌰${Math.round(def.price * SELL_RATIO)})`);
  }

  function refreshFurnish(): void {
    FURNITURE_TABS.forEach((t, i) => setOn(tabBtns[i], 'snu-active', t === furnTab));
    for (const c of cards) {
      setOn(c.el, 'snu-active', app.tool.tool === 'place' && app.tool.kind === c.kind);
      setOn(c.el, 'snu-off', app.h.funds < c.price);
    }
    setOn(eraseBtn, 'snu-active', app.tool.tool === 'erase');
    setText(turnBtn, `Turn: facing ${DIRS[app.tool.rot]}`);
    const rooms = detectRooms(app.h.lot).filter((r) => r.enclosed && r.kind !== 'empty');
    const roomText =
      rooms.length === 0 ? 'No rooms yet' : `${rooms.length} room${rooms.length === 1 ? '' : 's'}: ${rooms.map((r) => r.kind).join(', ')}`;
    setText(houseEl, `House worth 🌰${lotValue(app.h.lot)} · ${roomText}`);
    refreshSelected();
  }

  function refresh(): void {
    const hh = app.h;
    setText(householdName, hh.name);
    setText(clockEl, `${DAYS[dayOfWeek(hh.clock)]} · ${formatClock(hh.clock)}`);
    setText(fundsEl, `🌰 ${hh.funds}`);
    setOn(fundsEl, 'snu-neg', hh.funds < 0);
    speedBtns.forEach((b, i) => setOn(b, 'snu-active', app.speed === i));
    for (const m of modeBtns) setOn(m.b, 'snu-active', app.mode === m.m);
    setOn(careersBtn, 'snu-hidden', app.mode !== 'live');
    setOn(careersBtn, 'snu-active', careersOpen);
    setOn(careersBox, 'snu-hidden', !(app.mode === 'live' && careersOpen));
    setOn(townBtn, 'snu-hidden', app.mode !== 'live');
    setOn(townBtn, 'snu-active', townOpen);
    setOn(townPanel.el, 'snu-hidden', !(app.mode === 'live' && townOpen));
    if (app.mode === 'live' && townOpen) townPanel.refresh();
    setOn(buildBox, 'snu-hidden', app.mode !== 'build');
    setOn(furnBox, 'snu-hidden', app.mode !== 'furnish');
    refreshCollapse();
    refreshGnome();
    if (app.mode === 'build') refreshBuild();
    if (app.mode === 'furnish') refreshFurnish();
    else setOn(selBox, 'snu-hidden', true);
    if (app.mode === 'live' && careersOpen) refreshCareers();
    refreshSelected();
  }

  buildCards();
  refresh();

  return { refresh, toast, say: (speaker: string, line: string) => toast(`${speaker}: ${line}`) };
}
