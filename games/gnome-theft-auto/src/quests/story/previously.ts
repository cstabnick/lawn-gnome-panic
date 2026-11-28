// GR4 / D45 (FX21): the story so far, one journal line per story row, in the narrator's voice (second person, past
// tense, the spine's "Previously" column of docs/design/gnome-theft-auto/story-outline.md after a voice pass). Shown on
// the journal's Active card, never spoken: characters do not say "Previously". Keyed by the row's own quest id; a
// row's parts (`<id>-p1`, ...) share it. Pure data plus two lookups; no DOM.
import type { QuestDef, QuestSave } from '../types';
import { isBeforeTheEvenCut } from '../questSave';

/** Row quest id -> the journal's "previously" line (one sentence or two, no label, ends with a full stop). */
export const PREVIOUSLY: Readonly<Record<string, string>> = {
  'prologue-fresh-kiln': "You stepped off a bus with nothing but a crate that hums.",
  'm02-roof-on-credit': "You took a loan you couldn't afford, because a bench isn't a home.",
  'first-contract': "You owed the bank, and the Don was the quickest way to pay.",
  'ch1-mowers-keepers': "The first contract paid off some of the debt. Then the HOA came for Tansy's bikes.",
  'm05-sweepers-wages': "Tansy's bay was safe for the night, and Cam had a favour to ask.",
  'ch1-two-coat-tail': "Tansy's bay was safe for now, and Cam was back at his sweeping.",
  'm07-even-estates': "You caught the Mayor taking Vesper's coat, and Juniper wanted to know where the money went.",
  'ch1-tax-break-in': "You saw where the money goes, and Tansy wanted her deed.",
  'm09-where-asphalt-sleeps': "You'd cracked a lot of hats, and Bodega needed a gentler job.",
  'm10-under-the-span': "Bodega was happy, and Pip had a plan he wouldn't explain.",
  'm11-the-dons-cigars': "You owed the bank, and now the Don owed the HOA, which made a pleasant change.",
  'm12-quarter-inch-at-home': "Juniper saw Reginald's name on the permits and couldn't bring herself to ask him.",
  'm13-diner-on-route-south': "Tansy lent you out, and the debt was a lunch.",
  'm14-drainpipe-court': "Sage paid in a meal, and Frank named Granny Gnertrude as the one gnome Vesper couldn't buy.",
  'ch1-founders-boot': "You kept a boot float away from the HOA and cracked a tribunal.",
  'ch2-dew-run': "You crashed the tribunal on the Boot float, and Founders' Green opened with the wrong scissors.",
  'm17-the-dew-buyer': "You ambushed the Black Dew convoy and brought Granny her hauler. The Dew kept going missing anyway.",
  'ch2-sprinkler-gauntlet': "You followed the Dew west to Trellisdown. Somebody rich was buying it, and Granny meant to find out who.",
  'm19-squall-box-forecast': "The foreclosure team was gone and the farm was quiet. Only a rooster was still shouting.",
  'ch2-vespers-offer': "Rooster's barometer said a white hat was coming to the diner.",
  'm21-penthouse-viewing': "You refused Vesper at the diner, and he didn't threaten you, which was somehow worse.",
  'm22-off-air': "You refused the penthouse and left the city.",
  'ch2-unmowed-tablet': "Sorrel played her rain on the air, and you followed it west.",
  'm24-the-burrow-door': "The Hollow was quiet, and Pip was still stung.",
  'm25-one-leg-to-stand-on': "You'd waved Driftwood off at the sprinklers. Now he was your client.",
  'm26-the-knot-hole': "The Elder called Pip a traitor, and Pip hadn't said a word about it since.",
  'm27-heap-of-trouble': "The Elder wanted the plates for the Stone. Now you could see where the rest of them went.",
  'm28-sibling-rivalry': "You'd seen the permits before, on the Even-Estates run. Now the siblings who signed them wouldn't look at each other.",
  'm29-the-kicked-board': "You'd found one gap in the Fence, and now there was a second.",
  'm30-cams-big-night': "At the Skyway meet, Cam stared at Lulu's charter plate, and you saw an envelope you didn't understand.",
  'm31-granny-cracks': "Granny's farm was safe, and her foreclosure signs had been torn down.",
  'm32-driftwoods-chart': "Driftwood started as Granny's problem and ended up your client.",
  'm33-the-bench-lock': "Hogweed built your first jammer under the Span, and the Dewdrop prototype had been rolling past ever since.",
  'm34-forty-seven-wrenches': "Tansy's bay survived, and Founders' Green was open.",
  'ch3-salvage-raid': "You set the bench lock, and Cam watched.",
  'ch3-kiln-resin-ice': "The Salvage Raid cost the crew the shop, the Acorn and Pip's arm.",
  'm37-snowdrop-slope': "Tansy's scroll said to find friends at the edges.",
  'm38-pail-pond': "The crew had a bunk at the lodge and no plan.",
  'm39-couch-surfing': "The crew had a map of four parts and had to get back into Turfton unseen.",
  'm40-the-capwood-run': "At the Skyway meet, Cam couldn't stop staring at Lulu's charter plate. Later, he took the charter.",
  'm41-pinwheel-ridge': "Lulu had the Carburettors clear of the HOA and drove you to the next edge. Power was the first part to cut.",
  'm42-rutbottom-impound': "Lulu led the loyal Carburettors and needed their rides back before the Combine closed the roads.",
  'm43-saltbucket-boardwalk': "Driftwood had seen the sea's glow and couldn't cross. Now he had.",
  'm44-the-bathtub-queen': "Driftwood read the markings on the barges: they carried the Combine's blades.",
  'm45-rootwell-admissions': "Bilge's flag was up, and the next part to cut was guidance.",
  'm46-starfall-at-the-anthill': "Betony's lens was taken for the Combine's line, and Lovage let the HOA in.",
  'm47-hedgeworth-links': "The Combine's deck needed a test site, and Peony had no idea.",
  'm48-the-groundskeepers-secret': "Moles hid at Hedgeworth because gnomes misread them, and Basil had hated them since a final.",
  'm49-loamdeep': "Tumblesoil had thanked you at the Burrow Door, and now he needed hands.",
  'm50-trellisdown-tasting': "Granny's Dew went west, and you glimpsed the Countess behind it.",
  'm51-the-flock-stands': "The Flock had prophesied the Even Cut, and now they were ready to name the day.",
  'm52-the-test-cut': "The Flock, the moles and Peony were at Hedgeworth for the test, and the crew held the other three parts.",
  'ch3-tundra-drift-run': "The Combine cut its test line, and Vesper named the date.",
  'm54-the-heist-board': "You got the Stopping Stone down to the Dust Flats uncracked. Tansy wanted air power, and the air was at Fort Sandpit.",
  'ch4-runway-flares': "You scouted the fort and fetched Wally.",
  'm56-mortar-for-a-mower': "You dropped the flares, and the Unmowed were in position.",
  'ch4-sandpit-drop': "Hogweed fitted the mortar and the parachute rig.",
  'm58-the-reeves-barn': "You stole the Whirligig, and Diggs was on your tail.",
  'ch4-spade-truce': "You stole the Whirligig and hid it in Pebblewick.",
  'm60-the-moles-dig': "Diggs joined, and the armory stayed sealed.",
  'm61-diggs-medal': "The Guard was with you, and the moles had opened the armory.",
  'm62-cams-cell': "You took the Spade Guard fort, and Cam's charter turned out to be a lie.",
  'm63-four-taps': "Cam's charter was a lie, and you'd settled what to do about him. Either way, the Combine's code was yours.",
  'm64-all-hats': "Don Compost's crews were in, and the coalition needed one table.",
  'm65-the-countess-relents': "The whole coalition was at the overlook, and the Countess had just learned what the Even Line meant.",
  'm66-porcelain-hearts': "The Countess's key was yours, and Clara's old friend was the Combine's face.",
  'm67-emergency-assessment': "Clara asked you to stop Vesper without shattering him, and Reginald's doubt was about to pay off.",
  'm68-lights-out': "Juniper was out of City Hall, and the night before the Even Cut had arrived.",
  'm69-the-combine-wakes': "You spent the night before the Even Cut at Saucer Court.",
  'ch5-even-cut': "The Combine woke and turned onto the meridian.",
};

/** The "previously" line of a quest: its own `previously`, else its row's (parts share the row's), else undefined. */
export function previouslyOf(q: Pick<QuestDef, 'id' | 'previously'>): string | undefined {
  return q.previously ?? PREVIOUSLY[q.id] ?? PREVIOUSLY[q.id.replace(/-p\d+$/, '')];
}

/** The line as the journal shows it: D7 frames an act IV row met after the finale as "Before the Even Cut: ...". */
export function previouslyLine(q: Pick<QuestDef, 'id' | 'previously'>, saves: Record<string, QuestSave>): string | undefined {
  const line = previouslyOf(q);
  if (!line) return undefined;
  return isBeforeTheEvenCut(q.id, saves) ? `Before the Even Cut: ${line}` : line;
}
