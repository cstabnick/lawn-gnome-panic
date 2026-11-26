// Story row 9 (m09-where-asphalt-sleeps): its three scenes. Notes: docs/design/gnome-theft-auto/direction/scenes/asphalt-{intro,mid,outro}.md
// Intro: Bodega & Sons, day, the cat's spot empty. Mid: the Gutter Bowls, day, Asphalt asleep on a board. Outro: the shop, dusk.
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, pushIn, reaction, shot } from '../../direct';
import { markOf, up } from './kit';

const facing = (from: Vec2, to: Vec2): number => Math.atan2(to[0] - from[0], to[1] - from[1]);

// ---- Bodega & Sons (stage bodega-front: ch1.ts, ch3.ts and ch5.ts use the same corner) -------------------------------------
const JOHN = markOf('bodega-front', 'bodega');
/** Asphalt's counter spot, where the prologue puts her. */
const CAT_AT: Vec2 = [-78.4, 88.4];
/** The ground-level insert on that spot (the prologue's and the epilogue's insert). */
const CAT_INSERT = { kind: 'cut' as const, pos: up(-76.4, 86.8, 0.75), look: up(-78.6, 88.2, 0.45), fov: 44 };
const SHOP_PLAYER: Vec2 = [-74.6, 90.4];
const BP = coverage('john', 'player', 1);

/**
 * Where Asphalt Sleeps, intro (day). Picture first: the cat's spot at Bodega & Sons, empty, a full bowl beside it. John's
 * flat voice does the rest. "Crack nothing. Look." is the gentler job after eight quests of cracking hats.
 */
export const ASPHALT_INTRO: SceneScript = {
  id: 'asphalt-intro',
  stage: { kind: 'world' },
  ambience: 'street',
  sky: 'noon',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/asphalt-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, at: SHOP_PLAYER, yaw: facing(SHOP_PLAYER, JOHN.at) },
    { id: 'john', preset: 'bodega', name: 'John Bodega', at: JOHN.at, yaw: facing(JOHN.at, SHOP_PLAYER), held: 'broom' },
  ],
  props: [
    // The full bowl by the empty spot: nobody says it, the picture does, then John says why it matters.
    { id: 'bowl', prefab: 'serving-tray', at: [-79.4, 87.4], yaw: 0, size: 0.4 },
  ],
  steps: [
    // Hook: the empty spot and the full bowl, the shop bell above the door.
    cut(CAT_INSERT),
    { do: 'sfx', id: 'bell', gain: 0.5, async: true },
    { do: 'wait', s: 2.6 },
    cut(BP.single('john', 'mcu')),
    { do: 'say', who: 'john', text: 'Turfton FM says a quiet day. Asphalt disagrees.' },
    { do: 'say', who: 'john', text: 'She is gone. So is the bottlecap.' },
    ...reaction('player', { toward: 'john', size: 'mcu', side: -25, hold: 'tiny' }),
    { do: 'say', who: 'player', text: 'Asphalt?' },
    cut(BP.single('john', 'mcu')),
    { do: 'say', who: 'john', text: 'Bowl is full. She has never left a full bowl.' },
    { do: 'gesture', who: 'john', name: 'shrug', s: 1.0 },
    // The turn: the job is three sightings.
    cut(pushIn('john', 'mcu', 3.0, { toward: 'player', side: 25 })),
    { do: 'say', who: 'john', text: 'Three sightings. An alley, a dumpster lid, my roofline.' },
    ...reaction('player', { toward: 'john', size: 'mcu', side: -25, hold: 'beat' }),
    { do: 'say', who: 'player', text: 'Me?' },
    cut(BP.single('john', 'mcu')),
    { do: 'say', who: 'john', text: 'You have cracked a lot of hats. Crack nothing. Look.' },
    // Button: the broom goes back to work, the bowl stays full.
    { do: 'sfx', id: 'crunch', at: 'john', gain: 0.5, async: true },
    { do: 'walk', who: 'john', path: [[-80, 91]], speed: 0.8, async: true },
    cut(BP.single('john', 'mcu', { height: 'high' })),
    { do: 'say', who: 'john', text: 'Bring her back quietly. She hates a fuss.' },
    cut(CAT_INSERT),
    { do: 'wait', s: 2.4 },
  ],
};

// ---- The Gutter Bowls (stage gutter-bowls-hammock) ---------------------------------------------------------------------------
const BOWLS = 'gutter-bowls-hammock';
const B_FENNEL = markOf(BOWLS, 'fennel');
const B_PLAYER = markOf(BOWLS, 'player');
/** The board and the cat asleep across its trucks, at the saucer. */
const BOARD_AT: Vec2 = [-44.6, 98.4];
const FP = coverage('fennel', 'player', 1);
const FCAT = { kind: 'cut' as const, pos: up(-41.6, 97.6, 0.5), look: up(-44.6, 98.4, 0.35), fov: 38 };

/**
 * Where Asphalt Sleeps, mid scene (day). Fennel Gripwax, who feeds every stray in the park, introduces himself by the board
 * Asphalt is asleep on. The cap is on the far lip of a line he wrote for her; you do not wake Asphalt, you skate her cap down.
 * He hands the sleeping cat over. L95: a saucer, a board, a sleeping cat; the line "Asphalt's Way Down" was already on his list.
 */
export const ASPHALT_MID: SceneScript = {
  id: 'asphalt-mid',
  stage: { kind: 'world' },
  music: 'warm',
  ambience: 'street',
  sky: 'noon',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/asphalt-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, at: B_PLAYER.at, yaw: B_PLAYER.yaw },
    { id: 'fennel', preset: 'fennel', name: 'Fennel Gripwax', at: B_FENNEL.at, yaw: B_FENNEL.yaw },
  ],
  props: [
    { id: 'board', prefab: 'gta-skateboard', at: BOARD_AT, yaw: 0.6, size: 0.9 },
    { id: 'cat', prefab: 'asphalt-cat', at: up(BOARD_AT[0], BOARD_AT[1], 0.1), yaw: 2.4, size: 0.5 },
    { id: 'saucer', prefab: 'serving-tray', at: [-45.6, 97.4], yaw: 0, size: 0.35 },
  ],
  steps: [
    // Hook: ground level on a sleeping cat, a board and a saucer. A skater rattles by a long way off.
    cut(FCAT),
    { do: 'sfx', id: 'skid', gain: 0.25, async: true },
    { do: 'wait', s: 1.8 },
    cut(FP.single('fennel', 'ms')),
    { do: 'say', who: 'fennel', text: 'She turned up on Tuesday. I fed her. We came to an understanding.' },
    { do: 'intro', who: 'fennel' },
    cut(FP.single('player', 'mcu')),
    { do: 'say', who: 'player', text: "She is John's cat." },
    cut(FP.single('fennel', 'mcu', { height: 'high' })),
    { do: 'say', who: 'fennel', text: 'She is on my board. Her cap is on the far lip.' },
    ...reaction('player', { toward: 'fennel', size: 'mcu', side: -25, hold: 'beat' }),
    { do: 'say', who: 'player', text: 'I fetch it?' },
    // The turn: you do not wake Asphalt. The line was on his list already.
    cut(pushIn('fennel', 'mcu', 3.0, { toward: 'player', side: 25 })),
    { do: 'say', who: 'fennel', text: "Skate it. Stairs, ledge, flat rail. The last line on my list." },
    // Button: he lifts the sleeping cat onto the player. She does not wake.
    cut({ kind: 'cut', pos: up(-43.2, 95.2, 1.5), look: 'fennel', fov: 40 }),
    { do: 'sfx', id: 'cloth', at: 'fennel', gain: 0.6, async: true },
    { do: 'walk', who: 'fennel', path: [[-45.4, 96.4]], speed: 1.0 },
    { do: 'despawn', id: 'cat' },
    { do: 'give', from: 'fennel', to: 'player', prop: 'asphalt-cat', s: 1.2 },
    cut(FP.single('fennel', 'mcu')),
    { do: 'say', who: 'fennel', text: 'She sleeps through anything. Mind her.' },
    ...reaction('player', { toward: 'fennel', size: 'mcu', side: -25, hold: 'pause' }),
  ],
};

// ---- Bodega & Sons again, dusk ------------------------------------------------------------------------------------------------
/** Where the cap rolls: the player's boot. */
const CAP_AT: Vec2 = [-76.6, 89.2];

/**
 * Where Asphalt Sleeps, outro (dusk). The player sets the cat on her spot; she wakes, sees the cap, bats it once, and it rolls
 * to the player's boot. John's flat reading: that is thank you, and she has never done it before. L95: the bottlecap pendant.
 */
export const ASPHALT_OUTRO: SceneScript = {
  id: 'asphalt-outro',
  stage: { kind: 'world' },
  music: 'turfton-dusk',
  ambience: 'street',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/asphalt-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, at: SHOP_PLAYER, yaw: facing(SHOP_PLAYER, JOHN.at), held: 'asphalt-cat' },
    { id: 'john', preset: 'bodega', name: 'John Bodega', at: JOHN.at, yaw: facing(JOHN.at, SHOP_PLAYER), held: 'broom' },
  ],
  props: [
    { id: 'bowl', prefab: 'serving-tray', at: [-79.4, 87.4], yaw: 0, size: 0.4 },
    { id: 'cat', prefab: 'asphalt-cat', at: CAT_AT, yaw: facing(CAT_AT, JOHN.at), size: 0.55, hidden: true },
    { id: 'cap', prefab: 'bottlecap-pendant', at: CAP_AT, yaw: 0.4, size: 0.3, hidden: true },
  ],
  steps: [
    // Hook: the player arrives with the sleeping cat; the shop bell.
    cut(BP.single('player', 'mcu', { height: 'low' })),
    { do: 'sfx', id: 'bell', gain: 0.5, async: true },
    { do: 'walk', who: 'player', path: [[-77.2, 89.6]], speed: 1.2, async: true },
    { do: 'wait', s: 1.4 },
    cut(BP.single('john', 'mcu')),
    { do: 'say', who: 'john', text: 'Where was she?' },
    cut(BP.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Asleep under a deck.' },
    { do: 'cam', shot: CAT_INSERT },
    { do: 'sfx', id: 'cloth', gain: 0.6, async: true },
    { do: 'hold', who: 'player', prop: null },
    { do: 'spawn', id: 'cat' },
    { do: 'wait', s: 1.2 },
    cut(BP.single('john', 'mcu', { height: 'high' })),
    { do: 'say', who: 'john', text: 'Of course she was.' },
    // The cap, batted once: a clatter on the counter, then it lies at the player's boot.
    { do: 'cam', shot: CAT_INSERT },
    { do: 'sfx', id: 'clatter', gain: 0.7, async: true },
    { do: 'spawn', id: 'cap' },
    { do: 'wait', s: 1.6 },
    cut(BP.single('john', 'mcu')),
    beat('beat'),
    { do: 'say', who: 'john', text: 'That is thank you. She has never done it before.' },
    // Button: the pendant at the player's boot, the cat looking carefully elsewhere.
    cut({ kind: 'cut', pos: up(-75.2, 87.8, 0.6), look: up(-77.4, 89.2, 0.1), fov: 42 }),
    { do: 'sfx', id: 'bell', gain: 0.4, async: true },
    { do: 'wait', s: 2.0 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'asphalt-intro': ASPHALT_INTRO,
  'asphalt-mid': ASPHALT_MID,
  'asphalt-outro': ASPHALT_OUTRO,
};
