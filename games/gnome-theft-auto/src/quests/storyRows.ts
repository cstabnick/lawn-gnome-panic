// The 70 rows of the main story (docs/roadmaps/gta-batch-3/E04/spine.md), by quest id. Rows that are not built yet are
// listed too, so side-quest pacing (pacing.ts), the unlock table's `planned` beats (unlocks.ts) and world changes
// (worldChanges.ts) can name them before E20-E22 write them. Pure data, no imports.

/** Main quest id -> spine row (1..70). */
export const STORY_ROWS: Readonly<Record<string, number>> = {
  'prologue-fresh-kiln': 1, 'm02-roof-on-credit': 2, 'first-contract': 3, 'ch1-mowers-keepers': 4,
  'm05-sweepers-wages': 5, 'ch1-two-coat-tail': 6, 'm07-even-estates': 7, 'ch1-tax-break-in': 8,
  'm09-where-asphalt-sleeps': 9, 'm10-under-the-span': 10, 'm11-the-dons-cigars': 11, 'm12-quarter-inch-at-home': 12,
  'm13-diner-on-route-south': 13, 'm14-drainpipe-court': 14, 'ch1-founders-boot': 15,
  'ch2-dew-run': 16, 'm17-the-dew-buyer': 17, 'ch2-sprinkler-gauntlet': 18, 'm19-squall-box-forecast': 19,
  'ch2-vespers-offer': 20, 'm21-penthouse-viewing': 21, 'm22-off-air': 22, 'ch2-unmowed-tablet': 23,
  'm24-the-burrow-door': 24, 'm25-one-leg-to-stand-on': 25, 'm26-the-knot-hole': 26, 'm27-heap-of-trouble': 27,
  'm28-sibling-rivalry': 28, 'm29-the-kicked-board': 29, 'm30-cams-big-night': 30, 'm31-granny-cracks': 31,
  'm32-driftwoods-chart': 32, 'm33-the-bench-lock': 33, 'm34-forty-seven-wrenches': 34, 'ch3-salvage-raid': 35,
  'ch3-kiln-resin-ice': 36, 'm37-snowdrop-slope': 37, 'm38-pail-pond': 38, 'm39-couch-surfing': 39,
  'm40-the-capwood-run': 40, 'm41-pinwheel-ridge': 41, 'm42-rutbottom-impound': 42, 'm43-saltbucket-boardwalk': 43,
  'm44-the-bathtub-queen': 44, 'm45-rootwell-admissions': 45, 'm46-starfall-at-the-anthill': 46,
  'm47-hedgeworth-links': 47, 'm48-the-groundskeepers-secret': 48, 'm49-loamdeep': 49,
  'm50-trellisdown-tasting': 50, 'm51-the-flock-stands': 51, 'm52-the-test-cut': 52, 'ch3-tundra-drift-run': 53,
  'm54-the-heist-board': 54, 'ch4-runway-flares': 55, 'm56-mortar-for-a-mower': 56, 'ch4-sandpit-drop': 57,
  'm58-the-reeves-barn': 58, 'ch4-spade-truce': 59, 'm60-the-moles-dig': 60, 'm61-diggs-medal': 61,
  'm62-cams-cell': 62, 'm63-four-taps': 63, 'm64-all-hats': 64, 'm65-the-countess-relents': 65,
  'm66-porcelain-hearts': 66, 'm67-emergency-assessment': 67, 'm68-lights-out': 68, 'm69-the-combine-wakes': 69,
  'ch5-even-cut': 70,
};

/** The spine row of a main quest id, or undefined (a side quest, or an id not in the spine). */
export function storyRow(id: string): number | undefined {
  return STORY_ROWS[id];
}

/** The act of a row: I = 1-15, II = 16-35, III = 36-53, IV = 54-70. */
export function actOfRow(row: number): 1 | 2 | 3 | 4 {
  return row <= 15 ? 1 : row <= 35 ? 2 : row <= 53 ? 3 : 4;
}

/**
 * Side-quest pacing (docs/design/gnome-theft-auto/side-quest-schedule.md): at most this many side quests are offered at
 * once with the story at `row` (the furthest finished main row; 0 before the first). 3 in act I, 4 in act II, 6 after.
 */
export function offerCap(row: number): number {
  return row <= 15 ? 3 : row <= 35 ? 4 : 6;
}

/** An offered side quest stays offered for its own beat and the next three main quests, then moves to the Later shelf. */
export const OFFER_WINDOW = 4;
