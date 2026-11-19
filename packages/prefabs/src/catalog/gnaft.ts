// New prefabs for gnaft. One owner (the gnaft adoption issue): add entries here and nowhere else.
import type { PrefabDef } from '../types';

const RED = 0xd8342c;
const YELLOW = 0xf2c230;
const DARK = 0x222222;
const METAL = 0x8a9399;
const GRASS = 0x4caf50;
const DIRT = 0x6d4c2e;
const WHITE = 0xffffff;
const GLASS = 0x5fbf7f;

export const GNAFT: readonly PrefabDef[] = [
  {
    id: 'fuel-drum', name: 'Fuel Drum', category: 'prop', uses: ['place'],
    tags: ['drum', 'fuel', 'steel', 'depot', 'red', 'barrel'], emoji: [],
    about: 'A red steel fuel drum with a dark band at each end. Built at natural size; the game places it at scale 1.',
    examine: [
      'A red steel drum as tall as a gnome\'s waist, with a dark band round each end to keep the lid on.',
      'Old saying: "A full drum is a promise, and an empty one is a lie somebody forgot to fix."',
      'Tip: the drums are heavy and they roll. Push them from the side, never from the bottom.',
      'Joke: the drum says FUEL on the side. Every gnome who has tried to read it has been disappointed.',
    ],
    parts: [
      { s: 'cyl', d: [0.6, 0.6, 1.4], at: [0, 0.7, 0], c: RED, seg: 16 },
      { s: 'cyl', d: [0.62, 0.62, 0.1], at: [0, 1.32, 0], c: DARK, seg: 16 },
      { s: 'cyl', d: [0.62, 0.62, 0.1], at: [0, 0.08, 0], c: DARK, seg: 16 },
    ],
  },
  {
    id: 'fuel-pump', name: 'Fuel Pump', category: 'prop', uses: ['place'],
    tags: ['pump', 'fuel', 'depot', 'nozzle', 'yellow', 'machine'], emoji: [],
    about: 'A yellow fuel pump with a hose nozzle hung on its side. Built at natural size; the game places it at scale 1.',
    examine: [
      'A yellow box on a stick, with a black nozzle hung on the side like a sleeping snake.',
      'Gnome saying: "Never lean on the pump. It leans back, and it has never once apologised."',
      'Tip: the nozzle is hot after use. Hang it back up before you walk off the raft.',
      'Joke: the pump has no meter, no dial and no price. It simply knows how much you took.',
    ],
    parts: [
      { s: 'box', d: [0.8, 1.6, 0.6], at: [0, 0.8, 0], c: YELLOW },
      { s: 'box', d: [0.1, 0.1, 0.9], at: [0.45, 0.6, 0.45], c: DARK },
    ],
  },
  {
    id: 'scrap-heap', name: 'Scrap Heap', category: 'prop', uses: ['place'],
    tags: ['scrap', 'heap', 'metal', 'junk', 'pile', 'yard'], emoji: [],
    about: 'A squashed grey dome of scrap metal, one unit across before the game scales it. Its centre is at 0.7 times its radius.',
    examine: [
      'A heap of grey metal, squashed flat on top, with a dented bucket somewhere near the middle.',
      'Old saying: "Every heap was once a machine, and every machine was once somebody\'s pride."',
      'Tip: scrap heaps shift when you climb them. Climb them slowly, and with your eyes shut.',
      'Joke: a scrap heap is the only place in the sea where a gnome can say he is sorting his things out.',
    ],
    parts: [
      { s: 'ball', d: [1], at: [0, 0.7, 0], scale: [1, 0.7, 1], c: METAL },
    ],
  },
  {
    id: 'grass-tuft', name: 'Grass Tuft', category: 'material', uses: ['collect'],
    tags: ['grass', 'tuft', 'clump', 'lawn', 'green', 'cut', 'clod'], emoji: ['🌿'],
    about: 'A clump of cut grass on a clod of dirt: three blades standing up out of a flat round base. Built at natural size.',
    examine: [
      'Three blades of cut grass standing up out of a clod of dirt, still damp and smelling of somebody\'s lunch.',
      'Gnome saying: "Grass that is cut grows back twice as keen, and twice as cross."',
      'Tip: a tuft of grass floats well. Gather a bundle, and the raft will not notice the weight.',
      'Joke: the grass was on the raft a moment ago, and now it is in your hand. Nobody is sure which of you moved.',
    ],
    parts: [
      { s: 'cyl', d: [0.3, 0.3, 0.06], at: [0, 0.03, 0], c: DIRT, seg: 10 },
      { s: 'cone', d: [0.09, 0.4], at: [0.12, 0.26, 0], c: GRASS, seg: 5 },
      { s: 'cone', d: [0.09, 0.4], at: [-0.0606, 0.26, 0.1036], c: GRASS, seg: 5 },
      { s: 'cone', d: [0.09, 0.4], at: [-0.0588, 0.26, -0.1046], c: GRASS, seg: 5 },
    ],
  },
  {
    id: 'fuel-can', name: 'Fuel Can', category: 'material', uses: ['collect'],
    tags: ['fuel', 'can', 'canister', 'petrol', 'red', 'mower'], emoji: ['⛽'],
    about: 'A squat red fuel can with a carry handle on top. Built at natural size; the game shows it at scale 1.',
    examine: [
      'A squat red can with a black handle on top, and a faint smell of something that wants to go up in flames.',
      'Old saying: "A can of fuel is a can of trouble, and a can of trouble is worth two cans of grass."',
      'Tip: carry the can with the handle up. Carried by the side, it swings and splashes on your boots.',
      'Joke: the label says NOT FOR DRINKING. Some gnomes read that as a challenge, and some of them lived.',
    ],
    parts: [
      { s: 'cyl', d: [0.15, 0.15, 0.45], at: [0, 0.225, 0], c: RED, seg: 12 },
      { s: 'box', d: [0.2, 0.04, 0.04], at: [0, 0.47, 0], c: DARK },
    ],
  },
  {
    id: 'beach-ball', name: 'Beach Ball', category: 'prop', uses: ['collect', 'throw'],
    tags: ['ball', 'beach', 'inflatable', 'toy', 'bright', 'red'], emoji: ['🏐'],
    about: 'A red beach ball with a white band round its middle. Built at natural size; the centre sits at 0.3.',
    examine: [
      'A red ball as big as a gnome\'s head, with a white band round the middle that spins as it drifts.',
      'Gnome saying: "Anything that bounces is a message from the sea, and nobody has ever read the message."',
      'Tip: beach balls float, so they make excellent rafts for smaller things, and terrible ones for you.',
      'Joke: it is called a beach ball, and there has never been a beach within a day\'s sail of it.',
    ],
    parts: [
      { s: 'ball', d: [0.3], at: [0, 0.3, 0], c: 0xd93636, seg: 12 },
      { s: 'ring', d: [0.302, 0.03], at: [0, 0.3, 0], rot: [90, 0, 0], c: WHITE, seg: 16 },
    ],
  },
  {
    id: 'toilet-seat', name: 'Toilet Seat', category: 'prop', uses: ['collect'],
    tags: ['toilet', 'seat', 'porcelain', 'ring', 'white', 'bathroom', 'tank'], emoji: ['🚽'],
    about: 'A white porcelain toilet seat ring lying flat, with a tank plate standing behind it. Built at natural size.',
    examine: [
      'A white porcelain ring lying flat on the water, with a tank plate standing up behind it like a headstone.',
      'Gnome saying: "The sea takes many things, but it has never once taken a seat it did not want."',
      'Tip: do not sit on it. It is a seat that floats, and a seat that floats is not a seat for gnomes.',
      'Joke: it is not clear who lost it, or who was using it at the time, and nobody has asked.',
    ],
    parts: [
      { s: 'ring', d: [0.22, 0.05], at: [0, 0.05, 0], rot: [90, 0, 0], c: WHITE, seg: 12 },
      { s: 'box', d: [0.44, 0.3, 0.04], at: [0, 0.2, -0.24], c: WHITE },
    ],
  },
  {
    id: 'message-bottle', name: 'Message in a Bottle', category: 'document', uses: ['collect', 'read'],
    tags: ['bottle', 'message', 'glass', 'paper', 'cork', 'sea', 'letter', 'green'], emoji: [],
    about: 'A green glass bottle standing upright, with a cork in the neck and a rolled paper inside. The game lays it down.',
    examine: [
      'A green glass bottle with a cork in the neck, and a rolled paper inside that has been wet and dried twice.',
      'Old saying: "Put a message in a bottle and the sea will carry it to the one gnome who needs it most."',
      'Tip: uncork it gently. A message that has been at sea for a month is delicate, and so are the fingers.',
      'Joke: the paper says "HELP", and then underneath, in different ink, "just kidding, the tea is ready".',
    ],
    parts: [
      { s: 'cyl', d: [0.1, 0.12, 0.45], at: [0, 0.225, 0], c: GLASS, alpha: 0.6, seg: 12 },
      { s: 'cyl', d: [0.04, 0.05, 0.15], at: [0, 0.525, 0], c: GLASS, alpha: 0.6, seg: 10 },
      { s: 'cyl', d: [0.045, 0.045, 0.06], at: [0, 0.63, 0], c: DIRT, seg: 10 },
      { s: 'cyl', d: [0.03, 0.03, 0.2], at: [0, 0.225, 0], c: WHITE, seg: 8 },
    ],
  },
];
