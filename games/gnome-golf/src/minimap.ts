// Top-down map of the current hole, top-right corner. Rotated so the tee is at the bottom and the green at the top.
// Shows the pin, the tee, the ball and (while aiming) a dashed aim line to the selected club's landing point.
// Tapping the map toggles the camera between behind and overhead during 'aim'.
import { HOLES, LOOK, type Ctx, type GameState, type HoleDef, type Lie, type System } from './config';
import { lieAt } from './course';
import { previewLanding } from './physics';

const MAP_W = 110;
const MAP_H = 150;
/** Yards of margin around the hole's bounding box. */
const PAD = 40;
const MAX_DPR = 2;
const TAU = Math.PI * 2;

const LIE_COLOUR: Record<Lie, number> = {
  tee: LOOK.tee,
  fairway: LOOK.fairway,
  fringe: LOOK.fringe,
  rough: LOOK.rough,
  sand: LOOK.sand,
  green: LOOK.green,
  water: LOOK.pond,
};

interface Pt { x: number; z: number }
interface Px { x: number; y: number }

/** Map projection for one hole. Frame: S = across (right of travel), F = along (tee -> green). */
interface Frame {
  tee: Pt;
  sa: number;
  ca: number;
  cs: number;
  cf: number;
  /** Backing pixels per yard. */
  k: number;
}

function buildFrame(hole: HoleDef, w: number, h: number): Frame {
  // Yaw from tee to green: forward = (sin a, cos a), right = (-cos a, sin a).
  const a = Math.atan2(hole.green.x - hole.tee.x, hole.green.z - hole.tee.z);
  const sa = Math.sin(a);
  const ca = Math.cos(a);
  const pts: Pt[] = [...hole.path, hole.tee, { x: hole.green.x, z: hole.green.z }];
  let minS = Infinity;
  let maxS = -Infinity;
  let minF = Infinity;
  let maxF = -Infinity;
  for (const p of pts) {
    const rx = p.x - hole.tee.x;
    const rz = p.z - hole.tee.z;
    const s = -rx * ca + rz * sa;
    const f = rx * sa + rz * ca;
    minS = Math.min(minS, s);
    maxS = Math.max(maxS, s);
    minF = Math.min(minF, f);
    maxF = Math.max(maxF, f);
  }
  minS -= PAD;
  maxS += PAD;
  minF -= PAD;
  maxF += PAD;
  const k = Math.min(w / (maxS - minS), h / (maxF - minF));
  return { tee: hole.tee, sa, ca, cs: (minS + maxS) / 2, cf: (minF + maxF) / 2, k };
}

function toPx(f: Frame, w: number, h: number, x: number, z: number): Px {
  const rx = x - f.tee.x;
  const rz = z - f.tee.z;
  const s = -rx * f.ca + rz * f.sa;
  const fw = rx * f.sa + rz * f.ca;
  return { x: w / 2 + (s - f.cs) * f.k, y: h / 2 - (fw - f.cf) * f.k };
}

function toWorld(f: Frame, w: number, h: number, px: number, py: number): Pt {
  const s = f.cs + (px - w / 2) / f.k;
  const fw = f.cf - (py - h / 2) / f.k;
  return { x: f.tee.x - s * f.ca + fw * f.sa, z: f.tee.z + s * f.sa + fw * f.ca };
}

/** Paints the whole map once per hole: each pixel takes the colour of the lie under it. */
function buildBackground(f: Frame, w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  const img = g.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = toWorld(f, w, h, x + 0.5, y + 0.5);
      const col = LIE_COLOUR[lieAt(p.x, p.z)];
      const i = (y * w + x) * 4;
      d[i] = (col >> 16) & 255;
      d[i + 1] = (col >> 8) & 255;
      d[i + 2] = col & 255;
      d[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

export function createMinimap(ctx: Ctx): System {
  const root = document.createElement('div');
  root.id = 'gm-root';
  root.style.cssText =
    'position:absolute;top:calc(8px + env(safe-area-inset-top, 0px));right:calc(8px + env(safe-area-inset-right, 0px));display:none;pointer-events:none;';

  const canvas = document.createElement('canvas');
  canvas.id = 'gm-map';
  canvas.style.cssText =
    `display:block;width:${MAP_W}px;height:${MAP_H}px;border-radius:10px;box-shadow:0 0 0 2px rgba(255,255,255,0.9);` +
    'background:rgba(10,30,20,0.55);pointer-events:auto;cursor:pointer;touch-action:manipulation;';
  const g = canvas.getContext('2d') as CanvasRenderingContext2D;
  root.appendChild(canvas);
  ctx.ui.appendChild(root);

  canvas.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    const st = ctx.state;
    if (st.phase !== 'aim') return;
    st.view = st.view === 'behind' ? 'overhead' : 'behind';
  });

  let u = 0; // backing pixels per CSS pixel
  let w = 0;
  let h = 0;
  let frame: Frame | null = null;
  let bg: HTMLCanvasElement | null = null;
  let builtHole = -1;
  let lastKey = '';
  let landKey = '';
  let land: Pt = { x: 0, z: 0 };

  /** Landing point of a perfect shot with the selected club; cached because previewLanding is slow. */
  function landing(st: GameState): Pt {
    const key = `${st.holeIndex}|${st.ball.x.toFixed(2)}|${st.ball.z.toFixed(2)}|${st.club}|${st.lie}|${st.aimYaw.toFixed(3)}`;
    if (key !== landKey) {
      landKey = key;
      const v = previewLanding(st.ball, st.club, st.lie, st.aimYaw, HOLES[st.holeIndex].pin);
      land = { x: v.x, z: v.z };
    }
    return land;
  }

  /** Where the ball is drawn: along the flight while it is in the air, otherwise at rest. */
  function ballAt(st: GameState): Pt {
    const f = st.flight;
    if (st.phase === 'flight' && f && f.points.length > 1) {
      const idx = Math.max(0, st.phaseTime / f.sampleDt);
      const i = Math.floor(idx);
      if (i >= f.points.length - 1) {
        const p = f.points[f.points.length - 1];
        return { x: p.x, z: p.z };
      }
      const a = f.points[i];
      const b = f.points[i + 1];
      const t = idx - i;
      return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
    }
    return { x: st.ball.x, z: st.ball.z };
  }

  function draw(st: GameState, ball: Pt): void {
    if (!frame || !bg) return;
    const hole = HOLES[st.holeIndex];
    g.clearRect(0, 0, w, h);
    g.drawImage(bg, 0, 0);

    // Tee: small white square.
    const tee = toPx(frame, w, h, hole.tee.x, hole.tee.z);
    g.fillStyle = '#ffffff';
    g.fillRect(tee.x - 2 * u, tee.y - 2 * u, 4 * u, 4 * u);

    // Pin: red flag on a white pole.
    const pin = toPx(frame, w, h, hole.pin.x, hole.pin.z);
    g.strokeStyle = '#ffffff';
    g.lineWidth = 1 * u;
    g.beginPath();
    g.moveTo(pin.x, pin.y);
    g.lineTo(pin.x, pin.y - 9 * u);
    g.stroke();
    g.fillStyle = '#e53935';
    g.beginPath();
    g.moveTo(pin.x, pin.y - 9 * u);
    g.lineTo(pin.x + 6 * u, pin.y - 7 * u);
    g.lineTo(pin.x, pin.y - 5 * u);
    g.closePath();
    g.fill();

    const b = toPx(frame, w, h, ball.x, ball.z);

    // Aim line and landing point while the player is choosing a shot.
    if ((st.phase === 'aim' || st.phase === 'swing') && st.mode !== 'disc') {
      const l = landing(st);
      const lp = toPx(frame, w, h, l.x, l.z);
      g.strokeStyle = '#ffffff';
      g.lineWidth = 1 * u;
      g.setLineDash([3 * u, 3 * u]);
      g.beginPath();
      g.moveTo(b.x, b.y);
      g.lineTo(lp.x, lp.y);
      g.stroke();
      g.setLineDash([]);
      g.beginPath();
      g.arc(lp.x, lp.y, 2.5 * u, 0, TAU);
      g.stroke();
    }

    // Ball: white dot with a dark outline.
    g.fillStyle = '#ffffff';
    g.strokeStyle = '#1a1a1a';
    g.lineWidth = 1 * u;
    g.beginPath();
    g.arc(b.x, b.y, 2.5 * u, 0, TAU);
    g.fill();
    g.stroke();
  }

  return {
    update() {
      const st = ctx.state;
      const hidden = st.phase === 'title' || st.phase === 'card' || st.phase === 'final';
      root.style.display = hidden ? 'none' : 'block';
      if (hidden) return;

      const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
      if (dpr !== u) {
        u = dpr;
        w = Math.round(MAP_W * u);
        h = Math.round(MAP_H * u);
        canvas.width = w;
        canvas.height = h;
        builtHole = -1;
      }
      if (builtHole !== st.holeIndex) {
        builtHole = st.holeIndex;
        frame = buildFrame(HOLES[st.holeIndex], w, h);
        bg = buildBackground(frame, w, h);
        lastKey = '';
      }

      const ball = ballAt(st);
      const key = `${st.phase}|${st.holeIndex}|${ball.x.toFixed(2)}|${ball.z.toFixed(2)}|${st.aimYaw.toFixed(3)}|${st.club}|${st.lie}|${w}`;
      if (key === lastKey) return;
      lastKey = key;
      draw(st, ball);
    },
  };
}
