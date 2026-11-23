// Phone controls: a floating move stick (left), look-drag (anywhere else) and round buttons (bottom-right, VIEW top-right).
// Multi-touch by pointerId. Input.ts merges read() with the keyboard, so zeros are harmless.
import { CAMERA, DOM, LAYOUT } from '../config';
import type { InputState, TouchSource } from '../game/types';

const STICK_BASE_PX = 120;
const STICK_KNOB_PX = 56;
const STICK_TRAVEL = 60;       // knob travel from the base centre, px
const SPRINT_AT = 0.9;         // knob past 90% of travel = sprint
const LOOK_GAIN = 1.6;
const BIG = 60;                // standard round button, px
const HIT = 72;                // attack button, px

const CSS = `
#${DOM.touch} { position: absolute; inset: 0; pointer-events: none; touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; z-index: 20; }
#${DOM.touch}.dayg-touch-off { display: none; }
#${DOM.touch} .dt-zone { position: absolute; inset: 0; pointer-events: auto; touch-action: none; }
#${DOM.touch} .dt-base, #${DOM.touch} .dt-knob { position: absolute; left: 0; top: 0; display: none; border-radius: 50%; box-sizing: border-box; pointer-events: none; transform: translate(-50%, -50%); }
#${DOM.touch} .dt-base { width: ${STICK_BASE_PX}px; height: ${STICK_BASE_PX}px; background: rgba(255,255,255,.15); border: 2px solid rgba(255,255,255,.8); }
#${DOM.touch} .dt-knob { width: ${STICK_KNOB_PX}px; height: ${STICK_KNOB_PX}px; background: rgba(255,255,255,.6); }
#${DOM.touch} .dt-base.dt-show, #${DOM.touch} .dt-knob.dt-show { display: block; }
#${DOM.touch} .dt-btn { position: absolute; display: flex; align-items: center; justify-content: center; box-sizing: border-box; border-radius: 50%; pointer-events: auto; touch-action: none; user-select: none; -webkit-user-select: none; font: 700 13px/1 system-ui, sans-serif; color: #fff; background: rgba(20,28,20,.6); border: 2px solid rgba(255,255,255,.55); transition: transform .05s, filter .05s; }
#${DOM.touch} .dt-btn.dt-pressed { transform: scale(.92); filter: brightness(1.35); }
#${DOM.touch} .dt-btn.dt-hint { background: rgba(255,213,79,.85); color: #222; border-color: #fff3c4; box-shadow: 0 0 14px 4px rgba(255,213,79,.7); }
#${DOM.touch} .dt-view { font-size: 11px; }
`;

function injectStyle(): void {
  if (document.getElementById('dayg-touch-style')) return;
  const style = document.createElement('style');
  style.id = 'dayg-touch-style';
  style.textContent = CSS;
  document.head.appendChild(style);
}

type Edge = 'crouch' | 'action' | 'attack' | 'climb' | 'inventory' | 'view' | 'map';
type Pointer = { kind: 'stick' } | { kind: 'look'; lastX: number; lastY: number };

export function createTouchControls(ui: HTMLElement): TouchSource {
  injectStyle();
  const root = document.createElement('div');
  root.id = DOM.touch;
  ui.appendChild(root);

  const zone = document.createElement('div');
  zone.className = 'dt-zone';
  const base = document.createElement('div');
  base.className = 'dt-base';
  const knob = document.createElement('div');
  knob.className = 'dt-knob';
  root.append(zone, base, knob);

  // Shown on coarse pointers, with ?touch=1, or after the first touch.
  const forced = new URLSearchParams(location.search).get('touch') === '1';
  let enabled = forced || (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches);
  let wanted = true;

  const moves = { moveX: 0, moveZ: 0, sprint: false };
  let look = { x: 0, y: 0 };
  const edges = new Set<Edge>();
  const pointers = new Map<number, Pointer>();
  let stickId: number | null = null;
  let climbHint = false;

  const refresh = (): void => {
    root.classList.toggle('dayg-touch-off', !(enabled && wanted));
  };
  const onFirstTouch = (): void => {
    enabled = true;
    refresh();
  };
  window.addEventListener('touchstart', onFirstTouch, { once: true, passive: true });

  const resetStick = (): void => {
    stickId = null;
    moves.moveX = 0; moves.moveZ = 0; moves.sprint = false;
    base.classList.remove('dt-show');
    knob.classList.remove('dt-show');
  };

  const placeStick = (x: number, y: number): void => {
    base.style.left = `${x}px`; base.style.top = `${y}px`;
    knob.style.left = `${x}px`; knob.style.top = `${y}px`;
    base.classList.add('dt-show');
    knob.classList.add('dt-show');
  };

  const moveStick = (x: number, y: number): void => {
    const bx = parseFloat(base.style.left), by = parseFloat(base.style.top);
    let dx = x - bx, dy = y - by;
    const len = Math.hypot(dx, dy);
    if (len > STICK_TRAVEL) { dx = (dx / len) * STICK_TRAVEL; dy = (dy / len) * STICK_TRAVEL; }
    knob.style.left = `${bx + dx}px`;
    knob.style.top = `${by + dy}px`;
    moves.moveX = dx / STICK_TRAVEL;
    moves.moveZ = -dy / STICK_TRAVEL;   // up on screen = forward
    moves.sprint = Math.hypot(dx, dy) >= STICK_TRAVEL * SPRINT_AT;
  };

  zone.addEventListener('pointerdown', (e) => {
    if (!enabled || !wanted) return;
    const inStickZone = e.clientX < window.innerWidth * LAYOUT.stickZone && e.clientY >= window.innerHeight * 0.4;
    zone.setPointerCapture(e.pointerId);
    if (inStickZone && stickId === null) {
      stickId = e.pointerId;
      pointers.set(e.pointerId, { kind: 'stick' });
      placeStick(e.clientX, e.clientY);
      moveStick(e.clientX, e.clientY);
    } else {
      pointers.set(e.pointerId, { kind: 'look', lastX: e.clientX, lastY: e.clientY });
    }
    e.preventDefault();
  });
  zone.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    if (p.kind === 'stick') {
      moveStick(e.clientX, e.clientY);
    } else {
      const dx = e.clientX - p.lastX, dy = e.clientY - p.lastY;
      p.lastX = e.clientX; p.lastY = e.clientY;
      look.x += dx * CAMERA.lookSensitivity * LOOK_GAIN;
      look.y += dy * CAMERA.lookSensitivity * LOOK_GAIN;
    }
  });
  const endPointer = (e: PointerEvent): void => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    pointers.delete(e.pointerId);
    if (p.kind === 'stick' && stickId === e.pointerId) resetStick();
  };
  zone.addEventListener('pointerup', endPointer);
  zone.addEventListener('pointercancel', endPointer);

  // Buttons: each press queues one edge; read() hands it out once.
  const button = (cls: string, label: string, size: number, edge: Edge | null, pos: { right?: string; bottom?: string; top?: string; left?: string }, aria: string): HTMLButtonElement => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `dt-btn ${cls}`;
    b.textContent = label;
    b.setAttribute('aria-label', aria);
    b.style.width = `${size}px`;
    b.style.height = `${size}px`;
    Object.assign(b.style, pos);
    const down = (e: PointerEvent): void => {
      e.preventDefault();
      e.stopPropagation();
      b.classList.add('dt-pressed');
      if (edge) edges.add(edge);
    };
    const up = (): void => b.classList.remove('dt-pressed');
    b.addEventListener('pointerdown', down);
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('pointerleave', up);
    root.appendChild(b);
    return b;
  };

  // Bottom-right block, BLOCK_W x BLOCK_H, anchored to the safe-area corner. (x, y) is
  // measured from the block's top-left; the button is w x h. Wide enough that CROUCH fits.
  const BLOCK_W = 212;
  const BLOCK_H = 252;
  const blockRight = 'calc(env(safe-area-inset-right, 0px) + 12px)';
  const blockBottom = 'calc(env(safe-area-inset-bottom, 0px) + 12px)';
  const blockPos = (x: number, y: number, w: number, h: number): { right: string; bottom: string } => ({
    right: `calc(${blockRight} + ${BLOCK_W - x - w}px)`,
    bottom: `calc(${blockBottom} + ${BLOCK_H - y - h}px)`,
  });

  button('dt-act', 'ACT', BIG, 'action', blockPos(0, 0, BIG, BIG), 'Act');
  button('dt-pack', 'PACK', BIG, 'inventory', blockPos(68, 0, BIG, BIG), 'Pack');
  button('dt-map', 'MAP', BIG, 'map', blockPos(68, 80, BIG, BIG), 'World map');
  const crouchBtn = button('dt-crouch', 'CROUCH', BIG, 'crouch', blockPos(136, 0, 76, BIG), 'Crouch');
  crouchBtn.style.width = '76px';
  crouchBtn.style.borderRadius = '30px';
  const upBtn = button('dt-up', 'UP', BIG, 'climb', blockPos(0, 80, BIG, BIG), 'Climb');
  button('dt-hit', 'HIT', HIT, 'attack', blockPos(140, 180, HIT, HIT), 'Hit');
  // VIEW: 48 px, under the HUD clock row.
  button('dt-view dt-view-btn', 'VIEW', 48, 'view', {
    right: `calc(env(safe-area-inset-right, 0px) + 12px)`,
    top: `calc(env(safe-area-inset-top, 0px) + ${LAYOUT.topBar + 8}px)`,
  }, 'Toggle view');

  refresh();

  return {
    root,
    read(): Partial<InputState> {
      const out: Partial<InputState> = {
        moveX: moves.moveX, moveZ: moves.moveZ, sprint: moves.sprint,
        lookX: look.x, lookY: look.y,
        crouch: edges.has('crouch'), action: edges.has('action'), attack: edges.has('attack'),
        climb: edges.has('climb'), inventory: edges.has('inventory'), view: edges.has('view'), map: edges.has('map'),
      };
      look = { x: 0, y: 0 };
      edges.clear();
      return out;
    },
    setVisible(on: boolean): void {
      wanted = on;
      if (!on) {
        resetStick();
        pointers.clear();
        look = { x: 0, y: 0 };
        edges.clear();
      }
      refresh();
    },
    setClimbHint(on: boolean): void {
      if (on === climbHint) return;
      climbHint = on;
      upBtn.classList.toggle('dt-hint', on);
    },
    active: () => enabled,
  };
}
