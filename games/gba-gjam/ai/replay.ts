import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import {
  BOT_SCRIPT_PRESETS,
  createAlleyOopExpressBot,
  createArcArchitectBot,
  createChampionV1Bot,
  createClassicBot,
  createFireFeederBot,
  createHybridAceBot,
  createLockdownCounterBot,
  createShoveHoundBot,
} from '../src/ai';
import {
  createSyncScriptBot,
  pickRoster,
  simulateMatch,
  type BotFactory,
} from '../src/ai/eval';
import type { JamSimulation } from '../src/sim';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const W = 960;
const H = 540;
const HUD_H = 66;
const COURT_X0 = 44;
const COURT_Y0 = 80;
const COURT_W = W - 88; // 872
const COURT_H = H - 102; // 438

// Compact 5x7 uppercase/digit bitmap font for crisp, zero-dependency HUD rendering
const FONT_5X7: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10111', '10001', '10001', '01110'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10011', '10101', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['01110', '10000', '11110', '10001', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  ':': ['00000', '00100', '00100', '00000', '00100', '00100', '00000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '00100', '00100'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '/': ['00001', '00010', '00100', '00100', '01000', '10000', '00000'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};

type RGBA = [number, number, number, number];

function setPx(buf: Uint8Array, x: number, y: number, c: RGBA): void {
  const ix = x | 0;
  const iy = y | 0;
  if (ix < 0 || ix >= W || iy < 0 || iy >= H) return;
  const idx = (iy * W + ix) * 4;
  if (c[3] === 255) {
    buf[idx] = c[0];
    buf[idx + 1] = c[1];
    buf[idx + 2] = c[2];
    buf[idx + 3] = 255;
  } else {
    const a = c[3] / 255;
    const inv = 1 - a;
    buf[idx] = (c[0] * a + buf[idx] * inv) | 0;
    buf[idx + 1] = (c[1] * a + buf[idx + 1] * inv) | 0;
    buf[idx + 2] = (c[2] * a + buf[idx + 2] * inv) | 0;
    buf[idx + 3] = 255;
  }
}

function fillRect(buf: Uint8Array, x: number, y: number, w: number, h: number, c: RGBA): void {
  const x0 = Math.max(0, x | 0);
  const y0 = Math.max(0, y | 0);
  const x1 = Math.min(W, (x + w) | 0);
  const y1 = Math.min(H, (y + h) | 0);
  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      setPx(buf, px, py, c);
    }
  }
}

function strokeRect(buf: Uint8Array, x: number, y: number, w: number, h: number, t: number, c: RGBA): void {
  fillRect(buf, x, y, w, t, c);
  fillRect(buf, x, y + h - t, w, t, c);
  fillRect(buf, x, y, t, h, c);
  fillRect(buf, x + w - t, y, t, h, c);
}

function fillCircle(buf: Uint8Array, cx: number, cy: number, r: number, c: RGBA): void {
  const r2 = r * r;
  const x0 = Math.max(0, Math.floor(cx - r));
  const x1 = Math.min(W - 1, Math.ceil(cx + r));
  const y0 = Math.max(0, Math.floor(cy - r));
  const y1 = Math.min(H - 1, Math.ceil(cy + r));
  for (let py = y0; py <= y1; py++) {
    const dy = py - cy;
    for (let px = x0; px <= x1; px++) {
      const dx = px - cx;
      if (dx * dx + dy * dy <= r2) setPx(buf, px, py, c);
    }
  }
}

function strokeCircle(buf: Uint8Array, cx: number, cy: number, r: number, thickness: number, c: RGBA): void {
  const rOut = r + thickness * 0.5;
  const rIn = Math.max(0, r - thickness * 0.5);
  const rOut2 = rOut * rOut;
  const rIn2 = rIn * rIn;
  const x0 = Math.max(0, Math.floor(cx - rOut));
  const x1 = Math.min(W - 1, Math.ceil(cx + rOut));
  const y0 = Math.max(0, Math.floor(cy - rOut));
  const y1 = Math.min(H - 1, Math.ceil(cy + rOut));
  for (let py = y0; py <= y1; py++) {
    const dy = py - cy;
    for (let px = x0; px <= x1; px++) {
      const dx = px - cx;
      const d2 = dx * dx + dy * dy;
      if (d2 <= rOut2 && d2 >= rIn2) setPx(buf, px, py, c);
    }
  }
}

function drawLine(buf: Uint8Array, x0: number, y0: number, x1: number, y1: number, c: RGBA, thickness = 2): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy)));
  const r = thickness * 0.5;
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    fillCircle(buf, x0 + dx * u, y0 + dy * u, r, c);
  }
}

function drawText(buf: Uint8Array, text: string, x: number, y: number, scale: number, c: RGBA): void {
  const up = text.toUpperCase();
  let curX = x;
  for (const ch of up) {
    const glyph = FONT_5X7[ch] ?? FONT_5X7[' '];
    for (let row = 0; row < 7; row++) {
      const line = glyph[row];
      for (let col = 0; col < 5; col++) {
        if (line[col] === '1') {
          fillRect(buf, curX + col * scale, y + row * scale, scale, scale, c);
        }
      }
    }
    curX += 6 * scale;
  }
}

function textWidth(text: string, scale: number): number {
  return text.length * 6 * scale;
}

/** Pre-renders the static court & arena background once so each frame copies it in <0.2ms. */
function buildCourtBackdrop(halfX: number, halfZ: number, hoopX: number, threePtRadius: number): Uint8Array {
  const bg = new Uint8Array(W * H * 4);
  const wx = (x: number) => COURT_X0 + ((x + halfX) / (2 * halfX)) * COURT_W;
  const wz = (z: number) => COURT_Y0 + ((z + halfZ) / (2 * halfZ)) * COURT_H;
  const scaleX = COURT_W / (2 * halfX);
  const scaleZ = COURT_H / (2 * halfZ);
  const scaleAvg = (scaleX + scaleZ) * 0.5;

  // Dark arena background
  fillRect(bg, 0, 0, W, H, [15, 18, 34, 255]);
  // HUD bar background
  fillRect(bg, 0, 0, W, HUD_H, [10, 12, 24, 255]);
  fillRect(bg, 0, HUD_H - 2, W, 2, [255, 210, 31, 200]);

  // Court apron
  fillRect(bg, COURT_X0 - 12, COURT_Y0 - 10, COURT_W + 24, COURT_H + 20, [24, 28, 48, 255]);

  // Hardwood maple planks
  const stripeH = 16;
  for (let py = COURT_Y0; py < COURT_Y0 + COURT_H; py += stripeH) {
    const even = (((py - COURT_Y0) / stripeH) | 0) % 2 === 0;
    fillRect(
      bg,
      COURT_X0,
      py,
      COURT_W,
      Math.min(stripeH, COURT_Y0 + COURT_H - py),
      even ? [208, 152, 92, 255] : [196, 141, 84, 255],
    );
  }

  // Paint / keys on both ends
  const keyW = 3.9 * scaleX;
  const keyH = 3.8 * scaleZ;
  fillRect(bg, COURT_X0, wz(-1.9), keyW, keyH, [34, 139, 34, 110]); // Home defense key
  fillRect(bg, COURT_X0 + COURT_W - keyW, wz(-1.9), keyW, keyH, [217, 43, 43, 110]); // Away defense key

  // Court lines (white)
  const white: RGBA = [245, 245, 245, 220];
  strokeRect(bg, COURT_X0, COURT_Y0, COURT_W, COURT_H, 3, white);
  fillRect(bg, wx(0) - 1, COURT_Y0, 3, COURT_H, white);
  strokeCircle(bg, wx(0), wz(0), 1.8 * scaleAvg, 2.5, white);
  strokeRect(bg, COURT_X0, wz(-1.9), keyW, keyH, 2, white);
  strokeRect(bg, COURT_X0 + COURT_W - keyW, wz(-1.9), keyW, keyH, 2, white);

  // 3-point arcs (clipped cleanly inside the court)
  const drawThreeArc = (rimWorldX: number, sign: 1 | -1) => {
    const cx = wx(rimWorldX);
    const cy = wz(0);
    const rx = threePtRadius * scaleX;
    const rz = threePtRadius * scaleZ;
    for (let deg = -82; deg <= 82; deg += 0.6) {
      const rad = (deg * Math.PI) / 180;
      const px = cx + sign * Math.cos(rad) * rx;
      const py = cy + Math.sin(rad) * rz;
      if (px >= COURT_X0 && px <= COURT_X0 + COURT_W && py >= COURT_Y0 && py <= COURT_Y0 + COURT_H) {
        fillCircle(bg, px, py, 1.4, [255, 232, 140, 210]);
      }
    }
  };
  drawThreeArc(-hoopX + 0.36, 1);
  drawThreeArc(hoopX - 0.36, -1);

  // Backboards & Rims
  fillRect(bg, wx(-hoopX) - 5, wz(-0.9), 4, 1.8 * scaleZ, [240, 245, 255, 255]);
  fillRect(bg, wx(hoopX) + 1, wz(-0.9), 4, 1.8 * scaleZ, [240, 245, 255, 255]);
  strokeCircle(bg, wx(-hoopX + 0.36), wz(0), 0.35 * scaleAvg, 3, [255, 110, 30, 255]);
  strokeCircle(bg, wx(hoopX - 0.36), wz(0), 0.35 * scaleAvg, 3, [255, 110, 30, 255]);

  return bg;
}

export function resolveBotFactory(id: string): BotFactory {
  const map: Record<string, BotFactory> = {
    classic: { id: 'classic', name: 'Classic Jam', create: () => createClassicBot() },
    'downtown-sniper': {
      id: 'downtown-sniper',
      name: 'Downtown Sniper',
      create: () =>
        createSyncScriptBot(BOT_SCRIPT_PRESETS['script-sniper'].code, 'downtown-sniper', 'Downtown Sniper'),
    },
    'rim-rusher': {
      id: 'rim-rusher',
      name: 'Rim Rusher',
      create: () =>
        createSyncScriptBot(BOT_SCRIPT_PRESETS['script-rusher'].code, 'rim-rusher', 'Rim Rusher'),
    },
    'shove-hound': { id: 'shove-hound', name: 'Shove Hound', create: () => createShoveHoundBot() },
    'arc-architect': { id: 'arc-architect', name: 'Arc Architect', create: () => createArcArchitectBot() },
    'fire-feeder': { id: 'fire-feeder', name: 'Fire Feeder', create: () => createFireFeederBot() },
    'alley-oop-express': { id: 'alley-oop-express', name: 'Alley-Oop Express', create: () => createAlleyOopExpressBot() },
    'lockdown-counter': { id: 'lockdown-counter', name: 'Lockdown Counter', create: () => createLockdownCounterBot() },
    'hybrid-ace': { id: 'hybrid-ace', name: 'Hybrid Ace', create: () => createHybridAceBot() },
    'champion-v1': { id: 'champion-v1', name: 'Champion v1', create: () => createChampionV1Bot() },
  };
  const found = map[id];
  if (!found) {
    throw new Error(`Unknown bot id "${id}". Available: ${Object.keys(map).join(', ')}`);
  }
  return found;
}

export interface RenderReplayOptions {
  homeBotId: string;
  awayBotId: string;
  seed?: number;
  speed?: number;
  fps?: number;
  quarterSeconds?: number;
  rosterMode?: 'balanced' | 'shooter' | 'dunker' | 'pro-teams';
  decisionCadenceMs?: number;
  outPath?: string;
}

/**
 * Simulates a deterministic GBA GJAM match at 60Hz and encodes a tactical 2D replay MP4
 * at `speed`x playback (default 4x speed, 30fps) via bundled @ffmpeg-installer/ffmpeg.
 */
export async function renderMatchReplayMp4(opts: RenderReplayOptions): Promise<{
  outPath: string;
  frames: number;
  durationSec: number;
  homeScore: number;
  awayScore: number;
}> {
  const homeBot = resolveBotFactory(opts.homeBotId);
  const awayBot = resolveBotFactory(opts.awayBotId);
  const seed = opts.seed ?? 61000;
  const speed = opts.speed ?? 4;
  const fps = opts.fps ?? 30;
  const quarterSeconds = opts.quarterSeconds ?? 45;
  const rosterMode = opts.rosterMode ?? 'balanced';
  const decisionCadenceMs = opts.decisionCadenceMs ?? 0;

  const outPath =
    opts.outPath ??
    path.resolve(
      __dirname,
      'results',
      'replays',
      `${homeBot.id}-vs-${awayBot.id}-s${seed}-${speed}x.mp4`,
    );
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const dt = 1 / 60;
  // At 60Hz sim, sampling every `sampleStride` ticks and encoding at `fps` gives `speed`x playback
  const sampleStride = Math.max(1, Math.round((60 * speed) / fps));

  const homeRoster = pickRoster(rosterMode, 0, 'home');
  const awayRoster = pickRoster(rosterMode, 0, 'away');

  let backdrop: Uint8Array | null = null;
  const trail: Array<[number, number, boolean]> = [];
  let bannerText = '';
  let bannerTimer = 0;

  // Spawn ffmpeg encoder and stream raw RGBA frames directly
  const ff = spawn(
    ffmpegInstaller.path,
    [
      '-y',
      '-f',
      'rawvideo',
      '-pix_fmt',
      'rgba',
      '-s',
      `${W}x${H}`,
      '-r',
      String(fps),
      '-i',
      'pipe:0',
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      '22',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      outPath,
    ],
    { stdio: ['pipe', 'ignore', 'pipe'] },
  );

  let ffErr = '';
  ff.stderr.on('data', (d: Buffer) => {
    ffErr += d.toString();
  });

  const frameBuf = new Uint8Array(W * H * 4);
  const encodedFrames: Uint8Array[] = [];
  let tickCount = 0;

  const drawFrame = (sim: JamSimulation) => {
    const snap = sim.getSnapshot();
    const { halfX, halfZ, hoopX, threePtRadius } = snap.court;
    if (!backdrop) {
      backdrop = buildCourtBackdrop(halfX, halfZ, hoopX, threePtRadius);
    }
    frameBuf.set(backdrop);

    const wx = (x: number) => COURT_X0 + ((x + halfX) / (2 * halfX)) * COURT_W;
    const wz = (z: number) => COURT_Y0 + ((z + halfZ) / (2 * halfZ)) * COURT_H;
    const scaleAvg = (COURT_W / (2 * halfX) + COURT_H / (2 * halfZ)) * 0.5;

    // 1. Scoreboard HUD
    const homeLabel = `${homeBot.id.slice(0, 14).toUpperCase()}  ${String(snap.score[0]).padStart(3, ' ')}`;
    const awayLabel = `${String(snap.score[1]).padStart(3, ' ')}  ${awayBot.id.slice(0, 14).toUpperCase()}`;
    fillRect(frameBuf, 14, 12, 330, 40, [26, 98, 36, 255]);
    strokeRect(frameBuf, 14, 12, 330, 40, 2, [244, 196, 48, 255]);
    drawText(frameBuf, homeLabel, 26, 24, 2, [255, 255, 255, 255]);

    fillRect(frameBuf, W - 344, 12, 330, 40, [168, 32, 32, 255]);
    strokeRect(frameBuf, W - 344, 12, 330, 40, 2, [245, 245, 245, 255]);
    drawText(frameBuf, awayLabel, W - 332, 24, 2, [255, 255, 255, 255]);

    const mins = Math.floor(snap.clockSec / 60);
    const secs = Math.floor(snap.clockSec % 60);
    const qLbl = snap.quarter > 4 ? `OT${snap.quarter - 4}` : `Q${snap.quarter}`;
    const clockStr = `${qLbl} ${mins}:${String(secs).padStart(2, '0')} SC${String(Math.ceil(snap.shotClock)).padStart(2, '0')}`;
    drawText(frameBuf, clockStr, (W - textWidth(clockStr, 2)) * 0.5, 16, 2, [255, 210, 31, 255]);

    const modeStr = `${speed}X REPLAY${decisionCadenceMs > 0 ? ` ${decisionCadenceMs}MS` : ' 60HZ'}`;
    drawText(frameBuf, modeStr, (W - textWidth(modeStr, 1.5)) * 0.5, 42, 1, [150, 210, 255, 255]);

    // 2. Players
    for (const p of snap.players) {
      const px = wx(p.pos[0]);
      const pz = wz(p.pos[2]);
      const lift = p.pos[1] * 8.5;
      const py = pz - lift;
      const baseR = 13 + Math.min(5, p.pos[1] * 1.3);

      // Floor shadow
      fillCircle(frameBuf, px, pz + 4, 11, [0, 0, 0, 95]);

      // Shove range indicator when actively shoving
      if (p.shoveTimer > 0) {
        strokeCircle(frameBuf, px, pz, 1.65 * scaleAvg, 2, [255, 140, 40, 170]);
      }

      // On-Fire or Stunned halo
      if (p.onFire) {
        strokeCircle(frameBuf, px, py, baseR + 5, 3, [255, 110, 0, 240]);
      }
      if (p.stunTimer > 0) {
        strokeCircle(frameBuf, px, py, baseR + 4, 3, [190, 90, 255, 240]);
      }

      // Carrier highlight ring
      if (snap.ball.carrier === p.index) {
        strokeCircle(frameBuf, px, py, baseR + 2, 2, [255, 230, 80, 255]);
      }

      // Player disc
      const teamColor: RGBA =
        p.team === 0 ? [34, 168, 64, 255] : [225, 48, 48, 255];
      fillCircle(frameBuf, px, py, baseR, teamColor);
      strokeCircle(frameBuf, px, py, baseR, 2, [255, 255, 255, 230]);

      // Facing arrow
      const fx = Math.sin(p.facing);
      const fz = Math.cos(p.facing);
      drawLine(frameBuf, px, py, px + fx * (baseR + 5), py + fz * (baseR + 5), [255, 255, 255, 220], 2);

      // Player index
      drawText(frameBuf, String(p.index), px - 3, py - 4, 1, [255, 255, 255, 255]);

      // Mini turbo bar underneath
      const barW = 24;
      const bx = px - barW * 0.5;
      const by = pz + 16;
      fillRect(frameBuf, bx, by, barW, 4, [20, 24, 40, 210]);
      const fillW = Math.round((Math.max(0, Math.min(100, p.turbo)) / 100) * barW);
      fillRect(frameBuf, bx, by, fillW, 4, p.onFire ? [255, 100, 0, 255] : [60, 215, 255, 255]);
    }

    // 3. Basketball + Trail
    const bx = wx(snap.ball.pos[0]);
    const bz = wz(snap.ball.pos[2]);
    const by = bz - snap.ball.pos[1] * 8.5;
    trail.push([bx, by, snap.ball.onFire]);
    if (trail.length > 7) trail.shift();
    for (let i = 0; i < trail.length - 1; i++) {
      const [tx, ty, fire] = trail[i];
      const alpha = Math.round(((i + 1) / trail.length) * 140);
      fillCircle(frameBuf, tx, ty, 3 + i * 0.4, fire ? [255, 90, 0, alpha] : [255, 170, 60, alpha]);
    }
    fillCircle(frameBuf, bx, bz + 3, 5, [0, 0, 0, 110]);
    const ballR = 6.5 + Math.min(3.5, snap.ball.pos[1] * 0.65);
    fillCircle(frameBuf, bx, by, ballR, snap.ball.onFire ? [255, 80, 0, 255] : [245, 125, 24, 255]);
    strokeCircle(frameBuf, bx, by, ballR, 1.5, [60, 25, 5, 255]);

    // 4. Active Event Banner
    if (bannerTimer > 0 && bannerText) {
      const clean = bannerText.replace(/[^A-Za-z0-9 :\-!+/.]/g, '').slice(0, 28);
      const tw = textWidth(clean, 2);
      const bw = tw + 24;
      const bx0 = (W - bw) * 0.5;
      fillRect(frameBuf, bx0, COURT_Y0 + 8, bw, 28, [12, 16, 32, 215]);
      strokeRect(frameBuf, bx0, COURT_Y0 + 8, bw, 28, 2, [255, 210, 31, 255]);
      drawText(frameBuf, clean, bx0 + 12, COURT_Y0 + 15, 2, [255, 230, 80, 255]);
    }

    encodedFrames.push(new Uint8Array(frameBuf));
  };

  const telemetry = simulateMatch({
    homeBot,
    awayBot,
    homeRoster,
    awayRoster,
    quarterSeconds,
    seed,
    dt,
    decisionCadenceMs,
    onTick: (sim, lastEvent) => {
      if (lastEvent) {
        bannerText = lastEvent;
        bannerTimer = 0.85;
      } else if (bannerTimer > 0) {
        bannerTimer -= dt;
      }
      if (tickCount % sampleStride === 0) {
        drawFrame(sim);
      }
      tickCount++;
    },
  });

  // Stream buffered frames into ffmpeg with backpressure handling
  for (const f of encodedFrames) {
    if (!ff.stdin.write(f)) {
      await new Promise<void>((resolve) => ff.stdin.once('drain', resolve));
    }
  }
  ff.stdin.end();

  await new Promise<void>((resolve, reject) => {
    ff.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}: ${ffErr.slice(-400)}`));
    });
    ff.on('error', reject);
  });

  return {
    outPath,
    frames: encodedFrames.length,
    durationSec: encodedFrames.length / fps,
    homeScore: telemetry.homeScore,
    awayScore: telemetry.awayScore,
  };
}

function parseCliArgs(args: string[]): RenderReplayOptions {
  const flags: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      flags[a.slice(2)] = args[i + 1] ?? '';
      i++;
    }
  }
  return {
    homeBotId: flags.home || 'shove-hound',
    awayBotId: flags.away || 'champion-v1',
    seed: flags.seed ? Number(flags.seed) : 61000,
    speed: flags.speed ? Number(flags.speed) : 4,
    fps: flags.fps ? Number(flags.fps) : 30,
    quarterSeconds: flags['quarter-sec'] ? Number(flags['quarter-sec']) : 45,
    rosterMode: (flags.roster as RenderReplayOptions['rosterMode']) || 'balanced',
    decisionCadenceMs: flags.cadence ? Number(flags.cadence) : 0,
    outPath: flags.out || undefined,
  };
}

export async function main(args: string[]): Promise<void> {
  const opts = parseCliArgs(args);
  const t0 = performance.now();
  console.log(
    `Rendering ${opts.speed}x replay MP4: ${opts.homeBotId} vs ${opts.awayBotId} (seed=${opts.seed}, roster=${opts.rosterMode}, cadence=${opts.decisionCadenceMs}ms)...`,
  );
  const res = await renderMatchReplayMp4(opts);
  const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
  const sizeKb = (fs.statSync(res.outPath).size / 1024).toFixed(1);
  console.log(
    `Done in ${elapsed}s! Final: ${opts.homeBotId} ${res.homeScore} - ${res.awayScore} ${opts.awayBotId}`,
  );
  console.log(`Saved ${res.frames} frames (${res.durationSec.toFixed(1)}s @ ${opts.fps}fps, ${sizeKb} KB) -> ${res.outPath}`);
}
