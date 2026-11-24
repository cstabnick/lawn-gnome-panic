// Birding: the DOM for the scope and HUD: the HUD row (binoculars, journal, life-list pill, hint), the binocular
// overlay (vignette, lens rings, reticle, zoom and target labels, touch buttons), call arrows at the screen edge and
// the shutter flash. One container (#gta-birding-ui) appended to the shared #ui. Styled inline, like huntHud.ts.
// The binoculars button lives in the dock; the field journal is a More menu action.
import { registerAction } from '../ui/actions';
import { dockButton } from '../ui/dock';
import { fillHint } from '../ui/glyphs';

export interface ScopeUiHandlers {
  /** The binocular button went down / up (pointer events). */
  onScopeDown(): void;
  onScopeUp(): void;
  onZoom(): void;
  onSnap(): void;
  /** The overlay's Done button. */
  onLower(): void;
  onJournal(): void;
}

export interface ScopeHudState {
  /** Show the HUD row (on foot, nothing else open). */
  visible: boolean;
  /** Species seen / species in the table. */
  seen: number;
  total: number;
  /** A milestone waits at the hide. */
  claimable: boolean;
  /** 'Calm', 'Breezy' or 'Blustery'. */
  wind: string;
  /** One short line, or null. */
  hint: string | null;
}

export interface ScopeTarget {
  /** Species name, or '???' while it is being made out for the first time. */
  label: string;
  /** 0..1 spotting progress (1 = on the list). */
  progress: number;
  /** In the photo cone. */
  centred: boolean;
}

export interface ScopeUi {
  setHud(s: ScopeHudState): void;
  setViewing(v: boolean): void;
  setTarget(t: ScopeTarget | null): void;
  setZoom(label: string): void;
  /** A call was heard: an arrow at the screen edge toward `bearing` (0 = ahead, + = right) for 2.5 s. known = species already seen. */
  showCall(bearing: number, known: boolean): void;
  /** The shutter flash. */
  flash(): void;
  update(dt: number): void;
  setHidden(hidden: boolean): void;
}

const PANEL = 'rgba(20,40,38,0.88)';
const EDGE = '#5a9a8a';
const TEXT = '#f3e9d2';
const GOLD = '#f2c230';
const SPOT = '#9fd6c4';
const FONT = 'font:600 13px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif';
const RING_R = 15;
const RING_C = 2 * Math.PI * RING_R;
const ARROW_TIME = 2.5;
const ARROW_SLOTS = 4;
const FLASH_TIME = 0.25;
const SVG_NS = 'http://www.w3.org/2000/svg';

function makeDiv(css: string, text?: string): HTMLDivElement {
  const d = document.createElement('div');
  d.style.cssText = css;
  if (text !== undefined) d.textContent = text;
  return d;
}

/** A button that takes its own touches and stops them reaching the game (joystick, shooting). */
function makeButton(text: string, aria: string, css: string, onPress: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = text;
  b.setAttribute('aria-label', aria);
  b.style.cssText = [
    'min-width:44px',
    'min-height:44px',
    'padding:0 12px',
    'border-radius:10px',
    `border:1px solid ${EDGE}`,
    `background:${PANEL}`,
    `color:${TEXT}`,
    'font-size:20px',
    'line-height:1',
    'cursor:pointer',
    'pointer-events:auto',
    'touch-action:manipulation',
    css,
  ].join(';') + ';';
  b.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    onPress();
  });
  b.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
  return b;
}

export function createScopeUi(ui: HTMLElement, handlers: ScopeUiHandlers): ScopeUi {
  const root = document.createElement('div');
  root.id = 'gta-birding-ui';
  root.style.cssText = 'pointer-events:none;';
  ui.appendChild(root);

  let hudVisible = false;
  let viewing = false;
  let hidden = false;

  // HUD row: binoculars, journal, life-list pill, wind, hint.
  const row = makeDiv([
    'position:fixed',
    'left:calc(env(safe-area-inset-left) + 12px)',
    'top:calc(env(safe-area-inset-top) + 268px)',
    'z-index:40',
    'display:none',
    'flex-direction:column',
    'align-items:flex-start',
    'gap:4px',
    'pointer-events:none',
    FONT,
    `color:${TEXT}`,
  ].join(';') + ';');
  const rowButtons = makeDiv('display:flex;align-items:center;gap:6px;');

  // Binoculars: pointer down starts the look, up (or cancel) ends it. Held with capture so a drag off the button still ends.
  const scopeBtn = makeButton('🔭', 'Binoculars (hold or tap, V)', 'width:44px;height:44px;padding:0;touch-action:none;', () => {
    handlers.onScopeDown();
  });
  scopeBtn.addEventListener('pointerdown', (e) => {
    try {
      scopeBtn.setPointerCapture(e.pointerId);
    } catch {
      // Capture is best effort; pointerup and pointercancel still arrive for most input.
    }
  });
  scopeBtn.addEventListener('pointerup', (e) => {
    e.stopPropagation();
    handlers.onScopeUp();
  });
  scopeBtn.addEventListener('pointercancel', () => handlers.onScopeUp());
  dockButton(scopeBtn, 'binoculars');

  registerAction('birdJournal', { run: () => handlers.onJournal() });

  const pill = makeDiv(`padding:6px 12px;border-radius:999px;background:${PANEL};border:1px solid ${EDGE};white-space:nowrap;`);
  rowButtons.append(pill);

  const hintEl = makeDiv('max-width:240px;padding:4px 8px;border-radius:6px;background:rgba(0,0,0,0.55);font-weight:400;font-size:12px;display:none;');
  row.append(rowButtons, hintEl);
  root.appendChild(row);

  let lastSeen = -1;
  let lastTotal = -1;
  let lastClaim = false;
  let lastWind = '';
  let lastHint: string | null | undefined = undefined;

  // Overlay: vignette, two lens rings, reticle, labels, touch buttons.
  const overlay = makeDiv('position:fixed;inset:0;pointer-events:none;z-index:35;display:none;');
  overlay.append(
    makeDiv('position:absolute;inset:0;background:radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.92) 62%);'),
    makeDiv('position:absolute;left:calc(50% - 9vmin);top:50%;width:62vmin;height:62vmin;transform:translate(-50%,-50%);border-radius:50%;border:2px solid rgba(20,20,20,0.9);'),
    makeDiv('position:absolute;left:calc(50% + 9vmin);top:50%;width:62vmin;height:62vmin;transform:translate(-50%,-50%);border-radius:50%;border:2px solid rgba(20,20,20,0.9);'),
    makeDiv('position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);color:rgba(255,255,255,0.8);font:300 28px/1 system-ui,sans-serif;', '+'),
  );

  const zoomEl = makeDiv([
    'position:absolute',
    'left:50%',
    'top:calc(env(safe-area-inset-top) + 12px)',
    'transform:translateX(-50%)',
    `background:${PANEL}`,
    `color:${TEXT}`,
    'padding:4px 12px',
    'border-radius:999px',
    'white-space:nowrap',
    FONT,
  ].join(';') + ';');
  overlay.appendChild(zoomEl);
  let lastZoom: string | null = null;

  // Target label: name plus a progress ring.
  const targetEl = makeDiv([
    'position:absolute',
    'left:50%',
    'top:calc(50% + 40px)',
    'transform:translateX(-50%)',
    'display:none',
    'align-items:center',
    'gap:8px',
    `color:${TEXT}`,
    `background:${PANEL}`,
    'padding:4px 10px 4px 4px',
    'border-radius:999px',
    'white-space:nowrap',
    FONT,
  ].join(';') + ';');
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', '36');
  svg.setAttribute('height', '36');
  svg.setAttribute('viewBox', '0 0 36 36');
  const track = document.createElementNS(SVG_NS, 'circle');
  track.setAttribute('cx', '18');
  track.setAttribute('cy', '18');
  track.setAttribute('r', String(RING_R));
  track.setAttribute('fill', 'none');
  track.setAttribute('stroke', 'rgba(255,255,255,0.25)');
  track.setAttribute('stroke-width', '3');
  const arc = document.createElementNS(SVG_NS, 'circle');
  arc.setAttribute('cx', '18');
  arc.setAttribute('cy', '18');
  arc.setAttribute('r', String(RING_R));
  arc.setAttribute('fill', 'none');
  arc.setAttribute('stroke', SPOT);
  arc.setAttribute('stroke-width', '3');
  arc.setAttribute('stroke-linecap', 'round');
  arc.setAttribute('stroke-dasharray', String(RING_C));
  arc.setAttribute('stroke-dashoffset', String(RING_C));
  arc.setAttribute('transform', 'rotate(-90 18 18)');
  svg.append(track, arc);
  const targetName = document.createElement('span');
  targetEl.append(svg, targetName);
  overlay.appendChild(targetEl);
  let lastTargetLabel: string | null = null;
  let lastProgress = -1;
  let lastCentred: boolean | null = null;
  let targetShown = false;

  // Touch buttons (bottom centre) and the desktop help line.
  const touchRow = makeDiv([
    'position:absolute',
    'left:50%',
    'bottom:calc(env(safe-area-inset-bottom) + 24px)',
    'transform:translateX(-50%)',
    'display:flex',
    'gap:12px',
    'pointer-events:none',
  ].join(';') + ';');
  const big = 'min-width:56px;min-height:56px;padding:0 14px;font-size:18px;font-weight:600;';
  touchRow.append(
    makeButton('Zoom', 'Zoom', big, () => handlers.onZoom()),
    makeButton('📷', 'Snap photo', big, () => handlers.onSnap()),
    makeButton('Done', 'Done looking', big, () => handlers.onLower()),
  );
  overlay.appendChild(touchRow);
  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  // Filled with the current glyphs each time the scope opens (setViewing).
  let helpEl: HTMLDivElement | null = null;
  if (!coarse) {
    helpEl = makeDiv([
      'position:absolute',
      'left:50%',
      'bottom:calc(env(safe-area-inset-bottom) + 92px)',
      'transform:translateX(-50%)',
      'padding:4px 8px',
      'border-radius:6px',
      'background:rgba(0,0,0,0.5)',
      'color:#ddd',
      'font-size:12px',
      'white-space:nowrap',
      'pointer-events:none',
    ].join(';') + ';');
    overlay.appendChild(helpEl);
  }
  root.appendChild(overlay);

  // Call arrows: a fixed pool, reused round-robin. Each fades over ARROW_TIME.
  interface Arrow {
    box: HTMLDivElement;
    glyph: HTMLSpanElement;
    label: HTMLSpanElement;
    left: number;
    known: boolean;
  }
  const arrows: Arrow[] = [];
  for (let i = 0; i < ARROW_SLOTS; i++) {
    const box = makeDiv([
      'position:fixed',
      'z-index:36',
      'display:none',
      'transform:translate(-50%,-50%)',
      'text-align:center',
      `color:${TEXT}`,
      'text-shadow:0 1px 3px rgba(0,0,0,0.8)',
      'pointer-events:none',
    ].join(';') + ';');
    const glyph = document.createElement('span');
    glyph.style.cssText = 'display:block;font-size:18px;line-height:1;';
    glyph.textContent = '▲';
    const label = document.createElement('span');
    label.style.cssText = 'display:block;font-size:13px;line-height:1.2;font-weight:600;';
    box.append(glyph, label);
    root.appendChild(box);
    arrows.push({ box, glyph, label, left: 0, known: false });
  }
  let nextArrow = 0;

  // Shutter flash.
  const flashEl = makeDiv('position:fixed;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:50;display:none;');
  root.appendChild(flashEl);
  let flashLeft = 0;

  function applyLayout(): void {
    const rootDisp = hidden ? 'none' : 'block';
    if (root.style.display !== rootDisp) root.style.display = rootDisp;
    const rowDisp = hudVisible && !viewing ? 'flex' : 'none';
    if (row.style.display !== rowDisp) row.style.display = rowDisp;
    const scopeDisp = hudVisible && !viewing ? '' : 'none';
    if (scopeBtn.style.display !== scopeDisp) scopeBtn.style.display = scopeDisp;
    const ovDisp = viewing ? 'block' : 'none';
    if (overlay.style.display !== ovDisp) overlay.style.display = ovDisp;
  }
  applyLayout();

  return {
    setHud(s: ScopeHudState): void {
      hudVisible = s.visible;
      applyLayout();
      if (s.seen !== lastSeen || s.total !== lastTotal || s.claimable !== lastClaim || s.wind !== lastWind) {
        lastSeen = s.seen;
        lastTotal = s.total;
        lastClaim = s.claimable;
        lastWind = s.wind;
        pill.textContent = `${s.seen}/${s.total}${s.claimable ? ' ★' : ''} · ${s.wind}`;
      }
      if (s.hint !== lastHint) {
        lastHint = s.hint;
        if (s.hint) {
          hintEl.textContent = s.hint;
          hintEl.style.display = '';
        } else {
          hintEl.style.display = 'none';
        }
      }
    },

    setViewing(v: boolean): void {
      if (v && !viewing && helpEl) helpEl.textContent = fillHint('{look} look · wheel zoom · {fire} snap · {binoculars} lower');
      viewing = v;
      applyLayout();
    },

    setTarget(t: ScopeTarget | null): void {
      if (!t) {
        if (targetShown) {
          targetShown = false;
          targetEl.style.display = 'none';
        }
        lastTargetLabel = null;
        return;
      }
      if (!targetShown) {
        targetShown = true;
        targetEl.style.display = 'flex';
      }
      if (t.label !== lastTargetLabel) {
        lastTargetLabel = t.label;
        targetName.textContent = t.label;
      }
      const p = t.progress < 0 ? 0 : t.progress > 1 ? 1 : t.progress;
      if (p !== lastProgress) {
        lastProgress = p;
        arc.setAttribute('stroke-dashoffset', String(RING_C * (1 - p)));
      }
      if (t.centred !== lastCentred) {
        lastCentred = t.centred;
        arc.setAttribute('stroke', t.centred ? GOLD : SPOT);
      }
    },

    setZoom(label: string): void {
      if (label !== lastZoom) {
        lastZoom = label;
        zoomEl.textContent = label;
      }
    },

    showCall(bearing: number, known: boolean): void {
      const arrow = arrows[nextArrow];
      nextArrow = (nextArrow + 1) % ARROW_SLOTS;
      const sin = Math.sin(bearing);
      const cos = Math.cos(bearing);
      arrow.box.style.left = `calc(50% + ${(sin * 42).toFixed(2)}vw)`;
      arrow.box.style.top = `calc(50% - ${(cos * 40).toFixed(2)}vh)`;
      arrow.glyph.style.transform = `rotate(${((bearing * 180) / Math.PI).toFixed(1)}deg)`;
      const text = known ? '♪' : '♪ ?';
      if (arrow.label.textContent !== text) arrow.label.textContent = text;
      arrow.known = known;
      arrow.left = ARROW_TIME;
      arrow.box.style.opacity = '1';
      arrow.box.style.display = 'block';
    },

    flash(): void {
      flashLeft = FLASH_TIME;
      flashEl.style.display = 'block';
      flashEl.style.opacity = '0.8';
    },

    update(dt: number): void {
      for (let i = 0; i < arrows.length; i++) {
        const a = arrows[i];
        if (a.left <= 0) continue;
        a.left -= dt;
        if (a.left <= 0) {
          a.left = 0;
          a.box.style.display = 'none';
        } else {
          a.box.style.opacity = (a.left / ARROW_TIME).toFixed(2);
        }
      }
      if (flashLeft > 0) {
        flashLeft -= dt;
        if (flashLeft <= 0) {
          flashLeft = 0;
          flashEl.style.display = 'none';
        } else {
          flashEl.style.opacity = (0.8 * (flashLeft / FLASH_TIME)).toFixed(2);
        }
      }
    },

    setHidden(h: boolean): void {
      hidden = h;
      applyLayout();
    },
  };
}
