Epic: FX01-B (signs, particles, water, undersides: the sweep)
Depends on: none (foundation in place)
Findings: G2#11, G2#12 (must, D58)

## Goal
Pardonlin's sign text is legible: each plate gets a canvas cell sized to its width (no more fixed 256 px cells), the
free-standing poster boards and menu chalkboards print both faces, and Radio Adagio's own name reads from the forecourt.

## Read first
- `pardonlin/town.ts`: `buildSignText`, `plate()`, `paint()`, `wrap()`, constants `ATLAS = 2048`, `CELL = 256`.
- `eurokit/signs.ts`: `SIGN_FACE` (face sizes and centres of 'euro-chalkboard-sign', 'euro-poster-board', 'euro-street-sign').
- `packages/prefabs/src/catalog/gta-euro-street-b.ts`: the parts of `euro-poster-board` (paper face 1.2 x 1.6 x 0.02 at
  y 1.4, z 0.06; the frame runs z 0.01..0.11) and `euro-chalkboard-sign` (an A-frame: front board tilted, back board
  `{ s: 'box', d: [0.56, 0.78, 0.03], at: [0, 0.62, -0.04], rot: [12, 0, 0] }`).
- `pardonlin/districts/leftBank.ts` lines ~266-275 (the Opera Hall's signs).
- `homes/pieces.ts`: `plateCanvasWidth(w, text)` (import it; do not edit pieces.ts).

## Change
- `pardonlin/town.ts`:
  - Replace the fixed square cells with shelf packing: each sign's cell width `pw = plateCanvasWidth(p.w, s.text)`
    (256, 512 or 1024 px), height `ph = Math.round(pw * p.h / p.w)`; if `ph > 1024` scale both down so `ph = 1024`.
    Pack cells left to right in rows ("shelves") on a 2048 x 2048 atlas with a 2 px gutter; a shelf's height is its
    tallest cell; open a new atlas when the next shelf does not fit. Keep one merged mesh per atlas per culling cell, as
    now (same material setup: `flatLayer(new THREE.MeshStandardMaterial({ map, roughness: 0.85 }), 'decal')`,
    `registerCull(mesh, 'detail', { owned: true })`). Set `tex.generateMipmaps = true` (default) and keep anisotropy 4.
  - `paint()`: the font search's minimum becomes `Math.max(8, Math.round(18 * pw / 512))` (was 8), and the starting size
    `Math.floor(ph * 0.42)` stays.
  - Both faces: for `poster` and `menu` signs add a second plane that uses the **same atlas cell** (same UVs), rotated
    by π about y, on the back of the prefab: poster back at local `z = 0.0` (behind the frame's back at 0.01, so it never
    shares a plane), same `cy` as the front; menu back on the A-frame's back board: centre `(0, 0.62, -0.04 - 0.035)`,
    tilted to match the back board (rotate about x by -12° in the sign's local frame after the π yaw turn; check visually
    by reasoning about the matrix: the back plate must lie parallel to the back board, 0.02 m off its outer face).
    Street signs stay one-sided (they hang on poles over pavements; out of scope).
- `pardonlin/districts/leftBank.ts` (only the Opera Hall block, lines ~266-275):
  - The door banner `'RADIO ADAGIO 96.1'` at y 3.9: make it `w: 4.6, h: 0.95` (same y).
  - The roof banner: shorten to `'RADIO ADAGIO 96.1'` (a high banner carries a name only), `y: 9.8, w: 8, h: 1.5`.
  - The long joke moves to eye level: a new `sign('poster', 'RADIO ADAGIO 96.1\nNow broadcasting:\nsilence\n(scheduled)', ...)`
    in the forecourt beside the door, facing the approach (yaw `-PI / 2`, like the other two posters at x -1693). Pick a
    spot between z -100 and -112 at x about -1693.5 that does not overlap the props listed in that block (music stands
    at (-1691.5,-108.5), (-1689.5,-115.5); cello (-1689.2,-110.6); lamp post (-1692.5,-118)): keep 1.2 m clear of each.

## Contract
`buildSignText(signs: readonly PlanSign[]): THREE.Group` keeps its signature and group name `pardonlin-sign-text`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your files.
- `npx vitest run src/pardonlin` (inside games/gnome-theft-auto) passes.
- By reading the code: a 9 m banner gets a 1024 px cell, a 1.2 m poster a 512 px cell, and every poster and menu sign
  has a back plane.

## Out of scope
Every other file in `pardonlin/` (another epic owns the districts; edit only the Opera Hall lines named above),
`homes/pieces.ts`, `eurokit/`, the prefab catalog.
