// What finished story quests reveal: map markers (blips on the minimap and big map), journal items (the Quest
// Journal's Items tab) and grants (E22: a vehicle put in the player's garage, a garage deed signed over). One pure data
// table; app.ts and journal.ts read it. No DOM, no imports from app.ts.
import type { VehicleKind } from '../types';

export interface StoryMarker { label: string; x: number; z: number }
export interface StoryItem { id: string; title: string; text: string }
/**
 * E22: something a finished story quest gives for keeps. app.ts applies each grant once its quest is done (also for an
 * old save that finished it before grants existed): a deed ('air' Hangar Two, 'water' the Mossbank Boathouse) is given
 * free when not owned; a vehicle is put in its garage when the player has no stored or out vehicle of that name (so a
 * written-off one comes back on the next load). `note` is the toast shown when it is given.
 */
export interface StoryGrant {
  id: string;
  deed?: 'air' | 'water';
  vehicle?: { kind: VehicleKind; name: string; tint: number };
  note: string;
}
export interface StoryMarks { markers?: readonly StoryMarker[]; items?: readonly StoryItem[]; grants?: readonly StoryGrant[] }

/**
 * Finished quest id -> what it reveals. E20/E21/E22 leads add rows; quest writers report them.
 * Skipped on purpose: m24-the-burrow-door (the Burrow Door) and m25-one-leg-to-stand-on (Wader's Rest) already have
 * fixed blips in mapPois.ts.
 */
export const STORY_MARKS: Readonly<Record<string, StoryMarks>> = {
  'm17-the-dew-buyer': { markers: [{ label: 'Trellisdown Vineyard gate', x: -1140, z: -86 }] },
  'm26-the-knot-hole': { markers: [{ label: 'The Fence gap (knot-hole)', x: -583.5, z: -119 }] },
  'm29-the-kicked-board': { markers: [{ label: 'The Kicked Board', x: -1001, z: 640 }] },
  'm32-driftwoods-chart': {
    markers: [{ label: 'The dune line', x: 693, z: 926 }],
    items: [{
      id: 'driftwoods-chart',
      title: "Driftwood's chart",
      text: 'The canal does not end at the Puddle Sea. Past the dunes, the Saltwater.',
    }],
  },
  // E21 rows 36-53 (added by the E21 lead)
  'ch3-kiln-resin-ice': {
    items: [{ id: 'tansys-scroll', title: "Tansy's scroll", text: 'Vesper builds the Combine in parts, out at the edges. Find friends there. - T.' }],
  },
  'm38-pail-pond': {
    markers: [
      { label: 'The deck: Hedgeworth Links', x: -1060, z: 446 },
      { label: 'The guidance: Rootwell', x: 1145, z: -202 },
      { label: 'The power: Pinwheel Ridge', x: 850, z: -1200 },
      { label: 'The money: Trellisdown', x: -1140, z: -86 },
    ],
    items: [{ id: 'sock-map', title: 'The sock map', text: 'A woolly sock inked with four red crosses: deck at Hedgeworth, guidance at Rootwell, power at Pinwheel Ridge, money at Trellisdown.' }],
  },
  'm41-pinwheel-ridge': { markers: [{ label: "Pinwheel Ridge, Ragwort's hut", x: 860, z: -1239 }] },
  'm42-rutbottom-impound': {
    markers: [{ label: 'Rutbottom Dirt Bowl, the impound pit', x: 1020, z: -684 }],
    // E22: E21 could only say it; the impounded Knobbly is the player's for keeps.
    grants: [{ id: 'impound-knobbly', vehicle: { kind: 'dirt-bike', name: 'Impound Knobbly', tint: 0xd8342c }, note: 'Clary signed the impounded Knobbly over to you. It waits in the Lock-Up.' }],
  },
  'm43-saltbucket-boardwalk': { markers: [{ label: "The Last Tube, Driftwood's hut", x: 150, z: 1155 }] },
  'm44-the-bathtub-queen': {
    markers: [{ label: 'The Bathtub Queen, the sea route', x: 300, z: 1268 }],
    items: [{ id: 'spare-blades', title: 'Spare blades', text: "One crate of the Combine's spare mower blades, taken off an HOA barge for the Bathtub Queen." }],
  },
  'm46-starfall-at-the-anthill': {
    items: [{ id: 'guidance-lens', title: 'The guidance lens', text: 'Betony\'s lens, chalked "B. Sextant" on its ring; under it an HOA work order approved by Dean Inkwell.' }],
  },
  'm50-trellisdown-tasting': {
    markers: [{ label: 'Brassknock Manor', x: -1150, z: 20.5 }],
    items: [{ id: 'ledger-photo', title: "Photograph of the Countess's ledger", text: "The Countess's signature on six harvests of Combine money: the money part is a vineyard's." }],
  },
  'm51-the-flock-stands': {
    markers: [{ label: 'The Standing Lady, Hedgeworth', x: -1063, z: 598 }],
    items: [{ id: 'test-date', title: 'The test date', text: "The Combine will test its blade at Hedgeworth on the night of the backers' gala, says Mother Saxifrage. The Flock will stand." }],
  },
  'm52-the-test-cut': {
    items: [{ id: 'even-cut-date', title: 'The date of the Even Cut: the longest day', text: 'Vesper named it over every loudspeaker in Turfton, the night his deck cut its test line across Hedgeworth.' }],
  },
  'ch3-tundra-drift-run': {
    items: [{ id: 'stopping-stone', title: 'The Stopping Stone', text: "Elder Bracken's Stone, lent not given: the only thing that ever stopped a machine. Bring it back uncracked." }],
  },
  // E22 rows 54-70 (added by the E22 lead)
  'm54-the-heist-board': {
    markers: [{ label: "Wally's caravan", x: 466, z: -76 }],
    items: [{ id: 'heist-board', title: 'The Heist Board', text: "Tansy's plan: air power, the Whirligig, three sides of Fort Sandpit." }],
  },
  'm58-the-reeves-barn': { markers: [{ label: "The reeve's hay barn, Pebblewick", x: 706, z: 34 }] },
  'm60-the-moles-dig': { markers: [{ label: 'Fort Sandpit dig mouth', x: 392, z: 46 }] },
  'm61-diggs-medal': {
    markers: [{ label: "Diggs's bungalow", x: 615, z: 208 }, { label: 'HOA lost-property shed', x: 399.7, z: 58.4 }],
    items: [{ id: 'diggs-rosters', title: "Diggs's Rosters", text: 'Fifteen years of guard rosters on a bungalow wall, and one empty nail. Not empty now.' }],
  },
  'm62-cams-cell': {
    markers: [{ label: 'The HOA lockup, Double Pot Tunnel', x: 117, z: -97 }],
    items: [{ id: 'combine-pa-code', title: "The Combine's PA code", text: "Cam's code, and the Combine's route along the meridian on a folded map. He would not say it out loud." }],
  },
  'm63-four-taps': {
    markers: [{ label: 'Café Pardon, Teacup Row', x: -1522.5, z: 143 }],
    items: [{ id: 'mayors-pen', title: "The Mayor's pen", text: 'The Mulch Club fountain pen that signed the emergency counter-order. Streaky. The ink matches nothing.' }],
  },
  'm64-all-hats-p2': {
    markers: [{ label: 'The Bobble beacon', x: 697, z: -1688 }],
    items: [{ id: 'bobble-beacon', title: 'The beacon on the Bobble', text: "Hogweed's beacon on the Hatbrim's summit, the highest ground in the yard, to be lit at dawn on the longest day." }],
  },
  'm64-all-hats': {
    markers: [{ label: 'The coalition camp', x: 246, z: 82 }],
    items: [{ id: 'all-hats', title: 'All hats', text: "Every outcast at one table: the Carburettors, the Underspanners, the Unmowed, the Burrowfolk, the Spade Guard, the Flock and Granny. The Countess's peg waits." }],
  },
  'm65-the-countess-relents': {
    markers: [{ label: 'Ranger Station, the Unmown', x: -1552, z: -1139 }],
    items: [{ id: 'shield-grate-key', title: 'The Shield Grate Key', text: "A brass key as long as an arm, with the Brassknock crest. It opens the Grand Combine's outer grates." }],
  },
  'm66-porcelain-hearts': {
    markers: [{ label: "Clara's sealed porch", x: -552, z: 42 }],
    items: [{ id: 'porch-photograph', title: 'The Photograph', text: 'Two gnomes on a porch step; the one in the top hat has a hairline crack under the brim. Clara gave it to you.' }],
  },
  'm67-emergency-assessment': {
    markers: [{ label: 'City Hall side door', x: 9, z: -88 }],
    items: [{ id: 'side-door-key', title: "Reginald's side-door key", text: 'A service-door key, filed to a quarter-inch. He did not report it.' }],
  },
  'm68-lights-out': {
    items: [{ id: 'pips-toolbox', title: "Pip's toolbox", text: 'His red toolbox, kept shut, on the roof the night before the Even Cut.' }],
  },
  'm69-the-combine-wakes': {
    items: [{ id: 'hyssops-lollipop', title: "Hyssop's lollipop", text: 'Her old crossing-warden stop sign. She held up the Grand Combine with it for one second.' }],
  },
  'ch5-even-cut': {
    items: [{ id: 'vespers-top-hat', title: "Vesper's top hat", text: 'Tall, black, a porcelain band. It came off at the crossing. It hangs on the coalition rail now.' }],
  },
  'ch4-runway-flares': {
    grants: [
      { id: 'hangar-two-deed', deed: 'air', note: 'Wind-Sock Wally signed Hangar Two over to the crew. Planes you keep live there now.' },
      { id: 'crew-crop-duster', vehicle: { kind: 'plane', name: "The Crew's Crop Duster", tint: 0xf2c230 }, note: "The Crop Duster is the crew's plane now. It waits in Hangar Two." },
    ],
  },
};

/** Markers of every finished quest, in table order, deduplicated by label. */
export function storyMarkers(isDone: (questId: string) => boolean): StoryMarker[] {
  const seen = new Set<string>();
  const out: StoryMarker[] = [];
  for (const [id, marks] of Object.entries(STORY_MARKS)) {
    if (!marks.markers || !isDone(id)) continue;
    for (const m of marks.markers) {
      if (seen.has(m.label)) continue;
      seen.add(m.label);
      out.push(m);
    }
  }
  return out;
}

/** Grants of every finished quest, in table order, deduplicated by id. */
export function storyGrants(isDone: (questId: string) => boolean): StoryGrant[] {
  const seen = new Set<string>();
  const out: StoryGrant[] = [];
  for (const [id, marks] of Object.entries(STORY_MARKS)) {
    if (!marks.grants || !isDone(id)) continue;
    for (const g of marks.grants) {
      if (seen.has(g.id)) continue;
      seen.add(g.id);
      out.push(g);
    }
  }
  return out;
}

/** Items of every finished quest, in table order (later rows last), deduplicated by id. */
export function storyItems(isDone: (questId: string) => boolean): StoryItem[] {
  const seen = new Set<string>();
  const out: StoryItem[] = [];
  for (const [id, marks] of Object.entries(STORY_MARKS)) {
    if (!marks.items || !isDone(id)) continue;
    for (const it of marks.items) {
      if (seen.has(it.id)) continue;
      seen.add(it.id);
      out.push(it);
    }
  }
  return out;
}
