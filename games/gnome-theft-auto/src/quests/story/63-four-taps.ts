// Story row 63 (docs/design/gnome-theft-auto/story-outline.md): Four Taps, act IV, chapter 4. The Don taps four times, which
// nobody has seen, and lends the Club's crews and money to the coalition at one price: the Mayor's signature on the emergency
// counter-order. R-234 moves the Mayor from his villa to a terrace table at Café Pardon in Pardonlin, where no HOA letter can
// be served past the Wickets (R-183) and Hector Disdain has not taken his order in three days. The player drives west down
// Vineyard Lane through the Grand Wicket, round the Hatwheel and down to Teacup Row (E28/E30), picks him up with his second
// coat still drying (a passenger, a damage limit: "mind the paint") and drives him the whole way back to the Mulch Club, where
// he signs with the Club's own pen. Scenes: cutscene/scenes/story/m63-four-taps.ts (intro, mid, outro).
import { brief, call, type StoryFile } from './kit';

const ID = 'm63-four-taps';

export const STORY: StoryFile = {
  quests: [
    {
      id: ID,
      title: 'Four Taps',
      giver: 'mulch-club',
      prereq: 'm62-cams-cell',
      chapter: 4,
      rewardAcorns: 400,
      radioBulletin: ID,
      // A long gentle errand with a passenger: the Hat Watch has no business with a Mayor on holiday.
      hoa: 'off',
      cutscene: { kind: 'script', script: 'four-taps-intro' },
      outro: { kind: 'script', script: 'four-taps-outro' },
      objectives: [
        {
          kind: 'visit',
          text: 'Drive west down Vineyard Lane and through the Grand Wicket into Pardonlin',
          at: [-1402, -30],
          radius: 12,
          hint: 'West past Trellisdown on Vineyard Lane, the white gate in the old fence',
          toastOnEnter: 'The customs hut stamps your hat. It will be stamped again on the way back, and you will not be asked why.',
        },
        {
          kind: 'visit',
          text: "Find the Mayor at his terrace table at Café Pardon on Teacup Row",
          at: [-1522.5, 143],
          radius: 12,
          hint: 'Through the Grand Wicket, round the great roundabout, then south to Teacup Row',
          scene: 'four-taps-mid',
        },
        {
          kind: 'passenger',
          text: 'Drive the Mayor home to the Mulch Club without scuffing him',
          who: 'mayor mulch',
          name: 'The Mayor',
          pickup: [-1522.9, 139.2],
          dropAt: [-6, -30],
          radius: 7,
          hint: 'Back east through the Wickets and across Turfton to the Mulch Club side door',
          vehicle: { kind: 'lowrider', at: [-1522.6, 134.0, Math.PI] },
          maxDamage: 0.4,
          banter: [
            'Mayor: "Does this car have towels? Napkins? A very small tarpaulin?"',
            'Mayor: "Gently round the bends. The cuffs are still tacky."',
            'Mayor: "If anyone asks, that was a different glaze! Ding, ding!"',
            'Mayor: "Who is winning at home? Tell me the second it changes."',
            'Mayor: "Do not stop for the customs man. He will only stamp my coat."',
          ],
          onBoard: 'Mayor: "Do not touch the coat. Or the seat. Or me."',
          onDrop: 'Mayor: "Home! Do not breathe on me. Ding, ding!"',
        },
        {
          kind: 'visit',
          text: "Walk the Mayor in at the Mulch Club's side door",
          at: [-11.5, -30],
          radius: 4,
          hint: 'The Mulch Club side door',
        },
      ],
      doneText: "The Mayor has signed, streaky, and the Don has tapped a fifth time. The Mulch Club's crews and money are the coalition's.",
    },
  ],
  comms: {
    [ID]: {
      0: brief(
        ['big lou', 'Previously: Cam is out and gave the code. Don tapped four. Nobody has seen four.'],
        ['big lou', 'Club lends crews, money. Price: Mayor signs. He hides west. Café Pardon.'],
        ['big lou', 'Through the Wickets. Bring him back dry. Four hundred acorns. Hat.'],
      ),
      1: call(
        ['big lou', 'Teacup Row. Gramophone table. Sunny side. He is the one sitting very still.'],
      ),
      2: call(
        ['mayor mulch', 'Ding, ding! Mind the paint, friend! It is drying, and so am I!'],
        ['mayor mulch', 'Slowly! Smoothly! As if I were a very expensive cake!'],
      ),
      3: call(['big lou', 'Walk him in. Pen is out. Don is tapping. ...Hat.']),
    },
  },
  plans: {
    [ID]: { suite: 'story', expect: 'pass' },
  },
  bulletins: {
    [ID]: [
      'Turfton FM: Customs at the Grand Wicket report a black Lowrider returning at walking pace, one passenger sitting very upright in the back, two hats stamped.',
      'The Mulch Club will not comment on the number of taps. Neighbours say they stopped counting at four, which is the war, and then did not know what to do with five.',
      'Mayor Mulch is back from a three-day fact-finding lunch in Pardonlin. He found no facts, and says the coffee is on its way.',
    ],
  },
};
