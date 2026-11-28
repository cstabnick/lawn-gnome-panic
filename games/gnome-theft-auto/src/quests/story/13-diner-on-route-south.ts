// Story row 13 (docs/design/gnome-theft-auto/story-outline.md): Diner on Route South. Tansy lends the player out to
// collect a debt from Sage Ladle; the debt is a lunch, and the lunch is a rush. Past Fence-Post Frank's sign, into the
// Route South Acorn Diner, six plates carried to six tables, then Frank at the counter naming the one gnome Vesper
// cannot buy. Scenes: cutscene/scenes/story/m13-diner-on-route-south.ts. Stage: stages/story/s13-*.ts (diner-rush).
import { brief, call, type StoryFile } from './kit';

/** The six tables of the rush: the booth already standing at the diner and the five this row lays. The point is 2.4 m south of each. */
const TABLES: readonly { at: [number, number]; label: string; note: string }[] = [
  { at: [22, 264.4], label: 'Table 1 of 6: the corner booth', note: 'Table 1: a coach driver eats his soup standing, for the sake of his back.' },
  { at: [28.5, 264.4], label: 'Table 2 of 6: the middle table', note: 'Table 2: two cousins disagree over a map. Neither of them is holding it the right way up.' },
  { at: [35, 264.4], label: 'Table 3 of 6: the far end', note: 'Table 3: the coach conductor stamps your tray. It was not that kind of tray.' },
  { at: [15, 270.9], label: 'Table 4 of 6: by the road', note: 'Table 4: a tourist photographs the garnish. The garnish is decorative.' },
  { at: [22.5, 270.9], label: 'Table 5 of 6: under the awning', note: 'Table 5: a slice of pie nobody ordered. Sage decided.' },
  { at: [30, 270.9], label: 'Table 6 of 6: the last table', note: 'Table 6: the last plate of the rush. Somewhere behind you, a bell rings once.' },
];

export const STORY: StoryFile = {
  quests: [
    {
      id: 'm13-diner-on-route-south',
      title: 'Diner on Route South',
      giver: 'side-valve',
      prereq: 'm12-quarter-inch-at-home',
      chapter: 1,
      rewardAcorns: 200,
      radioBulletin: 'm13-diner-on-route-south',
      // A lunch, not a fight: the Hat Watch has no business at the Acorn Diner.
      hoa: 'off',
      cutscene: { kind: 'script', script: 'diner-route-south-intro' },
      outro: { kind: 'script', script: 'diner-route-south-outro' },
      objectives: [
        {
          kind: 'visit',
          text: "Drive south on Route South, past Fence-Post Frank's welcome sign",
          at: [-5, 247],
          radius: 9,
          hint: "Frank's welcome sign, Route South",
          toastOnEnter: 'A gnome in a floppy hat leans on a hand-painted sign and waves you down the road. His eyes are on your engine, not your face.',
        },
        {
          kind: 'visit',
          text: "Ask Sage Ladle for Tansy's money at the Route South Acorn Diner",
          at: [4, 256],
          radius: 8,
          hint: 'The Route South Acorn Diner',
          scene: 'diner-route-south-mid',
        },
        {
          kind: 'inspect',
          text: 'Carry six plates to six tables before the lunch rush is over',
          verb: 'Serve',
          hint: 'The diner tables',
          points: TABLES.map((t) => ({ at: t.at, label: t.label, note: t.note, radius: 2.2 })),
        },
        {
          kind: 'visit',
          text: "Sit at Frank's counter outside the diner",
          at: [6.5, 265],
          radius: 3,
          hint: "Frank's counter",
          toastOnEnter: 'Sage slides a hot toastie across the counter for the road. It is, as far as anyone can tell, a fair price for a fryer.',
        },
      ],
      doneText: "Sage's debt is paid, in plates and in toast, and Frank has given you a name: Granny Gnertrude, out at Cloverfield.",
    },
  ],
  comms: {
    'm13-diner-on-route-south': {
      0: brief(
        ['tansy', 'Sage Ladle owes me for a fryer. She runs the Acorn Diner.'],
        ['tansy', 'Collect it. She pays in meals, not acorns. Eat slowly.'],
        ['tansy', 'You get two hundred Acorns for the drive. I get the fryer money.'],
      ),
      1: call(['tansy', 'Frank will read your engine from the road. Let him. Then find Sage.']),
      2: call(['sage', 'Coach is in, love. Six tables. Carry the tray and mind the soup.']),
      3: call(['frank', 'Rush is over. Sit at my counter. I have something useful to say.']),
    },
  },
  bulletins: {
    'm13-diner-on-route-south': [
      'The Route South Acorn Diner served its noon coach in record time today. The cook credits a new hand and "a debt settled in plates".',
      'Fence-Post Frank has rung the end-of-rush bell once, loudly, and says he heard everything. Nobody has asked him what.',
    ],
  },
  plans: {
    'm13-diner-on-route-south': { suite: 'story', expect: 'pass' },
  },
};
