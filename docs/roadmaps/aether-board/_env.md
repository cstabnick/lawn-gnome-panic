## Environment (every issue)

- Repo root: `/home/user/lawn-gnome-panic` (Linux). Game: `games/aether-board` (Vite + TypeScript strict + three 0.187).
  A gnome snowboards an ethereal plane of floating islands. Bright, saturated, cel-shaded, Jet Set Radio-ish.
- `npm install` has been run at the repo root. Do not add dependencies.
- Contracts: `games/aether-board/src/config.ts` (types: `Input`, `Player`, `PhysEvent`, `TrickCmd`, `BoardTrick`,
  `BOARD_TRICKS`, `ComboView`, `PALETTE`, `ISLAND_TOPS`, `TUNE`). Read it; do not edit it.
- Already written by the planner, read only: `src/world.ts` (world data + height queries), `src/physics.ts` (the board),
  `src/camera.ts`, `src/app.ts` (the loop: shows how your module is called), `src/view/toon.ts` (cel shading helpers).
- Every module exists as a **stub** with its final exported names and signatures. You own exactly the files your issue
  names. Keep every export of your stub exactly (you may add exports). Other workers are editing the other files of this
  game at the same time; their files may be half-done.
- Cel-shaded look: build materials with `toonMat(color, opts)` and outline meshes with `addOutline(mesh, thickness)` from
  `src/view/toon.ts`. Colours from `PALETTE` / `ISLAND_TOPS` in config.ts.
- Type-check (safe any time): `npx tsc --noEmit -p games/aether-board`. Do not run `vite build`.
- Do not run `git commit`. Plain, short comments. No external assets: everything is generated in code.
