// The Loch Moss Monster (Tessie): a nature documentary on the water. Golden hour, the water and wind beds, slow crane
// shots over the loch, long holds on ripples, Driftwood speaks low. The loch is water: every camera over it sits at the
// surface (surf), not on the ground. Staged at loch-dock and tessie-nest (quests/stages/east.ts).
import type { SceneScript, Vec3 } from '../../script';
import { above, camOf, castRide, markOf, pathOf, stageCut, walkOf } from './kit';

/** Loch Moss's still water surface (config.ts: level about -0.65). Cameras and ripples over the loch sit on it. */
const WATER = -0.65;
function surf(x: number, z: number, h = 0): Vec3 {
  return [x, WATER + h, z];
}

const DRIFT_DOCK = markOf('loch-dock', 'driftwood');
const PLAYER_DOCK = markOf('loch-dock', 'player');
const REPORTER = markOf('loch-dock', 'tattler-reporter');
const DRIFT_WALK = walkOf('loch-dock', 'driftwood');
const PATROL = pathOf('loch-open-water', 'hoa-patrol-loop');
const NEST_PLAYER = markOf('tessie-nest', 'player');
const RIPPLE: Vec3 = surf(-640, -700);
const PATROL_YAW = Math.atan2(PATROL[4][0] - PATROL[3][0], PATROL[4][1] - PATROL[3][1]);

// Intro: Driftwood in his dinghy at the dock, a ripple going the wrong way, the HOA patrol boat on the far side, then
// the request on the shore.
export const TESSIE_INTRO: SceneScript = {
  id: 'sq-tessie-intro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  title: 'The Loch Moss Monster',
  music: 'mystery',
  ambience: 'water',
  actors: [
    { id: 'you', player: true, at: PLAYER_DOCK.at, yaw: PLAYER_DOCK.yaw },
    { id: 'driftwood', preset: 'driftwood', at: DRIFT_DOCK.at, yaw: DRIFT_DOCK.yaw },
  ],
  vehicles: [
    castRide('driftwood', 'dinghy'),
    { id: 'patrol', kind: 'hoa-patrol-boat', at: PATROL[3], yaw: PATROL_YAW },
  ],
  steps: [
    { do: 'cam', shot: stageCut('loch-dock', 'wide') },
    { do: 'caption', text: 'Loch Moss. Golden hour. The reeds have opinions.' },
    { do: 'wait', s: 2 },
    { do: 'caption', text: null },
    { do: 'cam', shot: { kind: 'dolly', from: camOf('loch-dock', 'two-shot').pos, to: camOf('loch-dock', 'arrival').pos, look: 'driftwood', s: 6 } },
    { do: 'say', who: 'driftwood', text: 'Six months on a trailer, and now I\'ve got a walnut shell. Progress.' },
    { do: 'say', who: 'you', text: 'What are you looking at?' },
    { do: 'say', who: 'driftwood', text: 'Hush. The loch is thinking, and it\'s rude to interrupt.' },
    // A ripple out on the loch, going against the wind: a long hold on the water.
    { do: 'cam', shot: { kind: 'cut', pos: surf(-668, -650, 4), look: RIPPLE, fov: 36 } },
    { do: 'sfx', id: 'splash', at: RIPPLE, gain: 0.6 },
    { do: 'cam', shot: { kind: 'dolly', from: surf(-668, -650, 4), to: surf(-676, -640, 3), look: RIPPLE, s: 6, fov: 36 } },
    { do: 'say', who: 'driftwood', text: 'Ripple going the wrong way. Something big is turning over down there.', stinger: 'mystery' },
    // The far shore: the HOA patrol boat, also looking.
    { do: 'cam', shot: { kind: 'track', pos: surf(-636, -618, 6), who: 'patrol', fov: 44 } },
    { do: 'drive', vehicle: 'patrol', path: PATROL.slice(3, 6).map((p) => [p[0], p[1]]), speed: 3.5, arrive: false, async: true },
    { do: 'caption', text: 'On the far shore, the HOA patrol boat is also looking.' },
    { do: 'say', who: 'driftwood', text: 'HOA. They want the loch drained for a golf course. Eighteen holes where she lives.' },
    { do: 'caption', text: null },
    // His usual loop along the shore, watching the water.
    { do: 'walk', who: 'driftwood', path: DRIFT_WALK, speed: 1.2, async: true },
    { do: 'cam', shot: stageCut('loch-dock', 'two-shot') },
    { do: 'say', who: 'driftwood', text: 'Since the canal, she sings. Low, through the hull of my raft, like a foghorn that\'s read a book.' },
    { do: 'say', who: 'you', text: 'Sings?' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-716, -548, 1.6), look: 'driftwood', fov: 40 } },
    { do: 'say', who: 'driftwood', text: 'Sings, or grumbles. I\'m a castaway, not a musicologist. I first heard it the night you floated me off the canal.' },
    { do: 'gesture', who: 'driftwood', name: 'point', s: 1.4, async: true },
    { do: 'say', who: 'driftwood', text: 'Take a boat out and follow the ripples. Three sightings round the loch. Bring me proof, and not a blurry one.' },
    { do: 'say', who: 'you', text: 'And the HOA?' },
    { do: 'cam', shot: stageCut('loch-dock', 'wide') },
    { do: 'say', who: 'driftwood', text: 'Vesper Thorne\'s HOA doesn\'t believe in anything it can\'t put on a list. Drop four buoys while it looks the other way.', stinger: 'mystery' },
    { do: 'say', who: 'driftwood', text: 'Find her, and I\'ll get you a piece of her shell. She sheds. She won\'t mind.' },
    { do: 'cam', shot: { kind: 'dolly', from: camOf('loch-dock', 'two-shot').pos, to: camOf('loch-dock', 'wide').pos, look: 'driftwood', s: 7 }, wait: true },
  ],
};

// Beat (mid-quest, the player has dropped the fourth buoy): Tessie surfaces by the island where the egg clutch is laid.
export const TESSIE_EGGS: SceneScript = {
  id: 'sq-tessie-eggs',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  music: 'tension',
  ambience: 'water',
  actors: [
    { id: 'you', player: true, at: [-716, -690], yaw: 0, seatedIn: 'boat' },
  ],
  vehicles: [
    { id: 'boat', kind: 'walnut-dinghy', from: 'player', at: [-716, -690], yaw: Math.PI / 2 },
    { id: 'tessie', kind: 'tessie', at: [-730, -700], yaw: 0.6, hidden: true },
  ],
  props: [
    { id: 'clutch', prefab: 'turtle-egg-clutch', at: NEST_PLAYER.at, yaw: 0, size: 2 },
  ],
  steps: [
    { do: 'cam', shot: stageCut('tessie-nest', 'wide') },
    { do: 'caption', text: 'Four buoys down. Out in the reeds, a dredger engine coughs into life.' },
    { do: 'sfx', id: 'engine-rev', at: surf(-650, -690, 1), gain: 0.5 },
    { do: 'wait', s: 1.5 },
    { do: 'caption', text: null },
    { do: 'say', who: 'you', text: 'Something\'s coming up by the island.' },
    { do: 'cam', shot: { kind: 'cut', pos: surf(-712, -676, 3), look: surf(-730, -700), fov: 44 } },
    { do: 'sfx', id: 'splash', at: [-730, WATER, -700] },
    { do: 'spawn', id: 'tessie', at: [-730, -700], yaw: 0.6 },
    { do: 'cam', shot: { kind: 'track', pos: surf(-706, -684, 4), who: 'tessie', fov: 44 } },
    { do: 'drive', vehicle: 'tessie', path: [[-730, -700], [-724, -706]], speed: 1, arrive: false, async: true },
    { do: 'say', who: 'you', text: 'She\'s not a rock. Oh, she\'s got eggs.' },
    { do: 'cam', shot: stageCut('tessie-nest', 'overhead') },
    { do: 'say', who: 'you', text: 'The dredger is coming. Get them to the island before it finds them.', stinger: 'danger' },
    { do: 'cam', shot: { kind: 'track', pos: surf(-716, -672, 5), who: 'tessie', fov: 46 } },
    { do: 'drive', vehicle: 'tessie', path: [[-724, -706], [-744, -694], [-748, -680]], speed: 2, arrive: false },
    { do: 'sfx', id: 'splash', at: [-748, WATER, -680] },
    { do: 'despawn', id: 'tessie' },
  ],
};

// Beat (mid-quest, the player has ridden Tessie back to the dock): the Tattler's photographer on the gold ring, Driftwood
// quiet by the cyan one, and the choice.
export const TESSIE_SHORE: SceneScript = {
  id: 'sq-tessie-shore',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  music: 'mystery',
  ambience: 'water',
  actors: [
    { id: 'you', player: true, at: [-713, -590], yaw: 0, seatedIn: 'tessie' },
    { id: 'driftwood', preset: 'driftwood', at: DRIFT_DOCK.at, yaw: DRIFT_DOCK.yaw, held: 'loch-binoculars' },
    { id: 'tattler', name: 'Turfton Tattler', look: { hat: 0xf2c230, shirt: 0x3a3a3a }, at: REPORTER.at, yaw: REPORTER.yaw, held: 'field-camera' },
  ],
  vehicles: [
    { id: 'tessie', kind: 'tessie', from: 'player', at: [-713, -590], yaw: 0 },
  ],
  steps: [
    { do: 'cam', shot: stageCut('loch-dock', 'wide') },
    { do: 'caption', text: 'Back at the dock, where it started. Tessie is still under the boat, or was a moment ago.' },
    { do: 'wait', s: 1.5 },
    { do: 'caption', text: null },
    { do: 'say', who: 'driftwood', text: 'You rode her. All the way in. Nobody is going to believe you.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-700, -536, 1.5), look: 'tattler', fov: 40 } },
    { do: 'say', who: 'tattler', text: 'Fifteen hundred acorns for one photo. Front page, or nothing.' },
    { do: 'cam', shot: stageCut('loch-dock', 'two-shot') },
    { do: 'say', who: 'driftwood', text: 'Gold ring pays. The Tattler prints it. Nobody reads the Tattler.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-742, -536, 1.5), look: 'driftwood', fov: 40 } },
    { do: 'say', who: 'driftwood', text: 'Cyan ring keeps her. No money, no front page, just her and the loch.', stinger: 'mystery' },
    { do: 'cam', shot: stageCut('loch-dock', 'arrival') },
    { do: 'say', who: 'you', text: 'Which one?' },
  ],
};

// Ending A (gold ring): the Tattler's flash, the photographer runs, Tessie dives, Driftwood sighs.
export const TESSIE_TABLOID: SceneScript = {
  id: 'sq-tessie-tabloid',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  music: 'warm',
  ambience: 'water',
  actors: [
    { id: 'you', player: true, at: [-704, -548], yaw: Math.PI / 2 },
    { id: 'driftwood', preset: 'driftwood', at: DRIFT_DOCK.at, yaw: DRIFT_DOCK.yaw, held: 'loch-binoculars' },
    { id: 'tattler', name: 'Turfton Tattler', look: { hat: 0xf2c230, shirt: 0x3a3a3a }, at: REPORTER.at, yaw: REPORTER.yaw, held: 'field-camera' },
  ],
  vehicles: [
    { id: 'tessie', kind: 'tessie', at: [-713, -590], yaw: 0, hidden: true },
  ],
  steps: [
    { do: 'cam', shot: stageCut('loch-dock', 'two-shot') },
    { do: 'say', who: 'tattler', text: 'Hold still. Look like you\'ve just seen something big. Perfect.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-696, -530, 1.4), look: 'tattler', fov: 34 } },
    { do: 'sfx', id: 'cash', at: 'tattler' },
    { do: 'sfx', id: 'whoosh' },
    { do: 'fade', to: 1, s: 0.08 },
    { do: 'fade', to: 0, s: 0.4 },
    { do: 'walk', who: 'tattler', path: [[-700, -528], [-716, -500]], speed: 4, run: true, async: true },
    { do: 'say', who: 'tattler', text: 'Front page! Front page!', stinger: 'comic' },
    { do: 'spawn', id: 'tessie', at: [-713, -590], yaw: 0 },
    { do: 'cam', shot: { kind: 'track', pos: above(-712, -570, 2.4), who: 'tessie', fov: 46 } },
    { do: 'drive', vehicle: 'tessie', path: [[-713, -590], [-716, -612], [-728, -640]], speed: 3, arrive: false, async: true },
    { do: 'sfx', id: 'splash', at: [-716, WATER, -612] },
    { do: 'wait', s: 2 },
    { do: 'despawn', id: 'tessie' },
    { do: 'cam', shot: stageCut('loch-dock', 'two-shot') },
    { do: 'gesture', who: 'driftwood', name: 'shrug', s: 1.4 },
    { do: 'say', who: 'driftwood', text: 'Nobody believes the Tattler. That\'s the one mercy.' },
  ],
};

// Ending B (cyan ring): Driftwood nods, Tessie rolls once in the shallows and is gone, and he hands over a shell pack.
export const TESSIE_SECRET: SceneScript = {
  id: 'sq-tessie-secret',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  music: 'sad',
  ambience: 'water',
  actors: [
    { id: 'you', player: true, at: [-742, -552], yaw: 0 },
    { id: 'driftwood', preset: 'driftwood', at: [-736, -556], yaw: 0, held: null },
  ],
  vehicles: [
    { id: 'tessie', kind: 'tessie', at: [-738, -580], yaw: 0, hidden: true },
  ],
  steps: [
    { do: 'cam', shot: stageCut('loch-dock', 'two-shot') },
    { do: 'gesture', who: 'driftwood', name: 'nod', s: 1.2 },
    { do: 'say', who: 'driftwood', text: 'You kept her. Good. The Tattler would have sold her for a pie.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-730, -566, 2.2), look: 'tessie', fov: 46 } },
    { do: 'spawn', id: 'tessie', at: [-738, -580], yaw: 0 },
    { do: 'sfx', id: 'splash', at: [-738, WATER, -580], gain: 0.7 },
    { do: 'drive', vehicle: 'tessie', path: [[-738, -580], [-746, -590], [-742, -596]], speed: 1.5, arrive: false },
    { do: 'despawn', id: 'tessie' },
    { do: 'sfx', id: 'splash', at: [-742, WATER, -596] },
    { do: 'cam', shot: stageCut('loch-dock', 'two-shot') },
    { do: 'music', track: 'triumph', fade: 2 },
    { do: 'stinger', id: 'triumph' },
    { do: 'hold', who: 'driftwood', prop: 'turtle-shell-pack' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-738, -538, 1.6), look: 'driftwood', fov: 40 } },
    { do: 'give', from: 'driftwood', to: 'you', prop: 'turtle-shell-pack', s: 1.5 },
    { do: 'say', who: 'driftwood', text: 'A piece of her. She sheds. Wear it in the rain, it\'s the only thing that has ever kept me dry.' },
  ],
};

export const TESSIE_SCENES: SceneScript[] = [TESSIE_INTRO, TESSIE_EGGS, TESSIE_SHORE, TESSIE_TABLOID, TESSIE_SECRET];
