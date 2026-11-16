# One gnome for every game: `@lawn/gnome` and the Gnome Creator

Goal: a player makes a gnome once in a new game (`games/gnome-creator`). It is saved in the browser (localStorage, one key,
same origin for every game on the arcade site), every game shows it, and other players see it online. The storage is behind
an async `GnomeStore` interface shaped like the planned platform service (`docs/design/gnome-platform.md`, in PR 38), so a real
backend replaces one file later. Player names are not integrated yet (each game keeps its own name field).

Design decisions (settled with the user):

- One gnome per player, not a roster (the platform proposal says one gnome per account).
- A player who never used the creator has no `look` in their profile: every game looks exactly as before. Only a saved look changes anything.
- The look travels to other players in `PlayerInfo.character` as an 11-character look code (`g1.` + 8 characters, palette
  indices), so no server change is needed. Later the service replaces it with a user id.
- Looks are palette-only (64 frozen colours) so they fit the code. The stored `Look` uses full RGB values, like the service.
- Online, the per-match player colour still goes on the hat: `{ ...look, hat: player.color }`.
- Games call only `loadMyGnome`, `getMyGnome`, `resolveLook`, `prefetchLooks`, `onLooksChanged`, `createGnomeModel` from `@lawn/gnome`.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 0. Foundation (written by the planner) | `packages/gnome` has types, the shared model, the frozen palette and stubs with final signatures; `games/gnome-creator` is scaffolded; all six `package.json` depend on `@lawn/gnome`; `npx tsc --noEmit -p packages/gnome` and `-p games/gnome-creator` pass | 0 (done) |
| 1. Look code and local store | `npm test -w packages/gnome` passes | 2: 1A look.ts, 1B store.ts |
| 2. Resolve, creator, five games | `npm run build` passes for gnome-creator, gnome-golf, gnome-bowling, gnome-front, gnaft, sample-3d; smoke tests clean; a look saved in the creator shows in each game | 9: 2A resolve.ts, 2B preview, 2C editor, 2D creator main, 2E sample-3d, 2F gnaft, 2G gnome-front, 2H gnome-golf, 2I gnome-bowling |

No dependency inside an epic. 2A is in epic 2 and not epic 1 because its tests need the real look code from 1A; the games
only need 2A's stub signatures to type-check.

## Common environment (repeated in every issue)

~~~~text
Repo: /home/user/lawn-gnome-panic (Linux, node 22 and npm on PATH, `npm install` already done).
Rules: do not run `git commit`. Edit only the files listed under Change. Other workers are editing other files of the
same package or game at the same time, so another file may be mid-edit; do not fix it. Do not start dev servers or run
`vite build`/`npm run build` (they write dist/ and clash with parallel workers); use the type-check and test commands
given under "Done when". Code style: TypeScript strict, 2-space indent, single quotes, short comments that say why.
~~~~

## Epic 1 issues

### 1A look.ts

~~~~text
Epic: 1 Look code and local store
Depends on: none

## Environment
(see the common environment above) Package: /home/user/lawn-gnome-panic/packages/gnome. Another worker is writing store.ts in the same package.

## Goal
Implement the palette snapping, the look code and the conversions in packages/gnome/src/look.ts, with unit tests.

## Read first
- packages/gnome/src/look.ts: the PALETTE, ALPHABET, DEFAULT_LOOK, LOOK_CODE_PREFIX, isLookCode that already exist (do not change them) and the stub functions you replace.
- packages/gnome/src/types.ts: `Look` (stored look) and `GnomeLook` (the model's look).

## Change
- packages/gnome/src/look.ts: replace the bodies of these stubs; keep names, parameters and return types exactly:
  - `nearestPaletteIndex(rgb: number): number`: mask rgb with 0xffffff; return the index of the PALETTE entry with the smallest squared RGB distance (sum over r, g, b of the squared channel difference); on a tie the lowest index.
  - `snapLook(look: Look): Look`: a new Look with hatRgb, coatRgb, pantsRgb, bootsRgb, skinRgb, and beardRgb / hairRgb when present, each replaced by PALETTE[nearestPaletteIndex(value)]. Booleans copied. When beardRgb or hairRgb is absent, the result has no such key (do not write `undefined`).
  - `toModelLook(look: Look): GnomeLook`: { hat: hatRgb, shirt: coatRgb, pants: pantsRgb, skin: skinRgb, boots: bootsRgb, beard: beardRgb ?? null, hair: hairRgb !== undefined ? { color: hairRgb, style: 'pigtails' } : null, freckles, dress, glasses, bowlCut: null }.
  - `fromModelLook(look: GnomeLook): Look`: the inverse: coatRgb = shirt, beardRgb only when beard !== null, hairRgb = hair.color only when hair !== null, bowlCut ignored. No `undefined` keys.
  - `encodeLook(look: Look): string`: snap first (snapLook), then 'g1.' + 8 characters in this order: hat, coat, pants, boots, skin, beard, hair, flags. Each of hat, coat, pants, boots, skin is ALPHABET[nearestPaletteIndex(colour)]. Beard and hair are ALPHABET[index] or '.' when absent. Flags is ALPHABET[(freckles ? 1 : 0) | (dress ? 2 : 0) | (glasses ? 4 : 0)]. Total length 11.
  - `decodeLook(code: string): Look | null`: null unless the string is exactly 11 characters, starts with 'g1.', its hat/coat/pants/boots/skin characters are all in ALPHABET, its beard and hair characters are '.' or in ALPHABET, and its flags character is in ALPHABET at an index below 8. Otherwise return the Look (colours = PALETTE[index]; beardRgb/hairRgb only when not '.'). Never throw, for any input including non-strings cast to string.
- packages/gnome/src/look.test.ts (new, vitest: `import { describe, expect, it } from 'vitest'`): tests for
  - PALETTE has 64 entries, all different; ALPHABET has 64 different characters.
  - `encodeLook(DEFAULT_LOOK)` is exactly 'g1.Z1OIBN.A'.
  - encode then decode returns `snapLook(look)` (use toEqual) for: DEFAULT_LOOK; a look with hairRgb, no beard, freckles, dress and glasses all true; a look with an off-palette colour such as hatRgb 0xd93637 (it snaps to 0xd93636).
  - decodeLook returns null for: '', 'gnorman', 'g1.', 'g1.Z1OIBN.' (too short), 'g1.Z1OIBN.AA' (too long), 'g2.Z1OIBN.A', 'g1.Z1OIBN.!' (bad flags char), 'g1.Z1OIBN.I' (flags index 8), 'g1.!1OIBN.A' (bad colour char).
  - `nearestPaletteIndex(0xd93636)` is 25; a tie returns the lowest index (check with a colour you compute is equidistant, or skip if hard).
  - `fromModelLook(toModelLook(look))` equals `look` for a look with beard and hair, and for one with neither.
  - every encoded code is at most 16 characters.

## Contract
Signatures exactly as in the stub. `types.ts` and the constants in look.ts are frozen: a look code stores palette indices, so changing PALETTE or ALPHABET would change every saved gnome.

## Done when
- `npx tsc --noEmit -p packages/gnome` succeeds.
- `npm test -w packages/gnome -- src/look.test.ts` passes.

## Out of scope
store.ts, resolve.ts, model.ts, types.ts, index.ts and every file outside packages/gnome/src/look.ts and look.test.ts.
~~~~

### 1B store.ts

~~~~text
Epic: 1 Look code and local store
Depends on: none

## Environment
(see the common environment above) Package: /home/user/lawn-gnome-panic/packages/gnome. Another worker is writing look.ts in the same package; its `snapLook` is a stub that returns the look unchanged until they finish, so your tests must use only palette colours (0xd93636, 0x2f64c9, 0x6b4a2e, 0x222222, 0xf1c27d are all palette colours).

## Goal
Implement LocalGnomeStore (the player's gnome in localStorage) in packages/gnome/src/store.ts, with unit tests.

## Read first
- packages/gnome/src/store.ts: the stub class, STORAGE_KEY, StorageLike, createGnomeStore.
- packages/gnome/src/types.ts: `Gnome`, `Look`, `GnomeStore` (its comments are the spec), `GnomeStoreError`.
- packages/mp/src/textFilter.ts: `checkName(raw: unknown): { ok: true; name: string } | { ok: false; reason: string }`, NAME_MIN = 2, NAME_MAX = 18. Import it as `import { checkName } from '@lawn/mp/textFilter'`.

## Change
- packages/gnome/src/store.ts: implement `LocalGnomeStore` (keep the constructor parameters: storage: StorageLike | null, now: () => Date, random: () => number, all with the defaults already there; store them in private fields) and keep `STORAGE_KEY`, `StorageLike`, `createGnomeStore` as they are:
  - `getMe()`: return the cached gnome if this instance has one. Else read `storage.getItem(STORAGE_KEY)` (catch any throw), JSON.parse it (catch), and accept it only if: it is an object; `userId` is a non-empty string; `displayName` is a string for which `checkName(displayName).ok` is true; `createdAt` is a string. Its `look`, if present, is kept only if every one of hatRgb, coatRgb, pantsRgb, bootsRgb, skinRgb is an integer from 0 to 0xffffff, beardRgb and hairRgb are each absent or such an integer, and freckles, dress and glasses are booleans; an invalid look is dropped (the rest of the gnome is kept). If nothing valid was stored, make a new gnome: `userId` = 'local-' + 12 characters picked from 'abcdefghijklmnopqrstuvwxyz0123456789' using `random()`; `displayName` = 'Gnome' + a 4-digit number from 1000 to 9999 from `random()` (it must pass checkName; test that); `createdAt` = `now().toISOString()`; no look. Write it to storage (ignore failures) and cache it. Return a copy (`structuredClone` or JSON round trip) so callers cannot change the cache.
  - `updateGnome(patch)`: take `await this.getMe()` as the base. If `patch.displayName !== undefined`: run `checkName`; when not ok, throw `new GnomeStoreError('INVALID_ARGUMENT', reason)`; else use the cleaned `name`. If `patch.look !== undefined`: validate it with the same rule as above (throw GnomeStoreError('INVALID_ARGUMENT', 'Invalid look.') when it fails) and store `snapLook(patch.look)` (import snapLook from './look'). Write the new gnome with `JSON.stringify` to storage; if storage is null or setItem throws, throw `new GnomeStoreError('UNAVAILABLE', 'Browser storage is not available, so the gnome could not be saved.')` and leave the cache unchanged. Otherwise update the cache and return a copy.
  - `batchGetGnomes(userIds)`: `[me]` (a copy) when userIds includes the caller's userId, else `[]`.
  - When `storage` is null, getMe still works for the life of the instance (the cache).
- packages/gnome/src/store.test.ts (new, vitest): use a fake storage (a Map behind getItem/setItem) and fixed `now` and `random`. Tests: first getMe creates and persists a gnome with no look and a name that passes checkName; a second store on the same storage returns the same userId; corrupt JSON in storage ('{not json') gives a fresh valid gnome; stored gnome with an invalid look keeps its name and loses the look; updateGnome saves a look and a name and a new store sees them; updateGnome with name 'a' (too short) rejects with a GnomeStoreError whose code is 'INVALID_ARGUMENT' and changes nothing; updateGnome with a bad look (hatRgb: -1) rejects INVALID_ARGUMENT; a storage whose setItem throws makes updateGnome reject with code 'UNAVAILABLE'; batchGetGnomes returns the gnome for its own id and [] for another id; with storage null getMe returns the same userId twice.

## Contract
`createGnomeStore(): GnomeStore` stays the single place that chooses the store. The stored JSON is exactly a `Gnome` (types.ts) under key 'gnome.profile.v1'; do not wrap it in another object.

## Done when
- `npx tsc --noEmit -p packages/gnome` succeeds.
- `npm test -w packages/gnome -- src/store.test.ts` passes.

## Out of scope
look.ts, resolve.ts, model.ts, types.ts, index.ts and every file outside packages/gnome/src/store.ts and store.test.ts.
~~~~

## Epic 2 issues

### 2A resolve.ts

~~~~text
Epic: 2 Resolve, creator, five games
Depends on: none (epic 1 is already done when this starts)

## Environment
(see the common environment above) Package: /home/user/lawn-gnome-panic/packages/gnome. look.ts and store.ts are finished; use them.

## Goal
Implement the functions games call (loadMyGnome, getMyGnome, resolveLook, prefetchLooks, onLooksChanged) in packages/gnome/src/resolve.ts, with unit tests.

## Read first
- packages/gnome/src/resolve.ts: the stubs and their doc comments (they are the spec).
- packages/gnome/src/look.ts: encodeLook, decodeLook, snapLook, toModelLook, isLookCode.
- packages/gnome/src/store.ts and types.ts: createGnomeStore, GnomeStore, Gnome, MyGnome, PlayerRef, GnomeLook.

## Change
- packages/gnome/src/resolve.ts: implement, keeping every exported name; `loadMyGnome` gains an optional second parameter `store: GnomeStore = createGnomeStore()` (for tests):
  - module variable `mine: MyGnome | null = null`.
  - `loadMyGnome(timeoutMs = 1500, store = createGnomeStore())`: never rejects. (1) If `typeof location !== 'undefined'`, read `new URLSearchParams(location.search).get('gnome')`; if `decodeLook(value)` is a Look, that look wins. (2) Get the stored gnome with `Promise.race([store.getMe(), a timer promise that resolves null after timeoutMs])`; clear the timer when the store answers; catch errors as null. (3) The look is the URL look, else the stored gnome's `look`; if there is none, set `mine = null` and return null. Otherwise `const look = snapLook(thatLook)` and `mine = { name: stored gnome's displayName, or 'Gnome' when the store gave nothing, look: toModelLook(look), code: encodeLook(look) }`. Set the module variable and return it.
  - `getMyGnome()` returns `mine`.
  - `resolveLook(player: PlayerRef): GnomeLook | null`: if `isLookCode(player.character)` and `decodeLook(player.character)` is a Look, return `toModelLook(it)`; otherwise null. (`userId` is ignored for now: add a one-line comment saying the service will use it.)
  - `prefetchLooks(players)`: resolves immediately; `onLooksChanged(cb)`: returns a no-op unsubscribe. Keep their comments and add `void` for unused parameters as needed by TypeScript strict (prefix with _).
- packages/gnome/src/resolve.test.ts (new, vitest): a fake GnomeStore object. Tests: store gnome without a look gives null and getMyGnome() is null; store gnome with DEFAULT_LOOK gives MyGnome with code 'g1.Z1OIBN.A', look.hat 0xd93636, name from the store, and getMyGnome() returns it afterwards; a store whose getMe never resolves gives null after a 20 ms timeout (pass timeoutMs 20); a store whose getMe rejects gives null; `vi.stubGlobal('location', { search: '?gnome=g1.Z1OIBN.A' })` (and `vi.unstubAllGlobals()` after) makes loadMyGnome return that look even when the store has none; an invalid `?gnome=` value is ignored; resolveLook returns the model look for { id: 1, character: 'g1.Z1OIBN.A' } and null for 'gnorman', 'golfer', '' and 'g1.garbage'; prefetchLooks resolves; onLooksChanged returns a function.

## Contract
Signatures as in the stub, plus the optional `store` parameter. Games rely on: `getMyGnome()` is synchronous and never throws; `resolveLook` is synchronous, never throws and never returns a look for a string that is not a valid `g1.` code.

## Done when
- `npx tsc --noEmit -p packages/gnome` succeeds.
- `npm test -w packages/gnome -- src/resolve.test.ts` passes.

## Out of scope
look.ts, store.ts, model.ts, types.ts, index.ts and everything outside packages/gnome/src/resolve.ts and resolve.test.ts.
~~~~

### 2B preview.ts

~~~~text
Epic: 2 Resolve, creator, five games
Depends on: none

## Environment
(see the common environment above) Game: games/gnome-creator (Vite + TypeScript + three 0.187). Other workers write editor.ts and main.ts of the same game.

## Goal
Implement the 3D turntable preview in games/gnome-creator/src/preview.ts.

## Read first
- games/gnome-creator/src/preview.ts: the stub (keep `Preview` and `createPreview` exactly).
- packages/gnome/src/types.ts: `GnomeLook`, `GnomeModel`, `PlayerState`.
- games/gnome-golf/src/main.ts: how that game sets up its WebGLRenderer, scene, lights and resize handling (for style only).

## Change
- games/gnome-creator/src/preview.ts:
  - `import * as THREE from 'three'` and `import { createGnomeModel, GNORMAN_LOOK, type GnomeLook, type GnomeModel, type PlayerState } from '@lawn/gnome'`.
  - `createPreview(canvas)`: `new THREE.WebGLRenderer({ canvas, antialias: true })`, pixel ratio `Math.min(window.devicePixelRatio, 2)`, shadow map on (`renderer.shadowMap.enabled = true`); scene background 0x8fd3f4; a `THREE.HemisphereLight(0xffffff, 0x6a8f4a, 1.1)` and a shadow-casting `THREE.DirectionalLight(0xffffff, 2)` at (3, 5, 4); a green ground disc (CircleGeometry radius 3, rotated -PI/2 on x, colour 0x5fae4e, receiveShadow).
  - Camera: PerspectiveCamera fov 35, at (0, 1.15, 3.4) looking at (0, 0.85, 0).
  - The gnome: `createGnomeModel(GNORMAN_LOOK)` at first, added to the scene. A single `PlayerState` object (position (0,0,0), velocity zero, facing 0, grounded true, jumpsUsed 0, stamina 1, staminaDelay 0, sprinting false, exhausted false). Each frame (requestAnimationFrame loop, dt capped at 0.05 s): `state.facing += dt * 0.6; model.update(state, dt)` (update() sets the model's position and yaw from the state).
  - `setLook(look)`: remove the old model from the scene, dispose its meshes' geometries and materials (traverse; each mesh's geometry.dispose() and every material .dispose()), build `createGnomeModel(look)`, add it, keep the same facing.
  - Layout offset so the gnome is not hidden behind the editor panel (340 px wide on the right in landscape, the bottom half in portrait): on every resize call `renderer.setSize(window.innerWidth, window.innerHeight, false)`, set `camera.aspect`, and `camera.setViewOffset(w, h, x, y, w, h)` with, in landscape (w > h): x = 170, y = 0; in portrait: x = 0, y = Math.round(h * 0.2). Then `camera.updateProjectionMatrix()`.
  - `dispose()`: cancel the animation frame, remove the resize listener, dispose the renderer.

## Contract
```ts
export interface Preview { setLook(look: GnomeLook): void; dispose(): void }
export function createPreview(canvas: HTMLCanvasElement): Preview
```

## Done when
- `npx tsc --noEmit -p games/gnome-creator` succeeds (the other files of the game may still be stubs).

## Out of scope
editor.ts, main.ts, index.html, everything in packages/ and in other games.
~~~~

### 2C editor.ts

~~~~text
Epic: 2 Resolve, creator, five games
Depends on: none

## Environment
(see the common environment above) Game: games/gnome-creator. Other workers write preview.ts and main.ts of the same game. The page has `<div id="ui">` (position fixed, pointer-events none) which main.ts passes to you as `parent`: append your own container to it, never restyle or hide `#ui` itself.

## Goal
Implement the editing panel in games/gnome-creator/src/editor.ts.

## Read first
- games/gnome-creator/src/editor.ts: the stub with `EditorState`, `EditorCallbacks`, `Editor`, `createEditor` (keep them exactly).
- packages/gnome/src/look.ts: `PALETTE` (64 colours) and `DEFAULT_LOOK`; packages/gnome/src/types.ts: `Look`.
- games/sample-3d/src/ui/lobby.ts: how it injects a `<style>` element and builds DOM with a small `h()` helper (for style only).

## Change
- games/gnome-creator/src/editor.ts: plain DOM, no libraries. Inject one `<style id="ge-style">` once. Build a container `div.ge-panel` with `pointer-events: auto`:
  - Landscape (default): fixed, top 0, right 0, bottom 0, width 340px, overflow-y auto, background rgba(20,30,20,0.86), padding 14px, box-sizing border-box, colour #fff, font as `#ui`. Portrait (`@media (max-aspect-ratio: 1/1)`): fixed left 0, right 0, bottom 0, height 52vh, width auto, same background.
  - A heading 'GNOME CREATOR' and a link `<a href="../">BACK TO THE ARCADE</a>` (white text).
  - A text input for the name (`maxLength` 18, autocomplete off) with label NAME. Typing calls onChange.
  - One section per part, each a label and a grid of round swatch `<button type="button">` elements (28x28 px minimum, gap 6px, flex-wrap), `aria-label` the hex colour such as '#d93636', background that colour: HAT (hatRgb), SHIRT (coatRgb), PANTS (pantsRgb), BOOTS (bootsRgb), SKIN (skinRgb, only the first 8 palette entries), BEARD (beardRgb) and HAIR (hairRgb). BEARD and HAIR have a first button labelled 'NONE' (text, not a colour) that removes the key from the look (`delete`), and then all 64 palette swatches. The swatch whose colour equals the current value gets class `sel` (white 3px outline).
  - Three toggle buttons FRECKLES, DRESS, GLASSES (class `on` when true).
  - A button SAVE (calls onSave with the current state), a read-only text input for the share code with a COPY button (`navigator.clipboard.writeText(code)` inside try/catch; on success set the status 'Copied.'), an input and an IMPORT button (calls onImport with the input's value), and a status line `<div>` under them (red-ish #ffb3b3 when bad, light green #c8f7c8 otherwise).
  - Every edit updates the internal state, refreshes the `sel`/`on` classes, and calls `cb.onChange({ name, look })` with a fresh copy (new look object).
  - `setState(s)`: copy s into the internal state, refresh the panel, set the name input; does not call any callback. Start with `{ name: '', look: { ...DEFAULT_LOOK } }`.
  - `setShareCode(code)`, `setStatus(text, bad = false)` as documented in the stub.
  - Stop `pointerdown` propagation on the container (the page may have other listeners).

## Contract
```ts
export interface EditorState { name: string; look: Look }
export interface EditorCallbacks { onChange(s: EditorState): void; onSave(s: EditorState): void; onImport(code: string): void }
export interface Editor { setState(s: EditorState): void; setShareCode(code: string): void; setStatus(text: string, bad?: boolean): void }
export function createEditor(parent: HTMLElement, cb: EditorCallbacks): Editor
```

## Done when
- `npx tsc --noEmit -p games/gnome-creator` succeeds.

## Out of scope
preview.ts, main.ts, index.html, packages/, other games.
~~~~

### 2D creator main.ts

~~~~text
Epic: 2 Resolve, creator, five games
Depends on: none

## Environment
(see the common environment above) Game: games/gnome-creator. Other workers write preview.ts and editor.ts; both already export the final signatures as stubs (read them).

## Goal
Wire the creator together in games/gnome-creator/src/main.ts and document the game.

## Read first
- games/gnome-creator/src/preview.ts and editor.ts: `createPreview(canvas)`, `createEditor(parent, callbacks)` and their interfaces.
- packages/gnome/src/index.ts, types.ts, look.ts, store.ts: `createGnomeStore`, `GnomeStoreError`, `DEFAULT_LOOK`, `snapLook`, `toModelLook`, `encodeLook`, `decodeLook`.
- packages/mp/src/textFilter.ts: `checkName(raw)` returns `{ ok: true; name } | { ok: false; reason }`.
- games/gnome-golf/README.md and CREDITS.md: the format of those files.

## Change
- games/gnome-creator/src/main.ts (replace the `export {}` stub): top-level module code:
  - `const canvas = document.getElementById('game') as HTMLCanvasElement; const ui = document.getElementById('ui') as HTMLElement;`
  - `const store = createGnomeStore();` `const preview = createPreview(canvas);`
  - `let state: EditorState` set after loading. `function show(s: EditorState): void { preview.setLook(toModelLook(snapLook(s.look))); editor.setShareCode(encodeLook(s.look)); }`
  - `const editor = createEditor(ui, { onChange(s) { state = s; editor.setStatus(''); show(s); }, onSave(s) {...}, onImport(code) {...} })`:
    - onSave: `const r = checkName(s.name)`; if not ok: `editor.setStatus(r.reason, true)` and return. Else `await store.updateGnome({ displayName: r.name, look: snapLook(s.look) })` in try/catch: on success `editor.setStatus('Saved. Every game in the arcade now uses this gnome.')`; on a `GnomeStoreError` show `error.message` as bad; on any other error show 'Could not save.' as bad.
    - onImport: `const look = decodeLook(code.trim())`; null: `editor.setStatus('That is not a gnome code.', true)`; else `state = { name: state.name, look }; editor.setState(state); show(state); editor.setStatus('Imported. Press SAVE to keep it.')`.
  - Start-up: `const me = await store.getMe()` (top-level await is fine: tsconfig target ES2022). `let look = me.look ?? DEFAULT_LOOK;` then `const fromUrl = new URLSearchParams(location.search).get('gnome')`; if `decodeLook(fromUrl ?? '')` is a Look, use it and `editor.setStatus('Opened from a link. Press SAVE to keep it.')`. `state = { name: me.displayName, look }; editor.setState(state); show(state);`. If getMe throws, fall back to `{ name: 'Gnome', look: DEFAULT_LOOK }` and `editor.setStatus('Browser storage is not available: you can look around, but SAVE will not work.', true)`.
- games/gnome-creator/README.md (new): what it is (the shared gnome, saved in the browser's localStorage under `gnome.profile.v1`, shown by every game on the same site and sent to other players online as a look code), how to run (`npm run dev -w games/gnome-creator`, port 5186), how a game uses it (a pointer to packages/gnome/README.md), the share code and `?gnome=<code>` links (also work in every game, for dev servers on other ports, which cannot share storage), and not done yet (names are not shared with the games; no hats or other new parts; no accounts: see docs/design/gnome-platform.md).
- games/gnome-creator/CREDITS.md (new): "No external assets: the gnome model is generated in code (packages/gnome/src/model.ts)." in the same style as the other games' CREDITS.md.

## Contract
Uses only the exported APIs listed above. Does not touch localStorage directly.

## Done when
- `npx tsc --noEmit -p games/gnome-creator` succeeds.

## Out of scope
preview.ts, editor.ts, index.html, packages/, other games, tools/.
~~~~

### 2E sample-3d

~~~~text
Epic: 2 Resolve, creator, five games
Depends on: none

## Environment
(see the common environment above) Game: games/sample-3d (Lawn Gnome Panic; three + Vite). Only this game's files. Package `@lawn/gnome` is already a dependency; its API (packages/gnome/src/resolve.ts, model.ts, types.ts) exists with final signatures, though loadMyGnome/getMyGnome/resolveLook may still be stubs while you work.

## Goal
A player who saved a gnome in the Gnome Creator gets a "MY GNOME" character card in the lobby; picking it wears that look, and other online players see it.

## Read first
- games/sample-3d/src/gnome.ts: the model copy to replace.
- games/sample-3d/src/config.ts: `CharacterId`, `CharacterDef`, `CHARACTERS`, `CHARACTER_ORDER` (around lines 338-382), `PuppetState` (around line 1160).
- games/sample-3d/src/net/puppets.ts: `build()` inside `createPuppetSystem`.
- games/sample-3d/src/main.ts: the imports (lines 1-60); `createLobbyUI(uiRoot, lobbyCallbacks)` (around line 284) and `const save = loadSave()` (around line 287); `setPlayerCharacter`; `createNetClient(url, { name: save.name, character: save.character })` and `net.queue(code, save.character, save.name)` (around lines 931-936); `onGameMsg` `case 'me'` (around line 1155); where the 'match' message fills `online.players` (around lines 960-980).
- packages/gnome/README.md: how a game uses the package.

## Change
- games/sample-3d/src/gnome.ts: replace the whole file with `export { createGnomeModel, createGnome } from '@lawn/gnome';` (one comment line saying the model moved to packages/gnome). Do not change its importers.
- games/sample-3d/src/config.ts:
  - `export type CharacterId = 'gnorman' | 'gnancy' | 'mine';`
  - add to `CHARACTERS`: `mine: { id: 'mine', name: 'MY GNOME', rarity: 'CUSTOM-MADE', flavour: 'Made in the Gnome Creator. Same slingshot, better hat.', look: <a copy of the gnorman look object>, startingWeapons: { slingshot: 1 } }`.
  - `CHARACTER_ORDER` becomes mutable: `export const CHARACTER_ORDER: CharacterId[] = ['gnorman', 'gnancy'];` ('mine' is pushed at start-up only when the player has a gnome).
  - `PuppetState` gets an optional field `look?: GnomeLook;` (comment: a custom gnome from @lawn/gnome; wins over `character`).
- games/sample-3d/src/net/puppets.ts, in `build()`: before the existing model choice, if `s.look` is set, `model = createGnomeModel(s.color !== null ? { ...s.look, hat: s.color } : s.look)`; otherwise the existing logic unchanged.
- games/sample-3d/src/main.ts:
  - import `loadMyGnome, getMyGnome, resolveLook, prefetchLooks` from '@lawn/gnome' and `CHARACTER_ORDER` from './config' (add to the existing import).
  - Immediately after the last import statement (before any other code), add: `const mine = await loadMyGnome(); if (mine) { CHARACTERS.mine.look = mine.look; CHARACTERS.mine.name = mine.name.toUpperCase(); CHARACTER_ORDER.push('mine'); }` (top-level await; it must run before `createLobbyUI`, which builds the cards).
  - Right after `const save = loadSave();`: `if (!mine && save.character === 'mine') save.character = 'gnorman';` (the gnome was cleared since the last visit).
  - Add `function wireCharacter(): string { return save.character === 'mine' ? (getMyGnome()?.code ?? 'gnorman') : save.character; }` and use it instead of `save.character` in the `createNetClient(...)` hello and in `net.queue(...)` (only those two places).
  - In `onGameMsg` `case 'me'`, where the PuppetState is built: replace the `character:` expression so that a peer's `'mine'` counts as 'gnorman' (`p.character !== 'mine' && Object.prototype.hasOwnProperty.call(CHARACTERS, p.character) ? ... : 'gnorman'`) and add `look: resolveLook(p) ?? undefined,`.
  - Where the 'match' message fills `online.players`, add `void prefetchLooks(m.players);`.

## Contract
```ts
// from '@lawn/gnome'
loadMyGnome(timeoutMs?: number): Promise<MyGnome | null>;  // MyGnome = { name: string; look: GnomeLook; code: string }
getMyGnome(): MyGnome | null;                               // synchronous
resolveLook(player: { id: number; character: string; userId?: string }): GnomeLook | null;
prefetchLooks(players: { id: number; character: string }[]): Promise<void>;
createGnomeModel(look: GnomeLook): GnomeModel;
```
A player without a saved gnome must see no change at all: no extra card, same wire character, same puppets.

## Done when
- `npx tsc --noEmit -p games/sample-3d` succeeds.
- `grep -rn "createGnomeModel" games/sample-3d/src | head` still shows its importers unchanged and `games/sample-3d/src/gnome.ts` is the one-line re-export.

## Out of scope
games/sample-3d/src/ui/lobby.ts (it builds cards from CHARACTER_ORDER already), save.ts, net/client.ts, server/, every other game, packages/.
~~~~

### 2F gnaft

~~~~text
Epic: 2 Resolve, creator, five games
Depends on: none

## Environment
(see the common environment above) Game: games/gnaft (three + Vite). Only this game's files. `@lawn/gnome` is a dependency; its API exists with final signatures (functions may still be stubs while you work).

## Goal
In Gnaft, a player who saved a gnome in the Gnome Creator plays as it, and their raft mates see it.

## Read first
- games/gnaft/src/gnome.ts: the model copy to replace.
- games/gnaft/src/main.ts: the imports at the top (where to add a top-level `await`).
- games/gnaft/src/player.ts: `createPlayer`, `createGnomeModel(CHARACTERS.gnorman.look)` (around line 57).
- games/gnaft/src/net.ts: `addPuppet` (around line 120: `createGnomeModel({ ...CHARACTERS.gnorman.look, hat: p.color, shirt: shade(p.color, 0.6) })`), where the roster arrives (`roster = ...`), and `createNetClient<CoopMsg>(url, 'gnaft', { name, character: 'gnorman' })` (around line 399).
- packages/gnome/README.md.

## Change
- games/gnaft/src/gnome.ts: replace the whole file with `export { createGnomeModel, createGnome } from '@lawn/gnome';` (plus a one-line comment that the model moved to packages/gnome).
- games/gnaft/src/main.ts: import `loadMyGnome` from '@lawn/gnome' and put `await loadMyGnome();` immediately after the last import (top-level await).
- games/gnaft/src/player.ts: `createGnomeModel(getMyGnome()?.look ?? CHARACTERS.gnorman.look)` (import getMyGnome from '@lawn/gnome').
- games/gnaft/src/net.ts:
  - hello: `character: getMyGnome()?.code ?? 'gnorman'`.
  - `addPuppet(p)`: `const look = resolveLook(p);` and build the model with `look ? { ...look, hat: p.color } : { ...CHARACTERS.gnorman.look, hat: p.color, shirt: shade(p.color, 0.6) }` (the existing expression stays for players without a custom gnome).
  - where the roster is stored (`roster = ...`), add `void prefetchLooks(roster);`.

## Contract
```ts
// from '@lawn/gnome'
loadMyGnome(timeoutMs?: number): Promise<MyGnome | null>;  // MyGnome = { name: string; look: GnomeLook; code: string }
getMyGnome(): MyGnome | null;                               // synchronous
resolveLook(player: { id: number; character: string; userId?: string }): GnomeLook | null; // PlayerInfo fits
prefetchLooks(players: { id: number; character: string }[]): Promise<void>;
```
A player without a saved gnome must see no change at all.

## Done when
- `npx tsc --noEmit -p games/gnaft` succeeds.

## Out of scope
Every other game, packages/, games/gnaft/src/save.ts, coopUi.ts.
~~~~

### 2G gnome-front

~~~~text
Epic: 2 Resolve, creator, five games
Depends on: none

## Environment
(see the common environment above) Game: games/gnome-front (three + Vite). Only this game's files. `@lawn/gnome` is a dependency; its API exists with final signatures (functions may still be stubs while you work).

## Goal
In Gnome Front, a player who saved a gnome in the Gnome Creator plays as it, and online the humans' soldiers wear their players' gnomes (team-coloured hat).

## Read first
- games/gnome-front/src/models/gnome.ts: the model copy to replace.
- games/gnome-front/src/config.ts: `Soldier` (around line 266; `model: GnomeModel`), `TEAM_COLORS` (line 31).
- games/gnome-front/src/soldiers.ts: `createSoldier` (line 14) builds the model with `createGnomeModel(opts.look)`.
- games/gnome-front/src/main.ts: the loop that builds soldiers (around line 55-68; `const build = isPlayer ? CHARACTERS.gnorman.look : ...`).
- games/gnome-front/src/net/state.ts: `applyHumans(game, me)` (line 87) and `netLink` (line 42, `roster: PlayerInfo[]`).
- games/gnome-front/src/net/session.ts: `createNetClient<FrontMsg>(url, 'gnome-front', { name, character: 'gnorman' })` (around line 64), and where `netLink.roster = ...` is set (around line 125).

## Change
- games/gnome-front/src/models/gnome.ts: replace the whole file with `export { createGnomeModel, createGnome } from '@lawn/gnome';` and a one-line comment.
- games/gnome-front/src/config.ts: `Soldier` gets two fields: `botLook: GnomeLook;` (the look this slot has when it is a bot) and `lookKey: string;` (JSON of the custom look currently worn, '' for the bot look). Import `GnomeLook` from './models/config' if not already imported.
- games/gnome-front/src/soldiers.ts: in `createSoldier`, set `botLook: opts.look, lookKey: ''` in the returned object.
- games/gnome-front/src/soldierLook.ts (new; it must not import net/ or soldiers.ts, to avoid an import cycle): `export function setSoldierLook(scene: THREE.Scene, s: Soldier, look: GnomeLook | null): void`. `const next = look ? { ...look, hat: TEAM_COLORS[s.team] } : s.botLook; const key = look ? JSON.stringify(next) : '';` If `key === s.lookKey` return. Else: remove `s.model.object` from the scene, dispose its meshes' geometry and materials (traverse), `s.model = createGnomeModel(next)`, `scene.add(s.model.object)`, `s.model.object.position.copy(s.pos)`, `s.model.setDead(!s.alive)`, `s.lookKey = key`. Imports: `import * as THREE from 'three'`, `createGnomeModel` from './models/gnome', `TEAM_COLORS` and `type Soldier` from './config', `type GnomeLook` from './models/config'.
- games/gnome-front/src/net/state.ts, in `applyHumans`, inside the `for (const s of game.soldiers)` loop: when the soldier has no human (`!h`) call `setSoldierLook(game.scene, s, null)`; for my own slot (`h.playerId === me`) call `setSoldierLook(game.scene, s, getMyGnome()?.look ?? null)`; for another human call `setSoldierLook(game.scene, s, p ? resolveLook(p) : null)` where `const p = netLink.roster.find((r) => r.id === h.playerId)`. Imports: `getMyGnome, resolveLook` from '@lawn/gnome' and `setSoldierLook` from '../soldierLook'.
- games/gnome-front/src/main.ts: import `loadMyGnome, getMyGnome` from '@lawn/gnome'; `await loadMyGnome();` immediately after the last import (top-level await). In the soldier loop: `const build = isPlayer ? (getMyGnome()?.look ?? CHARACTERS.gnorman.look) : ...` (rest unchanged: the hat is still TEAM_COLORS[team]).
- games/gnome-front/src/net/session.ts: hello `character: getMyGnome()?.code ?? 'gnorman'` (import getMyGnome); where `netLink.roster` is set, add `void prefetchLooks(netLink.roster);` (import prefetchLooks).

## Contract
```ts
// from '@lawn/gnome'
loadMyGnome(timeoutMs?: number): Promise<MyGnome | null>;  // MyGnome = { name: string; look: GnomeLook; code: string }
getMyGnome(): MyGnome | null;                               // synchronous
resolveLook(player: { id: number; character: string; userId?: string }): GnomeLook | null; // PlayerInfo fits
prefetchLooks(players: { id: number; character: string }[]): Promise<void>;
```
A player without a saved gnome must see no change at all (every `setSoldierLook(..., null)` is then a no-op because `lookKey` is already '').

## Done when
- `npx tsc --noEmit -p games/gnome-front` succeeds.

## Out of scope
Every other game, packages/, net/host.ts, net/guest.ts, bots.ts.
~~~~

### 2H gnome-golf

~~~~text
Epic: 2 Resolve, creator, five games
Depends on: none

## Environment
(see the common environment above) Game: games/gnome-golf (three + Vite). Only this game's files. `@lawn/gnome` is a dependency; its API exists with final signatures (functions may still be stubs while you work).

## Goal
In Gnome Golf, a player who saved a gnome in the Gnome Creator golfs as it (solo, Gnome Disc, and online), and the other golfers see it.

## Read first
- games/gnome-golf/src/models/gnome.ts: the model copy to replace (this game's copy also exposes `arms` and `rig`; the shared one does too).
- games/gnome-golf/src/config.ts: `GOLFER_LOOK` (line ~494), `Golfer` (line ~570), `lookWithHat(hat)` (line ~629).
- games/gnome-golf/src/online.ts: `const CHARACTER = 'golfer'` (line 86) and its two uses (lines ~566 and ~576); `newGolfer(p: PlayerInfo, joinedHole)` (line ~151); the guest code that builds a Golfer from the host's wire data (`g = { ...w, ball: xyz(w.ball), race: null }`, line ~296); `onServer` and its 'match' and 'joined' cases (lines ~330-350).
- games/gnome-golf/src/party.ts (lines ~283 and ~400), remotes.ts (line ~135) and disc.ts (line ~216): where gnome models are built.

## Change
- games/gnome-golf/src/models/gnome.ts: replace the whole file with `export { createGnomeModel, createGnome } from '@lawn/gnome';` and a one-line comment.
- games/gnome-golf/src/config.ts: `Golfer` gets `look?: GnomeLook;` (comment: a custom gnome from @lawn/gnome). Change `lookWithHat` to `lookWithHat(hat: number, base: GnomeLook = GOLFER_LOOK): GnomeLook { return { ...base, hat }; }`.
- games/gnome-golf/src/online.ts:
  - A module-level `const looks = new Map<number, GnomeLook>();` In `onServer`, at the start of the 'match' case record every player of `m.players`, and in the 'joined' case record `m.player`: `const l = resolveLook(p); if (l) looks.set(p.id, l);` and `void prefetchLooks([...])` for the same players. (Every client, host or guest, gets these messages.)
  - `newGolfer`: add `look: looks.get(p.id)` to the returned object (make sure `looks` is filled before newGolfer is called for that player).
  - The guest code that builds a Golfer from wire data: add `look: looks.get(w.id)` to the object it creates, and in the branch that updates an existing golfer set `g.look = looks.get(w.id) ?? g.look`.
  - Hello and queue: replace the two uses of `CHARACTER` as the character with `getMyGnome()?.code ?? CHARACTER`.
- games/gnome-golf/src/party.ts: line ~400 `createGnomeModel(lookWithHat(g.color, g.look))`; line ~283 `createGnomeModel(getMyGnome()?.look ?? GOLFER_LOOK)` (the partner look stays).
- games/gnome-golf/src/remotes.ts: `createGnomeModel(lookWithHat(g.color, g.look))`.
- games/gnome-golf/src/disc.ts: `createGnomeModel(getMyGnome()?.look ?? GOLFER_LOOK)`.
- games/gnome-golf/src/main.ts: import `loadMyGnome` from '@lawn/gnome'; `await loadMyGnome();` immediately after the last import (top-level await).
- Every file that imports `getMyGnome`, `resolveLook`, `prefetchLooks` imports it from '@lawn/gnome'. Any other place that creates a `Golfer` object literal must still compile (`look` is optional).

## Contract
```ts
// from '@lawn/gnome'
loadMyGnome(timeoutMs?: number): Promise<MyGnome | null>;  // MyGnome = { name: string; look: GnomeLook; code: string }
getMyGnome(): MyGnome | null;                               // synchronous
resolveLook(player: { id: number; character: string; userId?: string }): GnomeLook | null; // PlayerInfo fits
prefetchLooks(players: { id: number; character: string }[]): Promise<void>;
```
A player without a saved gnome must see no change at all (the golf outfit stays).

## Done when
- `npx tsc --noEmit -p games/gnome-golf` succeeds.

## Out of scope
Every other game, packages/, ambient.ts (the ambient gnomes keep their random looks), the wire protocol (`GolferWire`).
~~~~

### 2I gnome-bowling

~~~~text
Epic: 2 Resolve, creator, five games
Depends on: none

## Environment
(see the common environment above) Game: games/gnome-bowling (three + Vite, vitest tests exist). Only this game's files. `@lawn/gnome` is a dependency; its API exists with final signatures (functions may still be stubs while you work).

## Goal
In Gnome Bowling, a player who saved a gnome in the Gnome Creator bowls as it in seat 1 (local and online), and online opponents see it.

## Read first
- games/gnome-bowling/src/models/gnome.ts: the model copy to replace (it is the superset the shared model came from; `bowlCut` is supported by the shared one).
- games/gnome-bowling/src/config.ts: `Player` (line ~197), `LOOKS`.
- games/gnome-bowling/src/game.ts: `makePlayer(name, look, color, local, netId, npc)` (line ~58).
- games/gnome-bowling/src/bowler.ts: `buildEntry` (line ~156: `createGnomeModel({ ...LOOKS[p.look].look, hat: p.color })`).
- games/gnome-bowling/src/menu.ts: where local players are made from seats (`makePlayer(r && r.ok ? r.name : s.name, s.look, SEAT_COLORS[i])`, line ~368).
- games/gnome-bowling/src/net.ts: `getClient(name, look)` (line ~64: `createNetClient(serverUrl(), 'gnome-bowling', { name, character: look })`), the 'match' case (line ~111: `makePlayer(p.name, isLookId(p.character) ? p.character : 'gnorman', p.color, p.id === m.you, p.id)`), and `start(code, name, look)` (line ~147) with its `client.queue(...)` call.
- games/gnome-bowling/src/lane.ts line ~287 (crowd gnomes: leave them alone).

## Change
- games/gnome-bowling/src/models/gnome.ts: replace the whole file with `export { createGnomeModel, createGnome } from '@lawn/gnome';` and a one-line comment.
- games/gnome-bowling/src/config.ts: `Player` gets `customLook?: GnomeLook;` (comment: a custom gnome from @lawn/gnome; wins over `look`). `GnomeLook` comes from './models/config' (already imported there or add it).
- games/gnome-bowling/src/game.ts: `makePlayer` gets a last optional parameter `customLook?: GnomeLook` and puts it on the returned Player only when defined (do not add an `undefined` key: tests compare players).
- games/gnome-bowling/src/bowler.ts, `buildEntry`: `createGnomeModel({ ...(p.customLook ?? LOOKS[p.look].look), hat: p.color })`.
- games/gnome-bowling/src/menu.ts: where the local players are made from seats, the player for seat index 0 gets `getMyGnome()?.look` as `customLook` (the other seats and NPCs none). Import `getMyGnome` from '@lawn/gnome'.
- games/gnome-bowling/src/net.ts:
  - the character sent in hello and queue is `getMyGnome()?.code ?? look`.
  - in the 'match' case: build each player with the extra argument `resolveLook(p) ?? undefined`, and call `void prefetchLooks(m.players)` first. (For the local player, `resolveLook(p)` decodes the code that was sent, so it matches what others see.)
- games/gnome-bowling/src/main.ts: import `loadMyGnome` from '@lawn/gnome'; `await loadMyGnome();` immediately after the last import (top-level await).

## Contract
```ts
// from '@lawn/gnome'
loadMyGnome(timeoutMs?: number): Promise<MyGnome | null>;  // MyGnome = { name: string; look: GnomeLook; code: string }
getMyGnome(): MyGnome | null;                               // synchronous
resolveLook(player: { id: number; character: string; userId?: string }): GnomeLook | null; // PlayerInfo fits
prefetchLooks(players: { id: number; character: string }[]): Promise<void>;
```
A player without a saved gnome must see no change at all, and the existing bowling tests must still pass.

## Done when
- `npx tsc --noEmit -p games/gnome-bowling` succeeds.
- `npm test -w games/gnome-bowling` passes.

## Out of scope
Every other game, packages/, lane.ts, npc.ts, the menu's seat swatches.
~~~~
