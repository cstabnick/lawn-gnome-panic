// Player controls: drag to aim, club selector with ranges and bag list, three-tap swing meter, VIEW toggle,
// and keyboard equivalents. Owns state.swing and state.view; takes shots through round.ts.
import type { ClubId, Ctx, Lie, System } from './config';
import { CLUBS, CLUB_ORDER, CONSUMABLES, SWING } from './config';
import { estimateCarry } from './physics';
import {
  cycleClub,
  distanceToPin,
  drinkGolfWater,
  fmtDistance,
  lightCigarillo,
  meterSpeedScale,
  setAim,
  skipIntro,
  takeShot,
} from './round';
import { sfx, startAudio } from './audio';

// Meter layout, in percent of the bar width.
const LINE = 12; // accuracy line
const FULL = 88; // full-power mark
const ZONE_HALF = SWING.accuracyWindow * (FULL - LINE); // accuracy zone half-width in percent
const ROT_RATE = 0.6; // rad/s keyboard aim
const ROT_RATE_SHIFT = 0.15;
const ROT_RATE_PUTT = 0.2;
const DRAG_K = 0.004; // rad/px
const DRAG_K_PUTT = 0.0015;
const FLASH_SECONDS = 1.2;
const TUTORIAL_KEY = 'gnome-golf-swing-tutorial';
/** Meter speed on the tutorial swing (slower, so there is time to read the hints). */
const TUTORIAL_SPEED = 0.55;
const BAR_BG = 'linear-gradient(90deg, #4f8f43 0%, #4f8f43 12%, #a6d86a 12%, #a6d86a 88%, #d24b3c 88%, #d24b3c 100%)';

const CSS = `
#gc-root { position:absolute; inset:0; z-index:2; pointer-events:none; color:#fff; text-shadow:0 1px 2px #000; font-family:system-ui, sans-serif; -webkit-user-select:none; user-select:none; }
#gc-root .gc-hidden { display:none !important; }
#gc-root [id] { touch-action:manipulation; }
#gc-club { position:absolute; left:max(8px, env(safe-area-inset-left)); bottom:max(10px, env(safe-area-inset-bottom)); width:200px; }
#gc-row { display:flex; align-items:center; background:rgba(10,30,20,0.55); border-radius:10px; padding:2px; }
#gc-prev, #gc-next { pointer-events:auto; width:48px; height:48px; flex:0 0 48px; display:flex; align-items:center; justify-content:center; font-size:22px; border-radius:10px; cursor:pointer; }
#gc-label { pointer-events:auto; flex:1; min-height:48px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:0 4px; cursor:pointer; }
#gc-name { font-weight:600; font-size:16px; white-space:nowrap; }
#gc-range { font-size:13px; opacity:0.9; }
#gc-bag { pointer-events:auto; position:absolute; z-index:3; left:0; bottom:calc(100% + 8px); width:230px; max-height:min(60vh, 560px); overflow-y:auto; background:rgba(10,30,20,0.92); border-radius:10px; padding:4px; }
#gc-bag > div { display:flex; align-items:center; gap:8px; min-height:48px; padding:0 10px; border-radius:8px; cursor:pointer; }
#gc-bag > div > span.gc-n { flex:1; font-size:15px; white-space:nowrap; }
#gc-bag > div > span.gc-r { font-size:14px; opacity:0.9; white-space:nowrap; }
#gc-bag > div > span.gc-f { width:20px; text-align:center; }
#gc-meter { position:absolute; left:50%; transform:translateX(-50%); bottom:calc(env(safe-area-inset-bottom) + 14px); width:min(78vw, 420px); }
@media (orientation: portrait) { #gc-meter { bottom:calc(env(safe-area-inset-bottom) + 176px); width:min(78vw, 460px); } }
#gc-dist { height:22px; margin-bottom:4px; text-align:center; font-size:15px; font-weight:600; }
#gc-tut { position:absolute; left:0; right:0; bottom:calc(100% + 18px); display:flex; justify-content:center; pointer-events:none; }
#gc-tut-box { max-width:min(86vw, 400px); background:rgba(255,248,214,0.97); color:#2a2208; text-shadow:none; border-radius:12px; padding:9px 13px; font-size:15px; line-height:1.3; box-shadow:0 4px 14px rgba(0,0,0,0.45); text-align:center; }
#gc-tut-box b { color:#b5560b; }
#gc-tut-step { display:block; font-size:12px; font-weight:700; letter-spacing:0.6px; color:#7a6a2c; margin-bottom:2px; }
#gc-tut-arrow { position:absolute; bottom:-6px; width:0; height:0; margin-left:-12px; border-left:12px solid transparent; border-right:12px solid transparent; border-top:16px solid rgba(255,248,214,0.97); transform:translateY(100%); filter:drop-shadow(0 3px 2px rgba(0,0,0,0.35)); animation:gc-bob 0.8s ease-in-out infinite alternate; }
@keyframes gc-bob { from { transform:translateY(100%); } to { transform:translateY(calc(100% + 6px)); } }
#gc-tut-target { position:absolute; top:-3px; bottom:-3px; width:10px; margin-left:-5px; border-radius:5px; box-shadow:0 0 0 3px #fff8d6, 0 0 12px 4px #ffd84d; animation:gc-glow 0.7s ease-in-out infinite alternate; pointer-events:none; z-index:2; }
@keyframes gc-glow { from { opacity:0.45; } to { opacity:1; } }
#gc-swing.gc-tut-pulse { animation:gc-pulse 0.9s ease-in-out infinite; }
@keyframes gc-pulse { 0%,100% { box-shadow:0 3px 8px rgba(0,0,0,0.45), 0 0 0 0 rgba(255,216,77,0.9); } 50% { box-shadow:0 3px 8px rgba(0,0,0,0.45), 0 0 0 12px rgba(255,216,77,0); } }
#gc-help { pointer-events:auto; position:absolute; left:6px; top:-6px; width:30px; height:30px; border-radius:15px; background:rgba(10,30,20,0.6); border:2px solid rgba(255,255,255,0.7); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:15px; cursor:pointer; }
#gc-help::after { content:''; position:absolute; inset:-9px; }
#gc-bar { position:relative; height:26px; border-radius:13px; overflow:hidden; background:${BAR_BG}; box-shadow:0 0 0 2px rgba(0,0,0,0.35); }
#gc-zone { position:absolute; top:0; bottom:0; left:${LINE - ZONE_HALF}%; width:${ZONE_HALF * 2}%; background:rgba(255,255,255,0.45); }
#gc-line { position:absolute; top:0; bottom:0; left:${LINE}%; width:2px; margin-left:-1px; background:rgba(0,0,0,0.5); }
#gc-lock { position:absolute; top:0; bottom:0; width:4px; margin-left:-2px; background:#ffc83d; box-shadow:0 0 3px #000; }
#gc-marker { position:absolute; top:0; bottom:0; width:4px; margin-left:-2px; background:#fff; box-shadow:0 0 3px #000; }
#gc-actions { position:absolute; right:max(12px, env(safe-area-inset-right)); bottom:max(12px, env(safe-area-inset-bottom)); display:flex; flex-direction:column; align-items:center; gap:8px; }
#gc-view { pointer-events:auto; height:56px; min-width:56px; padding:0 12px; border-radius:28px; background:rgba(10,30,20,0.6); border:2px solid rgba(255,255,255,0.7); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px; cursor:pointer; }
#gc-smoke { position:absolute; right:0; top:0; height:22px; line-height:22px; padding:0 8px; border-radius:11px; background:rgba(255,120,30,0.9); font-size:12px; font-weight:700; white-space:nowrap; }
#gc-items { position:absolute; z-index:2; left:max(8px, env(safe-area-inset-left)); bottom:calc(max(10px, env(safe-area-inset-bottom)) + 66px); display:flex; gap:8px; }
#gc-cig, #gc-beer { pointer-events:auto; position:relative; width:52px; height:52px; border-radius:50%; background:rgba(10,30,20,0.6); border:2px solid rgba(255,255,255,0.7); display:flex; align-items:center; justify-content:center; font-size:24px; cursor:pointer; transition:opacity 0.15s, box-shadow 0.15s, border-color 0.15s; }
#gc-cig.gc-lit { border-color:#ff9a3c; box-shadow:0 0 0 3px rgba(255,140,40,0.5), 0 0 14px 4px rgba(255,120,30,0.85); }
#gc-root .gc-badge { position:absolute; right:-6px; top:-6px; min-width:20px; height:20px; padding:0 5px; box-sizing:border-box; border-radius:10px; background:#fff; color:#1a1a1a; font-size:12px; font-weight:700; line-height:16px; text-align:center; text-shadow:none; }
#gc-cig.gc-lit #gc-cig-n { background:#ff9a3c; color:#fff; }
#gc-toast { position:absolute; left:50%; transform:translateX(-50%); bottom:calc(env(safe-area-inset-bottom) + 74px); width:max-content; max-width:min(90vw, 420px); box-sizing:border-box; padding:8px 14px; border-radius:18px; background:rgba(10,30,20,0.8); font-size:14px; font-weight:600; text-align:center; opacity:0; transition:opacity 0.25s; pointer-events:none; }
#gc-toast.gc-show { opacity:1; }
@media (orientation: portrait) { #gc-toast { bottom:calc(env(safe-area-inset-bottom) + 236px); } }
#gc-swing { pointer-events:auto; width:84px; height:84px; border-radius:50%; background:radial-gradient(circle at 35% 30%, #ffe27a, #e0a526); border:3px solid rgba(255,255,255,0.85); box-shadow:0 3px 8px rgba(0,0,0,0.45); color:#2a1c00; text-shadow:none; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:16px; letter-spacing:0.5px; cursor:pointer; }
`;

function distText(club: ClubId, lie: Lie, power: number): string {
  const yd = estimateCarry(club, lie, power);
  return club === 'PT' ? fmtDistance(yd, 'green') : `${Math.round(yd)} yd`;
}

function xOf(marker: number): number {
  let x: number;
  if (marker <= 1) x = LINE + Math.max(-0.3, marker) * (FULL - LINE);
  else x = FULL + ((marker - 1) / (SWING.maxPower - 1)) * (100 - FULL);
  return Math.max(0, Math.min(100, x));
}

function setText(el: HTMLElement, text: string): void {
  if (el.textContent !== text) el.textContent = text;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, id: string, parent?: HTMLElement): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.id = id;
  parent?.appendChild(e);
  return e;
}

export function createControls(ctx: Ctx): System {
  const { state, canvas, ui } = ctx;

  // Let drags reach the canvas handlers instead of scrolling the page.
  canvas.style.touchAction = 'none';

  const root = el('div', 'gc-root');
  const style = document.createElement('style');
  style.textContent = CSS;
  root.appendChild(style);
  ui.appendChild(root);

  // Club selector
  const club = el('div', 'gc-club', root);
  const bag = el('div', 'gc-bag', club);
  const row = el('div', 'gc-row', club);
  const prev = el('div', 'gc-prev', row);
  prev.textContent = '◀';
  const label = el('div', 'gc-label', row);
  const name = el('div', 'gc-name', label);
  const range = el('div', 'gc-range', label);
  const next = el('div', 'gc-next', row);
  next.textContent = '▶';

  // Swing meter
  const meter = el('div', 'gc-meter', root);
  const dist = el('div', 'gc-dist', meter);
  const bar = el('div', 'gc-bar', meter);
  el('div', 'gc-zone', bar).style.background = 'rgba(255,255,255,0.45)';
  el('div', 'gc-line', bar);
  const lock = el('div', 'gc-lock', bar);
  const marker = el('div', 'gc-marker', bar);
  const tutTarget = el('div', 'gc-tut-target', bar);
  const tut = el('div', 'gc-tut', meter);
  const tutBox = el('div', 'gc-tut-box', tut);
  const tutArrow = el('div', 'gc-tut-arrow', tut);
  const help = el('div', 'gc-help', meter);
  help.textContent = '?';
  help.setAttribute('role', 'button');
  help.setAttribute('aria-label', 'How to swing');
  let tutorialOn = true;
  try { tutorialOn = localStorage.getItem(TUTORIAL_KEY) !== 'done'; } catch { /* storage blocked: show it */ }
  let tutorialStep = 'init'; // not a real step, so the first render always applies one
  help.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (state.phase !== 'aim') return;
    tutorialOn = true;
    tutorialStep = '';
  });
  const smoke = el('div', 'gc-smoke', meter);
  smoke.textContent = '🚬 slow swing';

  // Action buttons
  const actions = el('div', 'gc-actions', root);
  const view = el('div', 'gc-view', actions);
  const swing = el('div', 'gc-swing', actions);
  swing.textContent = 'SWING';

  // Consumables row above the club selector: cigarillo and golf water.
  const items = el('div', 'gc-items', root);
  const cig = el('div', 'gc-cig', items);
  cig.setAttribute('role', 'button');
  cig.setAttribute('aria-label', 'Light a cigarillo');
  const cigIco = el('span', 'gc-cig-ico', cig);
  cigIco.textContent = '🚬';
  const cigN = el('span', 'gc-cig-n', cig);
  cigN.className = 'gc-badge';
  const beer = el('div', 'gc-beer', items);
  beer.setAttribute('role', 'button');
  beer.setAttribute('aria-label', 'Drink golf water');
  const beerIco = el('span', 'gc-beer-ico', beer);
  beerIco.textContent = '🍺';
  const beerN = el('span', 'gc-beer-n', beer);
  beerN.className = 'gc-badge';
  const toastEl = el('div', 'gc-toast', root);

  // Bag list rows: one per club in CLUB_ORDER.
  let bagOpen = false;
  const bagRows: HTMLElement[] = [];
  const bagFlag: HTMLElement[] = [];
  const bagRange: HTMLElement[] = [];
  const bagName: HTMLElement[] = [];
  CLUB_ORDER.forEach((c, i) => {
    const r = el('div', `gc-b${i}`, bag);
    bagRows.push(r);
    bagName.push(Object.assign(document.createElement('span'), { className: 'gc-n', textContent: CLUBS[c].name }));
    bagRange.push(Object.assign(document.createElement('span'), { className: 'gc-r' }));
    bagFlag.push(Object.assign(document.createElement('span'), { className: 'gc-f' }));
    r.append(bagName[i], bagRange[i], bagFlag[i]);
    r.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (state.phase !== 'aim') return;
      const idx = CLUB_ORDER.indexOf(c);
      const cur = CLUB_ORDER.indexOf(state.club);
      if (idx !== cur) {
        cycleClub(state, idx - cur);
        sfx('tick');
      }
      bagOpen = false;
    });
  });

  // Swing meter state for the flash text.
  let flashT = 0;
  let flashText = '';
  let flashColor = '#fff';

  function changeClub(delta: number): void {
    if (state.phase !== 'aim') return;
    const before = state.club;
    cycleClub(state, delta);
    if (state.club !== before) sfx('tick');
  }

  // Short message pill above the meter; a new one replaces the old.
  let toastTimer: ReturnType<typeof setTimeout> | null = null;
  function toast(text: string): void {
    toastEl.textContent = text;
    toastEl.classList.add('gc-show');
    if (toastTimer !== null) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('gc-show');
      toastTimer = null;
    }, 2200);
  }

  const WATER_LINES = ['Ahh, golf water.', 'Stay hydrated.', 'Purely medicinal.', 'Hydration is key.', 'Just water, officially.'];

  function lightCig(): void {
    startAudio();
    if (lightCigarillo(state)) {
      sfx('light');
      toast(`Cigarillo lit · swing meter slowed for ${CONSUMABLES.smokeShots} shots`);
    }
  }

  function drinkWater(): void {
    startAudio();
    if (drinkGolfWater(state)) {
      sfx('crack');
      setTimeout(() => sfx('sip'), 700);
      toast(WATER_LINES[Math.floor(Math.random() * WATER_LINES.length)]);
    }
  }

  function lockPower(): void {
    const sw = state.swing;
    sw.power = sw.marker;
    sw.stage = 'accuracy';
    sfx('click');
  }

  function fire(accuracy: number): void {
    const sw = state.swing;
    const power = sw.power;
    const c = state.club;
    sfx('swing');
    sfx(c === 'PT' ? 'putt' : 'hit', Math.min(1, power));
    takeShot(state, { club: c, power, accuracy, yaw: state.aimYaw });
    if (tutorialOn) {
      tutorialOn = false;
      tutorialStep = '';
      try { localStorage.setItem(TUTORIAL_KEY, 'done'); } catch { /* per-session only */ }
      setTimeout(() => toast('Tap early on the line: pulls left. Late: pushes right.'), 1300);
    }
    const a = Math.abs(accuracy);
    if (a < 0.15) {
      flashText = 'PERFECT';
      flashColor = '#ffd84d';
    } else if (accuracy < -0.6) {
      flashText = 'HOOK';
      flashColor = '#ff8a7a';
    } else if (accuracy > 0.6) {
      flashText = 'SLICE';
      flashColor = '#ff8a7a';
    } else {
      flashText = '';
    }
    flashT = flashText ? FLASH_SECONDS : 0;
  }

  // Three-tap swing: start, lock power, lock accuracy.
  function tapSwing(): void {
    const sw = state.swing;
    if (state.phase === 'aim' && sw.stage === 'idle') {
      startAudio();
      sfx('tick');
      state.phase = 'swing';
      state.phaseTime = 0;
      state.swing = { stage: 'power', marker: 0, power: 0 };
    } else if (state.phase === 'swing' && sw.stage === 'power') {
      lockPower();
    } else if (state.phase === 'swing' && sw.stage === 'accuracy') {
      fire(Math.max(-1, Math.min(1, -sw.marker / SWING.accuracyWindow)));
    }
  }

  // Pointer aim on the 3D view.
  let dragId: number | null = null;
  let lastX = 0;
  canvas.addEventListener('pointerdown', (e) => {
    if (state.phase === 'intro') {
      skipIntro(state);
      return;
    }
    if (state.phase !== 'aim') return;
    bagOpen = false;
    dragId = e.pointerId;
    lastX = e.clientX;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // Capture is best effort.
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (dragId !== e.pointerId || state.phase !== 'aim') return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    const k = state.club === 'PT' ? DRAG_K_PUTT : DRAG_K;
    setAim(state, state.aimYaw - dx * k);
  });
  const endDrag = (e: PointerEvent): void => {
    if (dragId !== e.pointerId) return;
    dragId = null;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      // Already released.
    }
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  // Touch buttons.
  prev.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    startAudio();
    changeClub(-1);
  });
  next.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    startAudio();
    changeClub(1);
  });
  label.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (state.phase !== 'aim') return;
    bagOpen = !bagOpen;
  });
  view.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (state.phase !== 'aim') return;
    state.view = state.view === 'behind' ? 'overhead' : 'behind';
  });
  cig.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    lightCig();
  });
  beer.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    drinkWater();
  });
  swing.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    tapSwing();
  });

  // Keyboard.
  const held = new Set<string>();
  let shift = false;
  const keyName = (e: KeyboardEvent): string => (e.key.length === 1 ? e.key.toLowerCase() : e.key);
  window.addEventListener('keydown', (e) => {
    shift = e.shiftKey;
    const k = keyName(e);
    if (k === 'ArrowLeft' || k === 'ArrowRight' || k === ' ') e.preventDefault();
    if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'a' || k === 'd') held.add(k === 'a' ? 'ArrowLeft' : k === 'd' ? 'ArrowRight' : k);
    if (e.repeat) return;
    if (k === ' ') {
      if (state.phase === 'intro') skipIntro(state);
      else tapSwing();
    } else if (k === 'Enter') {
      if (state.phase === 'intro') skipIntro(state);
    } else if (k === 'v') {
      if (state.phase === 'aim') state.view = state.view === 'behind' ? 'overhead' : 'behind';
    } else if (k === 'c') {
      lightCig();
    } else if (k === 'b') {
      drinkWater();
    } else if (k === 'ArrowUp' || k === 'w') {
      changeClub(-1);
    } else if (k === 'ArrowDown' || k === 's') {
      changeClub(1);
    }
  });
  window.addEventListener('keyup', (e) => {
    shift = e.shiftKey;
    const k = keyName(e);
    held.delete(k === 'a' ? 'ArrowLeft' : k === 'd' ? 'ArrowRight' : k);
  });
  window.addEventListener('blur', () => held.clear());

  function setDisabled(elm: HTMLElement, enabled: boolean): void {
    elm.style.opacity = enabled ? '1' : '0.5';
  }

  function renderItems(hidden: boolean): void {
    items.classList.toggle('gc-hidden', hidden);
    if (hidden) return;
    const lit = state.smokeShots > 0;
    const cigOk = state.phase === 'aim' && state.cigarillos > 0 && !lit;
    const beerOk = state.phase === 'aim' && state.beers > 0 && state.drinkTime < 0;
    cig.classList.toggle('gc-lit', lit);
    cig.style.opacity = cigOk || lit ? '1' : '0.4';
    beer.style.opacity = beerOk ? '1' : '0.4';
    setText(cigN, String(lit ? state.smokeShots : state.cigarillos));
    setText(beerN, String(state.beers));
  }

  // First-swing tutorial: a bubble above the meter that points at where each of the three taps goes.
  function renderTutorial(show: boolean): void {
    const sw = state.swing;
    const step = !show || !tutorialOn ? '' : state.phase === 'aim' ? 'start' : sw.stage === 'power' ? 'power' : sw.stage === 'accuracy' ? 'accuracy' : '';
    help.classList.toggle('gc-hidden', !show || tutorialOn || state.phase !== 'aim');
    swing.classList.toggle('gc-tut-pulse', step === 'start');
    if (step === tutorialStep) return;
    tutorialStep = step;
    tut.classList.toggle('gc-hidden', step === '');
    tutTarget.classList.toggle('gc-hidden', step !== 'power' && step !== 'accuracy');
    tutArrow.classList.toggle('gc-hidden', step !== 'power' && step !== 'accuracy');
    if (step === 'start') {
      tutBox.innerHTML = '<span id="gc-tut-step">HOW TO SWING · 1 OF 3</span>Tap <b>SWING</b> to start. The marker will run along the bar.';
      tutBox.innerHTML += ' <b>➜</b>';
    } else if (step === 'power') {
      tutBox.innerHTML = '<span id="gc-tut-step">2 OF 3 · POWER</span>Tap <b>SWING</b> again when the marker reaches <b>the red line</b> for full power. Earlier = a shorter shot.';
      tutArrow.style.left = `${FULL}%`;
      tutTarget.style.left = `${FULL}%`;
    } else if (step === 'accuracy') {
      tutBox.innerHTML = '<span id="gc-tut-step">3 OF 3 · ACCURACY</span>It swings back. Tap <b>SWING</b> a third time right on <b>this line</b> for a straight shot.';
      tutArrow.style.left = `${LINE}%`;
      tutTarget.style.left = `${LINE}%`;
    }
  }

  function render(): void {
    const s = state;
    const phase = s.phase;
    const aim = phase === 'aim';
    const swinging = phase === 'swing';
    const active = aim || swinging;
    const hidden = phase === 'title' || phase === 'card' || phase === 'final';
    const lie = s.lie;

    if (!aim) bagOpen = false;

    // Club selector and bag list.
    club.classList.toggle('gc-hidden', hidden);
    setDisabled(club, aim);
    bag.classList.toggle('gc-hidden', !bagOpen);
    setText(name, CLUBS[s.club].name);
    setText(range, distText(s.club, lie, 1));
    const d = distanceToPin(s);
    CLUB_ORDER.forEach((c, i) => {
      const est = estimateCarry(c, lie);
      setText(bagRange[i], distText(c, lie, 1));
      setText(bagFlag[i], Math.abs(est - d) <= 0.1 * d ? '⛳' : '');
      bagRows[i].style.background = c === s.club ? 'rgba(255,255,255,0.28)' : 'transparent';
      bagRows[i].setAttribute('aria-selected', c === s.club ? 'true' : 'false');
    });

    // Consumables row and the slow-swing tag on the meter.
    renderItems(hidden);
    smoke.classList.toggle('gc-hidden', s.smokeShots <= 0);

    // Swing button and VIEW.
    swing.classList.toggle('gc-hidden', hidden);
    setDisabled(swing, active);
    actions.classList.toggle('gc-hidden', hidden);
    setDisabled(view, aim);
    setText(view, s.view === 'behind' ? 'TOP' : 'BACK');

    // Meter: shown while aiming or swinging, and briefly after a shot for the result text.
    const flashing = flashT > 0 && flashText !== '';
    const meterOn = !hidden && (active || flashing);
    meter.classList.toggle('gc-hidden', !meterOn);
    if (meterOn) {
      const sw = s.swing;
      if (flashing) {
        setText(dist, flashText);
        dist.style.color = flashColor;
      } else {
        setText(dist, sw.stage === 'idle' ? `Full: ${distText(s.club, lie, 1)}` : sw.stage === 'power' ? distText(s.club, lie, Math.max(0, sw.marker)) : distText(s.club, lie, sw.power));
        dist.style.color = '#fff';
      }
      const showActive = active;
      marker.classList.toggle('gc-hidden', !showActive);
      lock.classList.toggle('gc-hidden', !(showActive && sw.stage === 'accuracy'));
      marker.style.left = `${xOf(sw.marker)}%`;
      lock.style.left = `${xOf(sw.power)}%`;
    }
    renderTutorial(meterOn && !flashing && active);
  }

  return {
    update(dt: number): void {
      if (flashT > 0) flashT -= dt;

      // Keyboard aim while held (aim phase only).
      if (state.phase === 'aim' && held.size > 0) {
        const left = held.has('ArrowLeft');
        const right = held.has('ArrowRight');
        if (left !== right) {
          const rate = shift ? ROT_RATE_SHIFT : state.club === 'PT' ? ROT_RATE_PUTT : ROT_RATE;
          const step = (left ? 1 : -1) * rate * dt; // turning right decreases yaw
          setAim(state, state.aimYaw + step);
        }
      }

      // Swing meter travel.
      if (state.phase === 'swing') {
        const sw = state.swing;
        const scale = meterSpeedScale(state) * (tutorialOn ? TUTORIAL_SPEED : 1); // slower while a cigarillo is lit, and on the tutorial swing
        if (sw.stage === 'power') {
          sw.marker += (dt * scale) / (SWING.riseSeconds * (state.club === 'PT' ? SWING.puttRiseScale : 1));
          if (sw.marker >= SWING.maxPower) {
            sw.marker = SWING.maxPower;
            lockPower();
          }
        } else if (sw.stage === 'accuracy') {
          sw.marker -= (dt * scale * sw.power) / SWING.fallSeconds;
          if (sw.marker <= -0.3) fire(1);
        }
      }

      render();
    },
  };
}
