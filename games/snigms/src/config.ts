// Tuning numbers and data tables. Change the game's feel here, not in gameplay code.
import type { FloorKind, FurnitureDef, JobDef, JobId, NeedId, TraitId } from './types';

export const SAVE_KEY = 'snigms.save.v1';

// ---- lot and building ----
export const LOT_W = 24;
export const LOT_H = 18;
export const WALL_HEIGHT = 1.7;
export const WALL_THICK = 0.12;
export const COST = { wall: 5, door: 30, window: 20, floor: 2 } as const; // acorns per edge / tile
export const SELL_RATIO = 0.7;
export const START_FUNDS = { empty: 2500, starter: 900 } as const;

// ---- time ----
/** Sim minutes per real second at each Speed (index = Speed; 0 = paused). A day is 24 real minutes at 1x... see below. */
export const SPEEDS = [0, 2, 6, 16] as const; // 1x: 1 sim day = 12 real minutes
export const WAKE_HOUR = 7;
export const BILLS_PER_DAY = 25; // acorns charged at midnight (the Tall Ones' rent, in snail-mail form)
export const WORK_NEED_RATE = 0.6; // needs decay this fraction as fast while at work
export const WALK_SPEED = 2.2; // tiles per real second

// ---- town and neighbours ----
/** The town is a level document (src/data/levels/town.level.json), edited in the level editor. Tiles, not metres. */
export const TOWN_OPEN_HOUR = 17; // free evenings out start here
export const TOWN_CLOSE_HOUR = 22; // everyone heads home at this hour (bedtime)
export const TRIP_MINUTES = 20; // sim minutes on the road each way
export const TOWN_STAY_MINUTES = 150; // a free evening out lasts about this long
export const FREE_TRIP_CHANCE = 0.4; // per idle decision in the evening: chance to go out (once a day)
export const SOCIAL_RANGE = 2.2; // tiles: a neighbour this close can be chatted to
export const CHAT_SECONDS = 3.5; // real seconds the gnome stands and talks
export const CHAT_COOLDOWN = 60; // sim minutes before the same neighbour talks to the gnome again
export const CHAT_CHANCE = 0.6; // when a neighbour is in range and the gnome is free: chance it talks
export const FRIEND_STEP = 4; // friendship gained per chat
/** Friendship thresholds: the level is the highest one reached. */
export const FRIEND_LEVELS = [
  { at: 0, name: 'Stranger' },
  { at: 20, name: 'Acquaintance' },
  { at: 50, name: 'Friend' },
  { at: 80, name: 'Best friend' },
] as const;

// ---- temper (the gnome's own mind) ----
export const TEMPER_START = 70;
export const TEMPER_CRASH_BELOW = 15; // under this a crash-out can start
export const CRASH_CHANCE_PER_HOUR = 0.3; // chance per sim hour, once under TEMPER_CRASH_BELOW
export const CRASH_MINUTES = 150; // a crash-out lasts about this long (suggestions ignored the whole time)
export const TEMPER_AFTER_CRASH = 45;
export const TEMPER_REFUSED = 10; // a suggestion the gnome ignores costs this much temper
export const TEMPER_UNPAID = 15; // a bill that cannot be paid costs this much temper
export const TEMPER_DRIFT = 0.1; // per sim hour, temper moves this fraction of the way toward mood
export const TEMPER_CRITICAL_HOURLY = 3; // per sim hour, temper lost while any need is under CRITICAL

/** Chance the gnome does what the player suggested, from its temper. Calm: almost always. Stewing: a coin flip or worse. Under 20: never. */
export function obeyChance(temper: number): number {
  if (temper >= 60) return 0.95;
  if (temper < 20) return 0;
  return 0.2 + (0.75 * (temper - 20)) / 40;
}

// ---- needs ----
export const NEEDS: NeedId[] = ['hunger', 'energy', 'bladder', 'hygiene', 'fun'];
export const NEED_LABEL: Record<NeedId, string> = { hunger: 'Hunger', energy: 'Energy', bladder: 'Bladder', hygiene: 'Hygiene', fun: 'Fun' };
export const NEED_ICON: Record<NeedId, string> = { hunger: '🍄', energy: '🌙', bladder: '🚽', hygiene: '🫧', fun: '🎲' };
/** Points lost per SIM HOUR, before the trait multiplier. */
export const DECAY: Record<NeedId, number> = { hunger: 4.2, energy: 3.4, bladder: 5.5, hygiene: 2.6, fun: 3.8 };
/** The brain acts on the lowest need once it falls under this. */
export const ACT_BELOW = 45;
/** Below this a need hurts mood a lot. */
export const CRITICAL = 20;
export const MOOD_WEIGHT: Record<NeedId, number> = { hunger: 1, energy: 1, bladder: 1.2, hygiene: 0.8, fun: 1 };

/** Multipliers on DECAY per trait. Missing = 1. `pay` multiplies shift pay. */
export const TRAITS: Record<TraitId, { name: string; blurb: string; decay: Partial<Record<NeedId, number>>; pay?: number }> = {
  neat: { name: 'Neat', blurb: 'Hygiene fades slowly. Hates a mess, loves a bath.', decay: { hygiene: 0.5, fun: 1.1 } },
  glutton: { name: 'Glutton', blurb: 'Always hungry, but a good meal goes a long way.', decay: { hunger: 1.5, fun: 0.9 } },
  sleepy: { name: 'Sleepy', blurb: 'Tires quickly. Bed is the best furniture.', decay: { energy: 1.5, hunger: 0.9 } },
  goofy: { name: 'Goofy', blurb: 'Gets bored fast. Telly is life.', decay: { fun: 1.6, bladder: 0.9 } },
  hustler: { name: 'Hustler', blurb: 'Earns 20% more per shift, but plays less.', decay: { fun: 1.3 }, pay: 1.2 },
};

// ---- furniture ----
// Sizes are in tiles at rot 0. `prefab` ids: existing ones in packages/prefabs, plus the new ones in catalog/snigms.ts
// (toilet, sink, bathtub, shower, stove, tv). The view centres each prefab in its footprint.
export const FURNITURE: Record<string, FurnitureDef> = {
  // bedroom
  bed: { kind: 'bed', prefab: 'bed', name: 'Bed', room: 'bedroom', price: 120, w: 1, d: 2, counts: 'bedroom',
    use: { action: 'sleep', verb: 'Sleeping in the bed', pose: 'lie', at: 'on', rates: { energy: 14, hygiene: -0.5 }, maxMinutes: 600, sfx: 'yawn' } },
  wardrobe: { kind: 'wardrobe', prefab: 'wardrobe', name: 'Wardrobe', room: 'bedroom', price: 70, w: 2, d: 1, counts: 'bedroom' },
  'chest-of-drawers': { kind: 'chest-of-drawers', prefab: 'chest-of-drawers', name: 'Chest of drawers', room: 'bedroom', price: 55, w: 1, d: 1, counts: 'bedroom' },
  'side-table': { kind: 'side-table', prefab: 'side-table', name: 'Bedside table', room: 'bedroom', price: 25, w: 1, d: 1 },
  lamp: { kind: 'lamp', prefab: 'lamp', name: 'Lamp', room: 'decor', price: 20, w: 1, d: 1 },
  // bathroom
  toilet: { kind: 'toilet', prefab: 'toilet', name: 'Toilet', room: 'bathroom', price: 70, w: 1, d: 1, counts: 'bathroom',
    use: { action: 'toilet', verb: 'Using the toilet', pose: 'sit', at: 'on', rates: { bladder: 300 }, maxMinutes: 15, sfx: 'flush' } },
  sink: { kind: 'sink', prefab: 'sink', name: 'Sink', room: 'bathroom', price: 55, w: 1, d: 1, counts: 'bathroom',
    use: { action: 'wash', verb: 'Washing up', pose: 'stand', at: 'front', rates: { hygiene: 90 }, maxMinutes: 20, sfx: 'splash' } },
  bathtub: { kind: 'bathtub', prefab: 'bathtub', name: 'Bathtub', room: 'bathroom', price: 150, w: 1, d: 2, counts: 'bathroom',
    use: { action: 'bath', verb: 'Soaking in the tub', pose: 'bathe', at: 'on', rates: { hygiene: 75, fun: 8 }, maxMinutes: 90, sfx: 'splash' } },
  shower: { kind: 'shower', prefab: 'shower', name: 'Shower', room: 'bathroom', price: 120, w: 1, d: 1, counts: 'bathroom',
    use: { action: 'shower', verb: 'Showering', pose: 'stand', at: 'on', rates: { hygiene: 160 }, maxMinutes: 30, sfx: 'splash' } },
  // kitchen
  fridge: { kind: 'fridge', prefab: 'fridge', name: 'Fridge', room: 'kitchen', price: 150, w: 1, d: 1, counts: 'kitchen',
    use: { action: 'snack', verb: 'Having a snack', pose: 'stand', at: 'front', rates: { hunger: 90 }, maxMinutes: 20, cost: 3 } },
  stove: { kind: 'stove', prefab: 'stove', name: 'Stove', room: 'kitchen', price: 150, w: 1, d: 1, counts: 'kitchen',
    use: { action: 'cook', verb: 'Cooking a mushroom stew', pose: 'cook', at: 'front', rates: { hunger: 85, fun: 4 }, maxMinutes: 60, cost: 8 } },
  counter: { kind: 'counter', prefab: 'counter', name: 'Counter', room: 'kitchen', price: 40, w: 2, d: 1, counts: 'kitchen' },
  cupboard: { kind: 'cupboard', prefab: 'cupboard', name: 'Cupboard', room: 'kitchen', price: 45, w: 2, d: 1, counts: 'kitchen' },
  table: { kind: 'table', prefab: 'table', name: 'Table', room: 'kitchen', price: 35, w: 2, d: 1 },
  chair: { kind: 'chair', prefab: 'chair', name: 'Chair', room: 'kitchen', price: 15, w: 1, d: 1,
    use: { action: 'relax', verb: 'Sitting a spell', pose: 'sit', at: 'on', rates: { energy: 3, fun: 4 }, maxMinutes: 45 } },
  // living room
  couch: { kind: 'couch', prefab: 'couch', name: 'Sofa', room: 'living', price: 200, w: 3, d: 1, counts: 'living',
    use: { action: 'relax', verb: 'Lounging on the sofa', pose: 'sit', at: 'on', rates: { fun: 22, energy: 5 }, maxMinutes: 120 } },
  armchair: { kind: 'armchair', prefab: 'armchair', name: 'Armchair', room: 'living', price: 110, w: 1, d: 1, counts: 'living',
    use: { action: 'relax', verb: 'Relaxing in the armchair', pose: 'sit', at: 'on', rates: { fun: 16, energy: 6 }, maxMinutes: 120 } },
  tv: { kind: 'tv', prefab: 'tv', name: 'Telly', room: 'living', price: 180, w: 1, d: 1, counts: 'living',
    use: { action: 'tv', verb: 'Watching the telly', pose: 'stand', at: 'front', rates: { fun: 40 }, maxMinutes: 120 } },
  bookshelf: { kind: 'bookshelf', prefab: 'bookshelf', name: 'Bookshelf', room: 'living', price: 100, w: 2, d: 1, counts: 'living',
    use: { action: 'read', verb: 'Reading a book', pose: 'stand', at: 'front', rates: { fun: 28 }, maxMinutes: 90 } },
  hearth: { kind: 'hearth', prefab: 'hearth', name: 'Hearth', room: 'living', price: 140, w: 2, d: 1, counts: 'living',
    use: { action: 'relax', verb: 'Warming up by the hearth', pose: 'stand', at: 'front', rates: { fun: 12, energy: 4 }, maxMinutes: 60 } },
  // decor (any room)
  rug: { kind: 'rug', prefab: 'rug', name: 'Rug', room: 'decor', price: 30, w: 2, d: 2, flat: true },
  plant: { kind: 'plant', prefab: 'plant', name: 'Potted plant', room: 'decor', price: 25, w: 1, d: 1 },
  painting: { kind: 'painting', prefab: 'painting', name: 'Painting', room: 'decor', price: 40, w: 1, d: 1 },
  'grandfather-clock': { kind: 'grandfather-clock', prefab: 'grandfather-clock', name: 'Grandfather clock', room: 'decor', price: 130, w: 1, d: 1 },
};
// town (room 'town': not in the furnish tabs; placed by the level document src/data/levels/town.level.json, one prefab per kind)
const TOWN: Record<string, FurnitureDef> = {
  'spore-sprout': { kind: 'spore-sprout', prefab: 'city-building', name: 'Spore & Sprout', room: 'town', price: 0, w: 4, d: 3,
    use: { action: 'cafe', verb: 'Having a mushroom coffee at the Spore & Sprout', pose: 'sit', at: 'front', rates: { hunger: 70, fun: 10 }, maxMinutes: 30, cost: 6 } },
  'post-office': { kind: 'post-office', prefab: 'log-cabin', name: 'Post office', room: 'town', price: 0, w: 3, d: 2 },
  cottage: { kind: 'cottage', prefab: 'garden-shed', name: 'Cottage', room: 'town', price: 0, w: 2, d: 2 },
  fountain: { kind: 'fountain', prefab: 'stone-fountain', name: 'Fountain', room: 'town', price: 0, w: 3, d: 3,
    use: { action: 'relax', verb: 'Watching the fountain splash', pose: 'stand', at: 'front', rates: { fun: 14 }, maxMinutes: 40 } },
  bench: { kind: 'bench', prefab: 'bench', name: 'Bench', room: 'town', price: 0, w: 2, d: 1,
    use: { action: 'relax', verb: 'Sitting on the bench', pose: 'sit', at: 'on', rates: { energy: 10, fun: 8 }, maxMinutes: 60 } },
  'picnic-table': { kind: 'picnic-table', prefab: 'picnic-table', name: 'Picnic table', room: 'town', price: 0, w: 2, d: 2,
    use: { action: 'relax', verb: 'Sitting at the picnic table', pose: 'sit', at: 'front', rates: { fun: 12, energy: 4 }, maxMinutes: 60 } },
  tree: { kind: 'tree', prefab: 'broadleaf-tree', name: 'Tree', room: 'town', price: 0, w: 2, d: 2 },
  hedge: { kind: 'hedge', prefab: 'round-bush', name: 'Hedge', room: 'town', price: 0, w: 2, d: 2 },
  'lamp-post': { kind: 'lamp-post', prefab: 'street-lamp', name: 'Lamp post', room: 'town', price: 0, w: 1, d: 1 },
};
Object.assign(FURNITURE, TOWN);
/** The town's furniture kinds (room 'town'), by kind. The level document names them by prefab. */
export const TOWN_KINDS = Object.keys(TOWN);
export const FURNITURE_TABS = ['bedroom', 'bathroom', 'kitchen', 'living', 'decor'] as const;
export const FLOORS: FloorKind[] = ['lawn', 'wood', 'tile', 'carpet', 'stone'];
export const FLOOR_COLOR: Record<FloorKind, number> = { lawn: 0x7ab648, wood: 0xb98a55, tile: 0xcfe3e6, carpet: 0xa5566b, stone: 0x9a9a92 };

// ---- jobs ----
// Weekdays 0..4 work, 5 and 6 off (day 1 is a 0). Shifts are sim hours; the gnome is away that long and comes home paid.
export const JOBS: Record<JobId, JobDef> = {
  gardener: { id: 'gardener', name: 'Gardener', blurb: 'Weeds, hedges and fertiliser. Early starts.', startHour: 8, hours: 8, workdays: [0, 1, 2, 3, 4],
    levels: [
      { title: 'Weed Puller', pay: 70, shiftsToPromote: 4 },
      { title: 'Hedge Trimmer', pay: 110, shiftsToPromote: 6 },
      { title: 'Head Gardener', pay: 170, shiftsToPromote: Infinity },
    ] },
  mailgnome: { id: 'mailgnome', name: 'Mailgnome', blurb: 'Deliver letters across the Yard before the dogs wake.', startHour: 7, hours: 7, workdays: [0, 1, 2, 3, 4, 5],
    levels: [
      { title: 'Letter Sorter', pay: 65, shiftsToPromote: 4 },
      { title: 'Route Runner', pay: 105, shiftsToPromote: 6 },
      { title: 'Postmaster', pay: 160, shiftsToPromote: Infinity },
    ] },
  chef: { id: 'chef', name: 'Mushroom Chef', blurb: 'Evening shifts at the Spore & Sprout. Tips are good.', startHour: 15, hours: 8, workdays: [1, 2, 3, 4, 5],
    levels: [
      { title: 'Spore Scrubber', pay: 75, shiftsToPromote: 4 },
      { title: 'Line Cook', pay: 120, shiftsToPromote: 6 },
      { title: 'Head Fungus Chef', pay: 185, shiftsToPromote: Infinity },
    ] },
  mechanic: { id: 'mechanic', name: 'Mower Mechanic', blurb: 'Oil, blades and the occasional escaped mower.', startHour: 9, hours: 8, workdays: [0, 1, 2, 3, 4],
    levels: [
      { title: 'Oil Gnome', pay: 80, shiftsToPromote: 5 },
      { title: 'Blade Sharpener', pay: 130, shiftsToPromote: 7 },
      { title: 'Chief Greasegnome', pay: 200, shiftsToPromote: Infinity },
    ] },
};
export const JOB_IDS = Object.keys(JOBS) as JobId[];
/** A gnome who skips a work day because they were still asleep or too late loses nothing but the pay; mood below this at the end of a shift counts as a bad shift (no progress). */
export const GOOD_SHIFT_MOOD = 40;

// ---- achievement / event names the game raises through app.event(name, n?) ----
export const EVENTS = ['first-wall', 'first-room', 'first-furniture', 'first-shift', 'promoted', 'full-house', 'first-bath', 'spent-big', 'week-survived', 'all-jobs-tried', 'first-town', 'first-friend', 'best-friend', 'crash-out', 'obeyed'] as const;
