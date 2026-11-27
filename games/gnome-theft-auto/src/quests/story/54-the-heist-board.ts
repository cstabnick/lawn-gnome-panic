// Story row 54 (docs/design/gnome-theft-auto/story-outline.md): The Heist Board, act IV, chapter 4. The crew is down from the
// cold with a plan on a plank board. Tansy (the overlook safehouse) needs air power, and the Whirligig is in Fort Sandpit: the
// player photographs the fort's three sides from the guard rail on the overlook's rim (north wall, main gate, the pad), drives
// out to Wind-Sock Wally's caravan on the Desert Airfield apron, and brings him back to the board. Tansy lets Pip run a plan and
// stops saying "not my problem": the first rung. Scenes: cutscene/scenes/story/m54-the-heist-board.ts (intro, the arrival at
// the caravan, outro). Stages: quests/stages/story/s54-the-heist-board.ts (the rail and the caravan are built there).
import { brief, call, type StoryFile } from './kit';

/** Wally's caravan door (stage m54-wally-caravan, the caravan at (466, -75.6) turned to face the apron), and the apron arrival. */
const CARAVAN_PICKUP: [number, number] = [466.4, -81.4];
/** Where Wally is set down at the overlook: the dust track below the board. */
const BOARD_DROP: [number, number] = [276, 46];

export const STORY: StoryFile = {
  quests: [
    {
      id: 'm54-the-heist-board',
      title: 'The Heist Board',
      giver: 'dust-overlook',
      prereq: 'ch3-tundra-drift-run',
      chapter: 4,
      rewardAcorns: 300,
      radioBulletin: 'm54-the-heist-board',
      // Photographs from a rail and a ride with a pilot: no Hat Watch.
      hoa: 'off',
      cutscene: { kind: 'script', script: 'heist-board-intro' },
      outro: { kind: 'script', script: 'heist-board-outro' },
      objectives: [
        {
          kind: 'inspect',
          text: "Photograph Fort Sandpit's north wall, main gate and Whirligig pad from the overlook rail",
          verb: 'Photograph',
          hint: "The guard rail on the east rim of the camp, past the map table",
          points: [
            {
              at: [280.7, 40.6],
              label: 'The north wall, from the rail (1 of 3)',
              note: 'Five snipers along the north wall, every one of them watching the road. Not one looks up.',
              prop: 'camera-tripod',
              radius: 1.8,
            },
            {
              at: [280.7, 36.6],
              label: 'The main gate, from the rail (2 of 3)',
              note: 'One gate, one toll booth, one painted sawhorse. Nothing drives in, and the Guard are proud of it.',
              prop: 'camera-tripod',
              radius: 1.8,
            },
            {
              at: [280.7, 32.6],
              label: 'The Whirligig pad, over the wall (3 of 3)',
              note: 'The Whirligig, chained at four corners. Its windsock hangs dead, the only thing in the fort not on duty.',
              prop: 'camera-tripod',
              radius: 1.8,
            },
          ],
        },
        {
          kind: 'visit',
          text: "Drive to Wally's caravan on the Desert Airfield apron",
          at: [466, -85],
          radius: 12,
          hint: "Wally's caravan, on the Desert Airfield apron, north of the parked planes",
          scene: 'heist-board-caravan',
        },
        {
          kind: 'passenger',
          text: "Take Wally from his caravan back to Tansy's board on the overlook",
          who: 'wally',
          name: 'Wally',
          pickup: CARAVAN_PICKUP,
          dropAt: BOARD_DROP,
          radius: 10,
          hint: 'Wally, by his caravan on the apron',
          vehicle: { kind: 'lowrider', at: [461.4, -87.6, 0.2] },
          maxDamage: 0.6,
          banter: [
            'Wally: "Wind is nor\'-nor\'-east. Mind the dips. My knees have opinions about dips."',
            'Wally: "Stall speed is twenty-two. That is also the speed I would like you to drive."',
            'Wally: "I know the man who runs that fort. We do not discuss it."',
            'Wally: "A rotor and no wings. Kid, I have been waiting my whole life to be nervous again."',
          ],
          onBoard: 'Wally folds himself into the seat, clipboard on his knees. "Neck," he says, tapping the key.',
          onDrop: 'Wally steps down slowly, one knee at a time, and looks up the hill at a board with string on it.',
        },
      ],
      doneText: 'Wally has read the board and asked the only practical question. The plan has a pilot, a fort to study and a fuel bill, and the bill is Tansy\'s.',
    },
  ],
  comms: {
    'm54-the-heist-board': {
      0: brief(
        ['tansy', 'Previously: the Stone got here in one piece, and Vesper named his day.'],
        ['tansy', 'Air superiority means the Whirligig. It is in Fort Sandpit. Photograph three sides of it.'],
        ['tansy', 'Use the rail on the rim, east of the map table. Three hundred acorns.'],
      ),
      1: call(
        ['tansy', 'Good photographs. Now Wally. East along the highway, then the airfield spur, and the caravan.'],
      ),
      2: call(
        ['tansy', 'Wally is in. Bring him back to the board. Gently: he flies better than he sits.'],
      ),
    },
  },
  plans: {
    'm54-the-heist-board': { suite: 'story', expect: 'pass' },
  },
  bulletins: {
    'm54-the-heist-board': [
      'The Spade Guard reports three bright flashes from the Dust Flats overlook and has decided they were weather. Commander Diggs has asked the weather to stop.',
      'Desert Airfield: Wind-Sock Wally was seen leaving his caravan with a clipboard, a key round his neck and a question about fuel. The wind, he says, is good.',
    ],
  },
};
