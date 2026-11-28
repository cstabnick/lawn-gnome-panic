// Where Radio Adagio is heard on foot in Pardonlin (E30): the Opera Hall's loudspeaker, café gramophones, the
// bandstand. app.ts plays the station from the nearest one in range when no car radio is nearer (radio/spatial.ts).
// The props themselves (gramophones, horn speakers) are placed by the district plans at these points.
export interface TownSpeaker { id: string; label: string; x: number; y: number; z: number }

export const TOWN_SPEAKERS: readonly TownSpeaker[] = [
  // The Opera Hall (Radio Adagio) on the Left Bank: a horn speaker on a post in its forecourt (prefab pl-horn-speaker).
  { id: 'adagio-door', label: 'Radio Adagio', x: -1684, y: 4, z: -106 },
  // A gramophone on Café Pardon's terrace table, Teacup Row.
  { id: 'teacup-gramophone', label: 'Teacup Row', x: -1525.5, y: 1.2, z: 143.5 },
  // The Grand Platz bandstand.
  { id: 'platz-bandstand', label: 'the Grand Platz', x: -1500, y: 1.5, z: -235 },
  // The Beetle Market's crackling stall radio.
  { id: 'market-radio', label: 'the Beetle Market', x: -1733, y: 1.2, z: 170 },
];

/** The nearest town speaker within `maxDist` (xz) of (x, z), or null. */
export function nearestTownSpeaker(x: number, z: number, maxDist: number): TownSpeaker | null {
  let best: TownSpeaker | null = null;
  let bd = maxDist;
  for (const s of TOWN_SPEAKERS) {
    const d = Math.hypot(s.x - x, s.z - z);
    if (d < bd) { bd = d; best = s; }
  }
  return best;
}
