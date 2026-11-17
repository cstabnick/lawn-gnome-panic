// Skate-style flick tricks from the trick stick, and combo scoring. Pure: no DOM, no window, no Math.random.
import {
  AIR_GESTURES, BOARD_TRICKS, GRABS, GRINDS, GROUND_GESTURES, type BoardTrick, type ComboView, type GrindDef, type Mode,
  type PhysEvent, type Player, type TrickCmd,
} from './config';

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

const TRAIL_S = 0.4;
const LOAD_MAX = 0.3;
const GESTURE_MAX_S = 0.45;
/** A flick that reaches the top is judged when the stick leaves the top half, or rests this long in one top zone, so a
 *  sweep through → on its way up to ↑ (hardflip) is not cut short at ↗ (varial heelflip). */
const SETTLE_S = 0.08;
/** After a pull-back, the load stays armed this long even if the stick springs back to centre (a mouse cannot hold
 *  the stick down, and a fast pad flick from down to up passes through centre between samples). */
const ARM_S = 0.5;
/** A plain flick up from centre, with no pull-back, still pops a small ollie. */
const PLAIN_OLLIE_POWER = 0.45;
const SHOVE_AFTER_S = 0.22;
const AIR_WINDOW_S = 0.15;
const AIR_FLICK_M = 0.75;

export interface Recognizer {
  /** Feed one simulation step of the trick stick. Returns a command for the physics, or null. */
  /** mod: a grab button is held (on the ground it picks the harder version of a pop; in the air the stick picks the grab instead of flicking). */
  feed(stick: { x: number; y: number }, mode: Mode, dt: number, mod?: boolean): TrickCmd | null;
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
  let armedUntil = -Infinity;
  let leftAt = 0;
  let visitedW = false;
  let visitedE = false;
  let sideAt = -1;
  let sideZone: 'W' | 'E' = 'W';

  // air
  let aPhase: 'idle' | 'wait' = 'idle';
  let lastCentre = -Infinity;
  /** After a pop, air flicks wait for the stick to come back to centre first (the pop's own flick never fires one). */
  let needCentre = false;
  // the top of a ground gesture
  let topZone: Zone | null = null;
  let topAt = 0;
  let modSeen = false;

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

  /** The ground trick from GROUND_GESTURES for a gesture that ends on `last` (a top zone, or the side it shoves on),
   *  with the grab state `mod` at this moment. A side visited on the way picks the 2-zone entry, if there is one. */
  function groundTrickFor(last: Zone, mod: boolean): BoardTrick | null {
    const other = sideZone === 'W' ? 'E' : 'W';
    for (const s of [sideZone, other] as const) {
      if (!(s === 'W' ? visitedW : visitedE)) continue;
      const g = GROUND_GESTURES.find((g) => g.mod === mod && g.path.length === 2 && g.path[0] === s && g.path[1] === last);
      if (g) return g.trick;
    }
    return GROUND_GESTURES.find((g) => g.mod === mod && g.path.length === 1 && g.path[0] === last)?.trick ?? null;
  }

  function sidePop(mod: boolean): TrickCmd | null {
    const trick = groundTrickFor(sideZone, mod);
    return trick ? { kind: 'pop', trick, power: powerOf(loadAtStart) } : null;
  }

  function feedGround(z: Zone, prev: Zone, dt: number, mod: boolean): TrickCmd | null {
    if (gPhase === 'locked') {
      if (z === 'C') gPhase = 'idle';
      return null;
    }
    if (gPhase === 'idle') {
      if (BOTTOM.has(z)) {
        loadT = Math.min(LOAD_MAX, loadT + dt);
        armedUntil = clock + ARM_S;
        return null;
      }
      const armed = BOTTOM.has(prev) || clock < armedUntil;
      if (z === 'C') {
        if (!armed) loadT = 0;
        return null;
      }
      if (!armed) {
        // No pull-back: a plain flick up is a small ollie; anything else is not a gesture.
        if (z === 'N' && prev === 'C') {
          gPhase = 'locked';
          needCentre = true;
          return { kind: 'pop', trick: 'ollie', power: PLAIN_OLLIE_POWER };
        }
        return null;
      }
      armedUntil = -Infinity;
      gPhase = 'gesture';
      loadAtStart = loadT;
      leftAt = clock;
      visitedW = visitedE = false;
      sideAt = -1;
      topZone = null;
      modSeen = false;
    }
    modSeen = modSeen || mod; // a grab held at any point of the flick counts
    // gesture
    if (z !== prev) {
      if (z === 'W' || z === 'E') {
        if (z === 'W') visitedW = true; else visitedE = true;
        if (sideAt < 0) { sideAt = clock; sideZone = z; }
      }
    }
    // Reached the top: judge the flick where it ends (left the top half, rested, or ran out of time).
    if (TOP.has(z) && z !== topZone) {
      topZone = z;
      topAt = clock;
    }
    if (topZone !== null) {
      const ended = !TOP.has(z) || clock - topAt >= SETTLE_S || clock - leftAt >= GESTURE_MAX_S;
      if (!ended) return null;
      gPhase = z === 'C' ? 'idle' : 'locked';
      loadT = 0;
      needCentre = true;
      const trick = groundTrickFor(topZone, modSeen);
      topZone = null;
      return trick ? { kind: 'pop', trick, power: powerOf(loadAtStart) } : null;
    }
    const sideSeen = visitedW || visitedE;
    if (z === 'C') {
      // Passing through centre on the way up is fine (the timeout below ends a gesture that goes nowhere).
      if (!sideSeen) {
        if (clock - leftAt >= GESTURE_MAX_S) { gPhase = 'idle'; loadT = 0; }
        return null;
      }
      gPhase = 'idle';
      loadT = 0;
      needCentre = true;
      return sidePop(modSeen);
    }
    if (sideSeen && clock - sideAt >= SHOVE_AFTER_S) {
      gPhase = 'locked';
      needCentre = true;
      return sidePop(modSeen);
    }
    if (clock - leftAt >= GESTURE_MAX_S) {
      gPhase = 'locked';
    }
    return null;
  }

  function feedAir(z: Zone, m: number, mod: boolean): TrickCmd | null {
    if (needCentre) {
      if (z === 'C') needCentre = false;
      return null;
    }
    if (aPhase === 'wait') {
      if (z === 'C') aPhase = 'idle';
      return null;
    }
    if (z === 'C') { lastCentre = clock; return null; }
    if (m < AIR_FLICK_M) return null;
    // With a grab held the stick picks the grab in the physics: the flick is used up but fires nothing.
    aPhase = 'wait';
    if (mod || clock - lastCentre > AIR_WINDOW_S) return null;
    const g = AIR_GESTURES.find((g) => g.zone === z);
    return g ? { kind: 'air', trick: g.trick } : null;
  }

  return {
    feed(stick, mode, dt, mod = false) {
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
      if (kind === 'air') return feedAir(cur, m, mod);
      return feedGround(cur, prev, dt, mod);
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
const LEY_BONUS = 1.3;

export function createCombo(): Combo {
  const lines: string[] = [];
  let running = false;
  let points = 0;
  let linkLeft = 0;
  let total = 0;
  let best = 0;
  let last: ComboView['last'] = null;
  let onGround = false;
  /** Grind lines added since the current grind started (the first one of a ley-line gets the "Ley-line" word). */
  let grindLines = 0;
  const v: ComboView = { lines, points: 0, mult: 0, linkLeft: 0, total: 0, best: 0, last: null };

  function start(): void {
    running = true;
  }

  function add(line: string, pts: number): void {
    start();
    lines.push(line);
    points += pts;
  }

  function grindLine(def: GrindDef, t: number, ley: boolean): void {
    const prefix = ley && grindLines === 0 ? 'Ley-line ' : '';
    grindLines++;
    add(`${prefix}${def.name} ${t.toFixed(1)}s`, Math.round((def.base + def.perS * t) * (ley ? LEY_BONUS : 1)));
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
          if (ev.t >= 0.2) {
            const g = GRABS[ev.name];
            add(`${g.name} ${ev.t.toFixed(1)}s`, Math.round(g.points + 150 * ev.t));
          }
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
          grindLines = 0;
          if (Math.abs(ev.spin) >= 180) {
            add(`${ev.spin > 0 ? 'BS' : 'FS'} ${Math.abs(ev.spin)} in`, spinPoints(ev.spin));
          }
          break;
        case 'grindSwitch':
          grindLine(GRINDS[ev.from], ev.t, ev.ley);
          break;
        case 'grindEnd':
          grindLine(GRINDS[ev.kind], ev.t, ev.ley);
          break;
        case 'warp':
          add('Aether Warp', 1000);
          bank(p.t);
          break;
        case 'bail':
          last = { text: 'BAILED', points: points * Math.max(1, lines.length), t: p.t, kind: 'bailed' };
          reset();
          break;
        case 'skyfall':
          last = { text: 'LOST IN THE AETHER', points: points * Math.max(1, lines.length), t: p.t, kind: 'bailed' };
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
