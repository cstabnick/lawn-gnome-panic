// CPU bowlers: who they are (the roster), how they pick a throw, and what they shout.
// game.ts calls npcThrow when it is a CPU bowler's turn; audio.ts calls npcQuip for their voice line.
// To add a bowler: add a NpcId in config.ts, an outfit in LOOKS (config.ts), and an entry here.
import { PIN_SPOTS, THROW, type LookId, type NpcId, type ResultKind, type ThrowInput } from './config';
import { clampThrow, simulateThrow } from './physics';

export interface NpcProfile {
  id: NpcId;
  /** Name on the scoreboard (max 16 chars). */
  name: string;
  /** Announcer's tagline: "Now bowling, Big Lou, <title>!" */
  title: string;
  /** Outfit in LOOKS. */
  look: LookId;
  /** Hat / name tag colour. */
  color: number;
  /**
   * 0..1. 0 = wild beginner, 1 = near-perfect. npcThrow uses it for how hard it searches for a good throw
   * and how much random wobble it adds to the chosen one.
   */
  skill: number;
  /** Ball speed this bowler likes, m/s (THROW.speedMin..speedMax). */
  speed: number;
  /** Hook this bowler likes, -1..1 (> 0 curves toward +x, the bowler's left). */
  spin: number;
  /** Speech pitch for their voice line (Web Speech 0..2). */
  pitch: number;
}

export const NPCS: Record<NpcId, NpcProfile> = {
  lou: { id: 'lou', name: 'Big Lou', title: 'the Lane Legend', look: 'lou', color: 0xff7043, skill: 0.85, speed: 8.6, spin: 0.55, pitch: 0.6 },
  gnertrude: { id: 'gnertrude', name: 'Granny Gnertrude', title: 'the Granny Hammer', look: 'gnertrude', color: 0xce93d8, skill: 0.6, speed: 5.2, spin: 0.15, pitch: 1.7 },
  robo: { id: 'robo', name: 'Robo-Gnome 3000', title: 'the Bowling Machine', look: 'robo', color: 0xb0bec5, skill: 0.95, speed: 9.2, spin: 0.6, pitch: 0.2 },
  chad: { id: 'chad', name: 'Gnome Chad', title: 'the Gutter Prince', look: 'chad', color: 0x26c6da, skill: 0.3, speed: 9.8, spin: 0.9, pitch: 1.2 },
};

/** Order the menu cycles through. */
export const NPC_ORDER: readonly NpcId[] = ['lou', 'gnertrude', 'robo', 'chad'];

export const isNpcId = (v: unknown): v is NpcId => typeof v === 'string' && (NPC_ORDER as readonly string[]).includes(v);

/** Candidate throws per bowler: round(CANDIDATES_BASE + CANDIDATES_SPAN * skill), counting the home throw. */
const CANDIDATES_BASE = 4;
const CANDIDATES_SPAN = 20;
/** Furthest x the random candidates and the spare home throw may use (inside THROW.xRange). */
const SEARCH_X = 0.42;
/** Pins-knocked penalty for a gutter ball when scoring a candidate. */
const GUTTER_PENALTY = 5;
/** Wobble sizes at skill 0 (scaled by 1 - skill). */
const WOBBLE = { x: 0.14, aim: 0.03, speed: 1.5, spin: 0.5 } as const;
/** Spares: the straight throw is at least this fast. */
const SPARE_MIN_SPEED = 7;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** The bowler's natural throw: the pocket ball on a full rack, or a straight ball at the standing pins. */
function homeThrow(profile: NpcProfile, standing: readonly boolean[]): ThrowInput {
  let sum = 0;
  let n = 0;
  let full = true;
  PIN_SPOTS.forEach(([px], i) => {
    if (standing[i]) {
      sum += px;
      n++;
    } else {
      full = false;
    }
  });
  if (full) return { x: -0.25, aim: 0, speed: profile.speed, spin: profile.spin };
  const x = n > 0 ? clamp(sum / n, -SEARCH_X, SEARCH_X) : 0;
  return { x, aim: 0, speed: Math.max(profile.speed, SPARE_MIN_SPEED), spin: 0 };
}

/** A random candidate: anywhere across the lane, near the bowler's usual speed, hook either theirs or none. */
function randomThrow(profile: NpcProfile, rand: () => number): ThrowInput {
  const x = (rand() * 2 - 1) * SEARCH_X;
  const aim = (rand() * 2 - 1) * THROW.aimRange;
  const speed = profile.speed + (rand() * 2 - 1);
  const spin = rand() < 0.5 ? profile.spin : 0;
  return { x, aim, speed, spin };
}

/**
 * The throw this CPU bowler makes at the pins still standing. `rand` returns 0..1 (Math.random in play,
 * seeded in tests). The result is always inside THROW's ranges.
 * Searches candidate throws with the real physics (simulateThrow), keeps the one knocking the most standing
 * pins, then wobbles it by (1 - skill). Low skill searches little and wobbles more.
 */
export function npcThrow(profile: NpcProfile, standing: readonly boolean[], rand: () => number): ThrowInput {
  const skill = clamp(profile.skill, 0, 1);
  const total = Math.round(CANDIDATES_BASE + CANDIDATES_SPAN * skill);
  const candidates: ThrowInput[] = [clampThrow(homeThrow(profile, standing))];
  for (let i = 1; i < total; i++) candidates.push(clampThrow(randomThrow(profile, rand)));

  let best = candidates[0];
  let bestScore = -Infinity;
  for (const c of candidates) {
    const r = simulateThrow(c, standing);
    let knocked = 0;
    for (let p = 0; p < PIN_SPOTS.length; p++) if (standing[p] && r.down[p]) knocked++;
    const score = knocked - (r.gutter ? GUTTER_PENALTY : 0);
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }

  const w = 1 - skill;
  const jitter = (amount: number) => (rand() - 0.5) * 2 * amount * w;
  const wobbled: ThrowInput = {
    x: best.x + jitter(WOBBLE.x),
    aim: best.aim + jitter(WOBBLE.aim),
    speed: best.speed + jitter(WOBBLE.speed),
    spin: best.spin + jitter(WOBBLE.spin),
  };
  return clampThrow(wobbled);
}

type QuipGroup = 'strikes' | 'spare' | 'bad' | 'split' | 'meh';

/** Lines are spoken by a text-to-speech voice: short, no emoji, no symbols. */
const QUIPS: Record<NpcId, Partial<Record<QuipGroup, string[]>>> = {
  lou: {
    strikes: ["That's how we did it in seventy-eight.", 'Lane is mine today, kid.', 'Still got the wrist, pal.'],
    spare: ['Spare is a spare. Good enough.', 'Picked it up clean.', 'Clean up, that is the job.'],
    bad: ['Ball is in the ditch. Happens.', 'Shoulda kept my elbow in.', 'Lane is oiled wrong tonight.'],
    split: ['A split. Makes a man cry.', 'Two pins, way apart. Tough.'],
    meh: ['One pin. Close, pal.', 'Nine counts, I guess.'],
  },
  gnertrude: {
    strikes: ['Oh my stars!', 'Back in my day pins were heavier.', 'Oh, my, look at that.'],
    spare: ['Oh, a spare, dear.', 'Tidy little spare, that.', 'Granny does not miss twice.'],
    bad: ['Oh dear, into the gutter again.', 'My knees are fine. The lane is not.', 'Hmph. Bad ball.'],
    split: ['Oh, a split. Bless the pins.', 'A split, sweetie. Hmph.'],
    meh: ['Oh, so close, dear.', 'One little pin. Hmph.'],
  },
  robo: {
    strikes: ['Strike protocol complete. Beep boop.', 'Pin deletion successful.', 'Human performance inadequate.'],
    spare: ['Spare located and removed.', 'Residual pin eliminated. Beep.'],
    bad: ['Error. Gutter detected. Rebooting.', 'Trajectory failure. Recalibrating.', 'Miss logged. Lane is flawed.'],
    split: ['Split detected. Probability low.', 'Split. Computing alternatives.'],
    meh: ['Nine pins. Adequate.', 'Pin count insufficient.'],
  },
  chad: {
    strikes: ['Bro!', 'Dude, did you see that?', 'Boom. Gnome Chad, baby.'],
    spare: ['Spare? Easy, bro.', 'Picked that right up, bro.'],
    bad: ['The lane is rigged, bro.', 'Gutter? Nah, that was on purpose.', 'Bro, the oil is wrong.'],
    split: ['Split? Bro, that is a vibe.', 'Split, bro. Lane is cursed.'],
    meh: ['Almost, bro.', 'One pin, bro. Respect.'],
  },
};

const QUIP_GROUP: Partial<Record<ResultKind, QuipGroup>> = {
  strike: 'strikes',
  double: 'strikes',
  turkey: 'strikes',
  hambone: 'strikes',
  spare: 'spare',
  gutter: 'bad',
  miss: 'bad',
  split: 'split',
  nine: 'meh',
  pins: 'meh',
};

/**
 * A short line this CPU bowler shouts after a ball of this kind (spoken by audio.ts in their pitch), or null
 * to stay quiet. A random line from the kind's group; 'meh' results are quiet half the time.
 */
export function npcQuip(id: NpcId, kind: ResultKind, count: number): string | null {
  void count;
  const group = QUIP_GROUP[kind];
  if (!group) return null;
  if (group === 'meh' && Math.random() < 0.5) return null;
  const lines = QUIPS[id]?.[group];
  if (!lines || lines.length === 0) return null;
  return lines[Math.floor(Math.random() * lines.length)];
}
