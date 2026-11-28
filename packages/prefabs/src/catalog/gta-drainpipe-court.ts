// Gnome Theft Auto: Drainpipe Court (batch 3 E19): the court's hoops, scoreboard, ball cage and dressing props.
import type { PrefabDef } from '../types';

export const GTA_DRAINPIPE_COURT: readonly PrefabDef[] = [
  {
    id: 'drainpipe-hoop',
    name: 'Drainpipe Hoop',
    category: 'prop',
    uses: ['place'],
    footprint: { r: 0.5, h: 4.2 },
    tags: ['hoop', 'basket', 'basketball', 'drainpipe', 'backboard', 'rim', 'pipe', 'gta'],
    emoji: [],
    tint: 'white',
    about: 'A galvanised downpipe on a concrete shoe, a white plywood backboard clamped to it and an orange rim with no net. Front faces +z.',
    examine: [
      'A galvanised downpipe on a cracked concrete shoe, with a white board clamped to it and an orange rim hanging off the side.',
      'The Charters say a Tall One\'s pipe carried the rain down to where the gnomes could drink it. The rain has since moved on.',
      'Rule of the court: if the ball goes down the pipe, you climb the pipe to get it back.',
      'The shooter square was painted by someone very sure of the distance. The rim was not consulted.',
      'There is no net. The court calls this a feature. The pipe has never once agreed.',
    ],
    parts: [
      { s: 'box', d: [0.5, 0.12, 0.5], at: [0, 0.06, 0], c: 'stone' },
      { s: 'cyl', d: [0.09, 0.09, 3.6], at: [0, 1.9, -0.1], c: 'iron', seg: 10 },
      // Downpipe elbow at the top, pointing back, with a gutter stub
      { s: 'cyl', d: [0.09, 0.09, 0.32], at: [0, 3.62, -0.26], rot: [90, 0, 0], c: 'iron', seg: 10 },
      { s: 'box', d: [0.2, 0.06, 0.12], at: [0, 3.62, -0.475], c: 'iron-dark' },
      // Backboard face at z 0.08
      { s: 'box', d: [1.5, 1.0, 0.04], at: [0, 3.4, 0.06], c: 'white' },
      // Pipe clamps bolting the board to the pipe
      { s: 'box', d: [0.12, 0.06, 0.16], at: [0, 3.1, 0], c: 'iron-dark' },
      { s: 'box', d: [0.12, 0.06, 0.16], at: [0, 3.6, 0], c: 'iron-dark' },
      // Red shooter's square: thin boxes 0.005 proud of the board
      { s: 'box', d: [0.5, 0.03, 0.01], at: [0, 3.66, 0.0825], c: 'red' },
      { s: 'box', d: [0.5, 0.03, 0.01], at: [0, 3.24, 0.0825], c: 'red' },
      { s: 'box', d: [0.03, 0.45, 0.01], at: [-0.235, 3.45, 0.0825], c: 'red' },
      { s: 'box', d: [0.03, 0.45, 0.01], at: [0.235, 3.45, 0.0825], c: 'red' },
      // Bracket arm from the board out to the rim
      { s: 'box', d: [0.03, 0.03, 0.34], at: [0, 3.05, 0.25], c: 'iron-dark' },
      // Orange rim, inner radius 0.23, centre (0, 3.05, 0.4)
      { s: 'ring', d: [0.245, 0.015], at: [0, 3.05, 0.4], c: 'orange', seg: 14 },
    ],
  },
  {
    id: 'chalk-scoreboard',
    name: 'Chalk Scoreboard',
    category: 'prop',
    uses: ['place'],
    footprint: { r: 0.6, h: 1.4 },
    tags: ['chalkboard', 'scoreboard', 'score', 'easel', 'chalk', 'tally', 'board', 'gta'],
    emoji: [],
    tint: 'slate',
    about: 'An A-frame chalkboard on an easel with HOME and AWAY tally columns, a chalk ledge, two chalk sticks and a rag. Tint is the board.',
    examine: [
      'An A-frame chalkboard with two columns of tally strokes, HOME and AWAY, and a ledge holding two chalk sticks and a rag.',
      'Gnome saying: the score is not real until it is chalked, and it is not final until someone has rubbed it out.',
      'Tally strokes come in fives, with the fifth drawn across the other four. Nobody has ever counted past the first gate.',
      'The AWAY column is shorter than the HOME column. The chalk is also shorter. Both are a matter of opinion.',
      'Ask who won the last game and the board will say HOME, in big letters, because that is what the chalk was for.',
    ],
    parts: [
      // A-frame legs, tilted so their tops meet the board at z 0
      { s: 'box', d: [0.05, 1.383, 0.05], at: [0.4, 0.68, -0.15], rot: [12.5, 0, 0], c: 'wood', mirror: true },
      { s: 'box', d: [1.2, 1.0, 0.04], at: [0, 0.85, 0], c: 'slate' },
      // Chalk ledge along the bottom edge
      { s: 'box', d: [1.2, 0.05, 0.12], at: [0, 0.35, 0.06], c: 'wood-light' },
      { s: 'cyl', d: [0.012, 0.012, 0.1], at: [-0.2, 0.385, 0.1], rot: [0, 0, 90], c: 'chalk', seg: 6 },
      { s: 'cyl', d: [0.012, 0.012, 0.1], at: [0.1, 0.385, 0.1], rot: [0, 0, 90], c: 'chalk', seg: 6 },
      { s: 'box', d: [0.14, 0.03, 0.08], at: [0.45, 0.385, 0.1], c: 'cloth' },
      // HOME column (left) and AWAY column (right), tally strokes on the face
      { s: 'box', d: [0.012, 0.3, 0.01], at: [-0.34, 0.85, 0.0225], c: 'chalk' },
      { s: 'box', d: [0.012, 0.3, 0.01], at: [-0.3, 0.85, 0.0225], c: 'chalk' },
      { s: 'box', d: [0.012, 0.3, 0.01], at: [-0.26, 0.85, 0.0225], c: 'chalk' },
      { s: 'box', d: [0.012, 0.3, 0.01], at: [-0.22, 0.85, 0.0225], c: 'chalk' },
      { s: 'box', d: [0.012, 0.3, 0.01], at: [0.22, 0.85, 0.0225], c: 'chalk' },
      { s: 'box', d: [0.012, 0.3, 0.01], at: [0.26, 0.85, 0.0225], c: 'chalk' },
      { s: 'box', d: [0.012, 0.3, 0.01], at: [0.3, 0.85, 0.0225], c: 'chalk' },
      // Column headers
      { s: 'box', d: [0.2, 0.07, 0.01], at: [-0.28, 1.2, 0.0225], c: 'chalk' },
      { s: 'box', d: [0.2, 0.07, 0.01], at: [0.28, 1.2, 0.0225], c: 'chalk' },
    ],
  },
  {
    id: 'ball-cage',
    name: 'Ball Cage',
    category: 'prop',
    uses: ['place'],
    footprint: { r: 0.55, h: 0.8 },
    tags: ['cage', 'ball', 'basketball', 'padlock', 'wire', 'locker', 'gta'],
    emoji: [],
    tint: 'iron-dark',
    about: 'A waist-high wire ball cage on four posts with three scuffed orange balls and an open padlock. Tint is the frame.',
    examine: [
      'A waist-high wire cage on four posts, holding three scuffed orange balls and a padlock hanging open.',
      'Gnome law: a ball in a cage belongs to whoever has the key. The key is nowhere, and the padlock knows it.',
      'The balls are scuffed from a thousand dribbles, which is how you know they are in use and not just for show.',
      'The cage keeps the balls safe from thieves. The thieves are, in general, the children who put them in.',
      'A tip: lift the gate from the back. The front is only there to look busy.',
    ],
    parts: [
      // Four corner posts
      { s: 'box', d: [0.03, 0.8, 0.03], at: [0.5, 0.4, 0.3], c: 'tint', mirror: true },
      { s: 'box', d: [0.03, 0.8, 0.03], at: [0.5, 0.4, -0.3], c: 'tint', mirror: true },
      // Top rails
      { s: 'box', d: [1.0, 0.03, 0.03], at: [0, 0.8, 0.3], c: 'tint' },
      { s: 'box', d: [1.0, 0.03, 0.03], at: [0, 0.8, -0.3], c: 'tint' },
      { s: 'box', d: [0.03, 0.03, 0.6], at: [0.5, 0.8, 0], c: 'tint', mirror: true },
      // Bottom rails
      { s: 'box', d: [1.0, 0.03, 0.03], at: [0, 0.015, 0.3], c: 'tint' },
      { s: 'box', d: [1.0, 0.03, 0.03], at: [0, 0.015, -0.3], c: 'tint' },
      { s: 'box', d: [0.03, 0.03, 0.6], at: [0.5, 0.015, 0], c: 'tint', mirror: true },
      // Wire mesh on the back
      { s: 'box', d: [1.0, 0.8, 0.005], at: [0, 0.4, -0.3], c: 'iron', alpha: 0.35 },
      // Three balls on the floor of the cage, seam rings in black
      { s: 'ball', d: [0.12], at: [-0.25, 0.12, 0.05], c: 'orange', seg: 8 },
      { s: 'ring', d: [0.121, 0.006], at: [-0.25, 0.12, 0.05], rot: [90, 0, 0], c: 'black', seg: 8 },
      { s: 'ring', d: [0.121, 0.006], at: [-0.25, 0.12, 0.05], rot: [0, 90, 0], c: 'black', seg: 8 },
      { s: 'ball', d: [0.12], at: [0.1, 0.12, -0.1], c: 'orange', seg: 8 },
      { s: 'ring', d: [0.121, 0.006], at: [0.1, 0.12, -0.1], rot: [90, 0, 0], c: 'black', seg: 8 },
      { s: 'ring', d: [0.121, 0.006], at: [0.1, 0.12, -0.1], rot: [0, 90, 0], c: 'black', seg: 8 },
      { s: 'ball', d: [0.12], at: [0.3, 0.12, 0.15], c: 'orange', seg: 8 },
      { s: 'ring', d: [0.121, 0.006], at: [0.3, 0.12, 0.15], rot: [90, 0, 0], c: 'black', seg: 8 },
      { s: 'ring', d: [0.121, 0.006], at: [0.3, 0.12, 0.15], rot: [0, 90, 0], c: 'black', seg: 8 },
      // Padlock hanging open on the front rail
      { s: 'box', d: [0.05, 0.06, 0.025], at: [0.4, 0.62, 0.32], c: 'iron' },
      { s: 'ring', d: [0.02, 0.005, 300], at: [0.4, 0.68, 0.32], c: 'iron', seg: 8 },
    ],
  },
  {
    id: 'old-court-bench',
    name: 'Old Court Bench',
    category: 'prop',
    uses: ['place', 'sit'],
    footprint: { r: 1.2, h: 0.8 },
    tags: ['bench', 'seat', 'wood', 'old', 'plaque', 'weathered', 'park', 'gta'],
    emoji: [],
    tint: 0x8f8c85,
    trim: 'brass',
    seat: [0, 0.47, 0.13],
    about: 'A long weathered plank bench with one brighter replaced plank, iron legs and grass tufts, and a brass plaque. Tint is the grey wood.',
    examine: [
      'A long grey bench of weathered planks, one bright new plank in the middle, iron legs and grass growing round its feet.',
      'The brass plaque is too worn to read. Every gnome who has tried has read a different name, and all of them were right.',
      'Older than the court, the fence and the argument about the court. It has outlasted all three and sees no reason to stop.',
      'Sit on the bright plank if you want to be noticed. Sit on the grey ones if you want to be ignored.',
      'The new plank went in during the last tidy of the Green. Gnomes still call it the new one, forty years on.',
    ],
    parts: [
      // Iron legs, sunk into the grass
      { s: 'box', d: [0.06, 0.44, 0.06], at: [1.1, 0.22, 0.22], c: 'iron-dark', mirror: true },
      // Back uprights, reaching the ground
      { s: 'box', d: [0.06, 0.82, 0.06], at: [1.1, 0.41, -0.24], c: 'iron-dark', mirror: true },
      // Seat planks: three grey, one replaced in brighter wood
      { s: 'box', d: [2.4, 0.04, 0.11], at: [0, 0.45, -0.13], c: 'tint' },
      { s: 'box', d: [2.4, 0.04, 0.11], at: [0, 0.45, 0], c: 'tint' },
      { s: 'box', d: [2.4, 0.04, 0.11], at: [0, 0.45, 0.13], c: 'wood-light' },
      // Backrest planks
      { s: 'box', d: [2.4, 0.1, 0.04], at: [0, 0.6, -0.24], c: 'tint' },
      { s: 'box', d: [2.4, 0.1, 0.04], at: [0, 0.76, -0.24], c: 'tint' },
      // Brass plaque on the front of the seat
      { s: 'box', d: [0.2, 0.06, 0.01], at: [0, 0.45, 0.195], c: 'brass' },
      // Grass tufts round the legs
      { s: 'cone', d: [0.07, 0.12], at: [1.25, 0.06, 0.35], c: 'leaf', seg: 6, mirror: true },
      { s: 'cone', d: [0.07, 0.12], at: [1.25, 0.06, -0.35], c: 'grass', seg: 6, mirror: true },
      { s: 'cone', d: [0.07, 0.12], at: [0, 0.06, 0.45], c: 'leaf', seg: 6 },
    ],
  },
  {
    id: 'lost-ball-drain',
    name: 'Lost Ball Drain',
    category: 'prop',
    uses: ['place'],
    tags: ['drain', 'grate', 'ball', 'basketball', 'street', 'iron', 'gta'],
    emoji: [],
    tint: 'orange',
    about: 'A square street drain grate in a short block, with an orange ball wedged halfway down so only its top third shows.',
    examine: [
      'A square iron grate set in a short block, with an orange ball wedged halfway down so only its top third shows.',
      'It is said that whatever goes down the drain is never seen again. The ball is seen every day, which is some comfort.',
      'Do not try to pull the ball out. It has been there since before the court and is now load-bearing.',
      'A dry tip: a ball in a grate has no owner, and nobody has ever claimed a ball from a grate. Not once.',
      'Someone scratched a small arrow pointing at the ball. Nobody has ever said what it means.',
    ],
    parts: [
      // Sump block the grate sits on
      { s: 'box', d: [0.6, 0.13, 0.6], at: [0, 0.065, 0], c: 'stone-dark' },
      // Grate plate and its slots
      { s: 'box', d: [0.6, 0.03, 0.6], at: [0, 0.143, 0], c: 'iron-dark' },
      { s: 'box', d: [0.45, 0.01, 0.03], at: [0, 0.158, -0.18], c: 'black' },
      { s: 'box', d: [0.45, 0.01, 0.03], at: [0, 0.158, 0], c: 'black' },
      { s: 'box', d: [0.45, 0.01, 0.03], at: [0, 0.158, 0.18], c: 'black' },
      // The ball, wedged half-down through the grate
      { s: 'ball', d: [0.12], at: [0.1, 0.12, 0], c: 'orange', seg: 8 },
      { s: 'ring', d: [0.121, 0.006], at: [0.1, 0.12, 0], rot: [90, 0, 0], c: 'black', seg: 8 },
    ],
  },
  {
    id: 'court-rules-sign',
    name: 'Court Rules Sign',
    category: 'prop',
    uses: ['place'],
    footprint: { r: 0.2, h: 1.6 },
    tags: ['sign', 'rules', 'board', 'post', 'court', 'paint', 'gta'],
    emoji: [],
    tint: 'cloth',
    about: 'A hand-painted board on a post with the court rules as dark text lines, one line crossed out in red. Tint is the board.',
    examine: [
      'A hand-painted board on a post, the court rules in dark letters, and one line crossed out in red.',
      'Rule one: no shoving. Rule two: see rule one. Rule three was crossed out after a small incident in the spring.',
      'The crossed-out line used to be the only one anyone read. The new rules are longer, and nobody is reading them.',
      'Painted by a gnome with very steady hands and very strong opinions about the baseline.',
      'Pick any line on the board and you will find it is the one you broke yesterday.',
    ],
    parts: [
      { s: 'cyl', d: [0.03, 0.03, 1.6], at: [0, 0.8, 0], c: 'wood-dark', seg: 6 },
      { s: 'box', d: [1.0, 0.6, 0.04], at: [0, 1.3, 0.04], c: 'tint' },
      { s: 'box', d: [0.8, 0.02, 0.01], at: [0, 1.5, 0.07], c: 'ink' },
      { s: 'box', d: [0.8, 0.02, 0.01], at: [0, 1.42, 0.07], c: 'ink' },
      { s: 'box', d: [0.8, 0.02, 0.01], at: [0, 1.34, 0.07], c: 'ink' },
      { s: 'box', d: [0.8, 0.02, 0.01], at: [0, 1.26, 0.07], c: 'ink' },
      { s: 'box', d: [0.8, 0.02, 0.01], at: [0, 1.18, 0.07], c: 'ink' },
      { s: 'box', d: [0.8, 0.02, 0.01], at: [0, 1.1, 0.07], c: 'ink' },
      // The crossed-out line
      { s: 'box', d: [0.82, 0.012, 0.01], at: [0, 1.34, 0.08], rot: [0, 0, -3], c: 'red' },
    ],
  },
  {
    id: 'laundrette-sign',
    name: 'Laundrette Sign',
    category: 'prop',
    uses: ['place'],
    footprint: { r: 0.2, h: 1.8 },
    tags: ['sign', 'laundrette', 'laundry', 'bubbles', 'shop', 'board', 'gta'],
    emoji: [],
    tint: 'blue',
    about: 'A small blue shop board on a post and a bent bracket, with a cluster of white bubbles for the lettering of Lather & Lint. Tint is the board.',
    examine: [
      'A blue board on a bent bracket, with a cluster of white bubbles where the lettering should be.',
      'Lather & Lint: wash your coat, dry your hat, and leave with a shine nobody asked for.',
      'The bubbles are not soap. They are what is left after someone rinsed a sock at the Spigot and walked off.',
      'Open from dawn until the bell is rung, which is usually whenever the proprietor wakes up.',
      'A small tip: a clean gnome is a suspicious gnome, so keep your hat on near the dryers.',
    ],
    parts: [
      { s: 'cyl', d: [0.035, 0.035, 1.7], at: [0, 0.85, -0.06], c: 'iron-dark', seg: 8 },
      // Bent bracket: an arm out from the post and a brace under it
      { s: 'box', d: [0.04, 0.04, 0.18], at: [0, 1.3, -0.01], c: 'iron-dark' },
      { s: 'box', d: [0.03, 0.25, 0.03], at: [0, 1.15, -0.03], rot: [25, 0, 0], c: 'iron-dark' },
      // Blue board
      { s: 'box', d: [1.2, 0.4, 0.04], at: [0, 1.5, 0.1], c: 'tint' },
      // White bubble cluster for the lettering
      { s: 'ball', d: [0.05], at: [-0.35, 1.62, 0.14], c: 'white', seg: 6 },
      { s: 'ball', d: [0.05], at: [-0.25, 1.66, 0.14], c: 'white', seg: 6 },
      { s: 'ball', d: [0.05], at: [-0.3, 1.56, 0.14], c: 'white', seg: 6 },
      { s: 'ball', d: [0.04], at: [-0.18, 1.6, 0.14], c: 'white', seg: 6 },
    ],
  },
];
