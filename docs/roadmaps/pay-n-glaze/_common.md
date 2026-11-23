# Common rules for every Pay 'n' Glaze issue

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\scorpionfish` (a git worktree, branch `QMasterMoo/pay-n-glaze-customization`). Run every command from there. Do not `cd` elsewhere.
- Node: if `node`/`npm` is not found, in Git Bash `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed and `@lawn/glaze` is linked. Do **not** run `npm install`. Do **not** run `git commit`, `git push` or open a PR (the planner does that). Do not start a dev server (the planner has one on port 5198) and do not run `npm run build` (it writes `dist/`).
- Up to ~25 other workers are editing OTHER files in the same repo at the same moment. Edit only the files your issue names. A type error in a file you do not own means its owner is mid-edit: ignore it. Never "fix" another worker's file.
- Read `AGENTS.md` rules that matter here: lore before names (`npm run lore -- find <word>`), assets are generated in code (no downloads), mobile-first UI (touch targets at least 44 px, no hover-only UI).

## What is being built

**Pay 'n' Glaze** is Gnome Theft Auto's customisation garage. A plain-data `Loadout` (`packages/glaze/src/types.ts`: paint, finish, spray, tyres, rims, wheel size, camber, ride height, steering wheel, lamps, spoiler, seat, ornament, extras, underglow) is dressed onto a prefab vehicle by `@lawn/glaze` (`packages/glaze`). Only `games/gnome-theft-auto` uses it for now; other games must keep working untouched, and a new game must be able to adopt it in a few lines:

```ts
const body = buildGlazeBody('my-car', { scale: 1.5 });      // prefab built white, tint parts separable
const rig = attachLoadout(body, 'my-car', defaultLoadout(0xd8342c));
scene.add(body);  rig.set({ ...rig.loadout, spoiler: 'picket', tyre: 'fat' });  // each frame: rig.update(dt)
```

**Read these first** (all short, all final): `packages/glaze/src/types.ts` (the contract: Loadout, VehicleMounts, GlazeRig), `packages/glaze/src/ids.ts`, `packages/glaze/src/catalog.ts` (every product, its name, blurb, price and prefab id), and the stub of the file you own. A STUB file has its final exported names and signatures with trivial bodies; keep every exported signature exactly as stubbed (other workers compile against it) and replace the body.

## Conventions

- Prefab-local coordinates are in the prefab's own units before any root scale. Front is +z. **+x is the vehicle's LEFT** (three.js), -x is right. Rotations in data are DEGREES.
- A vehicle prefab is built with `buildGlazeBody(prefabId, { scale })`: `tint: 0xffffff, separateTint: true`. Every mesh drawn from a `c: 'tint'` part then has `mesh.userData.tint === true` and white colour, so the rig paints it by swapping the mesh's material. Baked (static) tint parts live in one merged mesh with vertex colours (`material.vertexColors === true`); named / pivoted parts are separate meshes.
- Named pivot groups of a vehicle prefab: `wheel-0`..`wheel-3` (0,1 rear; 2,3 front and steered; `side` = sign of the pivot's x), `steer`, `handle`, `blade`, `reel`, `rotor`, `door-left`, `door-right`. A pivot group's position is the pivot's `at`; a part in that group has local position `part.at - pivot.at`.
- `setPrefabDamage(root, level)` (`@lawn/prefabs`) **throws away all of a body root's children** and rebuilds them (new pivot objects). `GlazeRig.apply()` therefore must be safe to call again on a freshly rebuilt root AND on a root it already dressed (idempotent).
- The gnome: left is +x, right is -x. Arm pivots `model.arms.left/right` sit at shoulders `(±0.27, 0.62, 0)` of the rig; the arm hangs along local -y, a 0.3 box plus a 0.06 hand ball whose centre is 0.32 below the pivot. `model.update()` rewrites arm rotations every frame, so anything that poses arms runs AFTER it.
- Shared geometry and materials are cached and shared across vehicles: never `dispose()` them. Dispose only what you created per call.
- Keep each file small and plain. No new dependencies. TypeScript strict. No `any`.

## Checks

- `npx tsc --noEmit -p packages/glaze` (package files), `npx tsc --noEmit -p games/gnome-theft-auto` (game files), `npx tsc --noEmit -p packages/prefabs` (prefab catalog files). Safe to run in parallel with others.
- Tests: `npx vitest run <path-to-your-test-file>` from the repo root (not the whole suite). Tests that depend on a sibling file that is still a stub may fail until the sibling lands: write your tests so they pass against the stubs for everything your file owns, and say in your report which assertions need siblings.
- Read your finished file(s) once top to bottom before reporting.

## Report back

Say which files you changed, what you ran and the result, and anything the planner must know (a contract you could not meet, a bug you saw in a file you do not own). Do not commit.
