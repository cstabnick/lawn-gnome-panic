// Skate-style flick tricks from the trick stick, and combo scoring. Pure: no DOM, no window, no Math.random.
import { BOARD_TRICKS, type BoardTrick, type ComboView, type Mode, type PhysEvent, type Player, type TrickCmd } from './config';

// ---------------------------------------------------------------- zones
type Zone = 'C' | 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
const TOP: ReadonlySet<Zone> = new Set<Zone>(['N', 'NE', 'NW']);
const BOTTOM: ReadonlySet<Zone> = new Set<Zone>(['S', 'SW', 'SE']);

/** The zone of a stick angle in degrees (0 = up, 90 = right). */
function zoneOfAngle(a: number): Zone {
  const abs = Math.abs(a);
  if (abs < 22.5) return 'N';
  if (abs >= 157.5) return 'S';
  if (a > 0) return a < 67.5 ? 'NE' : a < 112.5 ? 'E' : 'SE';
  return a > -67.5 ? 'NW' : a > -112.5 ? 'W' : 'SW';
}

const AIR_TRICK: Record<Exclude<Zone, 'C'>, BoardTrick> = {
  W: 'kickflip', E: 'heelflip', NW: 'varialKick', NE: 'varialHeel',
  N: 'impossible', S: 'popShove', SW: 'treFlip', SE: 'hardflip',
};

const TRAIL_S = 0.4;
const LOAD_MAX = 0.3;
const GESTURE_MAX_S = 0.35;
const SHOVE_AFTER_S = 0.22;
const AIR_WINDOW_S = 0.15;
const AIR_FLICK_M = 0.75;

export interface Recognizer {
  /** Feed one simulation step of the trick stick. Returns a command for the physics, or null. */
  feed(stick: { x: number; y: number }, mode: Mode, dt: number): TrickCmd | null;
  /** The stick's recent path (last ~0.4 s, oldest first), for the HUD's stick display. */
  trail(): { x: number; y: number }[];
}

export function createRecognizer(): Recognizer {
  let clock = 0;
  let cur: Zone = 'C';
  let lastKind: 'ground' | 'air' | 'bail' | null = null;
  const samples: { x: number; y: number; t: number }[] = [];

  // ground
  let gPhase: 'idle' | 'gesture' | 'locked' = 'idle';
  let loadT = 0;
  let loadAtStart = 0;
  let leftAt = 0;
  let visitedW = false;
  let visitedE = false;
  let sideAt = -1;
  let sideZone: 'W' | 'E' = 'W';

  // air
  let aPhase: 'idle' | 'wait' = 'idle';
  let lastCentre = -Infinity;

  function resetState(): void {
    gPhase = 'idle';
    loadT = 0;
    visitedW = visitedE = false;
    sideAt = -1;
    aPhase = 'idle';
  }

  function powerOf(load: number): number {
    return Math.min(1, Math.max(0.4, 0.4 + 0.6 * load / LOAD_MAX));
  }

  function groundTrick(top: Zone): BoardTrick {
    if (top === 'N') return visitedW ? 'treFlip' : visitedE ? 'hardflip' : 'ollie';
    if (top === 'NW') {
      if (visitedW) return 'varialKick';
      return 'kickflip'; // a mouse flick reaches NW in one step, so speed cannot pick a double: kickflip always
    }
    return visitedE ? 'varialHeel' : 'heelflip'; // NE
  }

  function feedGround(z: Zone, prev: Zone, dt: number): TrickCmd | null {
    if (gPhase === 'locked') {
      if (z === 'C') gPhase = 'idle';
      return null;
    }
    if (gPhase === 'idle') {
      if (z === 'C') { loadT = 0; return null; }
      if (BOTTOM.has(z)) { loadT = Math.min(LOAD_MAX, loadT + dt); return null; }
      if (!BOTTOM.has(prev)) return null; // entered from the top or a side without a load: not a gesture
      gPhase = 'gesture';
      loadAtStart = loadT;
      leftAt = clock;
      visitedW = visitedE = false;
      sideAt = -1;
    }
    // gesture
    if (z !== prev) {
      if (z === 'W' || z === 'E') {
        if (z === 'W') visitedW = true; else visitedE = true;
        if (sideAt < 0) { sideAt = clock; sideZone = z; }
      }
    }
    if (TOP.has(z)) {
      gPhase = 'locked';
      return { kind: 'pop', trick: groundTrick(z), power: powerOf(loadAtStart) };
    }
    const sideSeen = visitedW || visitedE;
    if (z === 'C') {
      gPhase = 'idle';
      loadT = 0;
      if (!sideSeen) return null;
      return { kind: 'pop', trick: sideZone === 'W' ? 'popShove' : 'fsShove', power: powerOf(loadAtStart) };
    }
    if (sideSeen && clock - sideAt >= SHOVE_AFTER_S) {
      gPhase = 'locked';
      return { kind: 'pop', trick: sideZone === 'W' ? 'popShove' : 'fsShove', power: powerOf(loadAtStart) };
    }
    if (clock - leftAt >= GESTURE_MAX_S) {
      gPhase = 'locked';
    }
    return null;
  }

  function feedAir(z: Zone, m: number): TrickCmd | null {
    if (aPhase === 'wait') {
      if (z === 'C') aPhase = 'idle';
      return null;
    }
    if (z === 'C') { lastCentre = clock; return null; }
    if (m < AIR_FLICK_M) return null;
    aPhase = 'wait';
    if (clock - lastCentre > AIR_WINDOW_S) return null;
    return { kind: 'air', trick: AIR_TRICK[z] };
  }

  return {
    feed(stick, mode, dt) {
      clock += dt;
      const m = Math.hypot(stick.x, stick.y);
      const prev = cur;
      if (m < 0.3) cur = 'C';
      else if (m >= 0.6) cur = zoneOfAngle((Math.atan2(stick.x, stick.y) * 180) / Math.PI);
      samples.push({ x: stick.x, y: stick.y, t: clock });
      while (samples.length > 0 && clock - samples[0].t > TRAIL_S) samples.shift();

      const kind = mode === 'air' ? 'air' : mode === 'bail' ? 'bail' : 'ground';
      if (kind !== lastKind) { resetState(); lastKind = kind; }
      if (kind === 'bail') return null;
      if (kind === 'air') return feedAir(cur, m);
      return feedGround(cur, prev, dt);
    },
    trail() {
      const out: { x: number; y: number }[] = [];
      for (let i = samples.length - 1; i >= 0; i -= 2) out.push({ x: samples[i].x, y: samples[i].y });
      return out.reverse();
    },
  };
}

// ---------------------------------------------------------------- combo
export interface Combo {
  event(ev: PhysEvent, p: Player): void;
  tick(dt: number, p: Player): void;
  view(): ComboView;
}

const LINK_S = 1.4;
const TEXT_MAX = 80;

export function createCombo(): Combo {
  const lines: string[] = [];
  let running = false;
  let points = 0;
  let linkLeft = 0;
  let total = 0;
  let best = 0;
  let last: ComboView['last'] = null;
  let onGround = false;
  const v: ComboView = { lines, points: 0, mult: 0, linkLeft: 0, total: 0, best: 0, last: null };

  function start(): void {
    running = true;
  }

  function add(line: string, pts: number): void {
    start();
    lines.push(line);
    points += pts;
  }

  function bank(t: number): void {
    const mult = Math.max(1, lines.length);
    const score = points * mult;
    total += score;
    best = Math.max(best, score);
    let text = lines.join(' + ');
    if (text.length > TEXT_MAX) text = text.slice(0, TEXT_MAX - 1) + '…';
    last = { text, points: score, t, kind: 'landed' };
    reset();
  }

  function reset(): void {
    lines.length = 0;
    running = false;
    points = 0;
    linkLeft = 0;
  }

  function spinPoints(spin: number): number {
    const n = Math.abs(spin) / 180;
    return Math.round(n * 100 * (1 + 0.25 * (n - 1)));
  }

  return {
    event(ev, p) {
      switch (ev.e) {
        case 'takeoff':
          start();
          break;
        case 'pop':
          if (ev.trick === 'ollie') add('Ollie', 50);
          break;
        case 'trickDone': {
          const def = BOARD_TRICKS[ev.trick];
          add(def.name, def.points);
          break;
        }
        case 'grabEnd':
          if (ev.t >= 0.2) add(`${ev.kind === 1 ? 'Indy' : 'Melon'} ${ev.t.toFixed(1)}s`, Math.round(100 + 150 * ev.t));
          break;
        case 'land': {
          if (Math.abs(ev.spin) >= 180) {
            const dir = ev.spin > 0 ? 'BS' : 'FS';
            add(`${dir} ${Math.abs(ev.spin)}${ev.switchLand ? ' switch' : ''}`, spinPoints(ev.spin));
          }
          if (ev.flips !== 0) {
            const k = Math.abs(ev.flips);
            const name = ev.flips > 0 ? 'Frontflip' : 'Backflip';
            if (k === 2) add(`Double ${name}`, 800);
            else for (let i = 0; i < k; i++) add(name, 400);
          }
          if (ev.perfect) add('Perfect', 100);
          if (lines.length > 0) linkLeft = LINK_S;
          break;
        }
        case 'grindStart':
          start();
          if (Math.abs(ev.spin) >= 180) {
            add(`${ev.spin > 0 ? 'BS' : 'FS'} ${Math.abs(ev.spin)} in`, spinPoints(ev.spin));
          }
          break;
        case 'grindEnd':
          add(`${ev.ley ? 'Ley-line' : 'Rail'} Grind ${ev.t.toFixed(1)}s`, Math.round(ev.ley ? 150 + 80 * ev.t : 100 + 60 * ev.t));
          break;
        case 'warp':
          add('Aether Warp', 1000);
          bank(p.t);
          break;
        case 'bail':
          last = { text: 'BAILED', points: points * Math.max(1, lines.length), t: p.t, kind: 'bailed' };
          reset();
          break;
        case 'respawn':
          if (running) {
            last = { text: 'BAILED', points: points * Math.max(1, lines.length), t: p.t, kind: 'bailed' };
          }
          reset();
          break;
      }
    },
    tick(dt, p) {
      onGround = p.mode === 'ground';
      if (p.mode === 'ground' && linkLeft > 0) {
        linkLeft -= dt;
        if (linkLeft <= 0) {
          linkLeft = 0;
          if (running) bank(p.t);
        }
      }
    },
    view() {
      v.lines = lines;
      v.points = points;
      v.mult = running ? Math.max(1, lines.length) : 0;
      v.linkLeft = running && onGround ? linkLeft : 0;
      v.total = total;
      v.best = best;
      v.last = last;
      return v;
    },
  };
}
