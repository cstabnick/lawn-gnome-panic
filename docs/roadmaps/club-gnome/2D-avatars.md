Epic: 2 (modules)
Depends on: none

(Read `docs/roadmaps/club-gnome/_env.md` first: environment and shared rules.)

## Goal
`games/club-gnome/src/avatars.ts` shows every gnome on my map (mine and other players'): the shared gnome model
walking, remote poses smoothed with `Interp`, and DOM labels over each head (name tag, speech bubble).

## Read first
- `games/club-gnome/src/config.ts`: `AvatarPose`, `CHAT` (bubble timing), `ME`.
- `games/club-gnome/src/avatars.ts`: the stub you replace (keep `Avatars` and `createAvatars` exactly).
- `games/club-gnome/src/world.ts`: only the `World` interface (`scene`, `project`). Another worker is rewriting the
  body; use only the interface.
- `packages/mp/src/interp.ts`: the top comment, `InterpOptions`, `push(values, sentMs)`, `sample(out)`, `clear()`, `ready`.

## Change
`games/club-gnome/src/avatars.ts`:
- Per avatar: `model: GnomeModel` from `createGnomeModel(look)` (`@lawn/gnome`), added to `world.scene`; a `PlayerState`
  object `{ position: new THREE.Vector3(), velocity: new THREE.Vector3(), facing: 0, grounded: true, jumpsUsed: 0 }`
  passed to `model.update(state, dt)` every frame (the model faces +z at facing 0 and swings its legs from the
  velocity's x/z speed); the shown pose; an `Interp` from `@lawn/mp/interp` with
  `{ angles: [2], steps: [3, 4], pos: [0, 1], snapDist: 6 }` holding samples `[x, z, facing, moving ? 1 : 0, busy ? 1 : 0]`.
- `setPose(id, pose)`: shows that pose this frame (mine). `pushPose(id, pose, sentAt)`: `interp.push(sample, sentAt)`.
  `snap(id)`: `interp.clear()`.
- `update(dt)`: for each avatar with buffered samples, `interp.sample(out)` into its pose. Then set
  `state.position` to (x, 0, z), `state.facing`, and `state.velocity` to the position change / dt when `moving`,
  else zero (cap at 8 units/s so a snap does not flail the legs); call `model.update(state, dt)`. Then place labels.
- Labels: one container `div` appended to `ui` (`position:fixed; inset:0; pointer-events:none; overflow:hidden`). Per
  avatar a name tag (bold 13 px, colour `#rrggbb` of its colour, dark text-shadow outline, `🎮 ` prefix while `busy`) at
  `world.project(x, 1.75, z)`, centred with `transform: translate(-50%, -100%)`; and a speech bubble (white, rounded,
  dark text, 14 px, max-width 220 px, word wrap, a small tail) just above the tag. Hide both when `visible` is false.
  Set `textContent` only. Avoid layout churn: only write `style.transform` each frame.
- `say(id, text)`: shows the bubble for `min(CHAT.bubbleMaxS, CHAT.bubbleBaseS + text.length * CHAT.bubblePerCharS)`
  seconds (a newer line replaces it). A text that is a single emoji shows bigger (28 px) for 3 s.
- `upsert(id, look, name, color)`: new avatar, or rebuild an existing one's model with the new look (remove the old
  `model.object` from the scene) keeping its pose, interp and labels; update name and colour.
- `remove(id)`: model out of the scene, labels out of the DOM. `removeAllExcept(keep)`, `has(id)`, `ids()`.
- Draw my own gnome's (`ME`) tag a little smaller so others stand out; everything else the same.

## Contract
```ts
export interface Avatars {
  upsert(id: number, look: GnomeLook, name: string, color: number): void;
  remove(id: number): void;
  removeAllExcept(keep: number): void;
  has(id: number): boolean;
  ids(): number[];
  setPose(id: number, pose: AvatarPose): void;
  pushPose(id: number, pose: AvatarPose, sentAt: number): void;
  snap(id: number): void;
  say(id: number, text: string): void;
  update(dt: number): void;
}
export function createAvatars(world: World, ui: HTMLElement): Avatars;
```
main.ts calls `update(dt)` once per frame after `world.follow`, and `setPose(ME, …)` before it.

## Done when
- `npx tsc --noEmit -p games/club-gnome` shows no error in `avatars.ts`.

## Out of scope
Every other file. Do not build your own gnome mesh: only `createGnomeModel`.
