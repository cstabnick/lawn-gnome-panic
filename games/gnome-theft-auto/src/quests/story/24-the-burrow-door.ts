// Story row 24 (docs/design/gnome-theft-auto/story-outline.md): The Burrow Door, act II, chapter 2. The laugh after the tablet.
// Sorrel calls from her booth: two gnomes with spades are chasing a small mole through Mossy Wood. The player finds Nubbin
// under a log, cracks the two diggers, and carries him home in a barrow buggy, gently, to the Burrow Door (E17: BURROW_DOOR
// in societies/config.ts; first reach of Loamdeep). Old Mother Tumblesoil thanks them at the round door at dusk, the mole
// lantern lit (W06); DJ Moleman's bass comes up through the boards and he is never seen. Nubbin rides in the barrow: the
// scenes show him, the live quest only carries the buggy. The optional peek inside (interior-visit, E05) is cut: the door
// scene plays at the mound. Scenes: cutscene/scenes/story/m24-the-burrow-door.ts.
import type { GnomeLook } from '@lawn/gnome';
import { BURROW_DOOR } from '../../societies/config';
import { brief, call, type StoryFile } from './kit';

/** Two gardeners with spades: nobody's villains, just wrong about moles. */
const DIGGER_LOOK: Partial<GnomeLook> = { hat: 0x7a5a32, shirt: 0x5b6b3a };

export const STORY: StoryFile = {
  quests: [
    {
      id: 'm24-the-burrow-door',
      title: 'The Burrow Door',
      giver: 'unmowed-hollow',
      prereq: 'ch2-unmowed-tablet',
      chapter: 2,
      rewardAcorns: 350,
      radioBulletin: 'm24-the-burrow-door',
      achievement: 'gta-mole-neighbour',
      // A small rescue and a slow, careful drive: the Hat Watch has no business in it.
      hoa: 'off',
      outro: { kind: 'script', script: 'm24-the-burrow-door-outro' },
      objectives: [
        {
          kind: 'visit',
          text: 'Find the small mole hiding under a log in Mossy Wood',
          at: [-826, 274],
          radius: 11,
          hint: 'The fallen log, Mossy Wood',
          scene: 'm24-the-burrow-door-intro',
        },
        {
          kind: 'crack',
          text: 'Crack the two gnomes with spades',
          targets: [
            { id: 'mole-chaser-1', name: 'Spade Gnome Gus', near: [-823, 267], hint: 'By the log', look: DIGGER_LOOK },
            { id: 'mole-chaser-2', name: 'Spade Gnome Dab', near: [-820, 271], hint: 'By the log', look: DIGGER_LOOK },
          ],
        },
        {
          kind: 'steal-deliver',
          text: 'Carry Nubbin home in the barrow buggy, gently, to the Burrow Door',
          vehicleKind: 'barrow-buggy',
          spawnAt: [-821, 276.5, -Math.PI / 2],
          dropAt: [BURROW_DOOR.door.x + 6, BURROW_DOOR.door.z + 1.4],
          radius: 6,
          hint: 'The Burrow Door, west edge of Mossy Wood',
          maxDamage: 0.3,
          banter: ['Nubbin (squeaks): "If you please, a little slower on the bumps. Most kind."'],
        },
      ],
      doneText: 'Nubbin is home. The Burrowfolk have a lantern lit at the door, and Sorrel has put up a sign: moles are neighbours.',
    },
  ],
  comms: {
    'm24-the-burrow-door': {
      0: brief(
        ['sorrel', 'Previously: the tablet is home and Pip is still stung. This one is smaller.'],
        ['sorrel', 'Gnomes with spades are chasing a mole through Mossy Wood. I cannot watch.'],
        ['sorrel', 'Moles eat grubs, not roots. Find him, and bring him home. Three hundred fifty acorns.'],
      ),
      1: call(['sorrel', 'Those two with the spades. Crack them, and mind the log; he is under it.']),
      2: call(
        ['nubbin', 'If you please, the door is west, where the wood ends. Gently, most kind.'],
        ['sorrel', 'Barrow buggy, Nubbin aboard. Mind the bumps; he is carrying the post.'],
      ),
    },
  },
  plans: {
    'm24-the-burrow-door': { suite: 'story', expect: 'pass' },
  },
  bulletins: {
    'm24-the-burrow-door': [
      'Mossy Wood reports two gardeners cracked beside a log, a barrow buggy driven at walking pace, and one small mole delivered on time.',
      'The Burrow Door has been seen with a lantern. Residents are asked to knock low, and to leave the spades at home.',
    ],
  },
};
