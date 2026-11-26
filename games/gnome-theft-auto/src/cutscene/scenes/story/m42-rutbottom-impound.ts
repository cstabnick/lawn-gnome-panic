// Story row 42: Rutbottom Impound. Two scenes at the Rutbottom Dirt Bowl (rutbottom/spots.ts). The intro (golden hour): Lulu at the
// impound pen with six Carburettor lowriders wrapped in beige HOA tape, Marshal Clary Mudguard, who explains the bowl rule
// in a flat bark (her first card), and three HOA riders standing beside beige dirt bikes like a funeral party. The outro (night):
// Clary lifts a green flag at her tower and the Carburettors roll out in a column with their lights on, Lulu leading;
// Clary hands the player the dirt bike's keys.
// Notes: docs/design/gnome-theft-auto/direction/scenes/m42-rutbottom-impound-{intro,outro}.md
import type { SceneScript, ScriptVehicle, Vec2 } from '../../script';
import { beat, coverage, cut, shot } from '../../direct';
import { markOf, up } from './kit';

const PEN = 'bowl-impound';
const TOWER = 'rutbottom-tower';
const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

/** The Carburettors' paint, one per ride: Lulu's orange, then the rest of the crew. */
const TINTS = [0xff6a00, 0x8e44ad, 0xd8342c, 0x2a6fdb, 0xf2c12e, 0x2f9e5a];
const HOA = { hat: 0x18181e, shirt: 0xc9b99b };

// ---- Intro: the pen (golden hour) -----------------------------------------------------------------------------------------

const I_LULU = markOf(PEN, 'lulu');
const I_PLAYER = markOf(PEN, 'player');
const I_CLARY: Vec2 = [1014.4, -667.8];
const I_RIDES = [[1013, -680], [1021, -680], [1029, -680], [1013, -690], [1021, -690], [1029, -690]] as const;
const I_RIDERS: Vec2[] = [[1031, -661.5], [1031, -665], [1031, -668.5]];
const LC = coverage('lulu', 'clary', -1);
const PC = coverage('player', 'clary', 1);

export const RUTBOTTOM_IMPOUND_INTRO: SceneScript = {
  id: 'm42-rutbottom-impound-intro',
  stage: { kind: 'world' },
  music: 'sandpit',
  ambience: 'wind',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m42-rutbottom-impound-intro.md', kind: 'intro' },
  title: 'Rutbottom Impound',
  actors: [
    { id: 'player', player: true, at: I_PLAYER.at, yaw: towards(I_PLAYER.at, I_LULU.at) },
    { id: 'lulu', preset: 'lugnut lulu', name: 'Lugnut Lulu', at: I_LULU.at, yaw: towards(I_LULU.at, [1021, -685]), held: null },
    { id: 'clary', preset: 'clary', name: 'Marshal Clary Mudguard', at: I_CLARY, yaw: towards(I_CLARY, I_LULU.at) },
    { id: 'hemline', name: 'Deputy Hemline', look: HOA, at: I_RIDERS[0], yaw: Math.PI / 2, held: 'hoa-clipboard' },
    { id: 'gusset', name: 'Cadet Gusset', look: HOA, at: I_RIDERS[1], yaw: Math.PI / 2, held: 'hoa-clipboard' },
    { id: 'tolliver', name: 'Rider Tolliver', look: HOA, at: I_RIDERS[2], yaw: Math.PI / 2, held: 'hoa-clipboard' },
  ],
  vehicles: [
    // L95: six Carburettor rides wrapped in beige HOA tape (bunting strung over them), and three beige dirt bikes in a row.
    ...I_RIDES.map((at, i): ScriptVehicle => ({ id: `ride-${i + 1}`, kind: 'lowrider', at: [at[0], at[1]], yaw: Math.PI / 2, tint: TINTS[i] })),
    ...I_RIDERS.map((at, i): ScriptVehicle => ({ id: `hoa-bike-${i + 1}`, kind: 'dirt-bike', at: [at[0] + 2.4, at[1]], yaw: Math.PI / 2, tint: 0xc9b99b })),
  ],
  props: [
    { id: 'tape-a', prefab: 'bunting-span', at: [1021, -685], yaw: Math.PI / 2, size: 22 },
    { id: 'pen-a', prefab: 'chain-link-fence', at: [1007, -676], yaw: Math.PI / 2 },
    { id: 'notice-a', prefab: 'hoa-clipboard', at: up(1013, -680, 1.1), yaw: 0.4, size: 0.5 },
    { id: 'notice-b', prefab: 'hoa-clipboard', at: up(1029, -690, 1.1), yaw: 2.2, size: 0.5 },
  ],
  steps: [
    // 1. Hook: low along the fence, the pen in gold dust, beige tape fluttering over six wrapped rides.
    { do: 'cam', shot: { kind: 'dolly', from: up(1006, -664, 0.8), to: up(1009, -669, 1.2), look: up(1021, -685, 0.9), s: 3.8, fov: 52 } },
    { do: 'sfx', id: 'flutter', at: up(1021, -685, 1.5), gain: 0.5, async: true },
    { do: 'sfx', id: 'engine-rev', at: up(1130, -540, 1), gain: 0.25, async: true },
    { do: 'wait', s: 3.8 },
    // 2. Lulu, hand flat on a taped bonnet, deadpan for once.
    { do: 'face', who: 'lulu', at: 'player', s: 0.3, async: true },
    cut(LC.single('lulu', 'mcu')),
    { do: 'say', who: 'lulu', text: 'Six of ours. Taped up like parcels. Beige tape, as if beige were a colour.' },
    cut(PC.single('player', 'mcu')),
    { do: 'say', who: 'player', text: "Just cut it off?" },
    { do: 'face', who: 'lulu', at: 'clary', s: 0.3, async: true },
    cut(LC.single('lulu', 'mcu')),
    { do: 'say', who: 'lulu', text: "The tape is not the lock. The yard is Clary's, and Clary goes by the book." },
    // 3. Clary, bored bark; the first card lands after her first line.
    cut(LC.single('clary', 'mcu')),
    { do: 'gesture', who: 'clary', name: 'shrug', s: 1, async: true },
    { do: 'say', who: 'clary', text: 'Bowl rule four. A held entry goes free when beaten.' },
    { do: 'intro', who: 'clary' },
    cut(LC.single('lulu', 'mcu')),
    { do: 'gesture', who: 'lulu', name: 'crossArms', s: 1, async: true },
    beat('pause'),
    cut(LC.single('clary', 'mcu')),
    { do: 'say', who: 'clary', text: 'HOA entered three riders. Beat them. Three laps. Go on, then.' },
    // 4. The turn: Lulu cannot, which is the joke; the player can, which is the job.
    { do: 'face', who: 'lulu', at: 'clary', s: 0.3, async: true },
    cut(LC.single('lulu', 'mcu')),
    { do: 'say', who: 'lulu', text: 'I would beat them blind. She calls that a conflict of interest.' },
    cut(LC.single('clary', 'mcu')),
    { do: 'say', who: 'clary', text: 'It is one. Dirt bike on the grid. The berm remembers.' },
    cut(PC.single('player', 'mcu')),
    { do: 'say', who: 'player', text: "I'll take the bike." },
    // 5. Button: three clipboards come up as one. The HOA riders have been there the whole time.
    { do: 'face', who: 'hemline', at: 'player', s: 0.3, async: true },
    cut(shot('hemline', 'ms', { toward: 'player', side: 30 })),
    { do: 'sfx', id: 'paper', at: 'hemline', gain: 0.5, async: true },
    { do: 'say', who: 'hemline', text: 'Enthusiasm is discouraged on the oval.' },
    { do: 'sfx', id: 'bell', gain: 0.3, async: true },
    beat('pause'),
  ],
};

// ---- Outro: the column (night) -----------------------------------------------------------------------------------------

const O_CLARY = markOf(TOWER, 'clary');
const O_PLAYER = markOf(TOWER, 'player');
/** The column of six rolls west along the start/finish straight, lead first, 11 m between rides. */
const COLUMN = [0, 1, 2, 3, 4, 5].map((i) => ({ id: `ride-${i + 1}`, start: [1152 + i * 11, -546] as Vec2, tint: TINTS[i] }));
const CP = coverage('clary', 'player', 1);

export const RUTBOTTOM_IMPOUND_OUTRO: SceneScript = {
  id: 'm42-rutbottom-impound-outro',
  stage: { kind: 'world' },
  music: 'warm',
  ambience: 'night',
  sky: 'night',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m42-rutbottom-impound-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, at: O_PLAYER.at, yaw: towards(O_PLAYER.at, O_CLARY.at) },
    { id: 'clary', preset: 'clary', name: 'Marshal Clary Mudguard', at: O_CLARY.at, yaw: towards(O_CLARY.at, [1116, -545]) },
    { id: 'lulu', preset: 'lugnut lulu', name: 'Lugnut Lulu', at: COLUMN[0].start, yaw: -Math.PI / 2, seatedIn: 'ride-1' },
  ],
  vehicles: COLUMN.map((c): ScriptVehicle => ({ id: c.id, kind: 'lowrider', at: c.start, yaw: -Math.PI / 2, tint: c.tint, headlights: true })),
  props: [
    // L95: the tower's two lamps, lit, and a green flag leaning on its post: the whole scene is lit by the column.
    { id: 'lamp-a', prefab: 'lamp', at: [1110, -527], yaw: 0 },
    { id: 'lamp-b', prefab: 'lamp', at: [1123, -527], yaw: 0 },
  ],
  steps: [
    // 1. Hook: night at the tower, lamps lit, the column of headlights idling east of it. A bell at the flag.
    { do: 'cam', shot: { kind: 'dolly', from: up(1104, -531, 1.4), to: up(1108, -532, 1.7), look: 'clary', s: 3.2, fov: 44 } },
    { do: 'sfx', id: 'bell', at: 'clary', gain: 0.6, async: true },
    { do: 'wait', s: 1.6 },
    cut(shot('clary', 'ms', { toward: 'player', side: 30 })),
    { do: 'gesture', who: 'clary', name: 'point', s: 1.4, async: true },
    { do: 'sfx', id: 'whistle', at: 'clary', gain: 0.5, async: true },
    { do: 'say', who: 'clary', text: 'Carburettors. Single file. Go on, then.' },
    // 2. The green flag drops, and the column rolls: six rides, six sets of headlights, one engine note.
    ...COLUMN.map((c) => ({ do: 'drive' as const, vehicle: c.id, path: [c.start, [1070, -546.5] as Vec2], speed: 6.5, async: true })),
    { do: 'sfx', id: 'engine-rev', at: 'ride-1', gain: 0.7, async: true },
    { do: 'cam', shot: { kind: 'track', pos: up(1112, -535, 1.6), who: 'ride-1', fov: 46 } },
    { do: 'wait', s: 3.6 },
    // 3. The lead passes the tower: Lulu, window down, lit by her own dash.
    { do: 'horn', vehicle: 'ride-1' },
    { do: 'sfx', id: 'whoosh', at: 'ride-1', gain: 0.5, async: true },
    cut(shot('lulu', 'mcu', { side: 70 })),
    { do: 'say', who: 'lulu', text: 'Clary! Worst marshal in Rutbottom!' },
    cut(CP.single('clary', 'mcu')),
    { do: 'say', who: 'clary', text: 'Best one you have.' },
    { do: 'wait', s: 0.8 },
    // 4. The column goes by; the sincere-ish beat: Clary has never wanted to win, and she is glad of it.
    { do: 'cam', shot: { kind: 'track', pos: up(1130, -534, 2.4), who: 'ride-3', fov: 50 } },
    { do: 'wait', s: 2.6 },
    // 5. The keys. A marshal, not a prizegiver: she says it as a rule.
    cut(CP.single('clary', 'mcu')),
    { do: 'give', from: 'clary', to: 'player', prop: 'brass-key', s: 0.9 },
    { do: 'sfx', id: 'keys', at: 'clary', gain: 0.5, async: true },
    { do: 'say', who: 'clary', text: 'Dirt bike. Yours. Banks stay banked. The berm remembers.' },
    cut(CP.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Thanks, Clary.' },
    cut(shot('clary', 'ms', { toward: 'player', side: 25 })),
    { do: 'gesture', who: 'clary', name: 'nod', s: 1, async: true },
    { do: 'say', who: 'clary', text: 'Go on, then.' },
    { do: 'sfx', id: 'bell', at: 'clary', gain: 0.4, async: true },
    { do: 'wait', s: 1.2 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm42-rutbottom-impound-intro': RUTBOTTOM_IMPOUND_INTRO,
  'm42-rutbottom-impound-outro': RUTBOTTOM_IMPOUND_OUTRO,
};
