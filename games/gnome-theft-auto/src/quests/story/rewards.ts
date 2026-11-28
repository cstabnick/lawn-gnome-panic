// GR5 / D46 (FX21): what a quest pays, shown (not said) as a reward chip on the comms briefing card and the journal
// cards. The acorns come from QuestDef.rewardAcorns; the non-money part (a key, a hat, a favour, a place that opens)
// comes from REWARD_EXTRAS, short labels from the reward column of docs/design/gnome-theft-auto/story-outline.md.
// Pure data plus one builder; no DOM.
import type { QuestDef } from '../types';

/** Quest id -> the non-money rewards, each a short label (at most 4 words, sentence case, no full stop). */
export const REWARD_EXTRAS: Readonly<Record<string, readonly string[]>> = {
  'prologue-fresh-kiln': ["Side-Valve Salvage"],
  'm02-roof-on-credit': ["Flat 3B"],
  'first-contract': ["Wiseguy Hat"],
  'm09-where-asphalt-sleeps': ["Bottlecap pendant"],
  'm10-under-the-span': ["Radio jammer"],
  'm13-diner-on-route-south': ["Diner speed boost"],
  'm14-drainpipe-court': ["Pip's toolbox"],
  'ch1-founders-boot': ["Founders' Green opens"],
  'ch2-dew-run': ["Kiln-Debt cleared", "Cloverfield jobs"],
  'm17-the-dew-buyer': ["Vineyard gate mapped"],
  'ch2-sprinkler-gauntlet': ["Forged HOA permits"],
  'm19-squall-box-forecast': ["Barrow buggy"],
  'm21-penthouse-viewing': ["Penthouse key"],
  'm22-off-air': ["Sorrel's booth call point"],
  'ch2-unmowed-tablet': ["Unmowed Hollow opens"],
  'm24-the-burrow-door': ["Burrow Door mapped", "A favour from Sorrel"],
  'm25-one-leg-to-stand-on': ["Wader's Rest mapped"],
  'm26-the-knot-hole': ["Fence gap mapped"],
  'm27-heap-of-trouble': ["Snowcap Rise hinted"],
  'm29-the-kicked-board': ["Kicked Board mapped"],
  'm30-cams-big-night': ["Entry money, someday"],
  'm31-granny-cracks': ["Glaze Clinic quick-heal"],
  'm32-driftwoods-chart': ["Dune line mapped", "Driftwood's chart"],
  'm33-the-bench-lock': ["Bench lock"],
  'm34-forty-seven-wrenches': ["Party props"],
  'ch3-salvage-raid': ["Frostbite Fells opens"],
  'ch3-kiln-resin-ice': ["Pip's arm mended", "Tansy's scroll", "Snowcap Rise opens"],
  'm37-snowdrop-slope': ["Woolly Sock Lodge", "Free-ski slope"],
  'm38-pail-pond': ["Act map", "Ice fishing"],
  'm39-couch-surfing': ["Pip's on your couch", "Culvert save point"],
  'm40-the-capwood-run': ["Capwood Run race"],
  'm41-pinwheel-ridge': ["Ragwort's hut opens"],
  'm42-rutbottom-impound': ["Dirt bike", "Dirt Bowl racing"],
  'm43-saltbucket-boardwalk': ["Boardwalk opens", "Driftwood's hut"],
  'm44-the-bathtub-queen': ["Crew's sea route", "Spare blades"],
  'm45-rootwell-admissions': ["Student badge", "Anthill on map"],
  'm46-starfall-at-the-anthill': ["Anthill Observatory opens", "Wally's charters"],
  'm47-hedgeworth-links': ["Hedgeworth Links open", "Peony's trust"],
  'm48-the-groundskeepers-secret': ["Basil as an ally", "Thrift's shed hideout"],
  'm49-loamdeep': ["Burrowfolk join", "Loamdeep opens", "DJ Moleman's track"],
  'm50-trellisdown-tasting': ["Brassknock Manor marked", "Waiter outfit"],
  'm51-the-flock-stands': ["The Flock allied", "Standing Lady kept"],
  'm52-the-test-cut': ["Even Cut date"],
  'ch3-tundra-drift-run': ["Dust Flats Overlook"],
  'm54-the-heist-board': ["Heist Board", "Wally joins"],
  'ch4-runway-flares': ["Crop Duster plane"],
  'm56-mortar-for-a-mower': ["Mortar and parachute rig", "Parachute parts vendor"],
  'ch4-sandpit-drop': ["Whirligig joins crew"],
  'm58-the-reeves-barn': ["Whirligig in the barn", "Pebblewick friendly"],
  'ch4-spade-truce': ["Spade Guard allied"],
  'm60-the-moles-dig': ["Armory tool wall"],
  'm61-diggs-medal': ["Diggs's Rosters"],
  'm62-cams-cell': ["Combine PA code"],
  'm63-four-taps': ["Mulch Club joins", "Mayor's pen"],
  'm64-all-hats': ["Coalition camp"],
  'm65-the-countess-relents': ["Shield Grate Key"],
  'm66-porcelain-hearts': ["The Photograph"],
  'm67-emergency-assessment': ["Juniper rejoins", "Reginald's side-door key"],
  'm68-lights-out': ["Pip's toolbox"],
  'm69-the-combine-wakes': ["Hyssop's lollipop"],
};

export interface RewardChip {
  /** Acorns paid on completion (QuestDef.rewardAcorns, default 250; 0 = a non-money reward only). */
  acorns: number;
  /** Non-money rewards, in the order shown. */
  extras: readonly string[];
  /** One line for the chip: "🌰 300 · Whirligig pilot", or the extras alone when no acorns are paid. */
  text: string;
}

/** The reward chip of a quest. Parts (`<id>-p1`, ...) have their own entry or none. */
export function rewardChip(q: Pick<QuestDef, 'id' | 'rewardAcorns'>): RewardChip {
  const acorns = q.rewardAcorns ?? 250;
  const extras = REWARD_EXTRAS[q.id] ?? [];
  const text = [acorns > 0 ? `🌰 ${acorns}` : '', ...extras].filter(Boolean).join(' · ');
  return { acorns, extras, text };
}
