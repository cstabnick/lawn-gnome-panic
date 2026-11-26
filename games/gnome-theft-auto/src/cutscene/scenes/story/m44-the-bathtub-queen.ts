// Story row 44 (m44-the-bathtub-queen): The Bathtub Queen. Three scenes, the laugh after row 43's sincere beat: Captain Samphire Bilge
// at the Queen's helm at dusk, telling a tour group about pirates with a perfectly straight face, and recruiting the player in a
// stage whisper that carries to the back row; the player boarding an HOA barge at night from the stern (a black steamer, two sleeping
// deckhands, a stencilled blade crate) with the HOA gunboat arriving at the end; and the night outro, the crew's colours going up the
// mast under the Queen's pennant. The barge, the gunboat and the crates are cutscene-only.
// Notes: docs/design/gnome-theft-auto/direction/scenes/m44-the-bathtub-queen-{intro,mid,outro}.md
import type { SceneScript, Vec2, Vec3 } from '../../script';
import { beat, coverage, cut, pushIn, reaction, shot } from '../../direct';
import { carMark, markOf } from './kit';

const DECK = 'm44-queen-deck';
const BARGE = 'm44-barge-night';

/** The Queen's deck is a rooftop at y -3.0 (E11 coast/config.ts COAST.ship.deckY): a deck point is [x, -3, z]. */
const DECK_Y = -3.0;
const deck = (p: Vec2, dy = 0): Vec3 => [p[0], DECK_Y + dy, p[1]];
/** The main mast stands at about x 301.6, z 1268 (pirateShip.ts); flags fly on a halyard just east of it. */
const MAST_X = 303.2;
const MAST_Z = 1268;
const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

// ---- 1. Intro: the tour -----------------------------------------------------------------------------------------------------
const I_BILGE = markOf(DECK, 'samphire');
const I_YOU = markOf(DECK, 'player');
const TOURISTS: { id: string; at: Vec2; look: { hat: number; shirt: number; pants: number } }[] = [
  { id: 't1', at: [296.4, 1263.4], look: { hat: 0xf2e6a0, shirt: 0x3a8fb0, pants: 0x4a3a2a } },
  { id: 't2', at: [296.0, 1265.8], look: { hat: 0xd9534f, shirt: 0xf0e0c0, pants: 0x2a2a3a } },
  { id: 't3', at: [297.2, 1268.2], look: { hat: 0x58a05a, shirt: 0xe8b83a, pants: 0x3a3a4a } },
];
const TOUR = coverage('samphire', 'player', 1);
const B1 = coverage('samphire', 't1', 1);
const B2 = coverage('samphire', 't2', 1);
const B3 = coverage('samphire', 't3', 1);

/**
 * Dusk on the Bathtub Queen. Bilge, a toy cutlass in one hand, tells her tour group the story of the cursed treasure with a perfectly
 * straight face. A tourist asks if any of it is real. She spots the player at the back and calls them aboard "quietly" at the top of
 * her lungs, then briefs them in a stage whisper the whole group leans in to hear. The blades, the barges, the Queen's price.
 */
export const M44_INTRO: SceneScript = {
  id: 'm44-the-bathtub-queen-intro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'turfton',
  ambience: 'shore',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m44-the-bathtub-queen-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, held: null, at: deck(I_YOU.at), yaw: towards(I_YOU.at, I_BILGE.at), hidden: true },
    { id: 'samphire', preset: 'samphire', held: 'toy-cutlass', at: deck(I_BILGE.at), yaw: I_BILGE.yaw },
    ...TOURISTS.map((t) => ({ id: t.id, name: 'Tourist', look: t.look, at: deck(t.at), yaw: towards(t.at, I_BILGE.at) })),
  ],
  props: [
    { id: 'helm', prefab: 'glaze-steer-ship', at: deck([289.9, 1265.2], 0.9), yaw: Math.PI / 2, size: 1.4, by: 'h' },
    { id: 'tour-flag', prefab: 'pl-tour-flag', at: deck([296.8, 1262.2]), yaw: 0, size: 2.2, by: 'h' },
  ],
  steps: [
    // Hook: a ship's bell and a voice that has done this four hundred times.
    cut(shot('samphire', 'ws', { toward: 't2', side: 40 })),
    { do: 'sfx', id: 'bell', at: 'samphire', gain: 0.6, async: true },
    { do: 'gesture', who: 'samphire', name: 'handsUp', s: 1.6, async: true },
    { do: 'wait', s: 1.8 },
    cut(B1.single('samphire', 'mcu', { height: 'low' })),
    { do: 'say', who: 'samphire', text: 'And so the cursed treasure sank, as cursed treasure must!' },
    cut(shot('samphire', 'ms', { toward: 't1', side: 30 })),
    { do: 'intro', who: 'samphire' },
    // Setup: the tour asks the one question, and gets the straightest answer on the water.
    cut(B1.single('t1', 'mcu')),
    { do: 'gesture', who: 't1', name: 'handsUp', s: 1.0, async: true },
    { do: 'say', who: 't1', text: 'Captain, is any of this real?' },
    cut(B1.single('samphire', 'mcu', { height: 'low' })),
    { do: 'say', who: 'samphire', text: 'Madam, every word is true. Especially the parrots.' },
    ...reaction('t1', { toward: 'samphire', gesture: 'nod', hold: 'pause', side: 25 }),
    // The new face at the back of the tour.
    { do: 'spawn', id: 'player' },
    cut(shot('player', 'ms', { toward: 'samphire', side: 30 })),
    { do: 'sfx', id: 'creak', at: 'player', gain: 0.4, async: true },
    { do: 'wait', s: 1.4 },
    { do: 'face', who: 'samphire', at: 'player', s: 0.5, async: true },
    // Turn: she calls them aboard "quietly", at the top of her lungs.
    cut(TOUR.single('samphire', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'samphire', name: 'beckon', s: 1.4, async: true },
    { do: 'say', who: 'samphire', text: 'You! The one who reads barges! Come aboard, quietly!' },
    { do: 'gesture', who: 't3', name: 'cheer', s: 1.2, async: true },
    // The briefing: a stage whisper, with the whole tour leaning in to hear it.
    cut(TOUR.single('samphire', 'mcu')),
    { do: 'gesture', who: 'samphire', name: 'lean', s: 1.6, async: true },
    { do: 'say', who: 'samphire', text: "The barges carry the Combine's spare blades. Take one, and the Queen sails with you." },
    { do: 'gesture', who: 't2', name: 'lean', s: 1.2, async: true },
    cut(B2.single('t2', 'mcu')),
    { do: 'say', who: 't2', text: 'Is this part of the tour?' },
    cut(B2.single('samphire', 'mcu', { height: 'low' })),
    { do: 'say', who: 'samphire', text: 'It is the finale, madam. Do not spoil it.' },
    cut(TOUR.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'I will need a boat.' },
    cut(TOUR.single('samphire', 'mcu')),
    { do: 'gesture', who: 'samphire', name: 'point', s: 1.4, async: true },
    { do: 'say', who: 'samphire', text: 'The tender waits off the pier. A pleasure cruise, ladies and gentlegnomes!' },
    // Button: the tour applauds, and the third tourist rates it.
    cut(B3.single('t3', 'mcu')),
    { do: 'gesture', who: 't3', name: 'cheer', s: 1.4, async: true },
    { do: 'sfx', id: 'bell', at: 'samphire', gain: 0.4, async: true },
    { do: 'say', who: 't3', text: 'Best tour yet.' },
    cut(shot('player', 'ms', { toward: 'samphire', side: 40 })),
    { do: 'gesture', who: 'player', name: 'shrug', s: 1.1 },
  ],
};

// ---- 2. Mid: boarding the barge ---------------------------------------------------------------------------------------------
const BARGE_M = carMark(BARGE, 'barge');
const TENDER_M = carMark(BARGE, 'tender');
const LAUNCH_M = carMark(BARGE, 'launch');
/** Sea level of the Saltwater (coast/config.ts) and a deck about half a metre over it. */
const SEA_Y = -8.9;
const BDECK = SEA_Y + 0.55;
/** World point of a barge-local offset (right, back): the barge lies bow west (yaw -pi/2), so back is +x and right is -z. */
const aboard = (right: number, back: number, dy = 0): Vec3 => [BARGE_M.at[0] + back, BDECK + dy, BARGE_M.at[1] - right];

/**
 * Night on the Saltwater. The Queen's tender glides in under the stern of the third barge; its two deckhands are asleep at their
 * posts and one of them mumbles. The player steps over, takes a stencilled crate (hat the wrong way up), and loads it on the barge's
 * own launch. Then a siren, and the HOA gunboat comes round the barge's bow with its searchlight on.
 */
export const M44_MID: SceneScript = {
  id: 'm44-the-bathtub-queen-mid',
  stage: { kind: 'world' },
  sky: 'night',
  music: 'mystery',
  ambience: 'shore',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m44-the-bathtub-queen-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, held: null, at: [0, 0], seatedIn: 'tender' },
    { id: 'd1', name: 'Deckhand', look: { hat: 0x2f4f2f, shirt: 0xd0d0c0, pants: 0x303030 }, at: [0, 0], seatedIn: 'barge', seat: 0 },
    { id: 'd2', name: 'Deckhand', look: { hat: 0x2f4f2f, shirt: 0xd0d0c0, pants: 0x303030 }, at: [0, 0], seatedIn: 'barge', seat: 1 },
  ],
  vehicles: [
    { id: 'barge', kind: BARGE_M.kind, at: BARGE_M.at, yaw: BARGE_M.yaw, tint: 0x16161d, headlights: true },
    { id: 'tender', kind: TENDER_M.kind, at: [TENDER_M.at[0] + 22, TENDER_M.at[1] + 9], yaw: TENDER_M.yaw },
    { id: 'launch', kind: LAUNCH_M.kind, at: LAUNCH_M.at, yaw: LAUNCH_M.yaw },
    { id: 'gunboat', kind: 'hoa-patrol-boat', at: [BARGE_M.at[0] - 52, BARGE_M.at[1] + 30], yaw: -Math.PI / 2, headlights: true, hidden: true },
  ],
  props: [
    { id: 'crate-1', prefab: 'blade-crate', at: aboard(0.9, 2.3), yaw: -Math.PI / 2, size: 1.2, by: 'w' },
    { id: 'crate-2', prefab: 'blade-crate', at: aboard(-0.5, 2.5), yaw: -Math.PI / 2, size: 1.2, by: 'w' },
    { id: 'crate-3', prefab: 'blade-crate', at: aboard(0.9, 2.3, 0.35), yaw: -Math.PI / 2, size: 1.2, by: 'w' },
    { id: 'lamp', prefab: 'mole-lamp-lit', at: aboard(-1.4, 3.4), yaw: 0, size: 0.8, by: 'h' },
    { id: 'loaded', prefab: 'blade-crate', at: [LAUNCH_M.at[0], BDECK, LAUNCH_M.at[1]], yaw: -Math.PI / 2, size: 1.2, by: 'w', hidden: true },
  ],
  steps: [
    // Hook: a black hull, a lamp at the stern, a snore; then a small boat easing in under it.
    cut({ kind: 'cut', pos: [BARGE_M.at[0] + 24, SEA_Y + 3.4, BARGE_M.at[1] + 16], look: [BARGE_M.at[0] + 4, SEA_Y + 1.2, BARGE_M.at[1]], fov: 50 }),
    { do: 'sfx', id: 'creak', at: 'barge', gain: 0.4, async: true },
    { do: 'drive', vehicle: 'tender', path: [[TENDER_M.at[0], TENDER_M.at[1]]], speed: 3.4, async: true },
    { do: 'wait', s: 2.6 },
    // Setup: the two guards, asleep at their posts; one of them has things on his mind.
    cut(shot('d1', 'mcu')),
    { do: 'gesture', who: 'd1', name: 'slump', s: 1.2, async: true },
    { do: 'sfx', id: 'rustle', at: 'd1', gain: 0.3, async: true },
    { do: 'say', who: 'd1', text: 'Five more minutes, Association.' },
    // The crates, and the hat stencilled on them the wrong way up.
    cut({ kind: 'dolly', from: aboard(2.0, 5.8, 1.2), to: aboard(1.2, 4.4, 1.0), look: aboard(0.9, 2.3, 0.3), s: 2.6 }),
    { do: 'sfx', id: 'creak', at: 'barge', gain: 0.3, async: true },
    { do: 'wait', s: 2.6 },
    // Turn: the lift, and the whole barge hears it.
    cut(shot('player', 'mcu', { toward: 'd1', side: 30 })),
    { do: 'gesture', who: 'player', name: 'clutch', s: 1.2, async: true },
    { do: 'despawn', id: 'crate-1' },
    { do: 'sfx', id: 'thud', at: 'barge', gain: 0.5, async: true },
    beat('pause'),
    cut(shot('d2', 'mcu')),
    { do: 'gesture', who: 'd2', name: 'lean', s: 0.8, async: true },
    { do: 'sfx', id: 'clatter', at: 'barge', gain: 0.5, async: true },
    { do: 'wait', s: 0.9 },
    // The launch takes the crate, and a siren answers the clatter: the gunboat swings round the bow with its light on.
    cut({ kind: 'cut', pos: [LAUNCH_M.at[0] + 6, SEA_Y + 2.6, LAUNCH_M.at[1] + 7], look: [LAUNCH_M.at[0], SEA_Y + 0.6, LAUNCH_M.at[1]], fov: 50 }),
    { do: 'spawn', id: 'loaded' },
    { do: 'sfx', id: 'whoosh', at: 'launch', gain: 0.4, async: true },
    { do: 'wait', s: 1.2 },
    { do: 'stinger', id: 'danger' },
    { do: 'spawn', id: 'gunboat' },
    { do: 'drive', vehicle: 'gunboat', path: [[BARGE_M.at[0] - 26, BARGE_M.at[1] + 16]], speed: 12, async: true },
    { do: 'horn', vehicle: 'gunboat' },
    { do: 'wait', s: 2.2 },
    cut({ kind: 'track', pos: [LAUNCH_M.at[0] + 10, SEA_Y + 3.0, LAUNCH_M.at[1] + 10], who: 'gunboat', fov: 46 }),
    { do: 'horn', vehicle: 'gunboat' },
    { do: 'wait', s: 1.6 },
  ],
};

// ---- 3. Outro: the colours ---------------------------------------------------------------------------------------------------
const O_BILGE = markOf(DECK, 'samphire');
const O_DRIFT = markOf(DECK, 'driftwood');
const O_YOU = markOf(DECK, 'player');
const CRATE: Vec2 = [294.2, 1266.8];
const COLOURS = coverage('samphire', 'player', -1);

/**
 * Night on the deck under hung lanterns. The blade crate sits open on the planks, and Driftwood, wet to the knees, reports that the
 * gunboat turned back at the buoy because it had a schedule. Bilge, who has never told the truth on a tour, tells it: the only thing
 * aboard that is not a lie is the smuggling. She asks the player's colours and hoists them, quietly, at the top of her lungs, under
 * the Queen's own pennant. The sea route is the crew's.
 */
export const M44_OUTRO: SceneScript = {
  id: 'm44-the-bathtub-queen-outro',
  stage: { kind: 'world' },
  sky: 'night',
  music: 'triumph',
  ambience: 'shore',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m44-the-bathtub-queen-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, held: 'banner-scrap-flag', at: deck(O_YOU.at), yaw: towards(O_YOU.at, O_BILGE.at) },
    { id: 'samphire', preset: 'samphire', held: 'toy-cutlass', at: deck(O_BILGE.at), yaw: towards(O_BILGE.at, O_YOU.at) },
    { id: 'driftwood', preset: 'driftwood', held: null, at: deck(O_DRIFT.at), yaw: towards(O_DRIFT.at, O_BILGE.at) },
  ],
  props: [
    { id: 'crate', prefab: 'blade-crate', at: deck(CRATE), yaw: 0.4, size: 1.4, by: 'w' },
    { id: 'lantern-1', prefab: 'camp-lantern-post', at: deck([293.4, 1262.4]), yaw: 0, size: 2.2, by: 'h' },
    { id: 'lantern-2', prefab: 'camp-lantern-post', at: deck([299.6, 1272.6]), yaw: 0, size: 2.2, by: 'h' },
    { id: 'pennant', prefab: 'capwood-rally-pennant', at: [MAST_X, DECK_Y + 25.5, MAST_Z], yaw: Math.PI / 2, size: 3.4, by: 'w' },
    { id: 'colours', prefab: 'banner-scrap-flag', at: [MAST_X, DECK_Y + 21.5, MAST_Z], yaw: Math.PI / 2, size: 2.6, by: 'w', hidden: true },
  ],
  steps: [
    // Hook: a crate on a lit deck, a lantern swinging, the hull talking to itself.
    cut(shot('driftwood', 'ws', { toward: 'samphire', side: 40 })),
    { do: 'sfx', id: 'creak', at: 'crate', gain: 0.4, async: true },
    { do: 'sfx', id: 'bell', at: 'samphire', gain: 0.4, async: true },
    { do: 'gesture', who: 'samphire', name: 'handsUp', s: 1.4, async: true },
    { do: 'wait', s: 1.6 },
    cut(COLOURS.single('samphire', 'mcu', { height: 'low' })),
    { do: 'say', who: 'samphire', text: 'Aboard, aboard! Mind the crate. It is a real crate.' },
    // Setup: Driftwood, wet to the knees, with the news.
    cut(shot('driftwood', 'mcu', { toward: 'samphire', side: -25 })),
    { do: 'gesture', who: 'driftwood', name: 'shrug', s: 1.0, async: true },
    { do: 'say', who: 'driftwood', text: 'The gunboat turned back at the buoy. It said it had a schedule.' },
    cut(COLOURS.single('samphire', 'mcu')),
    { do: 'say', who: 'samphire', text: 'Everything on this ship is a lie, friend. Except the smuggling.' },
    // Turn: the price of a crew.
    cut(pushIn('samphire', 'mcu', 3.4, { to: 'cu', toward: 'player', side: -25 })),
    { do: 'say', who: 'samphire', text: 'The Queen sails with whoever carries the blade. Name your colours.' },
    cut(COLOURS.single('player', 'mcu')),
    { do: 'give', from: 'player', to: 'samphire', prop: 'banner-scrap-flag', s: 1.0 },
    beat('beat'),
    cut(shot('driftwood', 'mcu', { toward: 'samphire', side: -25 })),
    { do: 'say', who: 'driftwood', text: 'Most colours start as a scrap, Captain.' },
    // The hoist: she wants it quiet, so the barges do not hear.
    cut(COLOURS.single('samphire', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'samphire', name: 'handsUp', s: 1.4, async: true },
    { do: 'say', who: 'samphire', text: 'Colours up! Quietly, so the barges do not hear!' },
    { do: 'sfx', id: 'creak', at: [MAST_X, DECK_Y + 4, MAST_Z], gain: 0.5, async: true },
    cut({ kind: 'dolly', from: [MAST_X - 2.2, DECK_Y + 1.7, MAST_Z - 3.2], to: [MAST_X - 3.2, DECK_Y + 9, MAST_Z - 3.6], look: [MAST_X + 0.8, DECK_Y + 4, MAST_Z], lookTo: [MAST_X + 0.8, DECK_Y + 23, MAST_Z], s: 3.4, fov: 52 }),
    { do: 'sfx', id: 'whoosh', at: [MAST_X, DECK_Y + 12, MAST_Z], gain: 0.4, async: true },
    { do: 'wait', s: 2.4 },
    { do: 'spawn', id: 'colours' },
    { do: 'stinger', id: 'triumph' },
    { do: 'sfx', id: 'flutter', at: [MAST_X, DECK_Y + 21.5, MAST_Z], gain: 0.5, async: true },
    cut({ kind: 'cut', pos: [MAST_X - 5.2, DECK_Y + 10.5, MAST_Z - 5.6], look: [MAST_X + 0.8, DECK_Y + 23.4, MAST_Z], fov: 46 }),
    { do: 'wait', s: 2.4 },
    // Button: the sea route, said low; the bell, once.
    cut(COLOURS.single('samphire', 'mcu')),
    { do: 'say', who: 'samphire', text: 'The sea route is yours. Any tide, any hour. No questions, some invoices.' },
    cut(shot('driftwood', 'mcu', { toward: 'samphire', side: -25 })),
    { do: 'gesture', who: 'driftwood', name: 'tipHat', s: 1.2, async: true },
    { do: 'sfx', id: 'bell', at: 'samphire', gain: 0.6, async: true },
    { do: 'wait', s: 2.2 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm44-the-bathtub-queen-intro': M44_INTRO,
  'm44-the-bathtub-queen-mid': M44_MID,
  'm44-the-bathtub-queen-outro': M44_OUTRO,
};
