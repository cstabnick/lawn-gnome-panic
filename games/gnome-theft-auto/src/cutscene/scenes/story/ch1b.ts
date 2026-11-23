// Chapter 1 story scenes, second file: Two-Coat Tail (intro, the Patio Heights handover, outro).
// Owner: the Story A re-direction lane (docs/roadmaps/gta-redirect-story-a.md). Every id here is played by a quest in quests/chapter1.ts and checked by scenes.test.ts.
// Notes: docs/design/gnome-theft-auto/direction/scenes/two-coat-{intro,handover,outro}.md
import type { ScriptActor, ScriptVehicle, SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, reaction, shot } from '../../direct';
import { markOf, pathOf, rideOf, spot, up } from './kit';

type Look = NonNullable<ScriptActor['look']>;

const MAYOR_LOOK: Look = { hat: 0x2c3e50, shirt: 0x8b1e24, beard: 0xeeeeee, glasses: true };
const MABEL_LOOK: Look = { hat: 0xf2c230, shirt: 0x2b2b2b, hair: { color: 0xbbbbbb, style: 'pigtails' }, beard: null };
/** HOA bodyguards (no preset in cast.ts). */
const GUARD_LOOK: Look = { hat: 0x18181e, shirt: 0x23262e };
const PRESS_LOOK: Look = { hat: 0x6b6b6b, shirt: 0xe6e0c8 };

const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

/** A cast member's own vehicle (rideOf: kind and Pay 'n' Glaze look) at a point. */
function ride(id: string, castId: string, at: Vec2, yaw: number, extra: Partial<ScriptVehicle> = {}): ScriptVehicle {
  return { id, ...rideOf(castId), at, yaw, ...extra };
}

// ---- Stage marks (quests/stages/turfton.ts, turftonB.ts) ---------------------------------------------------------------
const CH_PLAYER = markOf('city-hall-steps', 'player');
const JUNIPER = markOf('city-hall-steps', 'juniper');
const MAYOR = markOf('city-hall-steps', 'mayor-mulch');
const PRESS_A = markOf('city-hall-steps', 'press', 0);
const PRESS_B = markOf('city-hall-steps', 'press', 1);
const CITY_HALL_ARRIVAL = pathOf('city-hall-steps', 'city-hall-approach');

/** The handover is shot close: the Mayor and Vesper stand 6 m apart (the stage marks are 20 m apart). */
const PATIO_VESPER: Vec2 = [145, -156];
const PATIO_MAYOR: Vec2 = [151, -156];
const PATIO_GUARD_A = markOf('patio-gallery', 'hoa-bodyguard', 0);
const PATIO_GUARD_B = markOf('patio-gallery', 'hoa-bodyguard', 1);
const PATIO_PLAYER = markOf('patio-gallery', 'player');

// Two-shots of a conversation share one side of the line (coverage): the same pair, the same side, all scene.
const PRESS = coverage('juniper', 'press-a', 1);
const MAYOR_COV = coverage('juniper', 'mayor', -1);
const MABEL_COV = coverage('juniper', 'mabel', 1);
const JPLAYER = coverage('juniper', 'player', 1);
const LEDGER = coverage('mayor', 'vesper', 1);

/** Two-Coat Tail, scene 1: Juniper's noon statement, the Mayor's scissors, the taxi that won't take the player. */
export const TWO_COAT_INTRO: SceneScript = {
  id: 'two-coat-intro',
  stage: { kind: 'world' },
  music: 'turfton',
  ambience: 'crowd',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/two-coat-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, at: CH_PLAYER.at, yaw: CH_PLAYER.yaw },
    { id: 'juniper', preset: 'juniper', name: 'Councilwoman Vance', at: JUNIPER.at, yaw: JUNIPER.yaw },
    { id: 'mayor', name: 'Mayor Mulch', look: MAYOR_LOOK, held: 'hedge-shears', at: MAYOR.at, yaw: MAYOR.yaw },
    { id: 'press-a', name: 'Reporter', look: PRESS_LOOK, at: PRESS_A.at, yaw: PRESS_A.yaw },
    { id: 'press-b', name: 'Photographer', look: PRESS_LOOK, at: PRESS_B.at, yaw: PRESS_B.yaw },
    { id: 'mabel', name: 'Mabel Kerbstone', look: MABEL_LOOK, hz: 104, hidden: true, seatedIn: 'taxi', at: [0, 0] },
  ],
  vehicles: [
    ride('juniper-ride', 'juniper', [24, -68.5], 0),
    ride('mayor-ride', 'mayor-mulch', [40, -68.5], 0),
    { id: 'taxi', kind: 'ride-on', at: [120, -62.5], yaw: -Math.PI / 2, tint: 0xf2c230, hidden: true },
  ],
  steps: [
    // Hook: Juniper, on the statement, before anyone has moved.
    cut(shot('juniper', 'mcu')),
    { do: 'say', who: 'juniper', text: 'Citizens. The grass is growing at a healthy, legal height.' },
    // One reporter question, covered from the Councilwoman's side.
    cut(PRESS.single('press-a', 'mcu')),
    { do: 'say', who: 'press-a', text: 'Councilwoman, what about the medians?' },
    cut(PRESS.single('juniper', 'mcu')),
    { do: 'say', who: 'juniper', text: 'The medians are in very capable hands. Mayor, the scissors.' },
    // The Mayor poses for cameras that are not there. Juniper does not look.
    cut(MAYOR_COV.single('mayor', 'ms')),
    { do: 'gesture', who: 'mayor', name: 'cheer', s: 1.4, async: true },
    beat('pause'),
    { do: 'say', who: 'mayor', text: 'Snip! Fresh paint, fresh paving, fresh promises!' },
    { do: 'face', who: 'juniper', at: 'mayor', s: 0.3 },
    cut(MAYOR_COV.single('juniper', 'mcu')),
    { do: 'say', who: 'juniper', text: 'Reginald calls me The Trowel. For once, he has a point.' },
    // The Mayor climbs onto his candy-red Ride-On and putters off east (the tail starts here).
    cut(MAYOR_COV.single('mayor', 'mcu')),
    { do: 'say', who: 'mayor', text: 'Ta-ta, Trowel! Ding, ding!' },
    { do: 'enter', who: 'mayor', vehicle: 'mayor-ride' },
    { do: 'cam', shot: { kind: 'track', pos: up(30, -52, 3), who: 'mayor-ride', fov: 50 } },
    { do: 'drive', vehicle: 'mayor-ride', path: [[40, -68.5], [40, -57.5], [100, -57.5]], speed: 8, arrive: false, async: true },
    { do: 'horn', vehicle: 'mayor-ride' },
    { do: 'wait', s: 3.5 },
    // The turn and the objective: one place name, in her voice.
    cut(shot('juniper', 'mcu')),
    { do: 'say', who: 'juniper', text: 'He is off to Patio Heights. Follow him and photograph the handover.' },
    { do: 'give', from: 'juniper', to: 'player', prop: 'field-camera' },
    cut(JPLAYER.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Why me?' },
    { do: 'face', who: 'juniper', at: 'player', s: 0.3 },
    cut(JPLAYER.single('juniper', 'mcu')),
    { do: 'say', who: 'juniper', text: 'You have no reputation to lose. Bring me the photos.' },
    // Mabel Kerbstone's taxi pulls up. She is refused, and she does not mind.
    { do: 'spawn', id: 'taxi', at: [120, -62.5], yaw: -Math.PI / 2 },
    { do: 'spawn', id: 'mabel' },
    { do: 'cam', shot: { kind: 'track', pos: up(22, -66, 2.2), who: 'taxi', fov: 50 } },
    { do: 'drive', vehicle: 'taxi', path: CITY_HALL_ARRIVAL, speed: 14 },
    { do: 'cam', shot: { kind: 'cut', pos: up(14.6, -66.4, 1.1), look: 'mabel', fov: 40 } },
    { do: 'say', who: 'mabel', text: 'Turfton Taxi! Hop in, dear.' },
    cut(MABEL_COV.single('juniper', 'mcu')),
    { do: 'say', who: 'juniper', text: 'They are on a job, Mabel.' },
    { do: 'walk', who: 'player', path: [[4.5, -70.5]], speed: 1.2, async: true },
    { do: 'drive', vehicle: 'taxi', path: [[0, -62.5], [-50, -62.5]], speed: 11, arrive: false, async: true },
    { do: 'cam', shot: { kind: 'cut', pos: up(14.6, -66.4, 1.1), look: 'mabel', fov: 40 } },
    { do: 'say', who: 'mabel', text: 'Not on a job, dear. Suit yourself.' },
  ],
};

/** Two-Coat Tail, arrival: the Mayor hands Vesper a ledger at Patio Heights; the player's photo gets them caught. */
export const TWO_COAT_HANDOVER: SceneScript = {
  id: 'two-coat-handover',
  stage: { kind: 'world' },
  music: 'heist',
  ambience: 'night',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/two-coat-handover.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, at: PATIO_PLAYER.at, yaw: PATIO_PLAYER.yaw },
    { id: 'vesper', preset: 'vesper', at: PATIO_VESPER, yaw: towards(PATIO_VESPER, PATIO_MAYOR) },
    { id: 'mayor', name: 'Mayor Mulch', look: MAYOR_LOOK, at: PATIO_MAYOR, yaw: towards(PATIO_MAYOR, PATIO_VESPER) },
    { id: 'guard-a', name: 'HOA Bodyguard', look: GUARD_LOOK, at: PATIO_GUARD_A.at, yaw: towards(PATIO_GUARD_A.at, PATIO_PLAYER.at) },
    { id: 'guard-b', name: 'HOA Bodyguard', look: GUARD_LOOK, at: PATIO_GUARD_B.at, yaw: PATIO_GUARD_B.yaw },
  ],
  vehicles: [
    ride('vesper-car', 'vesper', [156, -134], Math.PI),
    ride('mayor-ride', 'mayor-mulch', [146, -134], Math.PI),
  ],
  steps: [
    // Hook: the Mayor's line over the ledger.
    cut(LEDGER.single('mayor', 'mcu')),
    { do: 'say', who: 'mayor', text: 'The median leases, Vesper. Every one signed in ink. Mostly.' },
    { do: 'give', from: 'mayor', to: 'vesper', prop: 'ledger' },
    { do: 'give', from: 'vesper', to: 'mayor', prop: 'sealed-letter', s: 1 },
    // Vesper, first seen: the villain stinger and his theme. Low, alone, still. Rung one of the coats ladder.
    { do: 'stinger', id: 'villain' },
    { do: 'music', track: 'villain', fade: 0.6 },
    cut(LEDGER.single('vesper', 'mcu', { height: 'low' })),
    { do: 'say', who: 'vesper', text: 'A second coat, Barnaby? Streaky.' },
    // The flash, from the player's camera: a hedge-level cut, then the Mayor is caught.
    cut({ kind: 'cut', pos: up(147.5, -143.5, 1.0), look: 'vesper', fov: 50 }),
    { do: 'sfx', id: 'shutter' },
    { do: 'shake', amp: 0.03, s: 0.3 },
    beat('pause'),
    cut(LEDGER.single('mayor', 'mcu')),
    { do: 'say', who: 'mayor', text: 'That was a different glaze!' },
    ...reaction('player', { size: 'mcu', hold: 'pause' }),
    // The guards turn on the player. Vesper files, he does not fight.
    { do: 'face', who: 'guard-a', at: 'player', s: 0.4 },
    { do: 'face', who: 'guard-b', at: 'player', s: 0.4 },
    cut(LEDGER.single('vesper', 'mcu', { height: 'low' })),
    { do: 'say', who: 'vesper', text: 'Gentlemen. We have a photographer.' },
    // The threat: silence, a low close-up, the hat. Then the chase starts as the guards come.
    { do: 'music', track: null, fade: 0.5 },
    cut(LEDGER.single('vesper', 'cu', { height: 'low' })),
    { do: 'gesture', who: 'vesper', name: 'tipHat', s: 1.2 },
    { do: 'say', who: 'vesper', text: 'Nice hat.' },
    { do: 'music', track: 'chase', fade: 0.5 },
    { do: 'walk', who: 'guard-a', path: [[149, -148]], run: true, async: true },
    { do: 'walk', who: 'guard-b', path: [[150, -150]], run: true, async: true },
    cut(shot('player', 'ms', { toward: 'vesper' })),
    { do: 'wait', s: 2.5 },
  ],
};

/** Two-Coat Tail, chapter-side outro: the photos reach City Hall, Reginald measures the grass and the Trowel bites back. */
export const TWO_COAT_OUTRO: SceneScript = {
  id: 'two-coat-outro',
  stage: { kind: 'world' },
  music: 'warm',
  ambience: 'street',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/two-coat-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, at: CH_PLAYER.at, yaw: CH_PLAYER.yaw, held: 'field-camera' },
    { id: 'juniper', preset: 'juniper', at: JUNIPER.at, yaw: JUNIPER.yaw },
    { id: 'reginald', preset: 'reginald', seatedIn: 'van', hidden: true, at: [0, 0] },
  ],
  vehicles: [
    ride('van', 'reginald', CITY_HALL_ARRIVAL[0], -Math.PI / 2, { hidden: true }),
  ],
  steps: [
    // Hook: the photos change hands.
    cut(spot('city-hall-steps', 'two-shot')),
    { do: 'give', from: 'player', to: 'juniper', prop: 'field-camera' },
    { do: 'walk', who: 'player', path: [[4.5, -70.5]], speed: 1.2, async: true },
    cut(shot('juniper', 'mcu', { toward: 'player' })),
    { do: 'say', who: 'juniper', text: 'Signing the medians straight over to Vesper. Barnaby, Barnaby.' },
    // Reginald's Code-Enforcement van on the z = -60 road.
    { do: 'spawn', id: 'van' },
    { do: 'spawn', id: 'reginald' },
    { do: 'cam', shot: { kind: 'track', pos: up(10, -58.5, 2), who: 'van', fov: 50 } },
    { do: 'drive', vehicle: 'van', path: CITY_HALL_ARRIVAL, speed: 12 },
    cut(shot('juniper', 'mcu', { toward: 'player' })),
    { do: 'exit', who: 'reginald' },
    { do: 'walk', who: 'reginald', path: [[11, -63.5], [10, -64.5]], speed: 1.8 },
    // Reginald, measuring, shot from above. The siblings never look at each other: both face the player's side of the lawn.
    cut(shot('reginald', 'ms', { height: 'high', toward: 'player' })),
    { do: 'gesture', who: 'reginald', name: 'think', s: 1.4 },
    { do: 'say', who: 'reginald', text: 'Juniper. Your grass is a quarter-inch proud.' },
    cut(shot('juniper', 'mcu', { toward: 'player' })),
    { do: 'say', who: 'juniper', text: 'Reginald. Your boss is a crook.' },
    // Enforcing: the one time he is shot from below.
    cut(shot('reginald', 'ms', { height: 'low', toward: 'player' })),
    { do: 'say', who: 'reginald', text: 'Calling an officer a crook is four-oh-four dash B.' },
    cut(shot('juniper', 'mcu', { toward: 'player' })),
    { do: 'say', who: 'juniper', text: 'Then write it, Reginald. Slowly.' },
    // Button: he gets in his van, and the Trowel has the last word as it pulls away.
    { do: 'enter', who: 'reginald', vehicle: 'van' },
    { do: 'cam', shot: { kind: 'track', pos: up(14, -58.5, 2), who: 'van', fov: 50 } },
    { do: 'drive', vehicle: 'van', path: [[14, -62.5], [0, -62.5], [-50, -62.5]], speed: 14, arrive: false },
    cut(shot('juniper', 'mcu', { toward: 'player' })),
    { do: 'say', who: 'juniper', text: 'Drive carefully, Reginald. Mind the grass.' },
  ],
};

export const CH1B_SCENES: Record<string, SceneScript> = {
  'two-coat-intro': TWO_COAT_INTRO,
  'two-coat-handover': TWO_COAT_HANDOVER,
  'two-coat-outro': TWO_COAT_OUTRO,
};
