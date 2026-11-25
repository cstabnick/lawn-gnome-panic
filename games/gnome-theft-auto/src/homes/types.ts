// Character homes and workplaces (E10, L58): the shared types and the fixed spots E10 builds on. Pure data.
// Contract: docs/roadmaps/gta-batch-3/E10/contracts.md. The table of every character is homes/data.ts.
// World coordinates: +x east, +z south, metres; yaw 0 faces +z (a facing vector is (sin yaw, cos yaw)).

/**
 * How a home exists in the world.
 * - 'flat': the player's Flat 3B (interior, home/).
 * - 'facade': E10 builds the outside (a house front, door, name plate, mailbox, a window lit at night).
 * - 'interior': like 'facade', plus a walk-in room (E05 defineInterior, homes/interiors.ts).
 * - 'existing': a stage or building already in the game is the home (no new build).
 * - 'site': an area epic (E11-E17) builds it on its own site later; the row is data only for now.
 * - 'hidden': never shown (R: "some may never be acknowledged"); data only.
 */
export type HomeKind = 'flat' | 'facade' | 'interior' | 'existing' | 'site' | 'hidden';

export interface HomeDef {
  /** CAST id (quests/stages.ts), CITY_CAST key (city/cityCast.ts), or a bible id not in either yet (e.g. 'hyssop'). */
  characterId: string;
  /** The home as gnomes would say it: "a narrow terrace on Kerb Row". */
  name: string;
  /** Where it stands: an E01 site id ('home-01', 'saucer-court'), 'stage:<stage id>', 'site:<site id>' (area epic), or null. */
  where: string | null;
  /** The spot outside the front door (world x, z) and the yaw a gnome faces when walking OUT of it; null = no place. */
  door: [number, number, number] | null;
  kind: HomeKind;
  /** True = a recognisable place in the world (the bible's "ack"); false = exists only in data. */
  acknowledged: boolean;
  /** E05 interior id when it can be walked into. */
  interiorId?: string;
  /** Door-plate text (built homes), e.g. "J. VANCE". */
  plate?: string;
}

export interface WorkDef {
  characterId: string;
  /** "City Hall", "Bodega & Sons". */
  name: string;
  /** A walkable spot at the workplace (world), or null when it has no place yet (an area epic builds it). */
  at: [number, number] | null;
  /** The stage id (quests/stages.ts) when the workplace is a stage. */
  stage?: string;
}

/**
 * The front-door spots of the homes E10 builds (world x, z, yaw facing out of the door). Fixed here so quests can
 * import them before the builders run. Sites from E01 (src/sites.ts); the door is outside the site rectangle, on the
 * pavement or path, never inside a collider.
 */
export const HOME_DOORS = {
  /** home-01 (-90, 140), 24 x 16: Juniper Vance's narrow terrace on Kerb Row, door on the north side to the street at z 120. */
  juniper: [-90, 130.5, Math.PI],
  /** home-02 (80, -150), 20 x 30: the Mayor's Residence, door on the SOUTH side (+z) to the street at z -120. */
  'mayor-mulch': [80, -133.5, 0],
  /** home-03 (102, -150), 16 x 24: Reginald Vance's townhouse 404, door on the south side (+z), same street. */
  reginald: [102, -136.5, 0],
  /** home-04 (-150, 30), 20 x 20: Mabel's flat over the Kerbstone Cabs garage, door east to the street at x -120. */
  mabel: [-138.5, 30, Math.PI / 2],
  /** home-05 (-400, 50), 24 x 24: Sorrel's cottage, Mossy Wood, door east toward her radio booth (-352, 12). */
  sorrel: [-386.5, 50, Math.PI / 2],
  /** home-06 (615, 220), 24 x 24: Diggs' tin bungalow, south of Pebblewick, door north toward the town. */
  diggs: [615, 206.5, Math.PI],
  /** home-07 (45, 260), 24 x 24: Fence-Post Frank's shack behind the south welcome sign, door west to Route South. */
  frank: [31.5, 260, -Math.PI / 2],
} as const satisfies Record<string, readonly [number, number, number]>;

/**
 * Saucer Court (site 'saucer-court', (30, 90), 42 x 42; rect x 9..51, z 69..111): the player's block of flats, rebuilt
 * by E10 as three low wings round the Tall-One saucer courtyard (lore: saucer-court.md), open to the street on the south.
 * Wings: west x 9..19, east x 41..51 (both z 69..111), north x 19..41, z 69..79. Courtyard x 19..41, z 79..111.
 */
export const SAUCER_COURT = {
  rect: { minX: 9, maxX: 51, minZ: 69, maxZ: 111 },
  /** The stairwell door to flats 3A and 3B, on the north wing's courtyard face (the Flat 3B interior door). */
  stairDoor: { x: 30, z: 80.6, yaw: Math.PI },
  /** Where the player stands on leaving Flat 3B (in the courtyard, facing south). */
  exit: { x: 30, z: 82.5, yaw: 0 },
  /** The saucer set into the courtyard. */
  saucer: { x: 30, z: 97, r: 7.5 },
  /** Hyssop Doormat's flat 3A front window looks over the courtyard from here (ground floor, north wing). */
  hyssopWindow: { x: 24, z: 79.2 },
} as const;

/** The First Kiln Bank counter spot (world): the pavement in front of the bank tower in block (90, 90). */
export const BANK_COUNTER = { x: 101, z: 113, yaw: Math.PI } as const;
