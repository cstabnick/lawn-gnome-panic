// The Mulch Pyramid Scheme (giver Cedric "Double-Bag" Peat): a sleazy infomercial. Bright noon, warm music, quick cuts,
// ad-copy captions, planted satisfied customers and a slow push-in on the product. The beat (wasps and a guard) is at
// patio-gate at dawn; the payoff at Side-Valve Salvage, where the infomercial collapses into workshop realism.
import type { SceneScript } from '../../script';
import { above, castRide, markOf, stageCut, walkOf } from './kit';

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

export const MULCH_PYRAMID_INTRO: SceneScript = {
  id: 'sq-mulch-pyramid-intro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'noon',
  title: 'The Mulch Pyramid Scheme',
  music: 'warm',
  ambience: 'street',
  actors: [
    { id: 'you', player: true, at: PLAYER.at, yaw: PLAYER.yaw },
    { id: 'cedric', preset: 'cedric', at: PITCH[0], yaw: CEDRIC.yaw, held: 'acorn-flour-sack' },
    { id: 'burt', preset: 'burt', at: BURT.at, yaw: BURT.yaw, held: 'espresso-cup' },
    { id: 'john', preset: 'bodega', name: 'John Bodega', at: KEEPER[0], yaw: Math.PI / 2, held: 'broom' },
  ],
  vehicles: [castRide('cedric', 'spreader')],
  steps: [
    { do: 'cam', shot: { kind: 'cut', pos: above(-62, 96, 1.5), look: 'cedric', fov: 40 } },
    { do: 'caption', text: 'RESULTS NOT TYPICAL' },
    { do: 'walk', who: 'cedric', path: [PITCH[1], PITCH[0]], speed: 1.0, async: true },
    { do: 'wait', s: 2.5 },
    { do: 'caption', text: null },
    // Two extras first: Burt on his coffee, John sweeping.
    { do: 'cam', shot: { kind: 'cut', pos: above(-70, 98, 1.3), look: 'burt', fov: 34 } },
    { do: 'say', who: 'cedric', text: 'Friend! You, with the coffee! Do you have a lawn?' },
    { do: 'say', who: 'burt', text: 'I have a lawn.' },
    { do: 'say', who: 'john', text: 'Don\'t sell him anything.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-74, 96, 1.2), look: 'burt', fov: 30 } },
    { do: 'say', who: 'burt', text: 'Forty years of lawn, and I never once smelled like a Chapel. Now I am a gardener.' },
    { do: 'caption', text: 'ACT NOW' },
    { do: 'wait', s: 1.5 },
    { do: 'caption', text: null },
    // Then the player: a slow push-in on the sack.
    { do: 'cam', shot: { kind: 'dolly', from: above(-63, 90, 1.4), to: above(-66.5, 88.5, 0.9), look: 'cedric', s: 6, fov: 40 } },
    { do: 'say', who: 'cedric', text: 'It is not a pyramid, friend. It is an inverted compost funnel. Everybody is rooted. Nobody is underground.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-72, 90, 1.5), look: 'you', fov: 40 } },
    { do: 'say', who: 'you', text: 'What is actually in the bags?' },
    { do: 'say', who: 'cedric', text: 'Dyed sawdust. Craft glitter. The glitter is the expensive part.' },
    { do: 'caption', text: 'NOW WITH 40% MORE WASPS' },
    { do: 'say', who: 'cedric', text: 'Wasps love it. Wasps are our most loyal customers.' },
    { do: 'caption', text: null },
    { do: 'cam', shot: { kind: 'cut', pos: above(-64, 97, 1.5), look: 'cedric', fov: 40 } },
    { do: 'say', who: 'cedric', text: 'Here is the job. Take the spreader to Patio Heights and drop the first load at the top of the drive. Then bring it home before the HOA seizes it.' },
    { do: 'say', who: 'you', text: 'Patio Heights? That is Vesper Thorne\'s street.' },
    { do: 'say', who: 'cedric', text: 'Every lawn up there needs fluffing. Nobody has ever checked what is in the bag.', stinger: 'comic' },
    { do: 'caption', text: 'LIMITED TIME. LIMITED SOIL.' },
    { do: 'wait', s: 1 },
    { do: 'caption', text: null },
    { do: 'walk', who: 'you', path: [[-69, 92], [-67, 93]], speed: 1.2 },
    { do: 'cam', shot: { kind: 'track', pos: above(-61, 98, 1.3), who: 'cedric', fov: 40 } },
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
  actors: [
    { id: 'you', player: true, seatedIn: 'rig', at: [146, -141] },
    { id: 'gary', name: 'Gate-Guard Gary', look: { hat: 0x1f3a5f, shirt: 0x2c3e50, glasses: true }, at: GARY.at, yaw: GARY.yaw, held: 'ledger' },
  ],
  vehicles: [castRide('cedric', 'rig', [146, -141], 0, { from: 'player' })],
  props: [
    { id: 'wasp1', prefab: 'bee', at: [147.5, -139.6], size: 0.35 },
    { id: 'wasp2', prefab: 'bee', at: [144.5, -142.4], size: 0.35 },
    { id: 'wasp3', prefab: 'bee', at: [148.8, -143.2], size: 0.35 },
  ],
  steps: [
    { do: 'cam', shot: { kind: 'cut', pos: above(150, -105, 6), look: 'rig', fov: 46 } },
    { do: 'say', who: 'you', text: 'Glitter. It is in the wheels, the seat, and I think my ears.' },
    // The wasps, swarming round the rig.
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
    // Gary wakes up from his binder and walks to the gap.
    { do: 'cam', shot: { kind: 'cut', pos: above(152, -118, 1.6), look: 'gary', fov: 36 } },
    { do: 'walk', who: 'gary', path: GARY_PACE, speed: 1.2, async: true },
    { do: 'gesture', who: 'gary', name: 'point', s: 1.4, async: true },
    { do: 'sfx', id: 'alarm', at: 'gary' },
    { do: 'say', who: 'gary', text: 'Unlicensed mulch rig. Glitter-purple, not on the approved colour list. Hat Watch, come in.' },
    { do: 'shake', amp: 0.12, s: 1.2 },
    { do: 'say', who: 'gary', text: 'Wasps in attendance. Dispatch, you will want a net.' },
    { do: 'stinger', id: 'danger' },
    { do: 'say', who: 'you', text: 'We need to move the rig. Now.' },
    { do: 'cam', shot: { kind: 'track', pos: above(140, -134, 1.4), who: 'rig', fov: 42 } },
    { do: 'wait', s: 2 },
  ],
};

export const MULCH_PYRAMID_OUTRO: SceneScript = {
  id: 'sq-mulch-pyramid-outro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'noon',
  title: 'The Mulch Pyramid Scheme',
  music: 'warm',
  ambience: 'street',
  actors: [
    { id: 'you', player: true, seatedIn: 'rig', at: [-150, 72] },
    { id: 'tansy', preset: 'tansy', at: TANSY.at, yaw: TANSY.yaw },
    { id: 'pip', preset: 'pip', at: PIP.at, yaw: PIP.yaw },
    { id: 'cedric', preset: 'cedric', at: [-158, 66], yaw: Math.PI / 2, held: 'acorn-flour-sack' },
  ],
  vehicles: [castRide('cedric', 'rig', [-150, 72], 0, { from: 'player' }), castRide('tansy', 'zero')],
  steps: [
    { do: 'cam', shot: stageCut(BAY, 'wide') },
    { do: 'caption', text: 'SIDE-VALVE SALVAGE. MID-MORNING. NO INFOMERCIAL.' },
    { do: 'wait', s: 2 },
    { do: 'caption', text: null },
    { do: 'say', who: 'tansy', text: 'You brought the spreader back. Don\'t get glitter on the Zero-Turn. It is the only thing in here that runs.' },
    { do: 'exit', who: 'you', s: 2.2 },
    { do: 'gesture', who: 'pip', name: 'sit', s: 0.1, async: true },
    { do: 'walk', who: 'cedric', path: [[-152, 68], [-147, 69]], speed: 1.2, async: true },
    { do: 'say', who: 'cedric', text: 'Tansy, love. A misunderstanding. The bags are artisanal. Hand-dyed.' },
    { do: 'say', who: 'tansy', text: 'I opened one. It is sawdust, glitter, and a wasp.' },
    { do: 'gesture', who: 'tansy', name: 'crossArms', s: 1.6, async: true },
    { do: 'say', who: 'cedric', text: 'It is a funnel, Tansy. Everybody is on it.' },
    { do: 'say', who: 'pip', text: 'Father Loam told the whole Chapel about that funnel. Nobody listens to a man on a snowmobile.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-146, 60, 1.6), look: 'cedric', fov: 40 } },
    { do: 'stinger', id: 'mystery' },
    { do: 'say', who: 'tansy', text: 'The Chapel of Mulch quota is due Friday, and you have been selling it sawdust. The whole scheme is busted, Cedric. It is glitter all the way down.' },
    { do: 'cam', shot: { kind: 'dolly', from: above(-141, 66, 1.3), to: above(-144, 64, 1.1), look: 'cedric', s: 6, fov: 36 } },
    { do: 'say', who: 'cedric', text: 'Can I at least keep the spreader?' },
    { do: 'say', who: 'tansy', text: 'No.' },
    { do: 'gesture', who: 'cedric', name: 'facepalm', s: 1.4 },
    { do: 'wait', s: 1 },
  ],
};

export const MULCH_PYRAMID_SCENES: SceneScript[] = [MULCH_PYRAMID_INTRO, MULCH_PYRAMID_WASPS, MULCH_PYRAMID_OUTRO];
