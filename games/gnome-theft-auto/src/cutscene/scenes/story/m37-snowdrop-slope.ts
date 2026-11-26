// Story row 37 (m37-snowdrop-slope): Snowdrop Slope. Three scenes. Intro (first light at Theo's bend): Theo, who stirs his
// barrel and offers tea before anything, tells the crew the plows now know the bend and names Gentian Bootlace, the only
// one who owes him,. Mid (the foot of the Bootlace Tow): two HOA salt-plows crest the
// rise behind the crew, cutscene only; the driver holds up the slope's missing salt permit. Outro (the lodge door, snow
// glare): Gentian Bootlace's first scene, the bunks, and a woolly sock on every peg; one quiet beat for Pip.
// Notes: docs/design/gnome-theft-auto/direction/scenes/m37-snowdrop-slope-{intro,mid,outro}.md
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, pushIn, reaction, shot } from '../../direct';
import { carMark, markOf, spot, up } from './kit';

const BEND = 'theo-bend-dawn';
const FOOT = 'bootlace-tow-foot';
const DOOR = 'woolly-sock-door';
const HOA_LOOK = { hat: 0x18181e, shirt: 0xc9b99b };

// ---- 1. Intro: the bend at first light --------------------------------------------------------------------------------------
const B_THEO = markOf(BEND, 'theo');
const B_YOU = markOf(BEND, 'player');
const B_PIP = markOf(BEND, 'pip');
const TALK = coverage('theo', 'player', 1);
const PIPTALK = coverage('pip', 'theo', 1);

/**
 * Dawn at the bend. Theo pours tea into three tin mugs before he will hear a word; the plows know the bend now, and the
 * only one who owes him anything is Gentian. Warm, close, firelit: the chapter's found family against the cold wides.
 */
export const M37_INTRO: SceneScript = {
  id: 'm37-snowdrop-slope-intro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'frost',
  ambience: 'snow',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m37-snowdrop-slope-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, held: null, at: B_YOU.at, yaw: B_YOU.yaw },
    { id: 'theo', preset: 'thermos theo', held: 'cocoa-mug', at: B_THEO.at, yaw: B_THEO.yaw },
    { id: 'pip', preset: 'pip', held: null, at: B_PIP.at, yaw: B_PIP.yaw },
  ],
  props: [
    { id: 'mug1', prefab: 'cocoa-mug', at: [47.4, -343.2], yaw: 0.4, size: 0.22, by: 'h' },
    { id: 'mug2', prefab: 'cocoa-mug', at: [47.9, -344.4], yaw: 1.2, size: 0.22, by: 'h' },
  ],
  steps: [
    // Hook: steam off the pot, the ladle going round, and a tin mug set down hard enough to ring.
    cut(spot(BEND, 'barrel')),
    { do: 'sfx', id: 'pour', at: 'theo', gain: 0.6, async: true },
    { do: 'gesture', who: 'theo', name: 'lean', s: 1.2, async: true },
    { do: 'wait', s: 1.4 },
    { do: 'sfx', id: 'clink', at: 'theo', gain: 0.5, async: true },
    // Setup: the rule of the bend, then who he is.
    cut(PIPTALK.single('theo', 'ms')),
    { do: 'say', who: 'theo', text: "Tea first, trouble after. That is the bend's only rule." },
    // Pip, bouncing, with the question nobody asked.
    cut(PIPTALK.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'The plows know this bend now! Can we hide in the barrel?' },
    cut(PIPTALK.single('theo', 'mcu', { height: 'low' })),
    { do: 'say', who: 'theo', text: 'A barrel keeps tea warm, Pip. It does not keep plows out.' },
    // The turn: the bend is for resting, not hiding.
    cut(pushIn('theo', 'mcu', 3.2, { toward: 'pip', side: -25 })),
    { do: 'say', who: 'theo', text: 'A bend is for resting, friend. Not for hiding.' },
    ...reaction('player', { toward: 'theo', hold: 'pause' }),
    cut(PIPTALK.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Then where do we go?' },
    // The road, from the road's own side.
    cut(spot(BEND, 'road')),
    { do: 'gesture', who: 'theo', name: 'point', s: 1.4, async: true },
    { do: 'wait', s: 1.4 },
    cut(PIPTALK.single('theo', 'mcu')),
    { do: 'say', who: 'theo', text: 'Up the rope-tow road. Gentian Bootlace keeps the Woolly Sock Lodge.' },
    cut(PIPTALK.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Why would she help us?' },
    cut(PIPTALK.single('theo', 'mcu')),
    { do: 'say', who: 'theo', text: 'She owes me. She is the only one. Kindness pays slow.' },
    cut(PIPTALK.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'What does she owe you?' },
    cut(PIPTALK.single('theo', 'mcu', { height: 'low' })),
    { do: 'say', who: 'theo', text: 'A thermos. A favour. Forty socks.' },
    // Button: the mug goes round, and somewhere down the highway a diesel that is not a friend.
    cut(shot('theo', 'ms', { toward: 'player', side: 40 })),
    { do: 'give', from: 'theo', to: 'player', prop: 'cocoa-mug', s: 1.1 },
    { do: 'say', who: 'theo', text: 'Drink. Then drive. Roads are slick, friend. Clay is brittle.' },
    { do: 'sfx', id: 'engine-rev', at: up(10, -310, 1), gain: 0.4, async: true },
    cut(shot('pip', 'mcu', { toward: 'theo', side: 25 })),
    { do: 'gesture', who: 'pip', name: 'flinch', s: 0.9, async: true },
    { do: 'wait', s: 1.4 },
  ],
};

// ---- 2. Mid: the plows crest the rise ---------------------------------------------------------------------------------------
const F_YOU = markOf(FOOT, 'player');
const F_PIP = markOf(FOOT, 'pip');
const PLOW1 = carMark(FOOT, 'plow-1');
const PLOW2 = carMark(FOOT, 'plow-2');
const TOWTALK = coverage('pip', 'player', 1);
/** Where the plows stop: a pylon's length from the tow base, blades down. */
const STOP1: Vec2 = [-268, -992];
const STOP2: Vec2 = [-262, -1002];

/**
 * Noon at the tow base. The cotton reels clack; then a diesel under the wind, and two HOA salt-plows crest the rise,
 * blades down, spraying salt on a hill that has never needed any. The driver reads out the slope's missing permit.
 */
export const M37_MID: SceneScript = {
  id: 'm37-snowdrop-slope-mid',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'tension',
  ambience: 'snow',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m37-snowdrop-slope-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, held: null, at: F_YOU.at, yaw: F_YOU.yaw },
    { id: 'pip', preset: 'pip', held: null, at: F_PIP.at, yaw: F_PIP.yaw },
    { id: 'grit', name: 'HOA Plow Driver', look: HOA_LOOK, seatedIn: 'plow-1', at: [0, 0] },
    { id: 'frost', name: 'HOA Plow Driver', look: HOA_LOOK, seatedIn: 'plow-2', at: [0, 0] },
  ],
  vehicles: [
    { id: 'plow-1', kind: PLOW1.kind, at: [-238, -968], yaw: PLOW1.yaw, headlights: true },
    { id: 'plow-2', kind: PLOW2.kind, at: [-230, -978], yaw: PLOW2.yaw, headlights: true },
  ],
  steps: [
    // Hook: reels clacking, Pip's ear turning, and the wind carrying a diesel it should not.
    cut(spot(FOOT, 'pylon')),
    { do: 'sfx', id: 'tap', at: up(-298, -1020, 2), gain: 0.4, async: true },
    { do: 'wait', s: 1.2 },
    { do: 'sfx', id: 'engine-rev', at: 'plow-1', gain: 0.35, async: true },
    cut(TOWTALK.single('pip', 'mcu')),
    { do: 'gesture', who: 'pip', name: 'flinch', s: 0.8, async: true },
    { do: 'say', who: 'pip', text: 'Do you hear that? That is a plow sound.' },
    // The reveal: the rise, then two plows over it.
    { do: 'stinger', id: 'danger' },
    cut(spot(FOOT, 'ridge')),
    { do: 'drive', vehicle: 'plow-1', path: [PLOW1.at, STOP1], speed: 6, async: true },
    { do: 'drive', vehicle: 'plow-2', path: [PLOW2.at, STOP2], speed: 6, async: true },
    { do: 'wait', s: 3.2 },
    { do: 'horn', vehicle: 'plow-1' },
    { do: 'wait', s: 1.0 },
    // The driver, low, through a loudhailer: the one joke the HOA is allowed.
    cut(shot('grit', 'ms', { height: 'low', toward: 'player', side: 30 })),
    { do: 'say', who: 'grit', text: 'This slope has no salt permit. Please hold still.', hz: 96 },
    ...reaction('pip', { toward: 'player', gesture: 'flinch', size: 'mcu', hold: 'pause' }),
    // The plan, said fast, and the one thing Pip is right about.
    cut(TOWTALK.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Skis from the lodge rack! Up the tow, down through the gates!' },
    cut(TOWTALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Why gates?' },
    cut(TOWTALK.single('pip', 'mcu', { height: 'low' })),
    { do: 'say', who: 'pip', text: 'Plows are wide. Gates are narrow. That is all of science.' },
    // Button: the plows idle, blades down, and the tow keeps clacking as if nothing has happened.
    cut(spot(FOOT, 'wide')),
    { do: 'horn', vehicle: 'plow-2' },
    { do: 'sfx', id: 'tap', at: up(-298, -1020, 2), gain: 0.4, async: true },
    { do: 'wait', s: 2.0 },
  ],
};

// ---- 3. Outro: the lodge door -----------------------------------------------------------------------------------------------
const D_GEN = markOf(DOOR, 'gentian');
const D_YOU = markOf(DOOR, 'player');
const D_PIP = markOf(DOOR, 'pip');
const GEN = coverage('gentian', 'player', 1);
const GENPIP = coverage('gentian', 'pip', 1);

/**
 * Snow glare at the lodge door. Gentian counts boots in threes, says the plows turned at her gate, and shows them the
 * pegs: a woolly sock on every one, one of them Pip's. One quiet beat, no gag on top; then the lodge is theirs.
 */
export const M37_OUTRO: SceneScript = {
  id: 'm37-snowdrop-slope-outro',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'warm',
  ambience: 'snow',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m37-snowdrop-slope-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, held: null, at: D_YOU.at, yaw: D_YOU.yaw },
    { id: 'gentian', preset: 'gentian', held: 'slalom-flag', at: D_GEN.at, yaw: D_GEN.yaw },
    { id: 'pip', preset: 'pip', held: null, at: D_PIP.at, yaw: D_PIP.yaw },
  ],
  props: [
    // L95: socks drying on the pegs, seen only here. The crew's own socks are the last three on the near rack.
    { id: 'rack-a', prefab: 'sock-rack', at: [-441.4, -1024.2], yaw: Math.PI / 2, size: 1.5, by: 'w' },
    { id: 'rack-b', prefab: 'sock-rack', at: [-441.4, -1016.4], yaw: Math.PI / 2, size: 1.5, by: 'w' },
  ],
  steps: [
    // Hook: the shout, before the picture settles.
    cut(spot(DOOR, 'wide')),
    { do: 'sfx', id: 'door-creak', at: 'gentian', gain: 0.5, async: true },
    { do: 'gesture', who: 'gentian', name: 'cheer', s: 1.2, async: true },
    { do: 'wait', s: 1.8 },
    cut(shot('gentian', 'ms', { toward: 'player', side: 25 })),
    { do: 'say', who: 'gentian', text: 'Up, up, up! Stamp your boots! Three stamps, I said three!' },
    { do: 'intro', who: 'gentian' },
    { do: 'sfx', id: 'crunch', at: 'player', gain: 0.5, async: true },
    // Pip, arriving at speed, and the gate that held.
    cut(GENPIP.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'The plows! We lost them! Mostly! One is stuck in the tow!' },
    cut(GENPIP.single('gentian', 'mcu')),
    { do: 'say', who: 'gentian', text: 'They turned at my gate. I pointed at one. Firmly.' },
    // The pegs, along the wall: the picture says the rest.
    { do: 'walk', who: 'gentian', path: [[-436.4, -1023.2]], speed: 1.8, async: true },
    cut(spot(DOOR, 'pegs')),
    { do: 'sfx', id: 'cloth', at: up(-441, -1024, 1.5), gain: 0.5, async: true },
    { do: 'wait', s: 1.6 },
    cut(GENPIP.single('gentian', 'mcu')),
    { do: 'say', who: 'gentian', text: 'Bunks are made. A woolly sock on every peg. Nobody sleeps cold here.' },
    // The quiet beat: Pip finds his name on a sock. Music out, one held silence, no gag on top.
    { do: 'music', track: null, fade: 0.6 },
    cut(GENPIP.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'There is one with my name on it.' },
    beat('beat'),
    cut(GENPIP.single('gentian', 'mcu')),
    { do: 'say', who: 'gentian', text: 'Of course there is. Put your foot in it.' },
    ...reaction('pip', { toward: 'gentian', gesture: 'nod', size: 'mcu', side: 25, hold: 'silence' }),
    { do: 'music', track: 'warm', fade: 1.6 },
    // Button: the lodge is theirs, and she is still counting.
    cut(shot('gentian', 'ms', { toward: 'player', side: 40 })),
    { do: 'gesture', who: 'gentian', name: 'point', s: 1.2, async: true },
    { do: 'say', who: 'gentian', text: 'Bunk, wardrobe, a hook for every hat. This lodge is yours. Three layers!' },
    { do: 'wait', s: 1.0 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm37-snowdrop-slope-intro': M37_INTRO,
  'm37-snowdrop-slope-mid': M37_MID,
  'm37-snowdrop-slope-outro': M37_OUTRO,
};
