// Shared contracts for Snigms. Every module imports its types from here; nothing here has behaviour.
// World coordinates: x east, z south, y up. One tile is 1 x 1 units; tile (tx, ty) covers x in [tx, tx+1], z in [ty, ty+1].
// A grid VERTEX (vx, vy) is the tile corner at world (vx, vy). Walls live on tile EDGES, between two vertices.

export type NeedId = 'hunger' | 'energy' | 'bladder' | 'hygiene' | 'fun';
export type Needs = Record<NeedId, number>; // each 0 (desperate) .. 100 (full)

export type EdgeKind = 'wall' | 'door' | 'window';
/** 'h:x,y' = the edge from vertex (x,y) to (x+1,y) (runs east, between tile (x,y-1) above and tile (x,y) below).
 *  'v:x,y' = the edge from vertex (x,y) to (x,y+1) (runs south, between tile (x-1,y) left and tile (x,y) right). */
export type EdgeKey = string;

export type FloorKind = 'lawn' | 'wood' | 'tile' | 'carpet' | 'stone';
/** Quarter turns clockwise seen from above. Rot 0: the item's front faces +z (south). 1: faces -x (west). 2: faces -z (north). 3: faces +x (east). */
export type Rot = 0 | 1 | 2 | 3;

export interface PlacedItem {
  id: number; // unique within the lot, from lot.nextId
  kind: string; // a key of FURNITURE in config.ts
  tx: number; // top-left tile of its (rotated) footprint
  ty: number;
  rot: Rot;
}

export interface Lot {
  w: number; // tiles east-west
  h: number; // tiles north-south
  edges: Record<EdgeKey, EdgeKind>;
  items: PlacedItem[];
  nextId: number;
  /** Painted floors keyed 'tx,ty'. Missing = 'lawn'. */
  floors: Record<string, FloorKind>;
}

export type RoomKind = 'bedroom' | 'bathroom' | 'kitchen' | 'living' | 'empty';
export interface Room {
  id: number;
  tiles: { tx: number; ty: number }[];
  kind: RoomKind; // from what is inside (see roomKind in world.ts)
  enclosed: boolean; // false if the flood fill reached the lot border (the outside)
}

export type TraitId = 'neat' | 'glutton' | 'sleepy' | 'goofy' | 'hustler';
export type JobId = 'gardener' | 'mailgnome' | 'chef' | 'mechanic';

export interface GnomeState {
  name: string;
  trait: TraitId;
  needs: Needs;
  job: JobId | null;
  jobLevel: number; // 0-based index into JOBS[job].levels
  shifts: number; // shifts worked at the current level
  /** Set while at work: the gnome is off the lot. Absolute sim minute (see Household.clock) the shift ends. */
  workUntil: number | null;
  /** Day number (see Household.clock) of the last shift started; 0 = never. Stops two shifts on one day. */
  lastShiftDay: number;
  /** Mood sampled across the current shift, for pay. */
  shiftMood: { sum: number; n: number };
  /** Which lot the gnome is on (when not travelling or at work). */
  where: Where;
  /** Set while on the road between home and town. `arriveAt` is an absolute sim minute. */
  trip: { to: Where; arriveAt: number } | null;
  /** Day number of the last free trip to town (stops a second evening out the same day). */
  lastTownDay: number;
  /** Temper 0..100. Low temper makes the gnome ignore suggestions and, at the bottom, crash out. */
  temper: number;
  /** A crash-out in progress: the gnome ignores every suggestion until `until` (absolute sim minute). */
  crash: { until: number } | null;
  /** Crash-outs so far (an achievement counts the first). */
  crashes: number;
  /** Friendship 0..100 per neighbour, keyed by PersonId. Missing = 0. */
  friends: Record<string, number>;
}

/** The two lots a gnome can be on. */
export type Where = 'home' | 'town';

export interface Household {
  version: 1;
  name: string;
  funds: number; // acorns
  /** Absolute sim minutes since day 1, 00:00. day = floor(clock / 1440) + 1, minuteOfDay = clock % 1440. */
  clock: number;
  gnome: GnomeState;
  lot: Lot;
}

export type Mode = 'live' | 'build' | 'furnish';
export type Speed = 0 | 1 | 2 | 3; // pause, then SPEEDS[1..3] in config.ts
export type WallsMode = 'up' | 'cut' | 'down';

export type Tool = 'select' | 'wall' | 'door' | 'window' | 'floor' | 'erase' | 'place';
export interface ToolState {
  tool: Tool;
  /** tool === 'place': the FURNITURE key being placed. */
  kind: string | null;
  /** tool === 'floor': the floor being painted. */
  floor: FloorKind;
  /** Rotation for the next placement. */
  rot: Rot;
}

export type SfxId = 'click' | 'place' | 'sell' | 'deny' | 'wall' | 'coin' | 'flush' | 'splash' | 'yawn' | 'ding' | 'door';

export type Pose = 'stand' | 'walk' | 'sit' | 'lie' | 'bathe' | 'cook';

/** What the gnome's 3D body offers the brain. Implemented in view.ts. */
export interface GnomePuppet {
  setPosition(x: number, z: number, y?: number): void;
  setFacing(yaw: number): void; // 0 = faces +z (south), then counter-clockwise seen from above like three's rotation.y
  setPose(p: Pose): void;
  setVisible(v: boolean): void;
  update(dt: number): void; // animates the pose (limb swing while 'walk')
}

export type FurnitureRoom = 'bedroom' | 'bathroom' | 'kitchen' | 'living' | 'decor' | 'town';
export type ActionId = 'sleep' | 'toilet' | 'wash' | 'bath' | 'shower' | 'snack' | 'cook' | 'tv' | 'read' | 'relax' | 'cafe';

export interface UseDef {
  action: ActionId;
  verb: string; // 'Sleeping in the bed'
  pose: Pose; // 'sit' | 'lie' | 'stand' | 'bathe' | 'cook'
  /** The gnome ends up at the item's centre ('on') or on the tile in front of it ('front'). */
  at: 'on' | 'front';
  /** Need change per SIM HOUR while using (positive fills). */
  rates: Partial<Record<NeedId, number>>;
  /** Longest use, in sim minutes. The brain stops sooner once the need that chose it is >= 95. */
  maxMinutes: number;
  /** Acorns spent per use (groceries). Default 0. */
  cost?: number;
  sfx?: SfxId;
}

export interface FurnitureDef {
  kind: string; // the key in FURNITURE
  prefab: string; // @lawn/prefabs id
  name: string;
  room: FurnitureRoom; // catalogue tab
  price: number; // acorns; selling returns SELL_RATIO of it
  w: number; // footprint tiles at rot 0 (x extent)
  d: number; // footprint tiles at rot 0 (z extent)
  /** Walk-over decor (a rug): does not block tiles or paths, may overlap other flat items only if not the same kind. */
  flat?: boolean;
  /** What the gnome can do with it. */
  use?: UseDef;
  /** Which room kind this counts toward in roomKind(). */
  counts?: Exclude<RoomKind, 'empty'>;
  /** Tint passed to buildPrefab, if any. */
  tint?: number;
}

export interface JobLevel {
  title: string;
  pay: number; // acorns per shift at mood 100
  shiftsToPromote: number; // shifts at this level before the next level (Infinity at the top)
}
export interface JobDef {
  id: JobId;
  name: string;
  blurb: string;
  startHour: number; // 0..23 the gnome leaves for work at this hour
  hours: number; // shift length in sim hours
  workdays: number[]; // day-of-week 0..6 (day 1 = 0) that are work days
  levels: JobLevel[];
}

export interface NewHouseholdOptions {
  householdName: string;
  gnomeName: string;
  trait: TraitId;
  lot: 'empty' | 'starter';
}

/** The one shared mutable object every module is handed (see main.ts). Modules read it, change their own fields, and call the callbacks. */
export interface App {
  h: Household;
  mode: Mode;
  speed: Speed;
  tool: ToolState;
  selected: number | null; // PlacedItem id
  walls: WallsMode;
  /** Brain writes, UI shows: 'Sleeping in the bed', 'Walking to the toilet', 'At work'. */
  activity: string;
  /** Call after any change to h.lot (walls, items, floors). main.ts rebuilds the view, re-plans the brain and saves. */
  lotChanged(): void;
  /** Call after any change to h.funds, needs, job (UI refresh + save). */
  stateChanged(): void;
  toast(msg: string): void;
  sfx(id: SfxId): void;
  /** Achievement hooks, wired in main.ts: event('first-wall'), event('promoted'), ... (names in config.ts EVENTS). */
  event(name: string, n?: number): void;
  /** The lot the gnome is on right now: the home lot, or the town lot when h.gnome.where is 'town'. */
  here(): Lot;
  /** A neighbour speaks: the chat bubble shows `line` under `speaker`. */
  say(speaker: string, line: string): void;
}
