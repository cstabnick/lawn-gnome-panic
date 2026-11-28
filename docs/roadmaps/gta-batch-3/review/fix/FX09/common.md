## Environment (shared by every FX09 issue)

- Repo worktree: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a0e3efabd43ed467a` (branch `fix/FX09`).
  Use absolute paths. Git Bash: `export PATH="/c/Program Files/nodejs:$PATH"` if node is missing. Never commit, stash,
  checkout or reset: the lead commits. Keep LF line endings.
- Game: `games/gnome-theft-auto` (three.js, TypeScript). Paths below are under `games/gnome-theft-auto/src/` unless they
  start with `packages/`, `docs/` or `tools/`.
- Four other workers edit other files of this game at the same time. Edit only the files your issue owns. If a check
  fails in a file you do not own, say so in your report; do not fix it.
- A dev server is already running for you at **http://localhost:5509/** (it hot-reloads your edits). Do not start or
  stop servers. Screenshots: `node tools/gta-shots.mjs http://localhost:5509/ C:/Users/cpsai/AppData/Local/Temp/claude/5c6e1ad7636bf755/491bbd90-be40-460d-b246-8599e60336ab/scratchpad/fx09-<your-issue>/ <name>:<x>,<z>,<yaw> [...] [--size 390x844]`
  (from the repo root; yaw is three.js rotation.y the camera faces: 0 = +z south, PI = north, PI/2 = east, -PI/2 =
  west). Look at every image with the Read tool, and iterate until it looks hand crafted. The goal is visible polish:
  "I want the world to feel hand crafted ... spending a lot of time on the details making iterative adjustments until it
  all feels just right", and "don't lose its charm". The machine is loaded: a shot takes ~1-2 minutes.
- World: +x east, +z south, metres. Pardonlin is x -1795..-1400, z -900..1100. Its roads are 7 m wide; town roads now
  have stone pavements out to 9.6 m from the centre line and granite kerbs (automatic: `pardonlin/groundPlan.ts`).
- **District plans** (`pardonlin/plan.ts`) are pure data: `buildings` (kit buildings, ids in `eurokit/catalog.ts`),
  `props` (`PlanProp { id, x, z, yaw?, y?, rot?, scale?, tint?, trim?, solid? }`, any `@lawn/prefabs` id; `y` lifts it
  above `heightAt(x, z)`, `solid` gives a collider), `signs` (`PlanSign`: kinds menu / poster / street draw a sign prefab
  with text; plaque / banner are text plates `w x h` at height `y`, stand them 0.03+ m in front of a wall; text <= 90
  chars), `vignettes` (`{ id, name, x, z, story }`, needs >= 3 props within 8 m), `residents` (`AmbientGnomeDef`, ids
  start `pl-`), and **`ground: GroundPatch[]`** (new, FX09). `pardonlin/town.ts` builds it all; `pardonlin/layout.test.ts`
  checks it (buildings off roads/paths/river and not overlapping, solid props off roads (0.3 m) and the river, every
  piece inside its district's rects, residents on clear ground).
- **Laid ground** (`pardonlin/groundPlan.ts`, built by `pardonlin/ground.ts` as draped decals on @lawn/depth layers):

  ```ts
  export type PavingKind = 'flags' | 'setts' | 'cobble' | 'gravel' | 'kerb' | 'quay';
  export type GroundPatch = { kind: PavingKind; accent?: boolean } & (
    | { rect: { x: number; z: number; w: number; d: number; yaw?: number } }   // centre, size along local x / z
    | { circle: { x: number; z: number; r: number; r0?: number } }            // disc, or ring r0..r
    | { line: readonly (readonly [number, number])[]; width: number }          // ribbon centred on world points
    | { band: readonly (readonly [number, number])[]; from: number; to: number } // ribbon between signed offsets
  );
  ```
  flags = pale limestone slabs (pavements), setts = small grey granite blocks (squares), cobble = rounded cobbles
  (lanes, rings), gravel = golden park gravel, quay = big grey quay flags. Layers: plain patches are on 'tint', below the
  pavements ('area'), which are below the roads. `accent: true` puts a patch on 'area' (a ring or border on top of a
  square). **Two patches on the same layer must never overlap** (they would flicker), and an accent must not overlap a
  road's pavement band (within 9.6 m of a road centre line). Push patches with `plan.ground.push({...})`. Tile props
  (`euro-paving-tile`, `euro-cobble-tile`) are retired in town: never place them; replace any you meet in your file.
- **Prefabs** (`@lawn/prefabs`): every new object is a `PrefabDef` (rules: `docs/roadmaps/prefab-library/_common.md`;
  examples in `packages/prefabs/src/catalog/gta-pardonlin-props.ts`, `gta-euro-street.ts`). Reuse an existing id when one
  fits (`grep -rn "id: '<word>" packages/prefabs/src/catalog/`). Your issue names the one catalog file you may add to; it
  is already registered in the catalog index. Afterwards `npm test -w packages/prefabs` must pass.
- Lore: Pardonlin is the Continental town where everyone queues for everything, cycles everywhere, strikes about strikes,
  and is gently pompous. Sign voice: dry, short, a twist in the second clause ("CLOSED FOR LUNCH. Open after lunch.").
  Search `npm run lore -- find <word>` before naming anything. Do not edit `docs/lore/rulings.md`: if a lore fact
  changes, edit the entry file your issue names and put the proposed ruling text in your report.
- Mobile: these are world changes; check one shot at `--size 390x844` too.
- **Do not** update `src/data/layout.golden.json` (the golden layout test will fail because the town changed; the lead
  regenerates it once). Ignore `src/layout.golden.test.ts` failures.
- Checks every issue runs: `npx tsc --noEmit -p games/gnome-theft-auto` (from the repo root) and
  `npx vitest run src/pardonlin` (from `games/gnome-theft-auto`). tsc sees other workers' files mid-edit; if an error is
  in a file you do not own, rerun once a minute later and report it if it stays.
