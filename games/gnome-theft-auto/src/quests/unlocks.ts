// When each side quest unlocks: the one table of story beats (design: docs/design/gnome-theft-auto/side-quest-schedule.md,
// E18 pacing rules and hand-off: docs/roadmaps/gta-batch-3/E18/contracts.md). Pure data and pure functions, no DOM, so
// cutscene and story writers can read it.
//
// A side quest listed here can be taken once its `after` story quest is done. Which of the unlocked ones are *offered*
// (journal Open tab, map marker, notice) is pacing.ts: a few at a time per act, the rest on the journal's Later shelf.
// Anything a save has already started or finished stays as it is (old saves keep their progress). The Tessie quest also
// keeps an older save's unlock: its TESSIE.unlockKey pseudo-entry (tessieUnlock.ts) turned 'done' means unlocked.
//
// `planned` is the spine row (storyRows.ts) the schedule wants, where that main quest is not built yet: `after` is the
// nearest built beat that keeps the premise. When E20-E22 build a planned row, unlocks.test.ts fails until `after` is
// moved onto it (then drop `planned`).
//
// Built story beats, in spine order (row): prologue-fresh-kiln 1, m02-roof-on-credit 2, first-contract 3,
// ch1-mowers-keepers 4, ch1-two-coat-tail 6, ch1-tax-break-in 8, ch1-founders-boot 15, ch2-dew-run 16,
// ch2-sprinkler-gauntlet 18, ch2-vespers-offer 20, ch2-unmowed-tablet 23, ch3-salvage-raid 35, ch3-kiln-resin-ice 36,
// ch3-tundra-drift-run 53, ch4-runway-flares 55, ch4-sandpit-drop 57, ch4-spade-truce 59, ch5-even-cut 70.
import { TESSIE } from '../config';
import { COAST_UNLOCK_AFTER } from '../coast/config';
import type { QuestSave } from './types';

export interface SideUnlock {
  /** The side quest (QuestDef.id). */
  questId: string;
  /** The story quest that must be 'done' first. */
  after: string;
  /** Why here, for writers (not shown in game). Says when the giver appears. */
  why: string;
  /** The schedule's story row (a STORY_ROWS id not built yet) this unlock moves to when that quest exists. */
  planned?: string;
}

export const SIDE_UNLOCKS: readonly SideUnlock[] = [
  // ---- Act I (rows 1-15, 3 offers at once) ----
  { questId: 'sq-grid-truthers', after: 'prologue-fresh-kiln', why: 'Downtown loiterers who have always been there: a gentle first side job right after Pip.' },
  { questId: 'nc-good-neighbour', after: 'prologue-fresh-kiln', why: 'Street events happen from the first minute; Mabel hands every new gnome the card.' },
  { questId: 'nc-strike-a-pose', after: 'm02-roof-on-credit', why: 'Emotes need nothing but the gnome; Neon-Moth Nina stamps the card on the walk home to Saucer Court.' },
  { questId: 'nc-wheel-and-kit', after: 'first-contract', why: 'The first contract hands out guns; the wheel and the Pocket Kit come next.' },
  // The Kerbside Exchange city contracts (cityQuests.ts, R-150): each also needs its prereq (Kerbside Rounds first).
  { questId: 'city-kerbside-rounds', after: 'ch1-mowers-keepers', why: "The player knows Side-Valve and the Watch; Dot puts them on the Exchange's books. Kept here (the schedule says #18) because the Impound Run at #8 needs it." },
  { questId: 'sq-snail-rigging', after: 'ch1-two-coat-tail', why: "The player has met Tansy, Cam and the Watch; Shelldon's alley is a block from Side-Valve." },
  { questId: 'nc-mind-the-verges', after: 'ch1-two-coat-tail', why: 'After the tail to Patio Heights, where the golf cart lives.' },
  { questId: 'sq-big-lou-embargo', after: 'ch1-two-coat-tail', planned: 'm09-where-asphalt-sleeps', why: "Lou's embargo is already on and the player has tailed and fought by #6." },
  { questId: 'city-impound-run', after: 'ch1-tax-break-in', why: "Pip's Zero-Turn is towed after the Glaze & Tax break-in; fetch it back and fix it." },
  { questId: 'sq-levelright-night-shift', after: 'ch1-tax-break-in', planned: 'm07-even-estates', why: 'Chard is short of hands at the fringe site the tail went past; he meets the player properly in m07.' },
  { questId: 'nc-bent-pin', after: 'ch1-tax-break-in', planned: 'm11-the-dons-cigars', why: "Fishing intro: a calm hobby after the first heist. m11 takes the player to New Puddle Marina, by Wenna's bait stall on the canal." },
  // E26 street races (streetRaces.ts): one chain of five, each also needing its prereq.
  { questId: 'sr-kerb-row', after: 'ch1-tax-break-in', why: 'The Skyway Foot opens late in act I: the first street race is a warm-up.' },
  { questId: 'sq-mulch-pyramid', after: 'ch1-founders-boot', why: 'Patio Heights to Side-Valve haul; end of act I, before the bay is seized.' },
  { questId: 'nc-skyway', after: 'ch1-founders-boot', why: 'End of act I: the player can drive well enough for the deck.' },
  { questId: 'nc-odd-jobs', after: 'ch1-founders-boot', why: 'Act II costs Acorns and the flat has a loan; the sim jobs earn them.' },
  { questId: 'sq-gutter-bowls-sessions', after: 'ch1-founders-boot', why: "Fennel gave the cap back and keeps a list of lines nobody has skated; the Gutter Bowls are in Founders' Green." },
  { questId: 'sq-court-regulars', after: 'ch1-founders-boot', planned: 'm14-drainpipe-court', why: "Swish's court is in Founders' Green, open once the player has been through the park; Cardoon beats Pip in m14." },
  // E17 societies (societyQuests.ts, loamdeepQuests.ts) and the Dewdrop (E18, dewdropQuests.ts): Hogweed under the Span.
  { questId: 'sq-underspan-verticality', after: 'ch1-founders-boot', planned: 'm10-under-the-span', why: 'Hogweed under the Unfinished Span; the player can drive the Skyway by now. He meets the player in m10.' },
  { questId: 'sq-dewdrop-1', after: 'ch1-founders-boot', planned: 'm10-under-the-span', why: "The Rolling Prototype: Hogweed's ball rolls loose past the player under the Span (m10)." },
  // ---- Act II (rows 16-35, 4 offers at once) ----
  { questId: 'sq-biscuit-hotdog', after: 'ch2-dew-run', why: "Granny Gnertrude's barn opens at #16; the first combine haul." },
  { questId: 'city-glow-band-express', after: 'ch2-dew-run', why: "After the tribunal the Velvet Toadstools book the new Founders' Green bandstand." },
  { questId: 'nc-lockup', after: 'ch2-dew-run', planned: 'm17-the-dew-buyer', why: "Tansy's bay is the player's garage; the Club shows how to park and call a ride before the HOA seizes it (#35)." },
  { questId: 'sr-skyway-midnight', after: 'ch2-dew-run', why: 'The night run up the Skyway Sprint, once the Dust Flats roads are open.' },
  { questId: 'sq-castaway-drydock', after: 'ch2-sprinkler-gauntlet', planned: 'm19-squall-box-forecast', why: 'Driftwood hung about the barn through the gauntlet (#18).' },
  { questId: 'nc-sky-spotting', after: 'ch2-sprinkler-gauntlet', why: "Once the player has looked up from the Cloverfield fields; Hedda wants eyes on the sky." },
  { questId: 'nc-last-stop-pebblewick', after: 'ch2-sprinkler-gauntlet', why: 'Pebblewick is past the Dust Flats, open since the dew run.' },
  { questId: 'sq-windfall-croft-deed', after: 'ch2-sprinkler-gauntlet', planned: 'm31-granny-cracks', why: 'The player meets the Cloverfield farmers here; Bramble knows who holds the deed.' },
  { questId: 'nc-take-off', after: 'ch2-vespers-offer', why: 'The Dust Flats and the airfield are open; the player must be able to fly before #46.' },
  { questId: 'nc-reedwatch', after: 'ch2-vespers-offer', planned: 'm25-one-leg-to-stand-on', why: "Birding intro: Loch Moss is near and Dunnock's hide is quiet after Vesper's offer. m25 lands the player at the loch." },
  { questId: 'sq-porcelain-blues', after: 'ch2-vespers-offer', planned: 'm21-penthouse-viewing', why: "Vesper's offer put porcelain guards on every corner; the porch gnomes have views." },
  { questId: 'city-penthouse-exclusive', after: 'ch2-vespers-offer', planned: 'm22-off-air', why: 'Vesper made his offer; the Tattler wants dirt on him.' },
  { questId: 'sr-boucle', after: 'ch2-vespers-offer', why: 'Pardonlin is reached by the same roads as Vesper; the Commissaire wants a closed road.' },
  { questId: 'nc-tuft-and-tally', after: 'ch2-unmowed-tablet', why: "Hunting intro: the Tablet takes the player into Mossy Wood, where Hazel's lodge keeps the licence desk." },
  { questId: 'sq-fescue-fugitive', after: 'ch2-unmowed-tablet', planned: 'm24-the-burrow-door', why: 'The Cracked Tablet opened the Hollow; Elder Bracken has a fugitive.' },
  { questId: 'sq-burrow-post', after: 'ch2-unmowed-tablet', planned: 'm25-one-leg-to-stand-on', why: 'Nubbin at the Burrow Door, a walk from the Hollow (he meets the player in m24).' },
  { questId: 'sq-flock-errands', after: 'ch2-unmowed-tablet', planned: 'm27-heap-of-trouble', why: "The Flock at Wader's Rest (Saxifrage preaches at the player in m25)." },
  { questId: 'nc-hangar-and-boathouse', after: 'ch2-unmowed-tablet', planned: 'm32-driftwoods-chart', why: 'The player can afford a big shed by now; Driftwood\'s chart (m32) puts a boat shed in their head.' },
  { questId: 'nc-party', after: 'ch2-unmowed-tablet', planned: 'm34-forty-seven-wrenches', why: "Optional and online only; Tansy's party for the rezoned Green (m34) is the cue." },
  { questId: 'race-rookie-mowdown', after: 'ch3-salvage-raid', planned: 'm30-cams-big-night', why: 'Lugnut Lulu laughs at Cam in m30 and notices the player; until then the Speedway calls once act II ends.' },
  { questId: 'sq-hedgeworth-lost-balls', after: 'ch3-salvage-raid', planned: 'm29-the-kicked-board', why: 'Thrift chases the player off the wet fairway in m29; until then he finds them after the raid.' },
  { questId: 'sq-dewdrop-2', after: 'ch3-salvage-raid', planned: 'm28-sibling-rivalry', why: 'Hogweed Rolls Out: Hogweed phones after the Tattler chase (m28), having read about the Compost Heap furnace. Needs sq-dewdrop-1.' },
  { questId: 'sq-dewdrop-3', after: 'ch3-salvage-raid', planned: 'm33-the-bench-lock', why: 'Dewdrop: Hogweed built the bench lock (m33) and is out of excuses not to finish the ball. Needs sq-dewdrop-2.' },
  { questId: 'sr-saltbucket-dash', after: 'ch3-salvage-raid', why: 'The coast band road opens with the salvage raid; the lay-by races a sandy coast road.' },
  // ---- Acts III-IV (rows 36-70, 6 offers at once) ----
  { questId: 'city-skyway-robbery', after: 'ch3-kiln-resin-ice', why: 'The HOA raided Side-Valve (#35); Local 404 hits back through the Exchange.' },
  { questId: 'sq-hose-revolt', after: 'ch3-kiln-resin-ice', why: 'The HOA heat is on everyone after the raid; the canal gnomes ask for help.' },
  { questId: TESSIE.questId, after: 'ch3-kiln-resin-ice', planned: 'm40-the-capwood-run', why: 'Driftwood rings from his trailer once the crew is lying low.' },
  { questId: 'sq-snowdrop-sled-trials', after: 'ch3-kiln-resin-ice', planned: 'm38-pail-pond', why: "The Fells run takes the crew north; Gentian Bootlace's ski class is just past them (she gives the crew a bunk in m37)." },
  { questId: 'sq-pail-pond-lines', after: 'ch3-kiln-resin-ice', planned: 'm39-couch-surfing', why: "Thermos Theo's shanty is on Pail Pond, north of the Fells (he fishes with the player in m38)." },
  { questId: 'race-capwood-open', after: 'ch3-kiln-resin-ice', planned: 'm40-the-capwood-run', why: 'Lulu keeps the Capwood Run open for anyone who wants to beat her time.' },
  { questId: 'sq-capwood-cap-count', after: 'ch3-kiln-resin-ice', planned: 'm41-pinwheel-ridge', why: 'Warden Chanterelle has a clipboard of unfined caps (needs the Capwood Run).' },
  { questId: 'race-rutbottom-knobbly', after: 'ch3-kiln-resin-ice', planned: 'm42-rutbottom-impound', why: 'Clary opens the Bowl to anyone on a Knobbly.' },
  { questId: 'sq-rutbottom-heats', after: 'ch3-kiln-resin-ice', planned: 'm44-the-bathtub-queen', why: 'Teasel wants a rematch on the dirt (needs the Knobbly heat).' },
  { questId: 'race-lowrider-derby', after: 'ch3-kiln-resin-ice', planned: 'm43-saltbucket-boardwalk', why: 'The Carburettors are back on their wheels (needs the Rookie Mow-Down).' },
  { questId: 'race-snail-endurance', after: 'ch3-tundra-drift-run', planned: 'm54-the-heist-board', why: 'After the drift run Shelldon is back in town and the Speedway reopens.' },
  { questId: 'sq-flock-vigil', after: 'ch3-tundra-drift-run', why: 'The Flock gave the test date and now keep a vigil (needs Errands for the Flock).' },
  { questId: 'sq-rootwell-lost-essay', after: 'ch3-tundra-drift-run', planned: 'm47-hedgeworth-links', why: 'Dean Lovage is sure the player is a student and wants a paper on level lines.' },
  { questId: 'sq-anthill-rent', after: 'ch3-tundra-drift-run', planned: 'm48-the-groundskeepers-secret', why: "Sextant knows the ants, and the ants are late on a sugar invoice." },
  { questId: 'sq-hedgeworth-pro-lesson', after: 'ch3-tundra-drift-run', planned: 'm49-loamdeep', why: 'Basil wants to see the swing of whoever came through the board (needs Lost Balls).' },
  { questId: 'sq-loamdeep-lamps', after: 'ch3-tundra-drift-run', planned: 'm50-trellisdown-tasting', why: 'The Burrowfolk agreed to help; the lamp round is next (needs Sorting the Post).' },
  { questId: 'sq-loamdeep-under-chorus', after: 'ch3-tundra-drift-run', planned: 'm50-trellisdown-tasting', why: 'The lamps are lit; now the Under-Chorus wants its DJ (needs Lamplighters).' },
  { questId: 'sq-hedgeworth-ninth-green', after: 'ch3-tundra-drift-run', planned: 'm50-trellisdown-tasting', why: "Thrift's moles under the ninth green (needs Lost Balls)." },
  { questId: 'sq-hedgeworth-members-cup', after: 'ch3-tundra-drift-run', planned: 'm52-the-test-cut', why: "Peony's cup, on the first of the month (needs the pro's lesson)." },
  { questId: 'sq-hoa-audit', after: 'ch4-runway-flares', why: 'Spans all five biomes: only once the Fells and the Dust Flats are open.' },
  { questId: 'sr-ring-road', after: 'ch4-runway-flares', why: 'The last of the chain: the Ring Road time trial once the player has the airfield and the Fizz Cup nerve.' },
  // Saltbucket Shore (coastQuests.ts): the coast spur opens once the runway is lit.
  { questId: 'coast-spokewheel-gondola', after: COAST_UNLOCK_AFTER, planned: 'm45-rootwell-admissions', why: 'Marram took the player up the Spokewheel (m43); the gondola wobbles.' },
  { questId: 'coast-boardwalk-tubing', after: COAST_UNLOCK_AFTER, planned: 'm45-rootwell-admissions', why: "Driftwood's tube hut opened (m43) and needs someone to test the course." },
  { questId: 'race-fizz-cup-final', after: 'ch4-sandpit-drop', why: 'The runway flares lit the airfield next door to the Speedway.' },
  { questId: 'sq-underspan-scrap-run', after: 'ch4-sandpit-drop', why: 'The workshop is short on parts (needs Unauthorised Verticality).' },
  { questId: 'coast-bathtub-tours', after: 'ch4-sandpit-drop', planned: 'm46-starfall-at-the-anthill', why: 'Captain Bilge joined the crew (m44) and has a boat to fill.' },
  { questId: 'coast-queens-treasure', after: 'ch4-sandpit-drop', planned: 'm46-starfall-at-the-anthill', why: "Bilge lets slip about the treasure at the end of the tour (needs Pirate Tours, Mostly)." },
  { questId: 'sq-porcelain-support', after: 'ch4-sandpit-drop', planned: 'm66-porcelain-hearts', why: "Clara's follow-up: she asks for Vesper to be stopped, not shattered (m66)." },
  { questId: 'sq-weeping-line', after: 'ch4-spade-truce', why: 'The reeve met the player; the dry water line is the town\'s other problem.' },
  { questId: 'sq-hum-at-three', after: 'ch4-spade-truce', planned: 'm60-the-moles-dig', why: 'The spade truce opened the eastern sand; the dunes hum at three.' },
];

const BY_ID = new Map(SIDE_UNLOCKS.map((u) => [u.questId, u]));

/** The table row for a quest, or undefined (story quests and anything unlisted are never locked by this table). */
export function unlockRule(questId: string): SideUnlock | undefined {
  return BY_ID.get(questId);
}

/** Is this quest unlocked by the table? True for unlisted quests, for quests already started or done, and when the beat is done. */
export function unlockMet(questId: string, saves: Record<string, QuestSave>): boolean {
  const rule = BY_ID.get(questId);
  if (!rule) return true;
  if (saves[questId]) return true;
  if (questId === TESSIE.questId && saves[TESSIE.unlockKey]?.state === 'done') return true;
  return saves[rule.after]?.state === 'done';
}

/** The table's quests that are unlocked in this save, in table order. */
export function unlockedSideIds(saves: Record<string, QuestSave>): string[] {
  return SIDE_UNLOCKS.filter((u) => unlockMet(u.questId, saves)).map((u) => u.questId);
}

/** Story quests' marker colour (maps, 3D beam and badge). */
export const MAIN_COLOR = '#ffd23f';
/** The active objective's marker colour. */
export const OBJECTIVE_COLOR = '#ff7a00';

/** Each giver's side-quest marker colour (maps, 3D beam and "?" badge) while it offers a side quest. */
export const SIDE_COLORS: Readonly<Record<string, string>> = {
  'cloverfield-barn': '#ff9f9f',
  'unmowed-hollow': '#6fd06a',
  strangers: '#3ad1c4',
  'strangers-gnomecino': '#b07cff',
  'strangers-canal': '#4a8cff',
  'strangers-porch': '#ff8fc8',
  'loch-driftwood': '#c9f25a',
  speedway: '#f4f4f4',
  'strangers-shelldon': '#9fd8a0',
  'kerb-exchange': '#ffb347',
  'newcomers-club': '#f2c200',
  'pebblewick-plots': '#e0a050',
  'pebblewick-tower': '#9fd0ff',
  gentian: '#e8f2ff',
  'theo-pond': '#7fb6e0',
  'street-skyway-foot': '#ff3d7f',
  'street-pardonlin': '#4f7fd8',
  'street-saltbucket': '#f2b33d',
  'rutbottom-clary': '#e8c27a',
  'rutbottom-teasel': '#d8342c',
  'capwood-lulu': '#8e44ad',
  'capwood-warden': '#7fbf5a',
  thrift: '#7bc45a',
  basil: '#f2c230',
  peony: '#c9a9e8',
  lovage: '#c9a227',
  betony: '#8fa8ff',
  chard: '#d9c8a5',
  bramble: '#8fb339',
  'club-bent-pin': '#f2c200',
  'club-lodge': '#f2c200',
  'club-reedwatch': '#f2c200',
};

/** A giver's side-quest colour, '#3ad1c4' for one not in SIDE_COLORS. */
export function sideColor(giverId: string): string {
  return SIDE_COLORS[giverId] ?? '#3ad1c4';
}
