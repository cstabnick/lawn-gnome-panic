import type { PhotoGrade, PhotoRecord } from './types';

/**
 * Everything Gnome Jesus says. To give a Gnomokemon its own lines, add (or extend) its entry in SPECIES_LINES: the
 * key is the dex id (`sproutling`, `kilnpup`, ...). Players can add more from the Gnomokedex ("Gnome Jesus says"),
 * which are kept in localStorage and mixed in with these.
 */

/** Blackjack's deep voices run 70..140 Hz (Old Gnick 74, Grumbo 70). Jesus is a slow, warm 84. */
export const JESUS_HZ = 84;

export const INTRO_LINES: readonly string[] = [
  'Ah, the photographer returns. Let us see what the Yard let you keep.',
  'Welcome back to the Lab. Please wipe your boots. Mud is not a grade.',
  'The film is in. The clay is cooling. The suspense is entirely my own.',
  'Sit. Pick your best shots. I will pretend not to judge you while judging you.',
  'Rejoice! Another roll of film has survived the dog.',
  'I have been waiting by the window. Fine, I was napping. Show me the photos.',
  'Let us review the evidence. Of the creatures, I mean. Not of your shaky hands.',
  'Bring me your finest. Bring me your second finest too, I am not picky, I am a gnome of the people.',
  'Yes, the Lab is on prime lawn. No, I will not discuss the mortgage. There is no mortgage.',
  'Welcome! Mind the gold trim. It is real. Most of it.',
  'I bought this whole plot outright, in clay. Anyway! Photographs!',
  'Another day, another lawn I could buy twice. Show me the photos.',
  'Another safari! The Tall Ones have crossword puzzles; we have this.',
  'Pick one shot per creature. Choose wisely, for I remember everything and forgive selectively.',
  'The darkroom is warm and the tea is cold. Let us begin.',
  'Hand me the camera. Gently. It has seen things.',
];

export const SUBMIT_LINES: readonly string[] = [
  'Into the developing tray they go. Do not breathe on them.',
  'Hmm. Hmm. Hmmmm. I am only making noises. It is a very professional noise.',
  'Let me find my spectacles. They are on my head. Of course they are on my head.',
  'The Scale of the Lawn has been oiled. It only squeaks when it is disappointed.',
  'Behold, as I weigh Size, Framing, Pose and the mysterious fifth thing: vibes.',
  'One moment, I must clear my throat of three thousand years of dust.',
  'Silence in the Lab. Even the dog. Especially the dog.',
  'Now, the sacred ritual of squinting at a rectangle.',
];

/** Said while the numbers tick up, before the grade lands. */
export const JUDGING_LINES: readonly string[] = [
  'Let us see... the Size...',
  'Ooh. Measuring the framing with a very small ruler.',
  'Is that a good pose, or is it just standing?',
  'Hold on, I am consulting my clay intuition.',
  'The Scale trembles. The Scale always trembles. It is a nervous Scale.',
  'I am not stalling. I am building tension.',
  'Counting the whiskers. Counting the whiskers.',
  'Mm. Mmm. Mmmmm. The professional noise returns.',
  'One does not rush a masterpiece. Or a mediocrity. Same pace for both.',
  'Appraising the shot. I know about appraising. I own a lot of things.',
  'Priceless, or merely expensive? I can afford to find out.',
  'The numbers are shy. Coax them.',
  'Is it in focus? It is in something.',
  'Let me adjust the lamp. The photograph insists.',
  'Weighing, weighing, weighing the lawn.',
  'A hush falls over the Yard. Mostly the dog panting.',
];

export const GRADE_LINES: Record<PhotoGrade, readonly string[]> = {
  Divine: [
    'Blessed be this glaze! Even the Tall Ones would hang it on the fridge.',
    'I have gone weak in the knees, and I do not have knees. Divine!',
    'A miracle! And I am qualified to say so. It is practically my job.',
    'Put this in a frame. Put the frame in a bigger frame. Call a priest. Call a better priest.',
    'This is the one. Three thousand years of mowing and we finally got a good photograph.',
    'The light, the pose, the framing: I am not crying, a petal landed in my eye.',
    'Heavens! If the Kiln could blush, it would.',
    'Magnificent. I may have to lie down on the nice rug.',
    'You have the Eye. Do not let it go to your head. Let it go to the gallery.',
    'Hallelujah, and also, wow. Divine.',
    'I would pay good money for this, and I have a great deal of good money.',
    'This goes over the fireplace, next to the other fireplace.',
    'I would trade my halo for this photograph. It is a very nice halo. That is how good this is.',
    'The Gnomokedex itself sat up straighter. Divine!',
    'Perfection! I feel the urge to compose a hymn. It will be four notes long and about moss.',
    'Frame it, sell it, or hide it so nobody can ever top you. Divine!',
  ],
  Gold: [
    'A righteous framing! My clay heart warms at such crisp composition.',
    'Gold! Handsome work. I would show this to the neighbours, if I had any.',
    'Very nice. If this were bread, I would eat it and ask for seconds.',
    'Solid, shiny, slightly smug: it is Gold, and so are you today.',
    'That is a photograph with confidence. I respect confidence. It is rare in clay.',
    'Almost divine, which is the polite way of saying, try harder next lap.',
    'Fine composition. The creature is practically asking for an autograph.',
    'Gold, my friend. Put it near the front of the clothesline.',
    'I like it. I like it a lot. Do not tell the Silver ones I said so.',
    'Crisp! Clean! Only slightly crooked, which gives it character.',
    'You have clearly been practising. Or the dog finally held still.',
    'Excellent. I give it a firm nod, the kind with eyebrow.',
    'This is what film is for. Not for the thumb photos. We do not speak of the thumb photos.',
    'Gold! The Scale hummed. It never hums.',
    'Worth its weight in gold, and I know exactly what gold weighs.',
  ],
  Silver: [
    'Fair and faithful work. Next time, coax them with a treat or the Flute!',
    'Silver. Respectable. The sort of photograph that gets a polite cough.',
    'It is a good photo of a creature. Could it be a great photo? Ask the dog.',
    'Not bad! Not bad at all. I have said nothing nicer to a Tuesday.',
    'The creature is clearly visible, which is the minimum, and you cleared it.',
    'Silver, like a spoon: useful, shiny, and easy to lose in the lawn.',
    'Closer next time, my friend. The creatures do not bite. Mostly.',
    'A fine effort. I would hang it in the hallway, near the draughts.',
    'Middling, in a warm and encouraging way.',
    'The framing wobbled, the pose dozed, and yet here we are. Silver!',
    'I am proud of you in a small, quiet, silver way.',
    'Half a step from Gold. Take that step. Gently. Do not trip the dog.',
    'It is a photograph. It is a good one. It is not THE photograph. Keep riding.',
    'Silver! The Scale shrugged, but kindly.',
    'Solid. I would not buy it, but I would not sell it either.',
  ],
  Bronze: [
    'A humble snapshot. Get closer, center the crosshairs, and catch them in motion!',
    'Bronze. A photograph that tried its best, which is the nicest thing I can say.',
    'Ah. A creature! Somewhere in there. I believe in you and also the creature.',
    'It is art. Modern art. Very modern. Possibly upside down.',
    'The creature is small. The lawn is large. The photographer is brave.',
    'I have seen sharper photographs from a sleeping badger. But I have not seen a badger try this hard.',
    'Bronze! Bold of you to submit this. I admire the nerve.',
    'Congratulations: you have discovered what not to do. Valuable research.',
    'The thumb is very well lit. The creature is a rumour.',
    'It is a start. Everything is a start until it is a finish.',
    'Hmm. Yes. Well. The dog was probably moving.',
    'Do not be sad. Even the Mower was jammed for three thousand years.',
    'Bronze. It will look wonderful in the Gallery as a before photo.',
    'I will frame it myself, out of pity and affection.',
    'I will pay you nothing for this, with love. Gold trim is not cheap.',
  ],
};

/** Said after a special bonus label shows up. Keys match the start of the label in scoring.ts. */
export const SPECIAL_LINES: Record<string, readonly string[]> = {
  'Snack Time': [
    'A creature, mid-snack! Even the divine respects a hungry gnome.',
    'Caught chewing. Unflattering, honest, and worth a bonus.',
    'Never interrupt a creature at lunch. Unless you have a camera.',
    'The bait works! I will take no questions about the bait.',
  ],
  Startled: [
    'A startled creature! Sorry, little one. Art demands it.',
    'That look of betrayal is museum quality.',
    'Pester Clods: ruining naps, improving photographs since last Tuesday.',
    'You flung a clod at an innocent. Anyway, the bonus is yours.',
  ],
  'Flute Dance': [
    'Dancing on film! The Gnome Flute strikes again.',
    'The flute, the dance, the bonus. A very small ballet.',
    'Beautiful. Someone tell the Kiln there is a party.',
    'I hereby declare it a jig, and jigs are worth points.',
  ],
  'Group Shot': [
    'A whole crowd in frame! You are practically a society photographer.',
    'Many creatures, one shutter. Efficient. Rude. I approve.',
    'The more the merrier, and also the more the points.',
    'A family portrait! Nobody blinked. Suspicious.',
  ],
  Bullseye: [
    'Dead centre! The crosshairs have never been so proud.',
    'Bullseye framing. Did you use a ruler? You used a ruler.',
    'Perfectly centred. The Scale sighed with relief.',
    'Right in the middle. Symmetry is next to gnomeliness.',
  ],
};

/** Said when a whole roll of film caught nothing. */
export const EMPTY_LINES: readonly string[] = [
  'An empty roll! A bold artistic statement about the nature of lawns.',
  'No creatures at all? The dog says he saw plenty. The dog is unreliable.',
  'Twenty-four photographs of grass. I admire the commitment.',
  'Well. The Yard is very beautiful. Next time, with creatures.',
  'You rode the whole way and caught nothing. That is either a skill or a talent.',
  'I will put it in the Gallery under: Landscapes, Disappointing.',
  'The film is fine. The film is innocent. Point it at things.',
  'Do not worry. Even I once photographed my own thumb for an hour.',
  'I would sell this roll of film, but even I cannot find a buyer.',
];

/** A closing line once every photo is graded, by the best grade of the roll. */
export const OUTRO_LINES: Record<PhotoGrade, readonly string[]> = {
  Divine: [
    'A Divine in the roll! Go forth and be insufferable. Politely.',
    'Today you touched greatness. Wash your hands, then ride again.',
    'The Gallery will make room. I will sweep a spot myself.',
    'Drinks are on me. Drinks are always on me. I am extremely rich.',
  ],
  Gold: [
    'A golden roll! The Tall Ones will never see it, and that is their loss.',
    'Handsome work all round. Tea is on me. The tea is also cold.',
    'Gold in the bag. Come back when you are ready for Divine.',
  ],
  Silver: [
    'A respectable roll. Respectable is the soil that greatness grows in.',
    'Good, solid, silver. Ride again, and bring me gold.',
    'Not shabby! Do it again but better. That is the whole secret.',
  ],
  Bronze: [
    'Everyone starts as bronze, even the Kiln. Ride again.',
    'A humble roll. May the next be less humble.',
    'Do not be discouraged. The dog is still excited, so that is something.',
    'Chin up. Wealth comes to those who ride again. Mine did.',
  ],
};

/** Per-Gnomokemon lines. Add more under any dex id. */
export const SPECIES_LINES: Record<string, readonly string[]> = {
  sproutling: [
    'Sproutling! Still damp behind the leaf. I know the feeling.',
    'A little sprout with big dreams and bigger hat. I support this.',
    'Sproutling: proof that you can wear a plant and still be taken seriously.',
  ],
  kilnpup: [
    'Kilnpup! Warm to the touch and warm to the heart. Mind the singed fur.',
    'It chews cinders. You should not. Well done anyway.',
    'A fired-clay puppy. Do not ask how many times I have been licked.',
  ],
  dewdrop: [
    'Dewdrop! Round, wobbly, and extremely proud of its puddle.',
    'It jiggles when it is happy. Therefore, constantly.',
    'Splash. Splash! I am not allowed to say more. The puddle is private.',
  ],
  mossback: [
    'Mossback! Slow, soft, and covered in a lawn. A true ancestor.',
    'It has been photographed before. The moss remembers.',
    'You caught a Mossback, which is to say you were patient. Excellent.',
  ],
  staghorn: [
    'Staghorn! All those horns, and not a single opinion.',
    'It protects the grubs. The grubs, in turn, protect nothing. A fair deal.',
    'A beetle with antlers and nothing to prove. I admire it.',
  ],
  thimblekin: [
    'Thimblekin! Check your pockets. Check them now. I will wait.',
    'Everything you own, and the camera too. It looks innocent. It is not.',
    'A thief in a thimble, and I love it for the audacity.',
  ],
  hoseleech: [
    'Hoseleech! It is a hose. It is also a leech. Do not ask.',
    'The coil is coiling. The coil is always coiling.',
    'High pressure, higher drama. A very watery photograph.',
  ],
  strawight: [
    'Strawight! A scarecrow with stage fright, guarding the clover.',
    'It guards for a king who is not coming back. Pat it on the head.',
    'Stuffed with straw and loyalty. The best kind of stuffing.',
  ],
  paperwasp: [
    'Paperwasp! A fine insect, if you enjoy being a fine insect.',
    'It folds its own house. I cannot even fold a towel.',
    'Watch the stripes. Admire the stripes. Do not touch the stripes.',
  ],
  unfired: [
    'The Unfired! Hold it gently. It is mostly water and ambition.',
    'Still waiting for the Kiln. Aren\'t we all.',
    'A creature that has not been fired. A rare and slightly squishy shot.',
  ],
  grubthorn: [
    'Grubthorn! Leading the clan south. The clan is very polite about the whole thing.',
    'A noble creature with a horrible commute.',
    'Brave leader, small hat. The Yard needs more of both.',
  ],
  minimower: [
    'A Minimower! Very small, very loud, extremely legal.',
    'It mows nothing and wants nothing. A model citizen.',
    'Stands by the door and hums along. A small, loyal, rusty thing. And you named it with a camera.',
  ],
  armadillan: [
    'Armadillan! Cool sand and crunchy beetles: the simple life.',
    'It curls up when startled. I also curl up when startled. We are alike.',
    'Armour, burrow, snack. A perfect creature and a perfect plan.',
  ],
  sunlizard: [
    'Sunlizard! Toasting its belly on a flat red rock. I want that life.',
    'Warm, flat, and unbothered. A holy trinity.',
    'Do not wake it. It is in the middle of a very long noon.',
  ],
  cactuskin: [
    'Cactuskin! One spoonful of rainwater a month and endless respect. Efficient.',
    'It has a halo of flowers. I demand a better halo.',
    'Prickly, sincere, and slightly sunburnt. A joy to photograph.',
  ],
  tumblewight: [
    'Tumblewight! It goes where the wind goes. A very casual creature.',
    'Rolling, rolling, rolling. No destination. No regrets.',
    'You caught it mid-roll. That is a photographer\'s blessing.',
  ],
  clogmaw: [
    'Clogmaw! Not a monster. A blockage. A very misunderstood blockage.',
    'It only wants to flow. Let it flow. Please let it flow.',
    'The Drainpipe Deeps looked at you and blinked. Nice shot.',
  ],
  rustcrab: [
    'Rustcrab! Shiny scrap nuts and a dry ledge. A creature after my own heart.',
    'It clicks, it clacks, it rusts with dignity.',
    'Do not feed it your keys. It already has enough.',
  ],
  kilnwarden: [
    'The Kiln Warden! It tests whoever would use the great Kiln. Hello, Warden. I was just leaving.',
    'A creature that tests you, and you took its photograph. Bold.',
    'The Warden looks stern. The Warden is also slightly warm. Be nice.',
  ],
  glowmoth: [
    'Glowmoth! A lantern with ambitions and wings.',
    'It circles the glow at dusk. A poet. A flying poet.',
    'Wonderful light in this one. The moth did that. I take no credit.',
  ],
  seamower: [
    'The Sea Mower! It patrols the basin churning bubbles. A glorious paddle of a thing.',
    'Mower, but nautical. Mowtical.',
    'I would pay good clay to see it cut a lawn of water.',
  ],
  cisterneel: [
    'Cisterneel! Long, quiet, and mysterious. A noodle with a degree.',
    'Dark pipes, drifting plankton, and just enough dignity.',
    'It slithered into frame and said nothing. The best guest.',
  ],
  drownedtoad: [
    'Drowned Toad! Do not feel sorry for it. It likes it down there.',
    'Quiet ledges, fat beetles, no complaints. A role model.',
    'It looks damp. It is damp. It is permanently damp. A masterpiece.',
  ],
  barnacleknight: [
    'Barnacle Knight! A tin-can helm and enormous pride.',
    'It guards the reef with a very small sword and a very big heart.',
    'Sir Barnacle. Arise. Arise slowly, you are crusty.',
  ],
  kelpsprite: [
    'Kelp Sprite! Sunbeams through the cistern water. Utterly lovely.',
    'It sways because it feels like it. Everyone should.',
    'Green, floaty, and mildly smug. A photographer\'s favourite.',
  ],
  magpiethief: [
    'Magpie Thief! It wants glass marbles. It will steal them. It will also apologise.',
    'It looked at your camera. It looked at your camera for too long.',
    'Check the lens. Check the lens cap. Check the lens.',
  ],
  hedgewright: [
    'The Hedgewright! The timber is clear and the Wildlings are kept back. A busy beaver of a gnome.',
    'It builds hedges. I admire a creature with a clear career.',
    'Sawdust and righteousness. A fine combination.',
  ],
  acorndrake: [
    'Acorn Drake! A dragon, but with an acorn. A very practical dragon.',
    'Warm pine resin and high branches. It lives well.',
    'It is small. It is fierce. It is also cute. Do not tell it that.',
  ],
  bellrat: [
    'Bell Rat! Cheese rinds and a shiny brass bell. A rich inner life.',
    'Ring, ring. It is not asking for help, it is asking for cheese.',
    'The bell is very loud. The rat is very pleased. Win-lose.',
  ],
  gnomespirit: [
    'The Gnome Spirit! Keeper of the lawn\'s balance: a little cut, a little water. Very sensible.',
    'It watches over us all. Wave. It is rude not to wave.',
    'A spirit in a photograph. Spooky? Nice? Both! Both is allowed.',
  ],
  mooncap: [
    'Mooncap! Cool night mist and a quiet spot under the greenhouse glass.',
    'A mushroom that glows at night. I am jealous. I only glow when embarrassed.',
    'The night is its stage. You caught it mid-curtain call.',
  ],
  starbeetle: [
    'Star Beetle! Dewdrops on the glass, moonlight on the shell. Pure poetry.',
    'A beetle that thinks it is a constellation. Honestly, it is right.',
    'Tiny stars, big attitude. Photograph confirmed.',
  ],
  dewghost: [
    'Dew Ghost! A warm glass lantern to drift inside. It is a very gentle haunting.',
    'It does not scare anyone. It tries. It tries so hard.',
    'You photographed a ghost. Do not tell the Tall Ones, they will never sleep again.',
  ],
  bonsaititan: [
    'Bonsai Titan! Peaceful roots in a porcelain pot. A giant who respects the pot.',
    'Mist on the needles and not a care in the world. A sage.',
    'It towers, it sways, it does not judge. I try to be like it.',
  ],
  clockworkfrog: [
    'Clockwork Frog! Someone wind its key once a night. It would do it for you.',
    'Tick, hop, tick, hop. A very organised amphibian.',
    'Brass, springs, and a smile. A photographer\'s dream, a plumber\'s nightmare.',
  ],
  gnomejesus: [
    'Wait. That is me. That is ME. Why is there a photograph of me? Divine, obviously.',
    'Every Gnomokemon framed with care and honesty. And this one, with extra flattery.',
    'You photographed the grader. I will remember this. In a good way. Probably.',
  ],
  snowcap: [
    'Snowcap! A warm wool scarf and a mug of heated cistern broth. A cozy hero.',
    'A mushroom in winter wear. The fashion department weeps.',
    'It shivers beautifully. I would shiver too, but the robe is thick.',
  ],
  icicleimp: [
    'Icicle Imp! A shady eave so the sun cannot melt its horns. A cautious devil.',
    'It looks pointy. It is pointy. It is also very sorry about it.',
    'Cold, sharp, and one sunbeam away from a puddle. I feel for it.',
  ],
  pinego: [
    'Pinego! Dry needles and a cosy burrow under the hedge. It knows how to live.',
    'A hedgehog made of pine. I would like one. I would not hug it.',
    'Spiky outside, soft inside. Like me, but with needles.',
  ],
  frosthound: [
    'Frosthound! A frosty sprint around the frozen Basin. Good dog. Great dog.',
    'It runs. It runs very fast. You caught it. You are faster than ice.',
    'Fast, cold, and adorable. All three at once is illegal.',
  ],
  chimneyowl: [
    'Chimney Owl! A warm terracotta pot to roost on in the snow. A smart bird.',
    'It watches you. It watches the photograph. It watches the watcher.',
    'Who? You. Who took this? Also you. Nicely done.',
  ],
  frostking: [
    'The Frost King! The Birdbath Basin undisturbed until the Rime ends. You disturbed it. With a camera. Bold.',
    'A king in a birdbath. Kneel. Or at least lean slightly.',
    'Majestic, chilly, and extremely unamused. A perfect subject.',
  ],
};

// --- custom lines from the player (localStorage) -----------------------------------------------------------------

const CUSTOM_KEY = 'gnomeokemon.jesusLines.v1';

export type CustomLines = Record<string, string[]>;

export function loadCustomLines(): CustomLines {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    const out: CustomLines = {};
    for (const [id, lines] of Object.entries(parsed as Record<string, unknown>)) {
      if (Array.isArray(lines)) out[id] = lines.filter((l): l is string => typeof l === 'string' && l.trim().length > 0);
    }
    return out;
  } catch {
    return {};
  }
}

function saveCustomLines(all: CustomLines): void {
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(all));
  } catch {
    // Private mode or full storage: the line just won't persist.
  }
}

export function addCustomLine(speciesId: string, line: string): void {
  const text = line.trim().slice(0, 160);
  if (!text) return;
  const all = loadCustomLines();
  const list = all[speciesId] ?? [];
  if (!list.includes(text)) list.push(text);
  all[speciesId] = list;
  saveCustomLines(all);
}

export function removeCustomLine(speciesId: string, line: string): void {
  const all = loadCustomLines();
  all[speciesId] = (all[speciesId] ?? []).filter((l) => l !== line);
  saveCustomLines(all);
}

// --- picking -----------------------------------------------------------------------------------------------------

const recent = new Set<string>();

/** A random line from `pool`, avoiding anything said in the last few picks while the pool is big enough. */
export function pickLine(pool: readonly string[], rng: () => number = Math.random): string {
  if (pool.length === 0) return '';
  let fresh = pool.filter((l) => !recent.has(l));
  if (fresh.length === 0) {
    for (const l of pool) recent.delete(l);
    fresh = [...pool];
  }
  const line = fresh[Math.floor(rng() * fresh.length)];
  recent.add(line);
  if (recent.size > 40) recent.delete(recent.values().next().value as string);
  return line;
}

/** Built-in plus custom lines for one species. */
export function speciesPool(speciesId: string, custom: CustomLines = loadCustomLines()): string[] {
  return [...(SPECIES_LINES[speciesId] ?? []), ...(custom[speciesId] ?? [])];
}

export interface PhotoLines {
  /** Said while the numbers tick. */
  judging: string;
  /** Said once the grade has landed: the species line (if any) first, then the grade line. */
  verdict: string[];
}

const PAGE_036_LINES: Record<PhotoGrade, string> = {
  Bronze: 'Ah. Yes. That is... certainly a robe. Put it in the drawer. No, the bottom drawer. Let us move on.',
  Silver: 'Silver. On me. Well. The moonlight was clearly being difficult. Come back to the Glasshouse when your hands are warmer.',
  Gold: 'Wait. That is me. That is ME! A handsome angle, completely candid — I was definitely inspecting a fern. Gold! We are framing this at once.',
  Divine: '... Leave it on the desk. Go wash up. I will put it in the frame myself.',
};

export function page036Line(grade: PhotoGrade): string {
  return PAGE_036_LINES[grade];
}

/** What Jesus says about one photo. The species line comes first so each creature gets its moment. */
export function linesFor(pic: PhotoRecord, rng: () => number = Math.random): PhotoLines {
  const verdict: string[] = [];
  if (pic.speciesId === 'gnomejesus') {
    verdict.push(page036Line(pic.score.grade));
  } else {
    const species = speciesPool(pic.speciesId);
    if (species.length) verdict.push(pickLine(species, rng));
    verdict.push(pickLine(GRADE_LINES[pic.score.grade], rng));
  }
  for (const label of pic.score.specialLabels) {
    const key = Object.keys(SPECIAL_LINES).find((k) => label.startsWith(k));
    if (key && rng() < 0.6) {
      verdict.push(pickLine(SPECIAL_LINES[key], rng));
      break;
    }
  }
  return { judging: pickLine(JUDGING_LINES, rng), verdict };
}

const GRADE_RANK: Record<PhotoGrade, number> = { Bronze: 0, Silver: 1, Gold: 2, Divine: 3 };

export function bestGrade(photos: readonly PhotoRecord[]): PhotoGrade {
  let best: PhotoGrade = 'Bronze';
  for (const p of photos) if (GRADE_RANK[p.score.grade] > GRADE_RANK[best]) best = p.score.grade;
  return best;
}
