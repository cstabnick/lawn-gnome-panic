Epic: E17 wave 2 (building the places)
Depends on: wave 1 prefabs (they exist now: check with `getPrefab`)

## Environment
Read `docs/roadmaps/gta-batch-3/E17/_common.md` first (Interiors section, who the Flock are).

## Goal
The big tent at Wader's Rest is a walk-in E05 interior: Mother Saxifrage's grey canvas hall with the shrine to the
Lady, mats laid in a circle, the rota of rules, reed tea, and two Flock members inside.

## Read first
- `games/gnome-theft-auto/src/societies/config.ts` (`SOCIETY_INTERIORS.tent`, `WADERS_REST.tentDoor`, `tentExit`,
  `TENT_ROOM`, `SOCIETY_CAST`)
- `games/gnome-theft-auto/src/interiors/types.ts` lines 1-110
- `games/gnome-theft-auto/src/golf/clubhouse.ts` (a complete defineInterior example)
- `games/gnome-theft-auto/src/societies/flock/tent.ts` (yours: the stub)

## Change
- `games/gnome-theft-auto/src/societies/flock/tent.ts`: at import time `defineInterior({ id: SOCIETY_INTERIORS.tent,
  name: 'The Big Tent', door: WADERS_REST.tentDoor, exit: WADERS_REST.tentExit, size: TENT_ROOM.size, theme: <custom
  InteriorTheme: floor rush-matting tan, walls pale grey canvas, trim weathered wood, ceiling grey, light soft>,
  ambience: 'loch', prompt: 'Enter the Big Tent', build(kit) {...} })`:
  - `kit.room()`, `kit.door(TENT_ROOM.door[0], TENT_ROOM.door[1], TENT_ROOM.doorYaw)` (north wall, facing south).
  - The shrine: `lady-shrine` at `TENT_ROOM.shrine` facing the door (yaw Math.PI); a `one-leg-stone` in front of it.
  - Mats: 8 flat grey mats in a ring of radius 4 round the room centre (use a rug/mat prefab if one exists, grep
    'rug\|mat' in packages/prefabs/src/catalog/furniture.ts, `solid: false`; else plain flat planes lifted 0.03 m with
    `flatLayer`). No chairs anywhere ("no sitting on Tuesdays"; better safe).
  - Along the canvas walls: `reed-tea-urn`, a `rota-board`, two `flock-banner`, a `grey-washing-line` folded? NO: a
    pile of grey robes (any cloth/pile prefab, or skip), `flock-tent`-sized nothing; keep the floor open in the middle.
  - Signs (kit.sign): "THE RULES (as kept) / 1. One leg at every sermon / 2. No sitting on Tuesdays / 3. Pink is for the
    Lady only / 4. Never turn your back on her to eat / 5. A wobble is a thought; a thought is a cup of reed tea";
    "TODAY IS: [ ] TUESDAY [ ] NOT TUESDAY (tick one, carefully)"; "PROPHECIES THIS WEEK: the Even Cut, on the longest
    day. Also rain."
  - Two residents with lines: Sister Plover (`SOCIETY_CAST.plover`) by the rules board, line "Rule six is under
    discussion. It has been under discussion since the spring." and Novice Pipit (`SOCIETY_CAST.pipit`) on a mat, line
    "Which leg is it? Mother says either. I keep picking the wrong either." Looks: grey robes (shirt 0x8d9096), grey
    hats (hat 0x9aa0a8), any beard.
- `games/gnome-theft-auto/src/societies/flock/tent.test.ts` (new): the interior is defined with door
  `WADERS_REST.tentDoor`; building it with `createKit` (see `src/interiors/kit.test.ts` for a `PlacedInterior`) gives a
  door, 2 npcs and no prefab with 'chair', 'stool' or 'bench' in its id.

## Contract
Interior id `SOCIETY_INTERIORS.tent` ('flock-tent').

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/societies/flock/tent.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file.
