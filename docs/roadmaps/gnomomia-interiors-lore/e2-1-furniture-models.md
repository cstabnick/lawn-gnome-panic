Epic: 2 Content and polish
Depends on: none

## Environment
- Worktree root: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\gnomomia-interiors-lore`; game: `games/gnomes-of-gnomomia` (three.js 0.187, TypeScript). Work only inside the worktree.
- Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`.
- Other workers edit other files of this game at the same time (lore packs, zone files, `src/ui/book.ts`, `src/ui/panels.ts`). Do not start a dev server, do not run `vite build`/`npm run build`, no git commands.

## Goal
Building interiors get real low-poly furniture instead of placeholder boxes, and the four readable object models (bookshelf, lectern, scroll, plaque) get proper models.

## Read first
- `games/gnomes-of-gnomomia/src/interiors.ts`: the whole file. `buildFurniture` is a stub (one box per kind). `buildInteriorRoom` and `updateInteriorCutaway` already work.
- `games/gnomes-of-gnomomia/src/data/interiors.ts`: `FURNITURE_RADIUS` (the collision radius of each kind: your model's footprint must roughly fit it) and the templates (to see where kinds stand: e.g. paintings and bookshelves sit against walls).
- `games/gnomes-of-gnomomia/src/objects.ts`: `BUILDERS`, `part()`, `box()`, `cyl()`; the four entries marked `// STUB models for readables`.

## Change
1. `src/interiors.ts`: replace the body of `buildFurniture(kind, c, trim)` with a model per `FurnitureKind`:
   `bed bedroll table chair stool bench hearth barrel crate sack rug pot lamp counter altar pew workbench anvil loom cauldron plant painting wardrobe cupboard millstone bookshelf lectern`.
   - Built from three.js primitives (BoxGeometry, CylinderGeometry, ConeGeometry, SphereGeometry, TorusGeometry), flat-shaded MeshLambertMaterial, 2-8 meshes each, low poly (8-12 radial segments).
   - Local frame: origin on the floor at the piece's centre, y up, the front faces +z. Wall pieces (`painting`, `bookshelf`, `wardrobe`, `cupboard`, `hearth`, `counter`) have their back at about local z = −(depth/2) and stand flush; `painting` is a framed canvas at y ≈ 1.5 with its back at local z ≈ −0.15.
   - Scale: a gnome is about 1.1 m tall. A table top is at 0.6 m, a chair seat at 0.35 m, a bed is 1.0 × 1.9 m, a hearth 1.6 m wide and 1.4 m tall with a chimney breast up to 2.6 m (the wall height), a wardrobe 1.8 m.
   - Colour: `c` (the placement's colour) when given, else a sensible default per kind; wood parts use `trim` (the room's trim colour). Beds get a blanket colour, rugs a woven colour, plants green leaves in a clay pot, paintings a coloured canvas (a little landscape: two or three flat boxes is enough).
   - `hearth`: stone surround, dark opening, an orange flame cone using `MeshBasicMaterial({ color: 0xff8a1e })`, and ONE `THREE.PointLight(0xff9a3c, 1.5, 6, 1)` at the flame. `lamp`: a small post with a glowing sphere (`MeshBasicMaterial`, no light). No other lights.
   - Every mesh: `castShadow = true; receiveShadow = true`, except the rug (receive only) and basic-material glow meshes.
   - IMPORTANT: world.ts's `clearWorld` disposes the geometry and material of every mesh in the room when the player leaves, so never share a material or geometry between meshes. Keep the file's pattern: `mat(color).clone()` for each mesh (or `new THREE.MeshLambertMaterial(...)` each time). Add small helpers next to `box()` (e.g. `cyl(parent, rt, rb, h, color, x, y, z, seg?)`, `sphere(...)`, `cone(...)`) that follow the same rule.
   - `bookshelf` and `lectern` normally become objects (built by objects.ts), but a template's `add` can still route them here only if content.ts misses them; give them a simple model too.
2. `src/objects.ts`: replace the four stub `BUILDERS` entries:
   - `bookshelf` (default colour 0x6b4a2b): 1.2 wide × 2.0 tall × 0.45 deep frame with its back at local z = −0.22, 4 shelves, each with 5-8 book spines of varied colours and heights (small boxes), front faces +z.
   - `lectern`: a post on a foot, a slanted top facing +z, an open book (two cream pages) on it.
   - `scroll`: a small stand or a rock with a half-unrolled parchment (a cream box with two cylinders at its ends).
   - `plaque`: a stone base with an upright slab, a darker inset panel on its front (+z) face.
   Use the existing `part()`, `box()` and `cyl()` helpers of objects.ts (objects.ts shares materials on purpose; its own disposal only frees geometry, which is fine there).

## Contract (keep exactly)
- `export function buildFurniture(kind: FurnitureKind, c: number | undefined, trim: number): THREE.Group`
- `export function buildInteriorRoom(parent: THREE.Object3D, def: ZoneDef): void` and `export function updateInteriorCutaway(camera: THREE.Camera): void` keep their signatures and behaviour (you may tidy the walls but keep the cutaway working: a wall hides when the camera is outside it).
- `export const WALL_HEIGHT = 2.6`.
- `BUILDERS` keeps the type `Record<WorldObjectDef['model'], { color: number; build: Builder }>`.

## Done when
- `cd games/gnomes-of-gnomomia && npx tsc --noEmit` reports no error in `src/interiors.ts` or `src/objects.ts`.
- Every `FurnitureKind` has its own branch (use a `switch` with a `default` that throws nothing: a 0.6 m box).

## Out of scope
`src/world.ts`, `src/content.ts`, `src/config.ts`, `src/data/**`, `src/ui/**`.
