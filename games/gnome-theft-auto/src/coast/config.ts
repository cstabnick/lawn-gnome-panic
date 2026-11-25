// Saltbucket Shore's coast (E11, docs/roadmaps/gta-batch-3/E11/roadmap.md): the Saltwater, the boardwalk, Long Spoon
// Pier, the Spokewheel, the Bathtub Queen and the Last Tube (tubing and water-skiing on the sea). Pure data: every
// position the coast modules, quests, map and later epics (E18 pacing, E21 set pieces) read. World coordinates: +x east,
// +z south, metres. Heights are absolute world y unless the name says otherwise.
//
// The ground: the Saltwater's surface sits at about y -8.9 (water.ts bodyLevel(COAST.ocean)), its north shore at z ~1190;
// the beach runs z 1140..1190 and falls from y ~-4.3 to the water; the boardwalk slot (flat) is at y ~-4.24.

/** Still-water body id of the Saltwater (water marker in south-shore.level.json, WATER.bodies, WAVES.bodyGain 1.6). */
export const OCEAN_ID = 'water/saltwater';
/** The channel from the Puddle Sea's south shore to the Saltwater (a water path, WATER.order between the two). */
export const SALTCUT_ID = 'saltcut';

/** An axis-aligned rectangle, world metres. */
export interface Rect { minX: number; maxX: number; minZ: number; maxZ: number }
export interface Spot { x: number; z: number; yaw?: number }

export const COAST = {
  ocean: OCEAN_ID,
  /** North shore of the open sea (the water starts about here at x -1000..1000). */
  shoreZ: 1190,

  /** Saltbucket Boardwalk: the plank promenade (site `boardwalk`, flat). Deck top = ground + deckLift. */
  boardwalk: {
    rect: { minX: -210, maxX: 210, minZ: 1092, maxZ: 1138 } as Rect,
    /** Where the coast spur arrives (0, 1060) and the boardwalk steps begin. */
    entrance: { x: 0, z: 1090, yaw: Math.PI } as Spot,
    deckLift: 0.22,
    /** Six stalls along the north edge, fronts facing south (+z) onto the promenade. Lore: saltbucket-boardwalk.md. */
    stalls: [
      { id: 'spun-sugar-sal', name: "Spun Sugar Sal's", x: -150, z: 1100, yaw: 0 },
      { id: 'plank-and-pickle', name: 'Plank & Pickle', x: -95, z: 1100, yaw: 0 },
      { id: 'tin-shy', name: 'Tin Shy', x: -40, z: 1100, yaw: 0 },
      { id: 'scoop-and-spade', name: 'Scoop & Spade', x: 40, z: 1100, yaw: 0 },
      { id: 'lucky-limpet', name: 'The Lucky Limpet', x: 95, z: 1100, yaw: 0 },
      { id: 'boardwalk-office', name: "Marram's Office", x: 150, z: 1100, yaw: 0 },
    ] as const,
    /** Lamp posts every lampStep m along both long edges. */
    lampStep: 30,
  },

  /** Long Spoon Pier: a giant spoon laid out to sea from the boardwalk's east end. Deck is a walkable rooftop
   *  (interiors/rooftops.ts addRooftop, solid: false) at a constant height. */
  pier: {
    /** The handle: x 296..304 from the boardwalk spur south to the bowl. */
    handle: { minX: 296, maxX: 304, minZ: 1120, maxZ: 1236 } as Rect,
    /** The bowl at the sea end (square walkable area, drawn as an oval). */
    bowl: { minX: 289, maxX: 311, minZ: 1236, maxZ: 1254 } as Rect,
    /** The plank spur joining the boardwalk's east end to the handle (on the ground, flat site). */
    spur: { minX: 210, maxX: 304, minZ: 1120, maxZ: 1130 } as Rect,
    deckY: -3.0,
    /** Marram Teaspoon's hut on the handle (west side of the bowl). */
    marramHut: { x: 292, z: 1244, yaw: Math.PI / 2 } as Spot,
  },

  /** The Spokewheel (site `ferris-wheel`, (-260, 1100) 60 x 60). The wheel turns in the x-y plane (faces +-z). */
  spokewheel: {
    x: -260, z: 1100,
    /** Hub height above the ground at (x, z), metres; rim radius (gondola pivots), m. */
    hubH: 21, radius: 18,
    gondolas: 12,
    /** Seconds per full turn (spokewheelAngle is a pure function of waveTime(), nothing to sync online). */
    periodS: 96,
    /** Boarding platform in front of the lowest gondola (E prompt "Ride the Spokewheel"). */
    board: { x: -260, z: 1106, yaw: Math.PI } as Spot,
    fare: 3,
  },

  /** The Bathtub Queen, moored south of the pier bowl, hull long axis along x (bow +x). Deck is a walkable rooftop. */
  ship: {
    x: 300, z: 1268,
    /** Deck rectangle (walkable) and its height (= pier deck, so the gangplank is level). */
    deck: { minX: 276, maxX: 324, minZ: 1260, maxZ: 1276 } as Rect,
    deckY: -3.0,
    /** The gangplank from the bowl (z 1254) to the deck's north rail (z 1260). */
    gangplank: { minX: 297, maxX: 303, minZ: 1253, maxZ: 1261 } as Rect,
    /** Captain Samphire Bilge's cabin door on the aft deck (E05 interior 'bathtub-queen-cabin'). */
    cabinDoor: { x: 288, z: 1268, yaw: Math.PI / 2 } as Spot,
    /** Where the treasure chest of the treasure quest sits (cabin, local coordinates of the interior). */
    treasureLocal: [3, -2] as [number, number],
    cannons: [
      { x: 290, z: 1275.2, yaw: 0 }, { x: 304, z: 1275.2, yaw: 0 }, { x: 318, z: 1275.2, yaw: 0 },
    ] as Spot[],
  },

  /** The Last Tube: Driftwood's tube and ski hut on the beach west of the pier. */
  lastTube: {
    hut: { x: 150, z: 1150, yaw: Math.PI } as Spot,
    /** The rack (E prompt): rent a tube or skis; the rider starts in the water just south of it. */
    rack: { x: 150, z: 1172 } as Spot,
    /** Where a rented tube / skis are put in the water, and where Driftwood's tow boat waits. */
    launch: { x: 150, z: 1224, yaw: Math.PI } as Spot,
    tubeFare: 8,
    skiFare: 11,
  },

  /** Calm water (waves.ts calm spots, registered before the water mesh is built): the pier end and the launch. */
  calmSpots: [
    { x: 300, z: 1258, r: 26 },
    { x: 150, z: 1224, r: 18 },
  ],

  /** The ocean ski and tube course: a slalom of buoy gates heading east (+x), then the wake ramp. All in >= 1.5 m water. */
  slalom: { startX: -380, endX: -30, z: 1312, swing: 14, gates: 6, width: 12 },
  /** The floating wake ramp (a rider crossing it heading +x is thrown up). */
  wakeRamp: { x: 40, z: 1312, yaw: Math.PI / 2, length: 6, width: 4, kick: 7.5 },
  /** Driftwood's tow loop (NPC tow boat for solo riders), m: out west in deep water clear of the course, round, then
   *  east through every slalom gate centre (OCEAN_GATES: x -380..-30 step 70, z 1298 / 1326), over the wake ramp, and
   *  back to the launch, keeping west of the Bathtub Queen (x >= 276). */
  towLoop: [
    [150, 1234], [60, 1262], [-100, 1385], [-450, 1385], [-490, 1330], [-440, 1300],
    [-386, 1298], [-374, 1298], [-316, 1326], [-304, 1326], [-246, 1298], [-234, 1298],
    [-176, 1326], [-164, 1326], [-106, 1298], [-94, 1298], [-36, 1326], [-24, 1326],
    [10, 1312], [90, 1312], [160, 1300], [200, 1262],
  ] as [number, number][],
  towSpeed: 13,

  /** Sea mist and gulls are E06 / E09; coast ambience spots for sound/ambience (playAt ids from sound/ids.ts). */
  soundSpots: {
    surf: [[-400, 1188], [0, 1188], [400, 1188]] as [number, number][],
    buoyBell: [[-200, 1330], [300, 1290]] as [number, number][],
  },
} as const;

/** Quest ids (quests/coastQuests.ts). E18 pacing reads COAST_QUESTS; every id starts with `coast-`. */
export const COAST_QUESTS = [
  'coast-spokewheel-gondola',
  'coast-boardwalk-tubing',
  'coast-bathtub-tours',
  'coast-queens-treasure',
] as const;
export type CoastQuestId = (typeof COAST_QUESTS)[number];

/** The `coast` unlock: the story quest after which Saltbucket's side quests are offered (quests/unlocks.ts rows).
 *  Placeholder on today's story; E20/E21 move it to spine rows #45/#46 (side-quest-schedule.md). */
export const COAST_UNLOCK_AFTER = 'ch4-runway-flares';

/** Achievement ids (packages/achievements catalog, game 'gnome-theft-auto'). */
export const COAST_ACH = {
  /** Water-ski 2000 m in total (increment by whole metres). */
  waterSkier: 'gta-salt-skier',
  /** On skis, 1 s or more in the air off the wake ramp. */
  wakeJump: 'gta-wake-jumper',
  /** Ride the Spokewheel one full turn. */
  fullCircle: 'gta-full-circle',
  /** Find the Bathtub Queen's treasure (coast-queens-treasure). */
  treasure: 'gta-queens-treasure',
  /** Finish Pirate Tours, Mostly (coast-bathtub-tours). */
  tours: 'gta-shiver-me-glaze',
} as const;
