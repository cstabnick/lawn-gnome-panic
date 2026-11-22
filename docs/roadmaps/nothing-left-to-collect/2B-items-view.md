Epic: 2 Systems
Depends on: none (Epic 1 is done: the game builds with stubs)

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\stingaree` (a git worktree). Node: if not found, `export PATH="/c/Program Files/nodejs:$PATH"` in Git Bash.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`.
- Eleven other workers are filling other files in `games/nothing-left-to-collect/src/` right now. Edit only `src/items.ts`. `tsc` may show errors in their files mid-edit; only yours must be clean.
- Repo rule: pickups are `@lawn/prefabs` drops, never hand-built meshes. Never dispose meshes that came from `buildPrefab`/`createDrop` (their geometry and materials are shared caches): just remove the object from the scene.

## Goal

Replace the stub `src/items.ts` with the pickup view: one hovering, turning prefab drop per live item in the
collecting state, plus a small burst effect when one is picked up.

## Read first

- `games/nothing-left-to-collect/src/items.ts` (stub) and `src/types.ts` (`ItemView`, `CollectState`, `Item`, `Pickup`).
- `games/nothing-left-to-collect/src/config.ts`: `ITEM_KINDS[kind]` gives `prefab` and `glow` (number or null).
- `packages/prefabs/src/drop.ts`: `createDrop(id, { glow?, tint?, fit? })` returns `{ object: THREE.Group, update(dt) }`; it throws on an unknown prefab id.

## Change

`games/nothing-left-to-collect/src/items.ts`:

```ts
export function createItemView(scene: THREE.Scene): ItemView
```

- Keep a `Map<number, { drop: Drop; item: Item }>` keyed by item id.
- `sync(s, dt)`: for each item in `s.items` without a view, create `createDrop(item.prefab ?? ITEM_KINDS[item.kind].prefab, { glow: ITEM_KINDS[item.kind].glow ?? undefined, fit: item.kind === 'anything' ? 0.6 : 0.4 })` inside a try/catch; if it throws (unknown prefab), fall back to `createDrop('acorn', ...)`. Set the drop's object position to `(item.x, item.y - 0.35, item.z)` every frame (a resting item has `y = 0.35`, so its drop sits on the floor and hovers by itself; a falling item moves down with `item.y`). Call `drop.update(dt)` every frame. Remove views whose id is no longer in `s.items` (build a `Set` of live ids each frame).
- Golden acorns: `kind === 'golden-acorn'` scales the drop object by 1.3.
- `burst(p)`: a tiny effect at the pickup point that lasts 0.4 s: 6 small `THREE.Mesh(new THREE.OctahedronGeometry(0.05), material)` sparks flying up and out, fading (`material.transparent = true`, opacity to 0), colour from `ITEM_KINDS[p.kind].glow ?? 0xfff2a0`. Create ONE shared `OctahedronGeometry` and a small material cache per colour at module level and reuse them; keep at most 120 live sparks (drop the oldest). The sparks are animated in `sync` (it runs every frame).
- `clear()`: remove every drop and spark from the scene and empty the maps.
- Performance: up to 400 items may be live. Do not call `createDrop` more than 40 times in one `sync` call (create the rest on the next frames) so a big rain does not stall a phone.

## Contract

```ts
export function createItemView(scene: THREE.Scene): ItemView;
// ItemView = { sync(s: CollectState, dt: number): void; burst(p: Pickup): void; clear(): void }
```

## Done when

- `npx tsc --noEmit -p games/nothing-left-to-collect` shows no errors in `src/items.ts`.
- The file imports only `three`, `@lawn/prefabs`, `./config` and `./types`.

## Out of scope

Every other file under `games/nothing-left-to-collect/`, all packages.
