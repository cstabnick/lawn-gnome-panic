// E26: where the street-race meets stand. Each meet is a dressing area wholly off the road, with its people inside it and
// the flag-dropper and crowd along the kerb of tracks[0]'s grid. Contract: StreetMeet in ./types.ts. The spots were laid
// out against the real world (roads, buildings, water) and meets.test.ts keeps them honest.
import type { MeetId, StreetMeet } from './types';

export const MEETS: Readonly<Record<MeetId, StreetMeet>> = {
  // Open ground north of the West Road, a short walk from the Skyway's west foot. The grid of tracks[0] (the Skyway Sprint)
  // is the ground road below the ramp, so the flag-dropper stands on the verge beside it. The Carburettors come after dark.
  'skyway-foot': {
    id: 'skyway-foot', name: 'The Skyway Foot', centre: { x: -292, z: -60 }, area: { x: -292, z: -60, hw: 22, hd: 22 },
    tracks: ['skyway-sprint', 'kerb-row-circuit', 'ring-road-run'],
    organiser: { x: -292.7, z: -64.2, yaw: 0.52 }, bookie: { x: -296.2, z: -62.2, yaw: 0.52 }, flagger: { x: -272.3, z: -17.3, yaw: 0.52 },
    crowd: [
      { x: -295.1, z: -3.7, yaw: 0.6 }, { x: -290, z: -7.1, yaw: 0.59 }, { x: -284.9, z: -10.4, yaw: 0.57 }, { x: -279.7, z: -13.7, yaw: 0.55 },
      { x: -267.2, z: -20.9, yaw: 0.49 }, { x: -261.4, z: -23.8, yaw: 0.43 }, { x: -254.9, z: -26.3, yaw: 0.29 }, { x: -246.4, z: -27.2, yaw: -0.07 },
    ],
    residents: [{ x: -288.7, z: -72.3, yaw: 0.52 }, { x: -304.3, z: -63.3, yaw: 0.52 }],
    vignettes: [{ x: -279.2, z: -63.8, yaw: 0.52 }, { x: -301.8, z: -50.9, yaw: 0.52 }, { x: -298.9, z: -72.2, yaw: 0.52 }],
    signs: [{ x: -273, z: -57, yaw: 0.52 }, { x: -280.7, z: -50.3, yaw: 0.52 }, { x: -289.4, z: -45.4, yaw: 0.52 }, { x: -299.1, z: -42.1, yaw: 0.52 }],
    night: true,
  },
  // The paving west of the Boulevard, where the Boucle starts; the road is closed for the day, the geraniums are not.
  pardonlin: {
    id: 'pardonlin', name: 'Quai de la Boucle', centre: { x: -1724, z: -91 }, area: { x: -1724, z: -91, hw: 15, hd: 15 },
    tracks: ['pardonlin-boucle'],
    organiser: { x: -1727.9, z: -92.8, yaw: 1.5 }, bookie: { x: -1728.2, z: -88.8, yaw: 1.5 }, flagger: { x: -1706.3, z: -83.5, yaw: 1.5 },
    crowd: [
      { x: -1705.2, z: -109.5, yaw: 1.5 }, { x: -1705.6, z: -103.5, yaw: 1.5 }, { x: -1706, z: -97.6, yaw: 1.5 }, { x: -1706.5, z: -91.6, yaw: 1.5 },
      { x: -1707.4, z: -77.6, yaw: 1.5 }, { x: -1707.8, z: -71.7, yaw: 1.5 }, { x: -1708.3, z: -65.7, yaw: 1.49 }, { x: -1708.8, z: -59.8, yaw: 1.49 },
    ],
    residents: [{ x: -1729.7, z: -97.6, yaw: 1.5 }, { x: -1730.6, z: -85.3, yaw: 1.5 }],
    vignettes: [{ x: -1721.3, z: -99.7, yaw: 1.5 }, { x: -1722.6, z: -82, yaw: 1.5 }, { x: -1733.5, z: -91.7, yaw: 1.5 }],
    signs: [{ x: -1715.1, z: -100.6, yaw: 1.5 }, { x: -1714.2, z: -93.7, yaw: 1.5 }, { x: -1714.7, z: -86.9, yaw: 1.5 }, { x: -1716.6, z: -80.2, yaw: 1.5 }],
  },
  // A sandy lay-by east of the band road, south of the anthill roundabout; the Dash starts on the road beside it.
  saltbucket: {
    id: 'saltbucket', name: 'The Saltbucket Lay-By', centre: { x: 975, z: 140 }, area: { x: 975, z: 140, hw: 22, hd: 22 },
    tracks: ['saltbucket-dash'],
    organiser: { x: 979, z: 141.4, yaw: -1.54 }, bookie: { x: 978.9, z: 137.4, yaw: -1.54 }, flagger: { x: 949.3, z: 113.8, yaw: -1.54 },
    crowd: [
      { x: 949.1, z: 87.7, yaw: -1.54 }, { x: 949.3, z: 93.7, yaw: -1.54 }, { x: 949.5, z: 99.7, yaw: -1.54 }, { x: 949.8, z: 105.7, yaw: -1.54 },
      { x: 950.2, z: 119.8, yaw: -1.54 }, { x: 950.4, z: 125.8, yaw: -1.54 }, { x: 950.5, z: 131.8, yaw: -1.54 }, { x: 950.7, z: 137.8, yaw: -1.55 },
    ],
    residents: [{ x: 984.2, z: 148.7, yaw: -1.54 }, { x: 983.7, z: 130.8, yaw: -1.54 }],
    vignettes: [{ x: 972.4, z: 153.1, yaw: -1.54 }, { x: 971.6, z: 127.1, yaw: -1.54 }, { x: 989, z: 139.6, yaw: -1.54 }],
    signs: [{ x: 963.4, z: 155.3, yaw: -1.54 }, { x: 961.1, z: 145.4, yaw: -1.54 }, { x: 960.9, z: 135.4, yaw: -1.54 }, { x: 962.6, z: 125.3, yaw: -1.54 }],
  },
};

/** The meet whose tracks include this street route, or null. */
export function meetOfTrack(trackId: string): StreetMeet | null {
  return Object.values(MEETS).find((m) => (m.tracks as readonly string[]).includes(trackId)) ?? null;
}
