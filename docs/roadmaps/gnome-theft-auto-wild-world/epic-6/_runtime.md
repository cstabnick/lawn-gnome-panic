# The critter runtime, for every Epic 6 region issue (pasted into each)

`games/gnome-theft-auto/src/critters.ts` (planner foundation, do not edit) runs every animal. A region's behaviour is a
`RegionLife` object in its own file under `src/critters/`; `src/critters/index.ts` lists them and `app.ts` already
creates the runtime and calls `critters.update(ctx)` every frame and `critters.hitTest(x, y, z)` for every bullet.

What the runtime already does for every critter (you do not write this):
- Spawns each `SpawnGroup` once at start (`count` members within `spread` of the open spot nearest `(x, z)` in
  `region`; members wander within `leash` of that centre, the group centre is each member's `homeX`/`homeZ`).
- Modes: `idle` -> `wander` (walk to a random goal in the leash) -> `idle`; `flee` (run from `fromX/fromZ`, or along
  `fleeDir` if set, for `modeT` s); `chase` (run at the player for `modeT` s); `down` (knocked over: falls on its side
  in a puff, lies `spec.downTime` s, gets up and flees); `script` (the runtime never moves it or sets its `y`; your
  code does).
- Frightens critters: a moving vehicle within `spec.scareVehicle`, the player on foot within `spec.scareFoot`.
- Knocks over a critter that a vehicle touches at 3+ units/s (cause `'vehicle'`), and any critter a bullet is inside
  (cause `'shot'`). Before the default knock-over it calls the owning life's `onHit`; return `true` to replace it.
- Ground: `y = heightAt(x, z) + (spec.flyHeight ?? 0)` unless in `script`. Never walks into water or boxes.
- LOD: frozen beyond 260 units of the player, mesh built lazily and shown within 190, animated within 70.
- Animates prefab pivots by name: `leg-0..3`, `wing-0..1`, `tail`, `head`, `body`.

```ts
// src/critters.ts (exports you use)
export type CritterKind = 'cow' | 'sheep' | 'pig' | 'hen' | 'squirrel' | 'polar-bear' | 'bee';
export const CRITTER_SPECS: Record<CritterKind, CritterSpec>;  // prefab, scale, radius, height, walk, run, turn, scareFoot, scareVehicle, puff, downTime, flyHeight?, calm?
export type CritterMode = 'idle' | 'wander' | 'flee' | 'chase' | 'down' | 'script';
export type HitCause = 'shot' | 'vehicle' | 'blast' | 'foot';
export interface Critter {
  readonly id: number; readonly kind: CritterKind; readonly spec: CritterSpec; readonly region: RegionId; readonly group: string;
  x: number; y: number; z: number; yaw: number; speed: number;
  homeX: number; homeZ: number; leash: number;
  mode: CritterMode; modeT: number; goalX: number; goalZ: number; fromX: number; fromZ: number;
  fleeDir: { x: number; z: number } | null; tip: number; object: THREE.Group | null; phase: number;
  data: Record<string, unknown>;   // your scratch space
}
export interface SpawnGroup { id: string; kind: CritterKind; region: RegionId; x: number; z: number; count: number; spread: number; leash: number }
export interface CritterCtx {
  dt: number; time: number; playerX: number; playerY: number; playerZ: number;
  playerVehicle: Vehicle | null; playerSpeed: number /* on foot, units/s; 0 in a vehicle */;
  vehicles: readonly Vehicle[]; world: World; night: number /* 0 day .. 1 night */;
}
export type CritterEvent = 'cow-tipped' | 'herd-herded' | 'drey-raid' | 'drey-mower-stolen' | 'drey-scattered'
  | 'snowman-smashed' | 'bear-shrug' | 'hive-knocked' | 'swarm-escaped';
export interface CritterDeps {
  fx: Fx; play(sfx: Sfx): void; toast(text: string): void; callout(title: string, sub?: string): void;
  earn(amount: number, reason: string): void;
  steal(amount: number, reason: string): number;   // takes up to amount Acorns, returns how many
  hurtPlayer(amount: number): void;                // chip clay, 0..1 of full health; ignored in a vehicle
  event(id: CritterEvent): void;                   // radio bulletin hook; call it at most once a minute per id
}
export interface RegionLife {
  id: string;
  groups: readonly SpawnGroup[];
  init?(rt: CritterRuntime): void;                                   // once, after the groups spawn
  update?(rt: CritterRuntime, ctx: CritterCtx): void;                // every frame, after the runtime moved critters
  onHit?(rt: CritterRuntime, c: Critter, cause: HitCause, fromX: number, fromZ: number): boolean;  // true = handled
  hitTest?(rt: CritterRuntime, x: number, y: number, z: number): boolean;  // bullets vs your own things
}
export interface CritterRuntime {
  readonly list: readonly Critter[]; readonly scene: THREE.Scene; readonly world: World; readonly deps: CritterDeps;
  readonly ctx: CritterCtx | null;
  spawn(kind: CritterKind, x: number, z: number, opts?: { region?: RegionId; group?: string; leash?: number; yaw?: number; mode?: CritterMode }): Critter;
  remove(c: Critter): void;
  inGroup(group: string): Critter[];
  scare(c: Critter, fromX: number, fromZ: number, seconds?: number): void;
  chase(c: Critter, seconds: number): void;
  knock(c: Critter, fromX: number, fromZ: number, cause: HitCause): void;
  knockArea(x: number, z: number, radius: number, cause: HitCause): number;
  hitTest(x: number, y: number, z: number): boolean;
  moveToward(c: Critter, x: number, z: number, speed: number, dt: number): number;  // returns distance left
  nearest(kind: CritterKind, x: number, z: number, maxD: number): Critter | null;
  update(ctx: CritterCtx): void;
}
export function critterMesh(prefab: string, scale?: number, tint?: number): THREE.Group;  // buildPrefab, or a grey box if the prefab is missing
export function openSpot(x: number, z: number, r: number, region: RegionId, world: World): { x: number; z: number } | null;
export function isOpen(x: number, z: number, r: number, region: RegionId, world: World): boolean;  // no box, no water, off roads, in region
export function roadDistance(x: number, z: number): number;   // to the nearest highway centre line
export function setPlayerHidden(h: boolean): void;  export function isPlayerHidden(): boolean;
```

Note: `onHit` of the life that owns a critter's SpawnGroup is asked first; a critter you spawn yourself in `init` with
your own `group` id has no owner, so then EVERY life's `onHit` is asked: always check `c.kind` / `c.group` in `onHit`
and return `false` for critters that are not yours.

Other game helpers you may import (paths from `games/gnome-theft-auto/src/`):
- `./terrain`: `heightAt(x, z)`, `waterAt(x, z)` (null = dry land; another epic fills it in, it may be null everywhere).
- `./levels`: `regionAt(x, z)` returns a `RegionId` ('cloverfield-farms', 'frostbite-fells', 'tallgrass-commons', ...).
- `./collide`: `angleDiff(to, from)`.
- `@lawn/prefabs`: `buildPrefab(id, { scale, tint, lights: false })`, `buildPrefabInstances(id, matrices, opts)`, `getPrefab(id)`.
- `./types`: `Vehicle` (fields `x, y, z, yaw, speed, driver ('none' | 'player' | 'npc' | 'remote' | 'police'), kind, spec.radius, spec.flies, exploded?, questOwned?`), `World` (`boxes: Box[]`, `Box = { minX, maxX, minZ, maxZ, h }`), `Sfx` ('bump' | 'smash' | 'crack' | 'squirt' | 'whistle' | 'stunt' | 'splash' | ...).
- Colliders: in `init` ONLY you may `rt.world.boxes.push(box)` for a solid thing you build (a cabin, a silo); never
  move or remove a box afterwards.
- `Fx`: `fx.smash?.(x, y, z, color)` debris puff, `fx.spark(x, y, z)`, `fx.dandelionCloud(x, y, z)`.

Rules that apply: no gore and nothing bleeds or gets wet (lore R-021, R-049): animals are knocked over in a puff and
run off, they never die and are never removed for being hit. No new on-screen buttons (mobile): everything reacts to
walking, driving and shooting. Critters are local to this browser (no networking). Anything laid flat on the ground
needs a draw layer (`flatLayer(material, LAYER.<x>)` from `@lawn/depth`); prefer upright things.
