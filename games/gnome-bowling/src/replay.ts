// Anime-style multi-angle instant replay: triggers on 5% of throws (or 100% with `#replay` / `?replay` in the URL).
// Exports pure choreography helpers (used by game.ts, pins.ts, camera.ts, audio.ts) and createReplay(ctx) for the
// anime letterbox, speed-line, cut-flash and broadcast HUD overlay under #br-root.
import { LANE, ROUND, type BallResult, type Ctx, type SimResult, type System } from './config';

export interface ReplayFrame {
  /** Playback timestamp within sim [0, sim.duration]. */
  simTime: number;
  /** Current camera cut index (0..3). */
  cutIndex: number;
  /** Short cut identifier for HUD & audio. */
  cutLabel: string;
  /** Japanese anime subtitle for the cut. */
  jpLabel: string;
  /** Playback speed label (e.g. '1.1x', '0.35x SLO-MO'). */
  speedLabel: string;
  /** Camera position in world coordinates. */
  camPos: [number, number, number];
  /** Camera look-at target in world coordinates. */
  camLook: [number, number, number];
  /** Vertical field of view, degrees. */
  fov: number;
  /** Camera roll (Dutch angle), radians. */
  dutchAngle: number;
  /** Screen shake amplitude, metres. */
  shake: number;
  /** 0..1 flash intensity right after a hard camera cut. */
  cutFlash: number;
  /** 0..1 impact flash intensity right at pin impact. */
  impactFlash: number;
  /** 0..1 intensity of anime radial/streak speed lines. */
  speedLines: number;
  /** Which playback of the action (1 = first pass, 2 = rewind second angle). */
  playback: 1 | 2;
}

interface CutSpec {
  duration: number;
  cutLabel: string;
  jpLabel: string;
  speedLabel: string;
  playback: 1 | 2;
}

const CUTS: readonly CutSpec[] = [
  { duration: 1.1, cutLabel: 'CAM 01 // LOW HOOK', jpLabel: '高速フック', speedLabel: '1.1x', playback: 1 },
  { duration: 1.5, cutLabel: 'CAM 02 // PIN DECK', jpLabel: '衝撃インパクト', speedLabel: '0.35x SLO-MO', playback: 1 },
  { duration: 1.4, cutLabel: 'CAM 03 // OVERHEAD', jpLabel: '別アングル再生', speedLabel: '2ND ANGLE · 0.45x', playback: 2 },
  { duration: 1.2, cutLabel: 'CAM 04 // SIDE PROFILE', jpLabel: 'フィニッシュ', speedLabel: '0.8x', playback: 2 },
];

export const REPLAY_TOTAL_SECONDS = CUTS.reduce((s, c) => s + c.duration, 0);

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

function seededRand(seed: number): number {
  let a = (seed ^ 0x9e3779b9) >>> 0;
  a = Math.imul(a ^ (a >>> 15), a | 1);
  a ^= a + Math.imul(a ^ (a >>> 7), a | 61);
  return ((a ^ (a >>> 14)) >>> 0) / 4294967296;
}

/** True when `#replay` (hash) or `?replay` (query) is present in the browser URL. */
export function replayForced(): boolean {
  try {
    if (typeof location === 'undefined') return false;
    if (location.hash.toLowerCase().includes('replay')) return true;
    return new URLSearchParams(location.search).has('replay');
  } catch {
    return false;
  }
}

/** Deterministic per-throw 5% check (so online peers agree), or 100% when forced by URL slug. */
export function shouldReplay(turn: number, count: number, streak: number): boolean {
  if (replayForced()) return true;
  const seed = turn * 104729 + count * 997 + streak * 37 + 13;
  return seededRand(seed) < ROUND.replayChance;
}

/** Total duration of the instant replay sequence for a throw. */
export function replayDuration(sim: SimResult | null): number {
  return sim && sim.ball.length > 0 ? REPLAY_TOTAL_SECONDS : 0;
}

function ballPosAt(sim: SimResult, simTime: number): { x: number; y: number; z: number } {
  const n = sim.ball.length;
  if (n === 0) return { x: 0, y: 0.11, z: LANE.length };
  const f = clamp(simTime / sim.sampleDt, 0, n - 1);
  const i = Math.min(Math.floor(f), n - 1);
  const j = Math.min(i + 1, n - 1);
  const a = f - i;
  return {
    x: lerp(sim.ball[i].x, sim.ball[j].x, a),
    y: lerp(sim.ball[i].y, sim.ball[j].y, a),
    z: lerp(sim.ball[i].z, sim.ball[j].z, a),
  };
}

function impactTimeOf(sim: SimResult): number {
  const firstHit = sim.events.find((e) => e.kind === 'ballPin')?.t;
  const raw = firstHit ?? sim.reachPinsAt;
  return clamp(raw, 0.35, Math.max(0.35, sim.duration - 0.15));
}

/** Evaluates the multi-angle anime replay state at `phaseTime` seconds into the `'replay'` phase. */
export function evalReplay(sim: SimResult, phaseTime: number): ReplayFrame {
  const t = clamp(phaseTime, 0, REPLAY_TOTAL_SECONDS);
  let cutIndex = CUTS.length - 1;
  let cutStart = 0;
  let acc = 0;
  for (let i = 0; i < CUTS.length; i++) {
    if (t < acc + CUTS[i].duration || i === CUTS.length - 1) {
      cutIndex = i;
      cutStart = acc;
      break;
    }
    acc += CUTS[i].duration;
  }

  const spec = CUTS[cutIndex];
  const localT = t - cutStart;
  const u = clamp01(localT / spec.duration);
  const tImpact = impactTimeOf(sim);
  const dur = Math.max(0.1, sim.duration);

  // Hard-cut white flash decays in the first 0.12s of each cut.
  const cutFlash = clamp01(1 - localT / 0.12);

  let simTime = 0;
  let camPos: [number, number, number] = [0, 1, LANE.length - 2];
  let camLook: [number, number, number] = [0, 0.2, LANE.length];
  let fov = 50;
  let dutchAngle = 0;
  let shake = 0;
  let impactFlash = 0;
  let speedLines = 0;

  if (cutIndex === 0) {
    // Cut 1: Low-angle lane skim chasing the hook into the pocket.
    const startT = Math.max(0, tImpact - 1.35);
    const endT = Math.max(startT + 0.2, tImpact - 0.12);
    simTime = clamp(lerp(startT, endT, u), 0, dur);
    const b = ballPosAt(sim, simTime);
    const side = b.x >= 0 ? -0.42 : 0.42;
    camPos = [b.x + side, 0.22, Math.max(0.5, b.z - 1.15)];
    camLook = [b.x * 0.5, 0.18, Math.min(LANE.length + 0.6, b.z + 3.2)];
    fov = lerp(56, 44, u);
    dutchAngle = side > 0 ? 0.12 : -0.12;
    speedLines = 0.55 + 0.35 * u;
  } else if (cutIndex === 1) {
    // Cut 2: Pin-eye hero reverse angle, 0.35x slow-mo right through impact!
    const startT = Math.max(0, tImpact - 0.18);
    const endT = Math.min(dur, tImpact + 0.34);
    simTime = clamp(lerp(startT, endT, u), 0, dur);
    const b = ballPosAt(sim, simTime);
    const impactAge = simTime - tImpact;
    if (!sim.gutter && impactAge >= 0 && impactAge < 0.18) {
      impactFlash = 1 - impactAge / 0.18;
      shake = 0.045 * impactFlash;
    }
    const push = 0.25 * u;
    camPos = [-0.72, 0.26, LANE.length + 0.72 - push];
    camLook = [b.x * 0.35, 0.2, Math.min(LANE.length + 0.2, (b.z + LANE.length) * 0.5)];
    fov = lerp(42, 35, u);
    dutchAngle = -0.09;
    speedLines = impactAge >= -0.04 ? 0.95 : 0.65;
  } else if (cutIndex === 2) {
    // Cut 3: Rewind! High 3/4 overhead opposite-side second playback of the impact.
    const startT = Math.max(0, tImpact - 0.24);
    const endT = Math.min(dur, tImpact + 0.62);
    simTime = clamp(lerp(startT, endT, u), 0, dur);
    const impactAge = simTime - tImpact;
    if (!sim.gutter && impactAge >= 0 && impactAge < 0.16) {
      impactFlash = 0.75 * (1 - impactAge / 0.16);
      shake = 0.03 * (1 - impactAge / 0.16);
    }
    // Placed in front of the pinsetter hood (z < LANE.length - 0.6) so the hood never occludes.
    camPos = [lerp(1.18, 0.85, u), lerp(1.85, 1.55, u), LANE.length - 1.85];
    camLook = [0, 0.18, LANE.length + 0.35];
    fov = lerp(48, 41, u);
    dutchAngle = 0.1;
    speedLines = 0.6;
  } else {
    // Cut 4: Low side-profile across the pin deck for the dramatic aftermath.
    const startT = Math.min(dur, tImpact + 0.35);
    const endT = Math.min(dur, Math.max(startT, tImpact + 1.35));
    simTime = clamp(lerp(startT, endT, u), 0, dur);
    camPos = [1.22, 0.36, LANE.length + 0.15];
    camLook = [-0.1, 0.22, LANE.length + 0.25];
    fov = lerp(46, 52, u);
    dutchAngle = -0.05;
    speedLines = 0.3 * (1 - u);
  }

  return {
    simTime,
    cutIndex,
    cutLabel: spec.cutLabel,
    jpLabel: spec.jpLabel,
    speedLabel: spec.speedLabel,
    camPos,
    camLook,
    fov,
    dutchAngle,
    shake,
    cutFlash,
    impactFlash,
    speedLines,
    playback: spec.playback,
  };
}

/** Fractional sample index into `sim.ball` / `sim.pins` during `'replay'`. */
export function replaySampleIndex(sim: SimResult, phaseTime: number): number {
  const { simTime } = evalReplay(sim, phaseTime);
  return clamp(simTime / sim.sampleDt, 0, Math.max(0, sim.ball.length - 1));
}

// =====================================================================
// Anime overlay UI (#br-root)
// =====================================================================

const CSS = `
#br-root { position: absolute; inset: 0; pointer-events: none; overflow: hidden; display: none; }
#br-root.br-on { display: block; }
#br-root .br-bar { position: absolute; left: 0; right: 0; height: clamp(28px, 7vh, 56px); background: #07030f; z-index: 3;
  transition: transform 0.22s ease-out; }
#br-root .br-top { top: 0; border-bottom: 2px solid #ff3fb4; box-shadow: 0 2px 14px rgba(255,63,180,0.45); }
#br-root .br-bot { bottom: 0; border-top: 2px solid #3ff0ff; box-shadow: 0 -2px 14px rgba(63,240,255,0.45); }
#br-root canvas.br-fx { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 1; }
#br-root .br-flash { position: absolute; inset: 0; background: #fff; opacity: 0; z-index: 2; }
#br-root .br-hud { position: absolute; inset: clamp(34px, 8vh, 64px) 16px; z-index: 4;
  display: flex; flex-direction: column; justify-content: space-between; font-family: system-ui, sans-serif; }
#br-root .br-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
#br-root .br-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px;
  background: rgba(12, 5, 28, 0.86); border: 2px solid #ff3fb4; transform: skewX(-10deg);
  box-shadow: 4px 4px 0 #1a0630, 0 0 16px rgba(255,63,180,0.45); }
#br-root .br-dot { width: 10px; height: 10px; border-radius: 50%; background: #ff2a55;
  box-shadow: 0 0 8px #ff2a55; animation: br-blink 0.6s steps(2) infinite; }
#br-root .br-title { font-weight: 900; font-style: italic; font-size: clamp(13px, 2.6vw, 20px);
  letter-spacing: 0.08em; color: #fff; text-shadow: 0 0 10px #ff3fb4; }
#br-root .br-jp { font-weight: 900; font-size: clamp(11px, 2vw, 15px); color: #ffd54f; letter-spacing: 0.12em; }
#br-root .br-cam { padding: 6px 12px; background: rgba(12, 5, 28, 0.86); border: 2px solid #3ff0ff;
  transform: skewX(-10deg); box-shadow: 4px 4px 0 #1a0630; text-align: right; }
#br-root .br-cam-id { font-weight: 900; font-size: clamp(11px, 2.2vw, 16px); color: #3ff0ff; letter-spacing: 0.08em; }
#br-root .br-cam-jp { font-weight: 800; font-size: clamp(10px, 1.8vw, 13px); color: #fff; opacity: 0.9; }
#br-root .br-speed { align-self: flex-start; padding: 5px 12px; background: #ffd54f; color: #1a0630;
  font-weight: 900; font-style: italic; font-size: clamp(12px, 2.2vw, 16px); letter-spacing: 0.08em;
  transform: skewX(-12deg); box-shadow: 4px 4px 0 #ff3fb4; }
#br-root .br-stamp { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%) rotate(-7deg) scale(0.9);
  font-weight: 900; font-style: italic; font-size: clamp(32px, 9vw, 84px); color: #ffd54f;
  -webkit-text-stroke: 3px #1a0630; paint-order: stroke fill;
  text-shadow: 0 5px 0 #ff3fb4, 0 0 28px rgba(255,213,79,0.85);
  opacity: 0; letter-spacing: 0.06em; white-space: nowrap; z-index: 4; }
@keyframes br-blink { 50% { opacity: 0.25; } }
@media (prefers-reduced-motion: reduce) {
  #br-root .br-dot { animation: none; }
  #br-root .br-flash { display: none; }
}
`;

function impactWord(r: BallResult | null): string {
  if (!r) return 'IMPACT!!';
  if (r.kind === 'strike' || r.kind === 'double' || r.kind === 'turkey' || r.kind === 'hambone') return 'STRIKE!!';
  if (r.kind === 'spare') return 'SPARE!!';
  if (r.kind === 'gutter') return 'NOOOO!!';
  return 'CRASH!!';
}

function drawSpeedLines(ctx2d: CanvasRenderingContext2D, w: number, h: number, strength: number, t: number): void {
  ctx2d.clearRect(0, 0, w, h);
  if (strength <= 0.02) return;
  const cx = w * 0.5;
  const cy = h * 0.5;
  const maxR = Math.hypot(cx, cy);
  const count = 42;
  ctx2d.save();
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + Math.floor(t * 24) * 0.37;
    const inner = maxR * (0.42 + ((i * 7) % 11) * 0.025);
    const outer = maxR * 1.05;
    ctx2d.strokeStyle = i % 3 === 0 ? `rgba(63, 240, 255, ${0.42 * strength})` : `rgba(255, 255, 255, ${0.34 * strength})`;
    ctx2d.lineWidth = i % 4 === 0 ? 3 : 1.5;
    ctx2d.beginPath();
    ctx2d.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx2d.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
    ctx2d.stroke();
  }
  ctx2d.restore();
}

/** Anime-style instant replay overlay system (active only while `state.phase === 'replay'`). */
export function createReplay(ctx: Ctx): System {
  if (!document.getElementById('br-style')) {
    const st = document.createElement('style');
    st.id = 'br-style';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  const root = document.createElement('div');
  root.id = 'br-root';
  root.innerHTML = `
    <canvas class="br-fx"></canvas>
    <div class="br-flash"></div>
    <div class="br-bar br-top"></div>
    <div class="br-bar br-bot"></div>
    <div class="br-hud">
      <div class="br-row">
        <div class="br-badge">
          <span class="br-dot"></span>
          <span class="br-title">INSTANT REPLAY</span>
          <span class="br-jp">リプレイ</span>
        </div>
        <div class="br-cam">
          <div class="br-cam-id"></div>
          <div class="br-cam-jp"></div>
        </div>
      </div>
      <div class="br-speed"></div>
    </div>
    <div class="br-stamp"></div>
  `;
  ctx.ui.appendChild(root);

  const fxCanvas = root.querySelector<HTMLCanvasElement>('.br-fx')!;
  const fx2d = fxCanvas.getContext('2d');
  const flashEl = root.querySelector<HTMLElement>('.br-flash')!;
  const camIdEl = root.querySelector<HTMLElement>('.br-cam-id')!;
  const camJpEl = root.querySelector<HTMLElement>('.br-cam-jp')!;
  const speedEl = root.querySelector<HTMLElement>('.br-speed')!;
  const stampEl = root.querySelector<HTMLElement>('.br-stamp')!;

  let active = false;
  let lastCut = -1;

  return {
    update(): void {
      const s = ctx.state;
      const on = s.phase === 'replay' && s.sim !== null;
      if (on !== active) {
        active = on;
        root.classList.toggle('br-on', on);
        lastCut = -1;
      }
      if (!on || !s.sim) return;

      const frame = evalReplay(s.sim, s.phaseTime);
      if (frame.cutIndex !== lastCut) {
        lastCut = frame.cutIndex;
        camIdEl.textContent = frame.cutLabel;
        camJpEl.textContent = frame.jpLabel;
        speedEl.textContent = frame.speedLabel;
      }

      const flash = Math.max(frame.cutFlash * 0.75, frame.impactFlash * 0.85);
      flashEl.style.opacity = flash.toFixed(3);

      if (frame.impactFlash > 0.05) {
        stampEl.textContent = impactWord(s.result);
        stampEl.style.opacity = Math.min(1, frame.impactFlash * 1.4).toFixed(3);
        const sc = 0.95 + (1 - frame.impactFlash) * 0.22;
        stampEl.style.transform = `translate(-50%, -50%) rotate(-7deg) scale(${sc.toFixed(3)})`;
      } else {
        stampEl.style.opacity = '0';
      }

      if (fx2d) {
        const w = root.clientWidth || window.innerWidth;
        const h = root.clientHeight || window.innerHeight;
        if (fxCanvas.width !== w || fxCanvas.height !== h) {
          fxCanvas.width = w;
          fxCanvas.height = h;
        }
        drawSpeedLines(fx2d, w, h, frame.speedLines, s.phaseTime);
      }
    },
  };
}
