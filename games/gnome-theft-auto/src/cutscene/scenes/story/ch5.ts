// Chapter 5 story scenes: the finale's call to arms and the epilogue. Re-directed in the Story B direction pass (notes
// in docs/design/gnome-theft-auto/direction/scenes/even-cut-intro.md and even-cut-outro.md). Every id here is played by
// a quest in quests/chapter5.ts and checked by scenes.test.ts.
import type { GnomeLook } from '@lawn/gnome';
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, reaction, shot } from '../../direct';
import { carMark, markOf, up } from './kit';

const BIKER_LOOK: Partial<GnomeLook> = { hat: 0xf08bb4, shirt: 0x2a2a2a, glasses: true };
/** The Mayor's third coat: glossy fire-engine red, still wet. */
const MULCH_LOOK: Partial<GnomeLook> = { hat: 0xe0201c, shirt: 0xe0201c, pants: 0xb81814, beard: 0xeeeeee, glasses: true };
const MABEL_LOOK: Partial<GnomeLook> = { hat: 0xf2c230, shirt: 0x2b2b2b, hair: { color: 0xbbbbbb, style: 'pigtails' }, beard: null };

/** Yaw (radians, 0 = +z) that faces `to` from `from`. */
function facing(from: Vec2, to: Vec2): number {
  return Math.atan2(to[0] - from[0], to[1] - from[1]);
}

const SAFE = 'dust-safehouse';
const SAFE_PLAYER = markOf(SAFE, 'player');
const SAFE_TANSY = markOf(SAFE, 'tansy');
const SAFE_DIGGS = markOf(SAFE, 'diggs');
/** Pip at the map table, between Tansy and the player. */
const SAFE_PIP: Vec2 = [271.4, 45.6];
const CANAL_GRANNY = markOf('brenda-throne', 'biker', 0);
/** Brenda off her throne (the throne is solid), on the bank beside it. */
const BRENDA_AT: Vec2 = [-42, 214];
const CANAL_GANG_1 = markOf('brenda-throne', 'biker', 1);
const JOHN = markOf('bodega-front', 'bodega');
/** Asphalt's counter spot (where the prologue put her) and the barometer insert that frames it. */
const CAT_AT: Vec2 = [-78.4, 88.4];
const CAT_INSERT = { kind: 'cut' as const, pos: up(-76.4, 86.8, 0.75), look: up(-78.6, 88.2, 0.45), fov: 44 };

/** The Combine's escort van, coming down the meridian past the camera. */
const ESCORT: Vec2[] = [[-2.5, -290], [-2.5, -250], [-2.5, -200]];

const TABLE = coverage('tansy', 'player', 1);
const PIPT = coverage('tansy', 'pip', -1);

/**
 * The Even Cut opener: the call to arms. Picture first: the Grand Combine rolling down the meridian under Vesper's PA,
 * losing control at last. At Bodega & Sons the window rattles and Asphalt has left the counter. At the Overlook the hat
 * line's last rung comes over the radio onto the player's face; in the silence after it, Pip's golden kazoo goes off. Then
 * Tansy brings out the forty-eighth wrench, says Pip's line for him ("Hear me out."), and he has nothing. Granny holds the
 * canal, Diggs gives the Guard, Pip sends them in. Title.
 */
export const EVEN_CUT_INTRO: SceneScript = {
  id: 'even-cut-intro',
  stage: { kind: 'world' },
  music: 'villain',
  ambience: 'wind',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/even-cut-intro.md', kind: 'chapter-open' },
  actors: [
    { id: 'player', player: true, at: SAFE_PLAYER.at, yaw: facing(SAFE_PLAYER.at, SAFE_TANSY.at) },
    { id: 'tansy', preset: 'tansy', name: 'Tansy Clayfoot', at: SAFE_TANSY.at, yaw: facing(SAFE_TANSY.at, SAFE_PLAYER.at), held: null },
    { id: 'diggs', preset: 'diggs', name: 'Commander Diggs', at: SAFE_DIGGS.at, yaw: facing(SAFE_DIGGS.at, SAFE_PLAYER.at) },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: SAFE_PIP, yaw: facing(SAFE_PIP, SAFE_TANSY.at), held: 'ammu-golden-kazoo' },
    { id: 'granny', preset: 'granny', name: 'Granny Gnertrude', at: CANAL_GRANNY.at, yaw: facing(CANAL_GRANNY.at, [-30, 206]) },
    { id: 'brenda', preset: 'brenda', name: 'Baroness Brenda', at: BRENDA_AT, yaw: facing(BRENDA_AT, [-30, 206]) },
    { id: 'gang-1', name: 'Canal Biker', look: BIKER_LOOK, at: CANAL_GANG_1.at, yaw: CANAL_GANG_1.yaw },
    { id: 'john', preset: 'bodega', name: 'John Bodega', at: JOHN.at, yaw: JOHN.yaw },
  ],
  vehicles: [
    { id: 'van-a', kind: 'hoa-van', at: ESCORT[0], yaw: 0, headlights: true },
    { id: 'whirligig', ...carMark(SAFE, 'safehouse-whirligig') },
  ],
  props: [
    { id: 'combine', prefab: 'grand-combine-boss', at: [0, -300], yaw: 0, size: 14 },
    // Tansy's cigar box on the map table: the forty-eighth wrench lives in it.
    { id: 'cigar-box', prefab: 'cigar-box', at: up(269.4, 40.7, 0.92), yaw: 0.3, size: 0.32 },
  ],
  steps: [
    // 1. The question in a picture: the god-machine on the meridian, low and enormous, and its owner finally shouting.
    { do: 'cam', shot: { kind: 'dolly', from: up(-9, -280, 1.0), to: up(-6.5, -284.5, 1.3), look: up(0, -300, 6), s: 6, fov: 52 } },
    { do: 'sfx', id: 'engine-rev', gain: 0.9 },
    { do: 'shake', amp: 0.05, s: 6 },
    { do: 'drive', vehicle: 'van-a', path: ESCORT, speed: 9, arrive: false, async: true },
    { do: 'wait', s: 1.4 },
    { do: 'say', who: 'Vesper Thorne', hz: 92, text: 'Look at yourselves! Chipped! Muddy! Unregulated!' },
    { do: 'say', who: 'Vesper Thorne', hz: 92, text: 'By morning, Turfton will be smooth. And silent. And beige!' },
    // 2. Meanwhile, Bodega & Sons: the window rattles as the shadow goes over. The barometer has left the counter.
    { do: 'music', track: null, fade: 0.5 },
    // The barometer insert, as the prologue framed it: her spot on the counter, empty.
    cut(CAT_INSERT),
    { do: 'sfx', id: 'glass', gain: 0.25 },
    { do: 'shake', amp: 0.04, s: 3.5 },
    { do: 'wait', s: 1.4 },
    cut(shot('john', 'mcu', { side: 20 })),
    { do: 'say', who: 'john', text: 'Asphalt just hopped off the counter.' },
    beat('beat'),
    { do: 'say', who: 'john', text: 'Twelve years. Never once.' },
    // 3. The Overlook. The last rung of the hat line comes over the radio, onto the player's face, in a push-in.
    { do: 'cam', shot: { kind: 'dolly', from: up(270.9, 48.1, 1.4), to: up(271.3, 48.8, 1.4), look: 'player', s: 4.5, fov: 34 } },
    { do: 'music', track: 'villain', fade: 0.6 },
    { do: 'say', who: 'Vesper Thorne', hz: 92, sfx: 'phone', text: 'And to the gnome in that hat: tonight, it cracks.' },
    { do: 'music', track: null, fade: 0.4 },
    beat('silence'),
    // The worst possible moment for the golden kazoo.
    cut(PIPT.single('pip', 'ms')),
    { do: 'sfx', id: 'whistle', at: 'pip', gain: 0.6 },
    { do: 'gesture', who: 'pip', name: 'flinch', s: 0.9 },
    { do: 'say', who: 'pip', text: '...Sorry. Nerves.' },
    // 4. Tansy, all business: the clock.
    cut(TABLE.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'It\'s on the meridian. Downtown in four minutes.' },
    cut(PIPT.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Four minutes? I can\'t find my other boot in four minutes.' },
    cut(PIPT.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Then we go in three.' },
    // 5. The forty-eighth wrench comes out from under the map table, and the finale theme starts with it.
    // The cigar box, opened at last (an insert), and the finale theme with it.
    cut({ kind: 'cut', pos: up(270.3, 41.6, 1.3), look: up(269.4, 40.7, 0.95), fov: 36 }),
    { do: 'sfx', id: 'door-creak', at: 'cigar-box', gain: 0.5 },
    { do: 'music', track: 'finale', fade: 1.0 },
    { do: 'wait', s: 1.3 },
    { do: 'hold', who: 'tansy', prop: 'brass-wrench' },
    cut(PIPT.single('tansy', 'cu')),
    { do: 'gesture', who: 'tansy', name: 'point', s: 1.4, async: true },
    { do: 'say', who: 'tansy', text: 'The forty-eighth. I said it waits for a big enough heist.' },
    cut(PIPT.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Is it?' },
    cut(PIPT.single('tansy', 'cu')),
    beat('tiny'),
    { do: 'say', who: 'tansy', text: 'It\'s big enough.' },
    // 6. Pip's line, in Tansy's mouth. He has nothing.
    { do: 'face', who: 'tansy', at: 'player', s: 0.3 },
    cut(TABLE.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Hear me out.' },
    ...reaction('pip', { toward: 'tansy', size: 'cu', side: 20, hold: 'pause' }),
    cut(TABLE.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Whirligig over it. Drop on the deck. Jam the intake with the Stone.' },
    // 7. The coalition answers, one voice each.
    cut(shot('granny', 'mcu', { side: 15 })),
    { do: 'say', who: 'granny', text: 'Cloverfield\'s holding the south canal. Go jam it, sugar.' },
    ...reaction('brenda', { size: 'ms', gesture: 'cheer', side: 10, hold: 'pause' }),
    cut(shot('diggs', 'mcu', { toward: 'player', side: -20, height: 'low' })),
    { do: 'gesture', who: 'diggs', name: 'tipHat', s: 1.0, async: true },
    { do: 'say', who: 'diggs', text: 'Spade Guard\'s with you. Nobody levels my sandbox, or your city, without a permit.' },
    // 8. Pip gets his voice back, and says the line that sends them in.
    { do: 'face', who: 'pip', at: 'player', s: 0.3 },
    cut(shot('pip', 'ms', { toward: 'player', side: 25, height: 'low' })),
    { do: 'gesture', who: 'pip', name: 'cheer', s: 1.4, async: true },
    { do: 'say', who: 'pip', text: 'Let\'s go jam a god-machine with a rock!' },
    // The title over the crew at the table, the fort walls behind them.
    { do: 'cam', shot: { kind: 'dolly', from: up(279, 52, 1.0), to: up(277.5, 51, 1.3), look: up(267.5, 44, 1.2), s: 4, fov: 48 } },
    { do: 'walk', who: 'player', path: [[273.2, 47.2]], speed: 1.2, async: true },
    { do: 'stinger', id: 'chapter' },
    { do: 'title', text: 'CHAPTER 5 — THE EVEN CUT' },
    { do: 'wait', s: 2.8 },
    { do: 'title', text: null },
  ],
};

/** The epilogue's places. */
const HAT: Vec2 = [8.2, -17.4];
const JUNIPER_AT: Vec2 = [4.6, -13.4];
const REGINALD_AT: Vec2 = [0.8, -16.6];
const BAY_TANSY: Vec2 = [-155.9, 74.3];
const BAY_PIP_IN: Vec2 = [-153.6, 72.6];
const MULCH = markOf('city-hall-steps', 'mayor-mulch');
const LOU = markOf('gnomecino-door', 'big-lou');
const DIGGS_OFF: Vec2 = [67.2, -30.4];
const BUS_PLAYER = markOf('bus-stop', 'player');
const BUS_PIP = markOf('bus-stop', 'pip');
const BUS_GRANNY_IN: Vec2 = [-8.6, 15.2];
/** The hat insert, used twice: the same frame with the hat, then without it. */
const HAT_SHOT = { kind: 'cut' as const, pos: up(10.2, -14.6, 0.35), look: up(8.0, -17.8, 0.3), fov: 36 };

const SIBS = coverage('juniper', 'reginald', 1);
const BAYT = coverage('tansy-bay', 'pip-bay', 1);
const ROPE = coverage('big-lou', 'diggs-off', 1);
const KERB = coverage('player', 'pip', 1);

/**
 * The Even Cut epilogue: the morning after, picture first. Vesper's top hat lies in the dust by the jammed Combine; the
 * Vance siblings measure the scar ("...It's uneven." "Good."); Tansy hangs the forty-eighth wrench and refuses, then
 * allows, one more of Pip's plans; the Mayor in his third coat; Diggs off duty at Big Lou's rope; Asphalt back on the
 * counter; Granny's pie and Mabel's free ride at the bus stop, and Club Gnome on the phone. The button is the hat's
 * spot again: empty. Somebody picked it up.
 */
export const EVEN_CUT_OUTRO: SceneScript = {
  id: 'even-cut-outro',
  stage: { kind: 'world' },
  ambience: 'wind',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/even-cut-outro.md', kind: 'chapter-close' },
  actors: [
    { id: 'player', player: true, at: BUS_PLAYER.at, yaw: facing(BUS_PLAYER.at, BUS_PIP.at) },
    { id: 'juniper', preset: 'juniper', name: 'Councilwoman Juniper Vance', at: JUNIPER_AT, yaw: facing(JUNIPER_AT, [0, -24]), held: null },
    { id: 'reginald', preset: 'reginald', name: 'Reginald Vance', at: REGINALD_AT, yaw: facing(REGINALD_AT, [-1.6, -19.6]) },
    { id: 'tansy-bay', preset: 'tansy', name: 'Tansy Clayfoot', at: BAY_TANSY, yaw: facing(BAY_TANSY, [-157.6, 74.2]), held: 'brass-wrench' },
    { id: 'pip-bay', preset: 'pip', name: 'Pip Potsworth', at: [-146, 69], yaw: facing([-146, 69], BAY_TANSY), hidden: true },
    { id: 'mulch', name: 'Mayor Mulch', look: MULCH_LOOK, at: MULCH.at, yaw: facing(MULCH.at, [18, -64]) },
    { id: 'big-lou', preset: 'big lou', name: 'Big Lou', at: LOU.at, yaw: facing(LOU.at, DIGGS_OFF) },
    { id: 'diggs-off', preset: 'diggs', name: 'Commander Diggs', look: { shirt: 0xd9b26a }, at: DIGGS_OFF, yaw: facing(DIGGS_OFF, LOU.at), held: null },
    { id: 'john', preset: 'bodega', name: 'John Bodega', at: JOHN.at, yaw: JOHN.yaw },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: BUS_PIP.at, yaw: facing(BUS_PIP.at, BUS_PLAYER.at) },
    { id: 'granny', preset: 'granny', name: 'Granny Gnertrude', at: [-14, 9], yaw: facing([-14, 9], BUS_GRANNY_IN), held: 'acorn-cake', hidden: true },
    { id: 'mabel', name: 'Mabel Kerbstone', look: MABEL_LOOK, hz: 104, seatedIn: 'taxi', at: [0, 0], hidden: true },
  ],
  vehicles: [
    { id: 'taxi', kind: 'ride-on', at: [2.5, 60], yaw: Math.PI, tint: 0xf2c230, hidden: true },
  ],
  props: [
    { id: 'combine', prefab: 'grand-combine-boss', at: [0, -26], yaw: Math.PI, size: 14 },
    { id: 'stone', prefab: 'stopping-stone', at: [-2, -19], yaw: 0, size: 1.4 },
    { id: 'hat', prefab: 'pilgrim-hat', at: HAT, yaw: 0.6, size: 0.5 },
    { id: 'cat', prefab: 'asphalt-cat', at: CAT_AT, yaw: facing(CAT_AT, JOHN.at), size: 0.55 },
    // Tansy's wrench wall (the prologue's), with its one empty peg.
    { id: 'rack', prefab: 'wrench-rack', at: [-157.6, 74.2], yaw: Math.PI / 2, size: 1.5 },
    { id: 'bay-chair-a', prefab: 'deck-chair', at: [-160, 66], yaw: 0.5, size: 1.2 },
    { id: 'bay-chair-b', prefab: 'deck-chair', at: [-164, 80], yaw: -0.4, size: 1.2 },
  ],
  steps: [
    // 1. Picture first: Vesper's top hat, knocked off, lying in the dust. Wind, no music.
    { do: 'cam', shot: HAT_SHOT },
    { do: 'wait', s: 2.2 },
    // The crane up: the Combine jammed and silent, the Stopping Stone in its intake. The tune comes back, slow.
    { do: 'cam', shot: { kind: 'dolly', from: up(-5, -9, 1.2), to: up(-13, -4, 6.5), look: up(0, -22, 4), s: 5, fov: 52 } },
    { do: 'music', track: 'turfton-dusk', fade: 2 },
    { do: 'wait', s: 4.4 },
    // 2. The Vance siblings measure the scar. They never look at each other.
    cut(SIBS.single('juniper', 'mcu')),
    { do: 'say', who: 'juniper', text: 'The Even Cut, he called it. Go on, Reginald. Measure it.' },
    cut(shot('reginald', 'mcu', { height: 'high', side: 30 })),
    { do: 'gesture', who: 'reginald', name: 'lean', s: 1.8 },
    beat('beat'),
    { do: 'say', who: 'reginald', text: '...It\'s uneven.' },
    cut(SIBS.single('juniper', 'cu')),
    beat('tiny'),
    { do: 'say', who: 'juniper', text: 'Good.' },
    beat('beat'),
    // 3. Side-Valve Salvage, reopened: the forty-eighth wrench goes back up. Then one more plan, and she lets him.
    { do: 'music', track: 'turfton', fade: 1.2 },
    cut(shot('tansy-bay', 'mcu', { side: 35 })),
    { do: 'gesture', who: 'tansy-bay', name: 'handsUp', s: 0.9 },
    { do: 'hold', who: 'tansy-bay', prop: null },
    { do: 'say', who: 'tansy-bay', text: 'Forty-eight.' },
    { do: 'spawn', id: 'pip-bay' },
    { do: 'face', who: 'tansy-bay', at: 'pip-bay', s: 0.1 },
    cut(BAYT.single('pip-bay', 'ms', { handheld: 0.02 })),
    { do: 'walk', who: 'pip-bay', path: [BAY_PIP_IN], run: true },
    { do: 'say', who: 'pip-bay', text: 'Okay, so, hear me out. There\'s a bowling alley—' },
    cut(BAYT.single('tansy-bay', 'mcu')),
    { do: 'say', who: 'tansy-bay', text: 'No.' },
    ...reaction('pip-bay', { toward: 'tansy-bay', gesture: 'slump', size: 'mcu', side: -25, hold: 'pause' }),
    cut(BAYT.single('tansy-bay', 'cu')),
    beat('beat'),
    { do: 'say', who: 'tansy-bay', text: '...Go on.' },
    // 4. City Hall: the Mayor, on his third coat.
    cut(shot('mulch', 'mcu', { side: 10, height: 'low' })),
    { do: 'gesture', who: 'mulch', name: 'wave', s: 1.6, async: true },
    { do: 'say', who: 'mulch', text: 'Ding, ding! I was on your side the whole time!' },
    // 5. The Gnomecino rope: the Commander, off duty.
    cut(ROPE.single('big-lou', 'mcu')),
    { do: 'gesture', who: 'big-lou', name: 'crossArms', s: 1.4, async: true },
    { do: 'say', who: 'big-lou', text: 'Commander. Rope\'s up.' },
    cut(ROPE.single('diggs-off', 'mcu')),
    { do: 'say', who: 'diggs-off', text: 'Off duty, Lou.' },
    cut(ROPE.single('big-lou', 'mcu')),
    beat('beat'),
    { do: 'say', who: 'big-lou', text: 'Then you\'re in.' },
    // 6. Bodega & Sons: the barometer reads fair. The same insert as the prologue's, the cat back on her spot.
    cut(CAT_INSERT),
    { do: 'wait', s: 1.3 },
    cut(shot('john', 'mcu', { toward: 'cat', side: -30 })),
    { do: 'say', who: 'john', text: 'Asphalt\'s back on the counter. Bottlecap and all.' },
    // 7. The bus stop, where it started: Granny's pie, Mabel's free ride, and the phone.
    { do: 'music', track: 'triumph', fade: 1.5 },
    { do: 'spawn', id: 'granny' },
    cut(KERB.single('player', 'mcu')),
    { do: 'walk', who: 'granny', path: [BUS_GRANNY_IN], speed: 1.4 },
    { do: 'face', who: 'granny', at: 'player', s: 0.3 },
    { do: 'face', who: 'player', at: 'granny', s: 0.3 },
    cut(shot('granny', 'mcu', { toward: 'player', side: 20 })),
    { do: 'say', who: 'granny', text: 'Pie, sugar. For the crew.' },
    { do: 'give', from: 'granny', to: 'player', s: 1.0 },
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
    { do: 'wait', s: 3.6 },
    { do: 'caption', text: null },
    { do: 'say', who: 'pip', text: 'Bowling? What could possibly go wrong.' },
    // 8. The button: the same frame as the opening insert. The hat is gone.
    { do: 'despawn', id: 'hat' },
    { do: 'music', track: null, fade: 0.6 },
    cut(HAT_SHOT),
    { do: 'sfx', id: 'engine-rev', gain: 0.15 },
    { do: 'stinger', id: 'mystery' },
    { do: 'wait', s: 2.4 },
    // Up and away from the empty spot to the silent machine for the end titles.
    { do: 'cam', shot: { kind: 'dolly', from: up(-5, -9, 1.2), to: up(-13, -4, 6.5), look: up(0, -22, 4), s: 7, fov: 52 } },
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
