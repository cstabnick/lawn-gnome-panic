// On the House (Chrome-Knuckle Cass, foreman of Pay 'n' Glaze): a dry, flat foreman who never gives anything away.
// Daylight at the bay (`sky: 'noon'`), a spray-gun hiss under warm music, every shot of Cass a still, level mcu. She
// never smiles; the client does the crying. Staged at pay-n-glaze (quests/stages/turftonB.ts). Notes per scene in
// docs/design/gnome-theft-auto/direction/scenes/sq-on-the-house-*.md.
import type { SceneScript } from '../../script';
import { beat, coverage, cut, shot } from '../../direct';
import { above, markOf, stageCut } from './kit';

const CASS = markOf('pay-n-glaze', 'cass');
const PLAYER = markOf('pay-n-glaze', 'player');
const TALK = coverage('cass', 'you', 1);
/** Cass is shot flat and level: no drift, a normal lens. */
const CASS_MCU = TALK.single('cass', 'mcu');

export const ON_THE_HOUSE_INTRO: SceneScript = {
  id: 'sq-on-the-house-intro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'noon',
  title: 'On the House',
  music: 'warm',
  ambience: 'street',
  radio: 0.3,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sq-on-the-house-intro.md', kind: 'intro' },
  actors: [
    { id: 'you', player: true, at: PLAYER.at, yaw: Math.atan2(CASS.at[0] - PLAYER.at[0], CASS.at[1] - PLAYER.at[1]) },
    { id: 'cass', preset: 'cass', at: CASS.at, yaw: CASS.yaw },
  ],
  steps: [
    // Hook: a spray-gun hiss over the bay, then her chrome fist wiping the pegboard.
    { do: 'sfx', id: 'squirt', at: above(94, 150, 0.6), async: true },
    { do: 'cam', shot: stageCut('pay-n-glaze', 'wide') },
    { do: 'wait', s: 1.4 },
    cut(CASS_MCU),
    { do: 'face', who: 'cass', at: 'you', s: 0.4 },
    { do: 'say', who: 'cass', text: 'The HOA clamped my client\'s mower. Unapproved pinkness.' },
    // The card, after her first line, on her mcu.
    { do: 'intro', who: 'cass' },
    cut(TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Is pink a crime?' },
    cut(CASS_MCU),
    { do: 'sfx', id: 'tap', at: 'cass', gain: 0.6, async: true },
    { do: 'say', who: 'cass', text: 'Pink is a deposit. Crack the clampers. Bring it back without a dent.' },
    cut(TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'And what do I get?' },
    // The turn: she does not give things away, so she says it slowly.
    cut(CASS_MCU),
    beat('pause'),
    { do: 'say', who: 'cass', text: 'I don\'t give things away.' },
    // The player's reaction holds the silence, then she goes on.
    cut(TALK.single('you', 'mcu')),
    { do: 'gesture', who: 'you', name: 'shrug', s: 1.2, async: true },
    beat('pause'),
    cut(CASS_MCU),
    { do: 'gesture', who: 'cass', name: 'crossArms', s: 1.4, async: true },
    { do: 'say', who: 'cass', text: 'Do it clean and every repair here is on the house.' },
    cut(TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Free?' },
    cut(CASS_MCU),
    { do: 'say', who: 'cass', text: 'On my tab. Not free. Never say free.' },
  ],
};

const CLIENT_LOOK = { hat: 0xff9ec7, shirt: 0xf4e6c8, pants: 0x6a4a6a };

export const ON_THE_HOUSE_OUTRO: SceneScript = {
  id: 'sq-on-the-house-outro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'noon',
  music: 'triumph',
  ambience: 'street',
  radio: 0.3,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sq-on-the-house-outro.md', kind: 'outro' },
  actors: [
    { id: 'you', player: true, at: PLAYER.at, yaw: Math.atan2(CASS.at[0] - PLAYER.at[0], CASS.at[1] - PLAYER.at[1]) },
    { id: 'cass', preset: 'cass', at: CASS.at, yaw: CASS.yaw },
    { id: 'client', name: 'Client', look: CLIENT_LOOK, at: [PLAYER.at[0] + 2.5, PLAYER.at[1] + 1.5], yaw: Math.atan2(CASS.at[0] - PLAYER.at[0] - 2.5, CASS.at[1] - PLAYER.at[1] - 1.5) },
  ],
  steps: [
    // Hook: the client's sob, before anyone speaks.
    { do: 'sfx', id: 'squeak', at: 'client', gain: 0.7, async: true },
    cut(shot('client', 'mcu', { toward: 'cass', side: 20 })),
    { do: 'gesture', who: 'client', name: 'clutch', s: 1.8, async: true },
    { do: 'say', who: 'client', text: 'It is so pink. I am not crying.' },
    cut(CASS_MCU),
    { do: 'say', who: 'cass', text: 'She cried. That\'s the only review that counts.' },
    cut(TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'So. The tab.' },
    // The turn: the foreman pays up, grudgingly, by not looking at the player.
    cut(CASS_MCU),
    beat('pause'),
    { do: 'say', who: 'cass', text: 'Every repair here is on the house. Starting now.' },
    cut(TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'You said you never give things away.' },
    cut(CASS_MCU),
    { do: 'sfx', id: 'bell', at: 'cass', gain: 0.6, async: true },
    { do: 'say', who: 'cass', text: 'Gifts end. Tabs are forever.', stinger: 'triumph' },
    beat('beat'),
  ],
};

export const ON_THE_HOUSE_SCENES: SceneScript[] = [ON_THE_HOUSE_INTRO, ON_THE_HOUSE_OUTRO];
