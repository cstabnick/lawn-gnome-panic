// Story row 21 (docs/design/gnome-theft-auto/story-outline.md): Penthouse Viewing. A beige card on the mat of flat 3B,
// the Patio Gate (Gary waves it through, Cam parks cars in an HOA vest), Vesper standing in the Thorne Tower lobby, the
// tour through the Double Pot Tunnel (he flinches from a lantern and says nothing of it), then the only choice that is
// cosmetic: pocket the beige key or leave it on the table. Vesper has no hat line here (rung two of his ladder is its
// absence). Scenes: cutscene/scenes/story/m21-penthouse-viewing.ts; stages: quests/stages/story/s21-*.ts.
// Fallback used (E05 has no Thorne Tower lobby or penthouse interior): the lobby is the visit marker at the tower's
// door and the tour plays in the Double Pot Tunnel, whose sales floor and lift are the E05 interior `double-pot-sales`.
import { brief, call, type StoryFile } from './kit';

export const STORY: StoryFile = {
  quests: [
    {
      id: 'm21-penthouse-viewing',
      title: 'Penthouse Viewing',
      giver: 'flat-3b-mat',
      prereq: 'ch2-vespers-offer',
      chapter: 2,
      rewardAcorns: 300,
      radioBulletin: 'm21-penthouse-viewing',
      // An invitation, not a heist: nobody hunts the player on the way to a viewing.
      hoa: 'off',
      cutscene: { kind: 'script', script: 'm21-penthouse-viewing-intro' },
      outro: { kind: 'script', script: 'm21-penthouse-viewing-outro' },
      objectives: [
        {
          kind: 'visit',
          text: 'Show the beige card at the Patio Gate',
          at: [150, -126],
          radius: 8,
          hint: 'Patio Gate',
          scene: 'm21-penthouse-viewing-gate',
        },
        {
          kind: 'visit',
          text: 'Meet Vesper in the Thorne Tower lobby',
          at: [32, -14],
          radius: 8,
          hint: 'Thorne Tower lobby',
          scene: 'm21-penthouse-viewing-mid',
        },
        {
          kind: 'choice',
          text: 'Take the key from the table, or leave it',
          optionA: {
            label: 'Pocket the key',
            at: [124.2, -96.2],
            endingText: 'The key goes in your pocket. A key will hang in flat 3B.',
            outro: 'm21-penthouse-viewing-outro',
          },
          optionB: {
            label: 'Leave it on the table',
            at: [120, -109],
            endingText: 'You leave the key on the table. Nothing hangs in flat 3B.',
            achievement: 'gta-agreeable',
            outro: 'm21-penthouse-viewing-outro-table',
          },
        },
      ],
      doneText: 'You have seen the penthouse. It was very quiet, and very beige.',
    },
  ],
  comms: {
    'm21-penthouse-viewing': {
      0: brief(
        ['vesper', 'The penthouse in the Double Pot is ready to view, friend. There are no conditions.'],
        ['vesper', 'Present this card at the Patio Gate. Three hundred acorns for your time.'],
      ),
      1: call(['gary', 'Sigh. Card is good. Thorne Tower, lobby. Mind the beige.']),
      2: call(['vesper', 'If you take the key, it will hang in flat 3B. If not, it will wait.']),
    },
  },
  bulletins: {
    'm21-penthouse-viewing': [
      'Thorne Even-Estates confirms a penthouse viewing in the Double Pot Tunnel, beige throughout, no conditions attached.',
      'Gate-Guard Gary waved a beige card through the Patio Gate this afternoon and asked everyone to mind the beige.',
    ],
  },
  plans: {
    'm21-penthouse-viewing': { suite: 'story', variants: ['A', 'B'], expect: 'pass' },
  },
  givers: {
    'flat-3b-mat': {
      id: 'flat-3b-mat',
      name: 'The mat at flat 3B',
      label: 'Pick up the beige card',
      x: 33.5,
      z: 84,
      exit: { x: 34, z: 87, yaw: -2.46 },
      room: 'street',
      letter: 'V',
    },
  },
};
