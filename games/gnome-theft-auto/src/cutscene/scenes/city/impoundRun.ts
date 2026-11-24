// city-impound-run: the intro (city-impound-run-intro, at the Kerbside Exchange) and the payoff (city-impound-run-outro).
// Pip bursts into the Exchange, the HOA has towed his Zero-Turn; Dot lists the clerks. The payoff is the Pay 'n' Glaze bay:
// the Zero-Turn comes out re-sprayed, and Pip sends the player to Tansy's Lock-Up.
import type { SceneScript } from '../../script';
import { castRide, markOf, stageCut, walkOf } from '../side/kit';
import { beat, coverage, cut, reaction } from '../../direct';

const EXCHANGE = 'kerb-exchange';
const BAY = 'pay-n-glaze';

const DOT = markOf(EXCHANGE, 'dot');
const CLIENT = markOf(EXCHANGE, 'client');
const EXCHANGE_PLAYER = markOf(EXCHANGE, 'player');
const PIP_BAY = markOf(BAY, 'pip');
const BAY_PLAYER = markOf(BAY, 'player');
const TECH = markOf(BAY, 'glaze-tech');
const TECH_WALK = walkOf(BAY, 'glaze-tech');

// Two-hander at the desk: Dot on the left of the line, Pip and the player on the other side.
const DESK = coverage('dot', 'pip', 1);
// The payoff: Pip and the player, one side of their line.
const BAY_TALK = coverage('pip', 'you', 1);

export const IMPOUND_RUN_INTRO: SceneScript = {
  id: 'city-impound-run-intro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'noon',
  title: 'Impound Run',
  music: 'heist',
  ambience: 'street',
  actors: [
    { id: 'you', player: true, at: EXCHANGE_PLAYER.at, yaw: EXCHANGE_PLAYER.yaw },
    { id: 'dot', preset: 'dot', at: DOT.at, yaw: DOT.yaw },
    { id: 'pip', preset: 'pip', at: [-12, 58], yaw: Math.PI },
  ],
  steps: [
    // Hook: the door bangs, Pip comes in at a run, the camera on the board first.
    { do: 'sfx', id: 'door' },
    { do: 'cam', shot: stageCut(EXCHANGE, 'wide') },
    { do: 'walk', who: 'pip', path: [[-12, 54], CLIENT.at], speed: 3, run: true },
    { do: 'wait', s: 1 },
    cut(DESK.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'The HOA towed my Zero-Turn. Into the impound. Behind Clay-Mart.' },
    cut(DESK.single('dot', 'mcu', { height: 'low' })),
    { do: 'say', who: 'dot', text: 'Clerks are Tare and Gross. Neither has smiled since the Ice Age.' },
    cut(DESK.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Then we go in and get it back. Quietly.' },
    cut(DESK.single('dot', 'mcu', { height: 'low' })),
    { do: 'say', who: 'dot', text: 'Every job in Turfton passes this desk. This one says crack.' },
    ...reaction('you', { toward: 'dot', hold: 'pause' }),
    cut(DESK.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Then take the job and bring me my Zero-Turn back.' },
    cut(DESK.single('dot', 'mcu', { height: 'low' })),
    { do: 'say', who: 'dot', text: 'Ticket punched. Clay-Mart returns yard. Go.' },
    beat('pause'),
  ],
};

export const IMPOUND_RUN_OUTRO: SceneScript = {
  id: 'city-impound-run-outro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'noon',
  music: 'turfton',
  ambience: 'street',
  actors: [
    { id: 'you', player: true, at: BAY_PLAYER.at, yaw: BAY_PLAYER.yaw },
    { id: 'pip', preset: 'pip', at: PIP_BAY.at, yaw: PIP_BAY.yaw },
    { id: 'tech', name: 'Glaze Tech', look: { hat: 0x2f5a8f, shirt: 0xf2f2f2 }, at: TECH.at, yaw: TECH.yaw },
  ],
  vehicles: [castRide('pip', 'zt', [90, 146], 0)],
  steps: [
    { do: 'sfx', id: 'shutter' },
    { do: 'cam', shot: stageCut(BAY, 'wide') },
    { do: 'walk', who: 'tech', path: TECH_WALK, speed: 0.9, async: true },
    { do: 'gesture', who: 'tech', name: 'nod', s: 1.2, async: true },
    { do: 'wait', s: 1.5 },
    cut(BAY_TALK.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Look at her. Primer gone. Not one HOA sticker left.' },
    cut(BAY_TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Still pulls left.' },
    cut(BAY_TALK.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Everything I own pulls left. It is a family trait.' },
    { do: 'gesture', who: 'pip', name: 'hug', s: 1.6, async: true },
    { do: 'stinger', id: 'triumph' },
    beat('pause'),
    cut(BAY_TALK.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Keep her in Tansy\'s Lock-Up. Then call the Sling-Lift from your phone.' },
    ...reaction('you', { hold: 'pause' }),
    cut(BAY_TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Sling-Lift. Got it.' },
    cut(BAY_TALK.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Any time, day or night. Mind the primer.' },
    beat('pause'),
  ],
};

export const IMPOUND_RUN_SCENES: SceneScript[] = [IMPOUND_RUN_INTRO, IMPOUND_RUN_OUTRO];
