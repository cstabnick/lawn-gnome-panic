// Story row 14: Drainpipe Court. Pip lost his toolbox on a bet; the player wins it back in a game to seven; on the bench
// Pip says why he left Fescue. The first sincere beat of the game: the outro has no gag and no music sting.
// Notes: docs/design/gnome-theft-auto/direction/scenes/drainpipe-court-{intro,mid,outro}.md
import type { SceneScript } from '../../script';
import { beat, coverage, cut, exchangeLooks, shot } from '../../direct';
import { markOf, spot, up } from './kit';

const ST = 'drainpipe-bench';
const PIP = markOf(ST, 'pip');
const PLAYER_A = markOf(ST, 'player', 0);
const PLAYER_B = markOf(ST, 'player', 1);
const CARDOON = markOf(ST, 'cardoon');

// Two-shots of a conversation share one side of the line for the whole scene.
const PIP_PLAYER = coverage('pip', 'player', 1);
const PIP_CARDOON = coverage('pip', 'cardoon', -1);
/** The court's own regulars (court/life.ts) who would double the scene's cast: Swish (Cardoon) acts here himself, and Old
 * Burdock sits on the bench Pip and the player take (FX05). Hidden while each scene plays. */
const COURT_DOUBLES = ['court-cardoon', 'court-benchley'];
const CARDOON_PLAYER = coverage('cardoon', 'player', 1);

/** The toolbox on the east end of the old bench (the court's own vignette, court/life.ts). */
const TOOLBOX: [number, number] = [-93.9, 21.6];

/** Row 14 intro: Pip on the bench, bruised; Swish comes to dust the box he won. Dusk. */
const INTRO: SceneScript = {
  id: 'drainpipe-court-intro',
  stage: { kind: 'world' },
  hideWorld: COURT_DOUBLES,
  music: 'turfton-dusk',
  ambience: 'street',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/drainpipe-court-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, at: PLAYER_A.at, yaw: PLAYER_A.yaw },
    { id: 'pip', preset: 'pip', at: PIP.at, yaw: PIP.yaw },
    { id: 'cardoon', preset: 'cardoon', at: [-80, 33], yaw: -Math.PI / 2 },
  ],
  steps: [
    // Hook: Pip, slumped on the bench, with the first line of the job.
    { do: 'gesture', who: 'pip', name: 'sit', s: 0.2, async: true },
    ...exchangeLooks('pip', 'player', 0.05),
    cut(PIP_PLAYER.single('pip', 'mcu')),
    { do: 'sfx', id: 'thud', at: up(-86, 30, 0.5), gain: 0.35, async: true },
    { do: 'say', who: 'pip', text: 'Okay, hear me out. I lost my toolbox at this court.' },
    cut(PIP_PLAYER.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Lost it how?' },
    cut(PIP_PLAYER.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'A bet. Seven free throws, I said. I hit one.' },
    // The box, kept dusted on the bench end, and who is coming to dust it.
    { do: 'sfx', id: 'cloth', at: up(TOOLBOX[0], TOOLBOX[1], 0.5), gain: 0.4, async: true },
    cut({ kind: 'cut', pos: up(-92.5, 23.6, 1.15), look: up(TOOLBOX[0], TOOLBOX[1], 0.55), fov: 34 }),
    { do: 'walk', who: 'cardoon', path: [[-87, 28.5], [-92.2, 23.1]], speed: 2.4, async: true },
    { do: 'wait', s: 1.6 },
    { do: 'face', who: 'pip', at: 'cardoon', s: 0.3, async: true },
    cut(PIP_CARDOON.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'He dusts it every hour. Watch.' },
    // Swish arrives with a feather duster and his own name.
    cut(CARDOON_PLAYER.single('cardoon', 'ms')),
    { do: 'hold', who: 'cardoon', prop: 'feather-duster' },
    { do: 'face', who: 'cardoon', at: [TOOLBOX[0], TOOLBOX[1]], s: 0.3 },
    { do: 'sfx', id: 'cloth', at: 'cardoon', gain: 0.45, async: true },
    { do: 'gesture', who: 'cardoon', name: 'wave', s: 1.3, async: true },
    { do: 'wait', s: 0.8 },
    { do: 'face', who: 'cardoon', at: 'player', s: 0.3 },
    cut(shot('cardoon', 'mcu', { toward: 'player', side: 55 })),
    { do: 'say', who: 'cardoon', text: "Swish. That's me. That's the whole name." },
    { do: 'intro', who: 'cardoon' },
    cut(CARDOON_PLAYER.single('cardoon', 'ms')),
    { do: 'say', who: 'cardoon', text: 'Chief, mind the lid. Freshly dusted.' },
    cut(PIP_CARDOON.single('pip', 'mcu')),
    { do: 'gesture', who: 'pip', name: 'facepalm', s: 1.1, async: true },
    beat('beat'),
    { do: 'say', who: 'pip', text: 'It is MY toolbox!' },
    { do: 'face', who: 'cardoon', at: 'pip', s: 0.3, async: true },
    cut(PIP_CARDOON.single('cardoon', 'mcu')),
    { do: 'say', who: 'cardoon', text: 'Seven free throws, he hit one. Chief, that is arithmetic.' },
    // The turn: Pip stops joking, and asks. The objective is in his voice.
    { do: 'face', who: 'pip', at: 'player', s: 0.4 },
    cut(PIP_PLAYER.single('pip', 'ms', { height: 'high' })),
    { do: 'gesture', who: 'pip', name: 'slump', s: 1.2, async: true },
    { do: 'say', who: 'pip', text: 'Win it back for me. One game, seven points. Please?' },
    { do: 'face', who: 'player', at: 'cardoon', s: 0.3, async: true },
    cut(shot('player', 'mcu', { toward: 'cardoon', side: -55 })),
    { do: 'say', who: 'player', text: 'Seven.' },
    // Button: Swish has the last word, then walks off with the duster in his hand.
    { do: 'face', who: 'cardoon', at: 'player', s: 0.3, async: true },
    cut(CARDOON_PLAYER.single('cardoon', 'ms')),
    { do: 'say', who: 'cardoon', text: 'Any time, chief. I will go easy.' },
    { do: 'sfx', id: 'thud', at: 'cardoon', gain: 0.5, async: true },
    { do: 'walk', who: 'cardoon', path: [[-88, 27.5], [-85, 30.5]], speed: 1.8, async: true },
    { do: 'wait', s: 2.2 },
  ],
};

/** Row 14 mid: on the court, before tip-off. Swish names the terms; Pip shouts from the bench. Dusk. */
const MID: SceneScript = {
  id: 'drainpipe-court-mid',
  stage: { kind: 'world' },
  hideWorld: COURT_DOUBLES,
  music: 'turfton-dusk',
  ambience: 'street',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/drainpipe-court-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, at: [-87.6, 31.4], yaw: Math.PI / 2 },
    { id: 'cardoon', preset: 'cardoon', at: [CARDOON.at[0] - 0.4, CARDOON.at[1] + 0.6], yaw: -Math.PI / 2 },
    { id: 'pip', preset: 'pip', at: PIP.at, yaw: PIP.yaw },
  ],
  steps: [
    // Hook: the ball on a finger, and the terms.
    { do: 'gesture', who: 'pip', name: 'sit', s: 0.2, async: true },
    cut(CARDOON_PLAYER.single('cardoon', 'mcu')),
    { do: 'sfx', id: 'thud', at: 'cardoon', gain: 0.5, async: true },
    { do: 'say', who: 'cardoon', text: 'Seven points, chief. I will go easy.' },
    cut(CARDOON_PLAYER.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Define easy.' },
    cut(CARDOON_PLAYER.single('cardoon', 'mcu', { height: 'low' })),
    { do: 'say', who: 'cardoon', text: 'Slowly. Loudly. With commentary.' },
    // The turn: the bench, forty feet away, has opinions.
    { do: 'sfx', id: 'cloth', at: 'pip', gain: 0.4, async: true },
    { do: 'face', who: 'pip', at: 'player', s: 0.3, async: true },
    cut(shot('pip', 'ms', { toward: 'player', side: 30 })),
    { do: 'gesture', who: 'pip', name: 'cheer', s: 1.2, async: true },
    { do: 'say', who: 'pip', text: 'Do not let him talk you out of it!' },
    // Button: the ball changes hands.
    cut(CARDOON_PLAYER.single('cardoon', 'ms')),
    { do: 'give', from: 'cardoon', to: 'player', prop: 'spare-basketball', s: 0.9 },
    { do: 'sfx', id: 'bell', at: 'cardoon', gain: 0.35, async: true },
    { do: 'say', who: 'cardoon', text: 'Chalk board is yours. Tip-off, chief.' },
  ],
};

/** Row 14 outro: the box is back; on the bench Pip says why he left Fescue. Dusk, the lamps come on. No music, no gag. */
const OUTRO: SceneScript = {
  id: 'drainpipe-court-outro',
  stage: { kind: 'world' },
  hideWorld: COURT_DOUBLES,
  music: 'turfton-dusk',
  ambience: 'night',
  sky: 'golden',
  // The court lamps stutter on at the end (static, pop, latch) and stay on over the bench.
  keyLights: [
    { at: up(-105, 20.5, 3.2), color: 0xffb066, intensity: 10, range: 16, from: 24.4 },
    { at: up(-96, 11.5, 3.2), color: 0xffb066, intensity: 10, range: 16, from: 25.2 },
  ],
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/drainpipe-court-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, at: PLAYER_B.at, yaw: PLAYER_B.yaw },
    { id: 'pip', preset: 'pip', at: PIP.at, yaw: PIP.yaw },
    { id: 'cardoon', preset: 'cardoon', at: [-90.5, 25.4], yaw: Math.PI },
  ],
  steps: [
    // Hook: the loser's concession, said low, to the one who won.
    { do: 'gesture', who: 'pip', name: 'sit', s: 0.2, async: true },
    { do: 'gesture', who: 'player', name: 'sit', s: 0.2, async: true },
    { do: 'face', who: 'cardoon', at: 'pip', s: 0.05, async: true },
    { do: 'face', who: 'pip', at: 'cardoon', s: 0.05, async: true },
    cut(spot(ST, 'bench')),
    { do: 'sfx', id: 'thud', at: 'cardoon', gain: 0.35, async: true },
    { do: 'wait', s: 1.0 },
    cut(PIP_CARDOON.single('cardoon', 'mcu')),
    { do: 'say', who: 'cardoon', text: 'Seven to three. Fair. I kept it dusted for you.' },
    cut(PIP_CARDOON.single('pip', 'mcu')),
    { do: 'gesture', who: 'pip', name: 'clutch', s: 1.2, async: true },
    { do: 'say', who: 'pip', text: 'Thanks, Swish.' },
    cut(PIP_CARDOON.single('cardoon', 'mcu', { height: 'low' })),
    { do: 'say', who: 'cardoon', text: 'Chief.' },
    { do: 'sfx', id: 'cloth', at: 'cardoon', gain: 0.4, async: true },
    { do: 'walk', who: 'cardoon', path: [[-88, 27], [-84.5, 30]], speed: 1.6, async: true },
    // The turn: the court is quiet. Pip does not talk fast.
    { do: 'music', track: null, fade: 1.2 },
    cut(PIP_CARDOON.single('pip', 'mcu', { height: 'high' })),
    // Pip turns to the player, but the camera stays on the court side: his face, not the player's shoulder.
    { do: 'face', who: 'pip', at: [-92.8, 25.5], s: 0.8 },
    beat('pause'),
    { do: 'say', who: 'pip', text: 'Back home, everything is already built. The lawns. The jobs. Us.' },
    cut(PIP_CARDOON.single('pip', 'cu')),
    { do: 'say', who: 'pip', text: 'A Potsworth gets a stool and a ledger. Mine had my name on it.' },
    cut(PIP_PLAYER.single('player', 'mcu')),
    beat('pause'),
    cut(PIP_CARDOON.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'I wanted to build. Not be built.' },
    // Nobody says anything. The ball is a long way off; then the lamps come on, one stutter at a time.
    cut(PIP_PLAYER.single('player', 'mcu')),
    beat('silence'),
    { do: 'sfx', id: 'static', at: up(-105, 20.5, 2), gain: 0.4 },
    cut({ kind: 'cut', pos: up(-95.5, 16.8, 1.9), look: up(-105, 20.5, 2.6), fov: 38 }),
    { do: 'sfx', id: 'pop', at: up(-105, 20.5, 2), gain: 0.45 },
    { do: 'wait', s: 0.5 },
    { do: 'sfx', id: 'latch', at: up(-105, 20.5, 2), gain: 0.45 },
    { do: 'wait', s: 0.9 },
    // Button: the two of them on the bench, under the light that stays on.
    // From the court side, in front of the bench: both faces, the lamp that stayed on behind them.
    cut({ kind: 'cut', pos: up(-93.6, 26.2, 1.5), look: up(-95.15, 21.6, 0.8), fov: 42 }),
    { do: 'wait', s: 2.2 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'drainpipe-court-intro': INTRO,
  'drainpipe-court-mid': MID,
  'drainpipe-court-outro': OUTRO,
};
