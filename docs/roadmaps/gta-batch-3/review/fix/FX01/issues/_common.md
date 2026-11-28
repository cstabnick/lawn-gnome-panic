## Environment (every FX01 issue)

- Working directory: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a06707d9db37dfaae` (a git worktree; use
  absolute paths; Git Bash). If `node` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`. `npm install` is done.
- Game: `games/gnome-theft-auto` (Vite + TypeScript + three.js 0.187). Paths below are under `games/gnome-theft-auto/src/`
  unless they start with `packages/` or `docs/`.
- Other workers edit other files of the same game at the same time. Touch only the files your issue lists. Never commit,
  never start a dev server, never run `vite build` / `npm run build` (the lead does that). Keep LF line endings.
- Check with `npx tsc --noEmit -p games/gnome-theft-auto` (from the worktree root) and `npx vitest run <file>` run inside
  `games/gnome-theft-auto` for the test files named in your issue. Another worker's half-done file may make tsc report
  errors in a file you do not own: ignore those, fix only yours.
- Repo rules: anything flat laid on another surface uses a draw layer (`flatLayer(material, LAYER.<x>)` from
  `@lawn/depth`) or a gap of at least 0.02 m plus polygon offset; two boxes that touch must not share a face. New
  visible objects (props, lamps) go through the prefab library `@lawn/prefabs` (use an existing prefab if one fits).
  Sign and dialogue voice is a keep: never rewrite a joke, only move, enlarge or split it (a split may add a clause).
  The currency is Acorns (🌰), never pence or pounds.

## Shared helpers already in place (the lead wrote them; do not edit these files)

`homes/pieces.ts`:

```ts
export interface TextPlateOpts {
  w?: number; h?: number; bg?: number; fg?: number;
  /** Print the reverse face too (a free-standing plate): true repeats the front text, a string is a second joke. */
  back?: string | boolean;
  /** A wooden backing box behind the plate (a plate on a post, not on a board): its colour, or true for wood. */
  backing?: number | boolean;
}
/** Vertical text plate centred at (x, y, z) facing yaw (0 faces +z). Words now wrap to the plate's aspect and the
 *  canvas is 512 px (1024 over 3 m wide), minimum glyph 18 px at 512: long jokes are legible if the plate is big enough.
 *  Mount 0.03 m in front of a wall. */
export function textPlate(text: string, x: number, y: number, z: number, yaw: number, opts?: TextPlateOpts): THREE.Mesh;
/** Pure layout, for tests: font px, rows, canvas size; `fits` false when even the minimum font does not fit. */
export function layoutPlate(text: string, w: number, h: number, measure: (s: string, px: number) => number): PlateLayout;
export function plateCanvasWidth(w: number, text: string): number; // 256 | 512 | 1024
export const PLATE_MIN_PX = 18;

export interface BoardFace { w: number; h: number; y: number; front: number; back: number }
/** Faces of the board prefabs, prefab-local at scale 1. */
export const BOARD_FACES: Record<string, BoardFace>; // 'garden-sign' 1.9x1.0 @1.4; 'notice-board' 1.4x1.0 @1.5;
                                                     // 'manifesto-board' 6x1.9 @1.45; 'euro-poster-board' 1.2x1.6 @1.4
export interface SignBoardOpts {
  front: string; back?: string; twoSided?: boolean; // back defaults to the front text; twoSided false = wall board
  x: number; z: number; yaw: number;
  board?: string;           // a BOARD_FACES key, default 'garden-sign'
  w?: number; h?: number;   // plate size; a plate larger than the face scales the board up
  scale?: number; bg?: number; fg?: number; tint?: number;
}
export interface SignBoard { piece: HomePiece; plates: THREE.Group }
/** Free-standing board with the plate seated flush on its face, both faces printed. Push `piece` into your
 *  buildPieces list (batched, gets a collider) and `scene.add(plates)` (or add to your signs group). */
export function signBoard(o: SignBoardOpts): SignBoard;
export function buildPieces(scene: THREE.Scene, pieces: readonly HomePiece[], name: string): Box[];
export function prefabBox(id: string): THREE.Box3;
```

`homes/notices.ts`:

```ts
/** A "Read the notices" interact spot: each press toasts the next line ("(k/n) line"). Stand it ~1.2 m in front of the
 *  board on the approach side. Returns a remover. */
export function addNoticeSpot(pos: { x: number; z: number; y?: number }, lines: readonly string[], prompt?: string): () => void;
```

`undersides.ts`:

```ts
/** MeshStandardMaterial with an emissive floor in its own colour (bright by day, low at night; app.ts updates it). */
export function undersideMat(color: number, params?: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial;
```

Legibility rule (D58): a sign's joke must read at 6 m on a 390 px wide phone screen. In practice: the main line's
letters at least ~0.09 m tall; a plate around 1.2-2 m wide for a sentence; at most ~4 rows on a plate. Dense boards keep a
short headline on the plate and put the full lines in `addNoticeSpot`.
