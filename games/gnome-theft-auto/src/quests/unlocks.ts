// When each side quest unlocks: the one table of story beats (roadmap docs/roadmaps/gta-quest-flow-taxi.md). Pure data and
// pure functions, no DOM, so cutscene and story writers can read it.
//
// A side quest listed here is offered only once its `after` story quest is done. Anything a save has already started or
// finished stays as it is (old saves keep their progress). The Tessie quest also keeps an older save's unlock: its
// TESSIE.unlockKey pseudo-entry (tessieUnlock.ts) turned 'done' means unlocked, whatever the table says.
//
// Story order, for pacing: prologue-fresh-kiln, ch1-mowers-keepers, ch1-two-coat-tail, ch1-tax-break-in,
// ch1-founders-boot, ch2-dew-run, ch2-sprinkler-gauntlet, ch2-vespers-offer, ch2-unmowed-tablet, ch3-salvage-raid,
// ch3-kiln-resin-ice, ch3-tundra-drift-run, ch4-runway-flares, ch4-sandpit-drop, ch4-spade-truce, ch5-even-cut.
import { TESSIE } from '../config';
import { COAST_UNLOCK_AFTER } from '../coast/config';
import type { QuestSave } from './types';

export interface SideUnlock {
  /** The side quest (QuestDef.id). */
  questId: string;
  /** The story quest that must be 'done' first. */
  after: string;
  /** Why here, for writers (not shown in game). */
  why: string;
}

export const SIDE_UNLOCKS: readonly SideUnlock[] = [
  { questId: 'sq-grid-truthers', after: 'prologue-fresh-kiln', why: 'Downtown visits only: a gentle first side job right after Pip.' },
  { questId: 'sq-snail-rigging', after: 'ch1-mowers-keepers', why: 'Downtown alley; the player now knows Side-Valve and the Watch.' },
  { questId: 'sq-big-lou-embargo', after: 'ch1-two-coat-tail', why: 'Downtown crack job; the player has tailed and fought by now.' },
  { questId: 'sq-mulch-pyramid', after: 'ch1-founders-boot', why: 'Patio Heights to Side-Valve haul; end of chapter 1.' },
  { questId: 'sq-biscuit-hotdog', after: 'ch2-dew-run', why: 'Granny Gnertrude\'s barn opens in chapter 2; first combine haul.' },
  { questId: 'sq-castaway-drydock', after: 'ch2-sprinkler-gauntlet', why: 'Meets Driftwood in Cloverfield before the Loch Moss hunt.' },
  { questId: 'sq-porcelain-blues', after: 'ch2-vespers-offer', why: 'Porcelain theme after Vesper\'s porcelain guards.' },
  { questId: 'sq-fescue-fugitive', after: 'ch2-unmowed-tablet', why: 'Elder Bracken\'s Hollow opens with the Cracked Tablet.' },
  { questId: TESSIE.questId, after: 'ch3-salvage-raid', why: 'Driftwood (met in Cloverfield) calls the player to Loch Moss.' },
  { questId: 'sq-hose-revolt', after: 'ch3-kiln-resin-ice', why: 'Heavy HOA heat side job once the player has the tundra run.' },
  { questId: 'sq-hoa-audit', after: 'ch3-tundra-drift-run', why: 'Spans all five biomes: only once the Fells and Dust Flats are open.' },
  { questId: 'sq-porcelain-support', after: 'ch4-sandpit-drop', why: 'Clara\'s follow-up, late game, gentle driving between battles.' },
  // The Kerbside Exchange city contracts (cityQuests.ts, R-150): each also needs its prereq (Kerbside Rounds first).
  { questId: 'city-kerbside-rounds', after: 'ch1-mowers-keepers', why: "The player knows Side-Valve and the Watch; Dot puts them on the Exchange's books." },
  { questId: 'city-impound-run', after: 'ch1-tax-break-in', why: "Pip's Zero-Turn is towed after the Glaze & Tax break-in; fetch it back and fix it." },
  { questId: 'city-glow-band-express', after: 'ch1-founders-boot', why: 'After the Amphitheater tribunal, the Velvet Toadstools book the same stage.' },
  { questId: 'city-penthouse-exclusive', after: 'ch2-vespers-offer', why: 'Vesper made his offer; the Tattler wants dirt on him.' },
  { questId: 'city-skyway-robbery', after: 'ch3-salvage-raid', why: 'The HOA raided Side-Valve; Local 404 hits back via the Skyway.' },
  // The Newcomers' Card tutorials (newcomerQuests.ts): one hobby or system each, met along the story.
  { questId: 'nc-good-neighbour', after: 'prologue-fresh-kiln', why: 'Street events happen from the first minute.' },
  { questId: 'nc-strike-a-pose', after: 'prologue-fresh-kiln', why: 'Emotes need nothing but the gnome.' },
  { questId: 'nc-wheel-and-kit', after: 'first-contract', why: 'The first contract hands out guns; the wheel and the Pocket Kit come next.' },
  { questId: 'nc-lockup', after: 'ch1-mowers-keepers', why: 'The player has just met Tansy and her bay.' },
  { questId: 'nc-party', after: 'ch1-mowers-keepers', why: 'Optional and online only; offered early, skippable.' },
  { questId: 'nc-mind-the-verges', after: 'ch1-two-coat-tail', why: 'After the tail to Patio Heights, where the golf cart lives.' },
  { questId: 'nc-bent-pin', after: 'ch1-tax-break-in', why: 'A calm hobby after the first heist; the canal is just south of town.' },
  { questId: 'nc-skyway', after: 'ch1-founders-boot', why: 'End of chapter 1: the player can drive well enough for the deck.' },
  { questId: 'nc-odd-jobs', after: 'ch1-founders-boot', why: 'Chapter 2 costs Acorns; the sim jobs earn them.' },
  { questId: 'nc-take-off', after: 'ch2-dew-run', why: 'Chapter 2 opens the Dust Flats and the airfield.' },
  { questId: 'nc-sky-spotting', after: 'ch2-dew-run', why: 'Once the player has looked up from the road.' },
  { questId: 'nc-tuft-and-tally', after: 'ch2-sprinkler-gauntlet', why: 'Out in the wilds by now; the lodge is in Mossy Wood.' },
  { questId: 'nc-last-stop-pebblewick', after: 'ch2-sprinkler-gauntlet', why: 'Pebblewick is past the Dust Flats, open since the dew run.' },
  { questId: 'nc-reedwatch', after: 'ch2-vespers-offer', why: "Loch Moss is near; a quiet one after Vesper's offer." },
  { questId: 'nc-hangar-and-boathouse', after: 'ch2-unmowed-tablet', why: 'The player can afford a big shed by the end of chapter 2.' },
  // The Fizz Cup at the Lost & Found Speedway (races.ts): each race also needs the one before it (its prereq).
  { questId: 'race-rookie-mowdown', after: 'ch2-dew-run', why: 'Chapter 2 opens the Dust Flats roads; a ride-on race for newcomers.' },
  { questId: 'race-lowrider-derby', after: 'ch2-unmowed-tablet', why: 'End of chapter 2: the Carburettors notice the player.' },
  { questId: 'race-snail-endurance', after: 'ch3-tundra-drift-run', why: 'After the chapter 3 drift run; Shelldon is back in town.' },
  { questId: 'race-fizz-cup-final', after: 'ch4-runway-flares', why: 'Chapter 4 is set at the airfield next door to the Speedway.' },
  // E14 dirt country (dirtRaces.ts). The story quests E04 planned (#40/#42) do not exist yet, so each hangs on an existing beat
  // with room under the two-per-beat cap; re-time to #42 / #40 when E21 builds them. Each also needs its prereq.
  { questId: 'race-rutbottom-knobbly', after: 'ch2-sprinkler-gauntlet', why: 'Rootwell opens by chapter 2; a first dirt-bike heat. Re-time to #42 when E21 builds it.' },
  { questId: 'sq-rutbottom-heats', after: 'ch4-runway-flares', why: 'The Carburettors\x27 lowriders are out of the impound by chapter 4. Re-time to #42 when E21 builds it.' },
  { questId: 'race-capwood-open', after: 'ch4-sandpit-drop', why: 'The Fells and Capwood are well open by now. Re-time to #40 when E21 builds it.' },
  { questId: 'sq-capwood-cap-count', after: 'ch5-even-cut', why: 'A quiet walk once the story is done. Re-time to #40 when E21 builds it.' },
  // Pebblewick's side quests (outskirtsQuests.ts): the dry water line, then the humming combine.
  { questId: 'sq-weeping-line', after: 'ch3-kiln-resin-ice', why: 'Pebblewick plots need water; the dry line is found once the player has the tundra kiln run.' },
  { questId: 'sq-hum-at-three', after: 'ch4-spade-truce', why: 'The dunes hum at three once the spade truce has opened the eastern sand.' },
  // Saltbucket Shore's coast quests (coastQuests.ts): the spur to the sea opens with the airfield chapter.
  { questId: 'coast-spokewheel-gondola', after: COAST_UNLOCK_AFTER, why: "Marram's gondola wobbles; the coast spur is open once the runway is lit." },
  { questId: 'coast-boardwalk-tubing', after: COAST_UNLOCK_AFTER, why: "Driftwood's new slalom on the Saltwater; he has moved south from the Loch." },
  { questId: 'coast-bathtub-tours', after: 'ch4-sandpit-drop', why: "Captain Bilge's tours: late game, a relaxed run along the shore." },
  { questId: 'coast-queens-treasure', after: 'ch4-sandpit-drop', why: "Bilge's chart; its prereq (Pirate Tours, Mostly) does the rest." },
  // Snowcap Rise (winterQuests.ts). Temporary: the schedule has them after m38/m39 (act III, E20/E21), which do not exist yet.
  { questId: 'sq-snowdrop-sled-trials', after: 'ch3-tundra-drift-run', why: "Gentian Bootlace's ski class is north of the Fells; unlocked once the player has been north. E21 moves it to after m38-pail-pond." },
  { questId: 'sq-pail-pond-lines', after: 'ch3-tundra-drift-run', why: "Thermos Theo's shanty is on Pail Pond, north of the Fells. E21 moves it to after m39-couch-surfing." },
  // Hedgeworth Links (golfQuests.ts). Temporary: the schedule has them after m29/m49/m50/m52 (E20/E21 build those). Each also needs its prereq.
  { questId: 'sq-hedgeworth-lost-balls', after: 'ch2-unmowed-tablet', why: "Thrift's course is in the west yard behind the Kicked Board; unlocked at the end of chapter 2. E20 moves it to after m29-the-kicked-board." },
  { questId: 'sq-hedgeworth-pro-lesson', after: 'ch3-kiln-resin-ice', why: "Basil wants to see the swing of whoever came through the board (needs Lost Balls). E21 moves it to after m49-loamdeep." },
  { questId: 'sq-hedgeworth-ninth-green', after: 'ch3-tundra-drift-run', why: "Thrift's moles under the ninth green (needs Lost Balls). E21 moves it to after m50-trellisdown-tasting." },
  { questId: 'sq-hedgeworth-members-cup', after: 'ch4-runway-flares', why: "Peony's cup, on the first of the month (needs the pro's lesson). E21 moves it to after m52-the-test-cut." },
  // Founders' Green (sportsQuests.ts). Temporary: the schedule has them after #14 m14-drainpipe-court / #15; E20 moves it.
  { questId: 'sq-court-regulars', after: 'ch1-founders-boot', why: "Swish's court is in Founders' Green, open once the player has been through the park. The schedule has it after #14 m14-drainpipe-court / #15; E20 moves it." },
  { questId: 'sq-gutter-bowls-sessions', after: 'ch1-founders-boot', why: "Fennel's Gutter Bowls are in Founders' Green, open once the player has been through the park. The schedule has it after #14 m14-drainpipe-court / #15; E20 moves it." },
  // Rootwell (rootwellQuests.ts). Temporary: the schedule has them after m47/m48 (acts II-IV, E20-E22), which do not exist yet.
  { questId: 'sq-rootwell-lost-essay', after: 'ch4-spade-truce', why: 'Rootwell is past the Dust Flats, open once the spade truce has opened the eastern sand. E21 moves it to after m47-hedgeworth-links.' },
  { questId: 'sq-anthill-rent', after: 'ch4-spade-truce', why: "The ants' rent is late once the eastern sand is open. E21 moves it to after m48-the-groundskeepers-secret." },
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
  'rutbottom-clary': '#e8c27a',
  'rutbottom-teasel': '#d8342c',
  'capwood-lulu': '#8e44ad',
  'capwood-warden': '#7fbf5a',
  thrift: '#7bc45a',
  basil: '#f2c230',
  peony: '#c9a9e8',
  lovage: '#c9a227',
  betony: '#8fa8ff',
};

/** A giver's side-quest colour, '#3ad1c4' for one not in SIDE_COLORS. */
export function sideColor(giverId: string): string {
  return SIDE_COLORS[giverId] ?? '#3ad1c4';
}
