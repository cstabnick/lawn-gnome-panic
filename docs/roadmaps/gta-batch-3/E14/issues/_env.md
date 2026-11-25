# Shared environment for every E14 issue (read this first)

- Repo root: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a319dfe2d1f4a74c6` (a git worktree; stay
  inside it, use absolute paths). Game: `games/gnome-theft-auto` (three.js + TypeScript + Vite). Shell: Git Bash; if
  `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Other workers edit other files of the same game at the same time. Change only the files your issue lists. Never
  commit, never run `git stash`, `git checkout`, `git reset` or `git clean`.
- Keep each file's existing line endings (most are LF; a few, e.g. `packages/prefabs/src/catalog/index.ts`, are CRLF). Never convert a whole file. New files: LF.
- Type-check: `cd games/gnome-theft-auto && npx tsc --noEmit -p .`. Another worker's file may be mid-edit: if an error is
  only in a file you do not own, ignore it and say so in your report. Single tests: `npx vitest run <path>` from
  `games/gnome-theft-auto`. Do not run `npm run build` (vite writes `dist/`), do not start dev servers.
- Coordinates: world metres, +x east, +z south (north is -z); yaw 0 faces +z, yaw = atan2(dx, dz). `heightAt(x, z)`
  (`src/terrain.ts`) is the ground.
- Repo rules that apply: assets CC0 or made in code; every new visible object is a `@lawn/prefabs` prefab
  (`packages/prefabs`, built with `buildPrefab` / `buildStaticCells` from `src/cull.ts`); anything flat on the ground or
  on another surface takes a draw layer (`flatLayer(material, LAYER.<x>)` from `@lawn/depth`), never just a small lift,
  and boxes that touch must not share a face; UI goes in its own container appended to `#ui` (never restyle `#ui`);
  touch targets at least 44 px; before writing names, dialogue or sign text read `docs/lore/canon.md` and
  `npm run lore -- find <word>` (from the repo root). Keep the game's tone: dry, satirical, gnome-scale jokes.

## The places (E14)

| site (src/sites.ts) | name | where |
|---|---|---|
| `dirt-track` | Rutbottom Dirt Bowl | flat site x 1000..1400, z -780..-520 (centre (1200, -650)); gate anchor (1000, -650) on the `east-band-north` road (x = 950). Region Rootwell. |
| `toadstool-forest` | Capwood | natural ground x 100..400, z -1280..-1080, about 2 m high, flat-ish. Region Snowcap Rise. |
| `rally-route` | the Capwood Run | start paddock (flat) x 70..110, z -775..-745, start anchor (90, -760) facing north (yaw PI). Route: up the Fells mountain (peak ~69 m at (300, -900)), down its north flank, through Capwood, finish near (150, -1300). Road `north-band-east` runs x 60..400 at z ~ -1320..-1330; `north-outer` runs x ~30 at z -660..-870. |

Fixed Capwood places (`src/capwood/spots.ts`, exists): `WARDEN_HUT` (360, -1245), `GREAT_RING` (150, -1125) r 14,
`CAP_COUNT_SPOTS` (six), `ROUTE_CLEARANCE` 25.

People (from `docs/design/gnome-theft-auto/characters.md`): **Clary Mudguard** (`clary`), marshal of the Dirt Bowl,
lives in the starter's tower: black-and-white checked flat cap, dusty overalls, no beard, sandy pigtails, a starter's
flag; loud bored starter's bark, "Three. Two. Go on, then." / "Mind the berm. The berm remembers." **Warden Chanterelle
Stook** (`chanterelle`), warden of Capwood, lives in a hut in a hollow toadstool stalk: brown mushroom-cap warden's hat,
mossy green uniform, brass buttons, neat grey beard, ticket book; prim, cites rules by number: "That is a bruised cap.
Section nine. Eleven acorns." **Two-Ton Teasel** (`teasel`, full name Teasel Mudguard, Clary's older brother, ruling
R-190), Fizz Cup racer, gives the dirt rematch. **Lugnut Lulu** captains the Carburettors (lowrider club) who run the
Capwood Run. Cap-water: the thick, slow water of Capwood's fords, which never floods an engine (lore).

## The track contract (`src/raceTrack/trackDef.ts`, `src/raceTrack/tracks.ts`, exist)

```ts
// tracks.ts
export const TRACK_IDS = ['lost-and-found', 'rutbottom', 'capwood-run'] as const;
export type TrackId = (typeof TRACK_IDS)[number];
export const TRACKS: Readonly<Record<TrackId, Track>>;
export const ALL_TRACKS: readonly Track[];
export function trackById(id: string): Track;              // throws on unknown id
export function trackSurfaceAt(x, z): SurfaceKind | null;   // road surface of any track
export function fordWaterAt(x, z): FordHit | null;          // Cap-water in a ford
export function nearTrack(x, z, margin = 0): boolean;      // within barrierOffset + margin of any track centre line
// trackDef.ts
interface TrackDef { id; name; closed: boolean; width; shoulder; fade; barrierOffset; control: TrackControl[];
  jumps: TrackJump[]; whoops?: TrackWhoops[]; fords?: TrackFord[]; gates: number; startOffset: number; finishPad?: number;
  surface: SurfaceKind; relief: 'raise' | 'ribbon'; maxGrade?: number; smooth?: number;
  reserve?: { x; z; hw; hd }; extraRoads?: { points; width }[] }
interface TrackControl { x; z; lift?; bank? }            // bank: outside edge of a corner raised by bank metres
interface TrackJump { id; name; s; rise; up; down }      // kicker at distance s
interface TrackWhoops { from; to; amp; wave }            // bumps amp m high, one per wave m, s from..to
interface TrackFord { id; name; s; len; depth; dip; reach? } // road dips `dip` m over len m around s, water `depth` m deep
interface Track {
  def; id; name; closed;
  samples(): readonly TrackSample[];  length(): number;
  startS(): number;   // 0 closed; def.startOffset open
  finishS(): number;  // length() closed; length() - finishPad open
  wrapS(s): number;   // wrap (closed) or clamp (open)
  sampleAt(s): TrackSample;  frame(s, lat = 0): { x; z; yaw };
  roadLiftAt(p, lat): number;  roadTopAt(p, lat): number;   // relative / absolute road height
  locate(x, z, reach = 40, hint = -1, window = 60): TrackSpot | null;   // { i, s, lat, dist }
  onRoad(x, z): boolean;  onTrack(x, z): boolean;  surfaceAt(x, z): SurfaceKind | null;
  gates(): readonly Gate[];   // closed: gate 0 = start/finish line; open: gate 0 = start, last = finish
  tracker(): TrackGateTracker; // update(dt, x, z) -> 'start' | 'gate' | 'lap' | null ('lap' = finish on open tracks)
  gridSlot(slot): { x; z; yaw };   // behind the start line
  applyRelief(g, N, H, S): void;  bounds(): { minX; maxX; minZ; maxZ };  fordAt(x, z): FordHit | null;
}
// TrackSample { s; x; z; tx; tz; nx; nz; yaw; lift; bank; curv }  (n = left normal; curv > 0 turns left)
```

`src/raceTrack/track.ts` is the Speedway (`TRACK` def, `SPEEDWAY` Track) and keeps its old free functions
(`trackSamples`, `sampleAt`, `locate`, `gridSlot`, `GateTracker` ...), all bound to the Speedway.
`terrain.ts` applies every track's relief; `terrain.waterAt` returns `{ surface, depth, ford: true }` in a ford;
`waterlog.ts` caps soaking in fords at `WATERLOG.fordCap` (0.3, below `sputterAt` 0.35); `surfaces.ts` reports
`trackSurfaceAt` (dirt on the dirt tracks) and 'water' in fords.

## Area modules (exist as stubs; `src/dirtCountry/types.ts`)

```ts
export interface AreaDeps { toast(text: string, ms?: number): void; unlock(id: string): void; increment(id: string, by?: number): void }
export interface Area { update(dt: number, px: number, pz: number, night: number): void; blips(): Blip[] }
```
`createRutbottom(scene, world, deps): Area` (`src/rutbottom/index.ts`), `createCapwoodForest(...)` (`src/capwood/forest.ts`),
`createCapwoodRunDressing(...)` (`src/capwood/run.ts`). `src/dirtCountry/index.ts` builds all three; `app.ts` already
calls it and updates it every frame. Keep each signature.
