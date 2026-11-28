// Story row 5: Sweeper's Wages. Three scenes: Cam asks for a favour at dusk (intro, Side-Valve), Lulu wins a heat in front
// of him at the Carburettors' night meet and he stares at her charter plate (mid, the Skyway foot), and Cam sweeps
// slower (outro, Side-Valve at night). The plant for his betrayal (rows 30-35) is the stare.
// Notes: docs/design/gnome-theft-auto/direction/scenes/sweepers-wages-{intro,mid,outro}.md
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, pushIn, reaction, shot } from '../../direct';
import { carMark, markOf, up } from './kit';

const SV = 'side-valve-bay';
const MEET = 'skyway-night-meet';
const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

const RIVAL_LOOK = { hat: 0x3b5ba5, shirt: 0x23262e };

// ---- Intro: Cam asks ------------------------------------------------------------------------------------------------------

const I_PLAYER: Vec2 = [-156.4, 70.4];
const I_CAM: Vec2 = [-153, 70.8];
const I_TANSY: Vec2 = [-149.4, 73.6];
const I_BIKE: Vec2 = [-150.4, 66.6];
const CAM_PLAYER = coverage('turncoat', 'player', 1);
const TANSY_PLAYER = coverage('tansy', 'player', 1);

export const SWEEPERS_WAGES_INTRO: SceneScript = {
  id: 'sweepers-wages-intro',
  stage: { kind: 'world' },
  music: 'turfton-dusk',
  ambience: 'street',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sweepers-wages-intro.md', kind: 'intro' },
  title: "Sweeper's Wages",
  actors: [
    { id: 'player', player: true, at: I_PLAYER, yaw: towards(I_PLAYER, I_CAM) },
    { id: 'turncoat', preset: 'turncoat cam', name: 'Turncoat Cam', at: [-149, 69.2], yaw: towards([-149, 69.2], I_CAM), held: 'broom' },
    { id: 'tansy', preset: 'tansy', name: 'Tansy Clayfoot', at: I_TANSY, yaw: towards(I_TANSY, I_PLAYER), held: 'rag' },
  ],
  vehicles: [
    { id: 'tansy-ride', ...carMark(SV, 'tansy-zero-turn') },
    { id: 'cam-bike', kind: 'push-bike', at: I_BIKE, yaw: Math.PI, tint: 0x5a6b4a },
  ],
  props: [
    // L95: the carburettor has been nursed in a nest of rag and a spare cap in a crate, and the crate has been dusted.
    { id: 'nest-crate', prefab: 'crate', at: [-151.2, 66.2], yaw: 0.2 },
  ],
  steps: [
    // 1. Hook: the broom stops. Cam, who never stops, has stopped, a carburettor in his other hand.
    cut(shot('turncoat', 'ms', { toward: 'player', side: 30 })),
    { do: 'sfx', id: 'rustle', at: 'turncoat', gain: 0.5, async: true },
    { do: 'walk', who: 'turncoat', path: [I_CAM], speed: 1.0 },
    { do: 'hold', who: 'turncoat', prop: 'carburettor' },
    { do: 'face', who: 'turncoat', at: 'player', s: 0.4 },
    cut(CAM_PLAYER.single('turncoat', 'mcu')),
    { do: 'say', who: 'turncoat', text: 'There is a night meet. On the Skyway.' },
    beat('beat'),
    { do: 'say', who: 'turncoat', text: 'They need this by dark. Please.' },
    // 2. The player's question; Cam's answer is the sad little joke of the scene.
    cut(CAM_PLAYER.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Why not take it yourself?' },
    cut(CAM_PLAYER.single('turncoat', 'cu')),
    beat('beat'),
    { do: 'say', who: 'turncoat', text: 'Somebody has to sweep.' },
    // 3. The turn: Tansy, who has not looked up, settles it.
    cut(TANSY_PLAYER.single('tansy', 'mcu')),
    { do: 'gesture', who: 'tansy', name: 'shrug', s: 1.0, async: true },
    { do: 'say', who: 'tansy', text: 'Take it. Be polite to Lulu. She has opinions.' },
    { do: 'sfx', id: 'cloth', at: 'tansy', gain: 0.4, async: true },
    { do: 'give', from: 'turncoat', to: 'player', prop: 'carburettor', s: 1.0 },
    { do: 'hold', who: 'turncoat', prop: 'broom' },
    ...reaction('player', { toward: 'turncoat', size: 'mcu', hold: 'pause' }),
    // 4. Cam mounts his push-bike with the broom across the handlebars: the shyest getaway in Turfton.
    cut(shot('turncoat', 'ms', { toward: 'player', side: 35 })),
    { do: 'say', who: 'turncoat', text: 'This way. I will ride ahead.' },
    { do: 'walk', who: 'turncoat', path: [[-151.4, 67.8]], speed: 1.4 },
    { do: 'cam', shot: { kind: 'track', pos: up(-156, 63.6, 1.5), who: 'cam-bike', fov: 50 } },
    { do: 'enter', who: 'turncoat', vehicle: 'cam-bike' },
    { do: 'sfx', id: 'bell', at: 'cam-bike', gain: 0.5, async: true },
    { do: 'drive', vehicle: 'cam-bike', path: [I_BIKE, [-150.2, 60], [-160, 57.5], [-190, 57.5]], speed: 5, arrive: false, async: true },
    { do: 'wait', s: 2.6 },
    // 5. The button: Tansy, to herself, and the thing she has noticed.
    cut(TANSY_PLAYER.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'First thing he has asked anyone for in two years.' },
    cut(shot('player', 'cu', { toward: 'tansy', height: 'high' })),
    { do: 'wait', s: 1.2 },
  ],
};

// ---- Mid: the night meet ------------------------------------------------------------------------------------------------

const M_PLAYER = markOf(MEET, 'player');
const M_LULU = markOf(MEET, 'lulu');
const M_CAM = markOf(MEET, 'turncoat-cam');
const LULU_CAR = carMark(MEET, 'lulu-lowrider');
const RIVAL_CAR = carMark(MEET, 'rival-lowrider');
/** The spectators on the finish line: Lulu and the player, with Cam two steps behind. */
const LP = coverage('lulu', 'player', 1);
const LC = coverage('lulu', 'turncoat', -1);

export const SWEEPERS_WAGES_MID: SceneScript = {
  id: 'sweepers-wages-mid',
  stage: { kind: 'world' },
  music: 'turfton',
  ambience: 'crowd',
  sky: 'night',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sweepers-wages-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, at: M_PLAYER.at, yaw: M_PLAYER.yaw, held: 'carburettor' },
    { id: 'turncoat', preset: 'turncoat cam', name: 'Turncoat Cam', at: M_CAM.at, yaw: M_CAM.yaw, held: 'broom' },
    { id: 'lulu', preset: 'lugnut lulu', name: 'Lugnut Lulu', at: [0, 0], seatedIn: 'lulu-car' },
    { id: 'rival', name: 'Carburettor', look: RIVAL_LOOK, at: [0, 0], seatedIn: 'rival-car' },
  ],
  vehicles: [
    {
      id: 'lulu-car', kind: 'lowrider', at: LULU_CAR.at, yaw: LULU_CAR.yaw, headlights: true,
      loadout: { paint: 0xff6a00, finish: 'gloss', extras: ['plate', 'fairylights'], underglow: 0xff6a00 },
    },
    { id: 'rival-car', kind: 'lowrider', at: RIVAL_CAR.at, yaw: RIVAL_CAR.yaw, headlights: true, loadout: { paint: 0x3b5ba5, finish: 'matte' } },
    { id: 'idler-a', kind: 'lowrider', at: [-298, -53], yaw: 0.4, headlights: true, tint: 0x7a2f7a },
    { id: 'idler-b', kind: 'lowrider', at: [-292, -66], yaw: -2.6, headlights: true, tint: 0x2f7a5a },
  ],
  props: [
    // L95: a rope of fairy lights over the finish line, two tyre stacks for posts and a thermos on a bonnet.
    { id: 'lights', prefab: 'bunting-span', at: [-282, -58.5], yaw: 0, size: 9 },
    { id: 'post-a', prefab: 'speedway-tyre-stack', at: [-282, -54.2], yaw: 0 },
    { id: 'post-b', prefab: 'speedway-tyre-stack', at: [-282, -62.8], yaw: 0 },
    { id: 'thermos', prefab: 'camp-kettle-pack', at: up(-296.4, -53.8, 0.55), yaw: 0.6, size: 0.35 },
  ],
  steps: [
    // 1. Hook: engines, headlights, a rope of fairy lights: the meet, seen low as the cars idle on the start line.
    { do: 'cam', shot: { kind: 'dolly', from: up(-300, -50, 1.4), to: up(-292, -49, 1.5), look: up(-306, -60, 0.9), lookTo: up(-300, -60.5, 0.9), s: 3.0, fov: 50 } },
    { do: 'sfx', id: 'engine-rev', at: 'lulu-car', gain: 0.6, async: true },
    { do: 'sfx', id: 'engine-rev', at: 'rival-car', gain: 0.5, async: true },
    { do: 'wait', s: 3.0 },
    // 2. The heat: two cars down the foot of the Skyway, straight at the lens, Lulu first.
    { do: 'music', track: 'chase', fade: 0.4 },
    { do: 'cam', shot: { kind: 'track', pos: up(-288, -56.3, 1.0), who: 'lulu-car', fov: 52 } },
    { do: 'drive', vehicle: 'rival-car', path: [[-306, -62.5], [-274, -62.5]], speed: 11, async: true },
    { do: 'drive', vehicle: 'lulu-car', path: [[-306, -58.5], [-274, -58.5]], speed: 14 },
    { do: 'sfx', id: 'skid', at: 'lulu-car', gain: 0.6, async: true },
    { do: 'wait', s: 0.8 },
    // 3. Cam watches the winner: one look, no words.
    { do: 'music', track: 'turfton', fade: 1.0 },
    cut(shot('turncoat', 'mcu', { toward: 'lulu' })),
    beat('pause'),
    // 4. Lulu steps out into the lights and takes the part she came for.
    { do: 'cam', shot: { kind: 'track', pos: up(-284, -61, 1.4), who: 'lulu', fov: 50 } },
    { do: 'exit', who: 'lulu' },
    { do: 'walk', who: 'lulu', path: [M_LULU.at], speed: 1.6 },
    { do: 'face', who: 'lulu', at: 'player', s: 0.3 },
    cut(LP.single('lulu', 'mcu')),
    { do: 'gesture', who: 'lulu', name: 'cheer', s: 1.2, async: true },
    { do: 'say', who: 'lulu', text: 'Carburettors run this town. Low and loud!' },
    { do: 'intro', who: 'lulu' },
    cut(LP.two('ms')),
    { do: 'give', from: 'player', to: 'lulu', prop: 'carburettor', s: 1.0 },
    // 5. The turn: the tease goes past the player to the sweeper in the shadows, and he does not answer it.
    { do: 'face', who: 'lulu', at: 'turncoat', s: 0.4 },
    cut(LC.single('lulu', 'mcu')),
    { do: 'say', who: 'lulu', text: 'My part! Nice following, sweeper!' },
    { do: 'wait', s: 0.4 },
    // 6. The button: the charter plate on her bumper, and Cam, looking at it.
    cut({ kind: 'cut', pos: up(-280.2, -57.4, 0.9), look: up(-275.2, -58.5, 0.7), fov: 30 }),
    { do: 'stinger', id: 'mystery' },
    { do: 'music', track: null, fade: 0.6 },
    { do: 'wait', s: 1.4 },
    cut(pushIn('turncoat', 'mcu', 3.0, { toward: 'lulu' })),
    beat('silence'),
  ],
};

// ---- Outro: Cam sweeps slower -------------------------------------------------------------------------------------------

const O_PLAYER: Vec2 = [-156.4, 70.6];
const O_TANSY: Vec2 = [-151.6, 73.4];
const O_CAM: Vec2 = [-145.8, 68.2];
const TP = coverage('tansy', 'player', 1);

export const SWEEPERS_WAGES_OUTRO: SceneScript = {
  id: 'sweepers-wages-outro',
  stage: { kind: 'world' },
  music: 'turfton-dusk',
  ambience: 'night',
  sky: 'night',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sweepers-wages-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, at: O_PLAYER, yaw: towards(O_PLAYER, O_TANSY) },
    { id: 'tansy', preset: 'tansy', name: 'Tansy Clayfoot', at: O_TANSY, yaw: towards(O_TANSY, O_PLAYER), held: 'rag' },
    { id: 'turncoat', preset: 'turncoat cam', name: 'Turncoat Cam', at: O_CAM, yaw: 0, held: 'broom' },
  ],
  vehicles: [
    { id: 'tansy-ride', ...carMark(SV, 'tansy-zero-turn') },
  ],
  props: [
    // One practical light: a lamp on a post over the apron, where Cam sweeps.
    { id: 'apron-lamp', prefab: 'garden-lamp-post', at: [-148.6, 66.4], yaw: 0 },
  ],
  steps: [
    // 1. Hook: the broom, slow, the same patch of apron, under the lamp.
    cut(shot('turncoat', 'ms', { height: 'low', side: 60 })),
    { do: 'sfx', id: 'tap', at: 'turncoat', gain: 0.4, async: true },
    { do: 'walk', who: 'turncoat', path: [[-145.8, 70.6], [-145.8, 68.2]], speed: 0.4, async: true },
    { do: 'wait', s: 2.4 },
    // 2. Tansy, wiping her hands, asks the one question that matters and reads the answer wrong.
    cut(TP.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Well? Did Lulu bite?' },
    cut(TP.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'She laughed at him.' },
    cut(TP.single('tansy', 'mcu')),
    { do: 'gesture', who: 'tansy', name: 'shrug', s: 1.0, async: true },
    { do: 'say', who: 'tansy', text: 'Lulu laughs at everybody. It means she likes him.' },
    cut(TP.single('player', 'mcu')),
    { do: 'sfx', id: 'cash', at: 'tansy', gain: 0.5, async: true },
    { do: 'wait', s: 0.8 },
    cut(TP.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Two hundred and fifty. Do not spend it on chrome.' },
    // 3. The button: he sweeps slower, and does not look up.
    cut(shot('turncoat', 'fs', { height: 'low', side: 60 })),
    { do: 'music', track: null, fade: 1.2 },
    { do: 'sfx', id: 'tap', at: 'turncoat', gain: 0.4 },
    beat('silence'),
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'sweepers-wages-intro': SWEEPERS_WAGES_INTRO,
  'sweepers-wages-mid': SWEEPERS_WAGES_MID,
  'sweepers-wages-outro': SWEEPERS_WAGES_OUTRO,
};
