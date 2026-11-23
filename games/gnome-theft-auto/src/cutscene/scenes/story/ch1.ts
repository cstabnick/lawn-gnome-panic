// Chapter 1 story scenes, first file: the prologue, the First Contract, Mower's Keepers intro. Owner: the Story A
// re-direction lane (docs/roadmaps/gta-redirect-story-a.md). Every id here is played by a quest in quests/chapter1.ts and checked by scenes.test.ts.
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, reaction, shot } from '../../direct';
import { carMark, markOf, pathOf, rideOf, spot, up } from './kit';

const PIP = markOf('bus-stop', 'pip');
const SV = 'side-valve-bay';
const MCD = 'mulch-club-door';
const PB = 'picnic-median';
const GUARD_LOOK = { hat: 0x18181e, shirt: 0x23262e };
const HOA_LOOK = { hat: 0x18181e, shirt: 0xc9b99b };
const DON_LOOK = { hat: 0x141414, shirt: 0xefe6d2, beard: 0xdddddd };
const TURNCOAT_LOOK = { hat: 0xf4f4f8, shirt: 0xc9b99b };
const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

// ---- Prologue intro ----------------------------------------------------------------------------------------------------

const PI_PLAYER_OFF: Vec2 = [-6.6, 18.5];
const PI_PLAYER: Vec2 = [-7, 16];
const PI_RIDE: Vec2 = [-7.6, 27];
const PI_JOHN: Vec2 = [-79.5, 87];
const PI_CAT: Vec2 = [-78.3, 88.4];
/** Pip and the player at the stop: every shot of their exchange on one side of their line. */
const STOP = coverage('pip', 'player', 1);

/**
 * The game's cold open (Fresh Out the Kiln, intro), re-directed: notes in
 * docs/design/gnome-theft-auto/direction/scenes/prologue-intro.md. The snail-coach rolls into Turfton under two narrator
 * lines (the chapter opener's noir voice), the player steps off into a whistle, Pip skids up on a borrowed bike and
 * answers every question but the one asked. Meanwhile at Bodega & Sons, Asphalt bats her bottlecap: a normal day. The
 * title slams in as Pip tears off and the player is left beside the Ride-On they are about to borrow.
 */
export const PROLOGUE_INTRO: SceneScript = {
  id: 'prologue-intro',
  stage: { kind: 'world' },
  ambience: 'street',
  sky: 'noon',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/prologue-intro.md', kind: 'chapter-open' },
  actors: [
    { id: 'player', player: true, at: PI_PLAYER_OFF, yaw: Math.PI / 2, hidden: true },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: [0, 0], seatedIn: 'bike', hidden: true },
    { id: 'john', preset: 'bodega', name: 'John Bodega', at: PI_JOHN, yaw: towards(PI_JOHN, PI_CAT), held: 'broom' },
  ],
  vehicles: [
    { id: 'coach', kind: 'snail-coach', at: [2.5, 95], yaw: Math.PI },
    { id: 'bike', kind: 'push-bike', at: [-2.5, 70], yaw: Math.PI, hidden: true, tint: 0x3b7a57 },
    // The Ride-On the player borrows for the chase: stays in the world after the scene.
    { id: 'kerb-ride', kind: 'ride-on', at: PI_RIDE, yaw: Math.PI, keep: true },
  ],
  props: [{ id: 'cat', prefab: 'asphalt-cat', at: PI_CAT, yaw: towards(PI_CAT, PI_JOHN), size: 0.55 }],
  steps: [
    // 1. Hook: the coach's horn under the opening crane down out of the towers. No music: the city first.
    { do: 'cam', shot: { kind: 'dolly', from: up(24, -6, 34), to: up(-16, 6, 4.5), look: up(-6, 18, 1.2), lookTo: up(0, 30, 1), s: 6.5, fov: 54 } },
    { do: 'drive', vehicle: 'coach', path: [[2.5, 60], [2.5, 32], [2.5, 21]], speed: 8, async: true },
    { do: 'horn', vehicle: 'coach', async: true },
    { do: 'wait', s: 1.0 },
    { do: 'say', who: 'Narrator', text: 'Every gnome thinks they are limited edition.', hz: 130 },
    { do: 'wait', s: 1.4 },
    // 2. The coach pulls in; the door; the player steps down into Turfton.
    { do: 'cam', shot: { kind: 'track', pos: up(-4.2, 31, 1.8), who: 'coach', fov: 50 } },
    { do: 'say', who: 'Narrator', text: 'Then you step off the snail-coach, five thousand Acorns in Kiln-Debt.', hz: 130 },
    { do: 'sfx', id: 'door' },
    { do: 'spawn', id: 'player' },
    cut(shot('player', 'ms', { side: -35 })),
    { do: 'walk', who: 'player', path: [PI_PLAYER] },
    { do: 'drive', vehicle: 'coach', path: [[2.5, 0], [2.5, -60]], speed: 9, arrive: false, async: true },
    { do: 'face', who: 'player', yaw: 0, s: 0.5 },
    // 3. A whistle two blocks off: the Hat Watch. The player's face is where the audience lives.
    { do: 'sfx', id: 'whistle', gain: 0.35 },
    ...reaction('player', { size: 'mcu', side: 20, hold: 'pause' }),
    // 4. Pip, at speed, on a bike that is not his. The theme comes in with him.
    { do: 'spawn', id: 'bike' },
    { do: 'spawn', id: 'pip' },
    { do: 'cam', shot: { kind: 'track', pos: up(-0.8, 6, 1.5), who: 'bike', fov: 50 } },
    { do: 'music', track: 'turfton', fade: 0.4 },
    { do: 'drive', vehicle: 'bike', path: [[-2.5, 40], [-3.2, 22], [-4.2, 18]], speed: 10, async: true },
    { do: 'horn', vehicle: 'bike', async: true },
    { do: 'wait', s: 2.4 },
    { do: 'sfx', id: 'skid', at: 'bike' },
    { do: 'exit', who: 'pip' },
    { do: 'face', who: 'player', at: 'pip', s: 0.3, async: true },
    { do: 'walk', who: 'pip', path: [PIP.at], run: true },
    { do: 'face', who: 'pip', at: 'player', s: 0.25 },
    // 5. The exchange: Pip defends a crime nobody accused him of, then answers the wrong question.
    cut(STOP.single('pip', 'mcu')),
    { do: 'gesture', who: 'pip', name: 'handsUp', s: 1.2, async: true },
    { do: 'say', who: 'pip', text: 'Don\'t look at me like that! It\'s not stealing if the key\'s in it.' },
    { do: 'sfx', id: 'whistle', gain: 0.7 },
    cut(STOP.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Is that whistle for you?' },
    cut(STOP.single('pip', 'mcu')),
    beat('beat'),
    { do: 'say', who: 'pip', text: 'He went inside a flowerpot for an Acorn-Cola. That\'s basically a gift.' },
    ...reaction('player', { size: 'mcu', side: 20, hold: 'pause' }),
    cut(STOP.single('pip', 'mcu')),
    { do: 'gesture', who: 'pip', name: 'point', s: 1.1, async: true },
    { do: 'say', who: 'pip', text: 'Grab that Ride-On and follow me!' },
    // The insert: the Ride-On at the kerb, the thing the player is about to borrow.
    { do: 'cam', shot: { kind: 'dolly', from: up(-11, 21.5, 1.6), to: up(-11.2, 23.5, 1.3), look: 'kerb-ride', s: 2.2, fov: 44 } },
    { do: 'wait', s: 1.4 },
    cut(STOP.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Side-Valve Salvage. Tansy\'s got a crate that hums.' },
    // 6. Meanwhile, Bodega & Sons: the cat and her bottlecap, the town's barometer. Batting it means a normal day.
    { do: 'ambience', bed: 'street', fade: 0.3 },
    { do: 'cam', shot: { kind: 'dolly', from: up(-76.2, 86.6, 0.8), to: up(-76.7, 87.0, 0.7), look: up(-78.6, 88.2, 0.45), s: 2.4, fov: 44 } },
    { do: 'sfx', id: 'knock', at: 'cat', gain: 0.3 },
    { do: 'wait', s: 0.6 },
    { do: 'sfx', id: 'whistle', gain: 0.2 },
    { do: 'sfx', id: 'knock', at: 'cat', gain: 0.3 },
    { do: 'wait', s: 1.4 },
    cut(shot('john', 'mcu', { toward: 'cat', side: -30 })),
    { do: 'say', who: 'john', text: 'Whistles before lunch, Asphalt. Must be Tuesday.' },
    // 7. The title: Pip tears off; the player is left with the Ride-On.
    cut(STOP.single('pip', 'mcu', { handheld: 0.03 })),
    { do: 'say', who: 'pip', text: 'Okay. Go go go!' },
    { do: 'enter', who: 'pip', vehicle: 'bike', async: true },
    { do: 'walk', who: 'player', path: [[-8.6, 22.6]], async: true },
    { do: 'cam', shot: { kind: 'cut', pos: up(-13.6, 20.6, 0.8), look: up(-8.0, 24.4, 1.0), fov: 52 } },
    { do: 'wait', s: 0.6 },
    { do: 'drive', vehicle: 'bike', path: [[-3, 12], [-2.5, 0], [-2.5, -40]], speed: 11, arrive: false, async: true },
    { do: 'sfx', id: 'skid', at: 'bike' },
    { do: 'stinger', id: 'chapter' },
    { do: 'title', text: 'GNOME THEFT AUTO' },
    { do: 'shake', amp: 0.06, s: 0.5 },
    { do: 'wait', s: 2.2 },
    { do: 'title', text: null },
  ],
};

// ---- Prologue outro ----------------------------------------------------------------------------------------------------

const PO_TANSY: Vec2 = [-156.4, 74.2];
const PO_RACK: Vec2 = [-157.6, 74.2];
const PO_CRATE: Vec2 = [-153.6, 77.1];
const PO_TANSY_CRATE: Vec2 = [-153.6, 75.8];
const PO_PLAYER: Vec2 = [-153.2, 72.6];
const PO_PIP: Vec2 = [-151.4, 74.8];
/** Tansy and the player; Tansy and Pip. One side of each line. */
const BAY = coverage('tansy', 'player', 1);
const TP = coverage('tansy', 'pip', 1);

/**
 * Fresh Out the Kiln payoff, re-directed: notes in docs/design/gnome-theft-auto/direction/scenes/prologue-outro.md.
 * Cold open on Tansy counting her forty-seven wrenches (the cigar box on the bench beside her), Pip and the player tear
 * onto the apron, she will not turn round for Pip, she turns for the player's question. The crate, the reveal, the
 * Golden Acorn humming in her hand; "Fescue" and Pip changes the subject. Button: she hands the humming thing to him.
 * Turncoat Cam sweeps in the background of the bay shots (the broom ladder's first rung).
 */
export const PROLOGUE_OUTRO: SceneScript = {
  id: 'prologue-outro',
  stage: { kind: 'world' },
  ambience: 'street',
  sky: 'noon',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/prologue-outro.md' },
  actors: [
    { id: 'player', player: true, at: [-125, 57.5], yaw: -Math.PI / 2, seatedIn: 'ride' },
    { id: 'tansy', preset: 'tansy', name: 'Tansy Clayfoot', at: PO_TANSY, yaw: -Math.PI / 2, held: 'brass-wrench' },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: [0, 0], seatedIn: 'pip-bike' },
    { id: 'turncoat', name: 'Turncoat Cam', look: TURNCOAT_LOOK, held: 'broom', at: [-158, 68], yaw: Math.PI / 2 },
  ],
  vehicles: [
    { id: 'tansy-ride', ...rideOf('tansy'), ...carMark(SV, 'tansy-zero-turn') },
    { id: 'pip-bike', kind: 'push-bike', at: [-118, 57.5], yaw: -Math.PI / 2, tint: 0x3b7a57 },
    // The Ride-On the player borrowed at the kerb: kept in the world at the end.
    { id: 'ride', kind: 'ride-on', from: 'player', at: [-125, 57.5], yaw: -Math.PI / 2, keep: true },
  ],
  props: [
    { id: 'rack', prefab: 'wrench-rack', at: PO_RACK, yaw: Math.PI / 2, size: 1.5 },
    { id: 'cigar-box', prefab: 'cigar-box', at: up(-156.9, 76.1, 0.6), yaw: 0.2, size: 0.32 },
    { id: 'crate', prefab: 'crate', at: PO_CRATE, yaw: 0.3 },
  ],
  steps: [
    // 1. Hook: Tansy at the wrench wall, counting. The forty-eighth is in her hand; the cigar box is open on the bench.
    cut(shot('tansy', 'ms', { side: -75 })),
    { do: 'walk', who: 'turncoat', path: [[-146, 68]], speed: 0.6, async: true },
    { do: 'gesture', who: 'tansy', name: 'think', s: 1.0, async: true },
    { do: 'say', who: 'tansy', text: 'Forty-five. Forty-six. Forty-seven.' },
    // She puts the brass one back in the box before anyone sees it. An engine is coming.
    { do: 'hold', who: 'tansy', prop: null },
    { do: 'sfx', id: 'engine-rev', gain: 0.6 },
    // 2. The arrival: Pip's bike first, the borrowed Ride-On on his tail.
    { do: 'cam', shot: { kind: 'track', pos: up(-143, 63, 1.6), who: 'ride', fov: 52 } },
    { do: 'music', track: 'turfton', fade: 0.4 },
    { do: 'drive', vehicle: 'pip-bike', path: [[-140, 57.5], [-148.5, 58.5], [-148.5, 66], [-149, 72.5]], speed: 10, async: true },
    { do: 'wait', s: 0.6 },
    { do: 'drive', vehicle: 'ride', path: [[-140, 57.5], [-151.5, 58.5], [-152.5, 66], [-152.8, 69.6]], speed: 9 },
    { do: 'sfx', id: 'skid', at: 'ride' },
    { do: 'cam', shot: { kind: 'cut', pos: up(-147.6, 70.4, 1.4), look: up(-152, 73.4, 0.9), fov: 46, handheld: 0.02 } },
    { do: 'exit', who: 'pip', async: true },
    { do: 'exit', who: 'player' },
    { do: 'walk', who: 'pip', path: [PO_PIP], run: true, async: true },
    { do: 'walk', who: 'player', path: [PO_PLAYER] },
    { do: 'face', who: 'pip', at: 'tansy', s: 0.3, async: true },
    { do: 'face', who: 'player', at: 'tansy', s: 0.3 },
    // 3. Pip reports; Tansy does not turn round.
    cut(TP.single('pip', 'mcu')),
    { do: 'gesture', who: 'pip', name: 'cheer', s: 1.0, async: true },
    { do: 'say', who: 'pip', text: 'We got the Ride-On! Totally legal. The kerb said nothing.' },
    cut(shot('tansy', 'mcu', { side: -105 })),
    { do: 'say', who: 'tansy', text: 'Morning. The chicory hasn\'t kicked in. Keep it short.' },
    // 4. The player's question is the one she turns round for.
    cut(BAY.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'What\'s in the crate?' },
    { do: 'face', who: 'tansy', at: 'player', s: 0.6 },
    cut(BAY.single('tansy', 'mcu')),
    beat('beat'),
    { do: 'say', who: 'tansy', text: 'Trouble, probably. Pip brought it.' },
    // 5. The reveal: the lid, two thuds, and the thing in her hand. Picture first; the music drops out for it.
    { do: 'music', track: null, fade: 0.6 },
    { do: 'walk', who: 'tansy', path: [[-155.2, 74.6], PO_TANSY_CRATE], speed: 1.3 },
    { do: 'face', who: 'tansy', at: 'crate', s: 0.3 },
    cut(shot('tansy', 'ms', { side: 80, height: 'low' })),
    { do: 'sfx', id: 'door-creak', at: 'crate' },
    { do: 'wait', s: 0.5 },
    { do: 'sfx', id: 'thud', at: 'crate' },
    { do: 'hold', who: 'tansy', prop: 'golden-acorn-seed-cell' },
    { do: 'face', who: 'tansy', at: 'player', s: 0.5 },
    { do: 'cam', shot: { kind: 'dolly', from: up(-152.2, 73.0, 0.55), to: up(-152.7, 74.0, 0.7), look: up(-153.6, 75.8, 1.05), s: 3.4, fov: 42 } },
    { do: 'stinger', id: 'reveal' },
    { do: 'music', track: 'mystery', fade: 0.8 },
    { do: 'wait', s: 3.0 },
    // 6. The reactions. Pip first, then the word he does not want to hear.
    cut(TP.single('pip', 'mcu')),
    beat('tiny'),
    { do: 'say', who: 'pip', text: 'Okay, yeah. That might not be grass.' },
    cut(TP.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'It hums. It smells of Chirp & Crumb. And Fescue.' },
    // Pip's dodge: the plant for his Fescue secret (Bracken names him in chapter 2).
    cut(TP.single('pip', 'mcu')),
    { do: 'gesture', who: 'pip', name: 'shrug', s: 1.0, async: true },
    { do: 'say', who: 'pip', text: 'Fescue? Never been. Is that far? Who\'s hungry? I\'m hungry.' },
    cut(TP.single('tansy', 'cu')),
    beat('pause'),
    // 7. The button: she hands him the humming thing without a word. He holds it like it might bite.
    { do: 'walk', who: 'tansy', path: [[-152.4, 75.9]], speed: 1.2 },
    { do: 'face', who: 'tansy', at: 'pip', s: 0.3, async: true },
    { do: 'cam', shot: { kind: 'cut', pos: up(-149.4, 74.4, 1.1), look: up(-152, 75.5, 0.9), fov: 42 } },
    { do: 'give', from: 'tansy', to: 'pip', s: 1.0 },
    { do: 'sfx', id: 'engine-rev', at: 'pip', gain: 0.25 },
    { do: 'gesture', who: 'pip', name: 'flinch', s: 1.2 },
    { do: 'stinger', id: 'comic' },
    beat('pause'),
  ],
};

// ---- First Contract: intro (the Mulch Club back room) ------------------------------------------------------------------

/** Room-local marks: Don's armchair behind the table, his two bodyguards, the player across the table. */
const FC_DON: Vec2 = [0, -4.2];
const FC_G1: Vec2 = [-1.4, -4.3];
const FC_G2: Vec2 = [1.25, -4.3];
const FC_PLAYER: Vec2 = [0, 0.4];
const FC_DOOR: Vec2 = [0, 3.8];
const FC_TABLE_TOP = 1.02;
/** The player and the guard who translates; the player and the Don. */
const DEAL = coverage('guard-1', 'player', -1);
const BOSS = coverage('don', 'player', -1);

/**
 * First Contract, intro (new in the direction pass; replaces the old wanted-poster card). Notes:
 * docs/design/gnome-theft-auto/direction/scenes/first-contract-intro.md. The Mulch Club back room. Don Compost never
 * speaks (R-025): he taps. One tap (a mower), two (acorns), three (crack a hat). His bodyguard translates with more
 * confidence than he has; the other one is plainly afraid. The wanted posters slide across the felt; three taps; the
 * music goes; then one finger at the door.
 */
export const FIRST_CONTRACT_INTRO: SceneScript = {
  id: 'first-contract-intro',
  stage: { kind: 'room', room: 'mulch-club' },
  music: 'heist',
  ambience: 'room',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/first-contract-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, at: FC_PLAYER, yaw: Math.PI },
    { id: 'don', name: 'Don Compost', look: DON_LOOK, at: FC_DON, yaw: 0, scale: 1.75 },
    { id: 'guard-1', name: 'Bodyguard', look: GUARD_LOOK, held: 'gta-pistol', at: FC_G1, yaw: towards(FC_G1, FC_PLAYER) },
    { id: 'guard-2', name: 'Bodyguard', look: GUARD_LOOK, held: 'gta-pistol', at: FC_G2, yaw: towards(FC_G2, FC_PLAYER), hz: 118 },
  ],
  props: [
    { id: 'chair', prefab: 'armchair', at: [0, -4.4], yaw: 0, size: 1.7 },
    { id: 'poster-1', prefab: 'wanted-poster', at: [1.0, FC_TABLE_TOP, -2.75], yaw: 0.15, size: 0.42, hidden: true },
    { id: 'poster-2', prefab: 'wanted-poster', at: [1.55, FC_TABLE_TOP, -2.7], yaw: -0.05, size: 0.42, hidden: true },
    { id: 'poster-3', prefab: 'wanted-poster', at: [2.1, FC_TABLE_TOP, -2.75], yaw: -0.2, size: 0.42, hidden: true },
  ],
  steps: [
    // 1. Hook: the Don's hand on the armrest. One tap. Nobody moves.
    { do: 'gesture', who: 'don', name: 'sit', s: 0.2 },
    cut(BOSS.single('don', 'ms', { height: 'low' })),
    { do: 'wait', s: 0.9 },
    { do: 'sfx', id: 'knock', at: 'don' },
    { do: 'wait', s: 0.9 },
    // 2. The translator. He is sure of himself; he should not be.
    cut(DEAL.single('guard-1', 'mcu')),
    { do: 'say', who: 'guard-1', text: 'One tap. The Don says you came on a mower.' },
    cut(DEAL.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'I walked.' },
    cut(DEAL.single('guard-1', 'mcu')),
    beat('beat'),
    { do: 'say', who: 'guard-1', text: 'Then you\'ll leave on one.' },
    // 3. Two taps: acorns. The other guard knows that one and is proud of it.
    cut(BOSS.single('don', 'mcu', { height: 'low' })),
    { do: 'sfx', id: 'knock', at: 'don' },
    { do: 'wait', s: 0.45 },
    { do: 'sfx', id: 'knock', at: 'don' },
    { do: 'wait', s: 0.5 },
    cut(shot('guard-2', 'mcu', { toward: 'player', side: -20 })),
    { do: 'gesture', who: 'guard-2', name: 'point', s: 1.0, async: true },
    { do: 'say', who: 'guard-2', text: 'Two taps. Acorns!' },
    cut(DEAL.single('guard-1', 'mcu')),
    { do: 'say', who: 'guard-1', text: 'A thousand off your Kiln-Debt. He\'s in a giving mood.' },
    cut(DEAL.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'For what?' },
    // 4. The turn: the posters, one at a time, across the felt.
    { do: 'cam', shot: { kind: 'cut', pos: [1.4, 2.6, -1.0], look: [1.55, FC_TABLE_TOP, -2.7], fov: 40 } },
    { do: 'spawn', id: 'poster-1' },
    { do: 'sfx', id: 'thud', gain: 0.35 },
    { do: 'wait', s: 0.6 },
    { do: 'spawn', id: 'poster-2' },
    { do: 'sfx', id: 'thud', gain: 0.35 },
    { do: 'wait', s: 0.6 },
    { do: 'spawn', id: 'poster-3' },
    { do: 'sfx', id: 'thud', gain: 0.35 },
    { do: 'wait', s: 0.5 },
    cut(shot('guard-2', 'mcu', { toward: 'player', side: -20 })),
    { do: 'say', who: 'guard-2', text: 'Dibbler. Gravelbottom. Spadewell. Gold hats. You can\'t miss them.' },
    // 5. Three taps. The music goes. The guards stop breathing.
    { do: 'music', track: null, fade: 0.5 },
    cut(BOSS.single('don', 'cu', { height: 'low' })),
    { do: 'sfx', id: 'knock', at: 'don' },
    { do: 'wait', s: 0.5 },
    { do: 'sfx', id: 'knock', at: 'don' },
    { do: 'wait', s: 0.5 },
    { do: 'sfx', id: 'knock', at: 'don' },
    { do: 'wait', s: 0.6 },
    ...reaction('guard-2', { toward: 'player', size: 'mcu', side: -20, gesture: 'flinch', hold: 'pause' }),
    cut(DEAL.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Meaning?' },
    cut(DEAL.single('guard-1', 'cu')),
    { do: 'say', who: 'guard-1', text: 'Three is the one we don\'t say in here.', music: 'tension' },
    // 6. The button: one finger, at the door. Both heads turn to the player at once.
    { do: 'cam', shot: { kind: 'cut', pos: [-0.3, 1.5, -0.6], look: [0, 1.5, -4.2], fov: 46 } },
    { do: 'gesture', who: 'don', name: 'point', s: 2.4, async: true },
    { do: 'wait', s: 0.6 },
    { do: 'face', who: 'guard-1', at: 'player', s: 0.25, async: true },
    { do: 'face', who: 'guard-2', at: 'player', s: 0.25 },
    { do: 'walk', who: 'player', path: [FC_DOOR], speed: 1.3, async: true },
    beat('pause'),
    { do: 'sfx', id: 'door' },
    beat('beat'),
  ],
};

// ---- First Contract: outro (the Mulch Club side door) ------------------------------------------------------------------

const FO_DON_STEP: Vec2 = [-15.9, -31.7];
const FO_G1 = markOf(MCD, 'bodyguard', 0);
const FO_G2 = markOf(MCD, 'bodyguard', 1);
const DOOR = coverage('guard-1', 'don', -1);

/**
 * First Contract payoff, re-directed: notes in docs/design/gnome-theft-auto/direction/scenes/first-contract-outro.md.
 * No player actor (they are three biomes away). The Don's Lowrider rolls up to the side door at dusk; the report; three
 * taps make a Made Gnome. Then a fourth tap, which nobody has heard before. The guard who guesses right holds the door.
 */
export const FIRST_CONTRACT_OUTRO: SceneScript = {
  id: 'first-contract-outro',
  stage: { kind: 'world' },
  ambience: 'night',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/first-contract-outro.md' },
  actors: [
    { id: 'don', name: 'Don Compost', look: DON_LOOK, at: [0, 0], seatedIn: 'don-ride' },
    { id: 'guard-1', name: 'Bodyguard', look: GUARD_LOOK, at: FO_G1.at, yaw: FO_G1.yaw },
    { id: 'guard-2', name: 'Bodyguard', look: GUARD_LOOK, at: FO_G2.at, yaw: FO_G2.yaw, hz: 118 },
  ],
  vehicles: [{ id: 'don-ride', ...rideOf('don-compost'), at: [-2.5, -80], yaw: 0, headlights: true }],
  steps: [
    // 1. Hook: guard 2 hears the engine before he sees the car.
    cut(shot('guard-2', 'mcu', { side: 30 })),
    { do: 'drive', vehicle: 'don-ride', path: [[-2.5, -58]], speed: 9, async: true },
    { do: 'sfx', id: 'engine-rev', at: 'don-ride', gain: 0.5 },
    { do: 'face', who: 'guard-2', at: [-2.5, -40], s: 0.4 },
    { do: 'say', who: 'guard-2', text: 'Boss is early. Look busy.', music: 'heist' },
    { do: 'gesture', who: 'guard-2', name: 'crossArms', s: 1.0, async: true },
    // 2. The Lowrider glides in under the lamps.
    { do: 'cam', shot: { kind: 'track', pos: up(-9, -25, 1.4), who: 'don-ride', fov: 48 } },
    { do: 'drive', vehicle: 'don-ride', path: [[-3.5, -46], [-7.5, -40.5], [-9, -37.5]], speed: 7, depart: false },
    { do: 'exit', who: 'don' },
    cut(shot('don', 'ms', { toward: 'guard-1', side: 30 })),
    { do: 'walk', who: 'don', path: [[-11, -33], FO_DON_STEP], speed: 1.5 },
    { do: 'face', who: 'guard-1', at: 'don', s: 0.3, async: true },
    { do: 'face', who: 'don', at: 'guard-1', s: 0.4 },
    // 3. The report, over the Don's shoulder.
    cut(DOOR.ots('guard-1')),
    { do: 'say', who: 'guard-1', text: 'Dibbler. Gravelbottom. Spadewell. All three cracked, boss.' },
    // 4. Three taps on the cane hand: a Made Gnome.
    cut(DOOR.single('don', 'mcu', { height: 'low' })),
    { do: 'sfx', id: 'knock', at: 'don' },
    { do: 'wait', s: 0.45 },
    { do: 'sfx', id: 'knock', at: 'don' },
    { do: 'wait', s: 0.45 },
    { do: 'sfx', id: 'knock', at: 'don' },
    { do: 'wait', s: 0.5 },
    cut(DOOR.single('guard-1', 'mcu')),
    { do: 'say', who: 'guard-1', text: 'Three taps. The new kid\'s a Made Gnome.' },
    cut(shot('guard-2', 'mcu', { toward: 'don', side: 25 })),
    { do: 'say', who: 'guard-2', text: 'Wiseguy Hat\'s on the house. A thousand off the debt.' },
    // 5. The turn: a fourth tap. Nobody has heard four before. The music stops.
    cut(DOOR.single('don', 'mcu', { height: 'low' })),
    { do: 'music', track: null, fade: 0.3 },
    { do: 'sfx', id: 'knock', at: 'don' },
    { do: 'wait', s: 1.0 },
    { do: 'cam', shot: { kind: 'cut', pos: up(-11.5, -30, 1.3), look: up(-17.5, -30, 1.0), fov: 46 } },
    { do: 'face', who: 'guard-1', at: 'guard-2', s: 0.3, async: true },
    { do: 'face', who: 'guard-2', at: 'guard-1', s: 0.3 },
    beat('pause'),
    // Guard 1 guesses: he lunges for the door. The Don walks through it.
    { do: 'walk', who: 'guard-1', path: [[-17.2, -31.2]], run: true },
    { do: 'sfx', id: 'door', at: 'guard-1' },
    { do: 'stinger', id: 'comic' },
    { do: 'walk', who: 'don', path: [[-17.5, -30], [-19, -30]], speed: 1.2, async: true },
    { do: 'wait', s: 1.2 },
    { do: 'despawn', id: 'don' },
    // 6. The button: the code just grew a number.
    cut(shot('guard-2', 'mcu', { toward: 'guard-1', side: 25 })),
    { do: 'say', who: 'guard-2', text: 'Four\'s the door.', music: 'turfton-dusk' },
    cut(shot('guard-1', 'mcu', { toward: 'guard-2', side: -25 })),
    { do: 'say', who: 'guard-1', text: 'Write that down.' },
  ],
};

/**
 * Mower's Keepers intro, re-directed (the reference scene of the direction pass: notes in
 * docs/design/gnome-theft-auto/direction/scenes/mowers-keepers-intro.md). Cold open on the crime at the Neutral Picnic
 * Median: two HOA enforcers clamp a farmer's bike and ticket the farmer's boot. A match cut on "Code-enforced" lands in
 * Tansy's mouth at Side-Valve Salvage, ticket in hand. She hands the job over while swearing it is not her problem (the
 * plant the outro's eviction notice pays off), Pip volunteers too hard and gets put down, and the button is Turncoat Cam
 * stopping his broom to watch the player go (the plant for the chapter 3 betrayal).
 */
const MK_TANSY: Vec2 = [-143, 73];
const MK_PLAYER: Vec2 = [-146.4, 70.4];
const MK_EXIT: Vec2 = [-146.5, 67.8];
const MK_PIP_SEAT: Vec2 = [-135.5, 74];
const MK_PIP_IN: Vec2 = [-140.2, 72.4];
const MK_ENF1: Vec2 = [57.6, -57.2];
const MK_ENF2: Vec2 = [55.4, -54.6];
/** The two enforcers' exchange, and the bay's two-handers: each kept on one side of its line. */
const HOA = coverage('enf-1', 'enf-2', 1);
const BRIEF = coverage('tansy', 'player', 1);
const PIPS = coverage('pip', 'tansy', -1);

export const MOWERS_KEEPERS_INTRO: SceneScript = {
  id: 'mowers-keepers-intro',
  stage: { kind: 'world' },
  ambience: 'street',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/mowers-keepers-intro.md' },
  actors: [
    { id: 'player', player: true, at: MK_PLAYER, yaw: towards(MK_PLAYER, MK_TANSY) },
    { id: 'tansy', preset: 'tansy', name: 'Tansy Clayfoot', at: MK_TANSY, yaw: towards(MK_TANSY, MK_PLAYER), held: 'ticket-stub' },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: MK_PIP_SEAT, yaw: -Math.PI / 2 },
    { id: 'turncoat', name: 'Turncoat Cam', look: { hat: 0xf4f4f8, shirt: 0xc9b99b }, held: 'broom', ...markOf(SV, 'turncoat-cam') },
    { id: 'enf-1', name: 'HOA Enforcer', look: HOA_LOOK, at: MK_ENF1, yaw: towards(MK_ENF1, MK_ENF2), held: 'ticket-stub' },
    { id: 'enf-2', name: 'HOA Enforcer', look: HOA_LOOK, at: MK_ENF2, yaw: towards(MK_ENF2, MK_ENF1) },
  ],
  vehicles: [
    { id: 'tansy-ride', ...rideOf('tansy'), ...carMark(SV, 'tansy-zero-turn') },
    { id: 'pip-ride', ...rideOf('pip'), ...carMark(SV, 'pip-zero-turn') },
    { id: 'clamp-1', ...carMark(PB, 'clamped-bike-1') },
    { id: 'clamp-2', ...carMark(PB, 'clamped-bike-2') },
  ],
  steps: [
    // 1. Cold open on the crime: the clamp ratchets shut before we know where we are.
    { do: 'cam', shot: spot(PB, 'wide') },
    { do: 'sfx', id: 'handbrake', at: 'clamp-1' },
    { do: 'gesture', who: 'pip', name: 'sit', async: true },
    { do: 'wait', s: 2.2 },
    // 2. The enforcers, low and pleased with themselves; a deadpan exchange that escalates one notch per line.
    cut(HOA.single('enf-1', 'ms', { height: 'low' })),
    { do: 'gesture', who: 'enf-1', name: 'point', s: 1.0, async: true },
    { do: 'say', who: 'enf-1', text: 'Wheel clamped. Ticket on the handlebars.' },
    cut(HOA.single('enf-2', 'mcu')),
    { do: 'say', who: 'enf-2', text: 'He only stopped to tie his boot, sir.' },
    cut(HOA.ots('enf-1')),
    beat('beat'),
    { do: 'say', who: 'enf-1', text: 'Then the boot gets a ticket too. Code-enforced.' },
    // 3. Match cut on the phrase: the same words, now in Tansy's flat voice, the same ticket in her hand.
    cut(BRIEF.single('tansy', 'mcu')),
    { do: 'music', track: 'turfton', fade: 0.3 },
    { do: 'say', who: 'tansy', text: '"Code-enforced."' },
    beat('tiny'),
    { do: 'say', who: 'tansy', text: 'Three Cloverfield farmers. Three bikes, clamped at the Picnic Median.' },
    cut(BRIEF.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Your bikes?' },
    cut(BRIEF.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Their bikes. Not my bay, not my problem.' },
    { do: 'gesture', who: 'tansy', name: 'think', s: 1.4 },
    // The push-in is the turn: she has talked herself into it.
    cut(BRIEF.single('tansy', 'cu')),
    { do: 'say', who: 'tansy', text: 'Still. A clamp is just a lock in a uniform.' },
    // 4. The turn: Pip volunteers before anyone asks, and gets put down without a look.
    // A leading track: the camera backs away in front of him as he runs at the player (a frame shot on Pip's eyeline to
    // the player moves with him). It stays on the player's side of the line, where Tansy's answer is shot from.
    cut(shot('pip', 'ms', { toward: 'player', side: 40, handheld: 0.02 })),
    { do: 'gesture', who: 'pip', name: 'stand' },
    { do: 'walk', who: 'pip', path: [MK_PIP_IN], run: true },
    { do: 'face', who: 'pip', at: 'player', s: 0.25 },
    { do: 'gesture', who: 'pip', name: 'cheer', s: 1.2, async: true },
    { do: 'say', who: 'pip', text: 'Husky-Blade two-strokes! I\'ll ride one back. I\'ll ride all three!' },
    // She answers him without turning from the player: the put-down is that she does not look.
    cut(BRIEF.single('tansy', 'cu')),
    { do: 'say', who: 'tansy', text: 'You\'ll ride one. Into a lamp-post.' },
    ...reaction('pip', { toward: 'tansy', gesture: 'slump', size: 'mcu', side: -25 }),
    // 5. The job, to the one who will actually do it.
    { do: 'face', who: 'tansy', at: 'player', s: 0.3 },
    cut(BRIEF.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Unclamp them. Bring them to my bay. Mind the Hat Watch.' },
    cut(BRIEF.single('player', 'mcu')),
    { do: 'gesture', who: 'player', name: 'nod', s: 1.1 },
    // 6. The button: as the player goes, Turncoat Cam stops sweeping and watches. No music, one soft sting.
    { do: 'walk', who: 'player', path: [MK_EXIT], speed: 1.4, async: true },
    { do: 'music', track: null, fade: 0.6 },
    cut(shot('turncoat', 'fs', { side: 15 })),
    { do: 'face', who: 'turncoat', at: 'player', s: 0.6 },
    { do: 'stinger', id: 'mystery' },
    beat('silence'),
  ],
};

export const CH1_SCENES: Record<string, SceneScript> = {
  'prologue-intro': PROLOGUE_INTRO,
  'prologue-outro': PROLOGUE_OUTRO,
  'first-contract-intro': FIRST_CONTRACT_INTRO,
  'first-contract-outro': FIRST_CONTRACT_OUTRO,
  'mowers-keepers-intro': MOWERS_KEEPERS_INTRO,
};
