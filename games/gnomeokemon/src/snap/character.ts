// Character: how each Gnomokemon moves and decides, as a pure state machine.
// Pure: no THREE, no DOM, no Date, no Math.random (use input.rand). Units: world units and seconds.

import type { Temperament } from './temperament';

/** Fixed traits per species, 0 to 1. Drawn from the temperament and the dex "wants" line. */
export interface Personality {
  /** How close it lets Tag come before it moves off. */
  boldness: number;
  /** How often it turns to look at Tag or the bait. */
  curiosity: number;
  /** How far and how often it roams. */
  restlessness: number;
  /** How readily it hides in cover when Tag is near. */
  shyness: number;
  /** One short line, lore-derived, used for the Gnomokedex and debugging. */
  quirk: string;
}

export type MindState = 'graze' | 'roam' | 'look' | 'run' | 'hide' | 'lured' | 'rest';

export interface Point {
  x: number;
  z: number;
}

/** A creature's current decision. Seconds for timers; positions are world x, z. */
export interface Mind {
  state: MindState;
  /** Seconds left in the current state, or 0 when the state has no timer. */
  timer: number;
  /** Where it is heading, if it is moving. */
  target: Point | null;
  /** Index into the layout's cover, if it is hiding. */
  coverIndex: number | null;
  /** Seconds Tag has been outside its notice radius. Used for hide-until-past. */
  clearTime: number;
}

export interface MindInput {
  self: Point;
  /** Tag's position on the rail. */
  tag: Point;
  /** Where the bait landed, if a bait is live. */
  bait: Point | null;
  zone: { x: number; z: number; radius: number };
  /** Cover spots this course offers (the creature picks the nearest free one). */
  cover: readonly Point[];
  dt: number;
  /** Random number in [0, 1). Injected so tests are deterministic. */
  rand: () => number;
}

export interface MindStep {
  mind: Mind;
  /** Desired velocity in world units per second. The game applies it. */
  velocity: Point;
}

/** Default traits per temperament. Species overrides below adjust them. */
const BASE_TRAITS: Record<Temperament, Omit<Personality, 'quirk'>> = {
  docile: { boldness: 0.7, curiosity: 0.3, restlessness: 0.3, shyness: 0.1 },
  curious: { boldness: 0.6, curiosity: 0.9, restlessness: 0.6, shyness: 0.2 },
  skittish: { boldness: 0.2, curiosity: 0.4, restlessness: 0.7, shyness: 0.9 },
  shy: { boldness: 0.2, curiosity: 0.5, restlessness: 0.4, shyness: 0.9 },
  territorial: { boldness: 0.9, curiosity: 0.3, restlessness: 0.2, shyness: 0.1 },
  thief: { boldness: 0.7, curiosity: 0.9, restlessness: 0.8, shyness: 0.3 },
  sentinel: { boldness: 0.5, curiosity: 0.2, restlessness: 0.1, shyness: 0.2 },
  aloof: { boldness: 0.8, curiosity: 0.1, restlessness: 0.2, shyness: 0.2 },
};

/** Per-species trait changes, adjusted from each dex "wants" line. */
const TRAIT_OVERRIDES: Record<string, Partial<Personality>> = {
  // Shiny things: Thimblekin and Magpie Thief lean toward the bait and the lens.
  thimblekin: { curiosity: 1.0, restlessness: 0.9 },
  magpiethief: { curiosity: 1.0, boldness: 0.8 },
  rustcrab: { curiosity: 0.8, boldness: 0.8 },
  // Pester is a game to it: it splashes about.
  dewdrop: { restlessness: 0.8 },
  // Slow grazer under the rhubarb.
  mossback: { restlessness: 0.1 },
  // Curls up tight and stays curled.
  armadillan: { shyness: 1.0 },
  icicleimp: { shyness: 1.0 },
  pinego: { shyness: 1.0 },
  // Hops fast, then slows.
  clockworkfrog: { restlessness: 0.9 },
  // Races Tag around the Basin.
  frosthound: { restlessness: 1.0, boldness: 0.9 },
  // Leads its clan south: restless, and not easily scared off.
  grubthorn: { restlessness: 1.0, boldness: 0.1 },
  // Basks and ignores everything while it does.
  sunlizard: { boldness: 0.9 },
  // Slow and mostly water; stays where it is put.
  unfired: { restlessness: 0.1 },
  bonsaititan: { restlessness: 0.0 },
  // Tests whoever would light the Kiln, patiently.
  kilnwarden: { boldness: 0.8, curiosity: 0.4 },
  // Poses for a steady lens.
  gnomejesus: { boldness: 1.0, shyness: 0.0 },
};

/** One lore line per species, from its dex "wants" line. Creature's terms, never gore. */
const QUIRKS: Record<string, string> = {
  sproutling: 'Basks in a sunny patch of damp loam, sipping morning dew.',
  kilnpup: 'Chews charcoal cinders beside warm hearthstones, tail wagging.',
  dewdrop: 'Splashes joyfully in a clean puddle whenever pebbles drop in.',
  mossback: 'Grazes on wet lettuce, dozing in the deep shade of the rhubarb.',
  staghorn: 'Guards its grub-filled log mound and rears up at intruders.',
  thimblekin: 'Eyes your belongings and sneaks off with anything shiny.',
  hoseleech: 'Coils on its sunny bank and wants high water pressure.',
  strawight: 'Stands guard over the clover rows, waiting for the Straw King.',
  paperwasp: 'Circles its Paper Spire, watching for the Hedgewright loggers.',
  unfired: 'Plods slowly, longing to be finished in the Kiln.',
  grubthorn: 'Leads its clan south, always watching the shaking ground.',
  minimower: 'Stands by the Shed door, humming along to the tune.',
  armadillan: 'Curls up tight by the porch step, unrolling for crunchy beetles.',
  sunlizard: 'Stretches out on a flat red rock at noon to toast its belly.',
  cactuskin: 'Wants one spoonful of rain a month and plenty of respect.',
  tumblewight: 'Waits for a desert gust to roll it somewhere new.',
  clogmaw: 'Surges toward any opening, longing to flow freely once more.',
  rustcrab: 'Scuttles after shiny scrap nuts and a dry ledge above the backflow.',
  kilnwarden: 'Tests anyone who would light the great Kiln, patiently.',
  glowmoth: 'Circles a warm lantern or Heartspark glow at dusk.',
  seamower: 'Patrols the sunken basin, churning bubbles with its fins.',
  cisterneel: 'Lurks in dark pipes, drifting among the plankton.',
  drownedtoad: 'Sits on a quiet sunken ledge, hunting fat water-beetles.',
  barnacleknight: 'Stands by its tin-can helm in a quiet corner of the reef.',
  kelpsprite: 'Plays in sunbeams filtering down through the cistern water.',
  magpiethief: 'Hoards shiny things, especially Tall-eye glass marbles.',
  hedgewright: 'Keeps the Hedgewood timber clear and the Wildlings at bay.',
  acorndrake: 'Perches on high branches above warm pine resin.',
  bellrat: 'Sniffs out Keep pantry cheese rinds and rings its brass bell.',
  gnomespirit: 'Keeps the lawn in balance: cut a little, water a little.',
  mooncap: 'Glows under the greenhouse glass on a cool night of mist.',
  starbeetle: 'Gathers dewdrops on glass panes that catch the moonlight.',
  dewghost: 'Drifts toward a warm glass lantern and floats inside it.',
  bonsaititan: 'Stays rooted in its porcelain pot, wanting mist on its needles.',
  clockworkfrog: 'Hops fast, then slows, hopping up to be wound each night.',
  gnomejesus: 'Poses for a steady lens: every Gnomokemon framed with care.',
  snowcap: 'Seeks a warm wool scarf and a mug of heated cistern broth.',
  icicleimp: 'Hides in the shady eave so its horns do not melt.',
  pinego: 'Rolls into a pine cone and tucks into a cozy hedge burrow.',
  frosthound: 'Sprints around the frozen Basin each frosty morning, racing Tag.',
  chimneyowl: 'Roosts on a warm terracotta chimney pot, turning only its head.',
  frostking: 'Keeps the frozen Birdbath Basin undisturbed until the Rime ends.',
};

/** Traits for a species: the temperament's defaults, then the species override, then its quirk. */
export function personalityOf(speciesId: string, temperament: Temperament): Personality {
  const base = BASE_TRAITS[temperament] ?? BASE_TRAITS.docile;
  const over = TRAIT_OVERRIDES[speciesId] ?? {};
  return { ...base, ...over, quirk: QUIRKS[speciesId] ?? '' };
}

/** A fresh mind at the start of a ride. */
export function initialMind(): Mind {
  return { state: 'graze', timer: 0, target: null, coverIndex: null, clearTime: 0 };
}

const HIDE_NOTICE = 9;
const HIDE_CLEAR_SECONDS = 1.5;
const HIDE_SPEED = 2.5;
const HIDE_ARRIVE = 0.3;
const SHY_TRIGGER = 8;
const COVER_REACH = 6;
const RUN_SPEED = 2.2;
const RUN_SECONDS = 1.2;
const RUN_HIDE_SECONDS = 1.5;
const RUN_DISTANCE = 6;
const LOOK_RANGE = 10;
const LOOK_SECONDS = 1.5;
const LURE_SPEED = 1.6;
const LURE_ARRIVE = 0.6;
const EAT_SECONDS = 2;
const ROAM_ARRIVE = 0.4;

const STILL: Point = { x: 0, z: 0 };

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function copyPoint(p: Point): Point {
  return { x: p.x, z: p.z };
}

/** Velocity from `from` toward `to` at `speed`. Zero when there is no target or it is already there. */
function towardAt(from: Point, to: Point | null, speed: number): Point {
  if (!to) return { x: 0, z: 0 };
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const len = Math.hypot(dx, dz);
  if (len < 1e-9) return { x: 0, z: 0 };
  return { x: (dx / len) * speed, z: (dz / len) * speed };
}

/** A point `distance` from self, directly away from Tag. */
function awayFrom(self: Point, tag: Point, distance: number): Point {
  let dx = self.x - tag.x;
  let dz = self.z - tag.z;
  let len = Math.hypot(dx, dz);
  if (len < 1e-9) {
    dx = 1;
    dz = 0;
    len = 1;
  }
  return { x: self.x + (dx / len) * distance, z: self.z + (dz / len) * distance };
}

/** Index of the nearest cover spot within `reach` of self, or -1. */
function nearestCover(self: Point, cover: readonly Point[], reach: number): number {
  let best = -1;
  let bestD = reach;
  for (let i = 0; i < cover.length; i++) {
    const d = dist(self, cover[i]);
    if (d <= bestD) {
      best = i;
      bestD = d;
    }
  }
  return best;
}

/** A new roam target inside the zone, reached by the angle and distance rule. */
function pickRoamTarget(zone: MindInput['zone'], persona: Personality, rand: () => number): Point {
  const angle = 2 * Math.PI * rand();
  const reach = Math.min(1, Math.sqrt(rand())) * (0.4 + 0.6 * persona.restlessness);
  const r = zone.radius * reach;
  return { x: zone.x + Math.cos(angle) * r, z: zone.z + Math.sin(angle) * r };
}

/** Set the state through a call so the rule order below does not narrow `m.state` at compile time. */
function setState(m: Mind, state: MindState): void {
  m.state = state;
}

/** Switch to roaming with a fresh 4 to 8 second roam timer. */
function toRoam(m: Mind, rand: () => number): void {
  setState(m, 'roam');
  m.timer = 4 + 4 * rand();
  m.target = null;
  m.coverIndex = null;
}

/** One frame of decision and movement. Returns a new mind and velocity; inputs are not mutated. */
export function stepMind(mind: Mind, persona: Personality, input: MindInput): MindStep {
  const { self, tag, bait, zone, cover, dt, rand } = input;
  const d = dist(self, tag);
  const m: Mind = {
    state: mind.state,
    timer: mind.timer,
    target: mind.target ? copyPoint(mind.target) : null,
    coverIndex: mind.coverIndex,
    clearTime: mind.clearTime,
  };
  const done = (velocity: Point): MindStep => ({ mind: m, velocity });
  // Read through a closure so each rule sees the state as it is now, not as TypeScript narrowed it.
  const current = (): MindState => m.state;

  // 2. Hide: stay put until Tag has been clear of the notice radius for long enough.
  if (m.state === 'hide') {
    m.clearTime = d < HIDE_NOTICE ? 0 : m.clearTime + dt;
    if (m.clearTime < HIDE_CLEAR_SECONDS) {
      const still = !m.target || dist(self, m.target) <= HIDE_ARRIVE;
      return done(still ? STILL : towardAt(self, m.target, HIDE_SPEED));
    }
    setState(m, 'run');
    m.timer = RUN_HIDE_SECONDS;
    m.target = awayFrom(self, tag, RUN_DISTANCE);
    m.coverIndex = null;
  }

  // 3. Shy reaction: a shy creature that sees Tag close by goes for cover, or bolts.
  if (persona.shyness > 0.6 && d < SHY_TRIGGER && m.state !== 'hide' && m.state !== 'run') {
    const spot = nearestCover(self, cover, COVER_REACH);
    if (spot >= 0) {
      setState(m, 'hide');
      m.coverIndex = spot;
      m.target = copyPoint(cover[spot]);
      const still = dist(self, m.target) <= HIDE_ARRIVE;
      return done(still ? STILL : towardAt(self, m.target, HIDE_SPEED));
    }
    setState(m, 'run');
    m.timer = RUN_SECONDS;
    m.target = awayFrom(self, tag, RUN_DISTANCE);
  }

  // 4. Run: head for the target, then settle into roaming.
  if (m.state === 'run') {
    const vel = towardAt(self, m.target, RUN_SPEED);
    m.timer -= dt;
    if (m.timer <= 0) toRoam(m, rand);
    return done(vel);
  }

  // 5. Look: a curious creature turns to look at Tag.
  if (
    persona.curiosity > 0.5 &&
    d < LOOK_RANGE &&
    (m.state === 'graze' || m.state === 'roam' || m.state === 'rest') &&
    rand() < 1.2 * dt * persona.curiosity
  ) {
    setState(m, 'look');
    m.timer = LOOK_SECONDS;
    m.target = null;
    return done(STILL);
  }

  // 6. Lure: a creature comes to a bait the game has already approved (the temperament gate
  // decides who eats; this rule only moves them there, so a Shy creature is not dropped here).
  const eatingAtBait = m.state === 'graze' && !!bait && dist(self, bait) <= LURE_ARRIVE;
  if (
    bait &&
    current() !== 'hide' &&
    current() !== 'run' &&
    current() !== 'look' &&
    !eatingAtBait
  ) {
    if (dist(self, bait) <= LURE_ARRIVE) {
      setState(m, 'graze');
      m.timer = EAT_SECONDS;
      m.target = null;
      return done(STILL);
    }
    setState(m, 'lured');
    m.target = copyPoint(bait);
    return done(towardAt(self, m.target, LURE_SPEED));
  }
  if (m.state === 'lured') {
    // The bait is gone or the creature is no longer bold: wander off.
    toRoam(m, rand);
  }

  // 7. Timers: look, graze and rest count down. Calm grazers keep nibbling.
  if (m.state === 'look' || m.state === 'graze' || m.state === 'rest') {
    m.timer -= dt;
    if (m.timer <= 0) {
      if (m.state === 'graze' && persona.restlessness < 0.4 && rand() < 0.7) {
        m.timer = 3 + 3 * rand();
      } else {
        toRoam(m, rand);
      }
    }
  }

  // 8. Roam: wander inside the zone, now and then stopping to graze.
  if (m.state === 'roam') {
    m.timer -= dt;
    if (m.timer <= 0) {
      if (rand() < 0.5 - 0.4 * persona.restlessness) {
        setState(m, 'graze');
        m.timer = 3 + 3 * rand();
        m.target = null;
        return done(STILL);
      }
      m.timer = 4 + 4 * rand();
    }
    if (!m.target || dist(self, m.target) <= ROAM_ARRIVE) {
      m.target = pickRoamTarget(zone, persona, rand);
    }
    return done(towardAt(self, m.target, 0.3 + 0.7 * persona.restlessness));
  }

  // Graze, look and rest hold still. Rule 9 (rest) is not used by the rules above.
  return done(STILL);
}
