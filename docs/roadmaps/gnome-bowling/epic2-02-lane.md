Epic: 2 (systems, all parallel)
Depends on: none

## Environment
Read `docs/roadmaps/gnome-bowling/_common.md` first (environment, rules, world conventions). Other workers edit other files at the same time.

## Goal
`src/lane.ts` builds a cheerful night-time gnome bowling alley around the playable lane, with bowl-cut gnome spectators who react to strikes.

## Read first
- `games/gnome-bowling/src/config.ts`: `LANE`, `PIN_SPOTS`, `LOOKS`, `LOOK_ORDER`, `LOOK_COLORS`, `Ctx`, `System`, `GameState` (phase, result)
- `games/gnome-bowling/src/models/config.ts`: `GnomeLook`, `PlayerState`, `GnomeModel`
- `games/gnome-bowling/src/main.ts`: lights and fog already made (do not add another directional light with shadows)

## Change
- `games/gnome-bowling/src/lane.ts`: `createLane(ctx): System`. Build once, add to `ctx.scene`.

## What to build (all three.js primitives, MeshStandardMaterial)
- **The lane** x in [-LANE.halfWidth, LANE.halfWidth], z from 0 to `LANE.length + LANE.deckPastHeadPin`, top at y = 0: a thin box whose top face is at y = 0 with a `CanvasTexture` of maple boards (39 boards across: alternate `LOOK_COLORS.laneWood` / `laneWoodDark` stripes with faint grain lines; texture `wrapT = RepeatWrapping`, repeat along z), `roughness: 0.25`, `metalness: 0.05` so it looks glossy-oiled. `receiveShadow = true`. Draw the targeting arrows (7 small dark triangles at z ≈ 4.6 in a V, at boards 5,10,15,20,25,30,35) and the dots at z ≈ 2, plus a red foul line at z = 0, as separate thin meshes or on a second small texture.
- **Gutters**: each side a half-pipe (a `CylinderGeometry` half, open-ended, radius LANE.gutterWidth/2, rotated to lie along z) whose bottom is at y = -LANE.gutterDepth, centred at x = ±(LANE.halfWidth + LANE.gutterWidth/2), colour `LOOK_COLORS.gutter`, metal-ish. Narrow capping strips beyond them.
- **Approach**: z from -LANE.approach to 0, same width as lane + gutters, `LOOK_COLORS.approach`, with the approach dots.
- **Pin deck and pit**: the deck is part of the lane; past z = LANE.length + LANE.deckPastHeadPin a dark pit box down to y = -LANE.pitDepth, a black curtain/back wall at the end, and the **pinsetter hood** above the deck: a wide box at y ≈ 1.0-1.6 spanning the lane from z = LANE.length - 0.6 to the back, with a glowing neon-cyan strip on its front edge and the text "GNOME LANES" on a CanvasTexture panel.
- **Neighbouring lanes**: 3 more lanes on each side at x = ±k·LANE.lanePitch (k = 1..3), same build but cheaper (no arrows), with a few static pins standing on their decks (simple white lathe shapes). Divider ball returns between lanes (low rounded box).
- **The alley room**: carpet floor (`LOOK_COLORS.carpet`) at y = -0.02 from z = -12 to 0 behind the approach with a CanvasTexture of colourful 90s confetti shapes; side walls; dark ceiling with rows of small emissive light panels; neon strips (`neonPink`, `neonCyan`, emissive materials) along the walls above the pin decks; a big score monitor box hanging over the approach at z ≈ -0.5, y ≈ 2.6 (just a dark screen shape; the real scoreboard is DOM).
- **Spectators**: 6 gnomes standing/sitting on benches behind the approach (z between -6 and -8, x spread from -3 to 3, facing +z), using `createGnomeModel({ ...LOOKS[id].look, hat: <a random-looking but fixed colour> })` from `./models/gnome` cycling through `LOOK_ORDER`. Keep a PlayerState per gnome (fields in _common.md) with zero velocity and call `model.update(ps, dt)` each frame. Reactions: when `state.phase === 'result'` and `state.result` kind is `'strike'|'double'|'turkey'|'hambone'|'spare'`, they hop (set `ps.position.y` with a small bounce, staggered per gnome) and raise both arms (`model.arms.left/right.rotation.x = -2.6` after update); for `'gutter'|'miss'` they put hands on heads (arms rotation.x = -2.9 with rotation.z ±0.6) and slump; otherwise idle sway.
- Small idle animation of the neon (slow brightness pulse via `emissiveIntensity`).
- Keep it cheap for phones: reuse geometries/materials, under ~400 meshes total, shadows only on the bowler's lane area (`receiveShadow` on lane/approach, `castShadow` only on spectators).

## Contract
`export function createLane(ctx: Ctx): System`. Nothing else exported. The playable lane surface must be exactly y = 0 over x in [-LANE.halfWidth, LANE.halfWidth], z in [0, LANE.length + LANE.deckPastHeadPin] (the ball and pins are drawn on it by another file).

## Done when
- `cd games/gnome-bowling && npx tsc --noEmit -p .` shows no errors in lane.ts
- The scene contains the lane, gutters, pinsetter hood, neighbouring lanes, room and 6 bowl-cut spectators that react in 'result'.

## Out of scope
Pins and the ball on the playable lane (pins.ts), the bowler (bowler.ts), camera, any DOM. Do not edit any other file.
