// Story row 50 (docs/design/gnome-theft-auto/story-outline.md): Trellisdown Tasting, act III, chapter 3. Part 3 of 4 of the
// Grand Combine, the money. Juniper calls (a giver at the Burrow Door, where row 49 ends): Countess Wisteria Brassknock holds a
// grape-dew tasting for the Combine's backers, and her ledger is there to be photographed. The player drives to Brassknock
// Manor (E16: country/manor.ts), goes in by the waiters' side door (the back door; Chicory Snips has the list) and carries a
// tray through the tasting hall (interior-visit), then photographs the open ledger on the Countess's lectern from among the
// guests, with Vesper in the same frame for the first time, and slips out past Chicory at the gate. The ledger room was never
// built, so the tasting spills onto the terrace and the forecourt (the outline's fallback): the hall is walked, the ledger is
// read outside. Scenes: cutscene/scenes/story/m50-trellisdown-tasting.ts.
import { brief, call, type StoryFile } from './kit';

/** Where Juniper's call is answered: the grass east of the Burrow Door (societies/config.ts BURROW_DOOR), clear of Nubbin's spot. */
const BURROW_CALL: [number, number] = [-989.5, 296.8];

export const STORY: StoryFile = {
  quests: [
    {
      id: 'm50-trellisdown-tasting',
      title: 'Trellisdown Tasting',
      giver: 'juniper-call',
      prereq: 'm49-loamdeep',
      chapter: 3,
      rewardAcorns: 650,
      radioBulletin: 'm50-trellisdown-tasting',
      // A waiter with a tray and a camera: the Hat Watch has no business at a tasting.
      hoa: 'off',
      cutscene: { kind: 'script', script: 'm50-trellisdown-tasting-intro' },
      outro: { kind: 'script', script: 'm50-trellisdown-tasting-outro' },
      objectives: [
        {
          kind: 'visit',
          text: "Drive west to Trellisdown and pull up at Brassknock Manor's gate",
          at: [-1150, -24],
          radius: 7,
          hint: 'The vineyard lane, west past Mossy Wood, the manor gate on the hill',
        },
        {
          kind: 'visit',
          text: "Go in by the waiters' side door and carry a tray through the tasting hall",
          at: [1.6, 3.2],
          radius: 2.6,
          interior: 'brassknock-manor',
          hint: 'The back door of Brassknock Manor, by the path down the west side of the house',
          toastOnEnter: 'Footman Pell hands you a tray of thimble glasses. "Walk slowly. Everybody here does."',
        },
        {
          kind: 'inspect',
          text: "Photograph the Countess's ledger from the guests on the forecourt",
          verb: 'Photograph',
          points: [
            {
              at: [-1139, 15.6],
              label: "The Countess's ledger, open on her lectern",
              note: "Six harvests, one column, one signature: Brassknock money, paid to the Combine. It is dated, and it is hers.",
              prop: 'ledger-book',
              radius: 4,
            },
          ],
          hint: "The front terrace, out round the west path from the back door",
          scene: 'm50-trellisdown-tasting-mid',
        },
        {
          kind: 'visit',
          text: 'Slip out of the gate past Chicory Snips',
          at: [-1150, -12.5],
          radius: 3.5,
          hint: 'The manor gate, north end of the drive',
        },
      ],
      doneText: "You have the Countess's signature on film: the money part of the Grand Combine is a vineyard's. Juniper is already drafting the letter.",
    },
  ],
  comms: {
    'm50-trellisdown-tasting': {
      0: brief(
        ['juniper', 'Previously: Granny\'s Dew went west, and the Countess was only glimpsed. Now she hosts.'],
        ['juniper', 'A grape-dew tasting for the Combine\'s backers. She funds its money part. Go as a waiter.'],
        ['juniper', 'Drive west to Trellisdown, photograph her ledger, and come back. Six hundred fifty acorns.'],
      ),
      1: call(['chicory', 'Waiters use the side door. Round the back, and walk like you are carrying something.']),
      2: call(['juniper', 'The ledger is on the terrace. Vesper is among the guests. Tray high, face quiet.']),
      3: call(['chicory', 'You. Stop. I count one waiter more than the Countess ordered.']),
    },
  },
  plans: {
    'm50-trellisdown-tasting': { suite: 'story', expect: 'pass' },
  },
  givers: {
    'juniper-call': {
      id: 'juniper-call',
      name: "A call from Juniper, at the Burrow Door",
      label: "Answer Juniper's call",
      x: BURROW_CALL[0],
      z: BURROW_CALL[1],
      exit: { x: BURROW_CALL[0] + 1.8, z: BURROW_CALL[1], yaw: Math.PI / 2 },
      room: 'street',
      letter: '!',
    },
  },
  bulletins: {
    'm50-trellisdown-tasting': [
      'Trellisdown reports a well-attended tasting and one waiter more than the list allowed. The head gardener declined to count again.',
      'Councillor Vance has no comment on the Brassknock accounts, and a very long one on the Brassknock handwriting.',
    ],
  },
};
