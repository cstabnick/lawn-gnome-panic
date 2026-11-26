// Story row 49 (docs/design/gnome-theft-auto/story-outline.md): Loamdeep, act III, chapter 3. Old Mother Tumblesoil thanked the
// player at the Burrow Door in row 24 and now needs hands. She asks three small jobs of the crew (a Root Run, a Lamplighter
// shift, a shift at the pigeonholes: the E17 mole jobs, counted as probes) and DJ Moleman plays one track in person at his
// decks (a visit into his hidden burrow, interior `moleman-burrow`). The Burrowfolk agree: they dig where they are asked,
// and nobody has ever asked. They join (they dig in row 60). Moleman's transmitter stays unexplained. W13 (a root stall)
// and the `gta-everyone-digs` achievement are wired by the setup. Scenes: cutscene/scenes/story/m49-loamdeep.ts.
import { MOLEMAN_BURROW, SOCIETY_INTERIORS, SOCIETY_PROBES } from '../../societies/config';
import { brief, call, type StoryFile } from './kit';

export const STORY: StoryFile = {
  quests: [
    {
      id: 'm49-loamdeep',
      title: 'Loamdeep',
      giver: 'tumblesoil',
      prereq: 'm48-the-groundskeepers-secret',
      chapter: 3,
      rewardAcorns: 400,
      radioBulletin: 'm49-loamdeep',
      achievement: 'gta-everyone-digs',
      // Small jobs for a polite family underground: nobody from the Hat Watch is invited.
      hoa: 'off',
      cutscene: { kind: 'script', script: 'm49-loamdeep-intro' },
      outro: { kind: 'script', script: 'm49-loamdeep-outro' },
      objectives: [
        {
          kind: 'probe',
          text: 'Run a bundle of roots from Rootway Hall to the hall Old Tamp names',
          probe: SOCIETY_PROBES.moleRoots,
          count: 1,
          hint: 'Rootway Hall, west of the entry tunnel, Loamdeep',
        },
        {
          kind: 'probe',
          text: 'Light the lamps down a tunnel: take a taper from Mistress Delve',
          probe: SOCIETY_PROBES.moleLamps,
          count: 1,
          hint: 'Lamplight Hall, east of the entry tunnel, Loamdeep',
        },
        {
          kind: 'probe',
          text: 'Sort the post at the pigeonholes with Mister Sift',
          probe: SOCIETY_PROBES.molePost,
          count: 1,
          hint: 'Postern Hall, north-west of the Mother\'s Hall, Loamdeep',
        },
        {
          kind: 'visit',
          text: "Go down the Long Tunnel and stand at DJ Moleman's decks",
          at: [0, MOLEMAN_BURROW.decks[1] + 1.9],
          radius: 2.4,
          interior: SOCIETY_INTERIORS.moleman,
          hint: 'The Long Tunnel, west end of Under-Chorus Hall, Loamdeep',
          scene: 'm49-loamdeep-mid',
        },
      ],
      doneText: 'The jobs are done and the Burrowfolk have agreed: they will dig where they are asked. Old Mother Tumblesoil has set a root on the table.',
    },
  ],
  comms: {
    'm49-loamdeep': {
      0: brief(
        ['tumblesoil', 'Previously: you brought Nubbin home, dear one. The Hall has not forgotten.'],
        ['tumblesoil', 'Three small jobs in Loamdeep: roots, lamps, the post. Then the Burrowfolk are yours.'],
        ['tumblesoil', 'Four hundred acorns, and the one thing nobody has ever asked of us.'],
      ),
      1: call(['nubbin', 'Most kind. Now the lamps, if you please. Mistress Delve keeps the tapers.']),
      2: call(['nubbin', 'Last, the post. Mister Sift is far too polite to say it is late.']),
      3: call(['tumblesoil', 'Now the quiet part, dear one. Take the Long Tunnel, and ask him nothing.']),
    },
  },
  plans: {
    'm49-loamdeep': { suite: 'story', expect: 'pass' },
  },
  bulletins: {
    'm49-loamdeep': [
      'Mossy Wood reports lamps lit down three tunnels, a post that is only slightly late, and a root delivered with considerable ceremony. The Burrowfolk decline to be thanked.',
      'A slow bass was felt through the grass near the Burrow Door at nightfall. Residents are asked not to dig for it.',
    ],
  },
};
