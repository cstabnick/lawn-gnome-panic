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
