// Multi-tier CPU opponents for Gnome Billiards: Casual (Burdock), Regular (Big Lou), Shark (Velvet Vesper), and Cracked (The Chalk Phantom).
// Local only: the CPU never plays online, so its shots need no determinism.
import { GNORMAN_LOOK, type GnomeLook } from '@lawn/gnome';
import { BALL_R, CUE_BALL, MAX_SHOT_SPEED, ROLL_DECEL, TABLE_H, TABLE_W } from './config';
import { beginShot, canPlaceCue, POCKETS, settle, type Ball } from './physics';
import { judge, legalTargetIds, type GameMode, type Group } from './rules';

export type CpuTier = 'casual' | 'regular' | 'shark' | 'cracked';

export interface CpuProfile {
  tier: CpuTier;
  name: string;
  title: string;
  badge: string;
  look: GnomeLook;
  wagerMult: number;
  aimJitter: number;
  breakPower: number;
  powerBoost: number;
  useSim: boolean;
  simBudget: number;
  useBanks: boolean;
  useCombos: boolean;
}

export const CPU_PROFILES: Record<CpuTier, CpuProfile> = {
  casual: {
    tier: 'casual',
    name: 'Burdock',
    title: 'Pub Regular',
    badge: 'Casual · 1x',
    look: { ...GNORMAN_LOOK, hat: 0x3e8a4a, shirt: 0xa88456, pants: 0x3a3228, beard: 0x6b4423 },
    wagerMult: 1,
    aimJitter: 0.075,
    breakPower: 0.78,
    powerBoost: 1.15,
    useSim: false,
    simBudget: 0,
    useBanks: false,
    useCombos: false,
  },
  regular: {
    tier: 'regular',
    name: 'Big Lou',
    title: 'Gnomecino Bouncer',
    badge: 'Regular · 1.25x',
    look: { ...GNORMAN_LOOK, hat: 0x3b6ea5, shirt: 0x6b3a2a, pants: 0x2a2a32, beard: 0x8a5a3a },
    wagerMult: 1.25,
    aimJitter: 0.03,
    breakPower: 0.9,
    powerBoost: 1.32,
    useSim: false,
    simBudget: 0,
    useBanks: false,
    useCombos: false,
  },
  shark: {
    tier: 'shark',
    name: 'Velvet Vesper',
    title: 'High Roller',
    badge: 'Shark · 1.75x',
    look: { ...GNORMAN_LOOK, hat: 0x9e1b32, shirt: 0x251a30, pants: 0x16121e, beard: 0xd8d8e0 },
    wagerMult: 1.75,
    aimJitter: 0.011,
    breakPower: 0.96,
    powerBoost: 1.45,
    useSim: true,
    simBudget: 10,
    useBanks: true,
    useCombos: true,
  },
  cracked: {
    tier: 'cracked',
    name: 'The Chalk Phantom',
    title: 'CRACKED',
    badge: 'Cracked · 2.5x',
    look: { ...GNORMAN_LOOK, hat: 0xffd54f, shirt: 0x120a1f, pants: 0x0a0612, beard: 0xffffff },
    wagerMult: 2.5,
    aimJitter: 0.0006,
    breakPower: 1.0,
    powerBoost: 1.6,
    useSim: true,
    simBudget: 18,
    useBanks: true,
    useCombos: true,
  },
};

export interface CpuShot {
  vx: number;
  vy: number;
}

export interface CpuOptions {
  tier?: CpuTier;
  gameMode?: GameMode;
  isBreak?: boolean;
}

/** Distance from point (px, py) to the segment (ax, ay)-(bx, by). */
function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + dx * t - px;
  const cy = ay + dy * t - py;
  return Math.sqrt(cx * cx + cy * cy);
}

/** True when no live ball (other than the ones listed) lies within a ball's width of the segment. */
function clearPath(balls: readonly Ball[], ax: number, ay: number, bx: number, by: number, ignore: readonly number[]): boolean {
  for (const b of balls) {
    if (b.pocketed || ignore.includes(b.id)) continue;
    if (segDist(b.x, b.y, ax, ay, bx, by) < 2 * BALL_R) return false;
  }
  return true;
}

interface CandidateShot {
  dx: number;
  dy: number;
  speed: number;
  heurScore: number;
}

function makeCutSpeed(distCue: number, distObj: number, cosCut: number, powerBoost: number): number {
  const needObjSpeed = Math.sqrt(2 * ROLL_DECEL * Math.max(0.05, distObj)) * 1.18;
  const needCueAtImpact = needObjSpeed / (0.975 * Math.max(0.25, cosCut));
  const raw = Math.sqrt(needCueAtImpact * needCueAtImpact + 2 * ROLL_DECEL * Math.max(0.02, distCue)) * powerBoost;
  return Math.min(MAX_SHOT_SPEED, Math.max(0.45, raw));
}

function shapeScore(balls: readonly Ball[], group: Group | null, gameMode: GameMode): number {
  const cue = balls.find((b) => b.id === CUE_BALL);
  if (!cue || cue.pocketed) return 0;
  const targetIds = new Set(legalTargetIds(balls, group, gameMode));
  let best = 0;
  for (const t of balls) {
    if (t.pocketed || !targetIds.has(t.id)) continue;
    for (const p of POCKETS) {
      const ux = p.x - t.x;
      const uy = p.y - t.y;
      const L = Math.hypot(ux, uy);
      if (L === 0) continue;
      const gx = t.x - (ux / L) * 2 * BALL_R;
      const gy = t.y - (uy / L) * 2 * BALL_R;
      const dx = gx - cue.x;
      const dy = gy - cue.y;
      const D = Math.hypot(dx, dy);
      if (D === 0) continue;
      const cosCut = (dx / D) * (ux / L) + (dy / D) * (uy / L);
      if (cosCut < 0.4) continue;
      if (clearPath(balls, cue.x, cue.y, gx, gy, [CUE_BALL, t.id]) && clearPath(balls, t.x, t.y, p.x, p.y, [CUE_BALL, t.id])) {
        const s = 40 + cosCut * 45 - (D + L) * 8;
        if (s > best) best = s;
      }
    }
  }
  return Math.max(0, best);
}

/** Places the cue ball after a foul. Shark and Cracked line up a dead-straight pot when one is open. */
export function cpuPlaceSpot(
  balls: readonly Ball[],
  rnd: () => number,
  opts?: { tier?: CpuTier; group?: Group | null; gameMode?: GameMode },
): { x: number; y: number } {
  const tier = opts?.tier ?? 'regular';
  const gameMode = opts?.gameMode ?? '8ball';
  if (tier === 'shark' || tier === 'cracked') {
    const targetIds = new Set(legalTargetIds(balls, opts?.group ?? null, gameMode));
    const targets = balls.filter((b) => !b.pocketed && targetIds.has(b.id));
    let bestSpot: { x: number; y: number; dist: number } | null = null;
    for (const t of targets) {
      for (const p of POCKETS) {
        const ux = p.x - t.x;
        const uy = p.y - t.y;
        const L = Math.hypot(ux, uy);
        if (L === 0) continue;
        const nx = ux / L;
        const ny = uy / L;
        if (!clearPath(balls, t.x, t.y, p.x, p.y, [CUE_BALL, t.id])) continue;
        const sx = t.x - nx * (2 * BALL_R + 0.22);
        const sy = t.y - ny * (2 * BALL_R + 0.22);
        if (canPlaceCue(balls, sx, sy) && clearPath(balls, sx, sy, t.x, t.y, [CUE_BALL, t.id])) {
          if (!bestSpot || L < bestSpot.dist) bestSpot = { x: sx, y: sy, dist: L };
        }
      }
    }
    if (bestSpot) return { x: bestSpot.x, y: bestSpot.y };
  }

  const jitter = (rnd() - 0.5) * 0.2;
  const preferred = [
    { x: TABLE_W * 0.3, y: TABLE_H / 2 + jitter },
    { x: TABLE_W * 0.3, y: TABLE_H / 2 },
  ];
  for (const p of preferred) if (canPlaceCue(balls, p.x, p.y)) return p;
  for (let gx = 0.1; gx < TABLE_W; gx += 0.1) {
    for (let gy = 0.1; gy < TABLE_H; gy += 0.1) {
      if (canPlaceCue(balls, gx, gy)) return { x: gx, y: gy };
    }
  }
  return { x: TABLE_W * 0.3, y: TABLE_H / 2 };
}

/** Chooses a shot for the CPU from (cueX, cueY). */
export function chooseCpuShot(
  balls: readonly Ball[],
  cueX: number,
  cueY: number,
  group: Group | null,
  rnd: () => number,
  opts?: CpuOptions,
): CpuShot {
  const tier = opts?.tier ?? 'regular';
  const gameMode = opts?.gameMode ?? '8ball';
  const profile = CPU_PROFILES[tier];
  const live = balls.filter((b) => !b.pocketed && b.id !== CUE_BALL);

  // Break shot: smash into the front of the rack at breakPower.
  const looksLikeBreak = opts?.isBreak ?? (live.length >= 6 && cueX < TABLE_W * 0.35);
  if (looksLikeBreak && live.length > 0) {
    let front = live[0];
    for (const b of live) if (b.x < front.x) front = b;
    const offset = tier === 'cracked' ? 0.004 : tier === 'shark' ? 0.008 : 0;
    const ax = front.x - cueX;
    const ay = front.y + offset - cueY;
    const len = Math.hypot(ax, ay) || 1;
    const a = (rnd() - 0.5) * profile.aimJitter * 0.5;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const dx = (ax * ca - ay * sa) / len;
    const dy = (ax * sa + ay * ca) / len;
    const speed = MAX_SHOT_SPEED * profile.breakPower;
    return { vx: dx * speed, vy: dy * speed };
  }

  const legalIds = new Set(legalTargetIds(balls, group, gameMode));
  let targets = live.filter((b) => legalIds.has(b.id));
  if (targets.length === 0) targets = live;

  const candidates: CandidateShot[] = [];

  // 1. Direct cut shots (skipped in Bank Pool unless fallback is needed)
  if (gameMode !== 'bank') {
    for (const t of targets) {
      for (const p of POCKETS) {
        const ux = p.x - t.x;
        const uy = p.y - t.y;
        const L = Math.hypot(ux, uy);
        if (L === 0) continue;
        const nx = ux / L;
        const ny = uy / L;
        const gx = t.x - nx * 2 * BALL_R;
        const gy = t.y - ny * 2 * BALL_R;
        const dx = gx - cueX;
        const dy = gy - cueY;
        const D = Math.hypot(dx, dy);
        if (D === 0) continue;
        const cosCut = (dx / D) * nx + (dy / D) * ny;
        if (cosCut < 0.18) continue;
        if (!clearPath(balls, cueX, cueY, gx, gy, [CUE_BALL, t.id])) continue;
        if (!clearPath(balls, t.x, t.y, p.x, p.y, [CUE_BALL, t.id])) continue;
        const speed = makeCutSpeed(D, L, cosCut, profile.powerBoost);
        const heurScore = cosCut * 2.2 - (D + L) * 0.6;
        candidates.push({ dx: dx / D, dy: dy / D, speed, heurScore });
      }
    }
  }

  // 2. 1-rail bank shots (Shark, Cracked, or anyone in Bank Pool)
  if (profile.useBanks || gameMode === 'bank') {
    const mirrors: Array<(px: number, py: number) => { mx: number; my: number }> = [
      (px, py) => ({ mx: px, my: 2 * BALL_R - py }),
      (px, py) => ({ mx: px, my: 2 * (TABLE_H - BALL_R) - py }),
      (px, py) => ({ mx: 2 * BALL_R - px, my: py }),
      (px, py) => ({ mx: 2 * (TABLE_W - BALL_R) - px, my: py }),
    ];
    for (const t of targets) {
      for (const p of POCKETS) {
        for (const mFn of mirrors) {
          const { mx, my } = mFn(p.x, p.y);
          const ux = mx - t.x;
          const uy = my - t.y;
          const L = Math.hypot(ux, uy);
          if (L === 0) continue;
          const nx = ux / L;
          const ny = uy / L;
          const gx = t.x - nx * 2 * BALL_R;
          const gy = t.y - ny * 2 * BALL_R;
          const dx = gx - cueX;
          const dy = gy - cueY;
          const D = Math.hypot(dx, dy);
          if (D === 0) continue;
          const cosCut = (dx / D) * nx + (dy / D) * ny;
          if (cosCut < 0.32) continue;
          if (!clearPath(balls, cueX, cueY, gx, gy, [CUE_BALL, t.id])) continue;
          const speed = makeCutSpeed(D, L * 1.25, cosCut, profile.powerBoost);
          candidates.push({ dx: dx / D, dy: dy / D, speed, heurScore: cosCut * 1.2 - (D + L) * 0.7 - 0.5 });
        }
      }
    }
  }

  // 3. 2-ball combos (Shark & Cracked)
  if (profile.useCombos) {
    for (const a of targets) {
      for (const b of live) {
        if (b.id === a.id) continue;
        for (const p of POCKETS) {
          const ux = p.x - b.x;
          const uy = p.y - b.y;
          const Lb = Math.hypot(ux, uy);
          if (Lb === 0) continue;
          const gxB = b.x - (ux / Lb) * 2 * BALL_R;
          const gyB = b.y - (uy / Lb) * 2 * BALL_R;
          const vx = gxB - a.x;
          const vy = gyB - a.y;
          const La = Math.hypot(vx, vy);
          if (La === 0) continue;
          const cosB = (vx / La) * (ux / Lb) + (vy / La) * (uy / Lb);
          if (cosB < 0.45) continue;
          const gxA = a.x - (vx / La) * 2 * BALL_R;
          const gyA = a.y - (vy / La) * 2 * BALL_R;
          const dx = gxA - cueX;
          const dy = gyA - cueY;
          const D = Math.hypot(dx, dy);
          if (D === 0) continue;
          const cosA = (dx / D) * (vx / La) + (dy / D) * (vy / La);
          if (cosA < 0.4) continue;
          if (!clearPath(balls, cueX, cueY, gxA, gyA, [CUE_BALL, a.id])) continue;
          if (!clearPath(balls, a.x, a.y, gxB, gyB, [CUE_BALL, a.id, b.id])) continue;
          if (!clearPath(balls, b.x, b.y, p.x, p.y, [CUE_BALL, b.id])) continue;
          const speed = makeCutSpeed(D, La + Lb, cosA * cosB, profile.powerBoost);
          candidates.push({ dx: dx / D, dy: dy / D, speed, heurScore: cosA * cosB * 1.4 - (D + La + Lb) * 0.5 - 0.35 });
        }
      }
    }
  }

  // 3b. Snooker / cluster fallback candidates for Cracked when no direct/bank/combo shot is open
  if (candidates.length === 0 && tier === 'cracked') {
    for (const t of targets.slice(0, 4)) {
      const kicks: Array<[number, number]> = [
        [t.x, t.y],
        [t.x, 2 * BALL_R - t.y],
        [t.x, 2 * (TABLE_H - BALL_R) - t.y],
      ];
      for (const [tx, ty] of kicks) {
        const ax = tx - cueX;
        const ay = ty - cueY;
        const len = Math.hypot(ax, ay) || 1;
        candidates.push({ dx: ax / len, dy: ay / len, speed: Math.min(MAX_SHOT_SPEED, 1.5), heurScore: 0.1 });
        candidates.push({ dx: ax / len, dy: ay / len, speed: MAX_SHOT_SPEED, heurScore: 0.05 });
      }
    }
  }

  candidates.sort((a, b) => b.heurScore - a.heurScore);

  // 4. Physics verification for Shark & Cracked
  if (profile.useSim && candidates.length > 0) {
    const top = candidates.slice(0, profile.simBudget);
    const simTrials: CandidateShot[] = [];
    for (const c of top) {
      simTrials.push(c);
      if (tier === 'cracked') {
        simTrials.push({ ...c, speed: Math.min(MAX_SHOT_SPEED, c.speed * 1.25) });
        simTrials.push({ ...c, speed: MAX_SHOT_SPEED });
      }
    }
    let bestSim: { shot: CandidateShot; score: number } | null = null;
    for (const c of simTrials) {
      const simTable = beginShot(balls, c.dx * c.speed, c.dy * c.speed);
      settle(simTable);
      const v = judge(balls, simTable.events, [group, group], 0, gameMode);
      let score = 0;
      if (v.winner === 0) score += 1000;
      else if (v.winner === 1) score -= 2000;
      if (v.foul) score -= 500;
      else {
        score += v.ownPotted * 200;
        if (gameMode === '8ball' && group !== null) {
          const oppPotted = v.potted.length - v.ownPotted;
          score -= oppPotted * 60;
        }
        if (tier === 'cracked' && v.continues) {
          score += shapeScore(simTable.balls, v.groups[0], gameMode);
        }
      }
      if (!bestSim || score > bestSim.score) {
        bestSim = { shot: c, score };
      }
    }
    if (bestSim && bestSim.score > -200) {
      const a = (rnd() - 0.5) * profile.aimJitter;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const dx = bestSim.shot.dx * ca - bestSim.shot.dy * sa;
      const dy = bestSim.shot.dx * sa + bestSim.shot.dy * ca;
      return { vx: dx * bestSim.shot.speed, vy: dy * bestSim.shot.speed };
    }
  }

  let chosen: CandidateShot;
  if (candidates.length > 0) {
    chosen = candidates[0];
  } else {
    const t = targets[Math.floor(rnd() * targets.length)] ?? { x: TABLE_W / 2, y: TABLE_H / 2 };
    const ax = t.x - cueX;
    const ay = t.y - cueY;
    const len = Math.hypot(ax, ay) || 1;
    const speed = Math.min(MAX_SHOT_SPEED, Math.sqrt(2 * ROLL_DECEL * len * 1.3) * profile.powerBoost);
    chosen = { dx: ax / len, dy: ay / len, speed, heurScore: 0 };
  }

  const a = (rnd() - 0.5) * profile.aimJitter;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const dx = chosen.dx * ca - chosen.dy * sa;
  const dy = chosen.dx * sa + chosen.dy * ca;
  return { vx: dx * chosen.speed, vy: dy * chosen.speed };
}
