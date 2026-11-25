Epic: E30-B (Pardonlin content, all parallel)
Depends on: none

## Environment
Repo = the current working directory (a git worktree of lawn-gnome-panic). Git Bash; if `node` is not found:
`export PATH="/c/Program Files/nodejs:$PATH"`. Keep LF line endings. Do not commit. Many workers edit other files of
`games/gnome-theft-auto` at the same time; touch only the files below. World axes: +x east, +z south, metres.

## Goal
Four small Pardonlin activities that pull the player round town, each ending in an achievement (the achievement defs
and rewards are being added to the shared catalog by another worker right now, with exactly these ids):
1. **Queued for Nothing** (`gta-pl-queue`): queue on the Grand Platz until you reach the front.
2. **The Baguette Round** (`gta-pl-baguette-round`): deliver baguettes for Brigitte the baker.
3. **Portrait of a Croissant** (`gta-pl-portrait`): stand still for Odile the painter.
4. **Flâneur** (`gta-pl-flaneur`, target 4): walk into all four districts on foot (`increment` once per new district).

## Read first
- `games/gnome-theft-auto/src/pardonlin/activities.ts`: your file (stub with the final signature; app.ts already
  creates it with `{ scene, toast, unlock, increment, earn }` and calls `update(dt, { x, z, vehicle })` every frame;
  `vehicle` is the VehicleKind string of what the player drives or rides, or null on foot).
- `games/gnome-theft-auto/src/interactables.ts`: `addInteractSpot(s: ExtraSpot)` (returns a remover): the E key /
  touch action button prompt. Read `ExtraSpot`'s fields (x, z, prompt, run, maybe y / radius).
- `games/gnome-theft-auto/src/pardonlin/layout.ts`: `districtAt(x, z)` -> 'old-town' | 'teacup-quays' | 'left-bank' |
  'gardens' | null.

## Change
- `games/gnome-theft-auto/src/pardonlin/activities.ts` (keep the exported names and signatures). Put the pure state
  machines in `games/gnome-theft-auto/src/pardonlin/activityLogic.ts` (new, no three.js, no DOM) and test them.
  - **Queue**: `QUEUE_POINTS`: 9 points at x -1488.2 from z -196 (the tail, index 0) to z -232 (the front), 4.5 m apart.
    An interact spot at the tail, prompt 'Join the queue'. While queuing the player must stay within 1.6 m of the
    current point (else: toast "You have lost your place. Pardon." and the queue resets). Every 7 s the queue moves:
    the current point advances and a toast says a queue line (10 lines, e.g. "The queue shuffles forward. Nobody knows
    why.", "A gnome ahead lets you go first. This is not allowed. You both go back."). Show the current point with a
    small floating marker (a cone or a little arrow, 1.2 m above the ground, bobbing; `MeshBasicMaterial`, no flat
    plane on the ground). At the front: toast "You reach the front. There is nothing at the front. Well queued.",
    `earn(40, 'Queued for Nothing')`, `unlock('gta-pl-queue')`. Repeatable (no reward after the first time: just the
    toast).
  - **Baguette Round**: giver spot at (-1520.5,128.5), prompt 'Talk to Brigitte' (Brigitte Levain, the baker). Start:
    toast "Brigitte: Five baguettes, five doors, before the bread gets ideas. Four minutes." Five drop points, each a
    floating marker (a baguette-coloured cylinder 0.6 m long lying horizontally and spinning, 1.5 m up) and reached
    within 5 m in any vehicle or on foot: Café Pardon (-1525,139), the Bean Tower kiosk (-1520,-320), the Opera Hall
    forecourt (-1688,-96), the Beetle Market (-1733,128), Basin Quay (-1500,1022). Any order. Each delivery: a toast
    from that place ("Café Pardon: We ordered this yesterday. Perfect."). 240 s limit (toast at 60 s left, failure toast
    "Brigitte: The bread has gone stale with disappointment." and reset). Success: `earn(150, 'Baguette Round')` (+50 if
    `vehicle === 'baguette-trike'` the whole time... simpler: +50 if the last delivery was made on the 'baguette-trike'),
    `unlock('gta-pl-baguette-round')`. Repeatable with acorns only.
  - **Portrait**: spot at (-1540,-270), prompt 'Sit for a portrait' (Odile Easelby). On foot only. The player must stay
    within 1.0 m of the spot for 20 s; moving away resets with "Odile: You moved. I must begin again. With a sigh."
    Progress toasts at 5 s, 10 s, 15 s ("She is doing the nose. She has decided you have a croissant for a nose.").
    Done: "Odile shows you the canvas. It is a croissant. 'It is you,' she says. It is a croissant.",
    `earn(30, 'Portrait')`, `unlock('gta-pl-portrait')`.
  - **Flâneur**: every update with `vehicle === null`, `districtAt(x, z)`; a district not yet in the saved set ->
    add it, save, `increment('gta-pl-flaneur', 1)`, toast "Flâneur: <district name> (n/4)" (names from `DISTRICTS`).
    Saved set in localStorage key `gta-pl-flaneur-v1` (JSON array; wrap every read/write in try/catch).
  - Activities only run their checks when the player is within 1500 m of (-1600, 100) (cheap when far).
  - Online: single-player per browser (no networking).
- `games/gnome-theft-auto/src/pardonlin/activityLogic.test.ts` (new): the queue advances, resets when the player walks
  off and completes at the front; the round completes after five deliveries in any order and fails on time; the
  portrait completes after 20 s still and resets on a move; the flâneur set grows once per district.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/pardonlin/activityLogic.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your files.

## Out of scope
`app.ts`, `interactables.ts`, the achievements catalog, every other file.
