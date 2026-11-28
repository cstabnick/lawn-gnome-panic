// Story row 70 scenes: The Even Cut, part 3 (The Gilded Lawn-Throne) and the final's two mid-scenes. The final's intro
// and outro are the kept scenes in ch5.ts (even-cut-intro, even-cut-outro); parts 1 and 2 are in m70a-even-cut.ts.
// Tension 9 -> 10 -> 2. One gag a scene at most, and none on the jam or on the hat.
// - even-cut-p3-intro (day): porcelain boots on the verge in step; on the deck, through the player's eyes, the Gilded
//   Lawn-Throne comes up out of the bridge with the crown of a top hat over its back; Vesper's PA starts polite and comes
//   apart ("Chipped! Muddy! Unregulated!"); Pip notices he is shouting; the hat line's last rung lands on the player's
//   eyes, then a silence; Juniper files the gag (Mr Thorne is now parked illegally); Tansy's three clauses; the hat turns.
// - even-cut-p3-outro (day): the Porcelain Guard, beaten and whole, sit on the kerb in a row, and the third shuffles a
//   hand's width to make it even (the gag); the throne's lamp, a porcelain lantern, comes on; the PA cannot finish a
//   sentence; Pip on the phone; Tansy: the intake is open, and he is frightened.
// - even-cut-jam (beat 1 of the final, as the crack starts): sincere, no gag, no music. The Stone in the maw's teeth, the
//   player's hands on it, the engine dying, Bracken: "It holds." The throne comes down off the roof onto the road, and
//   Vesper, on the ground for the first time, says what he wanted, and tips his hat.
// - even-cut-hat (beat 2, as the choice starts): the top hat rolls to a stop at the player's feet; the player picks it
//   up; Vesper is shot from above for the first time, bare-headed, his face still; he says the hat line one last time,
//   and means it. Then Pip with the Golden Acorn (too hot: the one gag, Pip coping), and the two endings in three lines.
// The Grand Combine is the cutscene-only prefab grand-combine-boss at the boss runner's scale 5 (nose +z, rolling south),
// as m70a-even-cut.ts draws it; it moves between cuts, never inside a shot. Actors cannot stand on it (it is a prop), so
// the deck is the player's own eyes, and everyone else is on the road.
// Stages: quests/stages/story/s70-even-cut.ts. Notes: docs/design/gnome-theft-auto/direction/scenes/<id>.md.
import type { GnomeLook } from '@lawn/gnome';
import type { ScriptProp, SceneScript, Step, Vec2 } from '../../script';
import { beat, coverage, cut, reaction, shot } from '../../direct';
import { markOf, spot, up } from './kit';

const NOTES = 'docs/design/gnome-theft-auto/direction/scenes/';
const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

// ---- The machine and its throne ---------------------------------------------------------------------------------------
/** The boss runner draws grand-combine-boss at scale 5: about 12.4 m across the intake. */
export const COMBINE_SIZE = 12.4;
/** Heights at scale 5: the rear hull's top (the deck) and the bridge's crown plate (where the throne comes up). */
const HULL_TOP = 5.8;
const CROWN = 8.5;
/** The Combine (nose +z) with its centre at z. */
export function combineProp(z: number, hidden = false): ScriptProp {
  return { id: 'combine', prefab: 'grand-combine-boss', at: [0, z], yaw: 0, size: COMBINE_SIZE, by: 'w', hidden };
}
/** The open deck behind the bridge (as p2 left it): two beige deck segments on the rear hull. */
function deckProps(z: number): ScriptProp[] {
  return [-1.9, 1.9].map((x, i) => ({ id: `deck-${i}`, prefab: 'combine-test-deck', at: up(x, z - 3.6, HULL_TOP), yaw: 0, size: 3.6, by: 'w' as const }));
}
/**
 * The Gilded Lawn-Throne on the bridge of a Combine centred at z, `drop` metres below its full height (it rises out of
 * the crown plate), and the crown of Vesper's top hat just over its back (he is never seen up there: the hat is enough).
 */
function throneOn(z: number, drop: number, hatYaw = 0): ScriptProp[] {
  return [
    { id: 'throne', prefab: 'glaze-seat-throne', at: up(0, z + 1.6, CROWN - drop), yaw: 0, size: 1.0 },
    { id: 'hat', prefab: 'borrowed-top-hat', at: up(0, z + 1.5, CROWN + 1.2 - drop), yaw: hatYaw, size: 0.3 },
  ];
}
/** Move the throne (and the hat over its back) between cuts. */
function throneTo(z: number, drop: number, hatYaw = 0): Step[] {
  return [
    { do: 'spawn', id: 'throne', at: up(0, z + 1.6, CROWN - drop), yaw: 0 },
    { do: 'spawn', id: 'hat', at: up(0, z + 1.5, CROWN + 1.2 - drop), yaw: hatYaw },
  ];
}
/** The throne's lamp: a porcelain lantern on its right post (one of the lanterns the porch lost; nobody says so). */
const lampOn = (z: number, hidden: boolean): ScriptProp =>
  ({ id: 'lamp', prefab: 'porcelain-lantern', at: up(0.55, z + 1.3, CROWN + 1.25), yaw: 0, size: 0.32, by: 'h', hidden });

/** The Porcelain Guard: white glaze from hat to boot (the Watch's porcelain squad colours). */
const GUARD: Partial<GnomeLook> = { hat: 0xf4f4f8, shirt: 0xe6e8f0, pants: 0xe6e8f0, skin: 0xfafafa, beard: null };
/** Vesper in the finale: his top hat on (it hides the old cone), the calipers put away. */
export const VESPER_HATTED: Partial<GnomeLook> = { equipment: { head: 'borrowed-top-hat' } };
/** Vesper with the hat off: porcelain to the crown, like Clara. */
export const VESPER_BARE: Partial<GnomeLook> = { hat: 0xfafafa };
const VOICE = 'Vesper Thorne';

// ---- p3 intro: the throne rises --------------------------------------------------------------------------------------
const P3Z = -240;
const DECK = 'e70-deck-road';
const D_G = [0, 1, 2].map((n) => markOf(DECK, 'porcelain-guard', n));
const D_PIP = markOf(DECK, 'pip');
const SAFE_TANSY = markOf('dust-safehouse', 'tansy');
const HALL_JUNIPER = markOf('city-hall-steps', 'juniper');
/** The player's eyes on the deck (where p2 landed them), looking along it to the bridge. */
const EYE = up(-0.6, P3Z - 4.4, HULL_TOP + 1.3);
const EYE_IN = up(-0.4, P3Z - 2.4, HULL_TOP + 1.7);
const HAT_AT = up(0, P3Z + 1.5, CROWN + 1.35);

/**
 * Day, the meridian. Porcelain boots in step on the verge. On the deck, the player's own eyes: the throne coming up out of
 * the roof at the far end with a hat's crown over its back. The PA starts as Vesper always is, polite and complete, and
 * comes apart into exclamation marks. Pip hears it. The last rung of the hat line comes straight down the deck at the
 * player; silence; Juniper's dry line breaks it; Tansy gives the job in three clauses; the hat turns.
 */
export const P3_INTRO: SceneScript = {
  id: 'even-cut-p3-intro',
  stage: { kind: 'world' },
  sky: 'noon',
  ambience: 'wind',
  music: 'tension',
  radio: 0,
  direction: { notes: `${NOTES}even-cut-p3-intro.md`, kind: 'intro' },
  actors: [
    ...D_G.map((m, i) => ({ id: `g${i + 1}`, name: 'Porcelain Guard', look: GUARD, hz: 100, held: null, at: m.at, yaw: m.yaw })),
    { id: 'pip', preset: 'pip', held: null, at: D_PIP.at, yaw: D_PIP.yaw },
    { id: 'tansy', preset: 'tansy', held: 'brass-wrench', at: SAFE_TANSY.at, yaw: towards(SAFE_TANSY.at, [271.5, 48.5]) },
    { id: 'juniper', preset: 'juniper', held: 'scribbled-note', at: HALL_JUNIPER.at, yaw: HALL_JUNIPER.yaw },
  ],
  props: [combineProp(P3Z), ...deckProps(P3Z), ...throneOn(P3Z, 1.0)],
  steps: [
    // Hook: low on the road, porcelain boots coming on in step, the machine's wheels behind them.
    cut(spot(DECK, 'boots')),
    { do: 'walk', who: 'g1', path: [[-8.4, -239]], speed: 1.4, async: true },
    { do: 'walk', who: 'g2', path: [[-8.4, -241]], speed: 1.4, async: true },
    { do: 'walk', who: 'g3', path: [[-8.4, -243]], speed: 1.4, async: true },
    { do: 'sfx', id: 'footsteps', at: 'g1', gain: 0.6, async: true },
    { do: 'sfx', id: 'engine-rev', at: 'combine', gain: 0.6, async: true },
    { do: 'shake', amp: 0.03, s: 2.6 },
    { do: 'wait', s: 2.6 },
    // The deck, the player's eyes: at its far end, over the bridge, something gilded coming up with a hat on top.
    { do: 'cam', shot: { kind: 'dolly', from: EYE, to: up(-0.55, P3Z - 4.0, HULL_TOP + 1.35), look: HAT_AT, s: 4.2, fov: 46 } },
    { do: 'sfx', id: 'door-creak', at: 'throne', gain: 0.6, async: true },
    { do: 'stinger', id: 'villain' },
    { do: 'say', who: VOICE, hz: 92, sfx: 'static', text: 'Friends. The meridian is closed for a scheduled cut. Please stand aside.' },
    // Up the flank from the verge: the throne all the way up now, gold in the sun.
    ...throneTo(P3Z, 0.4),
    cut(spot(DECK, 'flank')),
    { do: 'sfx', id: 'door-creak', at: 'throne', gain: 0.5, async: true },
    { do: 'music', track: 'villain', fade: 0.8 },
    { do: 'wait', s: 1.4 },
    ...throneTo(P3Z, 0),
    // The composure goes: the first exclamation marks he has ever used, over his own Guard.
    cut(shot('g2', 'ms', { side: -35, height: 'low' })),
    { do: 'say', who: VOICE, hz: 92, sfx: 'static', text: 'Look at yourselves! Chipped! Muddy! Unregulated!' },
    { do: 'face', who: 'pip', at: [0, P3Z], s: 0.2 },
    cut(shot('pip', 'mcu', { side: 30, handheld: 0.02 })),
    { do: 'say', who: 'pip', text: 'He\'s shouting. Vesper never shouts. That\'s new, right?' },
    cut(shot('tansy', 'mcu', { side: -20 })),
    { do: 'sfx', id: 'phone', at: 'tansy', gain: 0.3, async: true },
    { do: 'say', who: 'tansy', text: 'Shouting men miss things.' },
    // The last rung of the hat line, straight down the deck at the player's eyes.
    { do: 'cam', shot: { kind: 'dolly', from: up(-0.55, P3Z - 4.0, HULL_TOP + 1.35), to: EYE_IN, look: HAT_AT, s: 4.6, fov: 34 } },
    { do: 'say', who: VOICE, hz: 92, sfx: 'static', text: 'And to the gnome in that hat: tonight, it cracks.' },
    { do: 'music', track: null, fade: 0.4 },
    beat('silence'),
    // Juniper, on the City Hall steps, files the reply.
    cut(shot('juniper', 'mcu', { side: 20 })),
    { do: 'sfx', id: 'paper', at: 'juniper', gain: 0.5, async: true },
    { do: 'say', who: 'juniper', text: 'The counter-order is signed. As of noon, Mr Thorne is parked illegally.' },
    // Tansy means it: three clauses.
    { do: 'music', track: 'tension', fade: 0.6 },
    cut(shot('tansy', 'cu', { side: -20 })),
    { do: 'say', who: 'tansy', text: 'Crack the Guard. Reach the throne. Mind the blades.' },
    // Button: the hat over the throne's back turns, slowly, towards the player.
    cut({ kind: 'cut', pos: EYE_IN, look: HAT_AT, fov: 34 }),
    { do: 'wait', s: 0.8 },
    { do: 'spawn', id: 'hat', at: up(0, P3Z + 1.5, CROWN + 1.2), yaw: Math.PI * 0.85 },
    { do: 'sfx', id: 'creak', at: 'hat', gain: 0.4, async: true },
    { do: 'stinger', id: 'danger' },
    { do: 'wait', s: 1.6 },
  ],
};

// ---- p3 outro: an even row --------------------------------------------------------------------------------------------
const P3OZ = -136;
const KERB = 'e70-guard-kerb';
const K_G = [0, 1, 2].map((n) => markOf(KERB, 'porcelain-guard', n));
const K_YOU = markOf(KERB, 'player');
const K_PIP = markOf(KERB, 'pip');
const LAMP_AT = up(0.55, P3OZ + 1.3, CROWN + 1.4);

/**
 * Day, at the z = -120 crossing. Three porcelain guards, beaten and whole, sit on the kerb in a row; the third shuffles a
 * hand's width to make it even. The player looks at them. Then, high on the machine as it rolls on, the throne's lamp
 * comes on. The PA tries a sentence and cannot finish it. Pip on the phone: is the lamp good? Tansy: the intake is open,
 * and he is frightened. The player looks up at it.
 */
export const P3_OUTRO: SceneScript = {
  id: 'even-cut-p3-outro',
  stage: { kind: 'world' },
  sky: 'noon',
  ambience: 'street',
  radio: 0,
  direction: { notes: `${NOTES}even-cut-p3-outro.md`, kind: 'outro' },
  actors: [
    ...K_G.map((m, i) => ({ id: `g${i + 1}`, name: 'Porcelain Guard', look: GUARD, hz: 100, held: null, at: i === 2 ? [m.at[0], m.at[1] + 0.25] as Vec2 : m.at, yaw: m.yaw })),
    { id: 'player', player: true, held: null, at: K_YOU.at, yaw: K_YOU.yaw },
    { id: 'pip', preset: 'pip', held: null, at: K_PIP.at, yaw: K_PIP.yaw },
    { id: 'tansy', preset: 'tansy', held: 'brass-wrench', at: SAFE_TANSY.at, yaw: towards(SAFE_TANSY.at, [271.5, 48.5]) },
  ],
  props: [combineProp(P3OZ), ...deckProps(P3OZ), ...throneOn(P3OZ, 0, Math.PI * 0.85), lampOn(P3OZ, true)],
  steps: [
    // Hook: the row on the kerb. Two sit; the third, a hand's width out, shuffles in and sits. Even.
    cut(spot(KERB, 'kerb-low')),
    { do: 'gesture', who: 'g1', name: 'sit', s: 0.2, async: true },
    { do: 'gesture', who: 'g2', name: 'sit', s: 0.2, async: true },
    { do: 'sfx', id: 'engine-rev', at: 'combine', gain: 0.35, async: true },
    { do: 'wait', s: 1.0 },
    { do: 'walk', who: 'g3', path: [K_G[2].at], speed: 0.4 },
    { do: 'gesture', who: 'g3', name: 'sit', s: 0.2 },
    { do: 'sfx', id: 'squeak', at: 'g3', gain: 0.6 },
    { do: 'wait', s: 1.8 },
    ...reaction('player', { toward: 'g2', size: 'mcu', side: 30, hold: 'pause' }),
    // The lamp comes on, high on the roof as the machine rolls on.
    cut({ kind: 'cut', pos: up(-2.6, -122.6, 1.6), look: LAMP_AT, fov: 24 }),
    { do: 'wait', s: 0.6 },
    { do: 'spawn', id: 'lamp' },
    { do: 'sfx', id: 'pop', at: 'lamp', gain: 0.5, async: true },
    { do: 'stinger', id: 'reveal' },
    { do: 'wait', s: 1.4 },
    // The PA cannot get to the end of a sentence.
    { do: 'say', who: VOICE, hz: 92, sfx: 'static', music: 'villain', text: 'Friend. Please step off the... Please.' },
    // Pip, on the phone, on the far corner.
    { do: 'face', who: 'pip', at: 'player', s: 0.2 },
    cut(shot('pip', 'mcu', { side: 25 })),
    { do: 'sfx', id: 'phone', at: 'pip', gain: 0.4, async: true },
    { do: 'say', who: 'pip', text: 'The lamp\'s on! Is that good? It looks good. Is it good?' },
    cut(shot('tansy', 'mcu', { side: -20 })),
    { do: 'say', who: 'tansy', text: 'Intake\'s open. And he\'s frightened.' },
    // Button: the player looks up the machine at the lamp.
    { do: 'face', who: 'player', at: [0, P3OZ], s: 0.3 },
    cut(shot('player', 'ms', { side: 35, height: 'low' })),
    { do: 'sfx', id: 'engine-rev', at: 'combine', gain: 0.7, async: true },
    { do: 'shake', amp: 0.02, s: 1.8 },
    { do: 'wait', s: 1.8 },
  ],
};

// ---- The crossing: the jam and the hat -------------------------------------------------------------------------------
/** Jammed: the maw's front at z -19, where meridian-finale's set already lays the Stone. */
export const JAM_Z = -26;
const X = 'e70-crossing';
const X_HOLD = markOf(X, 'player', 0);
const X_BRACKEN = markOf(X, 'bracken', 0);
/** The throne set down on the road in front of the maw, facing the crossing; Vesper sits on it. */
export const THRONE_ROAD: Vec2 = [3.5, -9];
export const X_VESPER = markOf(X, 'vesper');
/** The lamp on the throne's right arm, once it is down. */
export const ROAD_LAMP = up(4.0, -9.0, 0.52);
const STONE = up(-2, -19, 0.8);

/**
 * The jam. Sincere: no gag, no music. The Stone in the maw's teeth, the machine pushing; the player's weight on it; the
 * engine dies. Bracken, two words. The hydraulic arm sets the throne down on the road in front of the stopped maw, and
 * Vesper, on the ground at last, says what he wanted, quietly, and tips his hat: the fight.
 */
export const JAM: SceneScript = {
  id: 'even-cut-jam',
  stage: { kind: 'world' },
  sky: 'noon',
  ambience: 'street',
  radio: 0,
  direction: { notes: `${NOTES}even-cut-jam.md`, kind: 'arrival' },
  actors: [
    { id: 'player', player: true, held: null, at: X_HOLD.at, yaw: X_HOLD.yaw },
    { id: 'bracken', preset: 'bracken', held: null, at: X_BRACKEN.at, yaw: X_BRACKEN.yaw },
    { id: 'vesper', preset: 'vesper', look: VESPER_HATTED, held: null, at: X_VESPER.at, yaw: towards(X_VESPER.at, X_HOLD.at), hidden: true },
  ],
  props: [
    combineProp(JAM_Z),
    { id: 'throne', prefab: 'glaze-seat-throne', at: up(0, JAM_Z + 1.6, CROWN), yaw: 0, size: 1.0 },
    { id: 'lamp', prefab: 'porcelain-lantern', at: up(0.55, JAM_Z + 1.3, CROWN + 1.25), yaw: 0, size: 0.32, by: 'h' },
  ],
  steps: [
    // Hook: the Stone in the teeth, the whole machine leaning on it.
    cut(spot(X, 'maw')),
    { do: 'sfx', id: 'crunch', at: STONE, gain: 0.9, async: true },
    { do: 'sfx', id: 'engine-rev', at: 'combine', gain: 0.9, async: true },
    { do: 'shake', amp: 0.12, s: 1.8 },
    { do: 'wait', s: 1.8 },
    // The player's weight on it.
    cut(shot('player', 'ms', { side: 75 })),
    { do: 'gesture', who: 'player', name: 'lean', s: 2.2, async: true },
    { do: 'sfx', id: 'thud', at: 'player', gain: 0.6, async: true },
    { do: 'shake', amp: 0.05, s: 1.4 },
    { do: 'wait', s: 2.0 },
    // The engine goes. Nothing moves. Wind.
    { do: 'ambience', bed: 'wind', fade: 1.2 },
    cut(spot(X, 'crossing-wide')),
    { do: 'sfx', id: 'engine-rev', at: 'combine', gain: 0.2, async: true },
    { do: 'wait', s: 2.8 },
    cut(shot('bracken', 'mcu', { toward: 'player', height: 'low', side: 20 })),
    beat('beat'),
    { do: 'say', who: 'bracken', text: 'It holds.' },
    beat('pause'),
    // The arm brings the throne down off the roof, over the dead maw, onto the road.
    { do: 'spawn', id: 'throne', at: up(1.6, -19.5, 5.4), yaw: 0 },
    { do: 'spawn', id: 'lamp', at: up(2.15, -19.8, 6.65), yaw: 0 },
    cut({ kind: 'cut', pos: up(10, -4, 1.4), look: up(2, -16, 4.5), fov: 46 }),
    { do: 'sfx', id: 'door-creak', at: 'throne', gain: 0.6, async: true },
    { do: 'wait', s: 1.4 },
    { do: 'spawn', id: 'throne', at: THRONE_ROAD, yaw: towards(THRONE_ROAD, X_HOLD.at) },
    { do: 'spawn', id: 'lamp', at: ROAD_LAMP, yaw: 0 },
    { do: 'spawn', id: 'vesper' },
    { do: 'gesture', who: 'vesper', name: 'sit', s: 0.2 },
    // Vesper on the ground: low, alone, space round him. His own voice, not the PA.
    cut(shot('vesper', 'ms', { toward: 'player', height: 'low', side: 25 })),
    { do: 'sfx', id: 'thud', at: 'throne', gain: 0.4, async: true },
    { do: 'music', track: 'villain', fade: 1.4 },
    { do: 'wait', s: 1.0 },
    { do: 'say', who: 'vesper', text: 'It was going to be level. All of it. Level.' },
    // Button: he tips the hat. A threat, the old way.
    cut(shot('vesper', 'mcu', { toward: 'player', height: 'low', side: 20 })),
    { do: 'gesture', who: 'vesper', name: 'tipHat', s: 1.4 },
    { do: 'stinger', id: 'danger' },
    beat('beat'),
  ],
};

const H_YOU = markOf(X, 'player', 1);
const H_PIP = markOf(X, 'pip');
const H_BRACKEN = markOf(X, 'bracken', 1);
const H_JUNIPER = markOf(X, 'juniper');
const H_TANSY = markOf(X, 'tansy');
const HV = coverage('vesper', 'player', 1);

/**
 * The hat. It rolls to a stop at the player's feet; the player picks it up. Vesper, bare-headed, is shot from above for
 * the first time: a still face, the hairline under where the hat was (a glass tick). He looks at the player's hat and
 * says the line one last time, and for once it is only what it says. Then Pip with the Golden Acorn, too hot to hold
 * (Pip coping: the one gag), and the choice in three lines, one from each side of the road.
 */
export const HAT: SceneScript = {
  id: 'even-cut-hat',
  stage: { kind: 'world' },
  sky: 'noon',
  ambience: 'wind',
  radio: 0,
  direction: { notes: `${NOTES}even-cut-hat.md`, kind: 'arrival' },
  actors: [
    { id: 'player', player: true, held: null, at: H_YOU.at, yaw: H_YOU.yaw },
    { id: 'vesper', preset: 'vesper', look: VESPER_BARE, held: null, at: X_VESPER.at, yaw: towards(X_VESPER.at, H_YOU.at) },
    { id: 'pip', preset: 'pip', held: 'golden-acorn-seed-cell', at: [-1.2, 9], yaw: Math.PI, hidden: true },
    { id: 'bracken', preset: 'bracken', held: null, at: H_BRACKEN.at, yaw: H_BRACKEN.yaw },
    { id: 'juniper', preset: 'juniper', held: 'scribbled-note', at: H_JUNIPER.at, yaw: H_JUNIPER.yaw },
    { id: 'tansy', preset: 'tansy', held: 'brass-wrench', at: H_TANSY.at, yaw: H_TANSY.yaw },
  ],
  props: [
    combineProp(JAM_Z),
    { id: 'throne', prefab: 'glaze-seat-throne', at: THRONE_ROAD, yaw: 0, size: 1.0 },
    { id: 'lamp', prefab: 'porcelain-lantern', at: ROAD_LAMP, yaw: 0, size: 0.32, by: 'h' },
    { id: 'hat', prefab: 'borrowed-top-hat', at: up(2.7, -6.4, 0), yaw: 1.0, size: 0.3 },
  ],
  steps: [
    // Hook: at road level, the hat rolling on its brim, rocking, and stopping.
    { do: 'gesture', who: 'vesper', name: 'sit', s: 0.2, async: true },
    cut({ kind: 'cut', pos: up(0.4, -2.6, 0.4), look: up(2.0, -5.0, 0.15), fov: 38 }),
    { do: 'sfx', id: 'tap', at: 'hat', gain: 0.4, async: true },
    { do: 'wait', s: 1.0 },
    { do: 'spawn', id: 'hat', at: up(1.9, -4.5, 0), yaw: 2.6 },
    { do: 'sfx', id: 'tap', at: 'hat', gain: 0.25, async: true },
    { do: 'wait', s: 1.6 },
    // The player bends and picks it up.
    cut(shot('player', 'ms', { toward: 'vesper', side: 40 })),
    { do: 'gesture', who: 'player', name: 'bow', s: 0.9 },
    { do: 'despawn', id: 'hat' },
    { do: 'hold', who: 'player', prop: 'borrowed-top-hat' },
    { do: 'sfx', id: 'cloth', at: 'player', gain: 0.5 },
    { do: 'wait', s: 0.9 },
    // Vesper from above, the first time: bare-headed, still. A tick of glass: the hairline.
    cut(HV.single('vesper', 'mcu', { height: 'high' })),
    { do: 'sfx', id: 'glass', at: 'vesper', gain: 0.12, async: true },
    { do: 'wait', s: 2.0 },
    cut(HV.single('player', 'mcu')),
    beat('pause'),
    cut(HV.single('vesper', 'cu', { height: 'high' })),
    beat('beat'),
    { do: 'say', who: 'vesper', text: '...It is a nice hat.' },
    beat('pause'),
    ...reaction('player', { toward: 'vesper', gesture: 'nod', size: 'mcu', side: 20, hold: 'pause' }),
    // Pip, at a run, with the Golden Acorn out of the core, passing it hand to hand.
    { do: 'music', track: 'warm', fade: 1.2 },
    { do: 'spawn', id: 'pip' },
    { do: 'face', who: 'player', at: 'pip', s: 0.3, async: true },
    cut({ kind: 'track', pos: up(-4.2, -2.0, 1.3), who: 'pip', fov: 44 }),
    { do: 'walk', who: 'pip', path: [H_PIP.at], run: true },
    { do: 'face', who: 'pip', at: 'player', s: 0.2 },
    cut(shot('pip', 'mcu', { toward: 'player', side: 25, handheld: 0.02 })),
    { do: 'gesture', who: 'pip', name: 'flinch', s: 0.8, async: true },
    { do: 'say', who: 'pip', text: 'It\'s warm! Why is it warm? Nobody said it\'d be warm!' },
    // The choice, one line from each side of the road.
    cut(shot('bracken', 'mcu', { toward: 'player', height: 'low', side: 20 })),
    { do: 'say', who: 'bracken', text: 'Give it to the ground. Let clover take the scar.' },
    cut(shot('tansy', 'mcu', { toward: 'player', side: -20 })),
    { do: 'say', who: 'tansy', text: 'Or wire it. Neon down the meridian. Races till dawn.' },
    cut(shot('juniper', 'mcu', { toward: 'player', side: 20 })),
    { do: 'say', who: 'juniper', text: 'Both are legal. I checked.' },
    // Button: the player between them on the crossing, the hat in one hand.
    cut({ kind: 'cut', pos: up(0.4, 13.5, 5.2), look: up(0.6, -3.0, 1.0), fov: 50 }),
    { do: 'wait', s: 2.2 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'even-cut-p3-intro': P3_INTRO,
  'even-cut-p3-outro': P3_OUTRO,
  'even-cut-jam': JAM,
  'even-cut-hat': HAT,
};
