// Bot brain for Mower Chain. Pure: reads a snapshot of the world, returns an input. No Phaser, no DOM.
import { TUNING } from './config';
import type { MowerInput, MowerSnap } from './config';

const SEE_DIST = 160;                 // body segments this close in front of the head are a threat
const SEE_ARC = (70 * Math.PI) / 180; // ...if within this angle of the heading
const WALL_DIST = 250;                // closer than this to an edge: steer back to the centre
const PELLET_DIST = 600;              // pellets farther than this are ignored
const GOLD_BONUS = 60;                // gold counts as this many units closer
const FLEE_BOOST_SCORE = 30;          // only boost while fleeing and at least this big

function wrap(a: number): number {
  const t = Math.PI * 2;
  return ((((a + Math.PI) % t) + t) % t) - Math.PI;
}

/** Decide what a bot mower wants. Pure: reads the world as a snapshot, returns an input. rng() is in [0, 1). */
export function botInput(self: MowerSnap, mowers: readonly MowerSnap[], pellets: readonly number[], rng: () => number): MowerInput {
  const s = self.segs;
  const hx = s[0];
  const hy = s[1];
  // Heading: from body segment 1 toward the head.
  const heading = s.length >= 4 ? Math.atan2(hy - s[3], hx - s[2]) : 0;
  const wobble = (rng() - 0.5) * 0.2;

  // 1. Threat: another mower's body just ahead. Turn perpendicular, away from it.
  let threat: { dx: number; dy: number } | null = null;
  let threatD = Infinity;
  for (const o of mowers) {
    if (o.id === self.id || !o.alive) continue;
    const os = o.segs;
    for (let i = 2; i + 1 < os.length; i += 2) {
      const dx = os[i] - hx;
      const dy = os[i + 1] - hy;
      const d = Math.hypot(dx, dy);
      if (d === 0 || d >= SEE_DIST || d >= threatD) continue;
      if (Math.abs(wrap(Math.atan2(dy, dx) - heading)) > SEE_ARC) continue;
      threat = { dx, dy };
      threatD = d;
    }
  }
  if (threat) {
    // Perpendicular to the heading: dot > 0 means the threat is on the (-sin, cos) side.
    const dot = -Math.sin(heading) * threat.dx + Math.cos(heading) * threat.dy;
    const away = dot > 0 ? -1 : dot < 0 ? 1 : rng() < 0.5 ? -1 : 1;
    return {
      angle: heading + away * (Math.PI / 2) + wobble,
      boost: self.score >= FLEE_BOOST_SCORE,
    };
  }

  // 2. Wall: steer back toward the centre.
  const W = TUNING.WORLD_SIZE;
  if (hx < WALL_DIST || hy < WALL_DIST || hx > W - WALL_DIST || hy > W - WALL_DIST) {
    return { angle: Math.atan2(W / 2 - hy, W / 2 - hx) + wobble, boost: false };
  }

  // 3. Pellets: nearest within range, gold preferred when similarly close.
  let best = -1;
  let bestEff = Infinity;
  for (let i = 0; i + 2 < pellets.length; i += 3) {
    const d = Math.hypot(pellets[i] - hx, pellets[i + 1] - hy);
    if (d > PELLET_DIST) continue;
    const eff = d - (pellets[i + 2] === 1 ? GOLD_BONUS : 0);
    if (eff < bestEff) { bestEff = eff; best = i; }
  }
  const angle = best >= 0 ? Math.atan2(pellets[best + 1] - hy, pellets[best] - hx) : heading;
  return { angle: angle + wobble, boost: false };
}
