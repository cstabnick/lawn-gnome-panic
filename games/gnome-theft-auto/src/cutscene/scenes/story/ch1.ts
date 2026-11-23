// Chapter 1 story scenes, first file: the prologue, the First Contract, Mower's Keepers. Owner: one issue of
// docs/roadmaps/gta-story-cutscenes.md. Every id here is played by a quest in quests/chapter1.ts and checked by scenes.test.ts.
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, reaction, shot } from '../../direct';
import { carMark, markOf, pathOf, rideOf, spot, up } from './kit';

const PIP = markOf('bus-stop', 'pip');
const SV = 'side-valve-bay';
const MCD = 'mulch-club-door';
const PB = 'picnic-median';
const GUARD_LOOK = { hat: 0x18181e, shirt: 0x23262e };
const HOA_LOOK = { hat: 0x18181e, shirt: 0xc9b99b };

/**
 * The game's cold open (Fresh Out the Kiln, intro). The snail-coach pulls in at the downtown stop, the player steps
 * off into Turfton, Pip skids up on a borrowed Push-Mower Bike with the Hat Watch two blocks behind, points at a
 * Ride-On at the kerb (left in the world for the chase), a cut to Bodega & Sons, then the title slams in.
 */
export const PROLOGUE_INTRO: SceneScript = {
  id: 'prologue-intro',
  stage: { kind: 'world' },
  music: 'turfton',
  ambience: 'street',
  actors: [
    { id: 'player', player: true, at: [-6.4, 20], yaw: Math.PI / 2, hidden: true },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: [0, 0], seatedIn: 'bike', hidden: true },
    { id: 'john', preset: 'bodega', name: 'John Bodega', at: [-79.5, 86], yaw: 0 },
  ],
  vehicles: [
    { id: 'coach', kind: 'snail-coach', at: [2.5, 95], yaw: Math.PI },
    { id: 'bike', kind: 'push-bike', at: [-2.5, 70], yaw: Math.PI, hidden: true, tint: 0x3b7a57 },
    // The Ride-On the player borrows for the chase: stays in the world after the scene.
    { id: 'kerb-ride', kind: 'ride-on', at: [-7.6, 27], yaw: Math.PI, keep: true },
  ],
  steps: [
    // Establishing: down out of the towers onto the stop while the coach rolls in.
    { do: 'cam', shot: { kind: 'dolly', from: up(24, -6, 34), to: up(-16, 6, 4.5), look: up(-6, 18, 1.2), lookTo: up(0, 30, 1), s: 7.5, fov: 54 } },
    { do: 'drive', vehicle: 'coach', path: [[2.5, 60], [2.5, 32], [2.5, 21]], speed: 8, async: true },
    { do: 'say', who: 'Narrator', text: 'Every gnome thinks they are limited edition.', hz: 130 },
    { do: 'say', who: 'Narrator', text: 'Then you step off the snail-coach in Turfton, five thousand Acorns of Kiln-Debt in your pocket.', hz: 130 },
    { do: 'cam', shot: { kind: 'track', pos: up(-4.2, 31, 1.8), who: 'coach', fov: 50 } },
    { do: 'wait', s: 1.2 },
    { do: 'sfx', id: 'door' },
    { do: 'spawn', id: 'player' },
    { do: 'walk', who: 'player', path: [[-6.6, 18.5], [-7, 16]] },
    { do: 'face', who: 'player', yaw: 0, s: 0.4 },
    { do: 'drive', vehicle: 'coach', path: [[2.5, 0], [2.5, -60]], speed: 9, arrive: false, async: true },
    { do: 'say', who: 'Narrator', text: 'And half the block was cast from the same garden-centre mould.', hz: 130 },
    // The Hat Watch, two blocks over. Then Pip, at speed.
    { do: 'sfx', id: 'whistle', gain: 0.35 },
    { do: 'cam', shot: { kind: 'cut', pos: up(-4.6, 13.2, 1.5), look: 'player', fov: 46 } },
    { do: 'gesture', who: 'player', name: 'shrug', s: 1.0 },
    { do: 'spawn', id: 'bike' },
    { do: 'spawn', id: 'pip' },
    { do: 'cam', shot: { kind: 'track', pos: up(-0.8, 6, 1.5), who: 'bike', fov: 50 } },
    { do: 'drive', vehicle: 'bike', path: [[-2.5, 40], [-3.2, 22], [-4.2, 18]], speed: 10, async: true },
    { do: 'horn', vehicle: 'bike', async: true },
    { do: 'wait', s: 2.6 },
    { do: 'sfx', id: 'skid', at: 'bike' },
    { do: 'exit', who: 'pip' },
    { do: 'walk', who: 'pip', path: [PIP.at] },
    { do: 'face', who: 'pip', at: 'player', s: 0.3 },
    { do: 'face', who: 'player', at: 'pip', s: 0.3, async: true },
    { do: 'cam', shot: spot('bus-stop', 'two-shot') },
    { do: 'gesture', who: 'pip', name: 'handsUp', s: 1.2, async: true },
    { do: 'say', who: 'pip', text: 'Don\'t look at me like that! It\'s not stealing if the owner left the key in.' },
    { do: 'say', who: 'pip', text: 'He went inside a flowerpot for an Acorn-Cola. That\'s basically a gift.' },
    { do: 'sfx', id: 'whistle', gain: 0.6 },
    { do: 'cam', shot: { kind: 'cut', pos: up(-4.5, 14.5, 1.5), look: 'player', fov: 44 } },
    { do: 'say', who: 'player', text: 'Is that whistle for you?' },
    { do: 'cam', shot: { kind: 'cut', pos: up(-8.2, 15.2, 1.45), look: 'pip', fov: 44 } },
    { do: 'gesture', who: 'pip', name: 'point', s: 1.4, async: true },
    { do: 'say', who: 'pip', text: 'Grab that Ride-On at the kerb and follow me. Side-Valve Salvage. Tansy\'s got a crate that hums.' },
    { do: 'cam', shot: { kind: 'dolly', from: up(-11, 21, 1.8), to: up(-11.5, 24, 1.6), look: 'kerb-ride', s: 3 } },
    { do: 'say', who: 'pip', text: 'It smells faintly of Chirp & Crumb. Don\'t ask. I didn\'t.' },
    // Meanwhile at Bodega & Sons.
    { do: 'cam', shot: { kind: 'dolly', from: up(-73, 84, 1.7), to: up(-74.5, 86.5, 1.5), look: 'john', s: 5, fov: 48 } },
    // Async steps keep the scene open until they end: keep them shorter than the lines they run under.
    { do: 'walk', who: 'john', path: [[-79.5, 90]], speed: 0.9, async: true },
    { do: 'say', who: 'john', text: 'Bodega & Sons, late morning. Asphalt bats a bottlecap off the counter. Something fast is coming.', icon: '🐈' },
    // The title.
    { do: 'cam', shot: { kind: 'orbit', around: up(-8.5, 16.5, 0.9), radius: 4.2, height: 0.7, fromYaw: 2.3, toYaw: 1.5, s: 4 } },
    { do: 'music', track: 'turfton', fade: 0.4 },
    { do: 'stinger', id: 'chapter' },
    { do: 'title', text: 'GNOME THEFT AUTO' },
    { do: 'shake', amp: 0.06, s: 0.5 },
    { do: 'say', who: 'pip', text: 'Okay. Go go go!' },
    { do: 'title', text: null },
  ],
};

/** Fresh Out the Kiln payoff: the Ride-On pulls into Side-Valve Salvage, Tansy opens the crate. */
export const PROLOGUE_OUTRO: SceneScript = {
  id: 'prologue-outro',
  stage: { kind: 'world' },
  music: 'turfton',
  ambience: 'street',
  actors: [
    { id: 'player', player: true, at: [-60, 57.5], yaw: -Math.PI / 2, seatedIn: 'ride' },
    { id: 'tansy', preset: 'tansy', name: 'Tansy Clayfoot', at: [0, 0], seatedIn: 'tansy-ride' },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: [-127, 71], yaw: Math.PI / 2 },
    { id: 'turncoat', name: 'Turncoat Cam', look: { hat: 0xf4f4f8, shirt: 0xc9b99b }, ...markOf(SV, 'turncoat-cam') },
  ],
  vehicles: [
    { id: 'tansy-ride', ...rideOf('tansy'), ...carMark(SV, 'tansy-zero-turn') },
    { id: 'pip-bike', kind: 'push-bike', at: [-130, 66], yaw: Math.PI, tint: 0x3b7a57 },
    // The Ride-On the player borrowed at the kerb: spawned on foot, kept in the world at the end.
    { id: 'ride', kind: 'ride-on', from: 'player', at: [-60, 57.5], yaw: -Math.PI / 2, keep: true },
  ],
  props: [{ id: 'crate', prefab: 'crate', at: [-145, 80], yaw: 0.3 }],
  steps: [
    { do: 'cam', shot: spot(SV, 'wide') },
    { do: 'say', who: 'Narrator', text: 'Side-Valve Salvage, first light. Tansy has been up since dawn, and so has her Zero-Turn, which is still smoking.', hz: 130 },
    { do: 'cam', shot: { kind: 'track', pos: spot(SV, 'arrival').pos, who: 'ride', fov: 50 } },
    { do: 'drive', vehicle: 'ride', path: pathOf(SV, 'side-valve-approach'), speed: 9 },
    { do: 'exit', who: 'player' },
    { do: 'cam', shot: spot(SV, 'two-shot') },
    { do: 'exit', who: 'tansy' },
    { do: 'cam', shot: { kind: 'cut', pos: [-144.87, 1.25, 67.27], look: 'tansy', fov: 46 } },
    { do: 'say', who: 'tansy', text: 'Morning. My chicory coffee hasn\'t kicked in, so keep it short.' },
    { do: 'cam', shot: { kind: 'cut', pos: [-124.27, 1.25, 69.33], look: 'pip', fov: 46 } },
    { do: 'say', who: 'pip', text: 'We got the Ride-On! Totally legal. The kerb said nothing.' },
    { do: 'gesture', who: 'tansy', name: 'crossArms', s: 1.0 },
    { do: 'walk', who: 'tansy', path: [[-143, 75], [-144.5, 78]], speed: 1.2 },
    { do: 'face', who: 'tansy', at: 'crate', s: 0.3 },
    { do: 'sfx', id: 'door-creak', at: 'crate' },
    { do: 'wait', s: 0.6 },
    { do: 'sfx', id: 'thud', at: 'crate' },
    { do: 'wait', s: 0.6 },
    { do: 'sfx', id: 'thud', at: 'crate', gain: 0.8 },
    { do: 'hold', who: 'tansy', prop: 'golden-acorn-seed-cell' },
    { do: 'cam', shot: { kind: 'orbit', around: 'tansy', radius: 2.8, height: 0.9, fromYaw: 2.6, toYaw: 3.9, s: 4 } },
    { do: 'music', track: 'mystery', fade: 0.8 },
    { do: 'stinger', id: 'reveal' },
    { do: 'cam', shot: { kind: 'cut', pos: [-124.27, 1.25, 69.33], look: 'pip', fov: 46 } },
    { do: 'say', who: 'pip', text: 'Okay, yeah. That might not be grass.' },
    { do: 'cam', shot: { kind: 'cut', pos: [-147.69, 1.25, 77.76], look: 'tansy', fov: 46 } },
    { do: 'say', who: 'tansy', text: 'It hums. It smells of Chirp & Crumb and Fescue. That is trouble, Pip.' },
    { do: 'cam', shot: { kind: 'cut', pos: up(-156, 60, 1.6), look: 'turncoat', fov: 44 } },
    { do: 'stinger', id: 'mystery' },
    { do: 'gesture', who: 'turncoat', name: 'lean', s: 1.6 },
    { do: 'face', who: 'turncoat', at: 'tansy', s: 0.4 },
    { do: 'cam', shot: spot(SV, 'two-shot') },
    { do: 'hold', who: 'tansy', prop: null },
    { do: 'cam', shot: { kind: 'cut', pos: [-147.69, 1.25, 77.76], look: 'tansy', fov: 46 } },
    { do: 'say', who: 'tansy', text: 'And stay away from Mossley outside Bodega\'s. He\'ll make you measure the grid.' },
    { do: 'walk', who: 'player', path: [[-146.5, 67.5]], speed: 1.2 },
  ],
};

/** First Contract payoff: Don Compost's Lowrider rolls up to the Mulch Club side door. No player actor (cracked far away). */
export const FIRST_CONTRACT_OUTRO: SceneScript = {
  id: 'first-contract-outro',
  stage: { kind: 'world' },
  music: 'heist',
  ambience: 'night',
  actors: [
    { id: 'don', name: 'Don Compost', look: { hat: 0x141414, shirt: 0xefe6d2, beard: 0xdddddd }, at: [0, 0], seatedIn: 'don-ride' },
    { id: 'guard-1', name: 'Bodyguard', look: GUARD_LOOK, ...markOf(MCD, 'bodyguard', 0) },
    { id: 'guard-2', name: 'Bodyguard', look: GUARD_LOOK, ...markOf(MCD, 'bodyguard', 1) },
  ],
  vehicles: [{ id: 'don-ride', ...rideOf('don-compost'), at: [-2.5, -85], yaw: 0 }],
  steps: [
    { do: 'cam', shot: spot(MCD, 'wide') },
    { do: 'cam', shot: { kind: 'track', pos: spot(MCD, 'arrival').pos, who: 'don-ride', fov: 50 } },
    { do: 'parallel', tracks: [
      [{ do: 'drive', vehicle: 'don-ride', path: [[-2.5, -30]], speed: 9 }],
      [{ do: 'wait', s: 1.5 }, { do: 'say', who: 'guard-2', text: 'Boss is early. Look busy.' }],
    ] },
    { do: 'exit', who: 'don' },
    { do: 'walk', who: 'don', path: [[-7, -30], [-17.5, -30]], speed: 1.6, async: true },
    { do: 'cam', shot: { kind: 'cut', pos: [-14.77, 1.25, -34.67], look: 'guard-1', fov: 46 } },
    { do: 'say', who: 'guard-1', text: 'Evening, boss. Good news, for once.' },
    { do: 'face', who: 'don', yaw: Math.PI / 2, s: 0.4 },
    { do: 'cam', shot: { kind: 'cut', pos: up(-11.5, -36, 1.5), look: 'guard-1', fov: 46 } },
    { do: 'say', who: 'guard-1', text: 'Dibbler. Gravelbottom. Spadewell. All three cracked, boss.' },
    { do: 'sfx', id: 'knock', at: 'don' },
    { do: 'wait', s: 0.5 },
    { do: 'sfx', id: 'knock', at: 'don' },
    { do: 'wait', s: 0.5 },
    { do: 'sfx', id: 'knock', at: 'don' },
    { do: 'say', who: 'guard-1', text: 'Three taps. You\'re a Made Gnome now. The Wiseguy Hat\'s on the house.' },
    { do: 'cam', shot: { kind: 'cut', pos: up(-11.5, -24, 1.5), look: 'guard-2', fov: 46 } },
    { do: 'say', who: 'guard-2', text: 'Your Kiln-Debt just got a thousand Acorns lighter.' },
    { do: 'sfx', id: 'knock', at: 'don' },
    { do: 'stinger', id: 'comic' },
    { do: 'face', who: 'guard-2', at: 'don', s: 0.4 },
    { do: 'say', who: 'Narrator', text: 'Everyone freezes. He only wanted the door held.', hz: 130 },
    { do: 'music', track: 'triumph', fade: 1.0 },
    { do: 'stinger', id: 'triumph' },
    { do: 'wait', s: 1.5 },
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
const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);
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

/** Mower's Keepers payoff: the eviction notice comes down, then Vesper's pearl Lowrider cruises past. */
export const MOWERS_KEEPERS_OUTRO: SceneScript = {
  id: 'mowers-keepers-outro',
  stage: { kind: 'world' },
  music: 'tension',
  ambience: 'street',
  actors: [
    { id: 'player', player: true, ...markOf(SV, 'player') },
    { id: 'tansy', preset: 'tansy', name: 'Tansy Clayfoot', ...markOf(SV, 'tansy'), held: null },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', ...markOf(SV, 'pip') },
  ],
  vehicles: [{ id: 'vesper-car', ...rideOf('vesper'), at: [-60, 57.5], yaw: -Math.PI / 2 }],
  props: [{ id: 'notice', prefab: 'sealed-letter', at: [-142.4, 65.6], yaw: 0, size: 0.35 }],
  steps: [
    { do: 'cam', shot: spot(SV, 'wide') },
    { do: 'say', who: 'Narrator', text: 'The process server is lying in the lavender. The eviction notice is still taped to the bay door.', hz: 130 },
    { do: 'walk', who: 'tansy', path: [[-142.5, 68.5]], speed: 1.2 },
    { do: 'despawn', id: 'notice' },
    { do: 'hold', who: 'tansy', prop: 'sealed-letter' },
    { do: 'gesture', who: 'tansy', name: 'facepalm', s: 1.0 },
    { do: 'cam', shot: { kind: 'cut', pos: [-143.86, 1.25, 65.6], look: 'tansy', fov: 46 } },
    { do: 'say', who: 'tansy', text: 'Eviction notice. Taped to my bay door. Who sends an eviction to a salvage yard?' },
    { do: 'walk', who: 'pip', path: [[-139, 71], [-141, 70]], speed: 1.2 },
    { do: 'cam', shot: { kind: 'cut', pos: [-144.19, 1.25, 70.28], look: 'pip', fov: 46 } },
    { do: 'say', who: 'pip', text: 'Eviction? We don\'t even pay rent.' },
    { do: 'cam', shot: { kind: 'cut', pos: [-143.86, 1.25, 65.6], look: 'tansy', fov: 46 } },
    { do: 'say', who: 'tansy', text: 'Exactly.' },
    { do: 'cam', shot: { kind: 'track', pos: spot(SV, 'arrival').pos, who: 'vesper-car', fov: 50 } },
    { do: 'music', track: 'villain', fade: 1.2 },
    { do: 'stinger', id: 'villain' },
    { do: 'drive', vehicle: 'vesper-car', path: [[-110, 57.5], [-190, 57.5]], speed: 9, depart: true, arrive: false, async: true },
    { do: 'cam', shot: { kind: 'cut', pos: [-143.86, 1.25, 65.6], look: 'tansy', fov: 46 } },
    { do: 'say', who: 'tansy', text: 'Vesper Thorne. He doesn\'t knock. He files.' },
    { do: 'cam', shot: { kind: 'cut', pos: [-144.19, 1.25, 70.28], look: 'pip', fov: 46 } },
    { do: 'say', who: 'pip', text: 'Is anyone driving that? Nobody\'s driving that.' },
    { do: 'cam', shot: { kind: 'cut', pos: [-143.86, 1.25, 65.6], look: 'tansy', fov: 46 } },
    { do: 'say', who: 'tansy', text: 'Nobody\'s driving it. That\'s worse.' },
    { do: 'walk', who: 'player', path: [[-150, 70], [-146.5, 68.5]], speed: 1.2 },
  ],
};

export const CH1_SCENES: Record<string, SceneScript> = {
  'prologue-intro': PROLOGUE_INTRO,
  'prologue-outro': PROLOGUE_OUTRO,
  'first-contract-outro': FIRST_CONTRACT_OUTRO,
  'mowers-keepers-intro': MOWERS_KEEPERS_INTRO,
  'mowers-keepers-outro': MOWERS_KEEPERS_OUTRO,
};
