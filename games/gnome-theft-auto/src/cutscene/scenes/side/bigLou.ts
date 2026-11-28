// Big Lou's Dry-Hat Embargo (Big Lou, bouncer at The Gnomecino velvet rope): dusk on the neon front, low hero shots of
// Lou, few words. Staged at gnomecino-door (quests/stages/turfton.ts) and at the VIP's Zero-Turn downtown.
import type { SceneScript } from '../../script';
import { beat, coverage, cut, shot } from '../../direct';
import { above, castRide, markOf, stageCut, walkOf } from './kit';

const LOU = markOf('gnomecino-door', 'big-lou');
const PLAYER = markOf('gnomecino-door', 'player');
const PATRON = walkOf('gnomecino-door', 'patron');
const LOU_PACE = walkOf('gnomecino-door', 'big-lou');

const TALK = coverage('lou', 'you', 1);
/** Lou and the damp patron at the rope: Lou turns to him, so the single is on that eyeline. */
const ROPE = coverage('lou', 'p1', -1);

export const BIG_LOU_INTRO: SceneScript = {
  id: 'sq-big-lou-embargo-intro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sq-big-lou-embargo-intro.md' },
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
  vehicles: [castRide('big-lou', 'lou', undefined, undefined, { headlights: true })],
  steps: [
    // 1. The hook is Lou already pacing the rope; one wide, no dialogue, the one caption.
    cut(stageCut('gnomecino-door', 'overhead', 46)),
    { do: 'walk', who: 'lou', path: [LOU_PACE[1], LOU_PACE[0]], speed: 0.9, async: true },
    { do: 'walk', who: 'p1', path: [PATRON[1], PATRON[0], PATRON[1]], speed: 0.8, async: true },
    { do: 'caption', text: 'THE GNOMECINO. GUEST LIST ONLY.' },
    { do: 'wait', s: 2.0 },
    { do: 'caption', text: null },
    // 2. The first patron, damp hope on an MS, turned to Lou.
    { do: 'face', who: 'p1', at: 'lou', s: 0.3 },
    cut(shot('p1', 'ms', { toward: 'lou', side: -30 })),
    { do: 'say', who: 'p1', text: 'It\'s dry. It\'s basically dry.' },
    beat('beat'),
    // Lou, low and flat: two-word sentences, turned to the patron.
    { do: 'face', who: 'lou', at: 'p1', s: 0.3 },
    cut(ROPE.single('lou', 'mcu', { height: 'low' })),
    { do: 'say', who: 'lou', text: 'Felt.' },
    { do: 'sfx', id: 'cloth', at: 'lou', gain: 0.6, async: true },
    { do: 'gesture', who: 'lou', name: 'point', s: 1.2, async: true },
    { do: 'say', who: 'lou', text: 'Not fleece.' },
    cut(shot('p1', 'ms', { toward: 'lou', side: -30 })),
    { do: 'sfx', id: 'gulp', at: 'p1', async: true },
    { do: 'gesture', who: 'p1', name: 'facepalm', s: 1.6 },
    beat('beat'),
    // 3. The turn: the Mayor pushes up the queue to the rope.
    { do: 'face', who: 'mayor', at: 'lou', s: 0.3, async: true },
    { do: 'walk', who: 'mayor', path: [[68.5, -40]], speed: 1.2, async: true },
    cut(shot('mayor', 'ms', { toward: 'lou', side: -30 })),
    { do: 'say', who: 'mayor', text: 'Lou. Tell them the Mayor is here. Two coats, no drips.' },
    // Lou does not turn to the Mayor: he answers from the rope, to the player's side of the line.
    { do: 'face', who: 'lou', at: 'you', s: 0.3 },
    cut(TALK.single('lou', 'mcu', { height: 'low' })),
    { do: 'say', who: 'lou', text: 'Two-Coat. Damp is damp.' },
    cut(shot('mayor', 'ms', { toward: 'lou', side: -30 })),
    { do: 'say', who: 'mayor', text: 'It\'s a different glaze.' },
    beat('pause'),
    // Lou turns back to the player for his one-word answer, then a held silence.
    { do: 'face', who: 'lou', at: 'you', s: 0.3 },
    cut(TALK.single('lou', 'mcu', { height: 'low' })),
    { do: 'say', who: 'lou', text: 'Dry.' },
    // 4. A held silence, then the player asks for the job; Lou gives it as the button, the stakes in it.
    beat('silence'),
    cut(TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'What\'s the job?' },
    beat('beat'),
    { do: 'sfx', id: 'paper', at: 'lou', gain: 0.7, async: true },
    cut(TALK.single('lou', 'mcu', { height: 'low' })),
    { do: 'say', who: 'lou', text: 'Red Caps took my crate. Forty towels. Bring it back. Dry.' },
    { do: 'wait', s: 1.0 },
  ],
};

export const BIG_LOU_VIP: SceneScript = {
  id: 'sq-big-lou-embargo-vip',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sq-big-lou-embargo-vip.md' },
  music: 'tension',
  ambience: 'night',
  actors: [
    { id: 'you', player: true, at: [-86, -44], yaw: Math.PI / 2 },
  ],
  vehicles: [
    { id: 'vip', kind: 'zero-turn', at: [-93, -54], yaw: Math.PI / 2, loadout: { paint: 0xf2f2f2, finish: 'pearl', tyre: 'whitewall', lamp: 'square', beam: 'xenon' } },
  ],
  props: [
    { id: 'crate', prefab: 'crate', at: [-93, -48], yaw: 0.2, size: 1.2 },
  ],
  steps: [
    // 1. The hook is the VIP's handbrake release; the wide shows the car lit at the kerb.
    { do: 'sfx', id: 'handbrake-release', at: 'vip' },
    { do: 'lights', vehicle: 'vip', on: true },
    cut({ kind: 'cut', pos: above(-98, -46, 3.5), look: 'vip', fov: 48 }),
    { do: 'caption', text: 'Recovered: one crate, forty towels, one tired gnome.' },
    { do: 'wait', s: 2.2 },
    { do: 'caption', text: null },
    // 2. The player to the car, close, at the bonnet.
    cut({ kind: 'cut', pos: above(-84, -49, 1.6), look: 'you', fov: 32 }),
    { do: 'say', who: 'you', text: 'Nobody touch the bonnet.' },
    beat('beat'),
    // 3. Lou on the phone, the car in shot: the voice is off screen.
    // E09: a slow drift on the car instead of a fourth identical cut.
    cut({ kind: 'dolly', from: above(-96, -54, 1.4), to: above(-95, -53, 1.4), look: 'vip', s: 4, fov: 36 }),
    { do: 'say', who: 'Big Lou', text: 'Bring it round. Not a speck of mud on that car.', sfx: 'phone' },
    beat('pause'),
    cut({ kind: 'cut', pos: above(-84, -49, 1.6), look: 'you', fov: 32 }),
    { do: 'say', who: 'you', text: 'On it.' },
    beat('beat'),
    // 4. The button: the car, lit, waiting for the drive (a slow pull back, not a repeat of the opening wide).
    cut({ kind: 'dolly', from: above(-98, -46, 3.5), to: above(-100, -45, 3.8), look: 'vip', s: 3, fov: 48 }),
    { do: 'wait', s: 1.4 },
  ],
};

export const BIG_LOU_OUTRO: SceneScript = {
  id: 'sq-big-lou-embargo-outro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sq-big-lou-embargo-outro.md' },
  music: 'heist',
  ambience: 'night',
  actors: [
    { id: 'you', player: true, at: [62.5, -6], yaw: Math.PI, seatedIn: 'zt', seat: 0 },
    { id: 'lou', preset: 'big lou', at: LOU.at, yaw: LOU.yaw },
  ],
  vehicles: [
    { id: 'zt', kind: 'zero-turn', from: 'player', at: [62.5, -6], yaw: Math.PI, loadout: { paint: 0xf2f2f2, finish: 'pearl', tyre: 'whitewall' } },
  ],
  steps: [
    // 1. The hook: the VIP car rolls up to the rope, the camera tracking it.
    { do: 'cam', shot: { kind: 'track', pos: above(66.5, -36, 1.0), who: 'zt', fov: 38 } },
    { do: 'drive', vehicle: 'zt', path: [[62.5, -20], [62.5, -30]], speed: 5 },
    // 2. White-glove inspection: Lou walks the flank, two-word lines.
    { do: 'caption', text: 'WHITE-GLOVE INSPECTION. ONE PASS.' },
    { do: 'walk', who: 'lou', path: [[65, -33]], speed: 1.0 },
    { do: 'caption', text: null },
    { do: 'face', who: 'lou', at: 'zt', s: 0.4 },
    { do: 'sfx', id: 'tap', at: 'lou', gain: 0.6, async: true },
    cut(TALK.single('lou', 'mcu', { height: 'low' })),
    { do: 'say', who: 'lou', text: 'Hm.' },
    { do: 'say', who: 'lou', text: 'Not a speck.' },
    cut(TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'It\'s a Zero-Turn. It was always going to have a speck.' },
    cut(TALK.single('lou', 'mcu', { height: 'low' })),
    { do: 'say', who: 'lou', text: 'Dry.' },
    cut(TALK.single('you', 'mcu')),
    // 3. The player climbs out and walks to the rope: the payoff, Lou's one longer sentence, then the bowler.
    { do: 'exit', who: 'you', s: 2.2 },
    { do: 'walk', who: 'you', path: [[64, -28.5]], speed: 1.2 },
    { do: 'face', who: 'lou', at: 'you', s: 0.3 },
    cut(TALK.single('lou', 'mcu', { height: 'low' })),
    { do: 'say', who: 'lou', text: 'Dusty is a word for other people.' },
    { do: 'hold', who: 'lou', prop: 'microfiber-bowler' },
    cut(TALK.single('lou', 'mcu', { height: 'low' })),
    { do: 'sfx', id: 'cloth', at: 'lou', async: true },
    { do: 'give', from: 'lou', to: 'you', prop: 'microfiber-bowler', s: 1.2 },
    { do: 'stinger', id: 'triumph' },
    { do: 'say', who: 'lou', text: 'Keep it dry.' },
    // 4. The button: Lou's bow, the rope lifted for the player, and the camera pulls back on them.
    { do: 'gesture', who: 'lou', name: 'bow', s: 1.4 },
    { do: 'cam', shot: { kind: 'dolly', from: above(64.4, -23.6, 2.0), to: above(66, -20, 4), look: 'you', s: 5, fov: 40 } },
    { do: 'wait', s: 0.6 },
  ],
};

export const BIG_LOU_SCENES: SceneScript[] = [BIG_LOU_INTRO, BIG_LOU_VIP, BIG_LOU_OUTRO];
