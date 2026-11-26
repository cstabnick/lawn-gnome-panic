// What finished story quests reveal: map markers (blips on the minimap and big map) and journal items (the Quest
// Journal's Items tab). One pure data table; app.ts and journal.ts read it. No DOM, no imports from app.ts.

export interface StoryMarker { label: string; x: number; z: number }
export interface StoryItem { id: string; title: string; text: string }
export interface StoryMarks { markers?: readonly StoryMarker[]; items?: readonly StoryItem[] }

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
  'm42-rutbottom-impound': { markers: [{ label: 'Rutbottom Dirt Bowl, the impound pit', x: 1020, z: -684 }] },
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
