// Story row 11 (docs/design/gnome-theft-auto/story-outline.md): The Don's Cigars. Two taps: the HOA cited the Don's cigar
// boats. Baroness Brenda's toll on the canal, the crates in an ice-cream van past an HOA van across the road, and the Mulch
// Club's side door, where Big Lou checks the player's hat. Scenes: cutscene/scenes/story/m11-the-dons-cigars.ts.
import { brief, call, type StoryFile } from './kit';

export const STORY: StoryFile = {
  quests: [
    {
      id: 'm11-the-dons-cigars',
      title: "The Don's Cigars",
      giver: 'mulch-club',
      prereq: 'm10-under-the-span',
      chapter: 1,
      rewardAcorns: 300,
      radioBulletin: 'm11-the-dons-cigars',
      cutscene: { kind: 'script', script: 'dons-cigars-intro' },
      outro: { kind: 'script', script: 'dons-cigars-outro' },
      objectives: [
        {
          kind: 'visit',
          text: "Pay Baroness Brenda's toll at the New Puddle waterfront and load the Don's crates",
          at: [-40, 213],
          radius: 8,
          hint: 'New Puddle, on the canal',
          scene: 'dons-cigars-mid',
        },
        {
          kind: 'steal-deliver',
          text: "Drive the Don's crates to the Mulch Club without a scratch, past the HOA",
          vehicleKind: 'cone-van',
          spawnAt: [-30, 207, Math.PI],
          dropAt: [-2.5, -30],
          radius: 8,
          hint: 'The Mulch Club side door',
          heatOnEnter: 1,
          maxDamage: 0.5,
          banter: ['The crates are rattling.', 'Keep it smooth. Cigars bruise.', 'Do not look at that HOA van.'],
        },
        {
          kind: 'visit',
          text: 'Walk the crates to the Mulch Club side door',
          at: [-11, -30],
          radius: 4,
          hint: 'The Mulch Club side door',
        },
      ],
      doneText: 'Crates delivered dry. The Don owes the HOA nothing, and the HOA has noticed.',
    },
  ],
  comms: {
    'm11-the-dons-cigars': {
      0: brief(
        ['big lou', 'Hat. Don tapped twice. HOA cited his cigar boats. Crates wait on the canal.'],
        ['big lou', 'Brenda tolls the road. Fifty acorns, from the Don. Three hundred for you. Dry.'],
      ),
      1: call(
        ['brenda', 'By decree, the toll is paid and the Republic saw nothing.'],
        ['brenda', 'An HOA van lurks on the ring road. Drive like a gnome with nothing to hide.'],
      ),
      2: call(
        ['big lou', 'Side door. Bring the crates, and the hat. Dry.'],
      ),
    },
  },
  bulletins: {
    'm11-the-dons-cigars': [
      'Canal news: Baroness Brenda of New Puddle announces a toll of fifty acorns on all crates, cigars and hats, by decree. The HOA calls it "excessive leisure".',
      'The HOA has cited smoke over the canal as unlicensed. The Mulch Club says only that the smoke has been very well behaved.',
    ],
  },
  plans: {
    'm11-the-dons-cigars': { suite: 'story', expect: 'pass' },
  },
};
