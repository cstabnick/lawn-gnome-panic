// Chapter 5 story scenes (intros, outros, the chapter's opening and closing set pieces). Owner: one issue of
// docs/roadmaps/gta-story-cutscenes.md. Every id here is played by a quest in quests/chapter5.ts and checked by scenes.test.ts.
import type { GnomeLook } from '@lawn/gnome';
import type { SceneScript, Vec2 } from '../../script';
import { markOf, spot, up } from './kit';

const BIKER_LOOK: Partial<GnomeLook> = { hat: 0xf08bb4, shirt: 0x2a2a2a, glasses: true };
const MULCH_LOOK: Partial<GnomeLook> = { hat: 0x2c3e50, shirt: 0xd62828, beard: 0xeeeeee, glasses: true };
const MABEL_LOOK: Partial<GnomeLook> = { hat: 0xf2c230, shirt: 0x2b2b2b, hair: { color: 0xbbbbbb, style: 'pigtails' }, beard: null };

/** Yaw (radians, 0 = +z) that faces `to` from `from`. */
function facing(from: Vec2, to: Vec2): number {
  return Math.atan2(to[0] - from[0], to[1] - from[1]);
}

const SAFE_PLAYER = markOf('dust-safehouse', 'player');
const SAFE_TANSY = markOf('dust-safehouse', 'tansy');
const SAFE_DIGGS = markOf('dust-safehouse', 'diggs');
const SAFE_GRANNY = markOf('dust-safehouse', 'granny');
const SAFE_PIP = markOf('dust-safehouse', 'pip');
/** Brenda starts on her walk path (the stage's stroll), clear of the bank's wall, facing the throne. */
const BRENDA_START: Vec2 = [-42, 214];
const CANAL_GRANNY = markOf('brenda-throne', 'biker', 0);
const CANAL_GANG_1 = markOf('brenda-throne', 'biker', 1);
const CANAL_GANG_2 = markOf('brenda-throne', 'biker', 2);
const JOHN = markOf('bodega-front', 'bodega');

/**
 * The Even Cut opener: the Grand Combine rolls south down the meridian, the HOA escort and the cloverfield gang
 * and Diggs get their lines, and back at the Overlook the crew ends on the brass wrench and the title; then a last
 * cut to Bodega & Sons, where Asphalt the cat has left the counter. The player ends on foot by the safehouse hut.
 */
export const EVEN_CUT_INTRO: SceneScript = {
  id: 'even-cut-intro',
  stage: { kind: 'world' },
  music: 'villain',
  ambience: 'night',
  actors: [
    { id: 'player', player: true, at: SAFE_PLAYER.at, yaw: SAFE_PLAYER.yaw },
    { id: 'tansy', preset: 'tansy', at: SAFE_TANSY.at, yaw: SAFE_TANSY.yaw },
    { id: 'diggs', preset: 'diggs', at: SAFE_DIGGS.at, yaw: SAFE_DIGGS.yaw },
    { id: 'pip', preset: 'pip', at: SAFE_PIP.at, yaw: SAFE_PIP.yaw },
    { id: 'granny', preset: 'granny', at: CANAL_GRANNY.at, yaw: CANAL_GRANNY.yaw, hidden: true },
    { id: 'brenda', preset: 'brenda', at: BRENDA_START, yaw: facing(BRENDA_START, [-40, 216]), hidden: true },
    { id: 'gang-1', name: 'Canal Biker', look: BIKER_LOOK, at: CANAL_GANG_1.at, yaw: CANAL_GANG_1.yaw, hidden: true },
    { id: 'gang-2', name: 'Canal Biker', look: BIKER_LOOK, at: CANAL_GANG_2.at, yaw: CANAL_GANG_2.yaw, hidden: true },
    { id: 'john', preset: 'bodega', name: 'John Bodega', at: JOHN.at, yaw: JOHN.yaw, hidden: true },
  ],
  vehicles: [
    { id: 'van-a', kind: 'hoa-van', at: [-2.5, -236], yaw: 0, hidden: true },
  ],
  props: [
    { id: 'combine', prefab: 'grand-combine-boss', at: [0, -300], yaw: 0, size: 14, hidden: true },
  ],
  steps: [
    // Night at the safehouse: Tansy with the map.
    { do: 'cam', shot: spot('dust-safehouse', 'wide') },
    { do: 'cam', shot: { kind: 'cut', pos: [268.12, 2.73, 39.8], look: 'tansy', fov: 46 } },
    { do: 'say', who: 'tansy', text: 'Vesper\'s Grand Combine just crossed z = -300 on the center meridian. Four minutes to downtown, set to zero-millimeter scalp.', hz: 165 },
    { do: 'cam', shot: { kind: 'cut', pos: up(271, 47, 1.6), look: 'pip', fov: 46 } },
    { do: 'say', who: 'pip', text: 'Four minutes? I can\'t find my other boot in four minutes.', hz: 220 },
    { do: 'say', who: 'tansy', text: 'Then we go in three.', hz: 165 },
    // The Combine rolls south down x = 0; HOA vans escort it.
    { do: 'spawn', id: 'combine', at: [0, -300], yaw: 0 },
    { do: 'spawn', id: 'van-a' },
    { do: 'cam', shot: { kind: 'dolly', from: up(34, -318, 14), to: up(26, -304, 10), look: 'combine', s: 5, fov: 52 } },
    { do: 'sfx', id: 'engine-rev' },
    { do: 'drive', vehicle: 'van-a', path: [[-2.5, -236], [-2.5, -180]], speed: 12, arrive: false, async: true },
    { do: 'say', who: 'Vesper Thorne', text: '(40-ft PA) Look at yourselves! Chipped! Muddy! Unregulated! Tonight Turfton achieves zero-millimeter perfection!', hz: 92, music: 'villain' },
    { do: 'say', who: 'Vesper Thorne', text: '(40-ft PA) And to the gnome in that hat: tonight, it cracks.', hz: 92, stinger: 'villain' },
    { do: 'spawn', id: 'combine', at: [0, -258], yaw: 0 },
    { do: 'cam', shot: { kind: 'cut', pos: up(-16, -232, 9), look: 'combine', fov: 50 } },
    { do: 'shake', amp: 0.05, s: 2 },
    // Baroness Brenda's canal throne, and Granny with her Cloverfield girls.
    { do: 'cam', shot: spot('brenda-throne', 'wide') },
    { do: 'spawn', id: 'brenda' },
    { do: 'spawn', id: 'granny' },
    { do: 'spawn', id: 'gang-1' },
    { do: 'spawn', id: 'gang-2' },
    { do: 'cam', shot: { kind: 'cut', pos: up(-31, 210, 1.6), look: 'granny', fov: 46 } },
    { do: 'say', who: 'granny', text: 'We\'re holding the south canal. Jam that intake, sugar!', hz: 185 },
    { do: 'gesture', who: 'brenda', name: 'cheer', s: 1.2, async: true },
    // Diggs at the safehouse ridge.
    { do: 'cam', shot: { kind: 'cut', pos: up(266, 49, 1.6), look: 'diggs', fov: 46 } },
    { do: 'gesture', who: 'diggs', name: 'crossArms', s: 1.2, async: true },
    { do: 'say', who: 'diggs', text: 'Nobody levels my sandbox—or your city—without a permit.', hz: 145 },
    // Back at the Overlook: the forty-eighth wrench and the title.
    { do: 'walk', who: 'player', path: [[276, 42]], speed: 1.4, async: true },
    { do: 'music', track: 'finale', fade: 1.2 },
    { do: 'cam', shot: spot('dust-safehouse', 'two-shot') },
    { do: 'wait', s: 1.5 },
    { do: 'caption', text: 'A cigar box under the map table. Forty-seven wrenches, in size order.' },
    { do: 'wait', s: 2.5 },
    { do: 'caption', text: null },
    { do: 'hold', who: 'tansy', prop: 'brass-wrench' },
    { do: 'gesture', who: 'tansy', name: 'point', s: 1.0, async: true },
    { do: 'say', who: 'tansy', text: 'The forty-eighth. Brass. For a big heist.' },
    { do: 'say', who: 'pip', text: 'Let\'s go jam a god-machine with a rock!', hz: 220 },
    { do: 'stinger', id: 'chapter' },
    { do: 'title', text: 'CHAPTER 5 — THE EVEN CUT' },
    { do: 'wait', s: 2.5 },
    { do: 'title', text: null },
    // Final cut: Bodega & Sons, the neon window rattling as the Combine's shadow goes past.
    { do: 'spawn', id: 'john' },
    { do: 'cam', shot: spot('bodega-front', 'wide') },
    { do: 'shake', amp: 0.05, s: 3 },
    { do: 'cam', shot: { kind: 'cut', pos: [-76.89, 1.25, 88.75], look: 'john', fov: 46 } },
    { do: 'say', who: 'john', text: 'Asphalt hops down off the counter. She\'s never done that.', icon: '🐈' },
  ],
};

/**
 * The Even Cut epilogue: a montage of the morning after, in the order the quest's choice left it. Staged across the
 * meridian, the Side-Valve bay, City Hall, the Gnomecino and the bus stop. The player ends on foot at the bus stop.
 */
const MERIDIAN_JUNIPER: Vec2 = [6, -12];
const MERIDIAN_REGINALD: Vec2 = [3, -10];
const MERIDIAN_TANSY: Vec2 = [-6, -10];
const BAY_TANSY = markOf('side-valve-bay', 'tansy');
const MULCH = markOf('city-hall-steps', 'mayor-mulch');
const LOU = markOf('gnomecino-door', 'big-lou');
const BUS_PLAYER = markOf('bus-stop', 'player');
const BUS_PIP = markOf('bus-stop', 'pip');

export const EVEN_CUT_OUTRO: SceneScript = {
  id: 'even-cut-outro',
  stage: { kind: 'world' },
  music: 'turfton-dusk',
  ambience: 'wind',
  actors: [
    { id: 'player', player: true, at: BUS_PLAYER.at, yaw: BUS_PLAYER.yaw },
    { id: 'tansy', preset: 'tansy', at: MERIDIAN_TANSY, yaw: facing(MERIDIAN_TANSY, [-2, -19]) },
    { id: 'juniper', preset: 'juniper', at: MERIDIAN_JUNIPER, yaw: facing(MERIDIAN_JUNIPER, [0, -19]) },
    { id: 'reginald', preset: 'reginald', at: MERIDIAN_REGINALD, yaw: facing(MERIDIAN_REGINALD, [0, -22]) },
    { id: 'tansy-bay', preset: 'tansy', at: BAY_TANSY.at, yaw: BAY_TANSY.yaw, hidden: true, held: null },
    { id: 'mulch', name: 'Mayor Mulch', look: MULCH_LOOK, at: MULCH.at, yaw: MULCH.yaw, hidden: true },
    { id: 'big-lou', preset: 'big lou', at: LOU.at, yaw: LOU.yaw, hidden: true },
    { id: 'diggs-off', preset: 'diggs', name: 'Commander Diggs', look: { shirt: 0xd9b26a }, at: [67, -29], yaw: Math.PI / 2, hidden: true, held: null },
    { id: 'mabel', name: 'Mabel Kerbstone', look: MABEL_LOOK, hz: 104, hidden: true, seatedIn: 'taxi', at: [0, 0] },
    { id: 'pip', preset: 'pip', at: BUS_PIP.at, yaw: BUS_PIP.yaw },
    { id: 'john', preset: 'bodega', name: 'John Bodega', at: JOHN.at, yaw: JOHN.yaw, hidden: true },
  ],
  vehicles: [
    { id: 'taxi', kind: 'ride-on', at: [2.5, 60], yaw: Math.PI, tint: 0xf2c230, hidden: true },
  ],
  props: [
    { id: 'combine', prefab: 'grand-combine-boss', at: [0, -26], yaw: Math.PI, size: 14 },
    { id: 'stone', prefab: 'stopping-stone', at: [-2, -19], yaw: 0, size: 1.4 },
    { id: 'hat', prefab: 'pointy-hat', at: [-4, -4], yaw: 0.6, size: 0.5 },
    { id: 'bay-chair-a', prefab: 'deck-chair', at: [-160, 66], yaw: 0.5, size: 1.2 },
    { id: 'bay-chair-b', prefab: 'deck-chair', at: [-164, 80], yaw: -0.4, size: 1.2 },
  ],
  steps: [
    // The meridian at dawn: the Combine silent in its jam, the Stopping Stone in the intake, the cracked hat.
    { do: 'cam', shot: spot('meridian-finale', 'wide') },
    { do: 'cam', shot: { kind: 'dolly', from: up(-12, -10, 6), to: up(-22, -30, 9), look: 'combine', s: 6, fov: 52 } },
    { do: 'cam', shot: { kind: 'cut', pos: up(-8, -12, 2), look: 'stone', fov: 46 } },
    { do: 'cam', shot: { kind: 'cut', pos: up(4, 0, 3), look: 'hat', fov: 50 } },
    // Juniper and Reginald measure the scar; Reginald, for once, says nothing.
    { do: 'cam', shot: { kind: 'cut', pos: up(-2, -4, 1.7), look: 'juniper', fov: 48 } },
    { do: 'say', who: 'juniper', text: 'Go on, Reginald. Measure it.' },
    { do: 'cam', shot: { kind: 'cut', pos: up(-1, -5, 1.6), look: 'reginald', fov: 46 } },
    { do: 'gesture', who: 'reginald', name: 'lean', s: 1.6, async: true },
    { do: 'wait', s: 1.6 },
    { do: 'say', who: 'reginald', text: '...It\'s uneven.' },
    { do: 'cam', shot: { kind: 'cut', pos: up(-2, -4, 1.7), look: 'juniper', fov: 48 } },
    { do: 'say', who: 'juniper', text: 'Good.', stinger: 'comic' },
    { do: 'cam', shot: { kind: 'cut', pos: up(-2, -12, 1.6), look: 'tansy', fov: 46 } },
    { do: 'say', who: 'tansy', text: 'The Even Cut. Everybody gets the same lawn: their own.', hz: 165 },
    // Side-Valve Salvage: rebuilt with Brenda's zip-tied chairs; the brass wrench goes back on the pegboard.
    { do: 'music', track: 'turfton', fade: 1.5 },
    { do: 'cam', shot: spot('side-valve-bay', 'wide') },
    { do: 'spawn', id: 'tansy-bay' },
    { do: 'cam', shot: { kind: 'cut', pos: up(-146, 72, 1.7), look: 'tansy-bay', fov: 46 } },
    { do: 'gesture', who: 'tansy-bay', name: 'nod', s: 1.2, async: true },
    { do: 'caption', text: 'Zip-tied lawn chairs, a new pegboard, and one brass wrench, hung back up in its place. Forty-eight.' },
    { do: 'wait', s: 3 },
    { do: 'caption', text: null },
    // City Hall: the Mayor's third red coat, waving at nobody.
    { do: 'cam', shot: spot('city-hall-steps', 'wide') },
    { do: 'spawn', id: 'mulch' },
    { do: 'gesture', who: 'mulch', name: 'wave', s: 2, async: true },
    { do: 'cam', shot: { kind: 'cut', pos: up(22, -66, 2), look: 'mulch', fov: 46 } },
    { do: 'say', who: 'mulch', text: 'I was on your side the whole time!', stinger: 'comic' },
    // The Gnomecino: Diggs off duty at the velvet rope with Big Lou.
    { do: 'cam', shot: spot('gnomecino-door', 'wide') },
    { do: 'spawn', id: 'big-lou' },
    { do: 'spawn', id: 'diggs-off' },
    { do: 'cam', shot: { kind: 'cut', pos: up(74, -27, 1.7), look: 'big-lou', fov: 46 } },
    { do: 'say', who: 'big-lou', text: 'Commander. The rope\'s still up.' },
    { do: 'cam', shot: { kind: 'cut', pos: up(74, -35, 1.7), look: 'diggs-off', fov: 46 } },
    { do: 'say', who: 'diggs-off', text: 'Off duty, Lou. Don\'t tell the Spade Guard.' },
    // Bodega & Sons: Asphalt is back where she belongs.
    { do: 'spawn', id: 'john' },
    { do: 'cam', shot: { kind: 'cut', pos: [-76.89, 1.25, 88.75], look: 'john', fov: 46 } },
    { do: 'say', who: 'john', text: 'Asphalt\'s back on the counter. Bottlecap and all. Turfton is open.', icon: '🐈' },
    // The bus stop: Mabel's yellow taxi pulls up beside the player.
    { do: 'music', track: 'triumph', fade: 1.5 },
    { do: 'cam', shot: spot('bus-stop', 'wide') },
    { do: 'spawn', id: 'taxi' },
    { do: 'spawn', id: 'mabel' },
    { do: 'cam', shot: { kind: 'track', pos: up(-4, 4, 4), who: 'taxi', fov: 50 } },
    { do: 'drive', vehicle: 'taxi', path: [[2.5, 60], [2.5, 40], [2.5, 21]], speed: 9 },
    { do: 'cam', shot: { kind: 'cut', pos: up(-3, 14, 1.6), look: 'mabel', fov: 46 } },
    { do: 'say', who: 'mabel', text: 'Central Bus Stop, dear? This one\'s on the house.' },
    // Pip and the player on the kerb; the phone buzzes.
    { do: 'walk', who: 'player', path: [[-8, 17.5]], speed: 1.2, async: true },
    { do: 'cam', shot: spot('bus-stop', 'two-shot') },
    { do: 'gesture', who: 'pip', name: 'shrug', s: 1.2, async: true },
    { do: 'sfx', id: 'phone' },
    { do: 'caption', text: 'Text from Club Gnome: "Heard you\'re good with heavy machinery. Need a gnome for a bowling alley."' },
    { do: 'wait', s: 4 },
    { do: 'caption', text: null },
    { do: 'say', who: 'pip', text: 'Bowling? What could possibly go wrong.', hz: 220 },
    // The end card.
    { do: 'stinger', id: 'triumph' },
    { do: 'title', text: 'THE END' },
    { do: 'wait', s: 2.5 },
    { do: 'title', text: 'GNOME THEFT AUTO' },
    { do: 'wait', s: 2.5 },
    { do: 'title', text: null },
  ],
};

export const CH5_SCENES: Record<string, SceneScript> = {
  'even-cut-intro': EVEN_CUT_INTRO,
  'even-cut-outro': EVEN_CUT_OUTRO,
};
