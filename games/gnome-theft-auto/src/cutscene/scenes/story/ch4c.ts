// Chapter 4, the flight home and the Spade Guard truce. Re-directed in the Story B direction pass (docs/design/gnome-theft-auto/direction/lanes.md);
// notes in direction/scenes/<id>.md. Registered through CH4_SCENES in ch4.ts.
import type { SceneScript } from '../../script';
import { beat, coverage, cut, exchangeLooks, reaction, shot } from '../../direct';
import { carMark, markOf, rideOf, spot, up } from './kit';

const SAFE = 'dust-safehouse';
const FIELD = 'airfield-apron';
const GATE = 'fort-sandpit-gate';
const PAD = 'fort-sandpit-pad';

const TANSY = markOf(SAFE, 'tansy');
const PIP = markOf(SAFE, 'pip');
const PLAYER_SAFE = markOf(SAFE, 'player');
const WALLY = markOf(FIELD, 'wally');
const GUARD_A = markOf(FIELD, 'spade-guard', 0);
const GUARD_B = markOf(FIELD, 'spade-guard', 1);
const DUSTER = carMark(FIELD, 'wally-crop-duster');
const CHOPPER = carMark(PAD, 'fort-whirligig');
const SNIPER_W = markOf(PAD, 'spade-guard-sniper', 0);
const SNIPER_E = markOf(PAD, 'spade-guard-sniper', 1);
const GATE_DIGGS = markOf(GATE, 'diggs');
const GATE_PLAYER = markOf(GATE, 'player');
const GATE_GUARD_W = markOf(GATE, 'spade-guard', 0);
const GATE_GUARD_E = markOf(GATE, 'spade-guard', 1);
const DIGGS_RIDE = carMark(GATE, 'diggs-zero-turn');

/** Spade Guard look, shared by every guard in this chapter's scenes (no preset in cast.ts). */
const SPADE = { hat: 0x4b6329, shirt: 0x556b2f, beard: 0x5c3e24 };

/** Diggs and Tansy trade lines in both outro and intro: one coverage object, one side of their line. */
const DIGGS_TANSY = coverage('tansy', 'diggs', 1);
/** Pip and Tansy, the crew's two voices in the truce: one side of their line for the whole exchange. */
const CREW = coverage('pip', 'tansy', 1);
/** The safehouse's establishing camera position (the overlook wide). */
const SAFE_WIDE = spot(SAFE, 'wide').pos;

/**
 * Chapter 4 flight home (quest: The Sandpit Drop, ends at the safehouse (280, 40)). The player flies the stolen
 * Whirligig in and lands in a dust cloud. Commander Diggs tears out of the fort gate on his Zero-Turn and stops
 * in a standoff. The player steps out on foot at the overlook.
 */
export const SANDPIT_DROP_OUTRO: SceneScript = {
  id: 'sandpit-drop-outro',
  stage: { kind: 'world' },
  music: 'triumph',
  ambience: 'wind',
  sky: 'noon',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sandpit-drop-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, at: [290, 38], seatedIn: 'ride' },
    { id: 'tansy', preset: 'tansy', name: 'Tansy Clayfoot', at: TANSY.at, yaw: TANSY.yaw },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: PIP.at, yaw: PIP.yaw, held: 'parachute-rig' },
    { id: 'diggs', preset: 'diggs', name: 'Commander Diggs', at: [0, 0], seatedIn: 'diggs-ride', hidden: true },
  ],
  vehicles: [
    { id: 'ride', kind: 'whirligig', from: 'player', at: up(340, 70, 60) },
    { id: 'diggs-ride', ...rideOf('diggs'), at: DIGGS_RIDE.at, yaw: DIGGS_RIDE.yaw, hidden: true },
  ],
  steps: [
    // 1. Hook: the Whirligig comes down on the safehouse in one wide while the wind is already moving.
    { do: 'cam', shot: { kind: 'cut', pos: spot(SAFE, 'wide').pos, look: 'ride', fov: 50 } },
    { do: 'drive', vehicle: 'ride', path: [up(330, 40, 52), up(308, 16, 46), up(291, 4, 39)], speed: 9, async: true },
    { do: 'wait', s: 1.5 },
    // 2. Tansy below, shading her eyes, bossing the landing.
    cut(shot('tansy', 'mcu', { toward: 'ride', side: 30 })),
    { do: 'gesture', who: 'tansy', name: 'lean', s: 1.2, async: true },
    { do: 'say', who: 'tansy', text: 'Lower. Lower. The dust is not your friend.' },
    { do: 'wait', s: 1.0 },
    // 3. Touchdown: a thud and a dust cloud, the camera tracks the landing.
    { do: 'shake', amp: 0.25, s: 1.2 },
    { do: 'sfx', id: 'thud', at: 'ride', gain: 0.9 },
    { do: 'cam', shot: { kind: 'track', pos: up(304, 1.6, 14), who: 'ride', fov: 50 } },
    { do: 'wait', s: 1.2 },
    cut(shot('pip', 'mcu', { toward: 'ride', side: -30 })),
    { do: 'gesture', who: 'pip', name: 'cheer', s: 1.2, async: true },
    { do: 'say', who: 'pip', text: 'Landed! Nobody check the parachute. Nobody.' },
    // 4. The turn: an engine far off; Pip's cheer freezes; the chase music starts.
    { do: 'wait', s: 0.8 },
    { do: 'spawn', id: 'diggs-ride' },
    { do: 'spawn', id: 'diggs' },
    { do: 'music', track: 'chase', fade: 0.5 },
    { do: 'sfx', id: 'engine-rev', at: 'diggs-ride', gain: 1 },
    ...reaction('pip', { toward: 'ride', gesture: 'flinch', size: 'mcu', hold: 'pause' }),
    // 5. Diggs's Zero-Turn tears out of the fort gate road and skids to a stop by the Whirligig.
    { do: 'cam', shot: { kind: 'track', pos: up(352, 52, 6), who: 'diggs-ride', fov: 50 } },
    { do: 'drive', vehicle: 'diggs-ride', path: [[374, 70], [340, 56], [302, 44]], speed: 15, depart: true, arrive: true },
    { do: 'sfx', id: 'skid', at: 'diggs-ride', gain: 0.9 },
    { do: 'stinger', id: 'danger' },
    { do: 'wait', s: 0.8 },
    { do: 'exit', who: 'diggs' },
    // 6. Diggs, LOW, still, in silence: the standoff.
    { do: 'music', track: null, fade: 0.4 },
    cut(DIGGS_TANSY.single('diggs', 'ms', { height: 'low' })),
    { do: 'say', who: 'diggs', text: 'Fifteen years I\'ve guarded that chopper.' },
    // First story appearance (his earlier scenes were on the radio): the card, on his ms, after his first line.
    { do: 'intro', who: 'diggs' },
    beat('beat'),
    cut(DIGGS_TANSY.single('diggs', 'cu', { height: 'low' })),
    { do: 'say', who: 'diggs', text: 'Nobody turns it on.' },
    { do: 'gesture', who: 'diggs', name: 'point', s: 1.2, async: true },
    // 7. Tansy answers from the safehouse side of the line.
    cut(DIGGS_TANSY.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'It\'s already on, Diggs. We\'re only borrowing it.' },
    cut(DIGGS_TANSY.single('diggs', 'cu', { height: 'low' })),
    { do: 'say', who: 'diggs', text: 'Nobody borrows it either.' },
    // 8. The tell: his hand goes to the brim out of fifteen years of habit, toward the empty pad road. Nobody is there.
    { do: 'sfx', id: 'cloth', at: 'diggs', gain: 0.5, async: true },
    { do: 'face', who: 'diggs', at: [374, 44], s: 0.8, async: true },
    cut(DIGGS_TANSY.single('diggs', 'ms', { height: 'low' })),
    { do: 'gesture', who: 'diggs', name: 'tipHat', s: 1.4 },
    beat('pause'),
    cut(DIGGS_TANSY.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Diggs. Stand down.' },
    { do: 'wait', s: 0.8 },
    // 9. Button: the player climbs out and walks to Diggs; a western standoff, wind only.
    { do: 'exit', who: 'player' },
    // A slow push across the wide (a moving shot, so it can hold the walk-up): the western standoff.
    { do: 'cam', shot: { kind: 'dolly', from: SAFE_WIDE, to: [SAFE_WIDE[0] + 4, SAFE_WIDE[1], SAFE_WIDE[2]], look: 'diggs', s: 9, fov: 50 } },
    { do: 'walk', who: 'player', path: [[284, 40]], run: true },
    { do: 'face', who: 'player', at: 'diggs', s: 0.3 },
  ],
};

/**
 * The Guard's turn (quest: Nobody Fires the Guard, giver Dust Flats Overlook; day). The Whirligig is under hay in
 * Pebblewick, so the overlook is quiet, until the table radio crackles: Commander Diggs, at his own gate, reports that
 * Vesper fired the Spade Guard by phone and locked the fort from Thorne Tower, and says the Guard line himself ("Nobody
 * fires the Guard. Especially not a guy in a porcelain hat."), then mounts his Zero-Turn and rolls out to lead the
 * player to the gate. The player ends on foot at the overlook.
 */
export const SPADE_TRUCE_INTRO: SceneScript = {
  id: 'spade-truce-intro',
  stage: { kind: 'world' },
  music: 'tension',
  ambience: 'wind',
  sky: 'noon',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/spade-truce-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, at: [288, 46], yaw: Math.PI / 2 },
    { id: 'tansy', preset: 'tansy', name: 'Tansy Clayfoot', at: [276, 50], yaw: Math.PI / 2 },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: [272, 46], yaw: Math.PI / 2, held: 'ammu-golden-kazoo' },
    { id: 'diggs', preset: 'diggs', name: 'Commander Diggs', at: GATE_DIGGS.at, yaw: GATE_DIGGS.yaw, held: null },
  ],
  vehicles: [
    { id: 'diggs-ride', ...rideOf('diggs'), at: DIGGS_RIDE.at, yaw: DIGGS_RIDE.yaw },
  ],
  steps: [
    // 1. Hook: the quiet overlook; the table radio chirps; Tansy, who hid the Whirligig a week ago, expects nobody.
    { do: 'cam', shot: spot(SAFE, 'wide') },
    { do: 'sfx', id: 'static', at: 'tansy', gain: 0.5, async: true },
    { do: 'wait', s: 1.5 },
    cut(CREW.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'The Whirligig is under hay in Pebblewick. So who is on the radio?' },
    // 2. The gate, far off and small: Diggs with a hand clamped to his ear. The news, in his own voice.
    { do: 'cam', shot: spot(GATE, 'wide') },
    { do: 'sfx', id: 'phone', at: 'diggs', gain: 0.6, async: true },
    { do: 'wait', s: 1.2 },
    cut(shot('diggs', 'ms', { height: 'low' })),
    { do: 'gesture', who: 'diggs', name: 'clutch', s: 1.0, async: true },
    { do: 'say', who: 'diggs', text: 'Vesper fired the Guard. By phone. Then he locked my fort from Thorne Tower.' },
    beat('pause'),
    cut(shot('diggs', 'mcu', { height: 'low', side: 25 })),
    { do: 'say', who: 'diggs', text: 'He said, "Thank you for your service."' },
    // 3. Diggs, LOW, after the silence: the one word that tells us what it cost.
    { do: 'music', track: null, fade: 0.6 },
    cut(shot('diggs', 'cu', { height: 'low' })),
    { do: 'say', who: 'diggs', text: '...Redundant.' },
    // 4. Reaction: the crew exchange a look back at the overlook, a beat each.
    ...exchangeLooks('pip', 'tansy'),
    cut(CREW.single('pip', 'mcu')),
    { do: 'wait', s: 1.0 },
    cut(CREW.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Diggs. Are you still there?' },
    // 5. The turn, and the bible fix: Diggs, not Tansy, says it. The sandpit march comes in on his line.
    cut(shot('diggs', 'mcu', { height: 'low' })),
    { do: 'say', who: 'diggs', text: 'Nobody fires the Guard.' },
    beat('beat'),
    { do: 'music', track: 'sandpit', fade: 1.2 },
    { do: 'say', who: 'diggs', text: 'Especially not a guy in a porcelain hat.' },
    // 6. Pip and Tansy, side-mouthed, on the crew's side of the line.
    cut(CREW.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Is he on our side now?' },
    cut(CREW.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'He\'s on his side. It\'s next to ours.' },
    // 7. The job: back at the gate, Diggs mounts his Zero-Turn and rolls out to lead them in.
    cut(shot('diggs', 'ms', { height: 'low' })),
    { do: 'say', who: 'diggs', text: 'Follow me to the gate. Three of Vesper\'s enforcers are on it.' },
    { do: 'enter', who: 'diggs', vehicle: 'diggs-ride' },
    { do: 'cam', shot: { kind: 'track', pos: up(386, 4, 66), who: 'diggs-ride', fov: 48 } },
    { do: 'drive', vehicle: 'diggs-ride', path: [DIGGS_RIDE.at, [374, 70], [340, 56]], speed: 12, depart: true, arrive: false, async: true },
    { do: 'walk', who: 'player', path: [[284, 46], [280, 44]], async: true },
    { do: 'wait', s: 1.5 },
    // 8. Button: Pip bets on the gate, Tansy already knows the answer.
    cut(CREW.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Ten acorns says he beats us to the gate.' },
    cut(CREW.single('tansy', 'mcu', { height: 'low' })),
    { do: 'say', who: 'tansy', text: 'He already has.' },
    { do: 'face', who: 'player', at: 'tansy', s: 0.3 },
    { do: 'wait', s: 1.0 },
  ],
};

export const CH4C_SCENES: Record<string, SceneScript> = {
  'sandpit-drop-outro': SANDPIT_DROP_OUTRO,
  'spade-truce-intro': SPADE_TRUCE_INTRO,
};
