// Castaway's Dry-Dock (Driftwood). Melancholy and slow: long wide shots of the clover and the canal, few words, a bell
// that never rings. Golden sky going to dusk, 'sad' music under 'wind', then 'water'. Staged at driftwood-trailer
// (intro) and canal-raft (payoff) in quests/stages/cloverfield.ts.
import type { SceneScript } from '../../script';
import { above, markOf, stageCut, walkOf } from './kit';

const TRAILER_DRIFT = markOf('driftwood-trailer', 'driftwood');
const TRAILER_PLAYER = markOf('driftwood-trailer', 'player');
const TRAILER_WALK = walkOf('driftwood-trailer', 'driftwood');
const RAFT_DRIFT = markOf('canal-raft', 'driftwood');
const RAFT_PLAYER = markOf('canal-raft', 'player');

export const CASTAWAY_INTRO: SceneScript = {
  id: 'sq-castaway-drydock-intro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  title: "Castaway's Dry-Dock",
  music: 'sad',
  ambience: 'wind',
  actors: [
    { id: 'you', player: true, at: TRAILER_PLAYER.at, yaw: TRAILER_PLAYER.yaw },
    { id: 'driftwood', preset: 'driftwood', at: TRAILER_DRIFT.at, yaw: TRAILER_DRIFT.yaw },
  ],
  vehicles: [{ id: 'combine', kind: 'combine', at: [30, 460], yaw: Math.PI }],
  props: [{ id: 'bell', prefab: 'gunmod-charm-bell', at: [25, 446], yaw: 0, size: 0.4, by: 'h' }],
  steps: [
    { do: 'cam', shot: stageCut('driftwood-trailer', 'wide') },
    { do: 'caption', text: 'Cloverfield. Six months of clover, and not one wave.' },
    { do: 'gesture', who: 'driftwood', name: 'stand', s: 0.6 },
    // He paces his loop to the bell and rings it. Nobody answers.
    { do: 'walk', who: 'driftwood', path: TRAILER_WALK, speed: 0.9, async: true },
    { do: 'cam', shot: { kind: 'dolly', from: above(42, 446, 4), to: above(44, 448, 4.5), look: 'driftwood', s: 8, fov: 36 } },
    { do: 'sfx', id: 'glass', at: 'bell', gain: 0.4 },
    { do: 'wait', s: 2.2 },
    { do: 'caption', text: null },
    { do: 'say', who: 'driftwood', text: 'Tide\'s coming in. I can feel it in my hat.' },
    { do: 'cam', shot: stageCut('driftwood-trailer', 'two-shot') },
    { do: 'say', who: 'you', text: 'That\'s clover, Driftwood.' },
    { do: 'say', who: 'driftwood', text: 'That\'s the sea before it learns to swim. Six months I\'ve been waiting on a tide.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(44, 452, 1.4), look: 'driftwood', fov: 34 } },
    { do: 'say', who: 'driftwood', text: 'The canal went. The HOA drained the old ponds for putting greens. Brenda\'s got the canal now, a republic on a lawn chair.' },
    { do: 'say', who: 'you', text: 'And your raft?' },
    { do: 'say', who: 'driftwood', text: 'Out on the canal, still floating, I hope. Haul it to the Southern Drainage Canal. Fifty-five, two-twenty-three. Sun\'s going.' },
    { do: 'cam', shot: { kind: 'track', pos: above(40, 468, 3), who: 'combine', fov: 44 } },
    { do: 'wait', s: 1.0 },
    { do: 'say', who: 'driftwood', text: 'Bring her back to the water before the tide goes out. Mind the frogs. They\'re sharks.' },
  ],
};

export const CASTAWAY_OUTRO: SceneScript = {
  id: 'sq-castaway-drydock-outro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  title: "Castaway's Dry-Dock",
  music: 'sad',
  ambience: 'water',
  actors: [
    { id: 'you', player: true, seatedIn: 'hauler', at: [55, 221], yaw: 0 },
    { id: 'driftwood', preset: 'driftwood', hidden: true, seatedIn: 'raft', at: RAFT_DRIFT.at, yaw: RAFT_DRIFT.yaw },
  ],
  vehicles: [
    { id: 'hauler', kind: 'combine', from: 'player', at: [55, 221], yaw: 0 },
    { id: 'raft', kind: 'walnut-dinghy', at: [46, 228], yaw: Math.PI / 2, hidden: true },
  ],
  steps: [
    { do: 'cam', shot: stageCut('canal-raft', 'two-shot') },
    { do: 'caption', text: 'Southern Drainage Canal. Brown water, gold light, and frogs making a case.' },
    { do: 'exit', who: 'you' },
    { do: 'walk', who: 'you', path: [RAFT_PLAYER.at], speed: 1.2 },
    { do: 'caption', text: null },
    { do: 'say', who: 'you', text: 'Raft\'s on the bank. Want it in the water?' },
    // The raft slides off the bank onto the canal; Driftwood is already sat in it.
    { do: 'cam', shot: stageCut('canal-raft', 'arrival') },
    { do: 'spawn', id: 'raft' },
    { do: 'spawn', id: 'driftwood' },
    { do: 'drive', vehicle: 'raft', path: [[46, 228], [50, 228]], speed: 0.8 },
    { do: 'gesture', who: 'driftwood', name: 'stand', s: 0.8 },
    { do: 'say', who: 'driftwood', text: 'Oh. It floats. Six months on a trailer and it still floats.', sfx: 'splash' },
    { do: 'cam', shot: { kind: 'follow', who: 'raft', offset: [0, 2.0, -6], look: [0, 1.2, 4], lag: 0.6, fov: 44 } },
    { do: 'say', who: 'driftwood', text: 'Don\'t say anything. I\'m not talking. I\'m floating.' },
    { do: 'wait', s: 2.0 },
    // Something deep sings through the hull, far north. He stops talking.
    { do: 'stinger', id: 'mystery' },
    { do: 'cam', shot: { kind: 'dolly', from: above(44, 224, 1.6), to: above(42, 222, 2.0), look: above(40, 120, 40), lookTo: above(40, 110, 40), s: 9, fov: 34 } },
    { do: 'wait', s: 3.0 },
    { do: 'say', who: 'driftwood', text: 'Hear that? Under the hull. Far north.' },
    { do: 'wait', s: 2.5 },
    { do: 'gesture', who: 'driftwood', name: 'bow', s: 1.6 },
    { do: 'say', who: 'driftwood', text: 'Fair winds, landlubber. Captain\'s hat\'s in the trailer, if you want it.', stinger: 'triumph', music: 'triumph' },
  ],
};

export const CASTAWAY_SCENES: SceneScript[] = [CASTAWAY_INTRO, CASTAWAY_OUTRO];
