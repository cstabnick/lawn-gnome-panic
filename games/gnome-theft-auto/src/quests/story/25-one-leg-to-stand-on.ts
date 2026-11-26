// Story row 25 (docs/design/gnome-theft-auto/story-outline.md): One Leg to Stand On, act II, chapter 2. Driftwood is no longer
// waved off at the sprinklers; he is a client. The Flock of the One Leg borrowed his raft, and Mother Saxifrage Wader will
// return it if the player stands one-legged through her whole sermon (E17: WADERS_REST, societies/flock/sermon.ts, the
// press-and-hold on the action button; SOCIETY_PROBES.sermon counts a sermon stood). The sermon names the Even Cut, on the
// longest day, and she looks at the player when she says it: funny first, ominous on the last line, never explained or
// answered. First reach of Wader's Rest. The raft is towed home behind a combine, as Driftwood's lawn-boat was in the
// castaway quest. Scenes: cutscene/scenes/story/m25-one-leg-to-stand-on.ts.
import { WADERS_REST, SOCIETY_PROBES } from '../../societies/config';
import { brief, call, type StoryFile } from './kit';

export const STORY: StoryFile = {
  quests: [
    {
      id: 'm25-one-leg-to-stand-on',
      title: 'One Leg to Stand On',
      giver: 'driftwood-trailer',
      prereq: 'm24-the-burrow-door',
      chapter: 2,
      rewardAcorns: 300,
      radioBulletin: 'm25-one-leg-to-stand-on',
      achievement: 'gta-standing-ovation',
      // A sermon and a slow tow: the Hat Watch has no business at a prayer meeting.
      hoa: 'off',
      outro: { kind: 'script', script: 'm25-one-leg-to-stand-on-outro' },
      beats: { 2: 'm25-one-leg-to-stand-on-mid' },
      objectives: [
        {
          kind: 'visit',
          text: "Drive to Wader's Rest, west along the loch road, and find Mother Saxifrage",
          at: [-1114, -639],
          radius: 11,
          hint: "Wader's Rest, by the loch",
          scene: 'm25-one-leg-to-stand-on-intro',
        },
        {
          kind: 'probe',
          text: 'Stand on one leg through the whole sermon: hold the action button and do not let go',
          probe: SOCIETY_PROBES.sermon,
          count: 1,
          at: [WADERS_REST.circle.x, WADERS_REST.circle.z],
          hint: 'The ritual circle',
        },
        {
          kind: 'steal-deliver',
          text: "Tow Driftwood's raft home to his trailer",
          vehicleKind: 'combine',
          spawnAt: [-1054, -636, Math.PI / 2],
          dropAt: [34.4, 463.6],
          radius: 9,
          hint: "Driftwood's trailer, Cloverfield",
          banter: ['Driftwood (radio): "Gently, mate. She is not used to being wanted."'],
        },
      ],
      doneText: "The raft is home, a little blessed. Driftwood is delighted, and you cannot quite stop hearing 'the Even Cut'.",
    },
  ],
  comms: {
    'm25-one-leg-to-stand-on': {
      0: brief(
        ['driftwood', 'Previously: I waved you off at the sprinklers. Now I am hiring, friend.'],
        ['driftwood', 'The Flock of the One Leg borrowed my raft. Nobody asked. Not even the raft.'],
        ['driftwood', "Wader's Rest, west along the loch road. Three hundred acorns, and a story."],
      ),
      1: call(['saxifrage', 'One leg, friend, the whole sermon. Hold the button. So it is stood.']),
      2: call(['driftwood', 'You stood! I felt it in my hat. Tow her home, mate.']),
    },
  },
  plans: {
    'm25-one-leg-to-stand-on': { suite: 'story', expect: 'pass' },
  },
  bulletins: {
    'm25-one-leg-to-stand-on': [
      "Loch Moss reports a gnome seen standing on one leg for a full sermon, unprompted, and a raft towed away in the evening light.",
      "Wader's Rest says the Standing Lady has not moved. The Flock say her beak may have, and they will not be taking questions.",
    ],
  },
  givers: {
    'driftwood-trailer': {
      id: 'driftwood-trailer',
      name: "Driftwood's trailer",
      label: 'Hear Driftwood out',
      x: 29.5,
      z: 465,
      exit: { x: 29.5, z: 467.5, yaw: 0 },
      room: 'street',
      letter: 'D',
    },
  },
};
