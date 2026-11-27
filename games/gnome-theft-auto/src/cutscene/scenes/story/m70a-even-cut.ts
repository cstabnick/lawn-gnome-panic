// Story row 70 scenes: The Even Cut, parts 1 (Air Support) and 2 (Deck Drop). Tension 9 to 10, one gag a scene at most.
// The kept finale scenes (even-cut-intro, even-cut-outro) stay in ch5.ts; part 3 and the final are in m70-even-cut.ts.
// - even-cut-p1-intro (dawn): the first scene of the finale. Tansy's radio says where the story is (the Combine turned
//   onto the meridian at dawn); Hogweed lights the beacon on the Bobble; every faction sees it, one shot each (the camp,
//   the canal, the Dirt Bowl, the Burrow Door, Café Pardon, where Hector finally takes an order: the gag); Diggs and Wally
//   in formation down the meridian over the Combine and its Vanguard; Tansy at the map table gives the job. Title.
// - even-cut-p1-outro (day): an HOA clipboard face down on the road; the copter sets down; Diggs counts four for four;
//   Pip arrives with the chute, and the player hands him the Countess's key ("Both hands, Pip."); the Combine comes on.
// - even-cut-p2-intro (day): Pip at the Combine's tail with the key in the lock, and it will not turn; the Countess calls
//   (left, dear: the gag); the shield grates fold open on a beige deck; she confirms it, and what it cost; Betony calls
//   with the Even Line's last mark; at the overlook the plane is warm.
// - even-cut-p2-outro (day): a canopy against the sky over the moving machine; the player lands on the beige deck; Pip on
//   the verge; along the deck, the bridge; the roof horns: a visitor on deck, the Porcelain Guard to the rear.
// The Grand Combine is a cutscene set piece (prefab grand-combine-boss fitted to the boss runner's scale 5, nose +z),
// moved down the meridian between cuts, never inside a shot: it is closer every time anyone looks.
// Stages: quests/stages/story/s70a-even-cut.ts. Notes: docs/design/gnome-theft-auto/direction/scenes/<id>.md.
import type { ScriptProp, SceneScript, Step, Vec2, Vec3 } from '../../script';
import { beat, coverage, cut, insert, pushIn, reaction, shot } from '../../direct';
import { carMark, markOf, pathOf, spot, up } from './kit';

const NOTES = 'docs/design/gnome-theft-auto/direction/scenes/';
const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);
const HOA_LOOK = { hat: 0x18181e, shirt: 0xc9b99b } as const;

// ---- The machine on the meridian --------------------------------------------------------------------------------------
/** The boss runner draws grand-combine-boss at scale 5: about 12.4 m across the intake. */
const COMBINE_SIZE = 12.4;
/** Height of the rear hull's top at scale 5 (hull 3.6 + 2.2), where the shield grates sit and the deck opens. */
const HULL_TOP = 5.8;
/** The Combine (nose +z, rolling south) with its centre at z; hidden until combineAt() spawns it. */
function combineProp(z: number, hidden = false): ScriptProp {
  return { id: 'combine', prefab: 'grand-combine-boss', at: [0, z], yaw: 0, size: COMBINE_SIZE, by: 'w', hidden };
}
/** Move the Combine to z (between cuts only). */
const combineAt = (z: number): Step => ({ do: 'spawn', id: 'combine', at: [0, z], yaw: 0 });
/** The open deck: two beige deck segments on the rear hull, behind the bridge (the hull runs z-6.3 .. z+3.9). */
function deckProps(z: number, hidden: boolean): ScriptProp[] {
  return [-1.9, 1.9].map((x, i) => ({
    id: `deck-${i}`, prefab: 'combine-test-deck', at: up(x, z - 3.6, HULL_TOP), yaw: 0, size: 3.6, by: 'w' as const, hidden,
  }));
}

// ---- Places ---------------------------------------------------------------------------------------------------------
const BOB = 'e70a-bobble-dawn';
const CAMP = 'e70a-camp-dawn';
const MER = 'e70a-meridian';
const PLANE = 'e70a-overlook-plane';
const SAFE = 'dust-safehouse';
/** The beacon basket on the Bobble (row 64 p2's spot) and the fire that goes up in it. */
const BEACON: Vec2 = [697.4, -1688.4];
/** Due north-north-east from anywhere in the yard: where every face turns. */
const toBobble = (p: Vec2): number => towards(p, BEACON);

const B_HOG = markOf(BOB, 'hogweed');
const C_WALLY = markOf(CAMP, 'wally');
const C_DIGGS = markOf(CAMP, 'diggs');
const CANAL_GRANNY = markOf('brenda-throne', 'biker', 0);
/** Brenda off her throne (it is solid), on the bank beside it, as the finale's canal shot stood her. */
const CANAL_BRENDA: Vec2 = [-42, 214];
const BOWL_CLARY = markOf('rutbottom-tower', 'clary');
const DOOR_NUBBIN = markOf('burrow-door', 'nubbin');
const CAFE_HECTOR = markOf('cafe-pardon-terrace', 'hector');
const S_TANSY = markOf(SAFE, 'tansy');
const S_PLAYER = markOf(SAFE, 'player');

/** Diggs's copter and Wally's Crop Duster in formation, north up the meridian at ~26 m, the plane on the right. */
const DUSTER_AIR: Vec3[] = [up(3, -96, 26), up(3, -200, 27), up(4, -330, 29), up(8, -470, 32)];
const COPTER_AIR: Vec3[] = [up(-7, -100, 24), up(-7, -204, 25), up(-6, -334, 27), up(-2, -474, 30)];
/** The Vanguard: two HOA vans and their marshals walking out in front of the machine. */
const VAN_A: Vec2 = [-2.5, -226];
const VAN_B: Vec2 = [2.5, -214];

const TABLE = coverage('tansy', 'player', 1);

/**
 * The finale opens. Picture first: the Bobble at first light, and Tansy's voice on Hogweed's radio saying where the story
 * is. He lights the beacon. Every faction sees it, one shot each, nobody speaks except a waiter who has never taken an
 * order and takes one now. Diggs and Wally come down the meridian in formation over the machine and its Vanguard. At the
 * map table Tansy gives the job in two lines. Chapter title.
 */
export const P1_INTRO: SceneScript = {
  id: 'even-cut-p1-intro',
  stage: { kind: 'world' },
  sky: 'golden',
  ambience: 'wind',
  radio: 0,
  direction: { notes: `${NOTES}even-cut-p1-intro.md`, kind: 'chapter-open' },
  actors: [
    { id: 'hogweed', preset: 'hogweed', held: null, at: B_HOG.at, yaw: B_HOG.yaw },
    { id: 'wally-camp', preset: 'wally', name: 'Wind-Sock Wally', held: null, at: C_WALLY.at, yaw: C_WALLY.yaw },
    { id: 'diggs-camp', preset: 'diggs', name: 'Commander Diggs', held: null, at: C_DIGGS.at, yaw: C_DIGGS.yaw },
    { id: 'granny', preset: 'granny', at: CANAL_GRANNY.at, yaw: towards(CANAL_GRANNY.at, [-30, 206]) },
    { id: 'brenda', preset: 'brenda', at: CANAL_BRENDA, yaw: towards(CANAL_BRENDA, [-30, 206]) },
    { id: 'clary', preset: 'clary', at: BOWL_CLARY.at, yaw: BOWL_CLARY.yaw },
    { id: 'nubbin', preset: 'nubbin', at: DOOR_NUBBIN.at, yaw: DOOR_NUBBIN.yaw },
    { id: 'hector', preset: 'hector', at: CAFE_HECTOR.at, yaw: CAFE_HECTOR.yaw },
    { id: 'diggs', preset: 'diggs', held: null, at: [0, 0], seatedIn: 'copter' },
    { id: 'wally', preset: 'wally', held: null, at: [0, 0], seatedIn: 'duster' },
    { id: 'marshal-a', name: 'HOA Vanguard', look: HOA_LOOK, at: [-6, -205], yaw: 0, held: 'hoa-clipboard' },
    { id: 'marshal-b', name: 'HOA Vanguard', look: HOA_LOOK, at: [6, -201], yaw: 0 },
    { id: 'tansy', preset: 'tansy', at: S_TANSY.at, yaw: towards(S_TANSY.at, S_PLAYER.at), held: null },
    { id: 'player', player: true, held: null, at: S_PLAYER.at, yaw: towards(S_PLAYER.at, S_TANSY.at) },
  ],
  vehicles: [
    { id: 'duster', kind: 'plane', at: DUSTER_AIR[0], yaw: Math.PI },
    { id: 'copter', kind: 'sycamore-copter', at: COPTER_AIR[0], yaw: Math.PI },
    { id: 'van-a', kind: 'hoa-van', at: VAN_A, yaw: 0, headlights: true },
    { id: 'van-b', kind: 'hoa-van', at: VAN_B, yaw: 0, headlights: true },
  ],
  props: [
    { id: 'tripod', prefab: 'hatbrim-beacon', at: up(BEACON[0], BEACON[1], 0), yaw: 0, size: 2.4, by: 'h' },
    { id: 'fire', prefab: 'campfire', at: up(BEACON[0], BEACON[1], 2.0), yaw: 0, size: 0.9, hidden: true },
    combineProp(-262),
    // The Stopping Stone on the map table, under Tansy's hand: what all of this is for.
    { id: 'stone', prefab: 'stopping-stone', at: up(270, 40.4, 0.92), yaw: 0.4, size: 0.4 },
  ],
  steps: [
    // 1. Hook: the top of the yard at first light, a cold basket on a tripod, and a radio in a pocket saying where we are.
    cut(spot(BOB, 'dawn-wide')),
    { do: 'sfx', id: 'static', at: 'hogweed', gain: 0.6 },
    { do: 'say', who: 'Tansy Clayfoot', hz: 118, text: 'It turned onto the meridian at dawn, Hogweed. Light it.' },
    cut(shot('hogweed', 'mcu', { side: 35 })),
    { do: 'gesture', who: 'hogweed', name: 'check-watch', s: 1.2, async: true },
    { do: 'say', who: 'hogweed', text: 'Longest day. Dawn. ...The ratios agree.' },
    // 2. The basket catches.
    cut(spot(BOB, 'basket-low')),
    { do: 'sfx', id: 'pop', at: 'tripod', gain: 0.5 },
    { do: 'wait', s: 0.6 },
    { do: 'spawn', id: 'fire' },
    { do: 'sfx', id: 'whoosh', at: 'tripod', gain: 0.8, async: true },
    { do: 'music', track: 'heist', fade: 0.8 },
    { do: 'wait', s: 1.4 },
    // The reveal: up and back off the stones, a fire on the highest ground in the yard.
    { do: 'cam', shot: { kind: 'dolly', from: up(700.5, -1680, 2.4), to: up(712, -1670, 9), look: up(697.4, -1688.4, 2.2), s: 3.6, fov: 50 } },
    { do: 'sfx', id: 'crunch', at: 'tripod', gain: 0.4, async: true },
    { do: 'wait', s: 3.6 },
    // 3. Every faction sees it. One shot each, no lines; a face turns, a hand moves.
    // The camp: Wally, who stands only for something in the air, stands up.
    cut(spot(CAMP, 'camp-low')),
    { do: 'face', who: 'diggs-camp', at: [262, 20], s: 0.4, async: true },
    { do: 'gesture', who: 'wally-camp', name: 'stand', s: 1.0, async: true },
    { do: 'sfx', id: 'creak', at: 'wally-camp', gain: 0.5 },
    { do: 'wait', s: 1.8 },
    // The canal: Granny breaks the shotgun shut and looks north.
    cut(shot('granny', 'ms', { side: 20, height: 'low' })),
    { do: 'face', who: 'granny', yaw: toBobble(CANAL_GRANNY.at), s: 0.6, async: true },
    { do: 'face', who: 'brenda', yaw: toBobble(CANAL_BRENDA), s: 0.6, async: true },
    { do: 'sfx', id: 'latch', at: 'granny', gain: 0.6 },
    { do: 'wait', s: 1.8 },
    // The Dirt Bowl: Clary's flag goes up, and every engine in the paddock answers it.
    cut(spot('rutbottom-tower', 'tower')),
    { do: 'gesture', who: 'clary', name: 'handsUp', s: 1.2, async: true },
    { do: 'sfx', id: 'bell', at: 'clary', gain: 0.6 },
    { do: 'sfx', id: 'engine-rev', at: 'clary', gain: 0.4, async: true },
    { do: 'wait', s: 1.7 },
    // The Burrow Door, at a mole's eye height: Nubbin points, and squeaks it down the hole.
    cut({ kind: 'cut', pos: up(-989.8, 305.0, 0.45), look: up(-993, 303.5, 0.55), fov: 38 }),
    { do: 'face', who: 'nubbin', yaw: toBobble(DOOR_NUBBIN.at), s: 0.4 },
    { do: 'gesture', who: 'nubbin', name: 'point', s: 1.0, async: true },
    { do: 'sfx', id: 'squeak', at: 'nubbin', gain: 0.6 },
    { do: 'wait', s: 1.5 },
    // Café Pardon: the waiter who has not taken an order in days takes one. The scene's one gag.
    cut(shot('hector', 'mcu', { side: 25 })),
    { do: 'face', who: 'hector', yaw: toBobble(CAFE_HECTOR.at), s: 0.6 },
    { do: 'gesture', who: 'hector', name: 'take-notes', s: 1.4, async: true },
    { do: 'sfx', id: 'paper', at: 'hector', gain: 0.5, async: true },
    { do: 'say', who: 'hector', text: '...Very good. One beacon.' },
    // 4. The air wing: down the meridian in formation, low over a street-long machine and its escort.
    { do: 'music', track: 'sandpit', fade: 0.6 },
    cut({ kind: 'track', pos: up(6.5, -150, 1.0), who: 'duster', fov: 54 }),
    { do: 'drive', vehicle: 'duster', path: DUSTER_AIR, speed: 26, arrive: false, async: true },
    { do: 'drive', vehicle: 'copter', path: COPTER_AIR, speed: 26, arrive: false, async: true },
    { do: 'sfx', id: 'whoosh', at: 'duster', gain: 0.8, async: true },
    { do: 'wait', s: 2.6 },
    cut(shot('diggs', 'ms', { side: 60 })),
    { do: 'gesture', who: 'diggs', name: 'salute', s: 1.0, async: true },
    { do: 'say', who: 'diggs', text: 'Spade Guard air wing. Two aircraft. Effective immediately.' },
    cut(shot('wally', 'ms', { side: -60 })),
    { do: 'say', who: 'wally', text: 'Copter on my wing, kid. Wind dead calm. Good.' },
    // Their view: the machine on the meridian, the Vanguard walking out in front of it. The vans roll at its pace.
    cut({ kind: 'cut', pos: up(-9, -168, 24), look: up(0, -248, 3), fov: 46 }),
    { do: 'drive', vehicle: 'van-a', path: [[-2.5, -214]], speed: 2.2, arrive: false, async: true },
    { do: 'drive', vehicle: 'van-b', path: [[2.5, -202]], speed: 2.2, arrive: false, async: true },
    { do: 'sfx', id: 'engine-rev', at: 'combine', gain: 0.9, async: true },
    { do: 'shake', amp: 0.03, s: 2.6 },
    { do: 'wait', s: 2.6 },
    // 5. The map table: the job, in two lines.
    { do: 'music', track: null, fade: 0.5 },
    cut(TABLE.single('tansy', 'mcu')),
    { do: 'sfx', id: 'tap', at: 'stone', gain: 0.4, async: true },
    { do: 'say', who: 'tansy', text: 'Four of his Vanguard walk out in front of it.' },
    ...reaction('player', { toward: 'tansy', size: 'mcu', hold: 'pause' }),
    cut(pushIn('tansy', 'mcu', 4.0, { toward: 'player', side: 25, height: 'low' })),
    { do: 'say', who: 'tansy', text: 'Take them off the road. Then the deck.' },
    // Button: the title over the table, the fort and the beacon's morning behind them.
    { do: 'music', track: 'sandpit', fade: 0.8 },
    { do: 'cam', shot: { kind: 'dolly', from: up(281.5, 56, 1.4), to: up(279.5, 54, 2.2), look: up(268, 42, 1.3), s: 4.2, fov: 50 } },
    { do: 'walk', who: 'player', path: [[273.2, 47.2]], speed: 1.2, async: true },
    { do: 'stinger', id: 'chapter' },
    { do: 'title', text: 'CHAPTER 5 — THE EVEN CUT' },
    { do: 'wait', s: 2.8 },
    { do: 'title', text: null },
  ],
};

// ---- p1 outro: four for four ------------------------------------------------------------------------------------------
const M_PLAYER = markOf(MER, 'player');
const M_DIGGS = markOf(MER, 'diggs');
const M_PIP = markOf(MER, 'pip');
const COPTER_DOWN = carMark(MER, 'e70a-copter-down');
const PIP_IN = pathOf(MER, 'pip-in');
const ROAD = coverage('diggs', 'player', 1);
const KEY = coverage('player', 'pip', -1);

/**
 * Day on the meridian. An HOA clipboard face down on the asphalt, trembling. The copter sets down; Diggs counts the
 * Vanguard off. Pip pedals up with the chute on his back, and the player hands him the Countess's key: "Both hands, Pip."
 * The machine is closer every time anyone looks. Button: Diggs, looking up at it. No gag.
 */
export const P1_OUTRO: SceneScript = {
  id: 'even-cut-p1-outro',
  stage: { kind: 'world' },
  sky: 'noon',
  ambience: 'wind',
  music: 'sandpit',
  radio: 0,
  direction: { notes: `${NOTES}even-cut-p1-outro.md`, kind: 'outro' },
  actors: [
    { id: 'player', player: true, held: 'shield-grate-key', at: M_PLAYER.at, yaw: M_PLAYER.yaw },
    { id: 'diggs', preset: 'diggs', at: [0, 0], seatedIn: 'copter' },
    { id: 'pip', preset: 'pip', held: null, at: [0, 0], seatedIn: 'bike' },
  ],
  vehicles: [
    { id: 'copter', kind: 'sycamore-copter', at: up(COPTER_DOWN.at[0] + 4, COPTER_DOWN.at[1] + 10, 14), yaw: COPTER_DOWN.yaw },
    { id: 'bike', kind: 'push-bike', at: PIP_IN[0], yaw: Math.PI, hidden: true },
    { id: 'duster', kind: 'plane', at: up(-20, -150, 30), yaw: Math.PI, hidden: true },
  ],
  props: [
    combineProp(-276),
    { id: 'clipboard', prefab: 'hoa-clipboard', at: up(1.5, -198, 0.02), yaw: 0.7, size: 0.45 },
    { id: 'chute', prefab: 'parachute-rig', at: up(1.9, -187.9, 0.02), yaw: 0.3, size: 0.6, by: 'h', hidden: true },
  ],
  steps: [
    // Hook: a clipboard face down on the road, trembling with something very big a long way off.
    cut({ kind: 'cut', pos: up(2.7, -196.5, 0.45), look: up(1.5, -198, 0.05), fov: 40 }),
    { do: 'sfx', id: 'engine-rev', at: 'combine', gain: 0.35, async: true },
    { do: 'shake', amp: 0.02, s: 1.8 },
    { do: 'wait', s: 1.8 },
    // The road: the player alone on it, the machine far up it, and rotors coming down on the verge.
    cut(spot(MER, 'road-north')),
    { do: 'drive', vehicle: 'copter', path: [COPTER_DOWN.at], speed: 5, arrive: true, async: true },
    { do: 'sfx', id: 'whoosh', at: 'copter', gain: 0.6, async: true },
    { do: 'wait', s: 2.8 },
    { do: 'exit', who: 'diggs', s: 0.8 },
    { do: 'walk', who: 'diggs', path: [M_DIGGS.at], speed: 1.6 },
    { do: 'face', who: 'diggs', at: 'player', s: 0.3, async: true },
    { do: 'face', who: 'player', at: 'diggs', s: 0.3 },
    // Diggs: the count.
    cut(ROAD.single('diggs', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'diggs', name: 'salute', s: 1.0, async: true },
    { do: 'say', who: 'diggs', text: 'Four for four. The Vanguard is off the road.' },
    cut(ROAD.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'And the thing it was guarding?' },
    // Between cuts the machine has come on.
    combineAt(-262),
    cut(spot(MER, 'under-low')),
    { do: 'sfx', id: 'engine-rev', at: 'combine', gain: 0.8, async: true },
    { do: 'shake', amp: 0.03, s: 2.0 },
    { do: 'wait', s: 2.0 },
    // Turn: a bell, and Pip at full pedal with a parachute pack on his back.
    { do: 'spawn', id: 'bike' },
    { do: 'sfx', id: 'bell', at: 'bike', gain: 0.6, async: true },
    cut({ kind: 'track', pos: up(-4.5, -182, 1.2), who: 'bike', fov: 48 }),
    { do: 'drive', vehicle: 'bike', path: PIP_IN.slice(1), speed: 7, arrive: true },
    { do: 'sfx', id: 'skid', at: 'bike', gain: 0.5, async: true },
    { do: 'exit', who: 'pip', s: 0.6 },
    { do: 'spawn', id: 'chute' },
    { do: 'walk', who: 'pip', path: [M_PIP.at], speed: 2.4 },
    { do: 'face', who: 'pip', at: 'player', s: 0.2, async: true },
    { do: 'face', who: 'player', at: 'pip', s: 0.3 },
    cut(KEY.single('pip', 'mcu')),
    { do: 'gesture', who: 'pip', name: 'point', s: 0.9, async: true },
    { do: 'say', who: 'pip', text: "Hogweed packed the chute! He says it's almost certainly a chute!" },
    // The key goes over, the way it came to the player: both hands.
    cut(KEY.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Tail lock. Both hands, Pip.' },
    cut(insert('player', { toward: 'pip', side: -30 })),
    { do: 'give', from: 'player', to: 'pip', prop: 'shield-grate-key', s: 1.2 },
    { do: 'sfx', id: 'keys', at: 'pip', gain: 0.5, async: true },
    cut(KEY.single('pip', 'mcu')),
    { do: 'gesture', who: 'pip', name: 'lean', s: 1.0, async: true },
    { do: 'say', who: 'pip', text: "Got it. Got it! I've... mostly got it." },
    // Button: closer again. Diggs looks up at it, and the plane goes over him low.
    combineAt(-250),
    { do: 'spawn', id: 'duster' },
    { do: 'face', who: 'diggs', at: [0, -244], s: 0.1 },
    cut(shot('diggs', 'mcu', { side: 30, height: 'low' })),
    { do: 'drive', vehicle: 'duster', path: [up(-6, -200, 22), up(-2, -300, 24)], speed: 30, arrive: false, async: true },
    { do: 'sfx', id: 'whoosh', at: 'duster', gain: 0.7, async: true },
    { do: 'sfx', id: 'engine-rev', at: 'combine', gain: 0.9, async: true },
    { do: 'music', track: null, fade: 1.0 },
    beat('pause'),
    { do: 'wait', s: 1.2 },
  ],
};

// ---- p2 intro: left, dear -------------------------------------------------------------------------------------------
const TAIL_PIP = markOf(MER, 'pip', 1);
const MANOR = markOf('manor-terrace-day', 'player');
const ANTHILL_BETONY = markOf('anthill-forecourt', 'betony');
const PL_PLAYER = markOf(PLANE, 'player');
const PL_PLANE = carMark(PLANE, 'e70a-plane');
/** The Combine for p2: its tail lock plate is at the back of the hull, Pip a pace behind it. */
const P2_Z = -246;

/**
 * Day. Pip at the tail of the machine with the Countess's key in its lock plate, and it will not turn. A phone: the
 * Countess, who can hear a key not turning from Trellisdown. Left, dear. The grates fold open on a beige deck; she
 * confirms it, and what it cost. Betony calls with the Even Line's last mark: jump where the line says it will be. At the
 * overlook, the plane is warm and the player straps in. Button: a look north.
 */
export const P2_INTRO: SceneScript = {
  id: 'even-cut-p2-intro',
  stage: { kind: 'world' },
  sky: 'noon',
  ambience: 'wind',
  music: 'tension',
  radio: 0,
  direction: { notes: `${NOTES}even-cut-p2-intro.md`, kind: 'intro' },
  actors: [
    { id: 'pip', preset: 'pip', held: 'shield-grate-key', at: TAIL_PIP.at, yaw: TAIL_PIP.yaw },
    { id: 'wisteria', preset: 'wisteria', held: null, at: MANOR.at, yaw: Math.PI / 2 },
    { id: 'betony', preset: 'betony', at: ANTHILL_BETONY.at, yaw: ANTHILL_BETONY.yaw },
    { id: 'player', player: true, held: 'parachute-rig', at: PL_PLAYER.at, yaw: PL_PLAYER.yaw },
  ],
  vehicles: [
    { id: 'plane', kind: 'plane', at: PL_PLANE.at, yaw: PL_PLANE.yaw },
  ],
  props: [
    combineProp(P2_Z),
    ...deckProps(P2_Z, true),
  ],
  steps: [
    // Hook: a small gnome at the tail of a street-long machine, a brass key in a lock plate, and both arms on it.
    cut(shot('pip', 'ms', { side: 35 })),
    { do: 'sfx', id: 'keys', at: 'pip', gain: 0.6 },
    { do: 'shake', amp: 0.02, s: 2.6, async: true },
    { do: 'say', who: 'pip', text: "Key's in! It's in! ...It won't turn." },
    cut(insert('pip')),
    { do: 'gesture', who: 'pip', name: 'clutch', s: 1.2, async: true },
    { do: 'sfx', id: 'creak', at: 'pip', gain: 0.6 },
    { do: 'wait', s: 1.2 },
    // A phone, and the one person who would know. The Countess, on her gravel, observing.
    { do: 'sfx', id: 'phone', at: 'pip', gain: 0.5 },
    cut(shot('wisteria', 'mcu', { side: -20, height: 'low' })),
    { do: 'say', who: 'wisteria', text: 'One hears a key not turning.' },
    cut(shot('pip', 'mcu', { side: 30 })),
    { do: 'say', who: 'pip', text: 'You can hear that? From Trellisdown?' },
    cut(shot('wisteria', 'cu', { side: -20, height: 'low' })),
    { do: 'say', who: 'wisteria', text: 'To the left, dear. A Brassknock turns everything to the left.' },
    // The scene's gag lands on a held reaction: Pip turns it left, and it goes.
    ...reaction('pip', { gesture: 'flinch', size: 'mcu', side: 30, hold: 'pause' }),
    { do: 'sfx', id: 'latch', at: 'pip', gain: 0.7 },
    // The reveal: high off the flank, the shield grates fold back one after another on a long beige deck.
    cut(spot(MER, 'deck-high')),
    { do: 'music', track: null, fade: 0.4 },
    { do: 'sfx', id: 'clatter', at: 'combine', gain: 0.7, async: true },
    { do: 'shake', amp: 0.03, s: 1.0, async: true },
    { do: 'wait', s: 0.9 },
    { do: 'spawn', id: 'deck-0' },
    { do: 'sfx', id: 'latch', at: 'deck-0', gain: 0.6 },
    { do: 'wait', s: 0.7 },
    { do: 'spawn', id: 'deck-1' },
    { do: 'sfx', id: 'latch', at: 'deck-1', gain: 0.6 },
    { do: 'music', track: 'tension', fade: 0.6 },
    { do: 'wait', s: 1.4 },
    // She confirms it, and what it cost.
    cut(pushIn('wisteria', 'mcu', 4.6, { to: 'cu', side: -20, height: 'low' })),
    { do: 'say', who: 'wisteria', text: 'There. Six harvests paid for those grates. See they are used.' },
    // Pip hears what it cost her, and says nothing for once. Then the other phone.
    ...reaction('pip', { gesture: 'nod', size: 'mcu', side: 30, hold: 'pause' }),
    { do: 'sfx', id: 'phone', at: 'pip', gain: 0.4 },
    // Betony, from the Anthill, with the Even Line's last mark.
    cut(shot('betony', 'mcu', { side: 25, height: 'low' })),
    { do: 'gesture', who: 'betony', name: 'read-map', s: 1.6, async: true },
    { do: 'say', who: 'betony', text: 'As I was saying. It keeps the Even Line to the inch.' },
    cut(insert('betony', { side: 30 })),
    { do: 'sfx', id: 'paper', at: 'betony', gain: 0.5 },
    { do: 'wait', s: 1.0 },
    cut(shot('betony', 'cu', { side: 40 })),
    { do: 'say', who: 'betony', text: 'So do not jump where it is. Jump where the line says it will be.' },
    cut(shot('betony', 'ms', { side: 20, height: 'low' })),
    { do: 'say', who: 'betony', text: 'The north end of the meridian. Ten past. Not eleven.' },
    // The overlook: the plane ticking over, the player at the wing with a pack on.
    cut(spot(PLANE, 'plane')),
    { do: 'sfx', id: 'engine-rev', at: 'plane', gain: 0.5, async: true },
    { do: 'sfx', id: 'zip', at: 'player', gain: 0.5 },
    { do: 'wait', s: 1.6 },
    cut(shot('pip', 'mcu', { side: -30 })),
    { do: 'gesture', who: 'pip', name: 'cheer', s: 1.2, async: true },
    { do: 'say', who: 'pip', text: "Grates are open! Over it and jump! I'll wave!" },
    // Button: the player alone at the wing, looking north where the line goes.
    { do: 'face', who: 'player', yaw: Math.PI + 0.25, s: 0.4 },
    cut(shot('player', 'mcu', { side: 25, height: 'low' })),
    { do: 'music', track: 'chase', fade: 0.8 },
    beat('pause'),
  ],
};

// ---- p2 outro: on deck ----------------------------------------------------------------------------------------------
/** The Combine for the landing: the drop zone's centre (0, -240). */
const P2O_Z = -240;
const DECK_SPOT: Vec2 = [-0.6, P2O_Z - 4.2];
const VERGE_PIP = markOf(MER, 'pip', 2);

/**
 * Day. Straight up from the road: a striped canopy against the sky over a moving machine. Closer. Then the player's own
 * eyes: the beige deck coming up, the thud, the silk settling. Pip on the verge (the line he has waited all part to say).
 * Along the deck to the back of the bridge. Button: the roof horns crackle and a voice that is not Vesper's sends the
 * Porcelain Guard to the rear. The landing is a point of view on purpose: the deck is a cutscene prop (an actor cannot
 * stand on it), and this is the player's landing, nobody else's. No gag after Pip's.
 */
export const P2_OUTRO: SceneScript = {
  id: 'even-cut-p2-outro',
  stage: { kind: 'world' },
  sky: 'noon',
  ambience: 'wind',
  music: 'chase',
  radio: 0,
  direction: { notes: `${NOTES}even-cut-p2-outro.md`, kind: 'outro' },
  actors: [
    { id: 'pip', preset: 'pip', held: null, at: VERGE_PIP.at, yaw: VERGE_PIP.yaw },
  ],
  props: [
    combineProp(P2O_Z),
    ...deckProps(P2O_Z, false),
    { id: 'canopy', prefab: 'parachute-canopy', at: up(0, P2O_Z - 2, 26), yaw: 0.4, size: 3.2, by: 'w', hidden: true },
  ],
  steps: [
    // Hook: straight up from the road ahead of the machine, a canopy opening against the sky.
    cut(spot(MER, 'sky-low')),
    { do: 'sfx', id: 'engine-rev', at: 'combine', gain: 0.7, async: true },
    { do: 'wait', s: 0.6 },
    { do: 'spawn', id: 'canopy' },
    { do: 'sfx', id: 'flutter', at: 'canopy', gain: 0.7 },
    { do: 'wait', s: 1.8 },
    // Closer: the canopy over the open deck, the deck sliding along under it.
    { do: 'spawn', id: 'canopy', at: up(-0.4, P2O_Z - 3.4, 13), yaw: 0.6 },
    cut({ kind: 'cut', pos: up(-10, P2O_Z - 12, 8.5), look: up(-0.4, P2O_Z - 3.4, 11), fov: 44 }),
    { do: 'sfx', id: 'flutter', at: 'canopy', gain: 0.6 },
    { do: 'shake', amp: 0.02, s: 1.6, async: true },
    { do: 'wait', s: 1.6 },
    // The player's own eyes: the beige deck coming up fast, then the thud.
    { do: 'despawn', id: 'canopy' },
    { do: 'cam', shot: { kind: 'dolly', from: up(DECK_SPOT[0], DECK_SPOT[1] - 0.6, HULL_TOP + 7), to: up(DECK_SPOT[0], DECK_SPOT[1], HULL_TOP + 1.3), look: up(0, P2O_Z + 2, HULL_TOP + 0.6), s: 1.6, ease: 'linear', fov: 56 } },
    { do: 'sfx', id: 'whoosh', gain: 0.6, async: true },
    { do: 'wait', s: 1.6 },
    { do: 'sfx', id: 'thud', gain: 0.9 },
    { do: 'shake', amp: 0.06, s: 0.7, async: true },
    // The silk comes down across the beige in front of them.
    { do: 'spawn', id: 'canopy', at: up(DECK_SPOT[0] - 1.8, DECK_SPOT[1] + 2.0, HULL_TOP + 0.3), yaw: 1.2 },
    { do: 'sfx', id: 'flutter', at: 'canopy', gain: 0.5 },
    { do: 'wait', s: 1.2 },
    // Pip on the verge, both arms going, looking up at where the player is.
    { do: 'face', who: 'pip', at: DECK_SPOT, s: 0.2 },
    cut(shot('pip', 'mcu', { side: 20 })),
    { do: 'gesture', who: 'pip', name: 'cheer', s: 1.2, async: true },
    { do: 'say', who: 'pip', text: 'Touchdown! On a moving building! Legitimate!' },
    // Along the deck to the back of the bridge: how long it is, and where it goes.
    { do: 'music', track: null, fade: 0.6 },
    { do: 'cam', shot: { kind: 'dolly', from: up(DECK_SPOT[0], DECK_SPOT[1], HULL_TOP + 1.3), to: up(DECK_SPOT[0] + 0.2, DECK_SPOT[1] + 1.6, HULL_TOP + 1.4), look: up(0, P2O_Z + 1.4, 7.4), s: 3.4, fov: 50 } },
    { do: 'sfx', id: 'engine-rev', at: 'combine', gain: 0.6, async: true },
    { do: 'shake', amp: 0.015, s: 3.4, async: true },
    { do: 'wait', s: 3.4 },
    // Button: up to the roof horns. They crackle. Not Vesper: his staff, sending his Guard.
    cut({ kind: 'cut', pos: up(DECK_SPOT[0] + 0.2, DECK_SPOT[1] + 1.6, HULL_TOP + 1.4), look: up(-1.5, P2O_Z + 2.6, 9.2), fov: 40 }),
    { do: 'sfx', id: 'static', at: 'combine', gain: 0.8 },
    { do: 'say', who: 'HOA Address System', hz: 90, text: 'Visitor on deck. Porcelain Guard to the rear, please.' },
    { do: 'stinger', id: 'danger' },
    beat('pause'),
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'even-cut-p1-intro': P1_INTRO,
  'even-cut-p1-outro': P1_OUTRO,
  'even-cut-p2-intro': P2_INTRO,
  'even-cut-p2-outro': P2_OUTRO,
};
