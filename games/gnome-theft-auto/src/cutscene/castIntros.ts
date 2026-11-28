// Character intro cards (L105): who each main character is, in a name, a role and one line, for the 'intro' scene step
// (script.ts) and showCharacterIntro (introCard.ts). Pure data; lore: docs/design/gnome-theft-auto/characters.md and
// docs/lore/. E20-E22 place the intros in the story; this file only says what each card reads.

/** What one intro card shows. */
export interface CharacterIntro {
  /** Display name, e.g. "Pip Potsworth". */
  name: string;
  /** A short role, at most 28 characters, e.g. "Your neighbour. Fixer." */
  role: string;
  /** One line of who they are, at most 70 characters, in the game's dry voice. */
  line: string;
  /** Accent colour 0xRRGGBB for the card's stripe (the character's hat colour). Default 0xffd23f. */
  accent?: number;
}

/** By cast key (cutscene/cast.ts CAST keys), plus the two speakers without a CAST preset. */
export const CAST_INTROS: Readonly<Record<string, CharacterIntro>> = {
  pip: { name: 'Pip "Two-Stroke" Potsworth', role: 'Mechanic. Liability.', line: 'Fast-talking engine nut who drags you into every plan. Never still.', accent: 0xc82828 },
  tansy: { name: 'Tansy "Side-Valve" Clayfoot', role: 'Boss of Side-Valve Salvage.', line: 'Runs the bay and the crew. Dry, short orders, and no nonsense.', accent: 0xf08a24 },
  vesper: { name: 'Vesper "The Glazier" Thorne', role: 'HOA chair. Porcelain.', line: 'Soft-spoken and very polite, and happy to buy your street. Nice hat.', accent: 0x141418 },
  granny: { name: 'Granny Gnertrude', role: 'Fence. Pie. Cloverfield.', line: 'The sharpest fence in three biomes, with a pie in the oven.', accent: 0x8e44ad },
  diggs: { name: 'Commander Diggs', role: 'Commander, Fort Sandpit.', line: 'Runs the Spade Guard by the book. Effective immediately.', accent: 0x4b6329 },
  bracken: { name: 'Elder Bracken', role: 'Elder of the Unmowed.', line: 'Keeps the Cracked Tablet and the old ways in Mossy Wood. No jokes.', accent: 0x2e6f40 },
  loam: { name: 'Father Loam', role: 'Excommunicated chaplain.', line: 'Keeps the Kiln-Resin shrine on the frozen basin. Blesses getaways.', accent: 0x9ec6de },
  bodega: { name: 'John Bodega', role: 'Corner shopkeeper.', line: 'Runs the corner shop, sweeps the step, and never looks up from it.', accent: 0x7c4a2d },
  juniper: { name: 'Councilwoman Juniper "The Trowel" Vance', role: 'City Council. Paperwork.', line: 'Beats the HOA with forms, faster than they can file. Never hurries.', accent: 0x2f5a8f },
  reginald: { name: 'Reginald "Quarter-Inch" Vance', role: 'HOA audit officer.', line: 'Measures everything to a quarter-inch and signs what he doubts.', accent: 0x18181e },
  sorrel: { name: 'Sorrel Tillbrook', role: 'Radio host, 88.7 Fescue.', line: 'The calm voice of the Unmowed on the radio. Keeps the rain tapes.', accent: 0x4f7a5a },
  clara: { name: 'Clara', role: 'Keeper of the refuge.', line: 'Leads cracked gnomes to the oak stump. Counts them gently.', accent: 0xf6f6fa },
  brenda: { name: 'Baroness Brenda', role: 'Sovereign of New Puddle.', line: 'Taxes everyone, declares everything, and rides a gold push-bike.', accent: 0xd4a04a },
  'big lou': { name: 'Big Lou', role: 'Door of the Gnomecino.', line: 'Checks every hat at the door. One or two words, and always "Hat."', accent: 0x18181e },
  mossley: { name: 'Mossley "Plumb-Line" Inkcap', role: 'Grid-truther surveyor.', line: 'Proves the gridlines with a plumb-line. Sixty and sixty, every time.', accent: 0x3b6ea5 },
  burt: { name: 'Burt', role: 'Ex-HOA citation writer.', line: 'Leaks van routes to the street crews, and jumps at every sound.', accent: 0x4b5563 },
  driftwood: { name: 'Driftwood', role: 'Castaway and boatman.', line: 'Follows the water, tells long stories, and runs a tube hut by the sea.', accent: 0x4f9d92 },
  cedric: { name: 'Cedric "Double-Bag" Peat', role: 'Chapel of Mulch recruiter.', line: 'Ground-floor opportunity in every sentence. Three friends by Friday.', accent: 0x8e44ad },
  bramble: { name: 'Farmer Bramble', role: 'Cloverfield grower.', line: 'Granny\'s neighbour and drinking partner. Don\'t look up. Listen.', accent: 0x8b5a2b },
  shelldon: { name: 'Shelldon "No-Trail" Mucilage', role: 'Snail-Mail Express courier.', line: 'Carries scrolls by snail, in capitals, and never on a paved road.', accent: 0x7a8a78 },
  wally: { name: 'Wind-Sock Wally', role: 'Airfield keeper and pilot.', line: 'Dry and gravelly. Calls everyone "kid" and quotes the stall speed.', accent: 0x6b4a2e },
  dot: { name: 'Dorrit "Dot" Pennywort', role: 'Kerbside Exchange job board.', line: 'Pins everyone\'s jobs to the board and punches the tickets. "Next!"', accent: 0x2a4d7a },
  hedda: { name: 'Hedda Galley', role: 'Editor, Turfton Tattler.', line: 'Writes headlines like telegrams. Nobody has ever photographed her.', accent: 0x1c1c1c },
  nina: { name: 'Neon-Moth Nina', role: 'Night vendor, Greenhouse.', line: 'Sells glow-bands and gossip after dark. You did not hear it here.', accent: 0x7a3cff },
  grout: { name: '"Big Wrench" Grout', role: 'Head of Local 404.', line: 'Union boss with a pipe wrench. Pays in real acorns, only real ones.', accent: 0x3d4a5c },
  peony: { name: 'Dame Peony Gravelrake', role: 'Owner, Hedgeworth Links.', line: 'Runs the neighbour\'s course by the card. Vesper holds her mortgage.', accent: 0x3f6b3a },
  basil: { name: 'Basil Divot', role: 'Club pro. Superstitious.', line: 'Plays every round to win and blames every bad lie on a mole.', accent: 0xc0282d },
  thrift: { name: 'Thrift Hosepipe', role: 'Groundskeeper.', line: 'Talks to the grass, waters the ninth green and keeps its secrets.', accent: 0x6b4a2e },
  mabel: { name: 'Mabel Kerbstone', role: 'Turfton Taxi driver.', line: 'Hop in, dear. Knows every fare\'s business and sells none of it.', accent: 0xf2c200 },
  'mayor mulch': { name: 'Mayor Barnaby "Two-Coat" Mulch', role: 'Mayor of Turfton.', line: 'Wants to be on the winning side. Waves at cameras that are not there.', accent: 0xffd23f },
  'turncoat cam': { name: 'Turncoat Cam', role: 'Side-Valve sweeper.', line: 'Broom always in hand, eyes on the bay, never on the person talking.', accent: 0xffd23f },
  // Batch 3 cast (E20), first-meeting cards only.
  'don compost': { name: 'Don Compost', role: 'Boss of the Mulch Club.', line: 'Never speaks. Taps the armrest. Big Lou translates, nervously.', accent: 0x141418 },
  parsley: { name: 'Parsley Inkpot', role: 'Loan officer, First Kiln.', line: 'Soft, slow and sorry about every form. Initial where the pen bled.', accent: 0x3a3d44 },
  hyssop: { name: 'Hyssop Doormat', role: 'Neighbour, flat 3A.', line: 'Retired crossing warden. Keeps the stairwell rules, and a log of you?', accent: 0x8a8a8a },
  'lugnut lulu': { name: 'Lugnut Lulu', role: 'Captain, the Carburettors.', line: 'Loud, easy and low to the ground. Teases everyone she likes.', accent: 0xff6a00 },
  chard: { name: 'Chard Levelright', role: 'Foreman, Even-Estates.', line: 'Slow and gravelly. Checks every wall by eye. True, or not.', accent: 0xd9c8a5 },
  hogweed: { name: 'Hogweed Sprocket', role: 'Underspan inventor.', line: 'Breathless, brilliant, and waving a spanner. It works. Probably.', accent: 0x6b4a2e },
  gary: { name: 'Gate-Guard Gary', role: 'Guard, the Patio Gate.', line: 'Bored, nasal, and fond of section numbers. Sigh. Hats level.', accent: 0x1f3a5f },
  sage: { name: 'Sage Ladle', role: 'Cook, Acorn Diner.', line: 'Warm and short. Feeds everyone, calls them love, charges a plate.', accent: 0xf4f4f4 },
  frank: { name: 'Fence-Post Frank', role: 'Shack behind the sign.', line: 'Slow drawl, grass blade. Reads your engine before he meets you.', accent: 0x8b5a2b },
  chicory: { name: 'Chicory Snips', role: 'Head gardener, Trellisdown.', line: 'Dry, precise and sad. Talks to the vines first, people second.', accent: 0x4e7a32 },
  wisteria: { name: 'Countess Wisteria Brassknock', role: 'Lady of Trellisdown.', line: 'Grand, slow and unhurried. Observes, never asks.', accent: 0x7a4aa8 },
  'rooster weatherby': { name: 'Rooster "Squall-Box" Weatherby', role: 'Weather-shouter, windmill.', line: 'Forecasts at the top of his voice, through a tin funnel.', accent: 0xbfc3c7 },
  nubbin: { name: 'Nubbin', role: 'Mole. Loamdeep post runner.', line: 'Tiny, formal and polite. Late with the post, and very sorry.', accent: 0x6a6e78 },
  tumblesoil: { name: 'Old Mother Tumblesoil', role: 'Matriarch of Loamdeep.', line: 'Slow, gentle and formal. Says "dear one" and means it.', accent: 0x9a9ea8 },
  saxifrage: { name: 'Mother Saxifrage Wader', role: 'Flock of the One Leg.', line: 'Ritual and sing-song. Stands on one leg. So it is stood.', accent: 0xb8b8c0 },
  ernie: { name: 'Ash-Shovel Ernie', role: 'Stoker, Compost Heap.', line: 'Warm, gruff and humming. Roasts a chestnut at the full stop.', accent: 0x555555 },
  midge: { name: 'Squeaky-Clean Midge', role: 'Intern, Glaze Clinic.', line: 'Breathless and bubbly. Mends cracks at a hundred and forty beats.', accent: 0xc8a050 },
  cass: { name: 'Chrome-Knuckle Cass', role: "Foreman, Pay 'n' Glaze.", line: 'Hands the work orders out and checks the chrome twice.', accent: 0xb8b8c0 },
  // Founders' Green regulars (sports/types.ts SPORTS_CAST).
  cardoon: { name: 'Cardoon "Swish" Trowelly', role: 'Drainpipe Court regular.', line: 'Wins bets for a living. Gives the stake back if you ask properly.', accent: 0xe0702a },
  lintel: { name: 'Lintel Crossover', role: 'Swish\'s partner.', line: 'All fakes, no shot. Somehow it works.', accent: 0x6a3fa0 },
  pansy: { name: 'Pansy Rebound', role: 'Your teammate.', line: 'Gets every rebound. Gives every rebound back to you, grudgingly.', accent: 0x2f8f5a },
  benchley: { name: 'Old Burdock Benchley', role: 'Keeps the score.', line: 'His bench is older than the court. So are his opinions.', accent: 0x5a5a5a },
  fennel: { name: 'Fennel Gripwax', role: 'Gutter Bowls skater.', line: 'Lives under the deck. Feeds the strays. Keeps a list of lines.', accent: 0x3a7ac0 },
  moss: { name: 'Moss Squeegee', role: 'Dries the bowls.', line: 'A bowl is a roof on the ground. Roofs need looking after.', accent: 0x4a7a3a },
  pebble: { name: 'Pebble Nollie', role: 'Films everything.', line: 'Has never stood on a board. Has seen every trick.', accent: 0xf07aa0 },
  // Hobby teachers (hobbyIntros.ts): the Bent Pin, the Tuft & Tally Lodge and the Reedwatch Hide.
  wenna: { name: 'Wenna Gudgeon', role: 'Bent Pin. Fishing teacher.', line: 'Quick and exact about centimetres. Every fish goes back in.', accent: 0x2f6f8f },
  hazel: { name: 'Hazel Mattock', role: 'Tuft & Tally. Hunting.', line: 'Sells the Tuft License. Nobody gets hurt. Mostly.', accent: 0x5a6b2e },
  dunnock: { name: 'Dunnock Pell', role: 'Reedwatch. Birding.', line: 'Keeps the hide and the life list. The birds don\'t mind you there.', accent: 0x6b7a5a },
  // Act III (E21).
  gentian: { name: 'Gentian Bootlace', role: 'Ski instructor, Snowdrop.', line: 'Shouts like a coach and counts in threes. Three layers. I said three.', accent: 0xc2402e },
  'thermos theo': { name: 'Thermos Theo', role: 'Ice fisher, Frostbite Fells.', line: 'Slow and kind, and stirs his barrel. Tea first, questions after.', accent: 0x9e3b2a },
  chanterelle: { name: 'Warden Chanterelle Stook', role: 'Warden of Capwood.', line: 'Prim and regulation-bound. Fines every bruised cap, by section.', accent: 0x7a5a3a },
  ragwort: { name: 'Ragwort Coilspring', role: 'Keeper, Pinwheel Ridge.', line: 'Dry and technical. Explains in numbers. Naturally.', accent: 0xc0c4c8 },
  clary: { name: 'Marshal Clary Mudguard', role: 'Starter, Rutbottom Bowl.', line: 'A bored bark and a flat countdown. Go on, then.', accent: 0xe8e8e8 },
  marram: { name: 'Marram Teaspoon', role: 'Runs the Spokewheel.', line: 'Sells the whole sea for two acorns. Calls everyone pet.', accent: 0xe8b83a },
  samphire: { name: 'Captain Samphire Bilge', role: 'Captain, the Bathtub Queen.', line: 'Booming and theatrical. Tells tour groups about pirates, deadpan.', accent: 0x2c3e50 },
  betony: { name: 'Professor Betony Sextant', role: 'Astronomer, Rootwell.', line: 'Absent-minded and precise. Trails off into figures. As I was saying.', accent: 0x1f2f5a },
  lovage: { name: 'Dean Lovage Inkwell', role: 'Dean of Rootwell.', line: 'Pompous and smooth. Never answers a question. Mind the optics.', accent: 0x5a1f2a },
  'silt-diver sal': { name: 'Silt-Diver Sal', role: 'Under-Deck culvert trader.', line: 'Raspy, damp and bargaining. Wants clean socks and dry matches.', accent: 0x6b5a3e },
  yarrow: { name: 'Reeve Yarrow Potsherd', role: 'Reeve of Pebblewick.', line: 'Formal and patient. Minutes are kept. Noted.', accent: 0x7a7d82 },
  'burdock haybright': { name: 'Head Ranger Burdock Haybright', role: 'Head Ranger, the Unmown.', line: 'Counts and watches. Tidies nothing. Twelve species before lunch.', accent: 0x6b7a2e },
  hector: { name: 'Hector Disdain', role: 'Waiter, Café Pardon.', line: 'Has seen you. Will bring it when he is ready. Never takes an order.', accent: 0x1c1c1c },
  velma: { name: 'Velma Crown', role: 'Keeps the Top Hat, Brim Gap.', line: 'Brisk and bright. Counts every car that stops. Gap Tea, love?', accent: 0x1b1b22 },
  'dj moleman': { name: 'DJ Moleman', role: 'Mole DJ, Loamdeep.', line: 'Spins from the dark. Nobody has heard him say a word.', accent: 0x5a5e68 },
};

const titleCase = (s: string): string => s.replace(/\b\w/g, (m) => m.toUpperCase());

/**
 * The card for `who` (a cast key or label, any case), with any of `over`'s fields replacing the stored ones. An unknown
 * `who` gets its title-cased name and empty role and line.
 */
export function introFor(who: string, over: Partial<CharacterIntro> = {}): CharacterIntro {
  // Story ids are hyphenated ('turncoat-cam'); CAST keys use spaces ('turncoat cam').
  const base = CAST_INTROS[who.toLowerCase()] ?? CAST_INTROS[who.toLowerCase().replace(/-/g, ' ')] ?? { name: titleCase(who), role: '', line: '' };
  return {
    name: over.name ?? base.name,
    role: over.role ?? base.role,
    line: over.line ?? base.line,
    accent: over.accent ?? base.accent,
  };
}
