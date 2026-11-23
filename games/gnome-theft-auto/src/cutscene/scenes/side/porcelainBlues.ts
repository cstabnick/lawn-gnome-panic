// Porcelain Blues (Clara, the Tall House Porch): hushed gothic, the sincere register (Clara's lines carry no gags). Dusk
// held at golden so the porcelain reads against the boards, a candle in her hand, porcelain chinks, the house knocking
// once from inside. Re-directed against docs/design/gnome-theft-auto/direction/bible.md; notes per scene in
// docs/design/gnome-theft-auto/direction/scenes/sq-porcelain-blues-*.md. The intro and payoff are on the porch
// (tall-house-porch in quests/stages/wilds.ts); the ledger beat is a meanwhile at Vesper's counter (glaze-tax-office in
// quests/stages/turfton.ts).
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, exchangeLooks, reaction, shot } from '../../direct';
import { above, castRide, markOf, walkOf } from './kit';

const PORCH = 'tall-house-porch';
const OFFICE = 'glaze-tax-office';
const CLARA = markOf(PORCH, 'clara');
const VESPER = markOf(OFFICE, 'vesper');
const CLERK = walkOf(OFFICE, 'clerk');

const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

/** The Tall House's boarded front (its collider ends at x -554); the returned lanterns are set at its foot. */
const DOOR: Vec2 = [-553, 40];
/** Where Clara stands to face the player on the boards, and where the player stops at the top of the steps. */
const CL_AT: Vec2 = [CLARA.at[0], CLARA.at[1]];
const YOU_START: Vec2 = [-533.5, 45.5];
const YOU_AT: Vec2 = [-540.6, 41.2];
const REF1: Vec2 = [-541.5, 46.5];
const REF2: Vec2 = [-546, 50.5];

/** The intro and payoff two-handers, each kept on one side of its line. */
const PORCH_TALK = coverage('clara', 'you', 1);

export const SQ_PORCELAIN_BLUES_INTRO: SceneScript = {
  id: 'sq-porcelain-blues-intro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  title: 'Porcelain Blues',
  ambience: 'wind',
  radio: 0,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sq-porcelain-blues-intro.md', kind: 'intro' },
  actors: [
    { id: 'you', player: true, at: YOU_START, yaw: towards(YOU_START, CL_AT) },
    { id: 'clara', preset: 'clara', name: 'Clara', at: CL_AT, yaw: towards(CL_AT, DOOR), held: 'candle' },
    { id: 'ref1', name: 'Refugee', look: { skin: 0xfafafa, hat: 0x9fb4c8, shirt: 0xd8d0c0, beard: null }, at: REF1, yaw: towards(REF1, CL_AT), held: 'tin-pail' },
    { id: 'ref2', name: 'Refugee', look: { skin: 0xfafafa, hat: 0xeeeeee, shirt: 0xbfb6a6 }, at: REF2, yaw: towards(REF2, DOOR) },
  ],
  steps: [
    // 1. Hook: a board creaks under the player's boot and porcelain flinches. Clara keeps vigil at the boarded door.
    cut(shot('clara', 'ms', { toward: 'you', side: 50, height: 'low' })),
    { do: 'walk', who: 'you', path: [YOU_AT], speed: 1.5, async: true },
    { do: 'wait', s: 1.0 },
    { do: 'sfx', id: 'door-creak', at: 'you', gain: 0.8 },
    { do: 'gesture', who: 'clara', name: 'flinch', s: 0.9, async: true },
    { do: 'face', who: 'clara', at: 'you', s: 0.5 },
    { do: 'sfx', id: 'glass', at: 'clara', gain: 0.25 },
    cut(PORCH_TALK.single('clara', 'ms')),
    { do: 'say', who: 'clara', text: 'Quietly, please. One hard knock, and I do not get up.' },
    { do: 'music', track: 'mystery', fade: 1.2 },
    cut(PORCH_TALK.single('you', 'ms')),
    { do: 'say', who: 'you', text: 'Your lanterns are lit.' },
    // 2. Setup: the lanterns are wrong. She says it, the insert shows it, then the theft.
    cut(PORCH_TALK.single('clara', 'mcu')),
    { do: 'say', who: 'clara', text: 'They are wax. Look at the shadows. They fall toward the light.' },
    cut({ kind: 'cut', pos: above(-536.6, 37.4, 0.9), look: above(-538, 36, 0.7), fov: 34 }),
    beat('pause'),
    cut(PORCH_TALK.single('clara', 'mcu')),
    { do: 'say', who: 'clara', text: 'Somebody swapped them while I was counting heads.' },
    ...reaction('ref1', { toward: 'clara', size: 'mcu', side: -30 }),
    { do: 'say', who: 'ref1', text: 'It knocks when the real ones go out.' },
    // 3. Turn: the house answers. Music out, everyone turns to the boards, a held silence.
    { do: 'music', track: null, fade: 0.4 },
    { do: 'sfx', id: 'knock', at: 'clara', gain: 0.8 },
    { do: 'shake', amp: 0.03, s: 0.6 },
    { do: 'face', who: 'clara', at: DOOR, s: 0.4, async: true },
    { do: 'face', who: 'ref1', at: DOOR, s: 0.4, async: true },
    { do: 'face', who: 'you', at: DOOR, s: 0.4, async: true },
    // Low, behind her shoulder: the boarded door fills the frame over a figure the size of a teacup.
    cut({ kind: 'cut', pos: above(-540.2, 37.2, 0.45), look: above(-552, 40.5, 1.9), fov: 46 }),
    { do: 'gesture', who: 'ref2', name: 'clutch', s: 1.6, async: true },
    beat('silence'),
    cut(shot('clara', 'mcu', { toward: 'you', side: 150 })),
    { do: 'say', who: 'clara', text: 'Do not answer it. It knocks once. Then it waits.' },
    // 4. The job, in her voice: quiet, short, and then the one hard sentence.
    ...exchangeLooks('clara', 'you'),
    { do: 'music', track: 'mystery', fade: 2.0 },
    cut(PORCH_TALK.single('clara', 'mcu')),
    { do: 'say', who: 'clara', text: 'Three HOA scavengers took them. Two in the mud out front. One up the trail.' },
    cut(PORCH_TALK.single('you', 'ms')),
    { do: 'say', who: 'you', text: 'And if they won\'t hand them over?' },
    cut(PORCH_TALK.single('clara', 'cu')),
    beat('beat'),
    { do: 'say', who: 'clara', text: 'Then crack them. Gently is for porcelain.' },
    // She names him looking at the house, not at the player: what she knows about Vesper stays unsaid.
    { do: 'face', who: 'clara', at: DOOR, s: 0.5, async: true },
    cut(shot('clara', 'mcu', { toward: 'you', side: 165 })),
    { do: 'gesture', who: 'clara', name: 'think', s: 0.8 },
    { do: 'say', who: 'clara', text: 'And not one lantern goes to Vesper Thorne. He keeps a shelf.' },
    ...reaction('you', { toward: 'clara', gesture: 'nod', size: 'mcu', side: -25, hold: 'pause' }),
    // 5. Button: she turns back to her vigil, small and lit at the foot of the boarded house.
    { do: 'face', who: 'clara', at: DOOR, s: 0.6, async: true },
    // The player steps aside, out of the lens: the last picture is hers alone.
    { do: 'walk', who: 'you', path: [[-538.5, 37.2]], speed: 1.4, async: true },
    cut({ kind: 'dolly', from: above(-536.5, 44.5, 1.2), to: above(-538, 43.6, 1.1), look: above(-546, 39, 1.0), s: 4, fov: 42 }),
    { do: 'sfx', id: 'glass', at: 'clara', gain: 0.2 },
    { do: 'wait', s: 2.6 },
  ],
};

/** Meanwhile at Thorne Tower: the auditor reports the three cracked scavengers; Vesper does not look up. */
const AUDITOR: Vec2 = [21.2, -47.4];
const V_AT: Vec2 = [VESPER.at[0], VESPER.at[1]];
const LEDGER_TALK = coverage('vesper', 'auditor', 1);

export const SQ_PORCELAIN_BLUES_LEDGER: SceneScript = {
  id: 'sq-porcelain-blues-ledger',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'noon',
  ambience: 'street',
  radio: 0,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sq-porcelain-blues-ledger.md', kind: 'arrival' },
  // Meanwhile: no player actor, the real player is somewhere else on the map.
  actors: [
    { id: 'vesper', preset: 'vesper', name: 'Vesper Thorne', at: V_AT, yaw: towards(V_AT, AUDITOR), held: 'ledger' },
    { id: 'clerk', name: 'Clerk', look: { hat: 0x7d8fa0, shirt: 0xe8e4da }, at: CLERK[0], yaw: Math.PI / 2 },
    { id: 'auditor', name: 'HOA Auditor', look: { hat: 0x4b5563, shirt: 0xc9b99b, glasses: true }, at: AUDITOR, yaw: towards(AUDITOR, V_AT), held: 'ruler-stick' },
  ],
  vehicles: [castRide('vesper', 'vesper-car')],
  steps: [
    // Hook: a ledger snaps shut. Vesper, low and alone, the tower behind him.
    cut(shot('vesper', 'ms', { toward: 'auditor', side: 30, height: 'low' })),
    { do: 'sfx', id: 'thud', at: 'vesper', gain: 0.5 },
    { do: 'music', track: 'villain', fade: 0.6 },
    { do: 'walk', who: 'clerk', path: CLERK, speed: 0.9, async: true },
    { do: 'wait', s: 1.6 },
    cut(LEDGER_TALK.single('auditor', 'mcu', { height: 'high' })),
    { do: 'say', who: 'auditor', text: 'All three scavengers cracked, sir. The lanterns are going back to the porch.' },
    cut(LEDGER_TALK.single('vesper', 'mcu', { height: 'low' })),
    beat('beat'),
    { do: 'say', who: 'vesper', text: 'Then the porch will be lit tonight.' },
    cut(LEDGER_TALK.single('auditor', 'mcu', { height: 'high' })),
    { do: 'say', who: 'auditor', text: 'Shall I send the van, sir?' },
    cut(LEDGER_TALK.single('vesper', 'mcu', { height: 'low' })),
    { do: 'say', who: 'vesper', text: 'Send the calipers. Vans are for things that can be dragged.' },
    // Button: the push-in, and the one line he means.
    cut({ kind: 'dolly', from: above(22.9, -46.6, 0.55), to: above(23.6, -46.35, 0.6), look: 'vesper', s: 4.5, fov: 32 }),
    beat('pause'),
    { do: 'say', who: 'vesper', text: 'Porcelain belongs on a shelf.' },
    { do: 'stinger', id: 'villain' },
    beat('pause'),
  ],
};

/** The three real lanterns, set at the foot of the boarded door in the payoff (hidden until each is put down). */
const DOOR_LANTERNS: { id: string; at: Vec2 }[] = [
  { id: 'lantern-1', at: [-551.8, 37.6] },
  { id: 'lantern-2', at: [-551.6, 40.0] },
  { id: 'lantern-3', at: [-551.8, 42.4] },
];
const DOOR_PROPS = DOOR_LANTERNS.map((l) => ({ id: l.id, prefab: 'porcelain-lantern', at: l.at, yaw: Math.PI / 2, hidden: true }));
const CL_DOOR: Vec2 = [-550.2, 40];
const YOU_BACK: Vec2 = [-542.5, 39.5];

export const SQ_PORCELAIN_BLUES_OUTRO: SceneScript = {
  id: 'sq-porcelain-blues-outro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  ambience: 'wind',
  radio: 0,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sq-porcelain-blues-outro.md', kind: 'outro' },
  actors: [
    { id: 'you', player: true, at: [-539, 37], yaw: towards([-539, 37], CL_AT), held: 'porcelain-lantern' },
    { id: 'clara', preset: 'clara', name: 'Clara', at: CL_AT, yaw: towards(CL_AT, DOOR), held: 'candle' },
  ],
  // The player's own vehicle if they drove back; otherwise a Lowrider is spawned at the porch's fallback spot.
  vehicles: [{ id: 'car', kind: 'lowrider', from: 'player', at: [-546, 26], yaw: Math.PI / 2 }],
  props: DOOR_PROPS,
  steps: [
    // 1. Hook: a lantern swings into the frame, lit, and Clara turns to it before she believes it.
    cut(shot('clara', 'ms', { toward: 'you', side: 35 })),
    { do: 'walk', who: 'you', path: [YOU_BACK], speed: 1.2, async: true },
    { do: 'sfx', id: 'glass', at: 'you', gain: 0.3 },
    { do: 'wait', s: 1.4 },
    { do: 'face', who: 'clara', at: 'you', s: 0.6 },
    { do: 'music', track: 'warm', fade: 1.5 },
    cut(PORCH_TALK.single('clara', 'mcu')),
    { do: 'say', who: 'clara', text: 'You came back. With all three.' },
    cut(PORCH_TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'The scavengers send their regrets.' },
    // 2. The lanterns go to the door, one chink at a time: no counting out loud, the sound is the count.
    { do: 'give', from: 'you', to: 'clara', prop: 'porcelain-lantern', s: 1.2 },
    { do: 'hold', who: 'clara', prop: 'porcelain-lantern' },
    cut(shot('clara', 'fs', { toward: 'you', side: 70 })),
    { do: 'walk', who: 'clara', path: [CL_DOOR], speed: 0.8 },
    { do: 'face', who: 'clara', at: DOOR, s: 0.4 },
    cut({ kind: 'cut', pos: above(-548.2, 40, 0.7), look: above(-551.7, 40, 0.45), fov: 40 }),
    { do: 'spawn', id: 'lantern-1' },
    { do: 'sfx', id: 'glass', at: 'lantern-1', gain: 0.3 },
    { do: 'wait', s: 1.0 },
    { do: 'spawn', id: 'lantern-2' },
    { do: 'sfx', id: 'glass', at: 'lantern-2', gain: 0.3 },
    { do: 'wait', s: 1.0 },
    { do: 'spawn', id: 'lantern-3' },
    { do: 'hold', who: 'clara', prop: 'candle' },
    { do: 'sfx', id: 'glass', at: 'lantern-3', gain: 0.35 },
    { do: 'wait', s: 1.0 },
    // 3. The sincere beat: her hand on the boards, the one thing she wanted. Music out, a held silence.
    { do: 'music', track: null, fade: 0.8 },
    { do: 'face', who: 'clara', at: 'you', s: 0.5 },
    cut(shot('clara', 'cu', { toward: 'you', side: 25 })),
    { do: 'say', who: 'clara', text: 'Now the ones still inside can find the door.' },
    beat('silence'),
    cut(shot('you', 'mcu', { toward: 'clara', side: -20 })),
    { do: 'say', who: 'you', text: 'How many are still in there?' },
    cut(shot('clara', 'cu', { toward: 'you', side: 25 })),
    beat('beat'),
    { do: 'say', who: 'clara', text: 'Enough. Take my charm. It is the only thing of mine never cracked.' },
    // 4. Turn and button: the house knocks again, closer to the door than before. She steps back from it.
    { do: 'sfx', id: 'knock', at: 'lantern-2', gain: 1.0 },
    { do: 'shake', amp: 0.05, s: 0.8 },
    { do: 'gesture', who: 'clara', name: 'flinch', s: 0.9, async: true },
    cut(shot('clara', 'ms', { toward: 'you', side: 130, height: 'low' })),
    { do: 'face', who: 'clara', at: DOOR, s: 0.4 },
    { do: 'stinger', id: 'mystery' },
    { do: 'say', who: 'clara', text: 'That was closer.' },
    cut({ kind: 'dolly', from: above(-540, 44, 0.8), to: above(-541.5, 43, 0.9), look: above(-552, 40, 1.6), s: 4, fov: 42 }),
    { do: 'music', track: 'mystery', fade: 1.5 },
    { do: 'wait', s: 2.8 },
  ],
};

export const PORCELAIN_BLUES_SCENES: SceneScript[] = [SQ_PORCELAIN_BLUES_INTRO, SQ_PORCELAIN_BLUES_LEDGER, SQ_PORCELAIN_BLUES_OUTRO];
