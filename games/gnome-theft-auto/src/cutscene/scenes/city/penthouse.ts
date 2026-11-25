// city-penthouse-exclusive: the intro (city-penthouse-exclusive-intro, at the Kerbside Exchange) and the payoff (city-penthouse-exclusive-outro).
// Hedda Galley is the client (the Turfton Tattler's editor, never photographed). The intro is at dusk on the kerb-exchange
// stage: Hedda lays out the headline and the Sycamore Copter parked in the garden, and Dot warns about the Watch. The
// payoff is at night on the same stage: Hedda holds up the front page and Dot pins it to the board. The front page has no
// prefab yet, so Hedda holds nothing and the headline is read from her hands and her line.
import type { SceneScript } from '../../script';
import { markOf, stageCut } from '../side/kit';
import { beat, coverage, cut, reaction, shot } from '../../direct';

const EXCHANGE = 'kerb-exchange';
const PLAYER = markOf(EXCHANGE, 'player');
const DOT = markOf(EXCHANGE, 'dot');
const CLIENT = markOf(EXCHANGE, 'client');
const HEDDA = markOf(EXCHANGE, 'hedda');

// The intro's two-hander: Hedda on the left of the line, Dot on the right; every single stays on one side.
const TALK = coverage('hedda', 'dot', 1);

export const PENTHOUSE_INTRO: SceneScript = {
  id: 'city-penthouse-exclusive-intro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  title: 'Penthouse Exclusive',
  music: 'turfton-dusk',
  ambience: 'street',
  actors: [
    { id: 'you', player: true, at: PLAYER.at, yaw: PLAYER.yaw },
    { id: 'dot', preset: 'dot', at: DOT.at, yaw: DOT.yaw },
    { id: 'hedda', preset: 'hedda', at: CLIENT.at, yaw: CLIENT.yaw },
  ],
  vehicles: [{ id: 'copter', kind: 'sycamore-copter', at: [-22, 45], yaw: Math.PI }],
  steps: [
    // Hook: Dot punches the first ticket at once. Then the wide of the board, the desk and the bus stop.
    { do: 'sfx', id: 'punch', at: 'dot' },
    { do: 'cam', shot: stageCut(EXCHANGE, 'wide') },
    { do: 'wait', s: 2 },
    cut(TALK.single('hedda', 'mcu')),
    { do: 'say', who: 'hedda', text: 'Vesper\'s penthouse. Nobody has a photo of it.' },
    cut(TALK.single('hedda', 'mcu')),
    { do: 'say', who: 'hedda', text: 'Not one. Not even a blurry one. The Tattler is furious.' },
    cut(TALK.single('dot', 'mcu')),
    { do: 'say', who: 'dot', text: 'Furious is her best look.' },
    cut(TALK.single('hedda', 'mcu')),
    { do: 'gesture', who: 'hedda', name: 'point', s: 1.4, async: true },
    { do: 'say', who: 'hedda', text: 'Her Sycamore Copter is parked in the garden behind this stop.' },
    // The Watch's pencils.
    { do: 'sfx', id: 'tap', at: 'dot', async: true },
    cut(TALK.single('dot', 'mcu')),
    { do: 'say', who: 'dot', text: 'Mind the Watch on the roof. They write everything down.' },
    beat('pause'),
    cut(TALK.single('hedda', 'mcu')),
    { do: 'say', who: 'hedda', text: 'Then be quicker than their pencils.' },
    ...reaction('you', { toward: 'hedda', hold: 'pause' }),
    cut(TALK.single('dot', 'mcu')),
    beat('pause'),
    { do: 'say', who: 'dot', text: 'Everything in Turfton comes past this desk, pal. Go on, then.' },
    beat('pause'),
  ],
};

export const PENTHOUSE_OUTRO: SceneScript = {
  id: 'city-penthouse-exclusive-outro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'night',
  title: 'Penthouse Exclusive',
  music: 'turfton',
  ambience: 'night',
  actors: [
    { id: 'you', player: true, at: PLAYER.at, yaw: PLAYER.yaw },
    { id: 'dot', preset: 'dot', at: DOT.at, yaw: DOT.yaw },
    { id: 'hedda', preset: 'hedda', at: HEDDA.at, yaw: HEDDA.yaw, held: null },
  ],
  steps: [
    // Hook: Hedda raises the front page at once, and the board is in the frame behind her.
    { do: 'cam', shot: stageCut(EXCHANGE, 'wide') },
    { do: 'gesture', who: 'hedda', name: 'handsUp', s: 1.2, async: true },
    { do: 'wait', s: 1.5 },
    cut(TALK.single('hedda', 'mcu')),
    { do: 'say', who: 'hedda', text: 'Front page. Look at this.' },
    { do: 'stinger', id: 'triumph' },
    cut(shot('hedda', 'ms', { toward: 'dot' })),
    { do: 'say', who: 'hedda', text: 'VESPER\'S PENTHOUSE HAS NO GRASS.' },
    beat('pause'),
    cut(TALK.single('dot', 'mcu')),
    { do: 'say', who: 'dot', text: 'Pin it up. Front of the board, where the Watch can read it.' },
    { do: 'sfx', id: 'punch', at: 'dot' },
    cut(TALK.single('hedda', 'mcu')),
    { do: 'say', who: 'hedda', text: 'Three passes and one photo. The Watch will be furious.' },
    ...reaction('you', { toward: 'hedda', hold: 'beat', side: -1 }),
    beat('pause'),
    cut(TALK.single('dot', 'mcu')),
    { do: 'say', who: 'dot', text: 'Every front page in town goes past this desk, pal.' },
    beat('pause'),
  ],
};

export const PENTHOUSE_SCENES: SceneScript[] = [PENTHOUSE_INTRO, PENTHOUSE_OUTRO];
