// Story row 64 (All Hats, extended), parts 1 and 2: seven scenes, comedy first, tension climbing to the triumph (7).
// By Water: dawn at the overlook rail, Pip's other sock and Tansy handing him the plan; Brenda opening New Puddle and
// charging for the waiver; the Bathtub Queen nosed into the dune cut with her tour aboard, too proud to follow a walnut;
// the Queen tied up at Brenda's travelling throne, a flamingo on her bow, a salute across the water.
// By Air: Hogweed's ratios against Wally's "just fly it" over a Hedge-Hopper's propeller (and the Dewdrop rolling past);
// Velma Crown counting the Crop Duster as a car at Brim Gap, the kit coming down on the Bobble, the beacon going up;
// Wally's binoculars on the apron: four aircraft that fly, one that rolls.
// The Queen (prefab `bathtub-queen` fitted to 6 m, as W16 moors her at the marina), the Underspanners' line, the kit and
// the beacon are cutscene-only (L95). Notes: docs/design/gnome-theft-auto/direction/scenes/all-hats-p1-*.md, -p2-*.md.
import type { SceneScript, Vec2, Vec3 } from '../../script';
import { beat, coverage, cut, insert, pushIn, reaction, shot } from '../../direct';
import { carMark, markOf, spot, up } from './kit';

const RAIL = 'm64a-overlook-rail';
const THRONE = 'brenda-throne';
const CUT = 'm64a-dune-cut';
const MARINA = 'm64a-marina';
const LINE = 'm64a-airfield-line';
const GAP = 'm64a-brim-gap';
const SUMMIT = 'm64a-bobble-summit';

const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

/** Pip's look in act IV (cast.ts preset), Underspanners in goggle-grey and grease, Brenda's pink gang. */
const UNDERSPAN_A = { hat: 0x6f86a3, shirt: 0x5a4a3a, pants: 0x2e2a26, glasses: true };
const UNDERSPAN_B = { hat: 0x6f86a3, shirt: 0x7a6a4a, pants: 0x3a342c, glasses: true, beard: 0x8a5a2a };
const PINK = 0xff69b4;
const BIKER_A = { hat: PINK, shirt: 0x2a2a2a, pants: 0x1a1a1a };
const BIKER_B = { hat: PINK, shirt: 0xf0c0d0, pants: 0x303040 };
const TOURIST = { hat: 0xf2e6a0, shirt: 0x3a8fb0, pants: 0x4a3a2a };

/**
 * The Bathtub Queen as a prop: `bathtub-queen` (3 m hull, deck top at 0.4) fitted to 6 m, so scale 2 and the deck 0.8 above
 * her waterline. Yaw PI puts her bow (+z) to the north. A point on her deck at scaled local (right, forward): world.
 */
const QUEEN_SIZE = 6;
const DECK_LIFT = 0.8;
function queenDeck(base: Vec3, right: number, forward: number): Vec3 {
  // yaw PI: local +z (forward) is world -z, local +x (right) is world -x.
  return [base[0] - right, base[1] + DECK_LIFT, base[2] - forward];
}

// ==== p1 intro: the other sock ===============================================================================================
const R_TANSY = markOf(RAIL, 'tansy');
const R_PIP = markOf(RAIL, 'pip');
const R_YOU = markOf(RAIL, 'player');
/** The scene's rail: a split-rail fence along the east lip of the rise, between Tansy and the highway bend. */
const RAIL_AT: Vec2 = [287.6, 36.6];
const SOCK_TALK = coverage('tansy', 'player', -1);
const PIP_TALK = coverage('pip', 'tansy', 1);

/**
 * Dawn at the overlook rail. The Don's crews are in; now everybody else. Pip unpegs the plan from his other sock (four
 * red crosses: water, air, road, root). Water first: the Queen, and New Puddle has a Baroness. Tansy reaches to take the
 * plan over, as she always has, and hands the sock back to Pip instead. He was not ready for that.
 */
export const P1_INTRO: SceneScript = {
  id: 'all-hats-p1-intro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'turfton',
  ambience: 'wind',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/all-hats-p1-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, held: null, at: R_YOU.at, yaw: towards(R_YOU.at, R_TANSY.at) },
    { id: 'tansy', preset: 'tansy', held: 'sock-map', at: R_TANSY.at, yaw: R_TANSY.yaw },
    { id: 'pip', preset: 'pip', held: null, at: R_PIP.at, yaw: towards(R_PIP.at, R_TANSY.at) },
  ],
  props: [
    { id: 'rail', prefab: 'split-rail-fence', at: up(RAIL_AT[0], RAIL_AT[1], 0), yaw: Math.PI / 2, size: 4, by: 'w' },
    { id: 'peg-crate', prefab: 'crate', at: up(284.6, 33.8, 0), yaw: 0.3, size: 0.7, by: 'h' },
    { id: 'pen-cup', prefab: 'tin-pail', at: up(284.6, 33.8, 0.7), yaw: 0, size: 0.3, by: 'h' },
  ],
  steps: [
    // Hook: the long dawn light along the rise, Tansy at the rail with the sock snapping in the wind.
    cut(spot(RAIL, 'wide')),
    { do: 'sfx', id: 'flutter', at: 'tansy', gain: 0.5, async: true },
    { do: 'gesture', who: 'pip', name: 'dance-hop', s: 1.2, async: true },
    { do: 'wait', s: 2.4 },
    // Setup: the previously, in her three clauses, and she gives the floor away.
    cut(SOCK_TALK.single('tansy', 'mcu')),
    { do: 'face', who: 'tansy', at: 'player', s: 0.5, async: true },
    { do: 'say', who: 'tansy', text: 'The Don tapped four times. His crews are in.' },
    { do: 'say', who: 'tansy', text: 'Now everybody else. Pip?' },
    cut(PIP_TALK.single('pip', 'ms')),
    { do: 'gesture', who: 'pip', name: 'handsUp', s: 1.2, async: true },
    { do: 'say', who: 'pip', text: 'Four ways to one table! By water, by air, by road, by root!' },
    ...reaction('player', { toward: 'tansy', hold: 'pause' }),
    cut(SOCK_TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'On a sock.' },
    cut(PIP_TALK.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'The other sock! The first one found the Combine. This one finds us.' },
    // The insert: four red crosses on the foot of a sock.
    cut(insert('tansy', { toward: 'player' })),
    { do: 'sfx', id: 'cloth', at: 'tansy', gain: 0.5, async: true },
    { do: 'wait', s: 1.6 },
    cut(SOCK_TALK.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Water first. Captain Bilge brings the Queen up the dune cut.' },
    cut(PIP_TALK.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Through New Puddle! Brenda tolls anything that floats and has opinions!' },
    cut(SOCK_TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Will she open it?' },
    // Turn: the old reflex. Tansy reaches to take the plan over, stops, and hands the sock to Pip.
    cut(pushIn('tansy', 'mcu', 3.0, { toward: 'player', side: -25 })),
    { do: 'gesture', who: 'tansy', name: 'think', s: 1.0, async: true },
    beat('pause'),
    // She answers the player to their face, and only then hands the sock across.
    { do: 'say', who: 'tansy', text: 'Ask the planner.' },
    { do: 'face', who: 'tansy', at: 'pip', s: 0.5 },
    { do: 'give', from: 'tansy', to: 'pip', prop: 'sock-map', s: 1.0 },
    // He was not ready for that.
    cut(shot('pip', 'cu', { toward: 'tansy', side: 30 })),
    { do: 'sfx', id: 'gulp', at: 'pip', gain: 0.5, async: true },
    beat('pause'),
    { do: 'say', who: 'pip', text: "...I'm the planner." },
    cut(PIP_TALK.single('pip', 'mcu')),
    { do: 'gesture', who: 'pip', name: 'point', s: 1.0, async: true },
    { do: 'say', who: 'pip', text: 'Okay! Be nice to her. Bring spark plugs.' },
    cut(SOCK_TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'She takes four.' },
    // Button: Pip's arithmetic, locked off, and Tansy's flat look on top of it.
    cut(shot('pip', 'ms', { toward: 'tansy', side: 45 })),
    { do: 'say', who: 'pip', text: 'Then bring five. Rounding!' },
    { do: 'sfx', id: 'tap', at: 'tansy', gain: 0.4, async: true },
    cut(SOCK_TALK.single('tansy', 'mcu')),
    { do: 'gesture', who: 'tansy', name: 'crossArms', s: 1.4, async: true },
    beat('pause'),
  ],
};

// ==== p1 toll: the waiver =====================================================================================================
const T_YOU = markOf(THRONE, 'player');
const T_BRENDA: Vec2 = [-44.8, 218];
const GOLD_BIKE = carMark(THRONE, 'brenda-bike');
const ROYAL = coverage('brenda', 'player', -1);

/**
 * Noon at the Vinyl Lounge. Brenda remembers every toll the player ever paid. New Puddle has opened to nobody since the
 * Hose Revolt; for the Bathtub Queen, whose captain she adores, she opens it for one day and waives the toll. The waiver
 * costs four spark plugs. The ribbon comes down and her gold bike's kazoo horn sounds the Republic's assent.
 */
export const P1_TOLL: SceneScript = {
  id: 'all-hats-p1-toll',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'triumph',
  ambience: 'water',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/all-hats-p1-toll.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, held: null, at: T_YOU.at, yaw: towards(T_YOU.at, T_BRENDA) },
    { id: 'brenda', preset: 'brenda', held: 'feather-duster', at: T_BRENDA, yaw: towards(T_BRENDA, T_YOU.at) },
    { id: 'b1', name: 'Biker', look: BIKER_A, at: [-51.6, 215.6], yaw: Math.PI / 2 },
    { id: 'b2', name: 'Biker', look: BIKER_B, at: [-37.4, 220.6], yaw: towards([-37.4, 220.6], T_BRENDA) },
  ],
  vehicles: [
    { id: 'gold-bike', kind: GOLD_BIKE.kind, at: GOLD_BIKE.at, yaw: GOLD_BIKE.yaw, tint: 0xd4a04a },
  ],
  props: [
    // New Puddle's toll line: pink bunting from bank to bank across the drainage canal, just east of the throne.
    { id: 'ribbon', prefab: 'bunting-span', at: [-30, 0, 230], yaw: Math.PI / 2 },
    { id: 'purse', prefab: 'coin-purse', at: up(-42.6, 216.2, 1.0), yaw: 0, size: 0.3, by: 'w', hidden: true },
  ],
  steps: [
    // Hook: the Republic's bank, a bike bell, a flamingo, a gang member leaning on the toll line's post.
    cut(spot(THRONE, 'wide')),
    { do: 'sfx', id: 'bell', at: 'gold-bike', gain: 0.6, async: true },
    { do: 'gesture', who: 'b1', name: 'crossArms', s: 1.4, async: true },
    { do: 'wait', s: 2.0 },
    // Setup: royalty, low and still. She remembers both tolls.
    cut(ROYAL.single('brenda', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'brenda', name: 'handsUp', s: 1.3, async: true },
    { do: 'say', who: 'brenda', text: 'Halt, vessel! The Republic remembers you. Fifty acorns, then four spark plugs.' },
    cut(ROYAL.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'A ship needs New Puddle. For one day.' },
    cut(ROYAL.single('brenda', 'mcu', { height: 'low' })),
    { do: 'say', who: 'brenda', text: 'Not since the Hose Revolt have we opened New Puddle to anyone.' },
    ...reaction('b1', { toward: 'brenda', gesture: 'shrug', hold: 'pause', side: 25 }),
    cut(ROYAL.single('player', 'mcu')),
    { do: 'say', who: 'player', text: "It's the Bathtub Queen." },
    // Turn: the name does it. A creak of the throne, a push-in, and the Baroness melts.
    cut(pushIn('brenda', 'mcu', 3.0, { toward: 'player', side: -25, height: 'low' })),
    { do: 'sfx', id: 'creak', at: 'brenda', gain: 0.4, async: true },
    beat('beat'),
    { do: 'say', who: 'brenda', text: 'Captain Bilge? We adore Captain Bilge.' },
    cut(ROYAL.single('brenda', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'brenda', name: 'point', s: 1.2, async: true },
    { do: 'say', who: 'brenda', text: 'By decree: New Puddle is open. One day. The toll is waived.' },
    ...reaction('player', { toward: 'brenda', gesture: 'nod', hold: 'pause' }),
    // The gag at the toll: a waiver is a service, and services are taxed.
    cut(ROYAL.single('brenda', 'mcu', { height: 'low' })),
    beat('beat'),
    { do: 'say', who: 'brenda', text: 'The waiver is four spark plugs.' },
    cut(ROYAL.two('ms')),
    { do: 'gesture', who: 'player', name: 'shrug', s: 1.1, async: true },
    { do: 'spawn', id: 'purse' },
    { do: 'sfx', id: 'clink', at: 'brenda', gain: 0.6, async: true },
    { do: 'wait', s: 1.2 },
    { do: 'despawn', id: 'purse' },
    // Button: the bunting comes down off the water and the gold bike gives the Republic's assent on its kazoo horn.
    cut(spot(THRONE, 'wide')),
    { do: 'despawn', id: 'ribbon' },
    { do: 'sfx', id: 'whoosh', at: [-30, 0.5, 230], gain: 0.4, async: true },
    { do: 'gesture', who: 'b2', name: 'cheer', s: 1.4, async: true },
    { do: 'horn', vehicle: 'gold-bike' },
    { do: 'wait', s: 1.8 },
  ],
};

// ==== p1 cut: follow that nut ==================================================================================================
const C_YOU = markOf(CUT, 'player');
const C_DRIFT = markOf(CUT, 'driftwood');
const C_DINGHY = carMark(CUT, 'm64a-lead-dinghy');
/** The Saltcut at the dune line sits at the Puddle Sea's level (water.ts): the Queen floats just under it. */
const CUT_SEA = -5.26;
const C_QUEEN: Vec3 = [712.4, CUT_SEA - 0.1, 950];
const C_TENDER = carMark(CUT, 'm64a-queen-tender');
const HAIL = coverage('samphire', 'player', 1);
const BANK = coverage('driftwood', 'samphire', 1);

/**
 * The dune cut at noon. The Bathtub Queen is nosed into the Saltcut, her captain in the tender at her side with the last
 * of the tour, booming at a dune. Samphire knows the player (the barge, from the stern). She has toured a pier four
 * hundred times and never a channel; Driftwood says follow a small boat; a walnut, for the Queen? The tourist asks if the
 * walnut is part of the tour.
 */
export const P1_CUT: SceneScript = {
  id: 'all-hats-p1-cut',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'turfton',
  ambience: 'shore',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/all-hats-p1-cut.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, held: null, at: C_YOU.at, yaw: towards(C_YOU.at, C_TENDER.at) },
    { id: 'driftwood', preset: 'driftwood', held: null, at: C_DRIFT.at, yaw: towards(C_DRIFT.at, C_TENDER.at) },
    { id: 'samphire', preset: 'samphire', held: 'toy-cutlass', at: [0, 0], seatedIn: 'tender' },
    { id: 't1', name: 'Tourist', look: TOURIST, at: [0, 0], seatedIn: 'tender', seat: 1 },
  ],
  vehicles: [
    { id: 'dinghy', kind: C_DINGHY.kind, at: C_DINGHY.at, yaw: C_DINGHY.yaw },
    { id: 'tender', kind: C_TENDER.kind, at: C_TENDER.at, yaw: C_TENDER.yaw },
  ],
  props: [
    { id: 'queen', prefab: 'bathtub-queen', at: C_QUEEN, yaw: Math.PI, size: QUEEN_SIZE, by: 'w' },
    { id: 'tour-flag', prefab: 'pl-tour-flag', at: queenDeck(C_QUEEN, -0.5, 1.6), yaw: 0, size: 1.0, by: 'h' },
  ],
  steps: [
    // Hook: the toy ship nosed into the cut, a bell, and a captain who has an audience whether or not it is a good idea.
    cut(spot(CUT, 'wide')),
    { do: 'sfx', id: 'bell', at: 'samphire', gain: 0.6, async: true },
    { do: 'gesture', who: 'samphire', name: 'handsUp', s: 1.4, async: true },
    { do: 'wait', s: 1.6 },
    cut(shot('samphire', 'ms', { side: -40 })),
    { do: 'say', who: 'samphire', text: 'And on your left, ladies and gentlegnomes: a dune!' },
    { do: 'gesture', who: 't1', name: 'clap', s: 1.2, async: true },
    // Setup: she knows the face on the bank.
    cut(HAIL.single('samphire', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'samphire', name: 'point', s: 1.2, async: true },
    { do: 'say', who: 'samphire', text: 'You! The one who boarded a barge from the stern!' },
    cut(HAIL.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'You need a pilot.' },
    cut(HAIL.single('samphire', 'mcu')),
    { do: 'say', who: 'samphire', text: 'The Queen has toured a pier four hundred times. Never a channel.' },
    // Driftwood, from the bank, in his own weather.
    cut(BANK.single('driftwood', 'mcu')),
    { do: 'gesture', who: 'driftwood', name: 'point', s: 1.0, async: true },
    { do: 'say', who: 'driftwood', text: 'She draws more than the cut, Captain. Follow a small boat.' },
    // Turn: the small boat is a walnut.
    cut(BANK.single('samphire', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'samphire', name: 'flinch', s: 0.8, async: true },
    { do: 'say', who: 'samphire', text: 'Follow a walnut? The Queen?' },
    cut(shot('t1', 'mcu', { toward: 'samphire', side: 30 })),
    { do: 'gesture', who: 't1', name: 'handsUp', s: 1.0, async: true },
    { do: 'say', who: 't1', text: 'Is the walnut part of the tour?' },
    cut(shot('samphire', 'mcu', { toward: 't1', side: -30, height: 'low' })),
    beat('beat'),
    { do: 'say', who: 'samphire', text: 'Madam. The walnut is the tour.' },
    // Driftwood hands over the painter: the tow from row 32, the other way round.
    { do: 'face', who: 'driftwood', at: 'player', s: 0.4 },
    cut(shot('driftwood', 'mcu', { toward: 'player', side: 25 })),
    { do: 'sfx', id: 'creak', at: 'dinghy', gain: 0.4, async: true },
    { do: 'say', who: 'driftwood', text: 'Take her, friend. Steady, like the raft.' },
    // Button: all hands, and the cut ahead of them, empty and narrow.
    cut(HAIL.single('samphire', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'samphire', name: 'handsUp', s: 1.4, async: true },
    { do: 'say', who: 'samphire', text: 'All hands! Follow that nut!' },
    cut(spot(CUT, 'up-cut')),
    { do: 'sfx', id: 'bell', at: 'samphire', gain: 0.6, async: true },
    { do: 'gesture', who: 't1', name: 'cheer', s: 1.4, async: true },
    { do: 'wait', s: 2.0 },
  ],
};

// ==== p1 outro: a flag ========================================================================================================
const M_YOU = markOf(MARINA, 'player');
const M_DINGHY = carMark(MARINA, 'm64a-dinghy-moored');
/** The east dock's top (waterworks.ts: wooden-dock at x 640, solid top y -4.74) and the Puddle Sea's level. */
const DOCK_Y = -4.74;
const PUDDLE = -5.26;
const M_QUEEN: Vec3 = [640, PUDDLE - 0.1, 786.4];
/** Samphire has stepped off onto the dock end (a dock is not dry land); Brenda's throne is mid-dock, facing her. */
const M_SAMPHIRE: Vec3 = [640, DOCK_Y, 780.8];
const M_BRENDA: Vec3 = [640, DOCK_Y, 776.6];
const M_BIKER: Vec3 = [639.1, DOCK_Y, 781.4];
const ACROSS = coverage('brenda', 'samphire', 1);

/**
 * Noon at New Puddle Marina. The Queen is tied off the end of the east dock, where Brenda has set out a deck chair
 * between two flamingos: the Vinyl Lounge, travelling. Brenda makes the Queen a citizen; Samphire says the Queen has only
 * ever been a lie; then a smuggler, and the Republic adores a smuggler. A biker plants a flamingo on the Queen's bow.
 * It is a flag. The captain salutes it, and the Baroness salutes back with a feather duster.
 */
export const P1_OUTRO: SceneScript = {
  id: 'all-hats-p1-outro',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'turfton',
  ambience: 'water',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/all-hats-p1-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, held: null, at: M_YOU.at, yaw: towards(M_YOU.at, [M_BRENDA[0], M_BRENDA[2]]) },
    { id: 'brenda', preset: 'brenda', held: 'feather-duster', at: M_BRENDA, yaw: 0 },
    { id: 'biker', name: 'Biker', look: BIKER_A, held: 'lawn-flamingo', at: M_BIKER, yaw: 0.6 },
    { id: 'samphire', preset: 'samphire', held: 'toy-cutlass', at: M_SAMPHIRE, yaw: Math.PI },
  ],
  vehicles: [
    { id: 'dinghy', kind: M_DINGHY.kind, from: 'player', at: M_DINGHY.at, yaw: M_DINGHY.yaw },
  ],
  props: [
    { id: 'queen', prefab: 'bathtub-queen', at: M_QUEEN, yaw: Math.PI, size: QUEEN_SIZE, by: 'w' },
    // The Vinyl Lounge, travelling: a deck chair mid-dock between two flamingos.
    { id: 'throne', prefab: 'deck-chair', at: [640, DOCK_Y, 776.9], yaw: 0, size: 1.3, by: 'w' },
    { id: 'flamingo-w', prefab: 'lawn-flamingo', at: [639.0, DOCK_Y, 777.9], yaw: 0, size: 0.9, by: 'h' },
    { id: 'flamingo-e', prefab: 'lawn-flamingo', at: [641.0, DOCK_Y, 777.9], yaw: 0, size: 0.9, by: 'h' },
    { id: 'bow-flag', prefab: 'lawn-flamingo', at: queenDeck(M_QUEEN, 0, 2.4), yaw: Math.PI, size: 0.9, by: 'h', hidden: true },
  ],
  steps: [
    // Hook: the ship's bell, the Queen tied off the dock end, a throne set out to meet her.
    cut(spot(MARINA, 'wide')),
    { do: 'sfx', id: 'bell', at: 'samphire', gain: 0.6, async: true },
    { do: 'gesture', who: 'brenda', name: 'sit', s: 0.3 },
    { do: 'sfx', id: 'creak', at: 'queen', gain: 0.4, async: true },
    { do: 'wait', s: 2.2 },
    // Setup: a citizenship, by decree, the length of a dock.
    cut(ACROSS.single('brenda', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'brenda', name: 'point', s: 1.2, async: true },
    { do: 'say', who: 'brenda', text: 'By decree: the Bathtub Queen is a citizen of New Puddle.' },
    cut(ACROSS.single('samphire', 'mcu')),
    { do: 'gesture', who: 'samphire', name: 'bow', s: 1.2, async: true },
    { do: 'say', who: 'samphire', text: 'Majesty! The Queen has never been a citizen. Only a lie.' },
    cut(ACROSS.single('brenda', 'mcu', { height: 'low' })),
    { do: 'say', who: 'brenda', text: 'Then a smuggler. The Republic adores a smuggler.' },
    ...reaction('player', { toward: 'brenda', gesture: 'nod', hold: 'pause' }),
    // Turn: the biker leans off the dock end and plants the Republic's colours on the Queen's bow.
    cut(shot('biker', 'ms', { side: -40 })),
    { do: 'gesture', who: 'biker', name: 'lean', s: 1.0 },
    { do: 'hold', who: 'biker', prop: null },
    { do: 'spawn', id: 'bow-flag' },
    { do: 'sfx', id: 'squeak', at: 'bow-flag', gain: 0.5, async: true },
    { do: 'wait', s: 0.8 },
    cut(ACROSS.single('samphire', 'mcu')),
    beat('beat'),
    { do: 'say', who: 'samphire', text: 'Is that a flamingo?' },
    cut(ACROSS.single('brenda', 'mcu', { height: 'low' })),
    { do: 'say', who: 'brenda', text: 'That is a flag.' },
    // Button: the salute down the dock, captain to Baroness, and a feather duster raised in reply.
    cut(spot(MARINA, 'broadside')),
    { do: 'gesture', who: 'samphire', name: 'salute', s: 1.6, async: true },
    { do: 'stinger', id: 'triumph' },
    { do: 'wait', s: 0.6 },
    { do: 'gesture', who: 'brenda', name: 'handsUp', s: 1.6, async: true },
    { do: 'sfx', id: 'bell', at: 'samphire', gain: 0.5, async: true },
    { do: 'wait', s: 2.0 },
  ],
};

// ==== p2 intro: ratios ========================================================================================================
const L_WALLY = markOf(LINE, 'wally');
const L_HOG = markOf(LINE, 'hogweed');
const L_U1 = markOf(LINE, 'underspanner', 0);
const L_U2 = markOf(LINE, 'underspanner', 1);
const HOPPER = carMark(LINE, 'm64a-line-hopper');
const BUGGY = carMark(LINE, 'm64a-hogweed-buggy');
const DEW_RUN: Vec2[] = [[432, -79.5], [470, -79.5], [520, -80]];
const BUGGY_OFF: Vec2[] = [[450, -60], [450, -20]];
/** Hogweed's chalk board on its easel, beside the Hedge-Hopper's nose. */
const BOARD: Vec2 = [461.0, -81.6];
const PROP_ROW = coverage('hogweed', 'wally', 1);
const CALL = coverage('tansy', 'player', -1);

/**
 * Noon. At the overlook, Tansy takes Wally's call: water is done. On the apron, Hogweed has re-pitched the propeller of
 * the Underspanners' Hedge-Hopper by a blackboard of ratios; Wally says just fly it. The Bobble is the highest ground in
 * the yard and the only range the HOA never named: a beacon on top, lit at dawn on the longest day. The Dewdrop rolls
 * past everyone. Hogweed goes up by road to build the fire himself. Wally asks for the kid and a stall speed.
 */
export const P2_INTRO: SceneScript = {
  id: 'all-hats-p2-intro',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'turfton',
  ambience: 'wind',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/all-hats-p2-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, held: null, at: R_YOU.at, yaw: towards(R_YOU.at, R_TANSY.at) },
    { id: 'tansy', preset: 'tansy', held: 'dispatch-radio', at: R_TANSY.at, yaw: towards(R_TANSY.at, R_YOU.at) },
    { id: 'wally', preset: 'wally', held: 'dispatch-radio', at: L_WALLY.at, yaw: towards(L_WALLY.at, L_HOG.at) },
    { id: 'hogweed', preset: 'hogweed', at: L_HOG.at, yaw: towards(L_HOG.at, L_WALLY.at) },
    { id: 'u1', name: 'Underspanner', look: UNDERSPAN_A, held: 'brass-wrench', at: L_U1.at, yaw: L_U1.yaw },
    { id: 'u2', name: 'Underspanner', look: UNDERSPAN_B, at: L_U2.at, yaw: L_U2.yaw },
    { id: 'roller', name: 'Underspanner', look: UNDERSPAN_A, hidden: true, seatedIn: 'dewdrop', at: [0, 0] },
  ],
  vehicles: [
    { id: 'hopper', kind: HOPPER.kind, at: HOPPER.at, yaw: HOPPER.yaw },
    { id: 'buggy', kind: BUGGY.kind, at: BUGGY.at, yaw: BUGGY.yaw },
    { id: 'dewdrop', kind: 'bubble-mobile', at: DEW_RUN[0], yaw: Math.PI / 2, hidden: true },
  ],
  props: [
    { id: 'board', prefab: 'chalk-equation-board', at: up(BOARD[0], BOARD[1], 0), yaw: towards(BOARD, L_WALLY.at), size: 1.8, by: 'h' },
    { id: 'rail', prefab: 'split-rail-fence', at: up(RAIL_AT[0], RAIL_AT[1], 0), yaw: Math.PI / 2, size: 4, by: 'w' },
  ],
  steps: [
    // Hook: the overlook radio crackles in Tansy's hand; the previously in five words.
    cut(CALL.single('tansy', 'mcu')),
    { do: 'sfx', id: 'static', at: 'tansy', gain: 0.5, async: true },
    { do: 'say', who: 'tansy', text: "The Queen's in. Water's done." },
    cut(CALL.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'And air?' },
    cut(CALL.single('tansy', 'mcu')),
    { do: 'sfx', id: 'static', at: 'tansy', gain: 0.6, async: true },
    { do: 'say', who: 'tansy', text: 'Air is arguing.' },
    // The apron: a Hedge-Hopper with its cowling off, a spanner on the hub, a blackboard of ratios.
    cut(spot(LINE, 'wide')),
    { do: 'sfx', id: 'clatter', at: 'hopper', gain: 0.6, async: true },
    { do: 'gesture', who: 'u1', name: 'wrench-fix', s: 2.0, async: true },
    { do: 'wait', s: 2.2 },
    cut(PROP_ROW.single('hogweed', 'ms')),
    { do: 'gesture', who: 'hogweed', name: 'point', s: 1.2, async: true },
    { do: 'say', who: 'hogweed', text: 'Point-four of a turn! The ratios say point-four! Look at them!' },
    // The insert: the ratios, and under them in another hand, JUST FLY IT.
    cut({ kind: 'cut', pos: up(BOARD[0] - 1.6, BOARD[1] + 1.4, 1.3), look: up(BOARD[0], BOARD[1], 1.2), fov: 34 }),
    { do: 'sfx', id: 'squeak', at: 'board', gain: 0.4, async: true },
    { do: 'wait', s: 1.4 },
    cut(PROP_ROW.single('wally', 'mcu')),
    { do: 'say', who: 'wally', text: "Stall speed's twenty-two, kid. Just fly it." },
    cut(PROP_ROW.single('hogweed', 'mcu')),
    { do: 'gesture', who: 'hogweed', name: 'handsUp', s: 1.2, async: true },
    { do: 'say', who: 'hogweed', text: 'Fly it where, Wally? The Bobble is the highest ground in the yard!' },
    cut(PROP_ROW.single('wally', 'mcu')),
    { do: 'say', who: 'wally', text: 'Highest, and never named. The HOA forgot it.' },
    cut(pushIn('hogweed', 'mcu', 2.8, { toward: 'wally', side: 25 })),
    { do: 'say', who: 'hogweed', text: 'Nobody can ban it! A beacon on top, lit at dawn on the longest day!' },
    cut(PROP_ROW.single('wally', 'mcu')),
    { do: 'say', who: 'wally', text: 'Then just fly it up there.' },
    cut(PROP_ROW.single('hogweed', 'mcu')),
    { do: 'gesture', who: 'hogweed', name: 'stomp', s: 0.8, async: true },
    { do: 'say', who: 'hogweed', text: 'With RATIOS!' },
    // Turn: the Dewdrop rolls between them, ahead of everybody, and nobody can finish the argument.
    { do: 'spawn', id: 'dewdrop' },
    { do: 'spawn', id: 'roller' },
    cut({ kind: 'track', pos: up(456, -73.6, 1.2), who: 'dewdrop', fov: 50 }),
    { do: 'drive', vehicle: 'dewdrop', path: DEW_RUN, speed: 5.5, arrive: false, async: true },
    { do: 'sfx', id: 'squeak', at: 'dewdrop', gain: 0.5, async: true },
    { do: 'face', who: 'wally', at: 'dewdrop', s: 0.4, async: true },
    { do: 'face', who: 'hogweed', at: 'dewdrop', s: 0.4, async: true },
    { do: 'wait', s: 2.6 },
    cut(PROP_ROW.single('hogweed', 'mcu')),
    { do: 'despawn', id: 'dewdrop' },
    { do: 'despawn', id: 'roller' },
    { do: 'face', who: 'hogweed', at: 'wally', s: 0.3 },
    { do: 'say', who: 'hogweed', text: "Ignore that. That isn't a plane." },
    cut(PROP_ROW.single('wally', 'mcu')),
    { do: 'face', who: 'wally', at: 'hogweed', s: 0.3 },
    { do: 'say', who: 'wally', text: "That isn't anything." },
    // Hogweed goes up by road, with his ratios. A Barrow Buggy down the spur at eleven miles an hour.
    cut(PROP_ROW.single('hogweed', 'mcu')),
    { do: 'say', who: 'hogweed', text: 'I am going up by road to build the fire. Roads have ratios.' },
    { do: 'enter', who: 'hogweed', vehicle: 'buggy', s: 0.8, async: true },
    cut({ kind: 'track', pos: up(456, -66, 1.6), who: 'buggy', fov: 48 }),
    { do: 'drive', vehicle: 'buggy', path: BUGGY_OFF, speed: 5, async: true },
    { do: 'sfx', id: 'engine-rev', at: 'buggy', gain: 0.4, async: true },
    { do: 'wait', s: 2.4 },
    // Wally, into the radio.
    cut(shot('wally', 'mcu')),
    { do: 'sfx', id: 'static', at: 'wally', gain: 0.5, async: true },
    { do: 'say', who: 'wally', text: 'Tansy. Send the kid. And a stall speed.' },
    // Button: Tansy, at the rail, to the player. One word.
    cut(CALL.single('tansy', 'mcu')),
    beat('beat'),
    { do: 'say', who: 'tansy', text: 'Twenty-two.' },
    beat('pause'),
  ],
};

// ==== p2 gap: cars today ======================================================================================================
const G_VELMA = markOf(GAP, 'velma');
const G_BUGGY = carMark(GAP, 'm64a-gap-buggy');
const S_HOG = markOf(SUMMIT, 'hogweed');
/** The coin telescope at the lookout (brimGapPlan.ts: lookout local (1.4, 0.2)). Velma turns it from the Pass to the sky. */
const SCOPE: Vec2 = [692.7, -1549.8];
/** The beacon on the Bobble's highest stones, just east of the cairn and the Summit Register, and the kit beside it. */
const BEACON: Vec2 = [697.4, -1688.4];
const KIT: Vec2 = [694.0, -1683.0];
/** The flight: up out of the south over Brim Gap, over the summit and on north; absolute heights, ~95 m over the gap. */
const FLIGHT: Vec3[] = [[701, 128, -1470], [696, 132, -1560], [692, 134, -1660], [688, 134, -1760]];
const FLIGHT_START: Vec3 = [704, 124, -1400];

/**
 * Noon at Brim Gap. Velma Crown counts the cars that stop at the Top Hat: three today, one of them Hogweed's Barrow Buggy.
 * A Crop Duster drones over the saddle; she looks up, and counts it. Four. In the plane, Wally sends the kit away. On the
 * Bobble, the kit comes down under Hogweed's parachute (it opened), and he stands the beacon on the highest stones of
 * the yard, to be lit at dawn on the longest day. At the café, Velma adds the fire to her card.
 */
export const P2_GAP: SceneScript = {
  id: 'all-hats-p2-gap',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'turfton',
  ambience: 'wind',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/all-hats-p2-gap.md', kind: 'arrival' },
  actors: [
    { id: 'velma', preset: 'velma', at: G_VELMA.at, yaw: towards(G_VELMA.at, SCOPE) - 0.6 },
    { id: 'player', player: true, held: null, at: [0, 0], seatedIn: 'duster' },
    { id: 'wally', preset: 'wally', held: null, at: [0, 0], seatedIn: 'duster', seat: 1 },
    { id: 'hogweed', preset: 'hogweed', at: S_HOG.at, yaw: towards(S_HOG.at, BEACON) },
  ],
  vehicles: [
    { id: 'duster', kind: 'plane', at: FLIGHT_START, yaw: Math.PI },
    { id: 'buggy', kind: G_BUGGY.kind, at: G_BUGGY.at, yaw: G_BUGGY.yaw },
  ],
  props: [
    { id: 'canopy', prefab: 'parachute-canopy', at: up(KIT[0], KIT[1], 0.6), yaw: 0.4, size: 2.4, by: 'w', hidden: true },
    { id: 'kit', prefab: 'cargo-crate', at: up(KIT[0], KIT[1], 0), yaw: 0.4, size: 0.9, by: 'h', hidden: true },
    { id: 'tripod', prefab: 'hatbrim-beacon', at: up(BEACON[0], BEACON[1], 0), yaw: 0, size: 2.4, by: 'h', hidden: true },
  ],
  steps: [
    // Hook: the saddle at noon, the café's black top hat, a buggy ticking; an engine drone climbing out of the south.
    cut(spot(GAP, 'wide')),
    { do: 'drive', vehicle: 'duster', path: FLIGHT, speed: 30, arrive: false, async: true },
    { do: 'sfx', id: 'clink', at: 'velma', gain: 0.5, async: true },
    { do: 'wait', s: 2.0 },
    // Setup: Velma at the coin telescope, counting the Pass, as she always does.
    cut(shot('velma', 'mcu', { side: 30 })),
    { do: 'gesture', who: 'velma', name: 'take-notes', s: 1.6, async: true },
    { do: 'say', who: 'velma', text: 'Cars today: three.' },
    { do: 'intro', who: 'velma' },
    // The Crop Duster over the saddle, low enough to read.
    cut(spot(GAP, 'sky')),
    { do: 'sfx', id: 'whoosh', at: 'duster', gain: 0.6, async: true },
    { do: 'wait', s: 1.8 },
    // Turn: she looks up, considers it, and counts it.
    cut(shot('velma', 'mcu', { side: 30, height: 'low' })),
    { do: 'face', who: 'velma', at: [692, -1640], s: 0.5 },
    beat('beat'),
    { do: 'gesture', who: 'velma', name: 'take-notes', s: 1.4, async: true },
    { do: 'sfx', id: 'paper', at: 'velma', gain: 0.5, async: true },
    { do: 'say', who: 'velma', text: 'Cars today: four.' },
    // In the plane: Wally, and the kit away.
    cut(shot('wally', 'ms', { side: 70 })),
    { do: 'say', who: 'wally', text: 'Over the summit, kid. Kit away. Do not look, it only worries it.' },
    { do: 'sfx', id: 'latch', at: 'duster', gain: 0.5, async: true },
    // The Bobble: Hogweed, the sky, and a striped parachute coming down onto the top of the yard.
    cut(spot(SUMMIT, 'wide')),
    { do: 'gesture', who: 'hogweed', name: 'shade-sun', s: 1.2, async: true },
    { do: 'wait', s: 1.0 },
    { do: 'spawn', id: 'canopy' },
    { do: 'spawn', id: 'kit' },
    { do: 'sfx', id: 'thud', at: 'kit', gain: 0.6, async: true },
    { do: 'sfx', id: 'flutter', at: 'canopy', gain: 0.5, async: true },
    { do: 'wait', s: 1.0 },
    cut(shot('hogweed', 'mcu', { side: 30 })),
    { do: 'gesture', who: 'hogweed', name: 'cheer', s: 1.4, async: true },
    { do: 'say', who: 'hogweed', text: 'It opened! I said almost certainly! Almost is a kind of certainly!' },
    // The beacon goes up on the highest stones in the yard.
    { do: 'despawn', id: 'canopy' },
    { do: 'despawn', id: 'kit' },
    cut(shot('hogweed', 'ms', { side: -40 })),
    { do: 'gesture', who: 'hogweed', name: 'wrench-fix', s: 1.6, async: true },
    { do: 'sfx', id: 'clatter', at: 'hogweed', gain: 0.5, async: true },
    { do: 'spawn', id: 'tripod' },
    { do: 'wait', s: 1.0 },
    { do: 'say', who: 'hogweed', text: 'Lit at dawn on the longest day. Not one minute sooner. Ratios.' },
    // Button: Velma, far below, adds a line to her card.
    cut(shot('velma', 'mcu', { side: 30, height: 'low' })),
    { do: 'sfx', id: 'paper', at: 'velma', gain: 0.5, async: true },
    { do: 'say', who: 'velma', text: 'Cars: four. Fires: one. Both honest.' },
    { do: 'wait', s: 1.2 },
  ],
};

// ==== p2 outro: an air force =================================================================================================
const O_WALLY = markOf(RAIL, 'wally');
const LANDED = carMark(RAIL, 'm64a-duster-landed');
const LINE_CARS = ['m64a-line-hopper', 'm64a-line-copter', 'm64a-line-duster', 'm64a-line-drifter'].map((id) => carMark(LINE, id));
const LINE_DEW = carMark(LINE, 'm64a-line-dewdrop');
const RAIL_TALK = coverage('wally', 'tansy', -1);

/**
 * Day at the overlook. The Crop Duster rolls to a stop on the dust. Wally, at the rail, puts his binoculars on the
 * airfield: the Underspanners' line, four aircraft that fly and, last, the Dewdrop, which rolls. Hogweed calls it an air
 * force. Tansy ticks the second cross on the sock. Wally has stood up twice today, which is twice more than usual.
 */
export const P2_OUTRO: SceneScript = {
  id: 'all-hats-p2-outro',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'triumph',
  ambience: 'wind',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/all-hats-p2-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, held: null, at: [0, 0], seatedIn: 'duster' },
    { id: 'wally', preset: 'wally', held: 'field-binoculars', at: [0, 0], seatedIn: 'duster', seat: 1 },
    { id: 'tansy', preset: 'tansy', held: 'sock-map', at: R_TANSY.at, yaw: towards(R_TANSY.at, O_WALLY.at) },
    { id: 'pip', preset: 'pip', held: null, at: R_PIP.at, yaw: towards(R_PIP.at, O_WALLY.at) },
    { id: 'u1', name: 'Underspanner', look: UNDERSPAN_A, held: 'brass-wrench', at: [485, -80.6], yaw: Math.PI / 2 },
    { id: 'u2', name: 'Underspanner', look: UNDERSPAN_B, at: [472.4, -80.4], yaw: -Math.PI / 2 },
    { id: 'roller', name: 'Underspanner', look: UNDERSPAN_B, seatedIn: 'dewdrop', at: [0, 0] },
  ],
  vehicles: [
    { id: 'duster', kind: 'plane', from: 'player', at: [LANDED.at[0] - 14, LANDED.at[1]], yaw: LANDED.yaw },
    ...LINE_CARS.map((c, i) => ({ id: `line-${i}`, kind: c.kind, at: c.at, yaw: c.yaw })),
    { id: 'dewdrop', kind: LINE_DEW.kind, at: [LINE_DEW.at[0] + 12, LINE_DEW.at[1] + 4], yaw: -Math.PI / 2 },
  ],
  props: [
    { id: 'rail', prefab: 'split-rail-fence', at: up(RAIL_AT[0], RAIL_AT[1], 0), yaw: Math.PI / 2, size: 4, by: 'w' },
    { id: 'chair', prefab: 'deck-chair', at: up(O_WALLY.at[0] - 0.6, O_WALLY.at[1] + 0.8, 0), yaw: towards(O_WALLY.at, RAIL_AT) + Math.PI, size: 1.2, by: 'w' },
    { id: 'chocks', prefab: 'stuck-camper-chocks', at: up(489.6, -83.4, 0), yaw: 0, size: 0.6, by: 'w' },
  ],
  steps: [
    // Hook: the Crop Duster rolls in off the dust and stops; a door, two gnomes out.
    cut(spot(RAIL, 'landing')),
    { do: 'drive', vehicle: 'duster', path: [LANDED.at], speed: 7, arrive: true },
    { do: 'sfx', id: 'skid', at: 'duster', gain: 0.4, async: true },
    { do: 'exit', who: 'wally', s: 0.8, async: true },
    { do: 'exit', who: 'player', s: 0.8 },
    // At the rail. (A time cut: they have walked up from the plane.)
    { do: 'despawn', id: 'wally' },
    { do: 'despawn', id: 'player' },
    { do: 'spawn', id: 'wally', at: O_WALLY.at, yaw: towards(O_WALLY.at, R_TANSY.at) },
    { do: 'spawn', id: 'player', at: R_YOU.at, yaw: towards(R_YOU.at, O_WALLY.at) },
    cut(RAIL_TALK.single('wally', 'mcu')),
    { do: 'say', who: 'wally', text: 'Twenty-three on the landing. Show-off.' },
    cut(RAIL_TALK.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Air?' },
    cut(RAIL_TALK.single('wally', 'mcu')),
    { do: 'gesture', who: 'wally', name: 'point', s: 1.0, async: true },
    { do: 'say', who: 'wally', text: 'Look at the airfield, kid.' },
    { do: 'face', who: 'wally', at: [470, -86], s: 0.5 },
    // The cutaway: the Underspanners' line on the apron, and the Dewdrop rolling into its place at the end.
    cut(spot(LINE, 'line')),
    { do: 'drive', vehicle: 'dewdrop', path: [LINE_DEW.at], speed: 4, arrive: true, async: true },
    { do: 'sfx', id: 'squeak', at: 'dewdrop', gain: 0.5, async: true },
    { do: 'gesture', who: 'u1', name: 'wrench-fix', s: 2.0, async: true },
    { do: 'wait', s: 3.0 },
    cut(shot('pip', 'mcu', { toward: 'wally', side: 30 })),
    { do: 'gesture', who: 'pip', name: 'cheer', s: 1.2, async: true },
    { do: 'say', who: 'pip', text: 'Planes! A copter! A dandelion! And a... ball?' },
    cut(RAIL_TALK.single('wally', 'mcu')),
    { do: 'face', who: 'wally', at: 'pip', s: 0.4, async: true },
    { do: 'say', who: 'wally', text: 'Four that fly. One that rolls. Hogweed calls it an air force.' },
    // Turn: Tansy ticks the second cross on the sock.
    cut(insert('tansy', { toward: 'wally' })),
    { do: 'sfx', id: 'paper', at: 'tansy', gain: 0.5, async: true },
    { do: 'wait', s: 1.4 },
    cut(RAIL_TALK.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: "That's air." },
    // Button: Wally sits. He stands only for things in the air, and he has stood twice today.
    cut(RAIL_TALK.single('wally', 'ms')),
    { do: 'say', who: 'wally', text: 'Stood up twice today. Wake me for the beacon.' },
    { do: 'walk', who: 'wally', path: [[O_WALLY.at[0] - 0.6, O_WALLY.at[1] + 0.8]], speed: 0.8 },
    { do: 'gesture', who: 'wally', name: 'sit', s: 0.4 },
    beat('pause'),
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'all-hats-p1-intro': P1_INTRO,
  'all-hats-p1-toll': P1_TOLL,
  'all-hats-p1-cut': P1_CUT,
  'all-hats-p1-outro': P1_OUTRO,
  'all-hats-p2-intro': P2_INTRO,
  'all-hats-p2-gap': P2_GAP,
  'all-hats-p2-outro': P2_OUTRO,
};
