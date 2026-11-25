// Chapter 4, the opener and the drop briefing at the Dust Flats safehouse. Re-directed in the Story B direction pass (docs/design/gnome-theft-auto/direction/lanes.md);
// notes in direction/scenes/<id>.md. Registered through CH4_SCENES in ch4.ts.
import type { SceneScript } from '../../script';
import { beat, coverage, cut, reaction, shot } from '../../direct';
import { carMark, markOf, spot, up } from './kit';

const SAFE = 'dust-safehouse';
const FIELD = 'airfield-apron';
const PAD = 'fort-sandpit-pad';

const TANSY = markOf(SAFE, 'tansy');
const PIP = markOf(SAFE, 'pip');
const PLAYER_SAFE = markOf(SAFE, 'player');
const WALLY = markOf(FIELD, 'wally');
const GUARD_A: [number, number] = [536, -102];
const DUSTER = carMark(FIELD, 'wally-crop-duster');
const CHOPPER = carMark(PAD, 'fort-whirligig');
const SNIPER_W = markOf(PAD, 'spade-guard-sniper', 0);
const SNIPER_E = markOf(PAD, 'spade-guard-sniper', 1);

/** Where Pip stops at the table, and where the player ends on foot (both at the safehouse map table). */
const PIP_TABLE: [number, number] = [277, 46];
const PLAYER_END: [number, number] = [274, 44];

/** Spade Guard look, shared by every guard in this chapter's scenes (no preset in cast.ts). */
const SPADE = { hat: 0x4b6329, shirt: 0x556b2f, beard: 0x5c3e24 };

/** Tansy and Pip at the map table: one side of their line for the whole briefing (the player stands on the same side). */
const TABLE = coverage('tansy', 'pip', 1);
/** Wally and the guard on the airfield: one side of their line. */
const FIELD_TALK = coverage('wally', 'guard-a', 1);

/**
 * CHAPTER 4 OPENER (quest: Runway Flares, giver Dust Flats Overlook). A crane over the Dust Flats to Fort Sandpit,
 * the title card, the crew at the safehouse map table, a cut to the airfield where Wally reads the windsock, then
 * Pip toots his golden kazoo. The player ends on foot at the overlook.
 */
export const RUNWAY_INTRO: SceneScript = {
  id: 'runway-intro',
  stage: { kind: 'world' },
  music: 'sandpit',
  ambience: 'wind',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/runway-intro.md', kind: 'chapter-open' },
  actors: [
    { id: 'tansy', preset: 'tansy', name: 'Tansy Clayfoot', at: TANSY.at, yaw: TANSY.yaw, held: 'stopping-stone' },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: PIP.at, yaw: PIP.yaw, held: 'ammu-golden-kazoo' },
    { id: 'player', player: true, at: PLAYER_SAFE.at, yaw: PLAYER_SAFE.yaw },
    { id: 'wally', preset: 'wally', name: 'Wind-Sock Wally', at: WALLY.at, yaw: WALLY.yaw },
    { id: 'guard-a', name: 'Spade Guard', look: SPADE, at: GUARD_A, yaw: Math.PI },
  ],
  vehicles: [
    { id: 'duster', kind: 'plane', at: DUSTER.at, yaw: DUSTER.yaw },
  ],
  steps: [
    // 1. Hook and the chapter question, in a picture: the crane over the Dust Flats onto Fort Sandpit's walls.
    { do: 'cam', shot: { kind: 'dolly', from: up(214, -70, 64), to: up(246, -14, 44), look: up(330, -6, 6), lookTo: up(366, 4, 10), s: 9, fov: 54 } },
    { do: 'stinger', id: 'chapter' },
    { do: 'title', text: 'CHAPTER 4 — SANDPIT PROTOCOL' },
    { do: 'wait', s: 3 },
    { do: 'title', text: null },
    // 2. The safehouse. Tansy has the plan and the problem.
    { do: 'cam', shot: spot(SAFE, 'wide') },
    { do: 'sfx', id: 'paper', at: 'tansy', gain: 0.5, async: true },
    { do: 'gesture', who: 'tansy', name: 'lean', s: 1.5, async: true },
    { do: 'wait', s: 2 },
    cut(TABLE.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Five snipers on the wall. One gate. We\'re not driving in.' },
    // Pip runs in from his mark to the table: a moving MS, then the line.
    cut(shot('pip', 'ms', { toward: 'tansy', side: -40, handheld: 0.02 })),
    { do: 'walk', who: 'pip', path: [PIP_TABLE], run: true },
    cut(TABLE.single('pip', 'ms')),
    { do: 'say', who: 'pip', text: 'Planes don\'t use gates. The Desert Airfield has Crop Dusters.' },
    cut(TABLE.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'The Unmowed have to see us coming. Drop them flares.' },
    cut(TABLE.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'And the guards?' },
    cut(TABLE.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Two. Sleepy. Probably.' },
    // 3. The airfield: Wally in his lawn chair, the windsock, and a guard who walks up to him.
    { do: 'cam', shot: spot(FIELD, 'wide') },
    { do: 'gesture', who: 'wally', name: 'sit', s: 0.3 },
    { do: 'walk', who: 'guard-a', path: [[552, -107]], speed: 2, async: true },
    { do: 'wait', s: 3 },
    cut(FIELD_TALK.single('wally', 'mcu', { height: 'high' })),
    { do: 'say', who: 'wally', text: 'Wind west, four knots. Stall speed twenty-two.' },
    beat('tiny'),
    { do: 'say', who: 'wally', text: 'Tell Commander Diggs his tie-downs are loose.' },
    cut(FIELD_TALK.single('guard-a', 'mcu')),
    { do: 'say', who: 'guard-a', text: 'Nobody tells the Commander anything, Wally.' },
    // 4. Back at the table: the kazoo, a running joke on its second rung.
    cut(TABLE.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Ammu-Gnation bolt-on. Forty acorns.' },
    cut(TABLE.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'You bought a kazoo.' },
    cut(TABLE.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'A golden kazoo.' },
    // The blow: a locked MS of Pip, the whistle, the one comic stinger of the scene.
    cut(TABLE.single('pip', 'ms')),
    { do: 'stinger', id: 'comic' },
    { do: 'sfx', id: 'whistle', gain: 0.6 },
    beat('pause'),
    { do: 'say', who: 'pip', text: 'Toot.' },
    // Button: music out, Tansy's flat stare, the player walks to the end mark during it.
    { do: 'music', track: null, fade: 0.4 },
    { do: 'walk', who: 'player', path: [PLAYER_END], async: true },
    cut(TABLE.single('tansy', 'mcu')),
    beat('silence'),
  ],
};

/**
 * Giver line before the Sandpit Drop (quest: The Sandpit Drop). Pip's plan to skip the gate and the crew's ride
 * into Fort Sandpit, with the Whirligig pad inside the walls shown with two snipers on it. The player ends on foot
 * at the overlook.
 */
export const SANDPIT_DROP_INTRO: SceneScript = {
  id: 'sandpit-drop-intro',
  stage: { kind: 'world' },
  music: 'heist',
  ambience: 'wind',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sandpit-drop-intro.md' },
  actors: [
    { id: 'tansy', preset: 'tansy', name: 'Tansy Clayfoot', at: TANSY.at, yaw: TANSY.yaw },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: PIP.at, yaw: PIP.yaw, held: 'ammu-golden-kazoo' },
    { id: 'player', player: true, at: PLAYER_END, yaw: -2.36 },
    { id: 'sniper-w', name: 'Spade Guard Sniper', look: SPADE, at: SNIPER_W.at, yaw: SNIPER_W.yaw },
    { id: 'sniper-e', name: 'Spade Guard Sniper', look: SPADE, at: SNIPER_E.at, yaw: SNIPER_E.yaw },
  ],
  vehicles: [
    { id: 'chopper', kind: 'whirligig', at: CHOPPER.at, yaw: CHOPPER.yaw },
  ],
  steps: [
    // 1. Hook: Pip bounces to the table; the first line lands at the table; then the player's blank stare.
    cut(TABLE.single('pip', 'ms')),
    { do: 'walk', who: 'pip', path: [PIP_TABLE], speed: 2.5 },
    { do: 'sfx', id: 'paper', at: 'pip', gain: 0.6, async: true },
    cut(TABLE.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Okay. Okay. Hear me out.' },
    ...reaction('player', { toward: 'pip', hold: 'pause' }),
    // 2. The plan, in Pip's voice: no gate, no parachute check.
    cut(TABLE.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Five snipers watch the gate. So we don\'t use the gate.' },
    cut(TABLE.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Crop Duster over the wall. Jump out. Don\'t check the parachute.' },
    cut(TABLE.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Why not check it?' },
    cut(TABLE.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Morale.' },
    // 3. Tansy takes over the plan: three clauses.
    cut(TABLE.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Land on the pad. Take the Whirligig. Fly it home.' },
    // 4. The picture: the fort pad, the Whirligig on its mark, the snipers on the wall; a reveal; a sniper turns.
    { do: 'cam', shot: spot(PAD, 'wide') },
    { do: 'stinger', id: 'reveal' },
    { do: 'wait', s: 1.5 },
    { do: 'cam', shot: shot('sniper-w', 'ms', { height: 'low', toward: 'sniper-e' }) },
    { do: 'sfx', id: 'cloth', at: 'sniper-w', gain: 0.5, async: true },
    { do: 'face', who: 'sniper-w', at: 'sniper-e', s: 0.6 },
    { do: 'wait', s: 1.2 },
    // 5. Back at the table: Tansy's verdict on the ticket.
    cut(TABLE.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Vesper cited it for unauthorised verticality. Let\'s earn the ticket.' },
    // 6. Button: Pip, dead serious.
    cut(TABLE.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Parachutes are just umbrellas with ambition.' },
    beat('pause'),
  ],
};

export const CH4B_SCENES: Record<string, SceneScript> = {
  'runway-intro': RUNWAY_INTRO,
  'sandpit-drop-intro': SANDPIT_DROP_INTRO,
};
