// The DOM HUD: need meters, mood and name, mode and care buttons, the trick menu, toasts and the naming dialog.
import { TRICKS, TRICK_LABEL } from './config';
import type { TrickId } from './config';
import type { Mood, Need, PetState } from './sim';

export type Mode = 'pet' | 'ball' | 'bath';

export interface UiHandlers {
  onFeed(): void;
  onWater(): void;
  onMode(mode: Mode): void;
  onTrick(trick: TrickId): void;
  onRename(name: string): void;
  onMute(muted: boolean): void;
}

export interface UiView {
  mode: Mode;
  mood: Mood;
  /** The dog is busy (eating, fetching, doing a trick): trick buttons are disabled. */
  busy: boolean;
  /** One short line telling the player what to do now, e.g. "Swipe up to throw!". */
  hint: string;
}

export interface Ui {
  /** Called every frame; must be cheap (only touch the DOM when a shown value changed). */
  update(s: PetState, view: UiView): void;
  /** A short message that fades after ~2 s, e.g. "Good dog!". */
  toast(text: string): void;
  /** Show the name-your-dog dialog; calls handlers.onRename with the trimmed name (1-16 chars). */
  askName(current: string): void;
}

const CSS = `
#pup-hud{position:absolute;inset:0;pointer-events:none;overflow:hidden;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#2b2118;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
#pup-hud button{pointer-events:auto;touch-action:manipulation;font:inherit;color:inherit;border:0;margin:0;cursor:pointer;min-width:44px;min-height:44px;box-sizing:border-box;-webkit-appearance:none;appearance:none}
#pup-hud button:disabled{opacity:.45;cursor:default}
.pup-panel{background:rgba(255,255,255,.85);border-radius:16px;box-shadow:0 4px 14px rgba(0,0,0,.18)}
#pup-status{position:absolute;left:calc(env(safe-area-inset-left,0px) + 8px);top:calc(env(safe-area-inset-top,0px) + 8px);width:min(240px,58vw);box-sizing:border-box;padding:6px 10px 8px;pointer-events:none}
#pup-name{display:block;width:100%;min-height:44px;padding:4px 8px;border-radius:12px;background:transparent;font-size:22px;font-weight:800;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#pup-name:active{background:rgba(0,0,0,.06)}
.pup-mood{font-size:14px;font-weight:600;padding:0 8px;margin-bottom:6px}
.pup-meters{display:grid;gap:5px}
.pup-meter{display:grid;grid-template-columns:76px 1fr;align-items:center;gap:6px;font-size:13px;font-weight:700}
.pup-mlabel{white-space:nowrap}
.pup-track{height:10px;border-radius:5px;background:rgba(0,0,0,.12);overflow:hidden}
.pup-fill{height:100%;width:0;border-radius:5px;transition:width .3s ease,background-color .3s}
.pup-fill.hi{background:#43a047}
.pup-fill.mid{background:#ffb300}
.pup-fill.lo{background:#e53935}
.pup-stat{font-size:13px;font-weight:700;padding:6px 8px 0}
#pup-mute{position:absolute;top:calc(env(safe-area-inset-top,0px) + 8px);right:calc(env(safe-area-inset-right,0px) + 8px);width:44px;height:44px;padding:0;border-radius:22px;font-size:22px;line-height:1;background:rgba(255,255,255,.85);box-shadow:0 4px 14px rgba(0,0,0,.18);display:flex;align-items:center;justify-content:center}
#pup-bottom{position:absolute;left:calc(env(safe-area-inset-left,0px) + 8px);right:calc(env(safe-area-inset-right,0px) + 8px);bottom:calc(env(safe-area-inset-bottom,0px) + 8px);display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none}
#pup-trick-menu{display:none;flex-wrap:wrap;justify-content:center;gap:6px;max-width:100%;box-sizing:border-box;padding:8px;pointer-events:auto}
#pup-trick-menu.open{display:flex}
.pup-trick{display:flex;align-items:center;gap:8px;padding:6px 12px;border-radius:12px;background:#fff;font-size:15px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,.12)}
.pup-trick:active{transform:scale(.97)}
.pup-pips{display:inline-flex;gap:3px}
.pup-pips i{display:block;width:8px;height:8px;border-radius:50%;background:rgba(0,0,0,.15)}
.pup-pips i.on{background:#ff8a65}
.pup-check{color:#43a047;font-weight:900;min-width:12px}
#pup-hint{font-size:15px;font-weight:700;color:#fff;text-shadow:0 1px 2px #000,0 0 6px rgba(0,0,0,.6);text-align:center;max-width:100%;padding:0 8px;pointer-events:none}
#pup-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;max-width:100%;pointer-events:none}
.pup-btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 14px;border-radius:14px;background:rgba(255,255,255,.85);box-shadow:0 4px 14px rgba(0,0,0,.18);font-size:16px;font-weight:700}
.pup-btn.on{background:#ffd54f}
.pup-btn:active{transform:scale(.96)}
.pup-ico{font-size:20px;line-height:1}
.pup-lbl{white-space:nowrap}
#pup-toast{position:absolute;left:50%;top:30%;transform:translate(-50%,-50%);max-width:86%;box-sizing:border-box;padding:10px 16px;border-radius:18px;background:rgba(255,255,255,.92);box-shadow:0 4px 14px rgba(0,0,0,.2);font-size:18px;font-weight:800;text-align:center;opacity:0;transition:opacity .4s ease;pointer-events:none}
#pup-toast.show{opacity:1}
#pup-name-dialog{position:absolute;inset:0;display:none;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;background:rgba(0,0,0,.35);pointer-events:auto}
#pup-name-dialog.open{display:flex}
.pup-card{width:min(340px,100%);box-sizing:border-box;padding:18px;text-align:center}
.pup-card-title{margin:0 0 6px;font-size:20px;font-weight:800}
#pup-name-input{display:block;width:100%;height:48px;box-sizing:border-box;margin:10px 0;padding:0 12px;border:2px solid #d7c7a8;border-radius:12px;font:inherit;font-size:18px;background:#fff;color:#2b2118;user-select:text;-webkit-user-select:text}
.pup-ok{width:100%;min-height:48px;border-radius:12px;background:#ff8a65;color:#fff;font-size:18px;font-weight:800}
@media (max-height:500px){
  #pup-status{width:min(200px,36vw);padding:4px 8px 6px}
  #pup-name{font-size:16px}
  .pup-mood{font-size:12px;margin-bottom:4px}
  .pup-meters{grid-template-columns:1fr 1fr;gap:4px 10px}
  .pup-meter{grid-template-columns:auto 1fr;gap:4px;font-size:11px}
  .pup-stat{font-size:11px;padding-top:4px}
  .pup-btn{font-size:12px;padding:6px 10px;gap:4px}
  .pup-ico{font-size:16px}
}
@media (max-width:480px){
  #pup-status{width:min(230px,60vw)}
  #pup-actions{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));width:100%;gap:4px}
  .pup-btn{flex-direction:column;gap:2px;padding:6px 2px;min-width:48px;min-height:52px;font-size:11px}
  .pup-ico{font-size:20px}
}
`;

const MOODS: Record<Mood, [string, string]> = {
  ecstatic: ['🤩', 'Over the moon'],
  happy: ['😊', 'Happy'],
  okay: ['🙂', 'Fine'],
  sad: ['😢', 'Lonely'],
  sleepy: ['😴', 'Sleepy'],
  hungry: ['🍖', 'Hungry'],
  thirsty: ['💧', 'Thirsty'],
  stinky: ['🦨', 'Stinky'],
};

const METERS: { need: Need; icon: string; label: string }[] = [
  { need: 'hunger', icon: '🍖', label: 'Food' },
  { need: 'thirst', icon: '💧', label: 'Water' },
  { need: 'fun', icon: '🎾', label: 'Fun' },
  { need: 'clean', icon: '🛁', label: 'Clean' },
  { need: 'energy', icon: '⚡', label: 'Energy' },
];

const MODES: { mode: Mode; icon: string; label: string }[] = [
  { mode: 'pet', icon: '✋', label: 'Pet' },
  { mode: 'ball', icon: '🎾', label: 'Ball' },
  { mode: 'bath', icon: '🛁', label: 'Bath' },
];

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

function mk<K extends keyof HTMLElementTagNameMap>(tag: K, id = '', cls = '', text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (id) e.id = id;
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

function button(id: string, icon: string, label: string, onClick: () => void): HTMLButtonElement {
  const b = mk('button', id, 'pup-btn');
  b.type = 'button';
  b.setAttribute('aria-label', label);
  b.append(mk('span', '', 'pup-ico', icon), mk('span', '', 'pup-lbl', label));
  b.addEventListener('click', onClick);
  return b;
}

function injectCss(): void {
  if (document.getElementById('pup-style')) return;
  const style = mk('style', 'pup-style');
  style.textContent = CSS;
  document.head.appendChild(style);
}

export function createUi(parent: HTMLElement, h: UiHandlers): Ui {
  injectCss();
  const root = mk('div', 'pup-hud');
  parent.appendChild(root);

  // Status panel: name, mood, meters, affection and fetch count.
  let currentName = '';
  const status = mk('div', 'pup-status', 'pup-panel');
  const nameBtn = mk('button', 'pup-name');
  nameBtn.type = 'button';
  nameBtn.setAttribute('aria-label', 'Rename your dog');
  nameBtn.addEventListener('click', () => askName(currentName));
  const moodEl = mk('div', '', 'pup-mood');
  const meters = mk('div', '', 'pup-meters');
  const fills: HTMLElement[] = [];
  for (const m of METERS) {
    const wrap = mk('div', `pup-meter-${m.need}`, 'pup-meter');
    const label = mk('span', '', 'pup-mlabel', `${m.icon} ${m.label}`);
    const track = mk('div', '', 'pup-track');
    const fill = mk('div', '', 'pup-fill');
    track.appendChild(fill);
    wrap.append(label, track);
    meters.appendChild(wrap);
    fills.push(fill);
  }
  const statLine = mk('div', '', 'pup-stat');
  status.append(nameBtn, moodEl, meters, statLine);

  // Mute toggle, top-right.
  let muted = false;
  const muteBtn = mk('button', 'pup-mute', '', '🔊');
  muteBtn.type = 'button';
  muteBtn.setAttribute('aria-label', 'Mute');
  muteBtn.addEventListener('click', () => {
    muted = !muted;
    muteBtn.textContent = muted ? '🔇' : '🔊';
    muteBtn.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
    h.onMute(muted);
  });

  // Bottom column: trick menu, hint line, action bar.
  const bottom = mk('div', 'pup-bottom');
  const trickMenu = mk('div', 'pup-trick-menu', 'pup-panel');
  const hint = mk('div', 'pup-hint');
  const actions = mk('div', 'pup-actions');

  const closeMenu = (): void => {
    trickMenu.classList.remove('open');
    tricksBtn.setAttribute('aria-expanded', 'false');
  };
  const toggleMenu = (): void => {
    const open = !trickMenu.classList.contains('open');
    trickMenu.classList.toggle('open', open);
    tricksBtn.setAttribute('aria-expanded', String(open));
  };

  const trickUi: { id: TrickId; btn: HTMLButtonElement; pips: HTMLElement[]; check: HTMLElement }[] = [];
  for (const t of TRICKS) {
    const btn = mk('button', `pup-trick-${t}`, 'pup-trick');
    btn.type = 'button';
    const pipsWrap = mk('span', '', 'pup-pips');
    const pips: HTMLElement[] = [];
    for (let i = 0; i < 5; i++) {
      const p = mk('i');
      pipsWrap.appendChild(p);
      pips.push(p);
    }
    const check = mk('span', '', 'pup-check');
    btn.append(mk('span', '', 'pup-tlabel', TRICK_LABEL[t]), pipsWrap, check);
    btn.addEventListener('click', () => {
      h.onTrick(t);
      closeMenu();
    });
    trickMenu.appendChild(btn);
    trickUi.push({ id: t, btn, pips, check });
  }

  const modeBtns = new Map<Mode, HTMLButtonElement>();
  for (const m of MODES) {
    const b = button(`pup-mode-${m.mode}`, m.icon, m.label, () => h.onMode(m.mode));
    modeBtns.set(m.mode, b);
    actions.appendChild(b);
  }
  actions.appendChild(button('pup-feed', '🍖', 'Feed', () => h.onFeed()));
  actions.appendChild(button('pup-water', '💧', 'Water', () => h.onWater()));
  const tricksBtn = button('pup-tricks', '⭐', 'Tricks', toggleMenu);
  tricksBtn.setAttribute('aria-expanded', 'false');
  actions.appendChild(tricksBtn);

  bottom.append(trickMenu, hint, actions);

  // Toast, centred in the upper third.
  const toastEl = mk('div', 'pup-toast');
  let toastTimer = 0;

  // Name dialog.
  const dialog = mk('div', 'pup-name-dialog');
  const card = mk('div', '', 'pup-panel pup-card');
  const input = mk('input', 'pup-name-input');
  input.type = 'text';
  input.maxLength = 16;
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('aria-label', 'Dog name');
  const ok = mk('button', 'pup-name-ok', 'pup-ok', 'OK');
  ok.type = 'button';
  card.append(mk('h2', '', 'pup-card-title', 'Name your giant pup'), input, ok);
  dialog.appendChild(card);

  root.append(status, muteBtn, bottom, toastEl, dialog);

  function askName(current: string): void {
    input.value = current;
    dialog.classList.add('open');
    input.focus();
  }

  function closeName(): void {
    dialog.classList.remove('open');
    input.blur();
  }

  function submitName(): void {
    const name = input.value.trim();
    if (name.length < 1 || name.length > 16) {
      input.focus();
      return;
    }
    closeName();
    h.onRename(name);
  }

  input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      submitName();
    } else if (e.key === 'Escape') {
      closeName();
    }
  });
  input.addEventListener('keyup', (e) => e.stopPropagation());
  input.addEventListener('keypress', (e) => e.stopPropagation());
  ok.addEventListener('click', submitName);

  // Last rendered values, so update() only touches the DOM on change.
  const last = {
    name: null as string | null,
    mood: null as Mood | null,
    meters: fills.map(() => -1),
    stat: '',
    hint: null as string | null,
    mode: null as Mode | null,
    busy: null as boolean | null,
    pips: trickUi.map(() => ''),
  };

  function toast(text: string): void {
    toastEl.textContent = text;
    toastEl.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastEl.classList.remove('show'), 2000);
  }

  return {
    update(s: PetState, view: UiView): void {
      currentName = s.name;
      if (s.name !== last.name) {
        last.name = s.name;
        nameBtn.textContent = s.name;
      }
      if (view.mood !== last.mood) {
        last.mood = view.mood;
        const [icon, text] = MOODS[view.mood];
        moodEl.textContent = `${icon} ${text}`;
      }
      METERS.forEach((m, i) => {
        const fill = fills[i];
        if (!fill) return;
        const v = Math.round(clamp(s[m.need], 0, 100));
        if (v === last.meters[i]) return;
        last.meters[i] = v;
        fill.style.width = `${v}%`;
        fill.className = `pup-fill ${v > 60 ? 'hi' : v > 30 ? 'mid' : 'lo'}`;
      });
      const stat = `${Math.round(s.affection)}|${s.fetches}`;
      if (stat !== last.stat) {
        last.stat = stat;
        statLine.textContent = `❤️ ${Math.round(s.affection)} · 🎾 ${s.fetches}`;
      }
      if (view.mode !== last.mode) {
        last.mode = view.mode;
        modeBtns.forEach((b, m) => {
          const on = m === view.mode;
          b.classList.toggle('on', on);
          b.setAttribute('aria-pressed', String(on));
        });
      }
      if (view.busy !== last.busy) {
        last.busy = view.busy;
        trickUi.forEach((t) => {
          t.btn.disabled = view.busy;
        });
      }
      if (view.hint !== last.hint) {
        last.hint = view.hint;
        hint.textContent = view.hint;
      }
      trickUi.forEach((t, i) => {
        const skill = clamp(s.tricks[t.id], 0, 1);
        const n = Math.round(skill * 5);
        const done = skill >= 1;
        const key = `${n}${done ? '!' : ''}`;
        if (key === last.pips[i]) return;
        last.pips[i] = key;
        t.pips.forEach((p, j) => p.classList.toggle('on', j < n));
        t.check.textContent = done ? '✓' : '';
      });
    },
    toast,
    askName,
  };
}
