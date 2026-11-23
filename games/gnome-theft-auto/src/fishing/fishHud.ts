// Fishing HUD (DOM, appended to #ui): the fishing toggle when you can fish, and while fishing a big hold button, the
// charge and tension bars, the bait chip, a stop button and a hint line. 44 px+ targets. Writes the DOM only where a
// value changed. Styled inline (no stylesheet of its own).
import { prefabIconElement } from '@lawn/prefabs';
import { KEYS, keyLabel } from '../keys';
import type { FishInput } from './fishInput';
import type { FishPhase } from './types';

export interface FishHudState {
  /** Show the fishing toggle (not fishing, has a rod, water near or in a stopped boat). */
  canFish: boolean;
  /** Rod out. */
  fishing: boolean;
  phase: FishPhase;
  /** 0..1 cast charge (phase 'charge'). */
  charge: number;
  /** 0..1 line tension (phase 'reel'). */
  tension: number;
  /** 0..1 how far the fish has been reeled in (phase 'reel'). */
  progress: number;
  /** The big button's label, e.g. 'Hold to cast', 'Wait...', 'HOOK!', 'Reel'. */
  label: string;
  baitName: string;
  baitPrefab: string;
  baitEmoji: string;
  /** null = unlimited. */
  baitCount: number | null;
  hint: string | null;
  /** Derby line, or null. */
  derby: string | null;
}

export interface FishHud {
  /** Every frame with the same state object; writes the DOM only where a value changed. */
  update(s: FishHudState): void;
  /** Hide everything (cutscene, menus). */
  setHidden(hidden: boolean): void;
  dispose(): void;
}

const FONT = 'font:600 13px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;color:#f3e9d2;';
const PANEL = 'background:rgba(43,27,14,0.88);border:1px solid #7a9a3a;color:#f3e9d2;';
const BTN = [
  'position:absolute',
  'box-sizing:border-box',
  'margin:0',
  'padding:0',
  'display:none',
  'align-items:center',
  'justify-content:center',
  'font:inherit',
  'cursor:pointer',
  'pointer-events:auto',
  'touch-action:manipulation',
  '-webkit-user-select:none',
  'user-select:none',
  PANEL,
].join(';') + ';';
const TRACK = 'position:relative;overflow:hidden;box-sizing:border-box;background:rgba(0,0,0,0.55);border:1px solid #7a9a3a;border-radius:7px;';
const FILL = 'position:absolute;left:0;top:0;right:0;bottom:0;transform-origin:0 50%;transform:scaleX(0);will-change:transform;';
const TENSION_COLOURS = ['#6bbf4a', '#e0a83a', '#d9473a'];
const SAFE_BAND = 0.6;
const DANGER = 0.85;

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function makeButton(label: string, aria: string, css: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.setAttribute('aria-label', aria);
  b.textContent = label;
  b.style.cssText = BTN + css;
  return b;
}

function makeDiv(css: string): HTMLDivElement {
  const d = document.createElement('div');
  d.style.cssText = css;
  return d;
}

export function createFishHud(ui: HTMLElement, input: FishInput, onJournal: () => void): FishHud {
  const toggleKey = keyLabel(KEYS.fish);
  const jumpKey = keyLabel(KEYS.jump);
  const baitKey = keyLabel(KEYS.fishBait);

  // Phones: the game's own touch buttons (Guns, Reload, Aim, Fire, Jump) fill the bottom right. Fire and Jump do nothing
  // while the rod is out, so the hold button sits right over Fire and the stop button over Jump; the bars go to the left
  // above the button row and the keyboard help is hidden.
  let touch = false;
  try { touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches; } catch { touch = false; }
  const holdBottom = touch ? 52 : 140;
  const stopBottom = touch ? 162 : 246;
  const baitBottom = touch ? 216 : 300;
  const stopRight = touch ? 50 : 24;
  const box = makeDiv(
    'position:fixed;left:0;top:0;right:0;bottom:0;pointer-events:none;z-index:40;' + FONT,
  );
  box.id = 'gta-fish-hud';

  // Keep touches on these buttons from reaching the game's own pointer and touch handlers (a tap here is not a shot).
  const swallow = (e: Event): void => e.stopPropagation();
  box.addEventListener('pointerdown', swallow);
  box.addEventListener('mousedown', swallow);
  box.addEventListener('touchstart', swallow, { passive: true });

  // Idle: the fishing toggle and the journal under it.
  const toggleBtn = makeButton(
    '🎣',
    'Start fishing',
    'right:calc(env(safe-area-inset-right) + 12px);top:45%;width:56px;height:56px;min-width:56px;min-height:56px;border-radius:50%;font-size:26px;',
  );
  const toggleKeyTag = makeDiv(
    'position:absolute;right:-4px;bottom:-4px;min-width:18px;height:18px;padding:0 4px;box-sizing:border-box;border-radius:9px;background:#2b1b0e;border:1px solid #7a9a3a;font:700 11px/16px system-ui,sans-serif;text-align:center;',
  );
  toggleKeyTag.textContent = toggleKey;
  toggleBtn.appendChild(toggleKeyTag);

  const journalBtn = makeButton(
    '📓',
    'Fishing journal',
    'right:calc(env(safe-area-inset-right) + 18px);top:calc(45% + 68px);width:44px;height:44px;min-width:44px;min-height:44px;border-radius:10px;font-size:20px;',
  );

  // Fishing: the big hold button, a stop button and the bait chip stacked above it on the right.
  const holdBtn = makeButton(
    '',
    'Hold to cast, hook and reel',
    'right:calc(env(safe-area-inset-right) + 24px);bottom:calc(env(safe-area-inset-bottom) + ' + holdBottom + 'px);width:96px;height:96px;min-width:96px;min-height:96px;border-radius:50%;font:600 15px/1.15 system-ui,sans-serif;text-align:center;z-index:45;touch-action:none;',
  );

  const stopBtn = makeButton(
    '✕',
    'Put the rod away',
    'right:calc(env(safe-area-inset-right) + ' + stopRight + 'px);bottom:calc(env(safe-area-inset-bottom) + ' + stopBottom + 'px);width:44px;height:44px;min-width:44px;min-height:44px;border-radius:22px;font-size:18px;',
  );

  const baitBtn = makeButton(
    '',
    'Next bait',
    'right:calc(env(safe-area-inset-right) + 24px);bottom:calc(env(safe-area-inset-bottom) + ' + baitBottom + 'px);height:44px;min-width:44px;padding:0 14px;border-radius:22px;gap:8px;white-space:nowrap;',
  );
  const baitIcon = makeDiv('display:inline-flex;align-items:center;justify-content:center;');
  const baitText = document.createElement('span');
  baitBtn.appendChild(baitIcon);
  baitBtn.appendChild(baitText);

  // Bars, centred at the bottom above the key help.
  const bars = makeDiv(
    (touch
      ? 'position:absolute;left:calc(env(safe-area-inset-left) + 16px);bottom:calc(env(safe-area-inset-bottom) + 250px);width:min(320px,55vw);'
      : 'position:absolute;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom) + 96px);width:min(320px,70vw);')
      + 'display:none;flex-direction:column;gap:6px;pointer-events:none;',
  );

  const chargeRow = makeDiv('display:none;flex-direction:column;gap:3px;');
  const chargeLabel = makeDiv('font:600 11px/1 system-ui,sans-serif;color:#f3e9d2;text-shadow:0 1px 2px #000;');
  chargeLabel.textContent = 'Cast power';
  const chargeTrack = makeDiv(TRACK + 'height:14px;');
  const chargeFill = makeDiv(FILL + 'background:#e8c24a;');
  chargeTrack.appendChild(chargeFill);
  chargeRow.appendChild(chargeLabel);
  chargeRow.appendChild(chargeTrack);

  const reelRow = makeDiv('display:none;flex-direction:column;gap:3px;');
  const tensionLabel = makeDiv('font:600 11px/1 system-ui,sans-serif;color:#f3e9d2;text-shadow:0 1px 2px #000;');
  tensionLabel.textContent = 'Line tension';
  const tensionTrack = makeDiv(TRACK + 'height:14px;');
  const safeBand = makeDiv(
    'position:absolute;left:0;top:0;bottom:0;width:' + SAFE_BAND * 100 + '%;background:rgba(122,154,58,0.22);',
  );
  const safeEdge = makeDiv(
    'position:absolute;left:' + SAFE_BAND * 100 + '%;top:-3px;bottom:-3px;width:2px;background:#f3e9d2;opacity:0.8;',
  );
  const dangerEdge = makeDiv(
    'position:absolute;left:' + DANGER * 100 + '%;top:-3px;bottom:-3px;width:2px;background:#d9473a;opacity:0.8;',
  );
  const tensionFill = makeDiv(FILL + 'background:' + TENSION_COLOURS[0] + ';');
  tensionTrack.appendChild(safeBand);
  tensionTrack.appendChild(tensionFill);
  tensionTrack.appendChild(safeEdge);
  tensionTrack.appendChild(dangerEdge);
  const progressTrack = makeDiv(TRACK + 'height:6px;');
  const progressFill = makeDiv(FILL + 'background:#9ec5e8;');
  progressTrack.appendChild(progressFill);
  reelRow.appendChild(tensionLabel);
  reelRow.appendChild(tensionTrack);
  reelRow.appendChild(progressTrack);

  bars.appendChild(chargeRow);
  bars.appendChild(reelRow);

  // Key help, under the bars.
  const helpLine = makeDiv(
    'position:absolute;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom) + 70px);width:max-content;max-width:min(360px,92vw);display:none;text-align:center;font:500 11px/1.3 system-ui,sans-serif;color:#d9cfb4;text-shadow:0 1px 2px #000;pointer-events:none;',
  );
  helpLine.textContent =
    `Hold ${jumpKey} / click / A to cast & reel · ${baitKey} / LB bait · ${toggleKey} / B put away`;

  // Derby and hint lines, centred near the top (derby above the hint).
  const topCol = makeDiv(
    'position:absolute;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top) + 64px);display:none;flex-direction:column;align-items:center;gap:6px;max-width:92vw;pointer-events:none;',
  );
  const derbyLine = makeDiv(
    'padding:6px 12px;border-radius:8px;white-space:nowrap;' + PANEL,
  );
  const hintLine = makeDiv(
    'padding:6px 12px;border-radius:8px;text-align:center;' + PANEL,
  );
  topCol.appendChild(derbyLine);
  topCol.appendChild(hintLine);

  box.appendChild(toggleBtn);
  box.appendChild(journalBtn);
  box.appendChild(holdBtn);
  box.appendChild(stopBtn);
  box.appendChild(baitBtn);
  box.appendChild(bars);
  box.appendChild(helpLine);
  box.appendChild(topCol);
  ui.appendChild(box);

  // Input wiring.
  let held = false;
  const setHeld = (down: boolean): void => {
    if (held === down) return;
    held = down;
    input.setHudHold(down);
  };
  const release = (): void => setHeld(false);

  holdBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try {
      holdBtn.setPointerCapture(e.pointerId);
    } catch {
      /* no capture: the pointer still ends on pointerup */
    }
    setHeld(true);
  });
  holdBtn.addEventListener('pointerup', release);
  holdBtn.addEventListener('pointercancel', release);
  holdBtn.addEventListener('lostpointercapture', release);

  toggleBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    input.hudToggle();
  });
  stopBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    release();
    input.hudClose();
  });
  baitBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    input.hudBait();
  });
  journalBtn.addEventListener('click', () => onJournal());

  // Cache of the last values written (sentinels force the first write).
  const c = {
    toggleOn: null as boolean | null,
    journalOn: null as boolean | null,
    fishing: null as boolean | null,
    label: null as string | null,
    pulse: null as boolean | null,
    baitPrefab: null as string | null,
    baitEmoji: null as string | null,
    baitName: null as string | null,
    baitCount: undefined as number | null | undefined,
    chargeRow: null as boolean | null,
    charge: -1,
    reelRow: null as boolean | null,
    tension: -1,
    tensionBucket: -1,
    progress: -1,
    derby: null as string | null,
    hint: null as string | null,
    topOn: null as boolean | null,
  };

  const update = (s: FishHudState): void => {
    const toggleOn = s.canFish && !s.fishing;
    if (toggleOn !== c.toggleOn) {
      c.toggleOn = toggleOn;
      toggleBtn.style.display = toggleOn ? 'flex' : 'none';
    }
    const journalOn = toggleOn || s.fishing;
    if (journalOn !== c.journalOn) {
      c.journalOn = journalOn;
      journalBtn.style.display = journalOn ? 'flex' : 'none';
    }

    if (s.fishing !== c.fishing) {
      c.fishing = s.fishing;
      const d = s.fishing ? 'flex' : 'none';
      holdBtn.style.display = d;
      stopBtn.style.display = d;
      baitBtn.style.display = d;
      bars.style.display = s.fishing ? 'flex' : 'none';
      helpLine.style.display = s.fishing && !touch ? 'block' : 'none';
      if (!s.fishing) release();
    }

    if (s.label !== c.label) {
      c.label = s.label;
      holdBtn.textContent = s.label;
    }
    const pulse = s.phase === 'bite';
    if (pulse !== c.pulse) {
      c.pulse = pulse;
      holdBtn.style.animation = pulse ? 'gta-fish-pulse 0.6s ease-in-out infinite' : 'none';
    }

    if (s.baitPrefab !== c.baitPrefab || s.baitEmoji !== c.baitEmoji) {
      c.baitPrefab = s.baitPrefab;
      c.baitEmoji = s.baitEmoji;
      baitIcon.replaceChildren(prefabIconElement(s.baitPrefab, s.baitEmoji, 24));
    }
    if (s.baitName !== c.baitName || s.baitCount !== c.baitCount) {
      c.baitName = s.baitName;
      c.baitCount = s.baitCount;
      baitText.textContent = s.baitCount === null ? s.baitName : `${s.baitName} x${s.baitCount}`;
    }

    const chargeOn = s.fishing && s.phase === 'charge';
    if (chargeOn !== c.chargeRow) {
      c.chargeRow = chargeOn;
      chargeRow.style.display = chargeOn ? 'flex' : 'none';
    }
    if (s.charge !== c.charge) {
      c.charge = s.charge;
      chargeFill.style.transform = `scaleX(${clamp01(s.charge)})`;
    }

    const reelOn = s.fishing && s.phase === 'reel';
    if (reelOn !== c.reelRow) {
      c.reelRow = reelOn;
      reelRow.style.display = reelOn ? 'flex' : 'none';
    }
    if (s.tension !== c.tension) {
      c.tension = s.tension;
      const t = clamp01(s.tension);
      tensionFill.style.transform = `scaleX(${t})`;
      const bucket = t < SAFE_BAND ? 0 : t < DANGER ? 1 : 2;
      if (bucket !== c.tensionBucket) {
        c.tensionBucket = bucket;
        tensionFill.style.background = TENSION_COLOURS[bucket];
      }
    }
    if (s.progress !== c.progress) {
      c.progress = s.progress;
      progressFill.style.transform = `scaleX(${clamp01(s.progress)})`;
    }

    if (s.derby !== c.derby) {
      c.derby = s.derby;
      derbyLine.textContent = s.derby ?? '';
      derbyLine.style.display = s.derby ? 'block' : 'none';
    }
    if (s.hint !== c.hint) {
      c.hint = s.hint;
      hintLine.textContent = s.hint ?? '';
      hintLine.style.display = s.hint ? 'block' : 'none';
    }
    const topOn = !!s.derby || !!s.hint;
    if (topOn !== c.topOn) {
      c.topOn = topOn;
      topCol.style.display = topOn ? 'flex' : 'none';
    }
  };

  // Pulse keyframes for the bite (one style element, inside our own container).
  const style = document.createElement('style');
  style.textContent = '@keyframes gta-fish-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}';
  box.appendChild(style);

  return {
    update,

    setHidden(hidden: boolean): void {
      box.style.display = hidden ? 'none' : '';
      if (hidden) release();
    },

    dispose(): void {
      release();
      box.remove();
    },
  };
}
