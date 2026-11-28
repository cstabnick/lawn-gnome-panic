// Gnomey Bird's rules, pure (no DOM) so the tests can run them. World units are canvas px at 320x480.
export interface GbState {
  t: number;
  y: number;
  vy: number;
  gaps: { x: number; gapY: number; scored: boolean }[];
  score: number;
  over: boolean;
  started: boolean;
  seed: number;
}

export const GB = {
  width: 320, height: 480, groundH: 56,
  gravity: 1250, flap: -400, gapH: 158, gapEvery: 1.6, speed: 136,
  gnomeX: 90, gnomeR: 14, hedgeW: 54,
  /** Most a gap centre may move from the one before it (keeps every gap reachable). */
  maxShift: 120,
  firstGapX: 400,
};

/** Small seeded RNG (mulberry32 step); returns [0,1) and advances the seed. */
function rnd(s: GbState): number {
  s.seed = (s.seed + 0x6d2b79f5) | 0;
  let t = Math.imul(s.seed ^ (s.seed >>> 15), 1 | s.seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function spawn(s: GbState, x: number): void {
  const lo = GB.gapH / 2 + 36;
  const hi = GB.height - GB.groundH - GB.gapH / 2 - 36;
  const prev = s.gaps.length ? s.gaps[s.gaps.length - 1].gapY : (lo + hi) / 2;
  const a = Math.max(lo, prev - GB.maxShift);
  const b = Math.min(hi, prev + GB.maxShift);
  s.gaps.push({ x, gapY: a + rnd(s) * (b - a), scored: false });
}

export function newGame(seed = 1): GbState {
  const s: GbState = { t: 0, y: GB.height * 0.42, vy: 0, gaps: [], score: 0, over: false, started: false, seed };
  spawn(s, GB.firstGapX);
  return s;
}

/** Flaps. The first flap starts the run; ignored once the run is over. */
export function flap(s: GbState): void {
  if (s.over) return;
  s.started = true;
  s.vy = GB.flap;
}

export function step(s: GbState, dtRaw: number): void {
  if (s.over) return;
  const dt = Math.min(Math.max(dtRaw, 0), 1 / 30);
  s.t += dt;
  if (!s.started) {
    // Hovers gently until the first flap.
    s.y = GB.height * 0.42 + Math.sin(s.t * 4) * 6;
    return;
  }
  s.vy += GB.gravity * dt;
  s.y += s.vy * dt;
  for (const g of s.gaps) g.x -= GB.speed * dt;
  while (s.gaps.length && s.gaps[0].x < -GB.hedgeW) s.gaps.shift();
  const last = s.gaps[s.gaps.length - 1];
  if (!last || last.x <= GB.width + GB.hedgeW - GB.gapEvery * GB.speed) {
    spawn(s, (last ? last.x : GB.width) + GB.gapEvery * GB.speed);
  }
  const r = GB.gnomeR;
  for (const g of s.gaps) {
    if (!g.scored && g.x + GB.hedgeW / 2 < GB.gnomeX - r) {
      g.scored = true;
      s.score++;
    }
    // A touch forgiving: the hit box is a little smaller than the drawn gnome.
    const hr = r * 0.8;
    if (Math.abs(g.x - GB.gnomeX) < GB.hedgeW / 2 + hr && (s.y - hr < g.gapY - GB.gapH / 2 || s.y + hr > g.gapY + GB.gapH / 2)) {
      s.over = true;
    }
  }
  if (s.y + r > GB.height - GB.groundH) {
    s.y = GB.height - GB.groundH - r;
    s.over = true;
  }
  if (s.y - r < 0) {
    s.y = r;
    s.vy = 0;
    s.over = true;
  }
}
