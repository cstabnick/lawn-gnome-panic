// Story row 13 (m13-diner-on-route-south): Diner on Route South. Three scenes: Tansy's bay (the ticket, the fryer, the
// forty breakfasts), the diner at the noon coach (Sage's tray) and the outdoor counter at dusk (Frank names Granny).
// Notes: docs/design/gnome-theft-auto/direction/scenes/diner-route-south-{intro,mid,outro}.md
import type { SceneScript } from '../../script';
import { beat, coverage, cut, cutaway, insert, pushIn, reaction, shot } from '../../direct';
import { markOf, pathOf, spot } from './kit';

const BAY = 'side-valve-bay';
const DINER = 'diner-rush';

const TANSY = markOf(BAY, 'tansy');
const CAM = markOf(BAY, 'turncoat-cam');
const SAGE = markOf(DINER, 'sage');
const DINER_PLAYER = markOf(DINER, 'player', 0);
const COUNTER_PLAYER = markOf(DINER, 'player', 1);
const FRANK = markOf(DINER, 'frank');
/** The noon coach, down the highway to the diner kerb. */
const COACH_IN = pathOf(DINER, 'rush-coach-arrival');

/** Tansy and the player at her bench: one side of the line. */
const BENCH = coverage('tansy', 'player', 1);
/** Sage and the player at the diner door. */
const DOOR = coverage('sage', 'player', 1);
/** Frank and the player at the counter. */
const COUNTER = coverage('frank', 'player', -1);

/**
 * The bay at noon: Tansy, under a Zero-Turn and not looking up, sends the player to collect a fryer debt from a cook who
 * pays in lunch. The forty breakfasts are planted here and paid off in the diner. Cam sweeps behind, as he does in every
 * Side-Valve scene. The button is a warning about Frank, which the road then delivers.
 */
export const DINER_ROUTE_SOUTH_INTRO: SceneScript = {
  id: 'diner-route-south-intro',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'turfton',
  ambience: 'street',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/diner-route-south-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, at: [-151.5, 70.5], yaw: Math.PI / 2 },
    { id: 'tansy', preset: 'tansy', held: 'ticket-stub', at: TANSY.at, yaw: TANSY.yaw },
    { id: 'cam', preset: 'turncoat cam', at: CAM.at, yaw: CAM.yaw },
  ],
  steps: [
    // Hook: a spanner on concrete, the bay, and Tansy's voice before she looks up.
    cut(spot(BAY, 'wide')),
    { do: 'sfx', id: 'clatter', at: 'tansy', gain: 0.55, async: true },
    { do: 'walk', who: 'player', path: [[-147.4, 72.4]], speed: 1.3, async: true },
    { do: 'wait', s: 1.5 },
    // She turns from the job to say it: she means this one.
    { do: 'face', who: 'tansy', at: 'player', s: 0.5, async: true },
    { do: 'face', who: 'player', at: 'tansy', s: 0.4, async: true },
    cut(BENCH.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Sage Ladle owes me for a fryer. Go and collect.' },
    cut(BENCH.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'In Acorns?' },
    cut(BENCH.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Sage does not do Acorns. She does lunch.' },
    ...reaction('player', { toward: 'tansy', hold: 'beat' }),
    // The ticket, and the planted joke.
    { do: 'sfx', id: 'paper', at: 'tansy', gain: 0.5, async: true },
    { do: 'give', from: 'tansy', to: 'player', prop: 'ticket-stub', s: 1 },
    cut(insert('player', { toward: 'tansy' })),
    { do: 'wait', s: 1.0 },
    // Cam, sweeping behind the bench, stops sweeping. (His broom is a thread for the whole of act I.)
    { do: 'face', who: 'cam', at: 'tansy', s: 0.5, async: true },
    ...cutaway('cam', { toward: 'tansy', hold: 'pause' }),
    cut(BENCH.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'If she mentions breakfasts, I am not in.' },
    // The turn and the objective, in her voice: Route South, and the warning.
    cut(pushIn('tansy', 'mcu', 3.4, { toward: 'player', side: 25 })),
    { do: 'say', who: 'tansy', text: 'Route South. Frank will wave. Do not wave back.' },
    cut(BENCH.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Why not?' },
    cut(BENCH.single('tansy', 'mcu', { height: 'low' })),
    { do: 'say', who: 'tansy', text: 'He reviews engines. Out loud. For an hour.' },
    { do: 'sfx', id: 'clatter', at: 'tansy', gain: 0.5, async: true },
    beat('pause'),
  ],
};

/**
 * The diner at noon, on arrival: the snail-coach comes down the highway, the pass bell goes, and Sage Ladle, a tray in
 * each hand, pays a fryer debt in plates. Her intro card follows her first line. The button is a tray in the player's
 * hands and a coach horn.
 */
export const DINER_ROUTE_SOUTH_MID: SceneScript = {
  id: 'diner-route-south-mid',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'warm',
  ambience: 'wind',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/diner-route-south-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, at: DINER_PLAYER.at, yaw: DINER_PLAYER.yaw },
    { id: 'sage', preset: 'sage', held: 'serving-tray', at: SAGE.at, yaw: SAGE.yaw },
  ],
  vehicles: [{ id: 'coach', kind: 'snail-coach', at: COACH_IN[0], yaw: 0 }],
  steps: [
    // Hook: the coach rolls down the highway towards the lunch, horn first.
    cut(spot(DINER, 'wide')),
    { do: 'drive', vehicle: 'coach', path: COACH_IN, speed: 11, async: true },
    { do: 'sfx', id: 'engine-rev', at: 'coach', gain: 0.5, async: true },
    { do: 'wait', s: 1.4 },
    { do: 'horn', vehicle: 'coach' },
    { do: 'wait', s: 1.4 },
    // The pass bell, and Sage.
    { do: 'sfx', id: 'bell', at: 'sage', gain: 0.55, async: true },
    cut(DOOR.single('sage', 'mcu')),
    { do: 'say', who: 'sage', text: 'Order up. Do not eat the garnish. It is decorative.' },
    { do: 'intro', who: 'sage' },
    cut(DOOR.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Tansy sent me. About a fryer.' },
    cut(DOOR.single('sage', 'mcu')),
    { do: 'say', who: 'sage', text: 'Tansy owes me forty breakfasts, love. I pay in plates.' },
    ...reaction('player', { toward: 'sage', gesture: 'shrug', hold: 'pause' }),
    // The tray changes hands and the objective is in the order.
    { do: 'sfx', id: 'clink', at: 'sage', gain: 0.5, async: true },
    { do: 'give', from: 'sage', to: 'player', prop: 'serving-tray', s: 1 },
    cut(pushIn('sage', 'mcu', 3.0, { toward: 'player', side: 25 })),
    { do: 'say', who: 'sage', text: 'Six tables. Mind the soup.' },
    { do: 'walk', who: 'sage', path: [[9.4, 252.6]], speed: 2.4, async: true },
    cut(DOOR.single('player', 'ms')),
    { do: 'horn', vehicle: 'coach' },
    beat('pause'),
  ],
};

/**
 * The outdoor counter at dusk: the last plate has gone, Frank rings the end-of-rush bell, reads the player's engine
 * before he meets them and names Granny Gnertrude, the one gnome Vesper cannot buy. The coach pulls away south under the
 * last line; the diner's window is lit. His intro card follows his first line.
 */
export const DINER_ROUTE_SOUTH_OUTRO: SceneScript = {
  id: 'diner-route-south-outro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'turfton-dusk',
  ambience: 'wind',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/diner-route-south-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, at: COUNTER_PLAYER.at, yaw: COUNTER_PLAYER.yaw },
    { id: 'frank', preset: 'frank', held: 'cocoa-mug', at: FRANK.at, yaw: FRANK.yaw },
  ],
  vehicles: [{ id: 'coach', kind: 'snail-coach', at: COACH_IN[COACH_IN.length - 1], yaw: 0 }],
  steps: [
    // Hook: the end-of-rush bell. The whole outdoor counter hears it.
    { do: 'gesture', who: 'frank', name: 'sit', s: 0.5, async: true },
    cut(spot(DINER, 'counter')),
    { do: 'sfx', id: 'bell', at: 'frank', gain: 0.6, async: true },
    { do: 'wait', s: 1.8 },
    cut(COUNTER.single('frank', 'mcu')),
    { do: 'say', who: 'frank', text: 'Heard you coming. Chain pulls left. ...Nice.' },
    { do: 'intro', who: 'frank' },
    cut(COUNTER.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'How do you know?' },
    cut(COUNTER.single('frank', 'mcu')),
    { do: 'sfx', id: 'gulp', at: 'frank', gain: 0.4, async: true },
    { do: 'say', who: 'frank', text: 'I hear everything on this road.' },
    // The turn: the road's news, and the name.
    cut(pushIn('frank', 'mcu', 3.6, { toward: 'player', side: -25 })),
    { do: 'say', who: 'frank', text: 'Vesper is buying it. A block, a silo, a canal bank.' },
    { do: 'say', who: 'frank', text: 'Granny Gnertrude. Only one Vesper cannot buy.' },
    cut(COUNTER.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Why not?' },
    cut(COUNTER.single('frank', 'mcu', { height: 'low' })),
    { do: 'say', who: 'frank', text: 'She does not sell. She bakes.' },
    // Button: the coach pulls away south into the gold, the diner window lit behind it.
    cut(shot('frank', 'ws', { toward: 'player', side: -40 })),
    { do: 'drive', vehicle: 'coach', path: [[-2.5, 266], [-2.5, 296]], speed: 9, arrive: false, async: true },
    { do: 'sfx', id: 'engine-rev', at: 'coach', gain: 0.45, async: true },
    { do: 'wait', s: 2.6 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'diner-route-south-intro': DINER_ROUTE_SOUTH_INTRO,
  'diner-route-south-mid': DINER_ROUTE_SOUTH_MID,
  'diner-route-south-outro': DINER_ROUTE_SOUTH_OUTRO,
};
