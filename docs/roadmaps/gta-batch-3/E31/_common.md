# E31 common rules (every issue)

## Environment

- Working directory: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a20fe38a14a40a4ef` (a git worktree on
  branch `epic/E31-living`). Run every command from there. Use absolute paths.
- Shell: Git Bash. If `node`/`npm`/`npx` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`, `git stash`, `git checkout` or `git reset`.
- Line endings: keep whatever a file already has (most files are LF; a few, e.g. `types.ts`, `net.ts`, prefab
  `catalog/index.ts`, are CRLF). New files are LF. Never rewrite a whole file just to change line endings. Prefer the
  Edit/Write tools over shell heredocs and `sed -i` / python rewrites.
- About 14 other workers are editing OTHER files of the same game at the same time. Edit only the files your issue
  names. If `npx tsc` reports an error in a file you do not own, ignore it (another worker is mid-edit) unless it is
  caused by your change.
- Do not start a dev server or a browser. Do not run `vite build`.
- `src/layout.golden.test.ts` is expected to fail while this epic runs (the lead regenerates the golden file at the end).
  Never regenerate it yourself.

## The game

`games/gnome-theft-auto` (three.js + TypeScript). World coordinates: metres, +x east, +z south (north is -z).
`yaw` is three.js `rotation.y`: 0 faces +z (south), `Math.PI` faces north, `Math.PI / 2` faces +x (east).
The world builds once at start, and also in tests under node (no DOM: never touch `document` at import time; guard with
`typeof document !== 'undefined'`).

Useful helpers (confirmed):
- `import { buildPrefab, getPrefab } from '@lawn/prefabs'` — `getPrefab(id)` is undefined for a missing id;
  `buildPrefab(id, { lights: false, scale?, tint?, trim? })` returns a `THREE.Group` (front faces +z, feet at y 0).
- `import { buildStaticCells } from '../cull'` — `buildStaticCells(placements, { name: 'my-batch' })` merges many static
  prefabs into culled per-cell batches and returns a `THREE.Group` to `scene.add`. A placement is
  `{ id, x, y, z, yaw?, scale?, tint?, trim? }` (y absolute). Unknown prefab ids are skipped. USE THIS for scenery
  (dozens of props): it is what keeps phones fast. Use `buildPrefab` + `scene.add` only for a handful of special pieces.
- `import { heightAt, waterAt } from '../terrain'` — ground height at (x, z); `waterAt(x, z)` is `{ surface, depth }` or null.
- `import { placeOnGround } from '../terrainMesh'` — `placeOnGround(obj, x, z, lift = 0)` sets obj.position on the ground.
- Colliders: `Box` from `../types` is `{ minX, maxX, minZ, maxZ, h }` (axis-aligned, `h` = absolute top height).
  Push one per solid thing into the `boxes` array your builder receives. From a placed object:
  `const b = new THREE.Box3().setFromObject(obj); boxes.push({ minX: b.min.x, maxX: b.max.x, minZ: b.min.z, maxZ: b.max.z, h: b.max.y })`.
  Small things you can walk through (flowers, grass, reeds) get no collider.
- Text signs: `import { textPlate } from '../homes/pieces'` —
  `textPlate(text, x, y, z, yaw, { w, h, bg, fg })` returns a vertical text plane (canvas texture; a plain plane in
  tests). Use `\n` for two lines. Mount it at least 0.03 m in front of the board it sits on.
- People: `import type { AmbientGnomeDef } from '../ambientGnomes'` —
  `{ id, name, x, z, yaw, look: Partial<GnomeLook>, bubble: string, idle?: AnimId }`. `look` fields: `hat, shirt, pants,
  skin, boots, beard` (0xRRGGBB, beard may be null), `glasses: boolean`. Idle ids you may use: 'look-around', 'stretch',
  'yawn', 'scratch-head', 'tap-foot', 'hands-on-hips', 'cross-arms', 'sit-ground', 'sleep', 'lean-back', 'think',
  'fish', 'dig', 'sweep', 'saw', 'rake', 'water', 'read'. The bubble pops up when the player walks near.

## Repo rules that apply

- No z-fighting: anything flat on the ground or on another surface (a mat, a decal, a path) is lifted at least 0.02 m
  AND uses a draw layer: `import { LAYER, flatLayer } from '@lawn/depth'`; `flatLayer(material, LAYER.marking)`.
  Two boxes that touch must not share a face (leave a 0.02 gap or overlap them).
- New objects come from `@lawn/prefabs`. Never hand-build a one-off mesh for an item, prop or piece of furniture in the
  game. Plain geometry is fine only for ground features (a path strip, a water patch).
- Lore: names and jokes fit Gnome Theft Auto's satirical gnome world (gnomes, lawns, mowers, the HOA and its hats, the
  Tall One who owns the yard and never appears). The Unmown is the corner the Tall One stopped mowing years ago: a nature
  preserve kept by patient rangers; the HOA cannot bear it. Keep it warm and dry-funny, never mean.
- Performance: phones must stay smooth. Prefer `buildStaticCells`; no per-frame work in builders; no lights.

## Shared E31 constants

`games/gnome-theft-auto/src/living/config.ts` (read it if your issue mentions it): `HAMLETS`, `HIGH_TARN`, `STATION`,
`UNMOWN_HIDES`, `BOARDWALK`, `PLATFORM`, `DECK_Y`, `BOARDWALK_WIDTH`, `LAST_DANDELION`, `LIVING_ACH`, `NEW_BIRD_IDS`,
`NEW_RIDES`. Do not edit it; it is the lead's.

## Checks

- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` — no errors in your files.
- Your issue's own vitest command (a test file you own, run alone with `npx vitest run <file>`).
