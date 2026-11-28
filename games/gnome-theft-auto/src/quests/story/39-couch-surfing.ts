// Story row 39 (docs/design/gnome-theft-auto/story-outline.md): Couch Surfing. Pip rings the lodge from behind a bin at the
// Central Bus Stop: Side-Valve is chained shut, his hammock is evidence, and he needs a roof. The player rides back south into
// Turfton with a plain cap over the hat, picks Pip up at the bus stop and takes him to Saucer Court, gets him past Hyssop Doormat
// on the stairs (she carries the gag: her old crossing-warden's paddle turns "lodger" into "luggage"), and drives to the Under-Deck
// culvert, where Tansy climbs out of the dark with Silt-Diver Sal behind her. The reunion is the one sincere beat (Tansy's only
// hug, per her arc); the crew splits the four Combine parts. Pip lives on the player's couch from here (W09 fires on completion).
// Scenes: cutscene/scenes/story/m39-couch-surfing.ts. Stages: quests/stages/story/s39-couch-surfing.ts.
import { homeDoor } from '../../homes/data';
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const ID = 'm39-couch-surfing';

/** The x = 0 road at the north edge of downtown, where the HOA watchers start to thicken. */
const DOWNTOWN_EDGE: [number, number] = [0, -190];
/** The Central Bus Stop (Snail-Coach Stop, Downtown): the stop's bench and shelter, Pip waiting behind the bin by it. */
const BUS_STOP: [number, number] = [-9.5, 18];
/** Saucer Court's courtyard, in front of the stairwell door of flats 3A and 3B. */
const COURT: [number, number] = homeDoor('player');
const STAIR_DOOR: [number, number] = [30.4, 83.6];
/** The Under-Deck storm drain portal under the kerb (stage `culvert-under-deck`). */
const CULVERT: [number, number] = [-7, -8.5];

const QUEST: QuestDef = {
  id: ID,
  title: 'Couch Surfing',
  giver: 'pip-call-lodge',
  prereq: 'm38-pail-pond',
  chapter: 3,
  rewardAcorns: 200,
  radioBulletin: ID,
  // A quiet ride, a stairwell and a drain: the Hat Watch is only scenery here.
  hoa: 'off',
  cutscene: { kind: 'script', script: 'm39-couch-surfing-intro' },
  outro: { kind: 'script', script: 'm39-couch-surfing-outro' },
  objectives: [
    {
      kind: 'visit',
      text: 'Ride south into Turfton with a plain cap over your hat, past the HOA watchers',
      at: DOWNTOWN_EDGE,
      radius: 18,
      hint: 'The x = 0 road, north edge of downtown',
      heatOnEnter: 1,
      toastOnEnter: 'Beige watchers on every corner. The plain cap is doing its job, mostly.',
    },
    {
      kind: 'passenger',
      text: 'Pick up Pip and his toolbox at the Central Bus Stop and take him to Saucer Court',
      who: 'pip',
      name: 'Pip',
      pickup: BUS_STOP,
      dropAt: COURT,
      radius: 9,
      hint: 'Central Bus Stop, then Saucer Court',
      banter: [
        'Pip: "Do not look at the watchers. If you look, they look. It is a known thing."',
        'Pip: "Is your couch a good couch? I will take a bad couch. I am so tired."',
        'Pip: "Wait, is that a plain cap? You look like a bank. A tall, worried bank."',
        'Pip: "Hyssop is the stairs. Whatever she asks, I am luggage. Luggage does not talk."',
      ],
      onBoard: 'Pip: "Drive normal. Drive like a gnome who owns a flat. Go go go."',
      onDrop: 'Pip: "Saucer Court! A real address! I am going to cry on your mat."',
    },
    {
      kind: 'visit',
      text: "Get Pip past Hyssop on the stairs to flat 3B",
      at: STAIR_DOOR,
      radius: 2.8,
      hint: 'The stairwell door, Saucer Court',
      scene: 'm39-couch-surfing-mid',
    },
    {
      kind: 'visit',
      text: 'Meet Tansy at the Under-Deck culvert, and bring the map',
      at: CULVERT,
      radius: 5,
      hint: 'The Under-Deck storm drain, off the x = 0 road',
    },
  ],
  doneText:
    'Tansy is back, Sal has his socks and the map has four marks on it. Pip has a couch, a toolbox by your door and a neighbour with a very long memory.',
};

export const STORY: StoryFile = {
  quests: [QUEST],
  comms: {
    [ID]: {
      0: brief(
        ['pip', 'Previously: we have a map of four parts and nowhere to hide. Turfton, in disguise.'],
        ['pip', 'I am behind a bin at the Central Bus Stop. I need a couch. Yours.'],
        ['pip', 'Ride in with a plain cap over the hat. Two hundred acorns. Do not get spotted.'],
      ),
      1: call(['pip', 'Bus stop, behind the bin. If it smells like onions, that is me.']),
      2: call(['pip', 'Hyssop is on the stairs. Say nothing. I am luggage. Luggage folds.']),
      3: call(
        ['tansy', 'Under-Deck culvert, off the main road. Bring the map.'],
        ['tansy', 'Four parts, four edges. We split them here.'],
      ),
    },
  },
  bulletins: {
    [ID]: [
      'Turfton FM: a Saucer Court resident reports a second tenant. The neighbour reports the second tenant again, with a drawing.',
      'The HOA reminds downtown that plain caps are encouraged. A spokesgnome could not say, for the record, whether anyone under one was a lodger.',
    ],
  },
  givers: {
    'pip-call-lodge': {
      id: 'pip-call-lodge',
      name: "Woolly Sock Lodge (Pip's call)",
      label: "Answer Pip's call",
      x: -434.5,
      z: -1016.5,
      exit: { x: -431.5, z: -1016.5, yaw: Math.PI / 2 },
      room: 'street',
      letter: '!',
    },
  },
  plans: {
    [ID]: { suite: 'story', expect: 'pass' },
  },
};
