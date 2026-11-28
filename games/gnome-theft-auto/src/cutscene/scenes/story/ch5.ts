// Chapter 5 story scenes: the finale's final part opens here (even-cut-intro) and the whole story ends here
// (even-cut-outro). Re-directed for E22, when the finale became four parts: the intro now plays after the deck fight
// (part 3, m70-even-cut.ts), in the street ahead of the Combine, and the outro opens with Clara before the epilogue.
// Notes: docs/design/gnome-theft-auto/direction/scenes/even-cut-intro.md and even-cut-outro.md. Played by quest
// ch5-even-cut (quests/story/70-even-cut.ts) and checked by scenes.test.ts.
import type { GnomeLook } from '@lawn/gnome';
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, reaction, shot } from '../../direct';
import { markOf, rideOf, spot, up } from './kit';
import { combineProp, JAM_Z, ROAD_LAMP, THRONE_ROAD, VESPER_BARE, X_VESPER } from './m70-even-cut';

/** The Mayor's third coat: glossy fire-engine red, still wet. */
const MULCH_LOOK: Partial<GnomeLook> = { hat: 0xe0201c, shirt: 0xe0201c, pants: 0xb81814 };
const MABEL_LOOK: Partial<GnomeLook> = { hat: 0xf2c230, shirt: 0x2b2b2b, hair: { color: 0xbbbbbb, style: 'pigtails' }, beard: null };

/** Yaw (radians, 0 = +z) that faces `to` from `from`. */
function facing(from: Vec2, to: Vec2): number {
  return Math.atan2(to[0] - from[0], to[1] - from[1]);
}

const JOHN = markOf('bodega-front', 'bodega');
/** Asphalt's counter spot (where the prologue put her) and the barometer insert that frames it. */
const CAT_AT: Vec2 = [-78.4, 88.4];
const CAT_INSERT = { kind: 'cut' as const, pos: up(-76.4, 86.8, 0.75), look: up(-78.6, 88.2, 0.45), fov: 44 };
const VOICE = 'Vesper Thorne';

// ---- The final's intro: in the street, in its way ---------------------------------------------------------------------
const ST = 'e70-jam-street';
const S_BRACKEN = markOf(ST, 'bracken');
const S_TANSY = markOf(ST, 'tansy');
const S_PIP = markOf(ST, 'pip');
const S_YOU = markOf(ST, 'player');
/** The Combine coming down the street from the z = -120 crossing (the final's boss runner starts it at -120). */
const ST_Z = -129;
const BOX_AT: Vec2 = [4.5, -100.6];
const TABLE = coverage('tansy', 'player', 1);
const PIPT = coverage('tansy', 'pip', -1);

/**
 * The jam's opener. Day, the street south of the crossing, the Combine filling the top of it with its lamp lit. Vesper on
 * the PA tries to be patient, then tries the hat line and cannot get to the end of it; in the silence after it, Pip's
 * golden kazoo goes off. At Bodega & Sons Asphalt has left the counter. Bracken puts Gnorwin's Stone in the player's
 * hands. Tansy opens the cigar box: the forty-eighth wrench, and the finale theme with it. She says Pip's line for him
 * ("Okay, hear me out.") and he has nothing; her plan is three clauses and the last is Clara's. Pip gets his voice back
 * and says the line that sends them in.
 */
export const EVEN_CUT_INTRO: SceneScript = {
  id: 'even-cut-intro',
  stage: { kind: 'world' },
  music: 'villain',
  ambience: 'street',
  sky: 'noon',
  radio: 0,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/even-cut-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, held: null, at: S_YOU.at, yaw: S_YOU.yaw },
    { id: 'tansy', preset: 'tansy', name: 'Tansy Clayfoot', at: S_TANSY.at, yaw: S_TANSY.yaw, held: null },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: S_PIP.at, yaw: S_PIP.yaw, held: 'ammu-golden-kazoo' },
    { id: 'bracken', preset: 'bracken', name: 'Elder Bracken', at: S_BRACKEN.at, yaw: S_BRACKEN.yaw, held: 'stopping-stone' },
    { id: 'john', preset: 'bodega', name: 'John Bodega', at: JOHN.at, yaw: JOHN.yaw },
  ],
  vehicles: [
    // Tansy's Zero-Turn, slewed across the kerb where she stopped it: Bracken rode down on the back of it.
    { id: 'zero-turn', ...rideOf('tansy'), at: [6.4, -95.4], yaw: 2.5 },
  ],
  props: [
    combineProp(ST_Z),
    // The throne up on the bridge, turned round to face the deck it lost, the lamp lit, the hat's crown over its back.
    { id: 'throne', prefab: 'glaze-seat-throne', at: up(0, ST_Z + 1.2, 8.5), yaw: Math.PI, size: 1.0 },
    { id: 'lamp', prefab: 'porcelain-lantern', at: up(-0.55, ST_Z + 1.3, 9.75), yaw: 0, size: 0.32, by: 'h' },
    // A fruit crate on the kerb, Tansy's cigar box on it: the forty-eighth wrench lives in it.
    { id: 'crate', prefab: 'crate', at: BOX_AT, yaw: 0.2, size: 0.9, by: 'h' },
    { id: 'cigar-box', prefab: 'cigar-box', at: up(BOX_AT[0], BOX_AT[1], 0.92), yaw: 0.3, size: 0.32 },
  ],
  steps: [
    // 1. Hook: the street, the crew small in it, and at the top of it the machine, lamp lit, coming.
    cut(spot(ST, 'canyon')),
    { do: 'sfx', id: 'engine-rev', at: 'combine', gain: 0.8, async: true },
    { do: 'shake', amp: 0.05, s: 2.4 },
    { do: 'wait', s: 1.2 },
    { do: 'say', who: VOICE, hz: 92, sfx: 'static', text: 'Turfton. Friends. I have been extremely patient with all of you.' },
    // 2. The hat line, one last try on the PA, onto the player's face. It will not come.
    { do: 'face', who: 'player', at: [0, -122], s: 0.2 },
    cut(shot('player', 'mcu', { side: 25, height: 'low' })),
    { do: 'say', who: VOICE, hz: 92, sfx: 'static', text: 'Nice... Nice h—' },
    { do: 'sfx', id: 'static', gain: 0.5 },
    { do: 'music', track: null, fade: 0.3 },
    beat('silence'),
    // The worst possible moment for the golden kazoo.
    cut(PIPT.single('pip', 'ms')),
    { do: 'sfx', id: 'whistle', at: 'pip', gain: 0.6 },
    { do: 'gesture', who: 'pip', name: 'flinch', s: 0.9 },
    { do: 'say', who: 'pip', text: '...Sorry. Nerves.' },
    // 3. Meanwhile, Bodega & Sons: the window rattles. The barometer has left the counter.
    cut(CAT_INSERT),
    { do: 'ambience', bed: 'room', fade: 0.2 },
    { do: 'sfx', id: 'glass', gain: 0.25 },
    { do: 'shake', amp: 0.04, s: 2.0 },
    { do: 'wait', s: 1.4 },
    cut(shot('john', 'mcu', { side: 20 })),
    { do: 'say', who: 'john', text: 'Asphalt just hopped off the counter.' },
    beat('beat'),
    { do: 'say', who: 'john', text: 'Twelve years. Never once.' },
    // 4. The street. Bracken puts the Stone in the player's hands.
    { do: 'ambience', bed: 'street', fade: 0.2 },
    { do: 'face', who: 'bracken', at: 'player', s: 0.2, async: true },
    { do: 'face', who: 'player', at: 'bracken', s: 0.2 },
    cut(shot('bracken', 'mcu', { toward: 'player', height: 'low', side: 20 })),
    { do: 'say', who: 'bracken', text: 'Gnorwin\'s Stone. Cut for one mouth in all the world.' },
    cut({ kind: 'cut', pos: up(-3.4, -101.6, 1.5), look: up(-1.4, -99.4, 0.9), fov: 40 }),
    { do: 'give', from: 'bracken', to: 'player', s: 1.2 },
    { do: 'sfx', id: 'thud', at: 'player', gain: 0.4, async: true },
    cut(shot('player', 'mcu', { toward: 'bracken', side: -25 })),
    { do: 'say', who: 'player', text: 'Heavy.' },
    cut(shot('bracken', 'mcu', { toward: 'player', height: 'low', side: 20 })),
    { do: 'say', who: 'bracken', text: 'It is meant to be.' },
    // 5. The cigar box, opened at last (an insert), and the finale theme with it.
    { do: 'face', who: 'player', at: 'tansy', s: 0.2 },
    cut({ kind: 'cut', pos: up(5.4, -99.6, 1.35), look: up(BOX_AT[0], BOX_AT[1], 0.95), fov: 36 }),
    { do: 'sfx', id: 'door-creak', at: 'cigar-box', gain: 0.5 },
    { do: 'music', track: 'finale', fade: 1.0 },
    { do: 'wait', s: 1.3 },
    { do: 'hold', who: 'tansy', prop: 'brass-wrench' },
    { do: 'face', who: 'tansy', at: 'pip', s: 0.2 },
    { do: 'face', who: 'pip', at: 'tansy', s: 0.2 },
    cut(PIPT.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Is that... the forty-eighth?' },
    cut(PIPT.single('tansy', 'cu')),
    { do: 'gesture', who: 'tansy', name: 'point', s: 1.4, async: true },
    { do: 'say', who: 'tansy', text: 'I said it waits for a big enough heist.' },
    cut(PIPT.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Is it?' },
    cut(PIPT.single('tansy', 'cu')),
    beat('tiny'),
    { do: 'say', who: 'tansy', text: 'It\'s big enough.' },
    // 6. Pip's line, in Tansy's mouth. He has nothing.
    { do: 'face', who: 'tansy', at: 'player', s: 0.3 },
    cut(TABLE.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Okay, Potsworth. Hear me out.' },
    ...reaction('pip', { toward: 'tansy', size: 'cu', side: 20, hold: 'pause' }),
    cut(TABLE.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Stone in its mouth. Hat off the man. Nobody shatters.' },
    // 7. Pip gets his voice back, and says the line that sends them in.
    { do: 'face', who: 'pip', at: 'player', s: 0.3 },
    cut(shot('pip', 'ms', { toward: 'player', side: 25 })),
    { do: 'gesture', who: 'pip', name: 'cheer', s: 1.4, async: true },
    { do: 'say', who: 'pip', text: 'Let\'s go jam a god-machine with a rock!' },
    // Button: closer again. The player walks up the middle of the road into it with the Stone.
    { do: 'spawn', id: 'combine', at: [0, ST_Z + 4], yaw: 0 },
    { do: 'spawn', id: 'throne', at: up(0, ST_Z + 5.2, 8.5), yaw: Math.PI },
    { do: 'spawn', id: 'lamp', at: up(-0.55, ST_Z + 5.3, 9.75), yaw: 0 },
    { do: 'face', who: 'player', at: [0, -122], s: 0.2 },
    cut({ kind: 'cut', pos: up(-1.6, -93.4, 1.3), look: up(0, -118, 4.5), fov: 50 }),
    { do: 'walk', who: 'player', path: [[-0.2, -104.5]], speed: 1.3, async: true },
    { do: 'sfx', id: 'engine-rev', at: 'combine', gain: 0.9, async: true },
    { do: 'shake', amp: 0.05, s: 2.8 },
    { do: 'wait', s: 2.8 },
  ],
};

// ---- The outro: Clara, then the epilogue ------------------------------------------------------------------------------
const X = 'e70-crossing';
const X_CLARA = markOf(X, 'clara');
/** Clara comes up the meridian from the crossing with her lantern. */
const CLARA_IN: Vec2 = [2.8, 2.5];
const JUNIPER_AT: Vec2 = [-6.0, -12.4];
const REGINALD_AT: Vec2 = [-3.4, -16.0];
const BAY_TANSY: Vec2 = [-155.9, 74.3];
const BAY_PIP_IN: Vec2 = [-153.6, 72.6];
const MULCH = markOf('city-hall-steps', 'mayor-mulch');
const LOU = markOf('gnomecino-door', 'big-lou');
const DIGGS_OFF: Vec2 = [67.2, -30.4];
const BUS_PLAYER = markOf('bus-stop', 'player');
const BUS_PIP = markOf('bus-stop', 'pip');
const BUS_GRANNY_IN: Vec2 = [-8.6, 15.2];
/** The coalition camp's hat rail (W16, worldChanges/rows/coalitionCamp.ts: at (245, 87.6), scale 1.5, facing the table): its west post. */
const RAIL_POST: Vec2 = [243.6, 87.35];
const CAMP_YOU: Vec2 = [244.5, 89.2];

const CV = coverage('clara', 'vesper', 1);
const SIBS = coverage('juniper', 'reginald', 1);
const BAYT = coverage('tansy-bay', 'pip-bay', 1);
const ROPE = coverage('big-lou', 'diggs-off', 1);
const KERB = coverage('player', 'pip', 1);

/**
 * The Even Cut epilogue, dusk on the longest day. Picture first: Clara comes up the meridian with her lantern to the
 * throne on the road, where Vesper sits bare-headed and still. She sits on its step beside him, as two gnomes once sat on
 * a porch step; three short lines, no gag, a silence. Then Turfton: the Vance siblings measure the scar ("...It's
 * uneven." "Good."); Tansy hangs the forty-eighth wrench and refuses, then allows, one more of Pip's plans; the Mayor in
 * his third coat; Diggs off duty at Big Lou's rope with a drink; Asphalt back on the counter; Granny's pie and Mabel's
 * free ride at the bus stop, and Club Gnome on Pip's phone. The button: the top hat on the last post of the coalition's
 * hat rail at the overlook, among everybody else's. All hats.
 */
export const EVEN_CUT_OUTRO: SceneScript = {
  id: 'even-cut-outro',
  stage: { kind: 'world' },
  ambience: 'wind',
  sky: 'golden',
  radio: 0,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/even-cut-outro.md', kind: 'chapter-close' },
  actors: [
    { id: 'vesper', preset: 'vesper', look: VESPER_BARE, held: null, at: X_VESPER.at, yaw: X_VESPER.yaw },
    { id: 'clara', preset: 'clara', name: 'Clara', at: CLARA_IN, yaw: Math.PI },
    { id: 'juniper', preset: 'juniper', name: 'Councilwoman Juniper Vance', at: JUNIPER_AT, yaw: facing(JUNIPER_AT, [-2, -19.5]), held: null },
    { id: 'reginald', preset: 'reginald', name: 'Reginald Vance', at: REGINALD_AT, yaw: facing(REGINALD_AT, [-2.6, -18.8]) },
    { id: 'tansy-bay', preset: 'tansy', name: 'Tansy Clayfoot', at: BAY_TANSY, yaw: facing(BAY_TANSY, [-157.6, 74.2]), held: 'brass-wrench' },
    { id: 'pip-bay', preset: 'pip', name: 'Pip Potsworth', at: [-146, 69], yaw: facing([-146, 69], BAY_TANSY), hidden: true },
    { id: 'mulch', preset: 'mayor mulch', name: 'Mayor Mulch', look: MULCH_LOOK, at: MULCH.at, yaw: facing(MULCH.at, [18, -64]) },
    { id: 'big-lou', preset: 'big lou', name: 'Big Lou', at: LOU.at, yaw: facing(LOU.at, DIGGS_OFF) },
    { id: 'diggs-off', preset: 'diggs', name: 'Commander Diggs', look: { shirt: 0xd9b26a }, at: DIGGS_OFF, yaw: facing(DIGGS_OFF, LOU.at), held: 'martini-glass' },
    { id: 'john', preset: 'bodega', name: 'John Bodega', at: JOHN.at, yaw: JOHN.yaw },
    { id: 'player', player: true, held: 'borrowed-top-hat', at: BUS_PLAYER.at, yaw: facing(BUS_PLAYER.at, BUS_PIP.at) },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: BUS_PIP.at, yaw: facing(BUS_PIP.at, BUS_PLAYER.at), held: null },
    { id: 'granny', preset: 'granny', name: 'Granny Gnertrude', at: [-14, 9], yaw: facing([-14, 9], BUS_GRANNY_IN), held: 'acorn-cake', hidden: true },
    { id: 'mabel', name: 'Mabel Kerbstone', look: MABEL_LOOK, hz: 104, seatedIn: 'taxi', at: [0, 0], hidden: true },
  ],
  vehicles: [
    { id: 'taxi', kind: 'ride-on', at: [2.5, 60], yaw: Math.PI, tint: 0xf2c230, hidden: true },
  ],
  props: [
    combineProp(JAM_Z),
    { id: 'throne', prefab: 'glaze-seat-throne', at: THRONE_ROAD, yaw: 0, size: 1.0 },
    { id: 'lamp', prefab: 'porcelain-lantern', at: ROAD_LAMP, yaw: 0, size: 0.32, by: 'h' },
    { id: 'cat', prefab: 'asphalt-cat', at: CAT_AT, yaw: facing(CAT_AT, JOHN.at), size: 0.55 },
    // Tansy's wrench wall (the prologue's), with its one empty peg.
    { id: 'rack', prefab: 'wrench-rack', at: [-157.6, 74.2], yaw: Math.PI / 2, size: 1.5 },
    { id: 'bay-chair-a', prefab: 'deck-chair', at: [-160, 66], yaw: 0.5, size: 1.2 },
    { id: 'bay-chair-b', prefab: 'deck-chair', at: [-164, 80], yaw: -0.4, size: 1.2 },
    // The top hat on the hat rail's last post, for the button.
    { id: 'rail-hat', prefab: 'borrowed-top-hat', at: up(RAIL_POST[0], RAIL_POST[1], 1.36), yaw: 0.4, size: 0.3, hidden: true },
  ],
  steps: [
    // 1. Hook: dusk at the crossing. A lantern coming up the road towards the throne, and the gnome sitting on it.
    { do: 'gesture', who: 'vesper', name: 'sit', s: 0.2, async: true },
    cut({ kind: 'cut', pos: up(9.5, -1.0, 1.6), look: up(3.2, -7.4, 1.0), fov: 46 }),
    { do: 'walk', who: 'clara', path: [[2.6, -4.0], X_CLARA.at], speed: 1.0, async: true },
    { do: 'sfx', id: 'footsteps', at: 'clara', gain: 0.35, async: true },
    { do: 'wait', s: 2.6 },
    // 2. Clara and Vesper. Her sentences end early. No music, no gag.
    cut(CV.single('vesper', 'mcu', { height: 'high' })),
    { do: 'wait', s: 1.6 },
    { do: 'face', who: 'clara', at: 'vesper', s: 0.3 },
    cut(CV.single('clara', 'mcu')),
    { do: 'say', who: 'clara', text: 'There you are.' },
    cut(CV.single('vesper', 'cu', { height: 'high' })),
    beat('beat'),
    { do: 'say', who: 'vesper', text: '...Clara.' },
    // She sits on the throne's step beside him: the photograph's porch step. The first frame he has ever shared.
    { do: 'gesture', who: 'clara', name: 'sit', s: 0.2 },
    { do: 'sfx', id: 'cloth', at: 'clara', gain: 0.4, async: true },
    cut(CV.two('ms')),
    { do: 'say', who: 'clara', text: 'It is only a hair, Vesper.' },
    beat('pause'),
    { do: 'say', who: 'clara', text: 'It holds.' },
    beat('silence'),
    // The tune comes back, slow, over the two lanterns and the stopped machine.
    { do: 'music', track: 'turfton-dusk', fade: 2 },
    { do: 'cam', shot: { kind: 'dolly', from: up(7.5, -1.5, 1.4), to: up(11, 3.5, 5.5), look: up(1.5, -12, 2.5), s: 4, fov: 52 } },
    { do: 'wait', s: 3.6 },
    // 3. The Vance siblings measure the scar. They never look at each other.
    cut(SIBS.single('juniper', 'mcu')),
    { do: 'say', who: 'juniper', text: 'The Even Cut, he called it. Go on, Reginald. Measure it.' },
    cut(shot('reginald', 'mcu', { height: 'high', side: 30 })),
    { do: 'gesture', who: 'reginald', name: 'lean', s: 1.8 },
    beat('beat'),
    { do: 'say', who: 'reginald', text: '...It\'s uneven.' },
    cut(SIBS.single('juniper', 'cu')),
    beat('tiny'),
    { do: 'say', who: 'juniper', text: 'Good.' },
    // 4. Side-Valve Salvage, reopened: the forty-eighth wrench goes back up. Then one more plan, and she lets him.
    { do: 'music', track: 'turfton', fade: 1.2 },
    { do: 'ambience', bed: 'street', fade: 0.3 },
    cut(shot('tansy-bay', 'mcu', { side: 35 })),
    { do: 'gesture', who: 'tansy-bay', name: 'handsUp', s: 0.9 },
    { do: 'hold', who: 'tansy-bay', prop: null },
    { do: 'sfx', id: 'clink', at: 'rack', gain: 0.5, async: true },
    { do: 'say', who: 'tansy-bay', text: 'Forty-eight.' },
    { do: 'spawn', id: 'pip-bay' },
    { do: 'face', who: 'tansy-bay', at: 'pip-bay', s: 0.1 },
    cut(BAYT.single('pip-bay', 'ms', { handheld: 0.02 })),
    { do: 'walk', who: 'pip-bay', path: [BAY_PIP_IN], run: true },
    { do: 'gesture', who: 'pip-bay', name: 'point', s: 0.8, async: true },
    { do: 'say', who: 'pip-bay', text: 'So. There\'s a bowling alley—' },
    cut(BAYT.single('tansy-bay', 'mcu')),
    { do: 'say', who: 'tansy-bay', text: 'No.' },
    ...reaction('pip-bay', { toward: 'tansy-bay', gesture: 'slump', size: 'mcu', side: -25, hold: 'pause' }),
    cut(BAYT.single('tansy-bay', 'cu')),
    beat('beat'),
    { do: 'say', who: 'tansy-bay', text: '...Go on.' },
    // 5. City Hall: the Mayor, on his third coat, still wet.
    cut(shot('mulch', 'mcu', { side: 10, height: 'low' })),
    { do: 'gesture', who: 'mulch', name: 'wave', s: 1.6, async: true },
    { do: 'say', who: 'mulch', text: 'Ding, ding! Third coat! I was on your side the whole time!' },
    // 6. The Gnomecino rope: the Commander, off duty, a drink in his hand.
    cut(ROPE.single('big-lou', 'mcu')),
    { do: 'gesture', who: 'big-lou', name: 'crossArms', s: 1.4, async: true },
    { do: 'say', who: 'big-lou', text: 'Commander. Rope\'s up.' },
    cut(ROPE.single('diggs-off', 'mcu')),
    { do: 'sfx', id: 'clink', at: 'diggs-off', gain: 0.4, async: true },
    { do: 'say', who: 'diggs-off', text: 'Off duty, Lou.' },
    cut(ROPE.single('big-lou', 'mcu')),
    beat('tiny'),
    { do: 'say', who: 'big-lou', text: 'Then you\'re in.' },
    // 7. Bodega & Sons: the barometer reads fair. The same insert as the jam's opener, the cat back on her spot.
    cut(CAT_INSERT),
    { do: 'ambience', bed: 'room', fade: 0.2 },
    { do: 'wait', s: 1.4 },
    cut(shot('john', 'mcu', { toward: 'cat', side: -30 })),
    { do: 'say', who: 'john', text: 'Asphalt\'s back on the counter. Bottlecap and all.' },
    // 8. The bus stop, where it started: Granny's pie, Mabel's free ride, and the phone.
    { do: 'ambience', bed: 'street', fade: 0.2 },
    { do: 'music', track: 'triumph', fade: 1.5 },
    { do: 'spawn', id: 'granny' },
    cut(KERB.single('player', 'mcu')),
    { do: 'walk', who: 'granny', path: [BUS_GRANNY_IN], speed: 1.4 },
    { do: 'face', who: 'granny', at: 'pip', s: 0.3 },
    cut(shot('granny', 'mcu', { toward: 'pip', side: 20 })),
    { do: 'say', who: 'granny', text: 'Pie, sugar. For the crew.' },
    { do: 'give', from: 'granny', to: 'pip', s: 1.0 },
    { do: 'spawn', id: 'taxi' },
    { do: 'spawn', id: 'mabel' },
    cut({ kind: 'track', pos: up(-1.2, 25, 1.0), who: 'taxi', fov: 48 }),
    { do: 'drive', vehicle: 'taxi', path: [[2.5, 40], [2.5, 21]], speed: 9 },
    { do: 'horn', vehicle: 'taxi' },
    cut({ kind: 'cut', pos: up(0.4, 18.4, 1.7), look: 'mabel', fov: 36 }),
    { do: 'say', who: 'mabel', text: 'Hop in, dear. This one\'s on the house.' },
    { do: 'face', who: 'player', at: 'taxi', s: 0.3 },
    ...reaction('player', { size: 'mcu', side: 20, hold: 'tiny' }),
    { do: 'say', who: 'player', text: '...Finally.' },
    { do: 'face', who: 'pip', at: 'player', s: 0.2 },
    cut(KERB.single('pip', 'mcu')),
    { do: 'sfx', id: 'phone', at: 'pip' },
    { do: 'caption', text: 'Club Gnome: "Heard you\'re good with heavy machinery. Need a gnome for a bowling alley."' },
    { do: 'wait', s: 3.4 },
    { do: 'caption', text: null },
    { do: 'say', who: 'pip', text: 'Bowling? What could possibly go wrong.' },
    // 9. The button: the overlook camp at dusk. The top hat goes on the rail's last post, among everybody's caps.
    { do: 'music', track: 'turfton-dusk', fade: 1.0 },
    { do: 'ambience', bed: 'wind', fade: 0.3 },
    { do: 'despawn', id: 'player' },
    { do: 'spawn', id: 'player', at: CAMP_YOU, yaw: facing(CAMP_YOU, RAIL_POST) },
    cut({ kind: 'cut', pos: up(241.4, 91.8, 1.5), look: up(243.8, 87.8, 1.2), fov: 44 }),
    { do: 'wait', s: 0.8 },
    { do: 'hold', who: 'player', prop: null },
    { do: 'spawn', id: 'rail-hat' },
    { do: 'sfx', id: 'tap', at: 'rail-hat', gain: 0.4 },
    { do: 'wait', s: 1.6 },
    // Up and away from the rail, over the camp, for the end titles.
    { do: 'cam', shot: { kind: 'dolly', from: up(240.6, 94, 2.2), to: up(236.5, 100, 5.5), look: up(244.6, 86.6, 1.0), s: 7, fov: 50 } },
    { do: 'stinger', id: 'triumph' },
    { do: 'title', text: 'THE END' },
    { do: 'wait', s: 2.2 },
    { do: 'title', text: 'GNOME THEFT AUTO' },
    { do: 'wait', s: 2.2 },
    { do: 'title', text: null },
  ],
};

export const CH5_SCENES: Record<string, SceneScript> = {
  'even-cut-intro': EVEN_CUT_INTRO,
  'even-cut-outro': EVEN_CUT_OUTRO,
};
