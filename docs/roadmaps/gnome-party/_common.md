# Shared brief for every Gnome Party epic 2 issue (paste above the issue)

Gnome Party (`games/gnome-party`) is a board party for 4 gnomes. Its minigames are party-sized slices that other games surface through `@lawn/party` (`packages/party`).

## Environment

- Repository root: the folder holding `package.json` with `"workspaces": ["games/*", "packages/*"]`. Games are Vite + TypeScript (strict) + three 0.187.0.
- If `node_modules` is missing at the root, run `npm install` there once. On Windows Git Bash, if `node` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`.
- **Other workers are editing other files at the same time** (in `games/gnome-party`, `packages/party`, `games/gnome-golf`, `games/gnome-bowling`). Edit only the files listed under Change. Files you import from may be stubs right now: rely only on the signatures in your issue's Contract, and keep the exported signatures of your own file exactly as given, so their type-checks keep passing.
- Type-check the workspace you change: `npx tsc --noEmit -p games/gnome-party` (or `-p packages/party`, `-p games/<game>`). Run tests with `npx vitest run <test file>` from that workspace. **Do not** run `vite` or `npm run dev`. Only the golf and bowling issues may run `npm run build` of their own game.
- Repo rules: no external assets (meshes from three primitives, colours in code); edit no game other than the one your issue owns; never import one game from another; do not `git commit`.
- UI: append your own element to the `HTMLElement` you are given. Never restyle or hide `#ui` itself.

## Files every issue may read

- `packages/party/src/types.ts`: the minigame contract (`SeatIndex`, `SeatInfo`, `MinigameMeta`, `PadState`, `ViewCtx`, `MinigameView`, `MinigameDef`, `AnyMinigame`). Import from `'@lawn/party'`.
- `packages/party/src/rng.ts`: `mulberry32(seed): () => number` (0..1), `seedFrom(...parts: number[]): number`. Import from `'@lawn/party'`.
- `packages/party/README.md`: the size rules for a slice.
- `games/gnome-party/src/config.ts`: party tuning (`BOARD`, `TIMING`, `SEAT_COLORS`, `CPU_NAMES`) and party types (`BoardState`, `MoveEvent`, `Seat`, `Phase`, `PartyState`, `PartyMsg`).

## The gnome model (`@lawn/gnome`)

```ts
import { createGnomeModel, type GnomeModel, type PlayerState } from '@lawn/gnome';
const g: GnomeModel = createGnomeModel(seat.look); // g.object is a THREE.Group, feet at y = 0, faces +z at yaw 0 (measure it with new THREE.Box3().setFromObject(g.object) if size matters)
scene.add(g.object);
const pose: PlayerState = { position: new THREE.Vector3(), velocity: new THREE.Vector3(), facing: 0, grounded: true, jumpsUsed: 0 };
g.update(pose, dt);   // every frame: places g.object at pose.position, turns it to pose.facing, walks when velocity is non-zero
g.setDead(true);      // falls over
// g.arms.left / g.arms.right: shoulder pivots (rotation.x swings an arm). g.rig: the body (rotation.y twists it).
```
