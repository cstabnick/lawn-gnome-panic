Epic: FX01-B
Depends on: none
Findings: G6#2, G6#13 (must, D58: "Plates sit flush on their boards"; "Free-standing boards print both faces")

## Goal
The vineyard and manor signs (Trellisdown) and the Bottom Garden signs (Hedgeworth golf) are proper boards: the text
plate sits flush on the board's face (no plate hovering beside a signpost arm or above a board), both faces are printed,
and the long jokes read at 6 m.

## Read first
- `country/trellisLife.ts` lines ~1-140: `PLATE_OFF = 0.3`, `SIGNS` (9 rows: text, x, z, yaw), `buildTrellisStory`
  (pushes a `signpost` HomePiece per sign, then a `textPlate` 0.3 m in front at ground + 1.35, 1.2 x 0.38).
- `golf/bottomGarden.ts` lines ~90-115: the local `sign(text, x, z, yaw, w = 1.7, h = 0.85)` helper (pushes a
  `garden-sign` HomePiece with `solid: false`, then a plate 0.05 m in front at `ground(px, pz) + 1.4`, `bg: PLATE_BG`),
  and its six call sites (lines ~174, 201, 202, 274, 317, 353).
- The shared helpers (pasted above): `signBoard`, `BOARD_FACES['garden-sign']` (face 1.9 x 1.0 at y 1.4).

## Change
- `country/trellisLife.ts`:
  - Each SIGNS row becomes a `signBoard({ front: s.text, x: s.x, z: s.z, yaw: s.yaw, board: 'garden-sign', w: 1.75,
    h: 0.9, bg: <today's plate colour or the default>, tint: 0x8a6a45 })`: push `.piece` into the pieces list that goes
    to `buildPieces` (replacing the `signpost` piece) and `scene.add(.plates)`. Drop `PLATE_OFF` and the old plate code.
    Keep every text exactly as it is (keep-list: sign voice).
  - The garden-sign's board is 1.9 m wide on two posts 1.8 m apart: check each sign's spot does not now overlap a
    vine row, a path or a building it used to stand beside (a signpost was 0.6 m wide). If one would, move it by the
    least amount (≤ 1.5 m) along its facing direction's perpendicular, and leave a comment.
- `golf/bottomGarden.ts`: rewrite the local `sign()` helper on top of `signBoard({ front: text, x, z, yaw, board:
  'garden-sign', w, h, bg: PLATE_BG })`: push `.piece` with `solid: false` kept (set `piece.solid = false`) into
  `pieces`, and add `.plates` to the `signs` group. The six call sites stay as they are.
- New test `country/trellisSigns.test.ts`: for each SIGNS text, `layoutPlate(text, 1.75, 0.9, (s, px) => s.length * px * 0.62)`
  returns `fits: true` and `px >= PLATE_MIN_PX`. Export `SIGNS` from trellisLife.ts if it is not exported.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your files.
- `npx vitest run src/country src/golf` (inside games/gnome-theft-auto) passes.

## Out of scope
`homes/pieces.ts`, `golf/yard.ts`, `golf/hud.ts`, every other `country/` and `golf/` file, the prefab catalog.
