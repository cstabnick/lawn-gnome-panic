// Achievement cosmetics (head slot): one new item per achievement that used to share a prefab. See docs/cosmetics.md.
import type { PrefabDef } from '../types';

export const COSMETICS_HEAD_B: PrefabDef[] = [
  {
    id: 'brick-beret', name: 'Brick Beret', category: 'armor', uses: ['wear-head'],
    tags: ['beret', 'brick', 'hat', 'cap', 'head', 'reward'], emoji: [],
    about: 'Gnome Snigms: the Brick Beret, a flat rust-red beret with a small brick stud pinned to the side. Plain colours, no tint.',
    examine: [
      'A flat rust-red beret with a little brick stud pinned to the side, the way a mason signs a finished wall.',
      'Snigms saying: every wall is just bricks that agreed to stay together. The beret is the reminder.',
      'Tip: wear it level and nobody will ask about the mortar on your boots.',
      'Joke: a gnome who builds one wall will tell you about it for the rest of the season.',
      'Inside the rim someone pressed a row of tiny thumbprints, one per brick, and counted them twice.',
    ],
    parts: [
      { s: 'ball', d: [0.15], at: [0, 0.045, 0], scale: [1, 0.3, 1], c: 'rust', seg: 10 },
      { s: 'cyl', d: [0.012, 0.012, 0.02], at: [0, 0.09, 0], c: 'rust', seg: 6 },
      { s: 'box', d: [0.05, 0.03, 0.035], at: [0.13, 0.035, 0.04], c: 'clay' },
      { s: 'box', d: [0.05, 0.03, 0.035], at: [0.13, 0.065, 0.04], c: 'clay' },
      { s: 'box', d: [0.052, 0.006, 0.038], at: [0.13, 0.05, 0.04], c: 'chalk' },
    ],
  },
  {
    id: 'megaphone-cap', name: 'Megaphone Cap', category: 'armor', uses: ['wear-head'],
    tags: ['megaphone', 'cap', 'hat', 'brass', 'peak', 'head', 'reward'], emoji: [],
    about: 'Once in a Gnomillion: the Megaphone Cap, a round peaked cap with a tiny brass megaphone clipped to the front of the band. Plain colours, no tint.',
    examine: [
      'A round peaked cap with a tiny brass megaphone clipped to the band. It is loud before the wearer opens their mouth.',
      'Saying: one voice in a Gnomillion room is a whisper. Three rounds of one voice is a gnome who will not stop.',
      'Tip: speak into the megaphone from the side, or the quiz host will hear you from three rooms away.',
      'Joke: the megaphone has never once been used to make an announcement. It has been used to ask for the salt.',
      'The brass is polished so often that its stamped letters have worn away. Only the gnome knows what they said.',
    ],
    parts: [
      { s: 'ball', d: [0.15], at: [0, 0.1125, 0], scale: [1, 0.75, 1], c: 'slate', seg: 10 },
      { s: 'cyl', d: [0.152, 0.155, 0.03], at: [0, 0.04, 0], c: 'black', seg: 10 },
      { s: 'box', d: [0.18, 0.01, 0.1], at: [0, 0.03, 0.14], c: 'slate' },
      { s: 'cone', d: [0.035, 0.1], at: [0, 0.08, 0.13], rot: [-90, 0, 0], c: 'brass', seg: 8 },
      { s: 'ring', d: [0.035, 0.006], at: [0, 0.08, 0.18], c: 'brass', seg: 8 },
      { s: 'box', d: [0.03, 0.02, 0.02], at: [0, 0.05, 0.155], c: 'brass' },
    ],
  },
  {
    id: 'foreman-hard-hat', name: "Foreman's Hard Hat", category: 'armor', uses: ['wear-head'],
    tags: ['hard', 'hat', 'helmet', 'foreman', 'head', 'reward'], emoji: [],
    about: 'Gnome Snigms: the Foreman\'s Hard Hat, a white dome with a wide brim and a gold stripe round the crown. Plain colours, no tint.',
    examine: [
      'A white dome with a wide brim and a gold stripe round the crown. It came from the site office, which is a crate with a door.',
      'Saying: the hat goes on at the bottom of the ladder and comes off at the top. Be sure which end you are on.',
      'Tip: knock on it before you climb anything. A hollow sound means the dome is empty, and the foreman will be pleased.',
      'Joke: a gnome in a hard hat is still not allowed to be the boss. The hat only gets the ladder started.',
      'The gold stripe was added after the promotion, so new gnomes are told it is for seniority and nothing else.',
    ],
    parts: [
      { s: 'ring', d: [0.2, 0.02], at: [0, 0.02, 0], rot: [90, 0, 0], c: 'white', seg: 12 },
      { s: 'ball', d: [0.14], at: [0, 0.1, 0], scale: [1, 0.72, 1], c: 'white', seg: 10 },
      { s: 'ring', d: [0.142, 0.012], at: [0, 0.06, 0], rot: [90, 0, 0], c: 'gold', seg: 12 },
      { s: 'box', d: [0.03, 0.03, 0.2], at: [0, 0.2, 0], c: 'white' },
    ],
  },
  {
    id: 'party-hat', name: 'Singed Party Hat', category: 'armor', uses: ['wear-head'],
    tags: ['party', 'hat', 'cone', 'paper', 'singed', 'head', 'reward'], emoji: [],
    about: 'Gnome Theft Auto: the Singed Party Hat, a tall striped cone with a burnt black tip and a few embers. Plain colours; the embers glow.',
    examine: [
      'A tall striped cone of folded paper, its tip scorched black, with a few embers still glowing on the red stripes.',
      'Gnome law: a party hat is worn at the cookout. A party hat that is still smoking is worn at the cookout with pride.',
      'Tip: keep it away from the grill. A hat that catches light is only a hat until somebody has to put it out.',
      'Joke: every guest at the barbecue was asked to bring one, and nobody remembers why the cone has to be so tall.',
      'Someone drew a tiny flame on the inside of the rim. It is the only part of the hat that did not get burnt.',
    ],
    parts: [
      { s: 'cyl', d: [0.15, 0.15, 0.04], at: [0, 0.02, 0], c: 'yellow', seg: 12 },
      { s: 'cone', d: [0.14, 0.4], at: [0, 0.24, 0], c: 'red', seg: 12 },
      { s: 'cyl', d: [0.092, 0.092, 0.04], at: [0, 0.2, 0], c: 'yellow', seg: 12 },
      { s: 'cyl', d: [0.058, 0.058, 0.04], at: [0, 0.3, 0], c: 'yellow', seg: 12 },
      { s: 'cone', d: [0.04, 0.1], at: [0, 0.39, 0], c: 'black', seg: 8 },
      { s: 'ball', d: [0.018], at: [0.1, 0.1, 0.06], c: 'flame', glow: true, seg: 6 },
      { s: 'ball', d: [0.018], at: [0.04, 0.25, 0.056], c: 'flame', glow: true, seg: 6 },
      { s: 'ball', d: [0.018], at: [-0.08, 0.16, 0.05], c: 'flame', glow: true, seg: 6 },
    ],
  },
  {
    id: 'letter-crown', name: 'Letter Crown', category: 'armor', uses: ['wear-head'],
    tags: ['letter', 'crown', 'tile', 'band', 'word', 'head', 'reward'], emoji: [],
    about: 'Wordle: the Letter Crown, a dark band with five cream letter tiles spelling G N O M E round the front of the head. Plain colours, no tint.',
    examine: [
      'A band of five cream letter tiles spelling G N O M E, set round the head. The letters are cut into the tiles, not painted.',
      'Saying: the gnome who guesses the word on the first try wears the crown, and gnomes never give the word away.',
      'Tip: the tiles only spell it while the gnome stands up straight. Lean forward and they read GNOEM, which is a different thing.',
      'Joke: the tiles were cut from a board game that nobody finished. The rest of the letters are still in the box.',
      'The O has a tiny chip out of its top. Every gnome agrees it was there from the start.',
    ],
    parts: [
      { s: 'cyl', d: [0.16, 0.16, 0.05], at: [0, 0.025, 0], c: 'leather-dark', seg: 12 },
      { s: 'box', d: [0.05, 0.05, 0.012], at: [-0.14289, 0.06, 0.0825], rot: [0, -60, 0], c: 'paper' },
      { s: 'ring', d: [0.012, 0.004], at: [-0.14978, 0.06, 0.0865], rot: [0, -60, 0], c: 'ink', seg: 6 },
      { s: 'box', d: [0.05, 0.05, 0.012], at: [-0.0825, 0.06, 0.14289], rot: [0, -30, 0], c: 'paper' },
      { s: 'box', d: [0.028, 0.032, 0.004], at: [-0.0865, 0.06, 0.14978], rot: [0, -30, 0], c: 'ink' },
      { s: 'box', d: [0.05, 0.05, 0.012], at: [0, 0.06, 0.165], c: 'paper' },
      { s: 'ring', d: [0.012, 0.004], at: [0, 0.06, 0.173], c: 'ink', seg: 6 },
      { s: 'box', d: [0.05, 0.05, 0.012], at: [0.0825, 0.06, 0.14289], rot: [0, 30, 0], c: 'paper' },
      { s: 'box', d: [0.028, 0.032, 0.004], at: [0.0865, 0.06, 0.14978], rot: [0, 30, 0], c: 'ink' },
      { s: 'box', d: [0.05, 0.05, 0.012], at: [0.14289, 0.06, 0.0825], rot: [0, 60, 0], c: 'paper' },
      { s: 'box', d: [0.028, 0.032, 0.004], at: [0.14978, 0.06, 0.0865], rot: [0, 60, 0], c: 'ink' },
    ],
  },
  {
    id: 'fellowship-cap', name: 'Fellowship Cap', category: 'armor', uses: ['wear-head'],
    tags: ['cap', 'fellowship', 'road', 'friend', 'pin', 'hat', 'head', 'reward'], emoji: [],
    about: 'Road Friends: a flat leaf-green cap with a bark band round the brim and a small clay pin on the front. Plain colours, no tint.',
    examine: [
      'A flat leaf-green cap with a bark band round the brim and a small clay pin on the front, one edge already chipped.',
      'Saying from the Planting: a friend who walks beside you is worth two who walk ahead and one who waits at the gate.',
      'Tip: wear it level, and the pin is the first thing a companion sees when you come down the road towards them.',
      'Joke: the pin is for the friend who swore they would be right behind you, and that friend is still at the Hearth.',
      'Somebody has scratched a row of tiny tally marks inside the band, one for every walk taken in company.',
    ],
    parts: [
      { s: 'ball', d: [0.15], at: [0, 0.045, 0], scale: [1, 0.3, 1], c: 'leaf', seg: 10 },
      { s: 'ring', d: [0.152, 0.012], at: [0, 0.02, 0], rot: [90, 0, 0], c: 'bark', seg: 10 },
      { s: 'cyl', d: [0.012, 0.012, 0.02], at: [0, 0.09, 0], c: 'leaf', seg: 6 },
      { s: 'ball', d: [0.016], at: [0, 0.075, 0.1], c: 'clay', seg: 6 },
    ],
  },
  {
    id: 'horn-blower-cap', name: 'Horn-Blower Cap', category: 'armor', uses: ['wear-head'],
    tags: ['horn', 'cap', 'blower', 'raid', 'hat', 'head', 'reward', 'leather'], emoji: [],
    about: 'Answer the Horn: a dark leather cap with a brass horn-cup set on the front, angled up and forward. Achievement reward for Answer the Horn.',
    examine: [
      'A dark leather cap with a small brass horn-cup set on the front, angled up and forward as if it has just been blown.',
      'Saying from the Keep: one blast and they come running, and the cap is the first thing they see coming up the hill.',
      'Tip: blow the horn through the cup, not at it. A gnome who blows at the horn gets the horn in his face, and nobody comes.',
      'Joke: the brass cup is polished so often that a passing Wayfarer once tried to drink from it, and was disappointed.',
      'The leather is stitched with a row of tiny marks, one for each horn that has been answered while this cap was on.',
    ],
    parts: [
      { s: 'ball', d: [0.15], at: [0, 0.045, 0], scale: [1, 0.3, 1], c: 'leather', seg: 10 },
      { s: 'ring', d: [0.152, 0.012], at: [0, 0.02, 0], rot: [90, 0, 0], c: 'leather-dark', seg: 10 },
      { s: 'cone', d: [0.03, 0.14], at: [0, 0.09, 0.1], rot: [60, 0, 0], c: 'brass', seg: 8 },
    ],
  },
  {
    id: 'five-horn-circlet', name: 'Five-Horn Circlet', category: 'armor', uses: ['wear-head'],
    tags: ['horn', 'circlet', 'crown', 'five', 'brass', 'raid', 'head', 'reward'], emoji: [],
    about: 'Every Horn in Fescue: a brass circlet with five bone horns standing round it. Rare: only the achievement grants it.',
    examine: [
      'A brass circlet with five small bone horns standing round it, one for each horn post on the map.',
      'Saying from the Reeves: five horns for five posts, and the Wayfarers still argue about which one was blown first.',
      'Tip: wear it over a cap, not on the bare head, unless you enjoy brass pressed against the skull.',
      'Joke: the smith was promised a sixth horn for the set and never got one, so the back of the circlet is still a little bare.',
      'Each horn has been blown at least once, and the dents in the brass show which posts were blown hardest.',
    ],
    parts: [
      { s: 'ring', d: [0.12, 0.012], at: [0, 0.012, 0], rot: [90, 0, 0], c: 'brass', seg: 12 },
      { s: 'cone', d: [0.016, 0.09], at: [0, 0.064, 0.12], c: 'bone', seg: 5 },
      { s: 'cone', d: [0.016, 0.09], at: [0.114, 0.064, 0.037], c: 'bone', seg: 5 },
      { s: 'cone', d: [0.016, 0.09], at: [0.0706, 0.064, -0.097], c: 'bone', seg: 5 },
      { s: 'cone', d: [0.016, 0.09], at: [-0.0706, 0.064, -0.097], c: 'bone', seg: 5 },
      { s: 'cone', d: [0.016, 0.09], at: [-0.114, 0.064, 0.037], c: 'bone', seg: 5 },
    ],
  },
  {
    id: 'snowcap-tuque', name: 'Snowcap Tuque', category: 'armor', uses: ['wear-head'],
    tags: ['wool', 'knit', 'hat', 'tuque', 'snow', 'highland', 'snowcap', 'head', 'reward'], emoji: [],
    about: 'A thick rolled-brim knitted hat in red and white bands with a fat bobble, for the cold of Snowcap Rise.',
    examine: [
      'A knitted hat with a rolled brim, red and white bands round the crown and a fat white bobble on top.',
      'Saying: past the last cairn it is all Rise. Wear two hats, and make one of them this one.',
      'Tip: pull the brim down over the ears before the wind finds them; the wind on the Rise always finds them.',
      'Joke: the bobble has been up Snowdrop Slope more times than the rope tow.',
      'Knitted from the wool of a sheep nobody on the Rise admits to owning.',
    ],
    parts: [
      { s: 'ball', d: [0.135], at: [0, 0.075, 0], scale: [1, 0.75, 1], c: 'red', seg: 10 },
      { s: 'ring', d: [0.135, 0.018], at: [0, 0.03, 0], rot: [90, 0, 0], c: 'wool', seg: 12 },
      { s: 'ring', d: [0.12, 0.008], at: [0, 0.09, 0], rot: [90, 0, 0], c: 'white', seg: 12 },
      { s: 'ball', d: [0.035], at: [0, 0.18, 0], c: 'white', seg: 8 },
    ],
  },
  {
    id: 'saltbucket-boater', name: 'Saltbucket Boater', category: 'armor', uses: ['wear-head'],
    tags: ['straw', 'boater', 'hat', 'seaside', 'beach', 'saltbucket', 'shore', 'head', 'reward'], emoji: [],
    about: 'A flat-topped straw boater with a sapphire band, the summer hat of Saltbucket Shore.',
    examine: [
      'A flat-topped straw boater with a stiff wide brim and a sapphire ribbon band round the crown.',
      'Saying: a gnome in a boater has seen the Saltwater, and will tell you about it.',
      'Tip: hold the brim on the pier; Long Spoon Pier has taken more boaters than the sea has.',
      'Joke: the band is blue so the gulls think it is sky, and the gulls are still thinking about it.',
      'The straw is pressed flat with a hot flat-iron; the dent in the side is from the Spokewheel.',
    ],
    parts: [
      { s: 'cyl', d: [0.15, 0.15, 0.012], at: [0, 0.01, 0], c: 'straw', seg: 14 },
      { s: 'cyl', d: [0.1, 0.1, 0.06], at: [0, 0.046, 0], c: 'straw', seg: 12 },
      { s: 'cyl', d: [0.102, 0.102, 0.016], at: [0, 0.03, 0], c: 'sapphire', seg: 12 },
    ],
  },
  {
    id: 'rootwell-mortarboard', name: 'Rootwell Mortarboard', category: 'armor', uses: ['wear-head'],
    tags: ['mortarboard', 'cap', 'hat', 'university', 'scholar', 'rootwell', 'campus', 'head', 'reward'], emoji: [],
    about: 'A square black mortarboard with a gold tassel, as worn by Rootwell University on degree day.',
    examine: [
      'A black skull cap with a flat square board on top and a gold tassel hanging from the button.',
      'Saying: the tassel goes left after the degree, and right again the moment the dean is not looking.',
      'Tip: never throw it in the air under the Anthill; the ants keep what lands.',
      'Joke: the board is square so a gnome can balance a cup of tea on it during long lectures.',
      'Every Rootwell graduate gets one, and every Rootwell graduate claims theirs is the original.',
    ],
    parts: [
      { s: 'ball', d: [0.12], at: [0, 0.05, 0], scale: [1, 0.55, 1], c: 'black', seg: 10 },
      { s: 'box', d: [0.26, 0.012, 0.26], at: [0, 0.11, 0], rot: [0, 45, 0], c: 'black' },
      { s: 'ball', d: [0.012], at: [0, 0.12, 0], c: 'gold', seg: 6 },
      { s: 'box', d: [0.008, 0.07, 0.008], at: [0.08, 0.08, 0.08], c: 'gold' },
    ],
  },
  {
    id: 'tea-cosy-hat', name: 'Tea-Cosy Hat', category: 'armor', uses: ['wear-head'],
    tags: ['tea', 'cosy', 'cozy', 'knit', 'hat', 'pompom', 'kettle', 'head', 'reward'], emoji: [],
    tint: 'green',
    about: 'Home Sweet Hovel: the Tea-Cosy Hat, a squat knitted dome with a pompom on top and a spout-hole flap at the side. The knit takes a tint. Achievement reward for Home Sweet Hovel.',
    examine: [
      'A squat knitted dome, the shape of a warm pot, with a fat pompom on top and a little flap at the side for the spout.',
      'Saying of the Hovel: the kettle goes on first, and the cosy goes on the gnome, because someone has to stay warm while it brews.',
      'Tip: the spout flap is for the spout. Pop the spout through and the tea comes out where the tea should come out.',
      'Joke: a gnome in a tea cosy is still the one who gets offered the biscuit, because nobody can see where the tea went.',
      'The pompom has been replaced twice. Each new one is a little more orange than the one before, and nobody has said why.',
    ],
    parts: [
      { s: 'ball', d: [0.14], at: [0, 0.1, 0], scale: [1, 0.72, 1], c: 'tint', seg: 10 },
      { s: 'ring', d: [0.14, 0.02], at: [0, 0.03, 0], rot: [90, 0, 0], c: 'tint', seg: 12 },
      { s: 'box', d: [0.05, 0.04, 0.02], at: [0.13, 0.1, 0], c: 'wool' },
      { s: 'ball', d: [0.035], at: [0, 0.2, 0], c: 'wool', seg: 8 },
    ],
  },
  {
    id: 'propeller-beanie', name: 'Propeller Beanie', category: 'armor', uses: ['wear-head'],
    tags: ['propeller', 'beanie', 'cap', 'hat', 'aircraft', 'roof', 'knit', 'head', 'reward'], emoji: [],
    tint: 'blue',
    about: 'Roof Rat: the Propeller Beanie, a small knitted beanie with a stalk and a two-blade propeller on top. The cap takes a tint. Achievement reward for Roof Rat.',
    examine: [
      'A small knitted beanie with a stalk on top and a two-blade wooden propeller bolted to the stalk, ready to spin.',
      'Saying of the Rooftops: the cap goes on before the flight and the propeller goes round before the landing. Neither is optional.',
      'Tip: keep your head down when the blades are turning. A propeller does not know whose hat it is.',
      'Joke: the propeller has never once lifted a gnome off the ground. It has, however, lifted several gnomes\' opinions of the roof.',
      'The blades are carved with the names of every aircraft that landed on a roof and lived to talk about it.',
    ],
    parts: [
      { s: 'ball', d: [0.14], at: [0, 0.07, 0], scale: [1, 0.7, 1], c: 'tint', seg: 10 },
      { s: 'ring', d: [0.145, 0.014], at: [0, 0.02, 0], rot: [90, 0, 0], c: 'white', seg: 12 },
      { s: 'cyl', d: [0.01, 0.01, 0.05], at: [0, 0.19, 0], c: 'iron', seg: 6 },
      { s: 'box', d: [0.22, 0.012, 0.03], at: [0, 0.23, 0], c: 'wood' },
      { s: 'ball', d: [0.02], at: [0, 0.23, 0], c: 'iron', seg: 6 },
    ],
  },
  {
    id: 'hedge-hopper-cap', name: 'Hedge-Hopper Cap', category: 'armor', uses: ['wear-head'],
    tags: ['hedge', 'hopper', 'cap', 'hat', 'leaf', 'leafy', 'bird', 'flap', 'gnomlet', 'head', 'reward'], emoji: [],
    about: 'Flappy Gnome: a little leafy cap with a tiny bird perched on top. Achievement reward for Flappy Gnome.',
    examine: [
      'A small cap of overlapping leaves, dark and light, with a tiny round bird perched on the crown.',
      'Saying of the Hedge: the gap is always a little smaller than the gnome, and a little bigger than the excuse.',
      'Tip: do not tap faster than the bird flaps. It has opinions about tempo.',
      'Joke: the bird has never once moved. It is the only thing in the garden that has stayed this calm near a hedge.',
      'The leaves are trimmed square on the left and round on the right, because the hedge never could decide.',
    ],
    parts: [
      { s: 'ball', d: [0.15], at: [0, 0.07, 0], scale: [1, 0.55, 1], c: 'leaf-dark', seg: 10 },
      { s: 'ball', d: [0.05], at: [0.07, 0.11, 0.03], c: 'leaf', seg: 6 },
      { s: 'ball', d: [0.05], at: [-0.06, 0.12, -0.03], c: 'leaf', seg: 6 },
      { s: 'ball', d: [0.06], at: [0, 0.15, 0], c: 'white', seg: 8 },
      { s: 'ball', d: [0.035], at: [0, 0.2, 0.03], c: 'white', seg: 8 },
      { s: 'cone', d: [0.012, 0.03], at: [0, 0.2, 0.07], rot: [90, 0, 0], c: 'gold', seg: 5 },
    ],
  },
  {
    id: 'hoa-traffic-hat', name: 'HOA Traffic Hat', category: 'armor', uses: ['wear-head'],
    tags: ['hat', 'traffic', 'warden', 'hoa', 'whistle', 'stripes', 'peak', 'head', 'reward', 'pardonlin'], emoji: [],
    about: 'A tall warden\'s hat in white and HOA green stripes, with a peak and a little brass whistle on a cord, for the traffic gnomes of Pardonlin.',
    examine: [
      'A tall hat with white and green bands round the crown, a short stiff peak at the front and a whistle on a cord.',
      'Saying: the warden blows the whistle, and the traffic stops. Nobody ever checks whether the whistle was working.',
      'Tip: wear the peak forward and nobody can see where you are looking, which is the whole point of a warden.',
      'Joke: the whistle has never made a sound, but three hundred gnomes have stopped walking when it was pointed at them.',
      'The stripes are white for the road and green for the hedge, and the hat is green on the inside for the same reason.',
    ],
    parts: [
      { s: 'cyl', d: [0.14, 0.15, 0.3], at: [0, 0.15, 0], c: 'green', seg: 10 },                // crown
      { s: 'cyl', d: [0.152, 0.152, 0.04], at: [0, 0.07, 0], c: 'white', seg: 10 },             // white bands
      { s: 'cyl', d: [0.152, 0.152, 0.04], at: [0, 0.21, 0], c: 'white', seg: 10 },
      { s: 'box', d: [0.28, 0.02, 0.14], at: [0, 0.03, 0.2], c: 'leaf-dark' },                  // peak
      { s: 'box', d: [0.01, 0.12, 0.01], at: [0.16, 0.17, 0.02], c: 'black' },                 // cord
      { s: 'cyl', d: [0.02, 0.02, 0.07], at: [0.2, 0.12, 0.02], rot: [0, 0, 90], c: 'silver', seg: 6 }, // whistle
    ],
  },
  {
    id: 'pardonlin-beret', name: 'Pardonlin Beret', category: 'armor', uses: ['wear-head'],
    tags: ['beret', 'hat', 'cap', 'pardonlin', 'continental', 'stalk', 'ribbon', 'head', 'reward'], emoji: [],
    about: 'A floppy navy beret with a tiny stalk on top and a black ribbon round the band, as worn in the cafes of Pardonlin.',
    examine: [
      'A floppy round beret, dark blue and slightly lopsided, with a tiny stalk on top and a black ribbon round the band.',
      'Saying: a beret is worn to the left in Pardonlin and to the right in the next town, which is why nobody travels there.',
      'Tip: tilt it forward to look thoughtful. The gnomes of the Rive Gauche tilt theirs backwards to look hungry.',
      'Joke: the stalk on top is for a flower, but the flower was eaten by a visiting goat in the first week.',
      'The beret is made to fit a head that is never quite the same size, which is the secret of every good Pardonlin hat.',
    ],
    parts: [
      { s: 'cyl', d: [0.2, 0.21, 0.1], at: [0, 0.05, 0], c: 'blue', seg: 12 },                  // floppy disc
      { s: 'ring', d: [0.2, 0.012], at: [0, 0.03, 0], rot: [90, 0, 0], c: 'black', seg: 12 },   // ribbon
      { s: 'cyl', d: [0.012, 0.012, 0.04], at: [0, 0.12, 0], c: 'wool', seg: 6 },              // tiny stalk
    ],
  },
  {
    id: 'meadow-crown', name: 'Meadow Crown', category: 'armor', uses: ['wear-head'],
    tags: ['crown', 'grass', 'flowers', 'wildflower', 'meadow', 'unmown', 'head', 'reward', 'preserve'], emoji: [],
    about: 'A crown of woven grass blades and three wildflowers, picked from the Unmown.',
    examine: [
      'A ring of woven grass blades, standing up in five points, with a bright wildflower on three of them.',
      'Saying: the meadow crowns its own, and it crowns them very slowly, over the course of one whole summer.',
      'Tip: keep the crown damp, or the grass goes brittle and sheds on the first gnome who sits down.',
      'Joke: the flowers are the first ones a passing bee tries to visit, and the crown is the second.',
      'Whoever wears it is said to be the Unmown\'s favourite, which the Unmown has never confirmed or denied in writing.',
    ],
    parts: [
      { s: 'ring', d: [0.14, 0.025], at: [0, 0.03, 0], rot: [90, 0, 0], c: 'grass', seg: 12 },   // woven band
      { s: 'cone', d: [0.03, 0.12], at: [0, 0.09, 0.14], c: 'grass', seg: 6 },                  // grass points
      { s: 'cone', d: [0.03, 0.12], at: [0.133, 0.09, 0.043], c: 'grass', seg: 6 },
      { s: 'cone', d: [0.03, 0.12], at: [0.082, 0.09, -0.113], c: 'grass', seg: 6 },
      { s: 'cone', d: [0.03, 0.12], at: [-0.082, 0.09, -0.113], c: 'grass', seg: 6 },
      { s: 'cone', d: [0.03, 0.12], at: [-0.133, 0.09, 0.043], c: 'grass', seg: 6 },
      { s: 'ball', d: [0.03], at: [0, 0.16, 0.14], c: 'petal', seg: 6 },                        // wildflowers
      { s: 'ball', d: [0.03], at: [0.133, 0.16, 0.043], c: 'honey', seg: 6 },
      { s: 'ball', d: [0.03], at: [-0.082, 0.16, -0.113], c: 'purple', seg: 6 },
    ],
  },
];
