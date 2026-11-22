// The Final Collectathon: the whole DOM overlay. Counters, goal line, dialogue, choices, toasts, title cards, fade,
// credits, Chapter 1's Skip button, mute, and Chapter 4's overflowing counters. Appends div#fc-hud to the shared #ui.
import { SPEAKERS } from './config';
import type { CounterRow, Hud, ItemKind, Speaker } from './types';

const MUTE_KEY = 'final-collectathon.muted';
const TYPE_CPS = 40;
const TOAST_MS = 2600;
const MAX_TOASTS = 4;

const CSS = `
#fc-hud { position: fixed; inset: 0; z-index: 20; pointer-events: none; font-family: system-ui, sans-serif; color: #2b2b33;
  -webkit-user-select: none; user-select: none; -webkit-tap-highlight-color: transparent; overflow: hidden; }
#fc-hud .fc-panel { background: #fffaf0; border: 2px solid #2b2b33; border-radius: 10px;
  box-shadow: 0 4px 0 rgba(43,43,51,.18), 0 8px 22px rgba(0,0,0,.18); }
#fc-hud button { font: inherit; font-weight: 800; color: #2b2b33; background: #fffaf0; border: 2px solid #2b2b33;
  border-radius: 10px; box-shadow: 0 3px 0 rgba(43,43,51,.25); cursor: pointer; pointer-events: auto;
  touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
#fc-hud button:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(43,43,51,.25); }
#fc-hud button:focus-visible { outline: 3px solid #f2b632; outline-offset: 2px; }

/* top-left: counters and the Skip button */
#fc-topleft { position: absolute; z-index: 5; top: calc(10px + env(safe-area-inset-top));
  left: calc(10px + env(safe-area-inset-left)); display: flex; flex-direction: column; align-items: flex-start; gap: 8px;
  max-width: calc(100vw - 20px - env(safe-area-inset-left) - env(safe-area-inset-right)); }
#fc-counters { --fc-base: 15px; --fc-ov: 1; font-size: calc(var(--fc-base) * var(--fc-ov)); display: flex;
  flex-direction: column; gap: 2px; padding: 6px 10px; transform-origin: 0 0;
  transition: transform .6s ease-out, font-size .4s ease-out; }
#fc-counters.fc-empty, #fc-counters.fc-off { display: none; }
#fc-counters .fc-c-row { display: flex; align-items: center; gap: 6px; min-height: 1.75em; white-space: nowrap; }
#fc-counters .fc-c-icon { width: 24px; height: 24px; flex: 0 0 auto; display: inline-flex; align-items: center;
  justify-content: center; font-size: 20px; line-height: 1; }
#fc-counters .fc-c-icon img { width: 24px; height: 24px; object-fit: contain; display: block; }
#fc-counters .fc-c-label { font-weight: 600; opacity: .8; }
#fc-counters .fc-c-value { font-weight: 800; font-variant-numeric: tabular-nums; margin-left: auto; padding-left: 8px; }
#fc-skip { min-height: 44px; min-width: 44px; padding: 0 14px; font-size: 14px; }
#fc-skip[hidden] { display: none; }

/* top-centre goal line */
#fc-goal { position: absolute; z-index: 6; top: calc(10px + env(safe-area-inset-top)); left: 50%;
  transform: translateX(-50%); max-width: calc(100vw - 380px); padding: 8px 14px; font-weight: 800; font-size: 15px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#fc-goal[hidden] { display: none; }
#fc-goal.fc-jitter { animation: fc-jitter .09s steps(2) infinite; }
@keyframes fc-jitter {
  0% { transform: translate(calc(-50% - var(--fc-jit, 2px)), var(--fc-jit, 2px)) rotate(-1deg); }
  100% { transform: translate(calc(-50% + var(--fc-jit, 2px)), calc(var(--fc-jit, 2px) * -1)) rotate(1deg); }
}

/* top-right: mute and toasts */
#fc-mute { position: absolute; z-index: 50; top: calc(10px + env(safe-area-inset-top));
  right: calc(10px + env(safe-area-inset-right)); width: 44px; height: 44px; padding: 0; font-size: 20px; line-height: 1; }
/* One right-hand column below the goal line and mute: achievement toasts on top, game toasts under them. */
#fc-toastcol { position: absolute; z-index: 25; top: calc(64px + env(safe-area-inset-top));
  right: calc(10px + env(safe-area-inset-right)); display: flex; flex-direction: column; align-items: flex-end; gap: 6px;
  width: min(290px, calc(100vw - 210px - env(safe-area-inset-left) - env(safe-area-inset-right))); pointer-events: none; }
#fc-ach { width: 100%; }
#fc-hud #fc-ach #la-toast-stack { position: static; max-width: none; width: 100%; gap: 6px; }
#fc-toasts { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; width: 100%; }
#fc-toasts .fc-toast { display: flex; gap: 8px; align-items: flex-start; padding: 8px 10px; width: 100%;
  box-sizing: border-box; transform: translateX(calc(100% + 40px)); opacity: 0;
  transition: transform .3s cubic-bezier(.2,.9,.3,1.2), opacity .3s; }
#fc-toasts .fc-toast.fc-in { transform: none; opacity: 1; }
#fc-toasts .fc-toast-icon { font-size: 18px; line-height: 1.2; flex: 0 0 auto; }
#fc-toasts .fc-toast-title { font-weight: 800; font-size: 14px; line-height: 1.25; overflow-wrap: anywhere; }
#fc-toasts .fc-toast-body { font-size: 12px; line-height: 1.3; opacity: .8; margin-top: 2px; overflow-wrap: anywhere; }

/* bottom: choices stacked above the dialogue box */
#fc-catcher { position: absolute; inset: 0; z-index: 29; pointer-events: auto; background: transparent; }
#fc-catcher[hidden] { display: none; }
#fc-bottom { position: absolute; z-index: 30; left: 50%; transform: translateX(-50%);
  bottom: calc(24px + env(safe-area-inset-bottom)); width: calc(100% - 24px); max-width: 640px;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  max-height: calc(100% - 80px - env(safe-area-inset-top) - env(safe-area-inset-bottom)); }
@media (pointer: coarse) { #fc-bottom { bottom: calc(120px + env(safe-area-inset-bottom)); } }
#fc-dialog { position: relative; width: 100%; box-sizing: border-box; padding: 10px 14px 14px; pointer-events: auto;
  cursor: pointer; min-height: 72px; }
#fc-dialog[hidden] { display: none; }
#fc-dialog .fc-d-name { font-weight: 800; font-size: 15px; margin-bottom: 4px; letter-spacing: .01em; }
#fc-dialog .fc-d-text { font-size: 17px; line-height: 1.4; white-space: pre-wrap; overflow-wrap: anywhere; }
#fc-dialog .fc-d-more { position: absolute; right: 12px; bottom: 6px; font-size: 13px; visibility: hidden; }
#fc-dialog.fc-done .fc-d-more { visibility: visible; animation: fc-blink .8s steps(2) infinite; }
@keyframes fc-blink { 50% { opacity: 0; } }
#fc-choices { width: 100%; max-width: 480px; display: flex; flex-direction: column; gap: 6px; overflow-y: auto;
  min-height: 0; pointer-events: auto; padding: 2px 2px 4px; box-sizing: border-box; }
#fc-choices[hidden] { display: none; }
#fc-choices .fc-ch-prompt { padding: 8px 12px; font-weight: 800; font-size: 15px; text-align: center; }
#fc-choices button { width: 100%; min-height: 48px; padding: 8px 14px; font-size: 16px; text-align: left; flex: 0 0 auto; }
#fc-choices button .fc-ch-key { display: inline-block; min-width: 1.4em; opacity: .5; font-variant-numeric: tabular-nums; }

/* full-screen layers */
#fc-fade { position: absolute; inset: 0; z-index: 40; opacity: 0; pointer-events: none; background: #000; }
#fc-title { position: absolute; inset: 0; z-index: 45; display: flex; flex-direction: column; align-items: center;
  justify-content: center; text-align: center; gap: 8px; color: #fffaf0; background: rgba(10,10,16,.7);
  opacity: 0; transition: opacity .4s; box-sizing: border-box;
  padding: calc(16px + env(safe-area-inset-top)) calc(16px + env(safe-area-inset-right))
    calc(16px + env(safe-area-inset-bottom)) calc(16px + env(safe-area-inset-left)); }
#fc-title[hidden] { display: none; }
#fc-title.fc-in { opacity: 1; }
#fc-title .fc-t-kicker { font-variant: small-caps; letter-spacing: .12em; font-size: 18px; font-weight: 700; opacity: .85; }
#fc-title .fc-t-title { font-size: clamp(30px, 8vw, 60px); font-weight: 900; line-height: 1.05; letter-spacing: -.01em;
  text-shadow: 0 4px 0 rgba(0,0,0,.35); overflow-wrap: anywhere; }
#fc-title .fc-t-sub { font-size: 16px; font-style: italic; opacity: .85; }
#fc-credits { position: absolute; inset: 0; z-index: 45; overflow: hidden; background: rgba(10,10,16,.6); color: #fffaf0;
  opacity: 1; transition: opacity .8s; pointer-events: auto; }
#fc-credits .fc-cr-roll { position: absolute; left: 0; right: 0; top: 0; text-align: center; will-change: transform;
  padding: 0 calc(16px + env(safe-area-inset-right)) 0 calc(16px + env(safe-area-inset-left)); }
#fc-credits .fc-cr-line { font-size: 18px; line-height: 1.6; min-height: 1.6em; overflow-wrap: anywhere; }
#fc-credits .fc-cr-line.fc-first { font-size: clamp(28px, 7vw, 48px); font-weight: 900; line-height: 1.2; margin-bottom: 12px; }
#fc-credits .fc-cr-skip { position: absolute; top: calc(10px + env(safe-area-inset-top));
  left: calc(10px + env(safe-area-inset-left)); min-height: 44px; min-width: 64px; padding: 0 16px; font-size: 14px; }

@media (max-width: 499px) {
  #fc-counters { --fc-base: 13px; }
  #fc-counters .fc-c-label { max-width: 14ch; overflow: hidden; text-overflow: ellipsis; }
  /* Portrait phones: the top row is counters + mute, so the goal sits above the touch buttons instead. */
  #fc-goal { top: auto; bottom: calc(104px + env(safe-area-inset-bottom)); max-width: calc(100vw - 24px);
    font-size: 13px; padding: 6px 12px; }
  #fc-hud.fc-talking #fc-goal { visibility: hidden; }
  #fc-toastcol { width: min(290px, calc(100vw - 190px - env(safe-area-inset-left) - env(safe-area-inset-right)));
    /* The goal sits near the bottom here: stop the column above it, newest toast first, oldest clipped. */
    max-height: calc(100% - 64px - 150px - env(safe-area-inset-top) - env(safe-area-inset-bottom)); overflow: hidden; }
  #fc-toasts { flex-direction: column-reverse; }
  #fc-dialog .fc-d-text { font-size: 16px; }
}
@media (max-width: 699px) and (min-width: 500px) { #fc-goal { max-width: calc(100vw - 300px); } }
/* Landscape phones: drop the dialogue to the bottom between the stick side and the Jump/Interact buttons. */
@media (pointer: coarse) and (max-height: 500px) {
  #fc-bottom { bottom: calc(10px + env(safe-area-inset-bottom));
    max-width: min(640px, calc(100vw - 420px - env(safe-area-inset-left) - env(safe-area-inset-right)));
    max-height: calc(100% - 70px - env(safe-area-inset-top) - env(safe-area-inset-bottom)); }
  #fc-dialog { min-height: 56px; padding: 8px 12px 12px; }
  #fc-dialog .fc-d-text { font-size: 15px; }
  #fc-choices button { min-height: 44px; font-size: 15px; }
}
@media (prefers-reduced-motion: reduce) {
  #fc-goal.fc-jitter { animation: none; }
  #fc-toasts .fc-toast { transition: opacity .3s; }
}
`;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, Math.max(0, ms)));
/** Commit pending style changes so a following change transitions. */
const reflow = (e: HTMLElement) => void e.offsetWidth;

interface RowEls { row: HTMLElement; icon: HTMLElement; label: HTMLElement; value: HTMLElement }
interface CounterEntry { wrap: HTMLElement; copies: RowEls[]; icon: string; label: string; value: string }
interface Line { who: Speaker; name: string; text: string; auto?: number; resolve: () => void }

export function createHud(ui: HTMLElement, opts: { fast?: boolean } = {}): Hud {
  // ?fast types dialogue 4x quicker; normal speed is unchanged.
  const typeCps = opts.fast ? TYPE_CPS * 4 : TYPE_CPS;
  if (!document.getElementById('fc-hud-style')) {
    const style = el('style');
    style.id = 'fc-hud-style';
    style.textContent = CSS;
    document.head.append(style);
  }
  const root = el('div');
  root.id = 'fc-hud';
  ui.append(root);

  // ---------- counters + skip ----------
  const topLeft = el('div');
  topLeft.id = 'fc-topleft';
  const counters = el('div', 'fc-panel fc-empty');
  counters.id = 'fc-counters';
  const skip = el('button');
  skip.id = 'fc-skip';
  skip.type = 'button';
  skip.hidden = true;
  topLeft.append(counters, skip);
  root.append(topLeft);

  const entries = new Map<ItemKind, CounterEntry>();
  let repeat = 1;

  function fillIcon(holder: HTMLElement, icon: string) {
    holder.textContent = '';
    if (icon.startsWith('data:')) {
      const img = el('img');
      img.src = icon;
      img.alt = '';
      img.draggable = false;
      holder.append(img);
    } else holder.textContent = icon;
  }
  function makeCopy(e: CounterEntry): RowEls {
    const row = el('div', 'fc-c-row');
    const icon = el('span', 'fc-c-icon');
    fillIcon(icon, e.icon);
    const label = el('span', 'fc-c-label', e.label);
    label.title = e.label;
    const value = el('span', 'fc-c-value', e.value);
    row.append(icon, label, value);
    e.wrap.append(row);
    return { row, icon, label, value };
  }
  function syncCopies(e: CounterEntry) {
    while (e.copies.length < repeat) e.copies.push(makeCopy(e));
    while (e.copies.length > repeat) e.copies.pop()!.row.remove();
  }
  function pop(r: RowEls) {
    if (typeof r.value.animate !== 'function') return;
    r.value.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }],
      { duration: 150, easing: 'ease-out' },
    );
  }

  function setCounters(rows: CounterRow[]) {
    const seen = new Set<ItemKind>();
    rows.forEach((r, i) => {
      seen.add(r.kind);
      let e = entries.get(r.kind);
      if (!e) {
        e = { wrap: el('div', 'fc-c-group'), copies: [], icon: r.icon, label: r.label, value: r.value };
        entries.set(r.kind, e);
        syncCopies(e);
      } else {
        if (e.icon !== r.icon) { e.icon = r.icon; for (const c of e.copies) fillIcon(c.icon, r.icon); }
        if (e.label !== r.label) {
          e.label = r.label;
          for (const c of e.copies) { c.label.textContent = r.label; c.label.title = r.label; }
        }
        if (e.value !== r.value) {
          e.value = r.value;
          for (const c of e.copies) { c.value.textContent = r.value; pop(c); }
        }
      }
      if (counters.children[i] !== e.wrap) counters.insertBefore(e.wrap, counters.children[i] ?? null);
    });
    for (const [kind, e] of entries) {
      if (!seen.has(kind)) { e.wrap.remove(); entries.delete(kind); }
    }
    counters.classList.toggle('fc-empty', entries.size === 0);
  }

  let skipHandler: (() => void) | undefined;
  skip.addEventListener('click', (ev) => { ev.stopPropagation(); skipHandler?.(); });
  function setSkipButton(label: string | null, onClick?: () => void) {
    if (label === null) { skip.hidden = true; return; }
    skip.textContent = label;
    if (onClick) skipHandler = onClick;
    skip.hidden = false;
  }

  // ---------- goal ----------
  const goal = el('div', 'fc-panel');
  goal.id = 'fc-goal';
  goal.hidden = true;
  root.append(goal);
  function setGoal(text: string | null) {
    if (text === null || text === '') { goal.hidden = true; return; }
    if (goal.textContent !== text) goal.textContent = text;
    goal.hidden = false;
  }

  // ---------- mute ----------
  const mute = el('button');
  mute.id = 'fc-mute';
  mute.type = 'button';
  let muted = false;
  try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch { /* storage blocked */ }
  const muteListeners: ((m: boolean) => void)[] = [];
  const drawMute = () => {
    mute.textContent = muted ? '🔇' : '🔊';
    mute.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
    mute.setAttribute('aria-pressed', String(muted));
  };
  drawMute();
  mute.addEventListener('click', (ev) => {
    ev.stopPropagation();
    muted = !muted;
    try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch { /* storage blocked */ }
    drawMute();
    for (const fn of muteListeners) fn(muted);
  });
  root.append(mute);
  function onMute(fn: (m: boolean) => void) {
    muteListeners.push(fn);
    fn(muted);
  }

  // ---------- toasts ----------
  const toastCol = el('div');
  toastCol.id = 'fc-toastcol';
  const achievementSlot = el('div');
  achievementSlot.id = 'fc-ach';
  const toasts = el('div');
  toasts.id = 'fc-toasts';
  toastCol.append(achievementSlot, toasts);
  root.append(toastCol);
  function toast(title: string, body?: string) {
    while (toasts.children.length >= MAX_TOASTS) toasts.firstElementChild!.remove();
    const card = el('div', 'fc-panel fc-toast');
    const text = el('div');
    text.append(el('div', 'fc-toast-title', title));
    if (body) text.append(el('div', 'fc-toast-body', body));
    card.append(el('span', 'fc-toast-icon', '🏆'), text);
    toasts.append(card);
    reflow(card);
    card.classList.add('fc-in');
    setTimeout(() => {
      card.classList.remove('fc-in');
      setTimeout(() => card.remove(), 320);
    }, TOAST_MS);
  }

  // ---------- dialogue + choices ----------
  const catcher = el('div');
  catcher.id = 'fc-catcher';
  catcher.hidden = true;
  const bottom = el('div');
  bottom.id = 'fc-bottom';
  const choices = el('div');
  choices.id = 'fc-choices';
  choices.hidden = true;
  const dialog = el('div', 'fc-panel');
  dialog.id = 'fc-dialog';
  dialog.hidden = true;
  const dName = el('div', 'fc-d-name');
  const dText = el('div', 'fc-d-text');
  const dMore = el('span', 'fc-d-more', '▼');
  dialog.append(dName, dText, dMore);
  bottom.append(choices, dialog);
  root.append(catcher, bottom);

  const queue: Line[] = [];
  let current: Line | null = null;
  let shown = 0;
  let typeTimer: ReturnType<typeof setInterval> | undefined;
  let autoTimer: ReturnType<typeof setTimeout> | undefined;
  let typing = false;
  let choiceOpen = false;

  const updateTalking = () => root.classList.toggle('fc-talking', !!current || choiceOpen);

  function finishTyping() {
    if (!current) return;
    typing = false;
    clearInterval(typeTimer);
    dText.textContent = current.text;
    dialog.classList.add('fc-done');
    if (current.auto !== undefined) {
      const line = current;
      autoTimer = setTimeout(() => { if (current === line) resolveLine(); }, current.auto * 1000);
    }
  }
  function resolveLine() {
    if (!current) return;
    clearTimeout(autoTimer);
    clearInterval(typeTimer);
    const done = current;
    current = null;
    done.resolve();
    nextLine();
  }
  function nextLine() {
    const line = queue.shift();
    if (!line) {
      dialog.hidden = true;
      catcher.hidden = true;
      dialog.classList.remove('fc-done');
      updateTalking();
      return;
    }
    current = line;
    dName.textContent = line.name;
    dName.style.color = SPEAKERS[line.who]?.color ?? '#2b2b33';
    dText.textContent = '';
    dialog.classList.remove('fc-done');
    dialog.hidden = false;
    catcher.hidden = false;
    updateTalking();
    shown = 0;
    typing = true;
    const start = performance.now();
    typeTimer = setInterval(() => {
      if (current !== line) return;
      const n = Math.min(line.text.length, Math.floor(((performance.now() - start) / 1000) * typeCps));
      if (n !== shown) { shown = n; dText.textContent = line.text.slice(0, n); }
      if (n >= line.text.length) finishTyping();
    }, 1000 / typeCps);
    if (line.text.length === 0) finishTyping();
  }
  function advance() {
    if (!current) return;
    if (typing) finishTyping();
    else resolveLine();
  }
  const onTap = (ev: Event) => { ev.preventDefault(); ev.stopPropagation(); advance(); };
  dialog.addEventListener('pointerdown', onTap);
  catcher.addEventListener('pointerdown', onTap);

  function say(who: Speaker, name: string, text: string, auto?: number): Promise<void> {
    return new Promise<void>((resolve) => {
      queue.push({ who, name, text, auto, resolve });
      if (!current) nextLine();
    });
  }

  let pickChoice: ((i: number) => void) | null = null;
  let choiceCount = 0;
  let choiceChain: Promise<unknown> = Promise.resolve();
  function choose(prompt: string | null, options: string[]): Promise<number> {
    const run = () => new Promise<number>((resolve) => {
      choices.textContent = '';
      if (prompt) choices.append(el('div', 'fc-panel fc-ch-prompt', prompt));
      choiceCount = options.length;
      pickChoice = (i: number) => {
        pickChoice = null;
        choiceOpen = false;
        choices.hidden = true;
        choices.textContent = '';
        updateTalking();
        resolve(i);
      };
      options.forEach((opt, i) => {
        const b = el('button');
        b.type = 'button';
        if (i < 9) b.append(el('span', 'fc-ch-key', `${i + 1}.`));
        b.append(document.createTextNode(` ${opt}`));
        b.addEventListener('click', (ev) => { ev.stopPropagation(); pickChoice?.(i); });
        b.addEventListener('pointerdown', (ev) => ev.stopPropagation());
        choices.append(b);
      });
      choiceOpen = true;
      choices.hidden = false;
      choices.scrollTop = 0;
      updateTalking();
    });
    const p = choiceChain.then(run);
    choiceChain = p.catch(() => undefined);
    return p;
  }

  window.addEventListener('keydown', (ev) => {
    if (ev.repeat) return;
    if (choiceOpen && pickChoice && /^[1-9]$/.test(ev.key)) {
      const i = Number(ev.key) - 1;
      if (i < choiceCount) { ev.preventDefault(); pickChoice(i); }
      return;
    }
    if (current && (ev.key === 'Enter' || ev.key === ' ' || ev.code === 'Space')) {
      ev.preventDefault();
      advance();
    }
  });

  // ---------- fade ----------
  const cover = el('div');
  cover.id = 'fc-fade';
  root.append(cover);
  let fadeToken = 0;
  async function fade(to: number, seconds: number, color = '#000') {
    const token = ++fadeToken;
    const target = Math.max(0, Math.min(1, to));
    cover.style.background = color;
    cover.style.transition = `opacity ${Math.max(0, seconds)}s linear`;
    reflow(cover);
    cover.style.opacity = String(target);
    if (target > 0) cover.style.pointerEvents = 'auto';
    await sleep(seconds * 1000);
    if (token === fadeToken && target === 0) cover.style.pointerEvents = 'none';
  }

  // ---------- title card ----------
  const title = el('div');
  title.id = 'fc-title';
  title.hidden = true;
  root.append(title);
  let titleChain: Promise<unknown> = Promise.resolve();
  function titleCard(kicker: string, text: string, sub?: string): Promise<void> {
    const run = async () => {
      title.textContent = '';
      if (kicker) title.append(el('div', 'fc-t-kicker', kicker));
      title.append(el('div', 'fc-t-title', text));
      if (sub) title.append(el('div', 'fc-t-sub', sub));
      title.hidden = false;
      reflow(title);
      title.classList.add('fc-in');
      await sleep(400 + 2000);
      title.classList.remove('fc-in');
      await sleep(400);
      title.hidden = true;
    };
    const p = titleChain.then(run);
    titleChain = p.catch(() => undefined);
    return p;
  }

  // ---------- credits ----------
  function credits(lines: string[]): Promise<void> {
    return new Promise<void>((resolve) => {
      const box = el('div');
      box.id = 'fc-credits';
      const roll = el('div', 'fc-cr-roll');
      lines.forEach((line, i) => {
        const row = el('div', i === 0 ? 'fc-cr-line fc-first' : 'fc-cr-line', line || ' ');
        roll.append(row);
      });
      const skipBtn = el('button', 'fc-cr-skip', 'Skip');
      skipBtn.type = 'button';
      box.append(roll, skipBtn);
      root.append(box);

      const seconds = Math.max(12, lines.length * 1.6);
      const startY = box.clientHeight || window.innerHeight;
      const endY = -roll.offsetHeight;
      roll.style.transform = `translateY(${startY}px)`;
      reflow(roll);
      roll.style.transition = `transform ${seconds}s linear`;
      roll.style.transform = `translateY(${endY}px)`;

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve();
        box.style.pointerEvents = 'none';
        box.style.opacity = '0';
        setTimeout(() => box.remove(), 850);
      };
      const timer = setTimeout(finish, seconds * 1000);
      skipBtn.addEventListener('click', (ev) => { ev.stopPropagation(); finish(); });
    });
  }

  // ---------- overflow (Chapter 4) ----------
  function setOverflow(level: number) {
    const lv = Math.max(0, Math.min(1, level || 0));
    const nextRepeat = 1 + Math.floor(lv * 6);
    if (nextRepeat !== repeat) {
      repeat = nextRepeat;
      for (const e of entries.values()) syncCopies(e);
    }
    if (lv <= 0) {
      counters.style.removeProperty('--fc-ov');
      counters.style.transform = '';
      goal.classList.remove('fc-jitter');
      goal.style.removeProperty('--fc-jit');
      return;
    }
    counters.style.setProperty('--fc-ov', String(1 + lv));
    const drop = lv > 0.6 ? ((lv - 0.6) / 0.4) * 120 : 0;
    counters.style.transform = `translateY(${drop}vh) rotate(${lv * 4}deg)`;
    goal.classList.add('fc-jitter');
    goal.style.setProperty('--fc-jit', `${(1 + lv * 5).toFixed(1)}px`);
  }

  function setCountersVisible(on: boolean) {
    counters.classList.toggle('fc-off', !on);
  }

  return {
    root, achievementSlot,
    setCounters, setGoal, toast, titleCard, say, choose, setOverflow, fade, credits, setSkipButton, onMute,
    setCountersVisible,
  };
}
