// The Mulch Pyramid Scheme (giver Cedric "Double-Bag" Peat): a sleazy infomercial. Bright noon, warm music, quick cuts,
// ad-copy title pills and planted satisfied customers, a push-in on the product. The beat (wasps and a guard) is at
// patio-gate at dawn; the payoff at Side-Valve Salvage, where the infomercial collapses into workshop realism.
// Re-directed against docs/design/gnome-theft-auto/direction/bible.md; notes per scene in
// docs/design/gnome-theft-auto/direction/scenes/sq-mulch-pyramid-*.md.
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, exchangeLooks, shot } from '../../direct';
import { above, castRide, markOf, walkOf } from './kit';

const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

const BODEGA = 'bodega-front';
const CEDRIC = markOf(BODEGA, 'cedric');
const BURT = markOf(BODEGA, 'burt');
const PLAYER = markOf(BODEGA, 'player');
const KEEPER = walkOf(BODEGA, 'bodega');
const PITCH = walkOf(BODEGA, 'cedric');

const GATE = 'patio-gate';
const GARY = markOf(GATE, 'gary');
const GARY_PACE = walkOf(GATE, 'gary');

const BAY = 'side-valve-bay';
const TANSY = markOf(BAY, 'tansy');
const PIP = markOf(BAY, 'pip');

/** The pitch: Cedric talks to the marks (Burt, John) and to the player, each conversation on one side of the line. */
const MARKS = coverage('cedric', 'burt', 1);
const SALE = coverage('cedric', 'you', 1);
/** The gate: Gary and the player on one side of the line. */
const GATE_TALK = coverage('gary', 'you', 1);
/** The payoff: Tansy and Cedric on one side of the bay. */
const BAY_TALK = coverage('tansy', 'cedric', 1);

export const MULCH_PYRAMID_INTRO: SceneScript = {
  id: 'sq-mulch-pyramid-intro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'noon',
  title: 'The Mulch Pyramid Scheme',
  music: 'warm',
  ambience: 'street',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sq-mulch-pyramid-intro.md', kind: 'intro' },
  actors: [
    { id: 'you', player: true, at: PLAYER.at, yaw: towards(PLAYER.at, CEDRIC.at) },
    { id: 'cedric', preset: 'cedric', at: PITCH[0], yaw: towards(PITCH[0], BURT.at), held: 'acorn-flour-sack' },
    { id: 'burt', preset: 'burt', at: BURT.at, yaw: towards(BURT.at, PITCH[0]), held: 'espresso-cup' },
    { id: 'john', preset: 'bodega', name: 'John Bodega', at: KEEPER[0], yaw: towards(KEEPER[0], BURT.at), held: 'broom' },
  ],
  vehicles: [castRide('cedric', 'spreader')],
  steps: [
    // Hook: Cedric turns on Burt mid-pitch, and the ad copy lands at once.
    { do: 'title', text: 'RESULTS NOT TYPICAL' },
    cut(shot('cedric', 'ms', { toward: 'burt', side: 35 })),
    { do: 'walk', who: 'cedric', path: [PITCH[1], PITCH[0]], speed: 1.0, async: true },
    { do: 'say', who: 'cedric', text: 'Friend! You, with the coffee! Do you have a lawn?' },
    cut(MARKS.single('burt', 'mcu')),
    { do: 'say', who: 'burt', text: 'I have a lawn.' },
    cut(shot('john', 'ms', { toward: 'burt', side: 20 })),
    { do: 'say', who: 'john', text: "Don't sell him anything." },
    cut(MARKS.single('burt', 'mcu')),
    { do: 'say', who: 'burt', text: 'I also have a citation book. Old habits. Pitch carefully.' },
    // Cedric's pitch, on his own single; the ad copy is a pill, not narration.
    { do: 'title', text: 'ACT NOW' },
    { do: 'face', who: 'cedric', at: 'burt', s: 0.4 },
    cut(MARKS.single('cedric', 'ms')),
    { do: 'say', who: 'cedric', text: 'It is not a pyramid, friend. It is an inverted compost funnel.' },
    { do: 'say', who: 'cedric', text: 'Everybody is rooted. Nobody is underground.' },
    { do: 'title', text: null },
    // The product: a locked medium of the sack held up to the camera while nobody talks.
    cut(shot('cedric', 'mcu', { toward: 'burt', side: 25 })),
    { do: 'wait', s: 2.0 },
    // The player asks; Cedric answers a different question first, then admits it.
    ...exchangeLooks('cedric', 'you'),
    cut(SALE.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'What is actually in the bags?' },
    cut(SALE.single('cedric', 'ms')),
    { do: 'say', who: 'cedric', text: 'Every bag is hand-filled, friend. With love.' },
    cut(SALE.single('you', 'mcu')),
    beat('pause'),
    cut(shot('cedric', 'mcu', { toward: 'you', side: 25 })),
    { do: 'say', who: 'cedric', text: 'Dyed sawdust. Craft glitter. The glitter is the expensive part.' },
    cut(SALE.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Sawdust?' },
    { do: 'title', text: 'NOW WITH 40% MORE WASPS' },
    cut(SALE.single('cedric', 'ms')),
    { do: 'say', who: 'cedric', text: 'Wasps love it. Wasps are our most loyal customers.' },
    { do: 'title', text: null },
    // The job, in short lines with the player's straight question between them.
    cut(shot('cedric', 'mcu', { toward: 'you', side: 25 })),
    { do: 'say', who: 'cedric', text: 'Here is the job. Take the spreader to Patio Heights.' },
    cut(SALE.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Patio Heights? That is Vesper Thorne\'s street.' },
    cut(SALE.single('cedric', 'ms')),
    { do: 'say', who: 'cedric', text: 'Drop the first load at the top of the drive. Then bring it home.' },
    cut(shot('cedric', 'mcu', { toward: 'you', side: 25 })),
    { do: 'say', who: 'cedric', text: 'Every lawn up there needs fluffing. Nobody checks the bag.' },
    // Button: ad copy over Cedric's frozen salesman smile, pointing at us.
    { do: 'title', text: 'LIMITED TIME. LIMITED SOIL.' },
    cut(shot('cedric', 'mcu', { toward: 'you', side: 25 })),
    { do: 'gesture', who: 'cedric', name: 'point', s: 1.2 },
    beat('pause'),
    { do: 'wait', s: 1.5 },
  ],
};

export const MULCH_PYRAMID_WASPS: SceneScript = {
  id: 'sq-mulch-pyramid-wasps',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  music: 'tension',
  ambience: 'street',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sq-mulch-pyramid-wasps.md', kind: 'arrival' },
  actors: [
    { id: 'you', player: true, seatedIn: 'rig', at: [146, -141] },
    { id: 'gary', name: 'Gate-Guard Gary', look: { hat: 0x1f3a5f, shirt: 0x2c3e50, glasses: true }, at: GARY.at, yaw: GARY.yaw, held: 'ledger' },
  ],
  vehicles: [castRide('cedric', 'rig', [146, -141], 0, { from: 'player' })],
  props: [
    { id: 'wasp1', prefab: 'bee', at: [147.5, -139.6], size: 0.7 },
    { id: 'wasp2', prefab: 'bee', at: [144.5, -142.4], size: 0.7 },
    { id: 'wasp3', prefab: 'bee', at: [148.8, -143.2], size: 0.7 },
  ],
  steps: [
    // Hook: the wasps are already on the rig. A locked wide holds the swarm for under 3 s, no line.
    cut({ kind: 'cut', pos: above(152, -134, 3.5), look: 'rig', fov: 46 }),
    {
      do: 'parallel',
      tracks: [
        [
          { do: 'spawn', id: 'wasp1', at: [146.6, -139.2] },
          { do: 'wait', s: 0.7 },
          { do: 'spawn', id: 'wasp1', at: [149.5, -140.5] },
          { do: 'wait', s: 0.7 },
          { do: 'spawn', id: 'wasp1', at: [147.2, -137.8] },
          { do: 'wait', s: 0.7 },
          { do: 'spawn', id: 'wasp1', at: [145.2, -139.4] },
        ],
        [
          { do: 'spawn', id: 'wasp2', at: [143.8, -140.4] },
          { do: 'wait', s: 0.9 },
          { do: 'spawn', id: 'wasp2', at: [146.9, -144.1] },
          { do: 'wait', s: 0.9 },
          { do: 'spawn', id: 'wasp2', at: [149.2, -141.6] },
          { do: 'wait', s: 0.9 },
          { do: 'spawn', id: 'wasp2', at: [145.6, -138.5] },
        ],
        [
          { do: 'spawn', id: 'wasp3', at: [150.1, -142.0] },
          { do: 'wait', s: 1.1 },
          { do: 'spawn', id: 'wasp3', at: [147.8, -145.0] },
          { do: 'wait', s: 1.1 },
          { do: 'spawn', id: 'wasp3', at: [144.4, -143.5] },
        ],
      ],
    },
    // The player climbs out of the glitter rig (its body hides a seated speaker from every side).
    { do: 'exit', who: 'you', s: 1.5 },
    cut(shot('you', 'ms', { toward: 'gary', side: -30 })),
    { do: 'say', who: 'you', text: 'Glitter. It is in the wheels, the seat, and I think my ears.' },
    // Gary wakes from his binder and walks to the gap; the wide holds while he walks.
    cut(shot('gary', 'fs', { toward: 'you', side: 20 })),
    { do: 'walk', who: 'gary', path: GARY_PACE, speed: 1.2, async: true },
    { do: 'gesture', who: 'gary', name: 'point', s: 1.4, async: true },
    { do: 'sfx', id: 'alarm', at: 'gary' },
    { do: 'wait', s: 2.0 },
    ...exchangeLooks('gary', 'you'),
    cut(GATE_TALK.single('gary', 'mcu', { height: 'low' })),
    { do: 'say', who: 'gary', text: 'Unlicensed mulch rig. Glitter-purple is not on the approved list.' },
    { do: 'shake', amp: 0.12, s: 1.2 },
    cut(GATE_TALK.single('gary', 'cu', { height: 'low' })),
    { do: 'say', who: 'gary', text: 'Wasps in attendance. Dispatch, you will want a net.', stinger: 'comic' },
    { do: 'stinger', id: 'danger' },
    cut(shot('you', 'ms', { toward: 'gary', side: -30 })),
    { do: 'say', who: 'you', text: 'We need to move the rig. Now.' },
    // Back in the seat (the quest goes on at the wheel), then the button: the horn, and Gary flinching at a wasp.
    cut({ kind: 'cut', pos: above(152, -134, 3.5), look: 'rig', fov: 46 }),
    { do: 'enter', who: 'you', vehicle: 'rig', seat: 0 },
    { do: 'horn', vehicle: 'rig' },
    cut(shot('gary', 'ms', { toward: 'you', side: -50, height: 'low' })),
    { do: 'gesture', who: 'gary', name: 'flinch', s: 0.9 },
    { do: 'wait', s: 1.2 },
  ],
};

export const MULCH_PYRAMID_OUTRO: SceneScript = {
  id: 'sq-mulch-pyramid-outro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'noon',
  music: 'warm',
  ambience: 'street',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sq-mulch-pyramid-outro.md', kind: 'outro' },
  actors: [
    { id: 'you', player: true, seatedIn: 'rig', at: [-150, 72] },
    { id: 'tansy', preset: 'tansy', at: TANSY.at, yaw: towards(TANSY.at, PIP.at) },
    { id: 'pip', preset: 'pip', at: PIP.at, yaw: towards(PIP.at, TANSY.at) },
    { id: 'cedric', preset: 'cedric', at: [-158, 66], yaw: Math.PI / 2, held: 'acorn-flour-sack' },
  ],
  vehicles: [castRide('cedric', 'rig', [-150, 72], 0, { from: 'player' }), castRide('tansy', 'zero')],
  steps: [
    // Hook: Tansy, beside her Zero-Turn, says her line without looking up from the work.
    cut(shot('tansy', 'ms', { toward: 'pip', side: 30, height: 'low' })),
    { do: 'sfx', id: 'thud', at: 'tansy', gain: 0.4 },
    { do: 'say', who: 'tansy', text: 'You brought the spreader back.' },
    { do: 'exit', who: 'you', s: 2.2 },
    cut(shot('tansy', 'mcu', { toward: 'pip', side: 30, height: 'low' })),
    { do: 'say', who: 'tansy', text: 'No glitter on the Zero-Turn. It is the only thing here that runs.' },
    // Cedric slides in with his patter; Tansy cuts him down in short clauses.
    { do: 'walk', who: 'cedric', path: [[-152, 68], [-147, 69]], speed: 1.2, async: true },
    ...exchangeLooks('cedric', 'tansy'),
    cut(BAY_TALK.single('cedric', 'mcu')),
    { do: 'say', who: 'cedric', text: 'Tansy, love. A misunderstanding. The bags are artisanal. Hand-dyed.' },
    cut(BAY_TALK.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'I opened one. It is sawdust, glitter, and a wasp.' },
    { do: 'gesture', who: 'tansy', name: 'crossArms', s: 1.6, async: true },
    cut(BAY_TALK.single('cedric', 'ms')),
    { do: 'say', who: 'cedric', text: 'It is a funnel, Tansy. Everybody is on it.' },
    // Pip is right for once: his line, under sixteen words, on his own frame.
    cut(shot('pip', 'ms', { toward: 'cedric', side: 25 })),
    { do: 'say', who: 'pip', text: 'The Chapel of Mulch bought a whole quota of that!' },
    { do: 'say', who: 'pip', text: 'Their old priest said so. From a snowmobile.' },
    // The turn: the scheme is busted, and the whole thing is glitter.
    { do: 'stinger', id: 'mystery' },
    cut(BAY_TALK.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'The Chapel quota is due Friday. You sold them sawdust.' },
    cut(BAY_TALK.single('cedric', 'mcu')),
    beat('pause'),
    cut(BAY_TALK.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'The whole scheme is busted, Cedric. It is glitter all the way down.' },
    // Button: the spreader is not his to keep, and Cedric's facepalm holds.
    cut(BAY_TALK.single('cedric', 'mcu')),
    { do: 'say', who: 'cedric', text: 'Can I at least keep the spreader?' },
    cut(BAY_TALK.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'No.' },
    cut(shot('cedric', 'mcu', { toward: 'tansy', side: 25 })),
    { do: 'gesture', who: 'cedric', name: 'facepalm', s: 1.4 },
    { do: 'wait', s: 1.5 },
  ],
};

export const MULCH_PYRAMID_SCENES: SceneScript[] = [MULCH_PYRAMID_INTRO, MULCH_PYRAMID_WASPS, MULCH_PYRAMID_OUTRO];
