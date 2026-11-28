// Tuning for the player's garages (the Side-Valve Lock-Up) and the Sling-Lift delivery helicopter. Every number the
// lockup system uses lives here, so it can be tweaked without reading the gameplay code.
import { SIDE_VALVE } from '../config';
import type { EstateKind, LocalRect, LockupSite, StorageKind } from './types';

export const LOCKUP = {
  /** localStorage key (also in saveIO.ts GTA_SAVE_KEYS, so it is in the cloud save). */
  saveKey: 'gta-lockup-v1',
  /** Slots per storage kind: the Lock-Up (ground), Hangar Two (air) and the Mossbank Boathouse (water). The air and water
   *  slots always load (so a save is never truncated); the runtime only lets the player use them once the estate is bought. */
  capacity: { ground: 5, air: 3, water: 3 } as Record<StorageKind, number>,
  /** Where a vehicle can be driven in to store it. A later hangar / boathouse adds a site with its own storageKind. */
  sites: [
    {
      id: 'side-valve-lockup', name: 'Side-Valve Lock-Up', storageKind: 'ground',
      // 16 m along the forecourt from the Side-Valve tuning bay (whose E / T reach is 10 m), so the two never overlap.
      x: SIDE_VALVE.bay.x + 16, z: SIDE_VALVE.bay.z, radius: 6,
    },
    // Hangar Two (ESTATES.hangar, centre (480, -64), open to -z): its floor and the apron in front of the door.
    { id: 'hangar-two', name: 'Hangar Two', storageKind: 'air', x: 480, z: -70, radius: 10 },
    // The Mossbank Boathouse (ESTATES.boathouse, centre (-690, -566), open to -z): the slip, reachable on foot through
    // the back door (dry shore at z -559) and by boat from the loch (1 m deep from z -572).
    { id: 'mossbank-boathouse', name: 'Mossbank Boathouse', storageKind: 'water', x: -690, z: -569, radius: 11 },
  ] as readonly LockupSite[],
  /** Scrapping a stored vehicle pays this many Acorns times its hit points (0..1), rounded. */
  scrapValue: 60,
  delivery: {
    /** Acorns per Sling-Lift call. */
    fee: 70,
    /** Seconds after a delivery lands before the next can be called. */
    cooldownS: 45,
    /** Safe-spot search around the player: ring distances (m) and the vehicle's clear radius. */
    minDist: 6,
    maxDist: 40,
    /** Marooned (no spot within maxDist): search this far before giving up. */
    searchMax: 140,
    clearRadius: 2.6,
    /** Steepest ground allowed (rise over run) and deepest water (m) at the drop point. */
    maxSlope: 0.35,
    maxWater: 0.05,
    /** Aircraft (Hangar Two). Rotor craft and the balloon are lowered on clear flat ground like a mower, with a wider
     *  clear radius; fixed-wing craft need a take-off strip (findStripSpot), else they go to the Desert Airfield. */
    air: {
      fee: 140,
      clearRadius: 4.5,
      maxSlope: 0.25,
      strip: { radius: 4, length: 60, minDist: 8, maxDist: 60, searchMax: 160, maxSlope: 0.12, maxWater: 0.05 },
    },
    /** Boats (the Mossbank Boathouse): lowered onto open water at least minDepth deep near the player. */
    water: { fee: 100, clearRadius: 3.2, minDepth: 1.0, minDist: 4, maxDist: 40, searchMax: 160 },
  },
  sling: {
    /** The chopper is the Whirligig prefab (whirligig-mower, a rotor pivot named 'rotor') at this scale. */
    prefab: 'whirligig-mower',
    scale: 2.6,
    /** It appears this far from the drop point (m), flying in at cruise height above the drop point's ground. */
    spawnDist: 170,
    cruiseHeight: 32,
    /** It hovers this high above the drop point while it lowers the load. */
    hoverHeight: 16,
    /** Flight speed in and out (m/s), climb rate out (m/s), lowering speed of the load (m/s). */
    speedIn: 30,
    speedOut: 38,
    climbOut: 8,
    lowerSpeed: 4,
    /** Rope from the skids to the load when it starts lowering (m). */
    ropeMin: 3,
    /** Seconds it waits after setting the load down before it flies off; seconds it flies off before it is removed. */
    releaseS: 0.8,
    outboundS: 5,
  },
} as const;

/**
 * The garages a gnome buys (docs/roadmaps/gta-hangar-boathouse.md). Positions are world metres; every rectangle is in
 * the building's own frame (x across, z depth, open side +z) and is turned by `yaw` about (x, z). yaw PI = open to -z.
 */
export const ESTATES = {
  /** localStorage key of the deeds (also in saveIO.ts GTA_SAVE_KEYS and cloudSave.ts MERGES). */
  saveKey: 'gta-estates-v1',
  /** Achievements (packages/achievements catalog.ts). */
  achievements: { both: 'gta-landed-gnome', hangarFull: 'gta-hangar-full', boathouseFull: 'gta-boathouse-full' },
  hangar: {
    kind: 'air' as EstateKind,
    /** The LockupSite id in LOCKUP.sites. */
    siteId: 'hangar-two',
    name: 'Hangar Two',
    /** Acorns. Sold by Wind-Sock Wally. */
    price: 1800,
    /** Prefab (packages/prefabs gta-hangar-boathouse.ts): 24 wide, 14 deep, 9 tall, open on +z, roller door rolled up. */
    prefab: 'hangar-two',
    /** East of the old hangar (428, -64), same line, door facing the runway. */
    x: 480, z: -64, yaw: Math.PI,
    /** Wall colliders, h above the floor: back wall, two side walls, two door pillars (the 18 m door gap stays open). */
    walls: [
      { minX: -12, maxX: 12, minZ: -7, maxZ: -6.6, h: 7.5 },
      { minX: -12, maxX: -11.6, minZ: -7, maxZ: 7, h: 7.5 },
      { minX: 11.6, maxX: 12, minZ: -7, maxZ: 7, h: 7.5 },
      { minX: -12, maxX: -9.8, minZ: 6.6, maxZ: 7, h: 7.5 },
      { minX: 9.8, maxX: 12, minZ: 6.6, maxZ: 7, h: 7.5 },
    ] as readonly LocalRect[],
    /** Concrete floor and apron (flat, LAYER.area): inside the walls and 12 m out in front of the door. */
    apron: { minX: -11.6, maxX: 11.6, minZ: -6.6, maxZ: 19 },
    /** A windsock prefab beside the apron, building frame. */
    windsock: { dx: 15, dz: 12 },
  },
  boathouse: {
    kind: 'water' as EstateKind,
    siteId: 'mossbank-boathouse',
    name: 'Mossbank Boathouse',
    /** Acorns. Let by Driftwood, who keeps the Loch Moss dock. */
    price: 1200,
    /** Prefab (gta-hangar-boathouse.ts; its origin is the post feet, the deck top 2.5 above): 10 wide, 16 deep, a slip, open on +z (to the loch),
     *  a back door 2.2 wide in the middle of the back wall. Origin = walkway deck top, centre of the footprint. */
    prefab: 'boathouse',
    /** On the south shore of Loch Moss, 25 m east of the Driftwood dock (-715, -564). Back wall on the dry shore (z -558),
     *  front over 1.3 m of water (z -574). */
    x: -690, z: -566, yaw: Math.PI,
    /** The origin (walkway deck top) stands this far above the loch's surface (bodyLevel('water/loch-moss'), about -0.65). */
    deckAboveWater: 0.9,
    /** Wall colliders, h above the deck: two side walls and the back wall either side of the back door. */
    walls: [
      { minX: -5, maxX: -4.7, minZ: -8, maxZ: 8, h: 4 },
      { minX: 4.7, maxX: 5, minZ: -8, maxZ: 8, h: 4 },
      { minX: -5, maxX: -1.1, minZ: -8, maxZ: -7.7, h: 4 },
      { minX: 1.1, maxX: 5, minZ: -8, maxZ: -7.7, h: 4 },
    ] as readonly LocalRect[],
    /** Walkway colliders (stand-on decks; boats bump them): top at the deck (h 0). */
    walkways: [
      { minX: -4.7, maxX: -3.2, minZ: -8, maxZ: 8, h: 0 },
      { minX: 3.2, maxX: 4.7, minZ: -8, maxZ: 8, h: 0 },
    ] as readonly LocalRect[],
  },
} as const;
