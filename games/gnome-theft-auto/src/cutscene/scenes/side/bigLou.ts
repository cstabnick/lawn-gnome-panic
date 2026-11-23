// Big Lou's Dry-Hat Embargo (Big Lou, bouncer at The Gnomecino velvet rope): night, neon, low-angle hero shots of Lou
// looking up at him, slow orbits, and Lou speaking little and slowly. Staged at gnomecino-door (quests/stages/turfton.ts)
// and downtown in the west alley where the Red Caps ran off with the towel crate.
import type { SceneScript } from '../../script';
import { above, castRide, markOf, walkOf } from './kit';

const LOU = markOf('gnomecino-door', 'big-lou');
const PLAYER = markOf('gnomecino-door', 'player');
const PATRON = walkOf('gnomecino-door', 'patron');
const LOU_PACE = walkOf('gnomecino-door', 'big-lou');

export const BIG_LOU_INTRO: SceneScript = {
  id: 'sq-big-lou-embargo-intro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'night',
  title: "Big Lou's Dry-Hat Embargo",
  music: 'heist',
  ambience: 'night',
  actors: [
    { id: 'you', player: true, at: PLAYER.at, yaw: PLAYER.yaw },
    { id: 'lou', preset: 'big lou', at: LOU.at, yaw: LOU.yaw, held: 'ledger' },
    { id: 'p1', name: 'Patron', look: { hat: 0x2a2a33, shirt: 0x7a2e8f, pants: 0x1a1a22 }, at: PATRON[0], yaw: Math.PI / 2 },
    { id: 'p2', name: 'Patron', look: { hat: 0xd9d4c4, shirt: 0x2f6f5a, pants: 0x202020 }, at: [66, -38], yaw: Math.PI / 2 },
    { id: 'mayor', name: 'Mayor Mulch', look: { hat: 0xc21f2a, shirt: 0xc21f2a, pants: 0x6a1218, beard: null }, at: [66, -42], yaw: Math.PI / 2 },
  ],
  vehicles: [castRide('big-lou', 'lou')],
  steps: [
    // The rope, from the kerb: a slow dolly up on Lou, then the neon.
    { do: 'cam', shot: { kind: 'dolly', from: above(60, -26, 1.2), to: above(59, -27, 1.2), look: 'lou', s: 6, fov: 34 } },
    { do: 'caption', text: 'THE GNOMECINO. GUEST LIST ONLY.' },
    { do: 'walk', who: 'p1', path: [PATRON[1], PATRON[0], PATRON[1]], speed: 0.8, async: true },
    { do: 'walk', who: 'lou', path: [LOU_PACE[1], LOU_PACE[0]], speed: 0.9 },
    { do: 'caption', text: null },
    // The first patron: a damp hat and a hopeful face.
    { do: 'cam', shot: { kind: 'cut', pos: above(64.5, -33, 0.7), look: 'p1', fov: 36 } },
    { do: 'say', who: 'p1', text: 'It\'s dry. It\'s basically dry.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(64, -31, 0.6), look: 'lou', fov: 40 } },
    { do: 'wait', s: 0.6 },
    { do: 'say', who: 'lou', text: 'Felt.' },
    { do: 'wait', s: 0.8 },
    { do: 'say', who: 'lou', text: 'Not fleece.' },
    { do: 'gesture', who: 'lou', name: 'point', s: 1.2, async: true },
    { do: 'gesture', who: 'p1', name: 'facepalm', s: 1.6 },
    // The job: a two-shot over the player's shoulder onto Lou.
    { do: 'cam', shot: { kind: 'cut', pos: above(60.5, -22.5, 1.6), look: 'lou', fov: 34 } },
    { do: 'say', who: 'lou', text: 'My crate. Forty towels. Gone.' },
    { do: 'say', who: 'you', text: 'Who took it?' },
    { do: 'say', who: 'lou', text: 'Red Caps. Three of them. The west alley.' },
    { do: 'cam', shot: { kind: 'orbit', around: 'lou', radius: 3.5, height: 1.0, fromYaw: 0.3, toYaw: -0.6, s: 6, fov: 38 } },
    { do: 'say', who: 'lou', text: 'Bring the crate back. Dry. Then I let you in.' },
    // The tie: tonight's VIP, the Mayor, in the queue behind Lou.
    { do: 'cam', shot: { kind: 'cut', pos: above(74.5, -42, 1.4), look: 'mayor', fov: 34 } },
    { do: 'say', who: 'mayor', text: 'Lou. Tell them the Mayor is here. Two coats, no drips.' },
    { do: 'say', who: 'lou', text: 'Mayor. Two-Coat. Wet is wet. Your car is the problem, not you.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(63.5, -24, 1.4), look: 'you', fov: 36 } },
    { do: 'say', who: 'you', text: 'And the car?' },
    { do: 'say', who: 'lou', text: 'The VIP\'s Zero-Turn. West end of downtown. Mind the bonnet.' },
    { do: 'cam', shot: { kind: 'track', pos: above(56, -30, 1.6), who: 'lou', fov: 42 } },
    { do: 'say', who: 'lou', text: 'Do it right. I give you my bowler.' },
    { do: 'wait', s: 1.0 },
  ],
};

export const BIG_LOU_VIP: SceneScript = {
  id: 'sq-big-lou-embargo-vip',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'night',
  music: 'tension',
  ambience: 'night',
  actors: [
    { id: 'you', player: true, at: [-86, -44], yaw: Math.PI / 2 },
  ],
  vehicles: [
    { id: 'vip', kind: 'zero-turn', at: [-90, -56], yaw: Math.PI / 2, loadout: { paint: 0xf2f2f2, finish: 'pearl', tyre: 'whitewall', lamp: 'square', beam: 'xenon' } },
  ],
  props: [
    { id: 'crate', prefab: 'crate', at: [-93, -48], yaw: 0.2, size: 1.2 },
  ],
  steps: [
    // The recovered crate, and the VIP's car spotless at the kerb.
    { do: 'cam', shot: { kind: 'dolly', from: above(-80, -34, 2.2), to: above(-82, -36, 2.2), look: 'crate', s: 5, fov: 40 } },
    { do: 'caption', text: 'Recovered: one crate, forty towels, one tired gnome.' },
    { do: 'caption', text: null },
    { do: 'cam', shot: { kind: 'cut', pos: above(-96, -54, 1.4), look: 'vip', fov: 36 } },
    { do: 'say', who: 'you', text: 'Nobody touch the bonnet.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-86, -52, 0.8), look: 'vip', fov: 44 } },
    { do: 'say', who: 'Big Lou', text: 'Bring it round. Not a speck of mud on that car.', sfx: 'phone' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-84, -52, 1.5), look: 'you', fov: 36 } },
    { do: 'say', who: 'you', text: 'On it.' },
    { do: 'wait', s: 0.6 },
  ],
};

export const BIG_LOU_OUTRO: SceneScript = {
  id: 'sq-big-lou-embargo-outro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'night',
  music: 'heist',
  ambience: 'night',
  actors: [
    { id: 'you', player: true, at: [62.5, -6], yaw: Math.PI, seatedIn: 'zt', seat: 0 },
    { id: 'lou', preset: 'big lou', at: LOU.at, yaw: LOU.yaw },
    { id: 'mayor', name: 'Mayor Mulch', look: { hat: 0xc21f2a, shirt: 0xc21f2a, pants: 0x6a1218, beard: null }, at: [58, -40], yaw: Math.PI / 2, hidden: true },
  ],
  vehicles: [
    { id: 'zt', kind: 'zero-turn', from: 'player', at: [62.5, -6], yaw: Math.PI, loadout: { paint: 0xf2f2f2, finish: 'pearl', tyre: 'whitewall' } },
  ],
  steps: [
    // The VIP car rolls up to the rope.
    { do: 'cam', shot: { kind: 'track', pos: above(66.5, -36, 1.0), who: 'zt', fov: 38 } },
    { do: 'drive', vehicle: 'zt', path: [[62.5, -20], [62.5, -30]], speed: 5 },
    // White-glove inspection: Lou walks the flank, the camera low beside him.
    { do: 'caption', text: 'WHITE-GLOVE INSPECTION. ONE PASS.' },
    { do: 'walk', who: 'lou', path: [[65, -33]], speed: 1.0 },
    { do: 'cam', shot: { kind: 'dolly', from: above(66.4, -36.5, 1.0), to: above(66.4, -30, 1.0), look: 'lou', s: 7, fov: 36 } },
    { do: 'walk', who: 'lou', path: [[65, -27]], speed: 0.8 },
    { do: 'caption', text: null },
    { do: 'face', who: 'lou', at: 'zt', s: 0.4 },
    { do: 'say', who: 'lou', text: 'Hm.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(64.4, -23.6, 1.0), look: 'lou', fov: 34 } },
    { do: 'say', who: 'lou', text: 'Not a speck.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(66, -33.5, 1.4), look: 'you', fov: 36 } },
    { do: 'say', who: 'you', text: 'It\'s a Zero-Turn. It was always going to have a speck.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(64.4, -23.6, 1.0), look: 'lou', fov: 34 } },
    { do: 'say', who: 'lou', text: 'Dusty is a word for other people.' },
    // The player climbs out and the Mayor comes in from the dark.
    { do: 'exit', who: 'you', s: 2.2 },
    { do: 'spawn', id: 'mayor' },
    { do: 'cam', shot: { kind: 'track', pos: above(65.8, -38.5, 1.2), who: 'mayor', fov: 38 } },
    { do: 'walk', who: 'mayor', path: [[63.8, -36], [66.5, -31]], speed: 1.1 },
    { do: 'face', who: 'mayor', at: 'lou', s: 0.3, async: true },
    { do: 'face', who: 'lou', at: 'mayor', s: 0.3 },
    { do: 'cam', shot: { kind: 'cut', pos: above(68.6, -33.4, 1.3), look: 'mayor', fov: 34 } },
    { do: 'say', who: 'mayor', text: 'Evening, Lou. Fresh coat. Ribbon-cutting at ten.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(66.4, -23.6, 1.0), look: 'lou', fov: 34 } },
    { do: 'say', who: 'lou', text: 'Dry head. Round the back for wet ones.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(68.6, -33.4, 1.3), look: 'mayor', fov: 34 } },
    { do: 'say', who: 'mayor', text: 'It\'s a different glaze.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(66.4, -23.6, 1.0), look: 'lou', fov: 30 } },
    { do: 'wait', s: 0.8 },
    { do: 'say', who: 'lou', text: 'Dry.' },
    { do: 'walk', who: 'mayor', path: [[69, -29], [73, -29]], speed: 1.0, async: true },
    // The bowler changes hands. Lou lifts the rope.
    { do: 'hold', who: 'lou', prop: 'microfiber-bowler' },
    { do: 'walk', who: 'you', path: [[64, -28.5]], speed: 1.2 },
    { do: 'face', who: 'lou', at: 'you', s: 0.3 },
    { do: 'cam', shot: { kind: 'cut', pos: above(64.4, -23.6, 1.4), look: 'lou', fov: 38 } },
    { do: 'give', from: 'lou', to: 'you', prop: 'microfiber-bowler', s: 1.2 },
    { do: 'stinger', id: 'triumph' },
    { do: 'say', who: 'lou', text: 'Lou\'s own. Keep it dry.' },
    { do: 'gesture', who: 'lou', name: 'bow', s: 1.4 },
    { do: 'cam', shot: { kind: 'dolly', from: above(64.4, -23.6, 2.0), to: above(66, -20, 4), look: 'you', s: 5, fov: 40 } },
    { do: 'wait', s: 0.6 },
  ],
};

export const BIG_LOU_SCENES: SceneScript[] = [BIG_LOU_INTRO, BIG_LOU_VIP, BIG_LOU_OUTRO];
