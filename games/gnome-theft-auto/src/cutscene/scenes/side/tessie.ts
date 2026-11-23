// The Loch Moss Monster (Tessie): a nature documentary on the water. Golden hour, the water bed, the camera low on the
// surface and patient: the picture first (a ripple, a shell breaking the water), then a face reacting to it, then a word.
// Driftwood speaks low and is cut short; his one great line stays. The loch is water: every camera over it sits at the
// surface (surf), not on the ground. Staged at loch-dock and tessie-nest (quests/stages/east.ts). Director's notes:
// docs/design/gnome-theft-auto/direction/scenes/sq-tessie-*.md.
import { TESSIE } from '../../../config';
import { beat, coverage, cut, shot } from '../../direct';
import type { SceneScript, Vec3 } from '../../script';
import { above, castRide, markOf } from './kit';

/** Loch Moss's still water surface (config.ts: level about -0.65). Cameras and ripples over the loch sit on it. */
const WATER = -0.65;
function surf(x: number, z: number, h = 0): Vec3 {
  return [x, WATER + h, z];
}

const notes = (id: string): { notes: string } => ({ notes: `docs/design/gnome-theft-auto/direction/scenes/${id}.md` });
const DRIFT_DOCK = markOf('loch-dock', 'driftwood');
const PLAYER_DOCK = markOf('loch-dock', 'player');
const REPORTER = markOf('loch-dock', 'tattler-reporter');
const TATTLER_LOOK = { hat: 0xf2c230, shirt: 0x3a3a3a };
/** Where something big turns over, close enough to the dock to see from the shore. */
const GLIMPSE: [number, number] = [-703, -612];
const DOCK = coverage('driftwood', 'you', 1, 65);
/** The cyan ring's two-hander, from the water side (the bank rises behind the player). */
const SHORE = coverage('driftwood', 'you', -1, 40);

// Intro: a ripple going the wrong way, a shell breaks the water and is gone; Driftwood, who has seen it before, names
// her; the HOA patrol crosses the loch; the job.
export const TESSIE_INTRO: SceneScript = {
  id: 'sq-tessie-intro',
  direction: notes('sq-tessie-intro'),
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  title: 'The Loch Moss Monster',
  ambience: 'water',
  actors: [
    { id: 'you', player: true, at: PLAYER_DOCK.at, yaw: PLAYER_DOCK.yaw },
    { id: 'driftwood', preset: 'driftwood', at: DRIFT_DOCK.at, yaw: DRIFT_DOCK.yaw, held: 'loch-binoculars' },
  ],
  vehicles: [
    castRide('driftwood', 'dinghy'),
    { id: 'tessie', kind: 'tessie', at: GLIMPSE, yaw: 2.6, hidden: true },
    { id: 'patrol', kind: 'hoa-patrol-boat', at: [-694, -626], yaw: 2.0 },
  ],
  steps: [
    // 1. Hook: low on the water, a ripple against the wind. No music: the loch and nothing else.
    { do: 'cam', shot: { kind: 'cut', pos: surf(-716, -578, 0.8), look: surf(GLIMPSE[0], GLIMPSE[1], 0.3), fov: 38 } },
    { do: 'sfx', id: 'splash', at: surf(GLIMPSE[0], GLIMPSE[1]), gain: 0.5 },
    { do: 'wait', s: 2.2 },
    // 2. Driftwood on the shore, binoculars up, facing the water; the player behind him.
    cut(shot('driftwood', 'ms', { side: 28 })),
    { do: 'gesture', who: 'driftwood', name: 'lean', s: 1.6, async: true },
    { do: 'wait', s: 1.1 },
    cut(DOCK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'What are you looking at?' },
    cut(shot('driftwood', 'mcu', { side: 28 })),
    { do: 'say', who: 'driftwood', text: 'Hush. The loch is thinking. It\'s rude to interrupt.' },
    // 3. The glimpse: picture first. A shell breaks the surface and rolls under.
    { do: 'cam', shot: { kind: 'track', pos: surf(-716, -578, 0.8), who: 'tessie', fov: 34 } },
    { do: 'spawn', id: 'tessie', at: GLIMPSE, yaw: 2.6 },
    { do: 'sfx', id: 'splash', at: 'tessie' },
    { do: 'stinger', id: 'reveal', async: true },
    { do: 'drive', vehicle: 'tessie', path: [GLIMPSE, [-696, -626], [-690, -640]], speed: 2.2, depart: false, arrive: false, async: true },
    { do: 'wait', s: 2.6 },
    { do: 'despawn', id: 'tessie' },
    { do: 'sfx', id: 'splash', at: surf(-692, -634), gain: 0.7 },
    cut(shot('driftwood', 'mcu', { side: 28 })),
    { do: 'gesture', who: 'driftwood', name: 'point', s: 1.2, async: true },
    { do: 'say', who: 'driftwood', text: 'There. Did you see her?' },
    cut(DOCK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'See who?' },
    // 4. He turns round for the first time: the name, close, then the music finds her.
    { do: 'face', who: 'driftwood', at: 'you', s: 0.6 },
    cut(DOCK.single('driftwood', 'cu')),
    { do: 'say', who: 'driftwood', text: 'Tessie.' },
    { do: 'music', track: 'mystery', fade: 1.6 },
    beat('pause'),
    // 5. The turn: the HOA patrol boat crosses where she went down.
    { do: 'cam', shot: { kind: 'track', pos: surf(-713, -579, 1.2), who: 'patrol', fov: 36 } },
    { do: 'sfx', id: 'engine-rev', at: 'patrol', gain: 0.6, async: true },
    { do: 'drive', vehicle: 'patrol', path: [[-694, -626], [-676, -640], [-656, -652]], speed: 5, depart: false, arrive: false, async: true },
    { do: 'wait', s: 2.4 },
    cut(DOCK.single('driftwood', 'mcu')),
    { do: 'say', who: 'driftwood', text: 'HOA patrol. They want her loch drained for eighteen holes of golf.' },
    cut(DOCK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Golf.' },
    // 6. Why he believes: the canal, and his one great line.
    cut(DOCK.single('driftwood', 'mcu')),
    { do: 'say', who: 'driftwood', text: 'Since my raft reached the canal, she sings through my hull.' },
    cut(DOCK.single('driftwood', 'cu')),
    { do: 'say', who: 'driftwood', text: 'Low. Like a foghorn that\'s read a book.' },
    cut(DOCK.single('you', 'mcu')),
    { do: 'gesture', who: 'you', name: 'nod', s: 1.0 },
    // 7. The job, in his own words.
    cut(DOCK.single('driftwood', 'mcu')),
    { do: 'say', who: 'driftwood', text: 'Take a boat. Follow her ripples. Bring me proof, not a blurry one.' },
    cut(DOCK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'And the HOA?' },
    cut(DOCK.single('driftwood', 'mcu')),
    { do: 'say', who: 'driftwood', text: 'Drop four sonar buoys while they look the other way.' },
    // 8. Button: he turns back to the water, binoculars up. Far out, something rolls over once.
    { do: 'face', who: 'driftwood', at: [-713, -590], s: 0.6, async: true },
    { do: 'cam', shot: { kind: 'cut', pos: surf(-717, -575, 1.1), look: 'driftwood', fov: 40 } },
    { do: 'gesture', who: 'driftwood', name: 'lean', s: 1.6, async: true },
    beat('beat'),
    { do: 'sfx', id: 'splash', at: surf(-690, -640), gain: 0.4 },
    { do: 'stinger', id: 'mystery' },
    beat('pause'),
  ],
};

// Beat (mid-quest, the player has dropped the fourth buoy): the dredger coughs into life, Tessie surfaces by the island,
// and the reason she is here is lying on its east slope.
export const TESSIE_EGGS: SceneScript = {
  id: 'sq-tessie-eggs',
  direction: notes('sq-tessie-eggs'),
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  ambience: 'water',
  actors: [
    { id: 'you', player: true, at: [-716, -690], yaw: 0, seatedIn: 'boat' },
  ],
  vehicles: [
    { id: 'boat', kind: 'walnut-dinghy', from: 'player', at: [-716, -690], yaw: Math.PI / 2 },
    { id: 'tessie', kind: 'tessie', at: [-730, -700], yaw: 0.6, hidden: true },
    { id: 'dredger', kind: 'hoa-patrol-boat', at: TESSIE.dredgerStart, yaw: -Math.PI / 2 },
  ],
  steps: [
    // 1. Hook: a dredger engine coughs out in the reeds.
    { do: 'cam', shot: { kind: 'track', pos: surf(-704, -686, 1.0), who: 'dredger', fov: 30 } },
    { do: 'sfx', id: 'engine-rev', at: 'dredger' },
    { do: 'drive', vehicle: 'dredger', path: [TESSIE.dredgerStart, [-662, -692]], speed: 1.4, arrive: false, async: true },
    { do: 'wait', s: 2.0 },
    cut(shot('you', 'mcu', { side: 30 })),
    { do: 'wait', s: 1.1 },
    // 2. The reveal, low and slow: she comes up beside the boat.
    { do: 'cam', shot: { kind: 'track', pos: surf(-712, -683, 0.9), who: 'tessie', fov: 44 } },
    { do: 'spawn', id: 'tessie', at: [-730, -700], yaw: 0.6 },
    { do: 'sfx', id: 'splash', at: 'tessie' },
    { do: 'music', track: 'mystery', fade: 1.2 },
    { do: 'stinger', id: 'reveal', async: true },
    { do: 'drive', vehicle: 'tessie', path: [[-730, -700], [-726, -705]], speed: 0.8, depart: false, arrive: false, async: true },
    { do: 'wait', s: 2.8 },
    cut(shot('you', 'mcu', { side: 30 })),
    { do: 'say', who: 'you', text: 'That is not a rock.' },
    // 3. The insert: why she is here.
    { do: 'cam', shot: { kind: 'cut', pos: above(-740, -711, 0.9), look: above(-746, -713, 0.3), fov: 40 } },
    beat('pause'),
    cut(shot('you', 'mcu', { side: 30 })),
    { do: 'say', who: 'you', text: 'Eggs.' },
    // 4. The turn: the dredger, closer, and louder.
    { do: 'cam', shot: { kind: 'track', pos: surf(-704, -686, 1.0), who: 'dredger', fov: 30 } },
    { do: 'music', track: 'tension', fade: 0.5 },
    { do: 'sfx', id: 'engine-rev', at: 'dredger' },
    { do: 'stinger', id: 'danger', async: true },
    { do: 'wait', s: 1.6 },
    cut(shot('you', 'mcu', { side: 30 })),
    { do: 'say', who: 'you', text: 'Eggs first. Then the dredger.' },
    // 5. Button: she goes under, towards the island.
    { do: 'cam', shot: { kind: 'track', pos: surf(-714, -680, 1.2), who: 'tessie', fov: 46 } },
    { do: 'drive', vehicle: 'tessie', path: [[-726, -705], [-740, -698], [-746, -688]], speed: 3.4, depart: false, arrive: false },
    { do: 'sfx', id: 'splash', at: 'tessie' },
    { do: 'despawn', id: 'tessie' },
    beat('beat'),
  ],
};

// Beat (mid-quest, the player has ridden Tessie back to the dock): she glides in with the player on her back; Driftwood
// lowers his binoculars; the Tattler's photographer steps up with an offer; the choice, and her, waiting.
export const TESSIE_SHORE: SceneScript = {
  id: 'sq-tessie-shore',
  direction: notes('sq-tessie-shore'),
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  music: 'mystery',
  ambience: 'water',
  actors: [
    { id: 'you', player: true, at: TESSIE.rideTo, yaw: 0, seatedIn: 'tessie' },
    { id: 'driftwood', preset: 'driftwood', at: DRIFT_DOCK.at, yaw: DRIFT_DOCK.yaw, held: 'loch-binoculars' },
    { id: 'tattler', name: 'Turfton Tattler', look: TATTLER_LOOK, at: REPORTER.at, yaw: REPORTER.yaw, held: 'field-camera' },
  ],
  vehicles: [
    { id: 'tessie', kind: 'tessie', from: 'player', at: [-710, -608], yaw: -0.1 },
  ],
  steps: [
    // 1. Hook: low on the water, she glides in to the dock with the player aboard. Awe: low, slow, held.
    { do: 'cam', shot: { kind: 'track', pos: surf(-719, -577, 0.8), who: 'tessie', fov: 44 } },
    { do: 'sfx', id: 'splash', at: 'tessie', gain: 0.5, async: true },
    { do: 'drive', vehicle: 'tessie', path: [[-710, -608], [-712, -598], [-713, -590]], speed: 2, depart: false },
    beat('beat'),
    // 2. Driftwood lowers the binoculars.
    { do: 'face', who: 'driftwood', at: 'you', s: 0.4, async: true },
    cut(shot('driftwood', 'mcu', { toward: 'you', side: 25 })),
    { do: 'say', who: 'driftwood', text: 'You rode her. All the way in.' },
    cut(shot('driftwood', 'cu', { toward: 'you', side: 25 })),
    { do: 'say', who: 'driftwood', text: 'Nobody is ever going to believe you.' },
    // 3. The turn: a shutter clicks. The Tattler has been in the reeds the whole time.
    { do: 'sfx', id: 'cash', at: 'tattler' },
    { do: 'face', who: 'tattler', at: 'you', s: 0.3, async: true },
    cut(shot('tattler', 'mcu', { toward: 'you', side: -25 })),
    { do: 'gesture', who: 'tattler', name: 'point', s: 1.1, async: true },
    { do: 'say', who: 'tattler', text: 'Fifteen hundred acorns. One photo. Front page.' },
    cut(shot('driftwood', 'mcu', { toward: 'you', side: 25 })),
    { do: 'say', who: 'driftwood', text: 'Gold ring pays. And nobody reads the Tattler.' },
    cut(shot('driftwood', 'cu', { toward: 'you', side: 25 })),
    { do: 'say', who: 'driftwood', text: 'Cyan ring keeps her. Just her, and the loch.' },
    { do: 'cam', shot: { kind: 'cut', pos: surf(-719, -585, 1.5), look: 'you', fov: 34 } },
    beat('pause'),
    // 4. Button: her, low and still on the water, waiting to see what you do.
    { do: 'cam', shot: { kind: 'cut', pos: surf(-706, -584, 0.7), look: 'tessie', fov: 40 } },
    { do: 'sfx', id: 'splash', at: 'tessie', gain: 0.3 },
    beat('pause'),
  ],
};

// Ending A (gold ring): the flash, the photographer runs, Tessie dives, Driftwood sighs.
export const TESSIE_TABLOID: SceneScript = {
  id: 'sq-tessie-tabloid',
  direction: notes('sq-tessie-tabloid'),
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  ambience: 'water',
  actors: [
    { id: 'you', player: true, at: TESSIE.tabloidAt, yaw: Math.atan2(REPORTER.at[0] - TESSIE.tabloidAt[0], REPORTER.at[1] - TESSIE.tabloidAt[1]) },
    { id: 'driftwood', preset: 'driftwood', at: DRIFT_DOCK.at, yaw: DRIFT_DOCK.yaw, held: 'loch-binoculars' },
    { id: 'tattler', name: 'Turfton Tattler', look: TATTLER_LOOK, at: REPORTER.at, yaw: Math.atan2(TESSIE.tabloidAt[0] - REPORTER.at[0], TESSIE.tabloidAt[1] - REPORTER.at[1]), held: 'field-camera' },
  ],
  vehicles: [
    { id: 'tessie', kind: 'tessie', at: TESSIE.rideTo, yaw: 0 },
  ],
  steps: [
    // 1. Hook: the camera comes up at once.
    cut(shot('tattler', 'mcu', { toward: 'you', side: 25 })),
    { do: 'gesture', who: 'tattler', name: 'handsUp', s: 1.2, async: true },
    { do: 'say', who: 'tattler', text: 'Hold still. Look like you\'ve just seen something big.' },
    cut(shot('you', 'mcu', { toward: 'tattler', side: -25 })),
    beat('beat'),
    // 2. The flash.
    { do: 'sfx', id: 'cash', at: 'tattler' },
    { do: 'fade', to: 1, s: 0.08 },
    { do: 'fade', to: 0, s: 0.4 },
    // 3. He runs with it, facing a camera that backs away in front of him.
    { do: 'walk', who: 'tattler', path: [[-700, -532], [-712, -506]], speed: 4, run: true, async: true },
    cut(shot('tattler', 'ms', { side: 15 })),
    { do: 'say', who: 'tattler', text: 'Front page! Front page!', stinger: 'comic' },
    // 4. Behind them all, Tessie goes under.
    { do: 'cam', shot: { kind: 'track', pos: above(-704, -557, 1.8), who: 'tessie', fov: 40 } },
    { do: 'music', track: 'sad', fade: 1.0 },
    { do: 'drive', vehicle: 'tessie', path: [TESSIE.rideTo, [-715, -602]], speed: 3, arrive: false, async: true },
    { do: 'wait', s: 2.2 },
    { do: 'sfx', id: 'splash', at: 'tessie' },
    { do: 'despawn', id: 'tessie' },
    beat('beat'),
    // 5. Button: Driftwood, the only one still looking at the water.
    cut(shot('driftwood', 'mcu', { toward: 'you', side: 25 })),
    { do: 'gesture', who: 'driftwood', name: 'shrug', s: 1.4, async: true },
    { do: 'say', who: 'driftwood', text: 'Nobody believes the Tattler. That\'s the one mercy.' },
    beat('beat'),
  ],
};

// Ending B (cyan ring): Driftwood nods; Tessie rolls once in the shallows and is gone; a piece of her shell.
export const TESSIE_SECRET: SceneScript = {
  id: 'sq-tessie-secret',
  direction: notes('sq-tessie-secret'),
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  ambience: 'water',
  actors: [
    { id: 'you', player: true, at: TESSIE.secretAt, yaw: Math.PI * 0.6 },
    { id: 'driftwood', preset: 'driftwood', at: [-736, -556], yaw: -Math.PI * 0.4, held: null },
  ],
  vehicles: [
    { id: 'tessie', kind: 'tessie', at: [-738, -580], yaw: 0, hidden: true },
  ],
  steps: [
    // 1. Hook: he nods before he speaks. No music: a quiet one.
    cut(SHORE.single('driftwood', 'mcu')),
    { do: 'gesture', who: 'driftwood', name: 'nod', s: 1.0 },
    { do: 'say', who: 'driftwood', text: 'You kept her. Good.' },
    cut(SHORE.single('you', 'mcu')),
    { do: 'wait', s: 1.1 },
    cut(SHORE.single('driftwood', 'mcu')),
    { do: 'say', who: 'driftwood', text: 'The Tattler would have sold her for a pie.' },
    cut(SHORE.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'For a pie?' },
    // 2. She rolls once in the shallows: low, slow, held. The music finds her.
    { do: 'cam', shot: { kind: 'track', pos: surf(-732, -567, 0.8), who: 'tessie', fov: 42 } },
    { do: 'spawn', id: 'tessie', at: [-738, -580], yaw: 0 },
    { do: 'sfx', id: 'splash', at: 'tessie', gain: 0.7 },
    { do: 'music', track: 'warm', fade: 2 },
    { do: 'drive', vehicle: 'tessie', path: [[-738, -580], [-746, -590], [-742, -598]], speed: 2.6, depart: false, arrive: false },
    { do: 'sfx', id: 'splash', at: 'tessie' },
    { do: 'despawn', id: 'tessie' },
    beat('silence'),
    // 3. The gift: a cast-off piece of her shell.
    { do: 'hold', who: 'driftwood', prop: 'turtle-shell-pack' },
    cut(shot('driftwood', 'ms', { toward: 'you', side: -30 })),
    { do: 'give', from: 'driftwood', to: 'you', prop: 'turtle-shell-pack', s: 1.5 },
    cut(SHORE.single('driftwood', 'mcu')),
    { do: 'say', who: 'driftwood', text: 'A piece of her. She sheds.' },
    // 4. Button: the castaway's one line about himself.
    cut(SHORE.single('driftwood', 'cu')),
    { do: 'say', who: 'driftwood', text: 'Only thing that\'s ever kept me dry.' },
    beat('beat'),
  ],
};

export const TESSIE_SCENES: SceneScript[] = [TESSIE_INTRO, TESSIE_EGGS, TESSIE_SHORE, TESSIE_TABLOID, TESSIE_SECRET];
