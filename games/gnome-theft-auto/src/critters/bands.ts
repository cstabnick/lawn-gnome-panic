// Small wildlife in the outer bands and a few old regions (E31): hares and hedgehogs in Trellisdown, hares on
// Snowcap Rise, crabs on the Saltbucket beach, frogs and ducks at Loch Moss, butterflies in the Tallgrass and the dunes.
// No deer (E16 owns those). Pure data: the runtime does the wandering; centres are nudged to open land at spawn.
import type { RegionLife, SpawnGroup } from '../critters';

const g = (
  id: string, kind: SpawnGroup['kind'], region: SpawnGroup['region'], x: number, z: number, count: number,
  spread: number, leash: number,
): SpawnGroup => ({ id, kind, region, x, z, count, spread, leash });

export const bandsLife: RegionLife = {
  id: 'bands',
  groups: [
    // Trellisdown (west-estates): hares in the open verges, hedgehogs under the hedges.
    g('bands-hares-trellis-nw', 'hare', 'west-estates', -1320, -420, 3, 8, 30),
    g('bands-hares-trellis-mid', 'hare', 'west-estates', -1150, 200, 3, 8, 30),
    g('bands-hares-trellis-sw', 'hare', 'west-estates', -1300, 300, 2, 6, 25),
    g('bands-hedgehogs-trellis-a', 'hedgehog', 'west-estates', -1300, 150, 2, 4, 12),
    g('bands-hedgehogs-trellis-b', 'hedgehog', 'west-estates', -1100, 330, 2, 4, 12),

    // Snowcap Rise (north-highlands): hares on the lower slopes.
    g('bands-hares-snowcap-west', 'hare', 'north-highlands', -900, -1100, 3, 8, 30),
    g('bands-hares-snowcap-mid', 'hare', 'north-highlands', 200, -980, 3, 8, 30),
    g('bands-hares-snowcap-east', 'hare', 'north-highlands', 600, -1150, 3, 8, 30),

    // Saltbucket Shore (south-shore): crabs on the beach (the boardwalk at x 0 stays quiet), butterflies in the dunes.
    g('bands-crabs-beach-1', 'crab', 'south-shore', -800, 1165, 4, 6, 20),
    g('bands-crabs-beach-2', 'crab', 'south-shore', -500, 1165, 4, 6, 20),
    g('bands-crabs-beach-3', 'crab', 'south-shore', 400, 1165, 4, 6, 20),
    g('bands-crabs-beach-4', 'crab', 'south-shore', 700, 1165, 4, 6, 20),
    g('bands-butterflies-dunes-west', 'butterfly', 'south-shore', -350, 1095, 3, 8, 30),
    g('bands-butterflies-dunes-east', 'butterfly', 'south-shore', 500, 1095, 3, 8, 30),

    // Loch Moss: frogs and a few ducks at the shore.
    g('bands-frogs-loch-west', 'frog', 'loch-moss', -830, -680, 3, 4, 14),
    g('bands-frogs-loch-east', 'frog', 'loch-moss', -540, -690, 3, 4, 14),
    g('bands-ducks-loch', 'duck', 'loch-moss', -700, -680, 3, 4, 14),

    // Tallgrass Commons: butterflies over the long grass.
    g('bands-butterflies-tallgrass-west', 'butterfly', 'tallgrass-commons', -850, 600, 3, 8, 30),
    g('bands-butterflies-tallgrass-south', 'butterfly', 'tallgrass-commons', -600, 800, 3, 8, 30),

    // Turfton's Mallard Mere: no duck group. The pond is a park mesh, not terrain water (waterAt is null there).
  ],
};
