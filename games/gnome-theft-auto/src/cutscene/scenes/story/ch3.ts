/// Chapter 3 opener: the betrayal at Side-Valve Salvage (re-directed in the Story B direction pass; notes in
// docs/design/gnome-theft-auto/direction/scenes/salvage-raid-intro.md). The rest of chapter 3 is in ch3b.ts (the basin
// and the cure) and ch3c.ts (the drift run and the chapter's close); every id is played by a quest in quests/chapter3.ts.
import type { Point, SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, reaction, shot } from '../../direct';
import { markOf, rideOf, up } from './kit';
import { CH3B_SCENES } from './ch3b';
import { CH3C_SCENES } from './ch3c';

const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

/** The HOA raid: two vans in the two lanes of the z = 60 road, westbound from past the Bodega corner to the apron. */
const RAID_VAN_1: Point[] = [[-30, 57.5], [-120, 57.5], [-150, 57.5]];
const RAID_VAN_2: Point[] = [[-30, 62.5], [-120, 62.5], [-156, 62.5]];
/** Vesper's pearl Lowrider comes in behind the vans and turns onto the apron. */
const VESPER_IN: Point[] = [[-110, 57.5], [-144, 57.5], [-144, 63.5]];
/** The getaway: back out to the road, west, then north up the x = -180 road. */
const VESPER_OUT: Point[] = [[-144, 57.5], [-177.5, 57.5], [-177.5, 20]];

const SR_PLAYER: Vec2 = [-146.4, 70.4];
const SR_TANSY: Vec2 = [-143.4, 72.6];
const SR_PIP_SEAT: Vec2 = [-135.5, 74];
/** Where Pip throws himself between the raider and the player. */
const SR_PIP_SHIELD: Vec2 = [-147.6, 68.6];
const SR_CAM: Vec2 = [-150.2, 64.6];
const SR_VESPER: Vec2 = [-147.6, 65.2];
const SR_RAIDER_SWING: Vec2 = [-148.9, 67.4];
/** Tansy's way out: west along the back of the apron, behind the workbench, into the alley (the Under-Deck drain). */
const SR_TANSY_OUT: Point[] = [[-150, 75.5], [-156.5, 78.2], [-166, 79]];
const JOHN = markOf('bodega-front', 'bodega');
/** Asphalt on her counter spot (as the prologue placed her), and the barometer insert that rhymes with it. */
const CAT_AT: Vec2 = [-78.4, 88.4];
const CAT_INSERT = { kind: 'cut' as const, pos: up(-76.4, 86.8, 0.75), look: up(-78.6, 88.2, 0.45), fov: 44 };

const SELL = coverage('tansy', 'cam', 1);

/**
 * Chapter 3 opener: the betrayal. Cold open at Bodega & Sons in the rain: two HOA vans scream west past the corner, and
 * John knows where west is. At the bay the music is gone as Turncoat Cam steps out of the first van, broom still in hand;
 * Tansy asks his price. Vesper glides in, takes the Golden Acorn himself, and gives the player the hat line's fourth rung,
 * unfinished. Then a raider swings at the player, Pip steps in, and the cut lands on his arm gone. Tansy raises her
 * voice for the first time, gives the player Pip, and runs; the pearl Lowrider leaves with the acorn under the title.
 */
export const SALVAGE_RAID_INTRO: SceneScript = {
  id: 'salvage-raid-intro',
  stage: { kind: 'world' },
  ambience: 'rain',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/salvage-raid-intro.md' },
  actors: [
    { id: 'player', player: true, at: SR_PLAYER, yaw: towards(SR_PLAYER, SR_CAM) },
    { id: 'tansy', preset: 'tansy', name: 'Tansy Clayfoot', at: SR_TANSY, yaw: towards(SR_TANSY, [-141, 70]), held: null },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: SR_PIP_SEAT, yaw: -Math.PI / 2 },
    { id: 'pip-hurt', preset: 'pip', name: 'Pip Potsworth', at: SR_PIP_SHIELD, yaw: towards(SR_PIP_SHIELD, SR_RAIDER_SWING), hidden: true, armless: true },
    { id: 'cam', name: 'Turncoat Cam', look: { hat: 0xf4f4f8, shirt: 0xc9b99b }, at: [0, 0], seatedIn: 'van1', seat: 1, held: 'broom' },
    { id: 'raider', name: 'HOA Raider', look: { hat: 0x18181e, shirt: 0xc9b99b }, at: [0, 0], seatedIn: 'van2', seat: 1 },
    { id: 'vesper', preset: 'vesper', name: 'Vesper Thorne', at: [0, 0], seatedIn: 'vesper-car', hidden: true },
    { id: 'john', preset: 'bodega', name: 'John Bodega', at: JOHN.at, yaw: JOHN.yaw },
  ],
  props: [{ id: 'cat', prefab: 'asphalt-cat', at: CAT_AT, yaw: towards(CAT_AT, JOHN.at), size: 0.55 }],
  vehicles: [
    { id: 'van1', kind: 'hoa-van', at: RAID_VAN_1[0], yaw: -Math.PI / 2, headlights: true },
    { id: 'van2', kind: 'hoa-van', at: RAID_VAN_2[0], yaw: -Math.PI / 2, headlights: true },
    { id: 'vesper-car', ...rideOf('vesper'), at: VESPER_IN[0], yaw: -Math.PI / 2, hidden: true, headlights: true },
    { id: 'tansy-ride', ...rideOf('tansy'), at: [-141, 70], yaw: Math.PI },
  ],
  steps: [
    // 1. Cold open, Bodega & Sons: sirens, and two vans flash west past the corner. The music is the rain.
    { do: 'cam', shot: { kind: 'cut', pos: up(-73, 79, 1.4), look: up(-58, 60, 1.2), fov: 50 } },
    { do: 'sfx', id: 'alarm', gain: 0.7 },
    { do: 'drive', vehicle: 'van1', path: RAID_VAN_1, speed: 12.5, async: true },
    { do: 'drive', vehicle: 'van2', path: RAID_VAN_2, speed: 12, async: true },
    { do: 'wait', s: 2.6 },
    // The barometer: sirens going past, and the cat does not move.
    cut(CAT_INSERT),
    { do: 'wait', s: 1.4 },
    // John watches them go. One line of commentary, then the line that turns it cold.
    cut(shot('john', 'mcu', { toward: 'cat', side: -30 })),
    { do: 'face', who: 'john', at: [-66, 62], s: 0.5 },
    { do: 'say', who: 'john', text: 'Sirens, heading west. Asphalt didn\'t even look up.' },
    beat('beat'),
    { do: 'say', who: 'john', text: '...Side-Valve\'s west.' },
    // 2. The bay: the headlights sweep in. Tansy stops work; Pip stands.
    cut(shot('tansy', 'mcu', { toward: 'player', side: 30 })),
    { do: 'face', who: 'tansy', at: [-150, 58], s: 0.6 },
    { do: 'sfx', id: 'skid', at: 'van1', gain: 0.8 },
    beat('pause'),
    cut({ kind: 'cut', pos: up(-137.4, 71.4, 1.2), look: 'pip', fov: 46 }),
    { do: 'gesture', who: 'pip', name: 'stand' },
    { do: 'face', who: 'pip', at: [-150, 58], s: 0.4 },
    beat('beat'),
    // 3. The betrayal: the door opens and the music is already gone. The broom is still in his hand.
    cut({ kind: 'cut', pos: up(-145.2, 63.6, 0.9), look: up(-150.2, 60.2, 1.0), fov: 42 }),
    { do: 'exit', who: 'cam' },
    { do: 'walk', who: 'cam', path: [SR_CAM], speed: 1.1, async: true },
    { do: 'wait', s: 2.2 },
    cut({ kind: 'cut', pos: up(-137.0, 72.0, 1.3), look: 'pip', fov: 34 }),
    { do: 'say', who: 'pip', text: '...Cam?' },
    { do: 'face', who: 'tansy', at: 'cam', s: 0.4 },
    { do: 'face', who: 'cam', at: 'tansy', s: 0.5 },
    cut(SELL.single('tansy', 'mcu')),
    beat('beat'),
    { do: 'say', who: 'tansy', text: 'How much?' },
    cut(SELL.single('cam', 'mcu')),
    { do: 'say', who: 'cam', text: 'A racing charter. Patio Heights.' },
    cut(SELL.single('tansy', 'cu')),
    beat('tiny'),
    { do: 'say', who: 'tansy', text: 'Cheap.' },
    // 4. Vesper. The pearl Lowrider nobody is driving glides in behind the vans; his theme, once.
    { do: 'spawn', id: 'vesper-car' },
    { do: 'spawn', id: 'vesper' },
    cut({ kind: 'track', pos: up(-152, 61, 0.8), who: 'vesper-car', fov: 46 }),
    { do: 'music', track: 'villain', fade: 0.8 },
    { do: 'stinger', id: 'villain' },
    { do: 'drive', vehicle: 'vesper-car', path: VESPER_IN, speed: 9 },
    cut({ kind: 'cut', pos: up(-139.6, 61.2, 0.7), look: 'vesper', fov: 40 }),
    { do: 'exit', who: 'vesper' },
    // Cam trades the broom for the acorn; Vesper takes it himself, the only thing he ever touches.
    cut(shot('vesper', 'ms', { toward: 'cam', side: -30, height: 'low' })),
    { do: 'walk', who: 'vesper', path: [SR_VESPER], speed: 1.3 },
    { do: 'face', who: 'vesper', at: 'cam', s: 0.5 },
    { do: 'face', who: 'cam', at: 'vesper', s: 0.4 },
    { do: 'hold', who: 'cam', prop: 'golden-acorn-seed-cell' },
    { do: 'give', from: 'cam', to: 'vesper', s: 1.4 },
    { do: 'say', who: 'vesper', text: 'Thank you, friend.' },
    ...reaction('cam', { toward: 'vesper', size: 'mcu', side: 30, hold: 'beat' }),
    // The fourth rung of the hat line: he no longer finishes it.
    { do: 'face', who: 'vesper', at: 'player', s: 0.8 },
    cut(shot('vesper', 'mcu', { toward: 'player', side: 15, height: 'low' })),
    beat('beat'),
    { do: 'say', who: 'vesper', text: 'Nice hat.' },
    beat('pause'),
    { do: 'say', who: 'vesper', text: 'Shame.' },
    { do: 'gesture', who: 'vesper', name: 'tipHat', s: 1.2 },
    ...reaction('player', { toward: 'vesper', gesture: 'crossArms', size: 'mcu', side: -20, hold: 'beat' }),
    // 5. The raid turns: the raider goes for the player and Pip gets there first. The cut lands on the arm.
    { do: 'music', track: 'chase', fade: 0.4 },
    { do: 'enter', who: 'vesper', vehicle: 'vesper-car', async: true },
    { do: 'walk', who: 'pip', path: [[-139, 72.4]], run: true, async: true },
    { do: 'exit', who: 'raider' },
    cut(shot('pip', 'ms', { toward: 'player', side: 50, handheld: 0.04 })),
    { do: 'walk', who: 'raider', path: [[-152.5, 65], SR_RAIDER_SWING], run: true, async: true },
    { do: 'walk', who: 'pip', path: [[-144.2, 72.1], SR_PIP_SHIELD], run: true },
    { do: 'face', who: 'pip', at: 'raider', s: 0.2 },
    { do: 'gesture', who: 'raider', name: 'handsUp', s: 0.5 },
    { do: 'sfx', id: 'glass', gain: 0.9 },
    { do: 'despawn', id: 'pip' },
    { do: 'spawn', id: 'pip-hurt' },
    { do: 'music', track: null, fade: 0.2 },
    { do: 'shake', amp: 0.2, s: 0.5 },
    cut(shot('pip-hurt', 'mcu', { toward: 'player', side: 35 })),
    { do: 'gesture', who: 'pip-hurt', name: 'clutch', s: 3.2, async: true },
    beat('silence'),
    // 6. Tansy raises her voice for the first time in the game.
    { do: 'face', who: 'tansy', at: 'pip-hurt', s: 0.3 },
    cut(shot('tansy', 'cu', { toward: 'pip-hurt', side: 25 })),
    { do: 'say', who: 'tansy', text: 'PIP!' },
    { do: 'face', who: 'pip-hurt', at: 'tansy', s: 0.3 },
    cut(shot('pip-hurt', 'cu', { toward: 'tansy', side: -25 })),
    beat('tiny'),
    { do: 'say', who: 'pip-hurt', text: '...That was my good arm.' },
    { do: 'face', who: 'tansy', at: 'player', s: 0.3 },
    cut(shot('tansy', 'mcu', { toward: 'player', side: 30, handheld: 0.03 })),
    { do: 'music', track: 'chase', fade: 0.3 },
    { do: 'say', who: 'tansy', text: 'Get him out. Go north. I\'ll draw them off.' },
    // She goes, on camera, out the back; the raider takes the bait.
    cut(shot('tansy', 'fs', { toward: 'player', side: 70 })),
    { do: 'walk', who: 'tansy', path: SR_TANSY_OUT, run: true, async: true },
    { do: 'wait', s: 0.6 },
    { do: 'walk', who: 'raider', path: [[-152, 72], [-158, 78.6]], run: true, async: true },
    { do: 'wait', s: 1.6 },
    // 7. The button: the pearl Lowrider leaves with the acorn, nobody at the wheel, under the chapter title.
    cut({ kind: 'track', pos: up(-186, 63, 1.1), who: 'vesper-car', fov: 44 }),
    { do: 'music', track: 'villain', fade: 0.8 },
    { do: 'drive', vehicle: 'vesper-car', path: VESPER_OUT, speed: 8, arrive: false, async: true },
    { do: 'wait', s: 1.6 },
    { do: 'stinger', id: 'chapter' },
    { do: 'title', text: 'CHAPTER 3 — COLD CLAY' },
    { do: 'wait', s: 3 },
    { do: 'title', text: null },
  ],
};

export const CH3_SCENES: Record<string, SceneScript> = {
  'salvage-raid-intro': SALVAGE_RAID_INTRO,
  ...CH3B_SCENES,
  ...CH3C_SCENES,
};
