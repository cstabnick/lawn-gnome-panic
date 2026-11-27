// Story row 56 scenes: A Mortar for a Mower. Intro (night): Hogweed calls the overlook on the dispatch radio and tilts a slate of
// ratios at the box, so that Pip can see it ("I can almost see it"); a small mortar, and "a parachute that almost certainly
// opens"; the Dewdrop rolls past behind him and he calls "Run slower!" without turning round (row 10's line, on its second
// rung). Mid (night, the hold at the bench): the mortar bolted, the rig packed twice, a Hat Watch van crawling past while
// everybody freezes, the Dewdrop the other way, the permit stamped GRANTED (BY ME). Outro (dawn): Hogweed sells parachute parts
// now (spare "almosts"); Pip reads the stencil, asks what "almost" is, and pulls the cord to find out.
// Notes: docs/design/gnome-theft-auto/direction/scenes/mortar-for-a-mower-{intro,fit,outro}.md
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, reaction, shot } from '../../direct';
import { markOf, spot, up } from './kit';

const RADIO = 'm56-radio-night';
const UNDER = 'm56-underspan-night';
const DAWN = 'm56-dawn-strip';

const R_PIP = markOf(RADIO, 'pip');
const R_YOU = markOf(RADIO, 'player');
const H_CALL = markOf(UNDER, 'hogweed', 0);
const H_BENCH = markOf(UNDER, 'hogweed', 1);
const B_YOU = markOf(UNDER, 'player');
const D_PIP = markOf(DAWN, 'pip');
const D_YOU = markOf(DAWN, 'player');

/** The Dewdrop's run across the yard (row 10's: z -30 is clear from wall to wall of the site, x 560..600). */
const DEWDROP_RUN: Vec2[] = [[563, -30], [583, -30], [598, -30]];
/** The Hat Watch van's slow crawl along the open flat south of the Underspan (clear of the shed corners, z 4). */
const VAN_PASS: Vec2[] = [[628, 4], [596, 4], [560, 4]];
const TESTER_LOOK = { hat: 0xe0b020, shirt: 0x3d5a80, glasses: true } as const;

const PIP_YOU = coverage('pip', 'player', 1);

/** Row 56 intro: Hogweed on the radio; the board is tilted at a box. Night. */
const INTRO: SceneScript = {
  id: 'mortar-for-a-mower-intro',
  stage: { kind: 'world' },
  music: 'heist',
  ambience: 'night',
  sky: 'night',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/mortar-for-a-mower-intro.md', kind: 'intro' },
  actors: [
    { id: 'pip', preset: 'pip', held: 'dispatch-radio', at: R_PIP.at, yaw: R_PIP.yaw },
    { id: 'player', player: true, held: null, at: R_YOU.at, yaw: R_YOU.yaw },
    { id: 'hogweed', preset: 'hogweed', held: 'bookie-chalk-slate', at: H_CALL.at, yaw: H_CALL.yaw },
    { id: 'tester', name: 'Tester', look: TESTER_LOOK, hz: 150, hidden: true, seatedIn: 'dewdrop', at: [0, 0] },
  ],
  vehicles: [{ id: 'dewdrop', kind: 'bubble-mobile', at: DEWDROP_RUN[0], yaw: Math.PI / 2, hidden: true, headlights: true }],
  props: [
    // The overlook end: the lantern post that lights Pip, and the plan board pale behind the table.
    { id: 'lantern', prefab: 'camp-lantern-post', at: [273.8, 43.4], yaw: 0 },
    { id: 'board', prefab: 'heist-board', at: [273.4, 36], yaw: -Math.PI / 2, size: 2.0 },
    // The Underspan end: a lamp post on the dirt and the big chalkboard of ratios, behind and beside Hogweed.
    { id: 'lamp', prefab: 'euro-lamp-post', at: [583.4, -22], yaw: 0 },
    { id: 'chalkboard', prefab: 'euro-chalkboard-sign', at: [577.6, -25.4], yaw: 0.25, size: 1.5 },
  ],
  steps: [
    // Hook: the radio spits, and Pip lunges at it as if it were the last cookie.
    cut(spot(RADIO, 'night-wide')),
    { do: 'sfx', id: 'static', at: 'pip', gain: 0.6, async: true },
    { do: 'gesture', who: 'pip', name: 'point', s: 1.2, async: true },
    { do: 'wait', s: 1.5 },
    cut(PIP_YOU.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Hogweed! Yes! Go on, I am listening!' },
    // The other end of the line: a man at a chalkboard, talking to a box as if the box had eyes.
    cut(shot('hogweed', 'mcu')),
    { do: 'sfx', id: 'static', at: 'hogweed', gain: 0.35, async: true },
    { do: 'gesture', who: 'hogweed', name: 'point', s: 1.2, async: true },
    { do: 'say', who: 'hogweed', text: '...seven to two! Unless it is two to seven, which is a different mortar!' },
    cut(PIP_YOU.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Seven to two! Love it. Is that the good one?' },
    cut(shot('hogweed', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'hogweed', name: 'lean', s: 1.3, async: true },
    { do: 'say', who: 'hogweed', text: 'Nobody knows! Can you see the board? I will tilt it.' },
    // The straight man, and the lie that follows.
    cut(PIP_YOU.single('player', 'mcu')),
    beat('pause'),
    { do: 'say', who: 'player', text: 'It is a radio.' },
    cut(PIP_YOU.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Shh. I can almost see it.' },
    // The turn: the offer, and the word that will be the quest's refrain.
    cut(shot('hogweed', 'mcu')),
    { do: 'say', who: 'hogweed', text: 'The Underspanners heard about the fort. I have a small mortar.' },
    cut(PIP_YOU.single('pip', 'mcu')),
    { do: 'gesture', who: 'pip', name: 'cheer', s: 0.8, async: true },
    beat('pause'),
    cut(shot('hogweed', 'mcu', { height: 'low' })),
    { do: 'say', who: 'hogweed', text: 'And a parachute that almost certainly opens.' },
    cut(PIP_YOU.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'How almost?' },
    cut(shot('hogweed', 'mcu', { height: 'low' })),
    { do: 'say', who: 'hogweed', text: 'The sums disagreed in a hopeful direction.' },
    // The job, said in his own breath; then the Dewdrop crosses the yard behind him and he does not turn.
    cut(shot('hogweed', 'ms')),
    { do: 'spawn', id: 'dewdrop' },
    { do: 'spawn', id: 'tester' },
    { do: 'drive', vehicle: 'dewdrop', path: DEWDROP_RUN, speed: 5.5, arrive: false, async: true },
    { do: 'sfx', id: 'whoosh', at: 'dewdrop', gain: 0.5, async: true },
    { do: 'say', who: 'hogweed', text: 'Bring the plane to the Span. Low, past the vans. Mind the gap!' },
    { do: 'wait', s: 0.6 },
    { do: 'say', who: 'hogweed', text: 'Run slower!' },
    { do: 'wait', s: 1.0 },
  ],
};

const HOG_YOU = coverage('hogweed', 'player', 1, 20);

/** Row 56 mid: the hold at the bench. The tube bolted, the rig packed twice, a van, a ball, a stamp. Night. */
const FIT: SceneScript = {
  id: 'mortar-for-a-mower-fit',
  stage: { kind: 'world' },
  music: 'mystery',
  ambience: 'night',
  sky: 'night',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/mortar-for-a-mower-fit.md', kind: 'arrival' },
  actors: [
    { id: 'hogweed', preset: 'hogweed', held: 'brass-wrench', at: H_BENCH.at, yaw: H_BENCH.yaw },
    { id: 'player', player: true, held: 'parachute-rig', at: B_YOU.at, yaw: B_YOU.yaw },
    { id: 'tester', name: 'Tester', look: TESTER_LOOK, hz: 150, hidden: true, seatedIn: 'dewdrop', at: [0, 0] },
  ],
  vehicles: [
    { id: 'van', kind: 'hoa-van', at: VAN_PASS[0], yaw: -Math.PI / 2, headlights: true, hidden: true },
    { id: 'dewdrop', kind: 'bubble-mobile', at: DEWDROP_RUN[2], yaw: -Math.PI / 2, hidden: true, headlights: true },
  ],
  props: [
    { id: 'lamp', prefab: 'camp-lantern-post', at: [578.4, -8.2], yaw: 0 },
    // The tube on its bracket, bolted to a door laid across the bench's end; the permit, stamped last.
    { id: 'mortar', prefab: 'door-mortar', at: up(575.9, -10.7, 0.9), yaw: Math.PI / 2, size: 0.34, by: 'h' },
    { id: 'permit', prefab: 'citation-slip', at: up(576.1, -9.4, 0.9), yaw: Math.PI / 2, size: 0.4, hidden: true },
  ],
  steps: [
    // Hook: the last bolt, a spark, and a man talking to a spanner.
    cut(spot(UNDER, 'bench-wide')),
    { do: 'sfx', id: 'clatter', at: 'hogweed', gain: 0.5, async: true },
    { do: 'gesture', who: 'hogweed', name: 'point', s: 1.2, async: true },
    { do: 'wait', s: 1.4 },
    cut(HOG_YOU.single('hogweed', 'mcu')),
    { do: 'say', who: 'hogweed', text: 'Bracket, bolt, tube! Stand over there. Further.' },
    // The insert: the thing, and the thing beside it.
    cut(spot(UNDER, 'bench-top')),
    { do: 'sfx', id: 'tap', at: 'mortar', gain: 0.45, async: true },
    { do: 'wait', s: 1.5 },
    cut(HOG_YOU.single('hogweed', 'mcu', { height: 'low' })),
    { do: 'say', who: 'hogweed', text: 'And the rig. I packed it twice. The second time was for luck.' },
    cut(HOG_YOU.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Does it open?' },
    cut(HOG_YOU.single('hogweed', 'mcu')),
    beat('beat'),
    { do: 'say', who: 'hogweed', text: 'Almost certainly!' },
    { do: 'spawn', id: 'permit' },
    { do: 'sfx', id: 'knock', at: 'permit', gain: 0.7, async: true },
    { do: 'shake', amp: 0.012, s: 0.3 },
    // The turn: a van at the bottom of the lane with its lights on; everybody on the bench freezes.
    { do: 'spawn', id: 'van' },
    { do: 'drive', vehicle: 'van', path: VAN_PASS, speed: 4.5, arrive: false, async: true },
    { do: 'music', track: null, fade: 0.4 },
    cut(spot(UNDER, 'bench-wide')),
    { do: 'sfx', id: 'engine-rev', at: 'van', gain: 0.4, async: true },
    { do: 'wait', s: 3.2 },
    cut(HOG_YOU.single('hogweed', 'mcu')),
    { do: 'say', who: 'hogweed', text: 'Do not move. Citations are drawn to movement.' },
    // The van goes; the Dewdrop comes the other way, lit, with someone inside it still running.
    { do: 'despawn', id: 'van' },
    { do: 'music', track: 'mystery', fade: 0.8 },
    { do: 'spawn', id: 'dewdrop' },
    { do: 'spawn', id: 'tester' },
    { do: 'drive', vehicle: 'dewdrop', path: [DEWDROP_RUN[2], DEWDROP_RUN[1], DEWDROP_RUN[0]], speed: 5.5, arrive: false, async: true },
    cut(spot(UNDER, 'yard-wide')),
    { do: 'wait', s: 1.6 },
    cut(shot('tester', 'ms', { side: -55 })),
    { do: 'say', who: 'tester', text: 'Is it morning yet?' },
    cut(HOG_YOU.single('hogweed', 'mcu', { height: 'low' })),
    { do: 'despawn', id: 'dewdrop' },
    { do: 'despawn', id: 'tester' },
    { do: 'say', who: 'hogweed', text: 'Almost! Go. Dawn is coming, and so is the paperwork.' },
    // Button: the permit, stamped GRANTED (BY ME).
    cut(spot(UNDER, 'bench-top')),
    { do: 'sfx', id: 'paper', at: 'permit', gain: 0.35, async: true },
    { do: 'wait', s: 1.6 },
  ],
};

/** Row 56 outro: Pip, the stencil and the word. Dawn. */
const OUTRO: SceneScript = {
  id: 'mortar-for-a-mower-outro',
  stage: { kind: 'world' },
  music: 'turfton-dusk',
  ambience: 'wind',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/mortar-for-a-mower-outro.md', kind: 'outro' },
  actors: [
    { id: 'pip', preset: 'pip', held: 'parachute-rig', at: D_PIP.at, yaw: D_PIP.yaw },
    { id: 'player', player: true, held: null, at: D_YOU.at, yaw: D_YOU.yaw },
  ],
  vehicles: [{ id: 'duster', kind: 'plane', from: 'player', at: [236, 38], yaw: Math.PI / 2, keep: true }],
  props: [
    { id: 'canopy', prefab: 'parachute-canopy', at: D_PIP.at, yaw: 0, hidden: true },
  ],
  steps: [
    // Hook: Pip cradles a pack like a baby, in a long gold light, with a plane behind him ticking as it cools.
    cut(spot(DAWN, 'dawn-wide')),
    { do: 'sfx', id: 'cloth', at: 'pip', gain: 0.4, async: true },
    { do: 'gesture', who: 'pip', name: 'think', s: 1.4, async: true },
    { do: 'wait', s: 1.5 },
    cut(PIP_YOU.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Hogweed sells parachute parts now. Canopy, cord, spare almosts.' },
    cut(PIP_YOU.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Almosts?' },
    // Setup: the stencil, in close.
    cut(shot('pip', 'cu', { height: 'high', toward: 'player', side: 25 })),
    { do: 'sfx', id: 'cloth', at: 'pip', gain: 0.35, async: true },
    { do: 'say', who: 'pip', text: '"Almost certainly." Stencilled on the pack. What is "almost"?' },
    cut(PIP_YOU.single('player', 'mcu')),
    beat('beat'),
    { do: 'say', who: 'player', text: 'Not certainly.' },
    cut(PIP_YOU.single('pip', 'mcu')),
    beat('pause'),
    // The turn: the only way to find out.
    { do: 'say', who: 'pip', text: 'Only one way to find out.' },
    cut(shot('pip', 'ms', { toward: 'player', side: 25 })),
    { do: 'sfx', id: 'pop', at: 'pip', gain: 0.6, async: true },
    { do: 'stinger', id: 'comic' },
    { do: 'spawn', id: 'canopy' },
    { do: 'shake', amp: 0.014, s: 0.4 },
    { do: 'wait', s: 1.5 },
    ...reaction('player', { toward: 'pip', size: 'mcu', hold: 'pause' }),
    // Button: a muffled voice from under a very large umbrella.
    cut(shot('pip', 'ms', { toward: 'player', side: 25 })),
    { do: 'sfx', id: 'flutter', at: 'pip', gain: 0.4, async: true },
    { do: 'say', who: 'pip', text: 'It opens! That is one almost down.' },
    { do: 'wait', s: 1.4 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'mortar-for-a-mower-intro': INTRO,
  'mortar-for-a-mower-fit': FIT,
  'mortar-for-a-mower-outro': OUTRO,
};
